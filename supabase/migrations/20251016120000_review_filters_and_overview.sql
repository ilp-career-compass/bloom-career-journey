-- Migration: Review filters and overview RPCs

-- Defensive: ensure assessment_type exists (no-op if already present)
DO $$ BEGIN
  CREATE TYPE assessment_type AS ENUM ('inspiration', 'dreams', 'school_learning', 'role_models', 'hobbies', 'personality', 'career_aptitude');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add reviewer_name to get_student_assessment_responses
-- Drop the old version first since we change the OUT (return) row type
DROP FUNCTION IF EXISTS get_student_assessment_responses(UUID, assessment_type);

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
    follow_up_status follow_up_status,
    reviewer_name TEXT
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
    ar.follow_up_status,
    ur.full_name AS reviewer_name
  FROM assessment_responses ar
  JOIN students s ON ar.student_id = s.id
  JOIN users u ON s.user_id = u.id
  JOIN classes c ON s.class_id = c.id
  JOIN teachers t ON s.teacher_id = t.id
  LEFT JOIN users ur ON ur.id = ar.reviewed_by
  WHERE t.user_id = teacher_user_id
    AND (assessment_type_filter IS NULL OR ar.assessment_type = assessment_type_filter)
  ORDER BY 
    CASE ar.review_status 
      WHEN 'unreviewed' THEN 0
      WHEN 'needs_revision' THEN 1
      WHEN 'flagged' THEN 2
      WHEN 'in_review' THEN 3
      WHEN 'reviewed' THEN 4
      ELSE 5
    END ASC,
    ar.completed_at DESC NULLS LAST,
    ar.updated_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_student_assessment_responses(UUID, assessment_type) TO authenticated;

-- Overview: counts for review statuses and follow-ups due this week
CREATE OR REPLACE FUNCTION get_review_overview(
  teacher_user_id UUID
)
RETURNS TABLE (
  unreviewed_count BIGINT,
  reviewed_count BIGINT,
  needs_revision_count BIGINT,
  flagged_count BIGINT,
  followups_due_this_week BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT ar.*
    FROM assessment_responses ar
    JOIN students s ON s.id = ar.student_id
    JOIN teachers t ON t.id = s.teacher_id
    WHERE t.user_id = teacher_user_id
  )
  SELECT 
    COUNT(*) FILTER (WHERE review_status = 'unreviewed') AS unreviewed_count,
    COUNT(*) FILTER (WHERE review_status = 'reviewed') AS reviewed_count,
    COUNT(*) FILTER (WHERE review_status = 'needs_revision') AS needs_revision_count,
    COUNT(*) FILTER (WHERE review_status = 'flagged') AS flagged_count,
    COUNT(*) FILTER (
      WHERE needs_follow_up = true
        AND follow_up_due_at IS NOT NULL
        AND follow_up_due_at::date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days')::date
    ) AS followups_due_this_week;
END;
$$;

GRANT EXECUTE ON FUNCTION get_review_overview(UUID) TO authenticated;

-- Per-student review progress (reviewed/total counts)
CREATE OR REPLACE FUNCTION get_student_review_progress(
  teacher_user_id UUID
)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  reviewed_count BIGINT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH enum_total AS (
    SELECT COUNT(*)::BIGINT AS total_count
    FROM unnest(enum_range(NULL::assessment_type)) AS a
  ), per_student AS (
    SELECT s.id AS student_id,
           u.full_name AS student_name,
           COUNT(DISTINCT ar.assessment_type) FILTER (WHERE ar.review_status = 'reviewed') AS reviewed_count
    FROM students s
    JOIN users u ON u.id = s.user_id
    JOIN teachers t ON t.id = s.teacher_id
    LEFT JOIN assessment_responses ar ON ar.student_id = s.id
    WHERE t.user_id = teacher_user_id
    GROUP BY s.id, u.full_name
  )
  SELECT ps.student_id,
         ps.student_name,
         ps.reviewed_count,
         et.total_count
  FROM per_student ps
  CROSS JOIN enum_total et
  ORDER BY ps.student_name;
END;
$$;

GRANT EXECUTE ON FUNCTION get_student_review_progress(UUID) TO authenticated;


