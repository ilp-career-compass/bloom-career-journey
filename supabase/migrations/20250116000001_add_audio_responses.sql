-- Migration: Add Audio Responses Support
-- This migration adds support for audio responses in assessments

-- Add audio_responses column to assessment_responses table
ALTER TABLE assessment_responses 
ADD COLUMN IF NOT EXISTS audio_responses JSONB;

-- Add index for audio_responses queries
CREATE INDEX IF NOT EXISTS idx_assessment_responses_audio_responses 
ON assessment_responses USING GIN (audio_responses);

-- Create audio_files table for storing audio metadata
CREATE TABLE IF NOT EXISTS audio_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessment_responses(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL, -- e.g., "video1_question1"
    file_path TEXT NOT NULL, -- Supabase Storage path
    file_url TEXT NOT NULL, -- Public URL
    file_size BIGINT NOT NULL,
    duration_ms INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    language_detected TEXT, -- e.g., "en-IN", "hi-IN"
    transcription TEXT,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    transcription_metadata JSONB, -- Word timestamps, alternatives, etc.
    upload_status TEXT DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploading', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for audio_files table
CREATE INDEX IF NOT EXISTS idx_audio_files_student_id ON audio_files(student_id);
CREATE INDEX IF NOT EXISTS idx_audio_files_assessment_id ON audio_files(assessment_id);
CREATE INDEX IF NOT EXISTS idx_audio_files_question_id ON audio_files(question_id);
CREATE INDEX IF NOT EXISTS idx_audio_files_upload_status ON audio_files(upload_status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for audio_files updated_at
CREATE TRIGGER update_audio_files_updated_at 
    BEFORE UPDATE ON audio_files 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to get audio response statistics
CREATE OR REPLACE FUNCTION get_audio_response_stats(student_uuid UUID)
RETURNS TABLE (
    total_audio_responses BIGINT,
    total_duration_ms BIGINT,
    avg_confidence_score DECIMAL(3,2),
    languages_used TEXT[],
    upload_success_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_audio_responses,
        COALESCE(SUM(af.duration_ms), 0) as total_duration_ms,
        COALESCE(AVG(af.confidence_score), 0) as avg_confidence_score,
        ARRAY_AGG(DISTINCT af.language_detected) FILTER (WHERE af.language_detected IS NOT NULL) as languages_used,
        COALESCE(
            (COUNT(*) FILTER (WHERE af.upload_status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
            0
        ) as upload_success_rate
    FROM audio_files af
    WHERE af.student_id = student_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create function to get assessment audio summary
CREATE OR REPLACE FUNCTION get_assessment_audio_summary(assessment_uuid UUID)
RETURNS TABLE (
    question_id TEXT,
    has_audio BOOLEAN,
    audio_duration_ms INTEGER,
    transcription TEXT,
    confidence_score DECIMAL(3,2),
    language_detected TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        af.question_id,
        TRUE as has_audio,
        af.duration_ms as audio_duration_ms,
        af.transcription,
        af.confidence_score,
        af.language_detected
    FROM audio_files af
    WHERE af.assessment_id = assessment_uuid
    ORDER BY af.question_id;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for audio_files table
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;

-- Policy for students to access their own audio files
CREATE POLICY "Students can access their own audio files" ON audio_files
    FOR ALL USING (
        student_id IN (
            SELECT id FROM students 
            WHERE user_id = auth.uid()
        )
    );

-- Policy for teachers to access their students' audio files
CREATE POLICY "Teachers can access their students' audio files" ON audio_files
    FOR ALL USING (
        student_id IN (
            SELECT s.id FROM students s
            JOIN classes c ON s.class_id = c.id
            WHERE c.teacher_id = auth.uid()
        )
    );

-- Add comment explaining the audio_responses JSONB structure
COMMENT ON COLUMN assessment_responses.audio_responses IS 'JSONB structure: {
  "video1": {
    "question1": {
      "text": "transcribed text",
      "audio_url": "https://storage.../audio1.webm",
      "audio_duration": 45000,
      "file_size": 1024000,
      "language_detected": "en-IN",
      "confidence_score": 0.95,
      "transcription_metadata": {
        "words": [...],
        "timestamps": [...],
        "alternatives": [...]
      }
    }
  }
}';

-- Add comment explaining audio_files table
COMMENT ON TABLE audio_files IS 'Stores metadata for audio files uploaded to Supabase Storage';
COMMENT ON COLUMN audio_files.question_id IS 'Identifier for the question, e.g., "video1_question1"';
COMMENT ON COLUMN audio_files.file_path IS 'Path in Supabase Storage bucket';
COMMENT ON COLUMN audio_files.file_url IS 'Public URL for the audio file';
COMMENT ON COLUMN audio_files.transcription_metadata IS 'Additional transcription data like word timestamps and alternatives';
