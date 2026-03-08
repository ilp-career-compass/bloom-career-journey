-- 1. Create School Learning Summary Questions Table if it doesn't exist
CREATE TABLE IF NOT EXISTS school_learning_summary_questions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sequence_number integer NOT NULL,
    question_text text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure section_header column exists in case the table was created previously without it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'school_learning_summary_questions'
        AND column_name = 'section_header'
    ) THEN
        ALTER TABLE school_learning_summary_questions ADD COLUMN section_header text;
    END IF;
END $$;

-- 2. Update School Learning Summary Questions (for the Manual UI Tab)
TRUNCATE school_learning_summary_questions;
INSERT INTO school_learning_summary_questions (sequence_number, section_header, question_text) VALUES
(1, 'My future plan', 'Subjects I like'),
(2, NULL, 'Careers I can pursue based on the subjects I like'),
(3, NULL, 'Subjects I do not like'),
(4, NULL, 'Careers I can pursue if I make progress in the subjects I do not like'),
(5, NULL, 'Other activities / areas in which I perform well along with academic subjects'),
(6, NULL, 'If I improve these skills, it will help me in choosing my job / career.');

-- School Learning Translations
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('school_learning_summary_question', 'header1', 'ta', 'என் எதிர்கால திட்டம்'),
('school_learning_summary_question', 'question1', 'ta', '1.நான் விரும்பும் பாடங்கள்'),
('school_learning_summary_question', 'question2', 'ta', '2.நான் விரும்பும் பாடங்களின் மூலம் நான் அடையக்கூடிய தொழில்கள்'),
('school_learning_summary_question', 'question3', 'ta', '3.நான் விரும்பாத பாடங்கள்'),
('school_learning_summary_question', 'question4', 'ta', '4.நான் விரும்பாத பாடங்களில் முன்னேற்றம் பெற்றால் நான் அடையக்கூடிய தொழில்கள்'),
('school_learning_summary_question', 'question5', 'ta', '5.பாடப்பிரிவுகளுடன் சேர்த்து, நான் சிறப்பாக சாதனை புரியும் பிற செயல்பாடுகள் / விஷயங்கள்'),
('school_learning_summary_question', 'question6', 'ta', '6.இந்த திறன்களில் நான் மேம்பட்டால், என் வேலை / தொழில் தேர்வுக்கு உதவியாக இருக்கும்.'),

('school_learning_summary_question', 'header1', 'kn', 'ನನ್ನ ಮುಂದಿನ ಯೋಜನೆ'),
('school_learning_summary_question', 'question1', 'kn', 'ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳು'),
('school_learning_summary_question', 'question2', 'kn', 'ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳಿಂದ ನಾನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು'),
('school_learning_summary_question', 'question3', 'kn', 'ನಾನು ಇಷ್ಟಪಡದ ವಿಷಯಗಳು'),
('school_learning_summary_question', 'question4', 'kn', 'ಇಷ್ಟಪಡದ ವಿಷಯಗಳಲ್ಲಿ ನಾನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು'),
('school_learning_summary_question', 'question5', 'kn', 'ಪಠ್ಯ ವಿಷಯಗಳ ಜೊತೆಗೆ, ನಾನು ಉತ್ತಮ ಸಾಧನೆ ಮಾಡುವ ಇತರ ಚಟುವಟಿಕೆಗಳು / ವಿಷಯಗಳು'),
('school_learning_summary_question', 'question6', 'kn', 'ನಾನು ಈ ಕೌಶಲ್ಯಗಳನ್ನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ನನ್ನ ಕೆಲಸ / ವೃತ್ತಿಯ ಆಯ್ಕೆಗೆ ಸಹಾಯವಾಗುತ್ತದೆ.')
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- 3. Create or Replace RPC function for fetching translations
DROP FUNCTION IF EXISTS get_school_learning_summary_questions_i18n(text);

CREATE OR REPLACE FUNCTION get_school_learning_summary_questions_i18n(p_lang text)
RETURNS TABLE (
    id uuid,
    sequence_number integer,
    section_header text,
    question_text text,
    translated_header text,
    translated_text text
) AS $$
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
        AND tq.resource_key = 'question' || q.sequence_number 
        AND tq.lang = p_lang
    ORDER BY q.sequence_number;
END;
$$ LANGUAGE plpgsql;

-- 4. AI Template Update for My School Learning
INSERT INTO assessment_summary_templates (assessment_type, title, summary_questions) VALUES
('school_learning', 'Summary: My School Learning', 
 '{
   "en": {
     "title": "My future plan",
     "question1": "Subjects I like",
     "question2": "Careers I can pursue based on the subjects I like",
     "question3": "Subjects I do not like",
     "question4": "Careers I can pursue if I make progress in the subjects I do not like",
     "question5": "Other activities / areas in which I perform well along with academic subjects",
     "question6": "If I improve these skills, it will help me in choosing my job / career."
   },
   "ta": {
     "title": "என் எதிர்கால திட்டம்",
     "question1": "1.நான் விரும்பும் பாடங்கள்",
     "question2": "2.நான் விரும்பும் பாடங்களின் மூலம் நான் அடையக்கூடிய தொழில்கள்",
     "question3": "3.நான் விரும்பாத பாடங்கள்",
     "question4": "4.நான் விரும்பாத பாடங்களில் முன்னேற்றம் பெற்றால் நான் அடையக்கூடிய தொழில்கள்",
     "question5": "5.பாடப்பிரிவுகளுடன் சேர்த்து, நான் சிறப்பாக சாதனை புரியும் பிற செயல்பாடுகள் / விஷயங்கள்",
     "question6": "6.இந்த திறன்களில் நான் மேம்பட்டால், என் வேலை / தொழில் தேர்வுக்கு உதவியாக இருக்கும்."
   },
   "kn": {
     "title": "ನನ್ನ ಮುಂದಿನ ಯೋಜನೆ",
     "question1": "ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳು",
     "question2": "ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳಿಂದ ನಾನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು",
     "question3": "ನಾನು ಇಷ್ಟಪಡದ ವಿಷಯಗಳು",
     "question4": "ಇಷ್ಟಪಡದ ವಿಷಯಗಳಲ್ಲಿ ನಾನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು",
     "question5": "ಪಠ್ಯ ವಿಷಯಗಳ ಜೊತೆಗೆ, ನಾನು ಉತ್ತಮ ಸಾಧನೆ ಮಾಡುವ ಇತರ ಚಟುವಟಿಕೆಗಳು / ವಿಷಯಗಳು",
     "question6": "ನಾನು ಈ ಕೌಶಲ್ಯಗಳನ್ನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ನನ್ನ ಕೆಲಸ / ವೃತ್ತಿಯ ಆಯ್ಕೆಗೆ ಸಹಾಯವಾಗುತ್ತದೆ."
   }
 }'::jsonb)
ON CONFLICT (assessment_type) DO UPDATE SET title = EXCLUDED.title, summary_questions = EXCLUDED.summary_questions, updated_at = NOW();
