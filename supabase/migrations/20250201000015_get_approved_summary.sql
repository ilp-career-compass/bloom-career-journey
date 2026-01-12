-- Function to strictly get the APPROVED summary for an assessment response
-- This bypasses complex sorting logic to ensure that if an approved summary exists, it is returned.

CREATE OR REPLACE FUNCTION get_approved_summary_strict(
    p_assessment_response_id UUID
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
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
        assum.generated_at,
        assum.created_at,
        assum.updated_at
    FROM assessment_summaries assum
    WHERE assum.assessment_response_id = p_assessment_response_id
      AND assum.approval_status = 'approved'
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_approved_summary_strict(UUID) TO authenticated;
