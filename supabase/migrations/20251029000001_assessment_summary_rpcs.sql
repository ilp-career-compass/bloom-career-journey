-- Migration: Assessment Summary RPC Functions
-- This migration adds stored procedures for managing assessment summaries

-- Function: Create or update AI-generated summary
CREATE OR REPLACE FUNCTION create_ai_summary(
    p_assessment_response_id UUID,
    p_ai_summary JSONB,
    p_student_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_summary_id UUID;
    v_is_student_owner BOOLEAN;
BEGIN
    -- Verify the student owns this assessment response
    SELECT EXISTS (
        SELECT 1
        FROM assessment_responses ar
        JOIN students s ON s.id = ar.student_id
        WHERE ar.id = p_assessment_response_id
          AND s.user_id = p_student_user_id
    ) INTO v_is_student_owner;

    IF NOT v_is_student_owner THEN
        RAISE EXCEPTION 'not_authorized';
    END IF;

    -- Insert or update the summary
    INSERT INTO assessment_summaries (
        assessment_response_id,
        ai_summary,
        summary_type,
        approval_status,
        version,
        generated_at
    ) VALUES (
        p_assessment_response_id,
        p_ai_summary,
        'ai_generated',
        'pending_approval',
        1,
        NOW()
    )
    ON CONFLICT (assessment_response_id) 
    DO UPDATE SET
        ai_summary = EXCLUDED.ai_summary,
        summary_type = 'ai_generated',
        approval_status = 'pending_approval',
        version = assessment_summaries.version + 1,
        generated_at = NOW(),
        updated_at = NOW(),
        -- Reset approval fields when regenerating
        approved_by = NULL,
        approved_at = NULL,
        rejected_by = NULL,
        rejected_at = NULL,
        rejection_reason = NULL,
        teacher_edited_summary = NULL
    RETURNING id INTO v_summary_id;

    RETURN v_summary_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_ai_summary(UUID, JSONB, UUID) TO authenticated;

-- Function: Approve summary (teacher action)
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
BEGIN
    -- Verify the teacher owns the student for this summary
    SELECT EXISTS (
        SELECT 1
        FROM assessment_summaries assum
        JOIN assessment_responses ar ON ar.id = assum.assessment_response_id
        JOIN students s ON s.id = ar.student_id
        JOIN teachers t ON t.id = s.teacher_id
        WHERE assum.id = p_summary_id
          AND t.user_id = p_teacher_user_id
    ) INTO v_is_teacher_authorized;

    IF NOT v_is_teacher_authorized THEN
        RAISE EXCEPTION 'not_authorized';
    END IF;

    -- Update summary to approved status
    UPDATE assessment_summaries
    SET 
        approval_status = 'approved',
        approved_by = p_teacher_user_id,
        approved_at = NOW(),
        updated_at = NOW(),
        -- Clear rejection fields
        rejected_by = NULL,
        rejected_at = NULL,
        rejection_reason = NULL
    WHERE id = p_summary_id;
END;
$$;

GRANT EXECUTE ON FUNCTION approve_summary(UUID, UUID) TO authenticated;

-- Function: Reject summary (teacher action) - marks for regeneration
CREATE OR REPLACE FUNCTION reject_summary(
    p_summary_id UUID,
    p_teacher_user_id UUID,
    p_rejection_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_teacher_authorized BOOLEAN;
BEGIN
    -- Verify the teacher owns the student for this summary
    SELECT EXISTS (
        SELECT 1
        FROM assessment_summaries assum
        JOIN assessment_responses ar ON ar.id = assum.assessment_response_id
        JOIN students s ON s.id = ar.student_id
        JOIN teachers t ON t.id = s.teacher_id
        WHERE assum.id = p_summary_id
          AND t.user_id = p_teacher_user_id
    ) INTO v_is_teacher_authorized;

    IF NOT v_is_teacher_authorized THEN
        RAISE EXCEPTION 'not_authorized';
    END IF;

    -- Update summary to rejected status
    -- Frontend will handle regeneration automatically
    UPDATE assessment_summaries
    SET 
        approval_status = 'rejected',
        rejected_by = p_teacher_user_id,
        rejected_at = NOW(),
        rejection_reason = p_rejection_reason,
        updated_at = NOW(),
        -- Clear approval fields
        approved_by = NULL,
        approved_at = NULL
    WHERE id = p_summary_id;
END;
$$;

GRANT EXECUTE ON FUNCTION reject_summary(UUID, UUID, TEXT) TO authenticated;

-- Function: Update teacher-edited summary (before approval)
CREATE OR REPLACE FUNCTION update_teacher_summary(
    p_summary_id UUID,
    p_teacher_user_id UUID,
    p_teacher_edited_summary JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_teacher_authorized BOOLEAN;
BEGIN
    -- Verify the teacher owns the student for this summary
    SELECT EXISTS (
        SELECT 1
        FROM assessment_summaries assum
        JOIN assessment_responses ar ON ar.id = assum.assessment_response_id
        JOIN students s ON s.id = ar.student_id
        JOIN teachers t ON t.id = s.teacher_id
        WHERE assum.id = p_summary_id
          AND t.user_id = p_teacher_user_id
    ) INTO v_is_teacher_authorized;

    IF NOT v_is_teacher_authorized THEN
        RAISE EXCEPTION 'not_authorized';
    END IF;

    -- Update the teacher edited summary
    UPDATE assessment_summaries
    SET 
        teacher_edited_summary = p_teacher_edited_summary,
        summary_type = 'teacher_edited',
        updated_at = NOW()
    WHERE id = p_summary_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_teacher_summary(UUID, UUID, JSONB) TO authenticated;

-- Function: Update student-edited summary (after approval)
CREATE OR REPLACE FUNCTION update_student_summary(
    p_summary_id UUID,
    p_student_user_id UUID,
    p_student_edited_summary JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_student_owner BOOLEAN;
    v_is_approved BOOLEAN;
BEGIN
    -- Verify the student owns this summary and it's approved
    SELECT EXISTS (
        SELECT 1
        FROM assessment_summaries assum
        JOIN assessment_responses ar ON ar.id = assum.assessment_response_id
        JOIN students s ON s.id = ar.student_id
        WHERE assum.id = p_summary_id
          AND s.user_id = p_student_user_id
          AND assum.approval_status = 'approved'
    ) INTO v_is_student_owner;

    IF NOT v_is_student_owner THEN
        RAISE EXCEPTION 'not_authorized_or_not_approved';
    END IF;

    -- Update the student edited summary
    UPDATE assessment_summaries
    SET 
        student_edited_summary = p_student_edited_summary,
        summary_type = 'student_edited',
        version = version + 1,
        updated_at = NOW()
    WHERE id = p_summary_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_student_summary(UUID, UUID, JSONB) TO authenticated;

-- Function: Get summary by assessment response ID
CREATE OR REPLACE FUNCTION get_summary_by_assessment(
    p_assessment_response_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    id UUID,
    assessment_response_id UUID,
    ai_summary JSONB,
    student_edited_summary JSONB,
    teacher_edited_summary JSONB,
    summary_type summary_type,
    approval_status summary_approval_status,
    version INTEGER,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    rejected_by UUID,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_authorized BOOLEAN;
BEGIN
    -- Check if user is authorized (student owner or teacher)
    SELECT EXISTS (
        SELECT 1
        FROM assessment_responses ar
        LEFT JOIN students s ON s.id = ar.student_id
        LEFT JOIN teachers t ON t.id = s.teacher_id
        WHERE ar.id = p_assessment_response_id
          AND (s.user_id = p_user_id OR t.user_id = p_user_id)
    ) INTO v_is_authorized;

    IF NOT v_is_authorized THEN
        RAISE EXCEPTION 'not_authorized';
    END IF;

    -- Return the summary
    RETURN QUERY
    SELECT 
        assum.id,
        assum.assessment_response_id,
        assum.ai_summary,
        assum.student_edited_summary,
        assum.teacher_edited_summary,
        assum.summary_type,
        assum.approval_status,
        assum.version,
        assum.approved_by,
        assum.approved_at,
        assum.rejected_by,
        assum.rejected_at,
        assum.rejection_reason,
        assum.generated_at,
        assum.created_at,
        assum.updated_at
    FROM assessment_summaries assum
    WHERE assum.assessment_response_id = p_assessment_response_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_summary_by_assessment(UUID, UUID) TO authenticated;

-- Function: Get pending summaries for a teacher
CREATE OR REPLACE FUNCTION get_pending_summaries_for_teacher(
    p_teacher_user_id UUID
)
RETURNS TABLE (
    summary_id UUID,
    assessment_response_id UUID,
    student_name TEXT,
    student_class TEXT,
    assessment_title TEXT,
    ai_summary JSONB,
    teacher_edited_summary JSONB,
    approval_status summary_approval_status,
    generated_at TIMESTAMPTZ,
    rejection_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        assum.id AS summary_id,
        ar.id AS assessment_response_id,
        u.full_name AS student_name,
        c.name AS student_class,
        ar.assessment_title,
        assum.ai_summary,
        assum.teacher_edited_summary,
        assum.approval_status,
        assum.generated_at,
        assum.rejection_reason
    FROM assessment_summaries assum
    JOIN assessment_responses ar ON ar.id = assum.assessment_response_id
    JOIN students s ON s.id = ar.student_id
    JOIN users u ON u.id = s.user_id
    LEFT JOIN classes c ON c.id = s.class_id
    JOIN teachers t ON t.id = s.teacher_id
    WHERE t.user_id = p_teacher_user_id
      AND assum.approval_status IN ('pending_approval', 'rejected', 'revision_requested')
    ORDER BY assum.generated_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_pending_summaries_for_teacher(UUID) TO authenticated;

-- Function: Get all summaries for teacher dashboard with counts
CREATE OR REPLACE FUNCTION get_teacher_summary_overview(
    p_teacher_user_id UUID
)
RETURNS TABLE (
    total_summaries BIGINT,
    pending_approval BIGINT,
    approved BIGINT,
    rejected BIGINT,
    student_edited BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) AS total_summaries,
        COUNT(*) FILTER (WHERE assum.approval_status = 'pending_approval') AS pending_approval,
        COUNT(*) FILTER (WHERE assum.approval_status = 'approved') AS approved,
        COUNT(*) FILTER (WHERE assum.approval_status = 'rejected') AS rejected,
        COUNT(*) FILTER (WHERE assum.summary_type = 'student_edited') AS student_edited
    FROM assessment_summaries assum
    JOIN assessment_responses ar ON ar.id = assum.assessment_response_id
    JOIN students s ON s.id = ar.student_id
    JOIN teachers t ON t.id = s.teacher_id
    WHERE t.user_id = p_teacher_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_teacher_summary_overview(UUID) TO authenticated;

