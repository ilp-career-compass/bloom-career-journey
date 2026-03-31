-- Fix: All 6 summary question RPCs look for resource_key = 'question' || N
-- but the actual DB keys are 'summary_question' || N (after clean_slate + fix_content_key_formats migrations).
-- This caused COALESCE to always fall back to English base text.

-- 1) Inspiration
DROP FUNCTION IF EXISTS get_inspiration_summary_questions_i18n(text);
CREATE OR REPLACE FUNCTION get_inspiration_summary_questions_i18n(p_lang text)
RETURNS TABLE (id UUID, question_text TEXT, section_header TEXT, sequence_number INTEGER)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH base AS (
        SELECT
            s.id,
            s.question_text,
            s.section_header,
            s.sequence_number,
            ROW_NUMBER() OVER (ORDER BY s.sequence_number) as rn
        FROM inspiration_summary_questions s
        WHERE s.is_active = true
    )
    SELECT
        base.id,
        COALESCE(
            public.get_translation('inspiration_summary_question', 'summary_question' || base.rn, p_lang),
            base.question_text
        ) as question_text,
        COALESCE(
            public.get_translation('inspiration_summary_question', 'header' || base.rn, p_lang),
            base.section_header
        ) as section_header,
        base.sequence_number
    FROM base
    ORDER BY base.sequence_number;
END
$$;
GRANT EXECUTE ON FUNCTION get_inspiration_summary_questions_i18n(text) TO authenticated;

-- 2) About Me
DROP FUNCTION IF EXISTS get_about_me_summary_questions_i18n(text);
CREATE OR REPLACE FUNCTION get_about_me_summary_questions_i18n(p_lang text)
RETURNS TABLE (id UUID, question_text TEXT, section_header TEXT, sequence_number INTEGER)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH base AS (
        SELECT
            s.id,
            s.question_text,
            s.section_header,
            s.sequence_number,
            ROW_NUMBER() OVER (ORDER BY s.sequence_number) as rn
        FROM about_me_summary_questions s
        WHERE s.is_active = true
    )
    SELECT
        base.id,
        COALESCE(
            public.get_translation('about_me_summary_question', 'summary_question' || base.rn, p_lang),
            base.question_text
        ) as question_text,
        COALESCE(
            public.get_translation('about_me_summary_question', 'header' || base.rn, p_lang),
            base.section_header
        ) as section_header,
        base.sequence_number
    FROM base
    ORDER BY base.sequence_number;
END
$$;
GRANT EXECUTE ON FUNCTION get_about_me_summary_questions_i18n(text) TO authenticated;

-- 3) Dreams
DROP FUNCTION IF EXISTS get_dreams_summary_questions_i18n(text);
CREATE OR REPLACE FUNCTION get_dreams_summary_questions_i18n(p_lang text)
RETURNS TABLE (id UUID, sequence_number INTEGER, section_header TEXT, question_text TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.id,
        q.sequence_number,
        COALESCE(ct_h.text, q.section_header) as section_header,
        COALESCE(ct_q.text, q.question_text) as question_text
    FROM dreams_summary_questions q
    LEFT JOIN content_translations ct_h
        ON ct_h.resource_type = 'dreams_summary_question'
        AND ct_h.resource_key = 'header' || q.sequence_number::text
        AND ct_h.lang = p_lang
    LEFT JOIN content_translations ct_q
        ON ct_q.resource_type = 'dreams_summary_question'
        AND ct_q.resource_key = 'summary_question' || q.sequence_number::text
        AND ct_q.lang = p_lang
    ORDER BY q.sequence_number;
END;
$$;
GRANT EXECUTE ON FUNCTION get_dreams_summary_questions_i18n(text) TO authenticated;

-- 4) School Learning
DROP FUNCTION IF EXISTS get_school_learning_summary_questions_i18n(text);
CREATE OR REPLACE FUNCTION get_school_learning_summary_questions_i18n(p_lang text)
RETURNS TABLE (id UUID, sequence_number INTEGER, section_header TEXT, question_text TEXT, translated_header TEXT, translated_text TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.id,
        q.sequence_number,
        q.section_header,
        q.question_text,
        COALESCE(th.text, q.section_header) as translated_header,
        COALESCE(tq.text, q.question_text) as translated_text
    FROM school_learning_summary_questions q
    LEFT JOIN content_translations th ON th.resource_type = 'school_learning_summary_question'
        AND th.resource_key = 'header' || q.sequence_number
        AND th.lang = p_lang
    LEFT JOIN content_translations tq ON tq.resource_type = 'school_learning_summary_question'
        AND tq.resource_key = 'summary_question' || q.sequence_number
        AND tq.lang = p_lang
    ORDER BY q.sequence_number;
END;
$$;
GRANT EXECUTE ON FUNCTION get_school_learning_summary_questions_i18n(text) TO authenticated;

-- 5) Hobbies
DROP FUNCTION IF EXISTS get_hobbies_summary_questions_i18n(text);
CREATE OR REPLACE FUNCTION get_hobbies_summary_questions_i18n(p_lang text)
RETURNS TABLE (id UUID, key TEXT, text TEXT, help_text TEXT, sequence_number INTEGER)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.id,
        'question' || q.sequence_number as key,
        COALESCE(
            public.get_translation('hobbies_summary_question', 'summary_question' || q.sequence_number, p_lang),
            q.question_text
        ) as text,
        COALESCE(
            public.get_translation('hobbies_summary_help', 'question' || q.sequence_number, p_lang),
            q.help_text
        ) as help_text,
        q.sequence_number
    FROM hobbies_summary_questions q
    WHERE q.is_active = true
    ORDER BY q.sequence_number;
END
$$;
GRANT EXECUTE ON FUNCTION get_hobbies_summary_questions_i18n(text) TO authenticated;

-- 6) Role Models
DROP FUNCTION IF EXISTS get_role_models_summary_questions_i18n(text);
CREATE OR REPLACE FUNCTION get_role_models_summary_questions_i18n(p_lang text)
RETURNS TABLE (id UUID, key TEXT, text TEXT, help_text TEXT, sequence_number INTEGER)
LANGUAGE plpgsql SECURITY DEFINER
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
    LEFT JOIN content_translations t_q ON t_q.resource_type = 'role_models_summary_question' AND t_q.resource_key = ('summary_question' || q.sequence_number) AND t_q.lang = p_lang
    WHERE q.is_active = true
    ORDER BY q.sequence_number;
END
$$;
GRANT EXECUTE ON FUNCTION get_role_models_summary_questions_i18n(text) TO authenticated;
