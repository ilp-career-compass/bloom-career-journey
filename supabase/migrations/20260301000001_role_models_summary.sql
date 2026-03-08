-- Migration: Create Role Models Summary Questions
-- This script sets up the summary questions for the "My Role Models" assessment.

-- 1. Create Role Models Summary Questions Table
CREATE TABLE IF NOT EXISTS role_models_summary_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    help_text TEXT,
    sequence_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE role_models_summary_questions ENABLE ROW LEVEL SECURITY;

-- Policy for reading
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON role_models_summary_questions;
CREATE POLICY "Enable read access for authenticated users" ON role_models_summary_questions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Clean up existing summary questions
DELETE FROM role_models_summary_questions;

-- Insert the single summary question
INSERT INTO role_models_summary_questions (question_text, help_text, sequence_number) VALUES
('Write 5 to 10 questions you would like to ask your role model for career guidance.', NULL, 1);

-- 2. Update Translations in content_translations
DELETE FROM content_translations WHERE resource_type = 'role_models_summary_question';

-- Summary Question Translations
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('role_models_summary_question', 'question1', 'ta', 'உங்கள் முன்மாதிரி நபரிடம் உங்கள் தொழில் வழிகாட்டலுக்காக நீங்கள் கேட்க விரும்பும் 5 முதல் 10 கேள்விகளை எழுதுங்கள்.'),
('role_models_summary_question', 'question1', 'kn', 'ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳೊಂದಿಗೆ ನಿಮ್ಮ ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ನೀವು ಕೇಳಲು ಬಯಸುವ 5 ರಿಂದ 10 ಪ್ರಶ್ನೆಗಳನ್ನು ಬರೆಯಿರಿ.');

-- 3. Create/Update RPC for fetching summary questions
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
            (SELECT text FROM content_translations WHERE resource_type = 'role_models_summary_question' AND resource_key = 'question' || q.sequence_number AND lang = p_lang LIMIT 1),
            q.question_text
        ) as text,
        q.help_text,
        q.sequence_number
    FROM role_models_summary_questions q
    WHERE q.is_active = true
    ORDER BY q.sequence_number;
END $$;

GRANT EXECUTE ON FUNCTION get_role_models_summary_questions_i18n(text) TO authenticated;

-- 4. Update assessment_summary_templates
-- Ensure role_models has the correct summary questions structure
DO $$
BEGIN
    UPDATE assessment_summary_templates
    SET summary_questions = jsonb_build_object(
        'en', jsonb_build_object('question1', 'Write 5 to 10 questions you would like to ask your role model for career guidance.'),
        'ta', jsonb_build_object('question1', 'உங்கள் முன்மாதிரி நபரிடம் உங்கள் தொழில் வழிகாட்டலுக்காக நீங்கள் கேட்க விரும்பும் 5 முதல் 10 கேள்விகளை எழுதுங்கள்.'),
        'kn', jsonb_build_object('question1', 'ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳೊಂದಿಗೆ ನಿಮ್ಮ ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ನೀವು ಕೇಳಲು ಬಯಸುವ 5 ರಿಂದ 10 ಪ್ರಶ್ನೆಗಳನ್ನು ಬರೆಯಿರಿ.')
    )
    WHERE assessment_type = 'role_models';
    
    -- If no record exists, insert it
    IF NOT FOUND THEN
        INSERT INTO assessment_summary_templates (assessment_type, title, summary_questions)
        VALUES (
            'role_models',
            'Summary: My future plan',
            jsonb_build_object(
                'en', jsonb_build_object('question1', 'Write 5 to 10 questions you would like to ask your role model for career guidance.'),
                'ta', jsonb_build_object('question1', 'உங்கள் முன்மாதிரி நபரிடம் உங்கள் தொழில் வழிகாட்டலுக்காக நீங்கள் கேட்க விரும்பும் 5 முதல் 10 கேள்ವிகளை எழுதுங்கள்.'),
                'kn', jsonb_build_object('question1', 'ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳೊಂದಿಗೆ ನಿಮ್ಮ ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ನೀವು ಕೇಳಲು ಬಯಸುವ 5 ರಿಂದ 10 ಪ್ರಶ್ನೆಗಳನ್ನು ಬರೆಯಿರಿ.')
            )
        );
    END IF;
END $$;
