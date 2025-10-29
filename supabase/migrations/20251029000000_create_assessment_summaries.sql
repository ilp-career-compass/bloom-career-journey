-- Migration: Assessment AI Summary Approval Workflow
-- This migration adds support for AI-generated summaries with teacher approval workflow

-- Create enums for summary approval status and type
DO $$ BEGIN
  CREATE TYPE summary_approval_status AS ENUM (
    'pending_approval',
    'approved', 
    'rejected',
    'revision_requested'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE summary_type AS ENUM (
    'ai_generated',
    'teacher_edited',
    'student_edited'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create assessment_summaries table
CREATE TABLE IF NOT EXISTS assessment_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_response_id UUID NOT NULL REFERENCES assessment_responses(id) ON DELETE CASCADE,
    
    -- Summary content stored as JSONB with 3 questions
    -- Structure: { "question1": "...", "question2": "...", "question3": "..." }
    ai_summary JSONB NOT NULL,
    student_edited_summary JSONB, -- Student's edits after approval
    teacher_edited_summary JSONB, -- Teacher's edits before approval
    
    -- Metadata
    summary_type summary_type NOT NULL DEFAULT 'ai_generated',
    approval_status summary_approval_status NOT NULL DEFAULT 'pending_approval',
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Approval tracking
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_by UUID REFERENCES users(id) ON DELETE SET NULL,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Timestamps
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: one summary per assessment response
    CONSTRAINT unique_assessment_summary UNIQUE (assessment_response_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessment_summaries_response_id 
    ON assessment_summaries(assessment_response_id);

CREATE INDEX IF NOT EXISTS idx_assessment_summaries_approval_status 
    ON assessment_summaries(approval_status);

CREATE INDEX IF NOT EXISTS idx_assessment_summaries_approved_at 
    ON assessment_summaries(approved_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessment_summaries_created_at 
    ON assessment_summaries(created_at DESC);

-- Enable Row Level Security
ALTER TABLE assessment_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Students can view their own approved summaries
CREATE POLICY "students_view_approved_summaries" 
    ON assessment_summaries
    FOR SELECT
    TO authenticated
    USING (
        approval_status = 'approved' 
        AND assessment_response_id IN (
            SELECT ar.id 
            FROM assessment_responses ar
            JOIN students s ON s.id = ar.student_id
            WHERE s.user_id = auth.uid()
        )
    );

-- RLS Policy: Students can update their own approved summaries (edit feature)
CREATE POLICY "students_update_approved_summaries" 
    ON assessment_summaries
    FOR UPDATE
    TO authenticated
    USING (
        approval_status = 'approved' 
        AND assessment_response_id IN (
            SELECT ar.id 
            FROM assessment_responses ar
            JOIN students s ON s.id = ar.student_id
            WHERE s.user_id = auth.uid()
        )
    )
    WITH CHECK (
        approval_status = 'approved' 
        AND assessment_response_id IN (
            SELECT ar.id 
            FROM assessment_responses ar
            JOIN students s ON s.id = ar.student_id
            WHERE s.user_id = auth.uid()
        )
    );

-- RLS Policy: Teachers can view all summaries for their students
CREATE POLICY "teachers_view_student_summaries" 
    ON assessment_summaries
    FOR SELECT
    TO authenticated
    USING (
        assessment_response_id IN (
            SELECT ar.id 
            FROM assessment_responses ar
            JOIN students s ON s.id = ar.student_id
            JOIN teachers t ON t.id = s.teacher_id
            WHERE t.user_id = auth.uid()
        )
    );

-- RLS Policy: Teachers can update summaries for their students (approve, reject, edit)
CREATE POLICY "teachers_update_student_summaries" 
    ON assessment_summaries
    FOR UPDATE
    TO authenticated
    USING (
        assessment_response_id IN (
            SELECT ar.id 
            FROM assessment_responses ar
            JOIN students s ON s.id = ar.student_id
            JOIN teachers t ON t.id = s.teacher_id
            WHERE t.user_id = auth.uid()
        )
    )
    WITH CHECK (
        assessment_response_id IN (
            SELECT ar.id 
            FROM assessment_responses ar
            JOIN students s ON s.id = ar.student_id
            JOIN teachers t ON t.id = s.teacher_id
            WHERE t.user_id = auth.uid()
        )
    );

-- RLS Policy: System can insert summaries (for AI generation)
CREATE POLICY "system_insert_summaries" 
    ON assessment_summaries
    FOR INSERT
    TO authenticated
    WITH CHECK (
        assessment_response_id IN (
            SELECT ar.id 
            FROM assessment_responses ar
            JOIN students s ON s.id = ar.student_id
            WHERE s.user_id = auth.uid()
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_assessment_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_assessment_summaries_updated_at
    BEFORE UPDATE ON assessment_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_assessment_summaries_updated_at();

-- Add comment for documentation
COMMENT ON TABLE assessment_summaries IS 'Stores AI-generated summaries for assessments with teacher approval workflow';
COMMENT ON COLUMN assessment_summaries.ai_summary IS 'Original AI-generated summary with 3 reflection questions';
COMMENT ON COLUMN assessment_summaries.student_edited_summary IS 'Student edits to approved summary';
COMMENT ON COLUMN assessment_summaries.teacher_edited_summary IS 'Teacher edits before approval';

