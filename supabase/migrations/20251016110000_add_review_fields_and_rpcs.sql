-- Migration: Add review tracking for assessment_responses and RPCs

-- Ensure assessment_type exists (idempotent)
DO $$ BEGIN
  CREATE TYPE assessment_type AS ENUM ('inspiration', 'dreams', 'school_learning', 'role_models', 'hobbies', 'personality', 'career_aptitude');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enums for review status and follow-up status
DO $$ BEGIN
  CREATE TYPE review_status AS ENUM ('unreviewed', 'in_review', 'reviewed', 'needs_revision', 'flagged');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE follow_up_status AS ENUM ('pending', 'contacted', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add review-related columns to assessment_responses
ALTER TABLE assessment_responses
  ADD COLUMN IF NOT EXISTS review_status review_status DEFAULT 'unreviewed' NOT NULL,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_notes TEXT,
  ADD COLUMN IF NOT EXISTS review_rating SMALLINT CHECK (review_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS needs_follow_up BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS follow_up_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS follow_up_status follow_up_status;

-- Indexes for common filters
CREATE INDEX IF NOT EXISTS idx_assessment_responses_review_status ON assessment_responses (review_status);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_reviewed_at ON assessment_responses (reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_follow_up_due_at ON assessment_responses (follow_up_due_at);

-- Secure RPC to update review fields with teacher ownership checks
CREATE OR REPLACE FUNCTION update_assessment_review(
  teacher_user_id UUID,
  assessment_response_id UUID,
  review JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_allowed BOOLEAN;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Ensure the teacher owns the student linked to this assessment response
  SELECT EXISTS (
    SELECT 1
    FROM assessment_responses ar
    JOIN students s ON s.id = ar.student_id
    JOIN teachers t ON t.id = s.teacher_id
    WHERE ar.id = assessment_response_id
      AND t.user_id = teacher_user_id
  ) INTO v_allowed;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Perform the update; only allow whitelisted fields
  UPDATE assessment_responses SET
    review_status = COALESCE((review->>'review_status')::review_status, review_status),
    review_notes = COALESCE(review->>'review_notes', review_notes),
    review_rating = COALESCE(NULLIF((review->>'review_rating')::INT, NULL), review_rating),
    needs_follow_up = COALESCE((review->>'needs_follow_up')::BOOLEAN, needs_follow_up),
    follow_up_due_at = COALESCE((review->>'follow_up_due_at')::TIMESTAMPTZ, follow_up_due_at),
    follow_up_status = COALESCE((review->>'follow_up_status')::follow_up_status, follow_up_status),
    reviewed_by = CASE WHEN (review ? 'review_status') THEN teacher_user_id ELSE reviewed_by END,
    reviewed_at = CASE WHEN (review ? 'review_status') THEN v_now ELSE reviewed_at END,
    updated_at = v_now
  WHERE id = assessment_response_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_assessment_review(UUID, UUID, JSONB) TO authenticated;

-- Extend get_student_assessment_responses to include review fields
CREATE OR REPLACE FUNCTION get_student_assessment_responses(
    teacher_user_id UUID,
    assessment_type_filter assessment_type DEFAULT NULL
)
RETURNS TABLE (
    assessment_response_id UUID,
    student_name TEXT,
    student_class TEXT,
    assessment_title TEXT,
    responses JSONB,
    completed_at TIMESTAMPTZ,
    review_status review_status,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    review_rating SMALLINT,
    needs_follow_up BOOLEAN,
    follow_up_due_at TIMESTAMPTZ,
    follow_up_status follow_up_status
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id AS assessment_response_id,
    u.full_name AS student_name,
    c.name AS student_class,
    ar.assessment_title,
    ar.responses,
    ar.completed_at,
    ar.review_status,
    ar.reviewed_by,
    ar.reviewed_at,
    ar.review_notes,
    ar.review_rating,
    ar.needs_follow_up,
    ar.follow_up_due_at,
    ar.follow_up_status
  FROM assessment_responses ar
  JOIN students s ON ar.student_id = s.id
  JOIN users u ON s.user_id = u.id
  JOIN classes c ON s.class_id = c.id
  JOIN teachers t ON s.teacher_id = t.id
  WHERE t.user_id = teacher_user_id
    AND (assessment_type_filter IS NULL OR ar.assessment_type = assessment_type_filter)
  ORDER BY ar.completed_at DESC NULLS LAST, ar.updated_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_student_assessment_responses(UUID, assessment_type) TO authenticated;


