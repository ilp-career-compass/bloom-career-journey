-- Migration: Update Kannada content for Career Guidance Tools Assessment

-- 1. Insert Module Title & Intro
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('career_guidance_tools_module', 'title', 'kn', 'ವೃತ್ತಿ ಮರ್ಗರ್ಶನ ಪರಿಕರಗಳು ಮತ್ತು ಅವುಗಳಲ್ಲಿ ಮಾಹಿತಿ ಹುಡುಕಾಟ (ಚರ್ಟ್, ವೃತ್ತಿ ಕೈಪಿಡಿ, ವೆಬ್ಸೈಟ್, ಮೊಬೈಲ್ ಆಪ್ ಮತ್ತು ವಾಟ್ಸ್ಆಪ್ ಚಾಟ್ಬಾಟ್)', NOW()),
('career_guidance_tools_module', 'intro', 'kn', 'ಕೆರಿಯರ್ ಚರ್ಟ್, ವೃತ್ತಿ ಕೈಪಿಡಿ, ವೆಬ್ಸೈಟ್ಗೆ, ಮೊಬೈಲ್ ಆಪ್ ಮತ್ತು ವಾಟ್ಸ್ಆಪ್ ಚಾಟ್ಬಾಟ್ ಇವುಗಳ ಕುರಿತು ಶಿಕ್ಷಕರು ನಿಮಗೆ ಮರ್ಗರ್ಶನ ನೀಡಿದ ನಂತರ ನೀವು ಈ ಚಟುವಟಿಕೆಯಲ್ಲಿನ ಕೆಳಗಿನ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ.', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 2. Insert Question Translations
-- There are 7 questions in the table `career_guidance_tools_questions`.
-- We map them sequentially based on the order in the migration 20250201000013...
-- Q1: Reflect on awareness...
-- Q2: List 5 new career options...
-- Q3: List 2 careers with multiple paths...
-- Q4: Admission process...
-- Q5: ILP website info...
-- Q6: Mobile app yes/no...
-- Q7: Chatbot number...

-- We need to fetch the IDs or just rely on the RPC joining by sequence number if we can't easily get IDs.
-- The RPC created in 20250201000013 uses `id` from the table.
-- Ideally we should use resource_key as 'question1', 'question2' etc. and update the RPC to join on that if we had a stable key.
-- But the table `career_guidance_tools_questions` has `id` (uuid) and `sequence_number`.
-- The best approach for the RPC is to join on `sequence_number` effectively, OR we add a `question_key` column to the table.
-- However, since I cannot easily modify the table structure without risking data issues, I will assume the RPC logic I will write
-- can match based on `sequence_number` if I use that as the key, OR I can map the translation `resource_key` to 'question' + sequence_number.

-- Let's use 'question1', 'question2' as resource_key for translations.

INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('career_guidance_tools_question', 'question1', 'kn', 'ಕೆರಿಯರ್ ಚರ್ಟ್ ಮತ್ತು ವೃತ್ತಿ ಕೈಪಿಡಿಯನ್ನು ನೋಡುವುದಕ್ಕಿಂತ ಮುಂಚೆ ನಿಮಗೆ (ಆಯ್ಕೆ ಮಾಡಿಕೊಳ್ಳಲು) ಇಷ್ಟೆಲ್ಲ ವಿಭಿನ್ನ ವೃತ್ತಿ/ ಕರ್ಸ್ ಗಳಿವೆ ಎಂಬುದು ತಿಳಿದಿತ್ತೇ?', NOW()),
('career_guidance_tools_question', 'question2', 'kn', 'ನಿಮಗೆ ಈ ಮೊದಲು ತಿಳಿದಿರದ ಮತ್ತು ವೃತ್ತಿ ಮರ್ಗರ್ಶನ ತರಗತಿಗಳು ಹಾಗು ಚಟುವಟಿಕೆ ನಂತರ ತಿಳಿದ 5 ಹೊಸ ವೃತ್ತಿಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ.', NOW()),
('career_guidance_tools_question', 'question3', 'kn', 'ಕೆರಿಯರ್ ಚಾಟ್೯ ಲ್ಲಿ ಒಂದಕ್ಕಿAತ ಹೆಚ್ಚು ರೀತಿಯಲ್ಲಿ ತಲುಪಬಹುದಾದ 2 ವೃತ್ತಿಗಳನ್ನು ಪಟ್ಟಿಮಾಡಿ. (ಉದಾ: ನೀವು ವಕೀಲರಾಗಲು ಆಗಲು ಪಿಯುಸಿಯಲ್ಲಿ ಕಲಾ ವಿಭಾಗ ತೆಗೆದುಕೊಂಡು B.A ಮತ್ತು LLB ಮಾಡಿ ವಕೀಲರಾಗಬಹುದು ಅಥವಾ ಪಿಯುಸಿಯಲ್ಲಿ ವಿಜ್ಞಾನ ತೆಗೆದುಕೊಂಡು ಕೂಡ, B.Sc ಮತ್ತು LLB ಮಾಡುವ ಮೂಲಕ ವಕೀಲರಾಗಬಹುದು)', NOW()),
('career_guidance_tools_question', 'question4', 'kn', 'ನಿಮ್ಮ ಆಸಕ್ತಿಯ ಯಾವುದೇ ಒಂದು ಉದ್ಯೋಗ/ವೃತ್ತಿಗಾಗಿ, ಕೆರಿಯರ್ ಚರ್ಟ್ ಮತ್ತು ವೃತ್ತಿ ಮರ್ಗರ್ಶನ ಕೈಪಿಡಿ ನೋಡಿ, ಅಗತ್ಯವಿರುವ ಶೈಕ್ಷಣಿಕ ರ್ಹತೆ, ಉದ್ಯೋಗ ಅವಕಾಶಗಳು, ಅದಕ್ಕೆ ಬೇಕಾದ ಕೌಶಲ್ಯಗಳು ಮತ್ತು ಮುಂದಿನ ಶಿಕ್ಷಣ/ಕರ್ಸ್ ಗಳಿಗೆ ಪ್ರವೇಶ ಪಡೆಯಲು ಇರುವ ಪ್ರಕ್ರಿಯೆಯನ್ನು ಅನುಕ್ರಮವಾಗಿ ಬರೆಯಿರಿ.', NOW()),
('career_guidance_tools_question', 'question5', 'kn', 'ILPಯ ವೆಬ್ಸೈಟ್ಗೆ ಭೇಟಿ ನೀಡಿ, ವೃತ್ತಿ ಮರ್ಗರ್ಶನಕ್ಕೆ ಅಗತ್ಯವಿರುವ ಎಲ್ಲಾ ಮಾಹಿತಿಯನ್ನು ಪಟ್ಟಿ ಮಾಡಿ.', NOW()),
('career_guidance_tools_question', 'question6', 'kn', 'ILPಯ ಮೊಬೈಲ್ ಅಪ್ಲಿಕೇಶನ್ ಆಂಡ್ರಾಯ್ಡ್ ಪ್ಲೇಸ್ಟೋರ್ನಲ್ಲಿ ಲಭ್ಯವಿದೆ', NOW()), -- Adjusted slightly as it is a checkbox label "Available in store - Yes/No"
('career_guidance_tools_question', 'question7', 'kn', 'ILPಯ ವಾಟ್ಸ್ಆಪ್ ಚಾಟ್ಬಾಟ್ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ಬರೆಯಿರಿ.', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 3. Insert Help Text Translations
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('career_guidance_tools_help', 'question1', 'kn', 'ವೃತ್ತಿ ಸಂಪನ್ಮೂಲಗಳನ್ನು ಬಳಕೆ ಮಾಡುವುದಕ್ಕಿಂತ ಮುಂಚೆ, ಹಲವು ವೃತ್ತಿಗಳು ಮತ್ತು ಕರ್ಸ್ಗಳಿವೆ ಎಂಬುದು ನಿಮಗೆ ತಿಳಿದಿತ್ತೇ?', NOW()),
('career_guidance_tools_help', 'question2', 'kn', 'ವೃತ್ತಿ ಮರ್ಗರ್ಶನ ತರಗತಿಯ ನಂತರ ನೀವು ತಿಳಿದುಕೊಂಡ ೫ ವೃತ್ತಿಗಳ ಹೆಸರನ್ನು ಬರೆಯಿರಿ.', NOW()),
('career_guidance_tools_help', 'question3', 'kn', 'ಬೇರೆ, ಬೇರೆ ಶಿಕ್ಷಣದ ಮೂಲಕ ಕೂಡ ಹೋಗಬಹುದಾದ ಉದ್ಯೋಗಗಳನ್ನು ಬರೆಯಿರಿ. ಉದಾಹರಣೆಗೆ : PUC ವಿಜ್ಞಾನ, D.Ed. ಅಥವಾ PUC ಕಲಾ D.Ed. ಮಾಡಿ ಕೂಡ ಪ್ರಾಥಮಿಕ ಶಾಲೆ ಶಿಕ್ಷಕರಾಗಬಹುದು.', NOW()),
('career_guidance_tools_help', 'question4', 'kn', 'ನಿಮ್ಮ ವೃತ್ತಿಯನ್ನು ಪಡೆಯುವುದು ಹೇಗೆ: ಕರ್ಸ್ಗಳು -> ಉದ್ಯೋಗ -> ಕೌಶಲಗಳು -> ಪ್ರವೇಶ ಪರೀಕ್ಷೆ', NOW()),
('career_guidance_tools_help', 'question5', 'kn', 'ILPವೆಬ್ಸೈಟ್ಗೆ ಭೇಟಿ ನೀಡಿ — ಅಗತ್ಯವಿರುವ ಮಾಹಿತಿ ಪಡೆಯಿರಿ.', NOW()),
('career_guidance_tools_help', 'question6', 'kn', 'ILPಯ ಮೊಬೈಲ್ ಅಪ್ಲಿಕೇಶನ್ ಎಲ್ಲಿ ಲಭ್ಯವಿದೆ ಎಂಬುದು ನಿಮಗೆ ತಿಳಿದಿದೆಯೇ ಉತ್ತರಿಸಿ', NOW())
-- Q7 has no help text update
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();


-- 4. Update RPC to return localized content
-- We will join content_translations based on resource_key = 'question' || sequence_number
DROP FUNCTION IF EXISTS get_career_guidance_tools_questions(text);
CREATE OR REPLACE FUNCTION get_career_guidance_tools_questions(p_lang text DEFAULT 'en')
RETURNS TABLE (
    id UUID,
    question_text TEXT,
    question_type TEXT,
    help_text TEXT,
    sequence_number INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        COALESCE(t.text, c.question_text) as question_text,
        c.question_type,
        COALESCE(th.text, c.help_text) as help_text,
        c.sequence_number
    FROM career_guidance_tools_questions c
    LEFT JOIN content_translations t ON t.resource_type = 'career_guidance_tools_question' 
        AND t.resource_key = 'question' || c.sequence_number 
        AND t.lang = p_lang
    LEFT JOIN content_translations th ON th.resource_type = 'career_guidance_tools_help' 
        AND th.resource_key = 'question' || c.sequence_number 
        AND th.lang = p_lang
    WHERE c.is_active = true
    ORDER BY c.sequence_number;
END $$;

GRANT EXECUTE ON FUNCTION get_career_guidance_tools_questions(text) TO authenticated;

-- Verification
DO $$
DECLARE
    q_count INTEGER;
    h_count INTEGER;
    mod_title TEXT;
BEGIN
    SELECT COUNT(*) INTO q_count FROM content_translations WHERE resource_type = 'career_guidance_tools_question' AND lang = 'kn';
    SELECT COUNT(*) INTO h_count FROM content_translations WHERE resource_type = 'career_guidance_tools_help' AND lang = 'kn';
    SELECT text INTO mod_title FROM content_translations WHERE resource_type = 'career_guidance_tools_module' AND resource_key = 'title' AND lang = 'kn';

    RAISE NOTICE 'Career Guidance Tools Migration Complete:';
    RAISE NOTICE '- Questions Updated: %', q_count;
    RAISE NOTICE '- Help Texts Updated: %', h_count;
    RAISE NOTICE '- Module Title: %', mod_title;
END $$;
