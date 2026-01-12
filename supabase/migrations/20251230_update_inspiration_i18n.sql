
-- Migration: Add My Inspiration I18n Content and Summary Questions

-- 1. Update Base English Content in inspiration_questions (assuming sequence_number 1-10)
-- We use ON CONFLICT to update if exists. We assume 'id' column exists, but we match on sequence check or just update by sequence if possible. 
-- Since we don't know the IDs, we better just update based on sequence_number if strict, or clear and re-insert if safe. 
-- Safer: Update based on sequence_number.

DO $$
DECLARE
    q text[] := ARRAY[
        'Which parts of this video/audio did you like the most or find inspiring?',
        'Whose behavior or way of speaking did you like the most in this video/audio?',
        'Which qualities did you notice in the Trainer?',
        'Which quality/Character of the Trainer will help bring a positive change in your life?',
        'If you felt the character in the story was sad/upset, can you explain the reason for it?',
        'Have you ever helped someone in real life like the character in the story? Briefly describe and reflect on that experience',
        'If you were that character, what would you do?',
        'In this video/audio, did any character inspire you? Write down what makes that person an inspiration to you',
        'Which quality of that character would you like to follow in real life?',
        'If there is any other quality of the character you liked more, write it down.'
    ];
    h text[] := ARRAY[
        'Which part of the video/audio inspired you most?',
        'Whose behavior or speech did you like most?',
        'What qualities does the Trainer have?',
        'Which Trainer quality can help you?',
        'Why was the character sad?',
        'Did you help someone like the character?',
        'What would you do as the character?',
        'Did any character inspire you? Why?',
        'Which quality will you follow?',
        'Write any other quality of the character you liked.'
    ];
BEGIN
    FOR i IN 1..10 LOOP
        -- Attempt to update existing question by sequence number
        UPDATE inspiration_questions
        SET question_text = q[i],
            help_text = h[i]
        WHERE sequence_number = i;
        
        -- If not found (and we want to insert), we would need to handle that, 
        -- but usually these are seeded. If not, insert:
        IF NOT FOUND THEN
            INSERT INTO inspiration_questions (question_text, help_text, sequence_number, is_active)
            VALUES (q[i], h[i], i, true);
        END IF;
    END LOOP;
END $$;

-- 2. Create Summary Questions Table
CREATE TABLE IF NOT EXISTS inspiration_summary_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    sequence_number INTEGER,
    section_header TEXT, -- For "Summary: What inspired me to..."
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE inspiration_summary_questions ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON inspiration_summary_questions TO authenticated;
DROP POLICY IF EXISTS "Authenticated users can view inspiration summary questions" ON inspiration_summary_questions;
CREATE POLICY "Authenticated users can view inspiration summary questions" ON inspiration_summary_questions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Insert Base English Summary Questions
TRUNCATE inspiration_summary_questions; -- Reset to ensure clean state (optional, but safe for this specific table if it's new/static)

INSERT INTO inspiration_summary_questions (sequence_number, section_header, question_text) VALUES
(1, 'Summary: What inspired me to...', 'After watching all these videos, list the points that inspired you from your experience'),
(2, NULL, 'After watching these videos, which behavior do you think you should avoid? Write it down.'),
(3, NULL, 'Discuss with your friend about the character in this video that inspired you and a person in real life who has inspired you. Write a summary of your discussion.');


-- 3. Insert Translations into content_translations
-- Clean up old translations for this module to avoid duplicates/stale data if re-running
DELETE FROM content_translations WHERE resource_type IN ('inspiration_question', 'inspiration_help', 'inspiration_summary_question', 'inspiration_module');

-- Module Title
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('inspiration_module', 'title', 'ta', 'என் உத்வேகம்'),
('inspiration_module', 'title', 'kn', 'ನನ್ನ ಪ್ರೇರಣೆ');

-- Questions Translations (Tamil)
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('inspiration_question', 'question1', 'ta', 'இந்த வீடியோ/ஆடியோவில் உங்களுக்கு உத்வேகத்தை அளித்தது எது?'),
('inspiration_question', 'question2', 'ta', 'இந்த விடியோ/ஆடியோவில் உங்களுக்கு யாருடைய செயல் அல்லது பேசும் விதம் மிகவும் பிடித்தது??'),
('inspiration_question', 'question3', 'ta', 'பயிற்சியாளரின் எந்த பண்புகளை நீங்கள் கவனித்தீர்கள்?'),
('inspiration_question', 'question4', 'ta', 'பயிற்சியாளரின் எந்த குணம்/பண்பு உங்கள் வாழ்க்கையில் நல்ல மாற்றத்தை கொண்டுவரும்?'),
('inspiration_question', 'question5', 'ta', 'கதையில் உள்ள கதாபாத்திரம் சோகமாக அல்லது வேதனைப்படுவது போல உங்களுக்கு தோன்றினால், அதற்கான காரணத்தை எழுத முடியுமா?'),
('inspiration_question', 'question6', 'ta', 'கதையில் உள்ள கதாபாத்திரம் போல நீங்கள் உண்மையான வாழ்க்கையில் யாருக்காவது உதவியிருக்கிறீர்களா? அந்த அனுபவத்தை சுருக்கமாக விவரித்து, நீங்கள் அந்த கதாபாத்திரம் போல யாருக்காவது உதவியுள்ளீர்களா? அதைப் பற்றிச் சிந்தியுங்கள்'),
('inspiration_question', 'question7', 'ta', 'நீங்கள் அந்த கதாபாத்திரமாக இருந்தால், நீங்கள் என்ன செய்வீர்கள்?'),
('inspiration_question', 'question8', 'ta', 'இந்த விடியோ/ஆடியோவில் ஏதாவது கதாபாத்திரம் உங்களை ஊக்கமளித்ததா? எழுதுங்கள்.'),
('inspiration_question', 'question9', 'ta', 'அந்த கதாபாத்திரத்தின் எந்த குணத்தை பின்பற்ற விரும்புகிறீர்கள்?'),
('inspiration_question', 'question10', 'ta', 'கதாபாத்திரத்தின் வேறு ஏதாவது குணம் உங்களுக்கு பிடித்திருந்தால், அதை எழுதுங்கள்');

-- Questions Translations (Kannada)
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('inspiration_question', 'question1', 'kn', 'ಈ ವೀಡಿಯೋ / ಅಡಿಯೋದಲ್ಲಿ ನಿಮಗೆ ಹೆಚ್ಚು ಇಷ್ಟವಾದ / ಪ್ರೇರಣಾದಾಯಕ ಅಂಶಗಳು ಯಾವುವು?'),
('inspiration_question', 'question2', 'kn', 'ಈ ವೀಡಿಯೋ/ಆಡಿಯೋದಲ್ಲಿ ನಿಮಗೆ ಯಾರ ನಡೆ-ನುಡಿಗೆ ಹೆಚ್ಚು ಇಷ್ಟವಾಯಿತು?'),
('inspiration_question', 'question3', 'kn', 'ಆಚರ್ಯರಲ್ಲಿ ನಿಮಗೆ ಗೊತ್ತಾದ ಗುಣಗಳು ಯಾವುವು?'),
('inspiration_question', 'question4', 'kn', 'ಅಧ್ಯಾಪಕನಲ್ಲಿ ಯಾವ ಅಂಶ ನಿಮಗೆ ಜೀವನದಲ್ಲಿ ಉತ್ತಮ ಬದಲಾವಣೆ ತರಲಿದೆ?'),
('inspiration_question', 'question5', 'kn', 'ಯಾಚಿ ಪಾತ್ರ ನಿಮಗೆ ಹೆಚ್ಚು ನೋವು/ದುಃಖಕರವಾಗಿ ಎಂದು ತಿಳಿಸಬಹುದೇ?'),
('inspiration_question', 'question6', 'kn', 'ನೀವು ನಿಜ ಜೀವನದಲ್ಲಿ ಕಥಾಪಾತ್ರದಂತೆಯೇ ಸಂಕ್ಷಿಪ್ತವಾಗಿ ವಿವರಿಸಿ ಮತ್ತು ಚಿಂತಿಸಿ.'),
('inspiration_question', 'question7', 'kn', 'ನೀವು ಆ ಪಾತ್ರಧಾರಿಯಾದರೆ ಏನು ಮಾಡುತ್ತಿರೀರಿ?'),
('inspiration_question', 'question8', 'kn', 'ಈ ವೀಡಿಯೋ/ಆಡಿಯೋದಲ್ಲಿ ನೀವು ನೋಡಿದ ಪಾತ್ರ ನಿಮಗೆ ಪ್ರೇರಣೆಯಾಗಿದೆಯೇ? ಆ ವ್ಯಕ್ತಿಯು ನಿಮಗೆ ಪ್ರೇರಣೆಯಾದ ಅಂಶವನ್ನು ಬರೆಯಿರಿ'),
('inspiration_question', 'question9', 'kn', 'ಆ ಪಾತ್ರದಿಂದ ನೀವು ಯಾವ ಅಂಶವನ್ನು ನಿಜ ಜೀವನದಲ್ಲಿ ಅನುಸರಿಸಲು ಬಯಸುತ್ತೀರಿ?'),
('inspiration_question', 'question10', 'kn', 'ನೀವು ಗಮನಿಸಿದ್ದ ಪಾತ್ರದಿಂದ ಇನ್ನೇನಾದರೂ ಹೆಚ್ಚು ಇಷ್ಟವಾದ ಅಂಶವಿದ್ದರೆ, ಅದನ್ನು ಬರೆಯಿರಿ.');

-- Help Text Translations (Tamil)
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('inspiration_help', 'question1', 'ta', 'இந்த வீடியோ/ஆடியோவில் எந்த பகுதி உங்களை அதிகம் ஊக்கமளித்தது?'),
('inspiration_help', 'question2', 'ta', 'யாருடைய செயல் உங்களுக்கு மிகவும் பிடித்தது?'),
('inspiration_help', 'question3', 'ta', 'பயிற்சியாளருக்கு என்னென்ன குணங்கள் உள்ளன?'),
('inspiration_help', 'question4', 'ta', 'பயிற்சியாளரின் எந்த குணம் உங்களுக்கு உதவும்?'),
('inspiration_help', 'question5', 'ta', 'அந்த கதாபாத்திரம் ஏன் வருத்தமாக இருந்தது?'),
('inspiration_help', 'question6', 'ta', ''),
('inspiration_help', 'question7', 'ta', 'நீங்கள் அந்த கதாபாத்திரமாக இருந்தால் என்ன செய்வீர்கள்?'),
('inspiration_help', 'question8', 'ta', 'எந்த கதாபாத்திரம் உங்களை ஊக்கமளித்தது? ஏன்?'),
('inspiration_help', 'question9', 'ta', 'நீங்கள் எந்த குணத்தை பின்பற்ற விரும்புகிறீர்கள்?'),
('inspiration_help', 'question10', 'ta', 'கதாபாத்திரத்தின் மற்றொரு பிடித்த குணத்தை எழுதுங்கள்.');

-- Help Text Translations (Kannada) - Mostly null in source, but we can leave them out or insert empty
-- User provided null for Kannada help texts. We skip inserting them so it falls back to English (or empty if handled). 
-- Wait, fallback to English is the default behavior of get_translation. If we want empty string instead of English fallback for nulls, we might need to handle it. 
-- But usually help text in another language being English is better than nothing, or maybe not.
-- The user JSON had null. I will assume no translation means fallback to English or show nothing.
-- I won't insert Kannada help texts.

-- Summary Questions Translations (Tamil)
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('inspiration_summary_question', 'header1', 'ta', 'சுருக்கம்: எனக்கு ஊக்கம் அளித்தது...'),
('inspiration_summary_question', 'question1', 'ta', 'இந்த அனைத்து வீடியோக்களையும் பார்த்த பிறகு, உங்கள் அனுபவத்தில் முக்கியமானவற்றை பட்டியலிடுங்கள்'),
('inspiration_summary_question', 'question2', 'ta', 'இந்த விடியோக்களை பார்த்த பிறகு, நீங்கள் தவிர்க்க வேண்டும் என்று நினைக்கும் செயல் என்ன? எழுதுங்கள்.'),
('inspiration_summary_question', 'question3', 'ta', ''); -- Empty strictly as per user

-- Summary Questions Translations (Kannada)
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('inspiration_summary_question', 'header1', 'kn', 'ಸಾರಾಂಶ: ನಾನು ಪ್ರೇರಣೆ ಪಡೆದ ಅಂಶವೇ...'),
('inspiration_summary_question', 'question1', 'kn', 'ಈ ಎಲ್ಲ ವಿಡಿಯೋವನ್ನು ನೋಡಿದಾಗ ನಿಮ್ಮ ಅನುಭವದಿಂದ ನೀವು ಪ್ರೇರಣೆ ಪಡೆದ ಅಂಶವನ್ನು ಪಟ್ಟಿಮಾಡಿ'),
('inspiration_summary_question', 'question2', 'kn', 'ಈ ಎಲ್ಲ ವಿಡಿಯೋಗಳನ್ನು ನೋಡಿದಾಗ ನೀವು ಅನುಭವಿಸಿದ ನಿಜ ಜೀವನದಲ್ಲಿ ಇರದಿದ್ದರೆ ನೀವು ಮಾಡಬೇಕಾದ ನಡವಳಿಕೆ ಯಾವುದು? ಅದನ್ನು ಬರೆಯಿರಿ.'),
('inspiration_summary_question', 'question3', 'kn', 'ನಿಮ್ಮ ಗೆಳೆಯರೊಂದಿಗೆ, ಈ ವಿಡಿಯೋದಲ್ಲಿ ನಿಮಗೆ ಪ್ರೇರಣೆ ನೀಡಿದ ಪಾತ್ರ ಮತ್ತು ಅದು ನಿಮ್ಮ ನಿಜ ಜೀವನದಲ್ಲಿ ಯಾರಿಗೆ ಪ್ರೇರಣೆಯಾದದ್ದೋ ಆ ವ್ಯಕ್ತಿಯ ಬಗ್ಗೆ ಚರ್ಚಿಸಿ. ಆ ಚರ್ಚೆಯ ಸಾರಾಂಶವನ್ನು ಬರೆಯಿರಿ.');


-- 4. Create/Update RPCs

-- Base RPC for Summary Questions
CREATE OR REPLACE FUNCTION get_inspiration_summary_questions()
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
    SELECT 
        s.id,
        s.question_text,
        s.section_header,
        s.sequence_number
    FROM inspiration_summary_questions s
    WHERE s.is_active = true
    ORDER BY s.sequence_number;
END $$;

GRANT EXECUTE ON FUNCTION get_inspiration_summary_questions() TO authenticated;

-- I18n RPC for Summary Questions
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
            public.get_translation('inspiration_summary_question', 'question' || base.rn, p_lang),
            base.question_text
        ) as question_text,
        COALESCE(
            public.get_translation('inspiration_summary_question', 'header' || base.rn, p_lang),
            base.section_header
        ) as section_header,
        base.sequence_number
    FROM base
    ORDER BY base.sequence_number;
END $$;

GRANT EXECUTE ON FUNCTION get_inspiration_summary_questions_i18n(text) TO authenticated;

-- Ensure get_inspiration_questions_i18n fetches correct keys
-- Currently it might be using 'question' || rn. 
-- Let's redefine it to be sure it matches our data.

DROP FUNCTION IF EXISTS get_inspiration_questions_i18n(text);
CREATE OR REPLACE FUNCTION get_inspiration_questions_i18n(p_lang text)
RETURNS TABLE (
    id UUID,
    question_text TEXT,
    help_text TEXT,
    sequence_number INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH base AS (
        SELECT 
            i.id,
            i.question_text,
            i.help_text,
            i.sequence_number,
            ROW_NUMBER() OVER (ORDER BY i.sequence_number) as rn
        FROM inspiration_questions i
        WHERE i.is_active = true
    )
    SELECT 
        base.id,
        -- Try to get translation, fallback to base text
        COALESCE(
            public.get_translation('inspiration_question', 'question' || base.rn, p_lang),
            base.question_text
        ) as question_text,
        COALESCE(
            public.get_translation('inspiration_help', 'question' || base.rn, p_lang),
            base.help_text
        ) as help_text,
        base.sequence_number
    FROM base
    ORDER BY base.sequence_number;
END $$;

GRANT EXECUTE ON FUNCTION get_inspiration_questions_i18n(text) TO authenticated;

-- Helper to get module title
CREATE OR REPLACE FUNCTION get_inspiration_module_title_i18n(p_lang text)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_title text;
BEGIN
    SELECT text INTO v_title
    FROM content_translations
    WHERE resource_type = 'inspiration_module' 
    AND resource_key = 'title'
    AND lang = p_lang;
    
    RETURN COALESCE(v_title, 'My Inspiration');
END $$;

GRANT EXECUTE ON FUNCTION get_inspiration_module_title_i18n(text) TO authenticated;
