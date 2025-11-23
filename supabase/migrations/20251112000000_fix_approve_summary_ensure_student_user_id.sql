-- Migration: Fix approve_summary to ensure student_user_id is set
-- This ensures real-time subscriptions work correctly by having student_user_id populated

CREATE OR REPLACE FUNCTION approve_summary(
    p_summary_id UUID,
    p_teacher_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_teacher_authorized BOOLEAN;
    v_student_user_id UUID;
BEGIN
    -- Verify the teacher owns the student for this summary and get student_user_id
    SELECT EXISTS (
        SELECT 1
        FROM assessment_summaries assum
        JOIN assessment_responses ar ON ar.id = assum.assessment_response_id
        JOIN students s ON s.id = ar.student_id
        JOIN teachers t ON t.id = s.teacher_id
        WHERE assum.id = p_summary_id
          AND t.user_id = p_teacher_user_id
    ), (
        SELECT s.user_id
        FROM assessment_summaries assum
        JOIN assessment_responses ar ON ar.id = assum.assessment_response_id
        JOIN students s ON s.id = ar.student_id
        WHERE assum.id = p_summary_id
    ) INTO v_is_teacher_authorized, v_student_user_id;

    IF NOT v_is_teacher_authorized THEN
        RAISE EXCEPTION 'not_authorized';
    END IF;

    -- Update summary to approved status and ensure student_user_id is set
    UPDATE assessment_summaries
    SET 
        approval_status = 'approved',
        approved_by = p_teacher_user_id,
        approved_at = NOW(),
        updated_at = NOW(),
        -- Ensure student_user_id is set (in case it was NULL)
        student_user_id = COALESCE(student_user_id, v_student_user_id),
        -- Clear rejection fields
        rejected_by = NULL,
        rejected_at = NULL,
        rejection_reason = NULL
    WHERE id = p_summary_id;
END;
$$;

GRANT EXECUTE ON FUNCTION approve_summary(UUID, UUID) TO authenticated;

