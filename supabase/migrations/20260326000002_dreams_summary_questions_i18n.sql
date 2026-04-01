-- Migration: Create dreams_summary_questions table + RPC, and fix key format
-- mismatch in all 6 summary question RPCs.
--
-- Problem: The clean slate migration (20260312000007) inserted content_translations
-- with key format 'summary_question_1', but the 5 existing RPCs look up 'question1'.
-- This caused all non-English summary questions to fall back to English.

BEGIN;

-- ============================================================
-- 1. Create dreams_summary_questions table (was missing entirely)
-- ============================================================

CREATE TABLE IF NOT EXISTS dreams_summary_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    sequence_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Add help_text column if it doesn't exist (table may have been created without it)
ALTER TABLE dreams_summary_questions ADD COLUMN IF NOT EXISTS help_text TEXT;

ALTER TABLE dreams_summary_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON dreams_summary_questions;
CREATE POLICY "Enable read access for authenticated users" ON dreams_summary_questions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only insert if table is empty (avoid duplicates on re-run)
INSERT INTO dreams_summary_questions (question_text, sequence_number)
SELECT q.question_text, q.sequence_number
FROM (VALUES
    ('Dream', 1),
    ('Qualities/abilities I already have to achieve my dream', 2),
    ('What I need to do to ensure my dream does not fail', 3),
    ('What I need to study after Class 10 to achieve this dream (if applicable)', 4)
) AS q(question_text, sequence_number)
WHERE NOT EXISTS (SELECT 1 FROM dreams_summary_questions LIMIT 1);

-- ============================================================
-- 2. Insert dreams content_translations (all 4 languages)
--    Using 'summary_question_N' key format to match clean slate convention
-- ============================================================

-- English
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_1', 'en', 'Dream')
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_2', 'en', 'Qualities/abilities I already have to achieve my dream')
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_3', 'en', 'What I need to do to ensure my dream does not fail')
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_4', 'en', 'What I need to study after Class 10 to achieve this dream (if applicable)')
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Kannada
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_1', 'kn', $$ಕನಸು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_2', 'kn', $$ನಿಮ್ಮಲ್ಲಿ ಈಗಾಗಲೇ ಕಂಡುಕೊಂಡಿರುವ ಯಾವ ಗುಣ/ ಮೌಲ್ಯ/ ಸಾಮರ್ಥ್ಯ ನಿಮ್ಮ ಕನಸನ್ನು ಸಾಧಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_3', 'kn', $$ಕನಸು ವಿಫಲವಾಗುವುದಿಲ್ಲ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಲು ನೀವು ಏನು ಮಾಡಬೇಕಾಗುತ್ತದೆ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_4', 'kn', $$ಈ ಕನಸನ್ನುಸಾಧಿಸಲು 10ನೇ ತರಗತಿಯ ನಂತರ ನೀವು ಏನು ಅಧ್ಯಯನ ಮಾಡಬೇಕು? (ಅನ್ವಯಿಸಿದರೆ)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Tamil
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_1', 'ta', $$கனவு$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_2', 'ta', $$எனது கனவை அடைய என்னிடம் ஏற்கனவே உள்ள பண்புகள்/திறமைகள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_3', 'ta', $$என் கனவு தோற்காமல் இருக்க நான் செய்ய வேண்டியவை$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_4', 'ta', $$இந்தக் கனவை அடைய 10-ஆம் வகுப்பிற்குப் பிறகு நான் படிக்க வேண்டியவை$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Hindi
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_1', 'hi', $$सपना$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_2', 'hi', $$आपके भीतर पहले से मौजूद कौन से गुण/मूल्य/क्षमता आपके सपने को हासिल करने में मदद करेंगे?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_3', 'hi', $$यह सुनिश्चित करने के लिए कि आपका सपना विफल न हो, आपको क्या करने की आवश्यकता है?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_4', 'hi', $$इस सपने को पूरा करने के लिए आपको 10वीं कक्षा के बाद क्या अध्ययन करना चाहिए? (यदि लागू हो)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- ============================================================
-- 3. Fix ALL 6 summary question RPCs to use 'summary_question_N' key format
--    (matching the clean slate migration's content_translations keys)
-- ============================================================

-- 3a. Dreams (new)
DROP FUNCTION IF EXISTS get_dreams_summary_questions_i18n(text);
CREATE OR REPLACE FUNCTION get_dreams_summary_questions_i18n(p_lang text)
RETURNS TABLE (
    id UUID,
    question_text TEXT,
    translated_text TEXT,
    sequence_number INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.id,
        q.question_text,
        COALESCE(
            public.get_translation('dreams_summary_question', 'summary_question_' || q.sequence_number, p_lang),
            q.question_text
        ) as translated_text,
        q.sequence_number
    FROM dreams_summary_questions q
    WHERE q.is_active = true
    ORDER BY q.sequence_number;
END $$;
GRANT EXECUTE ON FUNCTION get_dreams_summary_questions_i18n(text) TO authenticated;

-- 3b. Inspiration (fix key: 'question' || rn -> 'summary_question_' || rn)
DROP FUNCTION IF EXISTS get_inspiration_summary_questions_i18n(text);
CREATE OR REPLACE FUNCTION get_inspiration_summary_questions_i18n(p_lang text)
RETURNS TABLE (
    id UUID,
    question_text TEXT,
    section_header TEXT,
    sequence_number INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
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
            public.get_translation('inspiration_summary_question', 'summary_question_' || base.rn, p_lang),
            base.question_text
        ) as question_text,
        COALESCE(
            public.get_translation('inspiration_summary_question', 'header' || base.rn, p_lang),
            base.section_header
        ) as section_header,
        base.sequence_number::INTEGER
    FROM base
    ORDER BY base.sequence_number;
END $$;
GRANT EXECUTE ON FUNCTION get_inspiration_summary_questions_i18n(text) TO authenticated;

-- 3c. About Me (fix key: 'question' || rn -> 'summary_question_' || rn)
DROP FUNCTION IF EXISTS get_about_me_summary_questions_i18n(text);
CREATE OR REPLACE FUNCTION get_about_me_summary_questions_i18n(p_lang text)
RETURNS TABLE (
    id UUID,
    question_text TEXT,
    section_header TEXT,
    sequence_number INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
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
            public.get_translation('about_me_summary_question', 'summary_question_' || base.rn, p_lang),
            base.question_text
        ) as question_text,
        COALESCE(
            public.get_translation('about_me_summary_question', 'header' || base.rn, p_lang),
            base.section_header
        ) as section_header,
        base.sequence_number::INTEGER
    FROM base
    ORDER BY base.sequence_number;
END $$;
GRANT EXECUTE ON FUNCTION get_about_me_summary_questions_i18n(text) TO authenticated;

-- 3d. School Learning (fix key: 'question' || seq -> 'summary_question_' || seq)
DROP FUNCTION IF EXISTS get_school_learning_summary_questions_i18n(text);
CREATE OR REPLACE FUNCTION get_school_learning_summary_questions_i18n(p_lang text)
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
        COALESCE(
            public.get_translation('school_learning_summary_question', 'summary_question_' || q.sequence_number, p_lang),
            q.question_text
        ) as text,
        COALESCE(
            public.get_translation('school_learning_summary_help', 'question' || q.sequence_number, p_lang),
            q.help_text
        ) as help_text,
        q.sequence_number
    FROM school_learning_summary_questions q
    WHERE q.is_active = true
    ORDER BY q.sequence_number;
END $$;
GRANT EXECUTE ON FUNCTION get_school_learning_summary_questions_i18n(text) TO authenticated;

-- 3e. Hobbies (fix key: 'question' || seq -> 'summary_question_' || seq)
DROP FUNCTION IF EXISTS get_hobbies_summary_questions_i18n(text);
CREATE OR REPLACE FUNCTION get_hobbies_summary_questions_i18n(p_lang text)
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
        COALESCE(
            public.get_translation('hobbies_summary_question', 'summary_question_' || q.sequence_number, p_lang),
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
END $$;
GRANT EXECUTE ON FUNCTION get_hobbies_summary_questions_i18n(text) TO authenticated;

-- 3f. Role Models (fix key: 'question' || seq -> 'summary_question_' || seq)
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
        COALESCE(
            public.get_translation('role_models_summary_question', 'summary_question_' || q.sequence_number, p_lang),
            q.question_text
        ) as text,
        COALESCE(
            public.get_translation('role_models_summary_help', 'question' || q.sequence_number, p_lang),
            q.help_text
        ) as help_text,
        q.sequence_number
    FROM role_models_summary_questions q
    WHERE q.is_active = true
    ORDER BY q.sequence_number;
END $$;
GRANT EXECUTE ON FUNCTION get_role_models_summary_questions_i18n(text) TO authenticated;

COMMIT;
