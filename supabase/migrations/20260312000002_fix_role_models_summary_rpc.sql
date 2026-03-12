DROP FUNCTION IF EXISTS get_role_models_summary_questions_i18n(text);
CREATE OR REPLACE FUNCTION get_role_models_summary_questions_i18n(p_lang text)
RETURNS TABLE (
    id UUID,
    key TEXT,
    text TEXT,
    help_text TEXT,
    sequence_number INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        'question' || q.sequence_number as key,
        COALESCE(t_q.text, q.question_text) as text,
        q.help_text,
        q.sequence_number
    FROM role_models_summary_questions q
    LEFT JOIN content_translations t_q ON t_q.resource_type = 'role_models_summary_question' AND t_q.resource_key = ('question' || q.sequence_number) AND t_q.lang = p_lang
    WHERE q.is_active = true
    ORDER BY q.sequence_number;
END $$;

GRANT EXECUTE ON FUNCTION get_role_models_summary_questions_i18n(text) TO authenticated;
