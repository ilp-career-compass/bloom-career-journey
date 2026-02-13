-- Migration: Update Kannada content for My Role Models Assessment
-- Updates Module Title, Intro, Tab Headings, Questions (1-13), Help Text (1-13), Summary

-- 1. Update Module Title, Intro & Tab Headings
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('role_models_module', 'title', 'kn', 'ನನ್ನ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳು', NOW()),
('role_models_module', 'intro', 'kn', 'ನಾವೆಲ್ಲರೂ ಹಲವಾರು ವ್ಯಕ್ತಿಗಳಿಂದ ಪ್ರೇರಣೆ ಪಡೆದುಕೊಂಡಿರುತ್ತೇವೆ. ಅವರಲ್ಲಿರುವ ವಿಶಿಷ್ಟ ಗುಣಗಳಿಂದಾಗಿ ಅವರನ್ನು ನಾವು ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳೆಂದು ಭಾವಿಸುತ್ತೇವೆ. ಒಬ್ಬರು ಅಥವಾ ಹಲವರನ್ನು ನಾವು, ನಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳೆಂದು ಭಾವಿಸಿರಬಹುದು. ಇಂತಹ ವ್ಯಕ್ತಿಗಳ ಬಗ್ಗೆ ಹೆಚ್ಚಿನ ವಿಚಾರ ತಿಳಿದಾಗ ನಮ್ಮ ವ್ಯಕ್ತಿತ್ವ ರೂಪಿಸಿಕೊಳ್ಳಲು ಇನ್ನಷ್ಟು ಸ್ಪೂರ್ತಿ ಸಿಗುತ್ತದೆ. ಈ ಚಟುವಟಿಕೆಯ ಮೂಲಕ ಅಂತಹವರ ಬಗ್ಗೆ ತಿಳಿದುಕೊಳ್ಳುವ ಪ್ರಯತ್ನ ಮಾಡೋಣ.', NOW()),
('role_models_module', 'tab_rm1', 'kn', 'ಆದರ್ಶ ವ್ಯಕ್ತಿ 1: ನಮಗೆ ಹತ್ತಿರದ ಪರಿಚಿತ ವ್ಯಕ್ತಿ', NOW()),
('role_models_module', 'tab_rm2', 'kn', 'ಆದರ್ಶ ವ್ಯಕ್ತಿ 2: ಪರಿಚಿತ ವ್ಯಕ್ತಿ', NOW()),
('role_models_module', 'tab_rm3', 'kn', 'ಆದರ್ಶ ವ್ಯಕ್ತಿ 3: ಪರಿಚಿತ/ಪ್ರಸಿದ್ಧ ವ್ಯಕ್ತಿ', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 2. Update Questions (1-13)
-- Note: frontend uses 'rm_q1'...'rm_q13'
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('role_models_questions', 'rm_q1', 'kn', 'ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳ ಹೆಸರು', NOW()),
('role_models_questions', 'rm_q2', 'kn', 'ಇವರು ನಿಮ್ಮ ಕುಟುಂಬದವರೇ? ಸಂಬಂಧಿಕರೆ? ಪರಿಚಯದವರೇ? ತಿಳಿಸಿ', NOW()),
('role_models_questions', 'rm_q3', 'kn', 'ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳಲ್ಲಿ ನೀವು ಮೆಚ್ಚುವ ಗುಣಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ ಹಾಗೂ ಅವರು ನಿಮಗೆ ವಿಶೇಷವಾಗಿ ಕಾಣುವ ಕಾರಣ ಹಂಚಿಕೊಳ್ಳಿ.', NOW()),
('role_models_questions', 'rm_q4', 'kn', 'ಇವರು ಯಾವ ಕೆಲಸ/ ಉದ್ಯೋಗ ಮಾಡುತ್ತಿದ್ದಾರೆ?', NOW()),
('role_models_questions', 'rm_q5', 'kn', 'ಇವರ ಪ್ರೇರಣೆಯಿಂದ ನಿಮ್ಮಲ್ಲಿರುವ ಯಾವ ಕೌಶಲ್ಯ ಅಥವಾ ಪ್ರತಿಭೆಯನ್ನು ಉತ್ತಮ ಪಡಿಸಿಕೊಳ್ಳಲು ಬಯಸುತ್ತೀರಿ?', NOW()),
('role_models_questions', 'rm_q6', 'kn', 'ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳೊಂದಿಗೆ ನಿಮ್ಮ ಆಯ್ಕೆಯ ವೃತ್ತಿ/ ಉದ್ಯೋಗದ ಬಗ್ಗೆ ಚರ್ಚಿಸಿದಿರಾ? ಏನನ್ನು ಚರ್ಚಿಸಿದಿರಿ?', NOW()),
('role_models_questions', 'rm_q7', 'kn', 'ಇಲ್ಲ ಎಂದರೆ, ಅವರೊಂದಿಗೆ ನಿಮ್ಮ ಕನಸಿನ ಯೋಜನೆ ಬಗ್ಗೆ ಅವರ ಅಭಿಪ್ರಾಯ ಪಡೆಯುವ ಯೋಚನೆ ಮಾಡಿದ್ದೀರಾ?', NOW()),
('role_models_questions', 'rm_q8', 'kn', 'ನಿಮ್ಮ ಕನಸಿನ ಉದ್ಯೋಗ/ವೃತ್ತಿಯ ಬಗ್ಗೆ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳು ಏನು ಹೇಳುತ್ತಾರೆ?', NOW()),
('role_models_questions', 'rm_q9', 'kn', 'ಯಾವುದಾದರೂ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳು ನಿಮ್ಮ ಕನಸಿನ ವೃತ್ತಿಯ ಆಯ್ಕೆಯಲ್ಲಿ ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಹುದೆ?', NOW()),
('role_models_questions', 'rm_q10', 'kn', 'ಹೌದಾದಲ್ಲಿ, ನೀವು ಯಾವ ರೀತಿಯ ಸಹಾಯವನ್ನು ನಿರೀಕ್ಷಿಸುತ್ತೀರಿ?', NOW()),
('role_models_questions', 'rm_q11', 'kn', 'ಮೇಲಿನ ಪ್ರಶ್ನೆಗಳ ಹೊರತಾಗಿ ಏನನ್ನಾದರೂ ತಿಳಿಸಲು ಬಯಸುವಿರಾ?', NOW()),
('role_models_questions', 'rm_q12', 'kn', 'ನಿಮ್ಮ ಹಾಗೂ ನೀವು ಆದರ್ಶವೆಂದು ಭಾವಿಸಿದ ಈ ಮೇಲಿನ ವ್ಯಕ್ತಿಗಳ ವ್ಯಕ್ತಿತ್ವದಲ್ಲಿರುವ ಹೋಲಿಕೆ ಅಥವಾ ಸಾಮ್ಯತೆಯನ್ನು ಗಮನಿಸಿದ್ದೀರಾ? ಏನದು?', NOW()),
('role_models_questions', 'rm_q13', 'kn', 'ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳ ಗುಣಗಳನ್ನು ನಿಮ್ಮ ಜೀವನದಲ್ಲಿ ಅಳವಡಿಸಿಕೊಳ್ಳಲು ನೀವು ಹೇಗೆ ಪ್ರಯತ್ನ ಮಾಡುವಿರಿ?', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 3. Update Help Text (1-13)
-- Note: frontend uses 'rm_help_q1'...'rm_help_q13'.
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('role_models_help', 'rm_help_q1', 'kn', 'ನಿಮ್ಮ ಮೊದಲ ಮಾದರಿ ವ್ಯಕ್ತಿಯ (Role model) ಹೆಸರು ಮತ್ತು ಅವರು ನಿಮಗೆ ಹೇಗೆ ಸಂಬಂಧಿಕರು (ಪೋಷಕರು, ಶಿಕ್ಷಕರು, ಸಂಬಂಧಿಕರು, ಇತ್ಯಾದಿ) ಎಂದು ಬರೆಯಿರಿ.', NOW()),
('role_models_help', 'rm_help_q2', 'kn', 'ಆ ವ್ಯಕ್ತಿಯು ನಿಮಗೆ ಹೇಗೆ ಸಂಬಂಧಪಟ್ಟವರು ಎಂದು ತಿಳಿಸಿ.', NOW()),
('role_models_help', 'rm_help_q3', 'kn', 'ಕಠಿಣ ಪರಿಶ್ರಮ, ಪ್ರಾಮಾಣಿಕತೆ ಮತ್ತು ಧೈರ್ಯದಂತಹ ಗುಣಗಳ ಬಗ್ಗೆ ಯೋಚಿಸಿ.', NOW()),
('role_models_help', 'rm_help_q4', 'kn', 'ಅವರ ಉದ್ಯೋಗ ಅಥವಾ ವೃತ್ತಿಯ ಬಗ್ಗೆ ಬರೆಯಿರಿ.', NOW()),
('role_models_help', 'rm_help_q5', 'kn', 'ಅವರಲ್ಲಿರುವ - ಅಧ್ಯಯನ, ನಾಯಕತ್ವ ಅಥವಾ ಸಂವಹನದಂತಹ ಕೌಶಲಗಳ ಬಗ್ಗೆ ಯೋಚಿಸಿ, ಬರೆಯಿರಿ.', NOW()),
('role_models_help', 'rm_help_q6', 'kn', 'ಅವರೊಂದಿಗೆ ನೀವು ಮಾಡಲು ಬಯಸುವ ಉದ್ಯೋಗ, ಶಿಕ್ಷಣ ಅಥವಾ ಭವಿಷ್ಯದ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಚರ್ಚಿಸಿದ್ದೀರಾ ಎಂದು ಬರೆಯಿರಿ.', NOW()),
('role_models_help', 'rm_help_q7', 'kn', 'ನಿಮ್ಮ ಕನಸು ಅಥವಾ ಭವಿಷ್ಯದ ಯೋಜನೆಯ ಬಗ್ಗೆ ಅವರು ಏನು ಹೇಳುತ್ತಾರೆ ಎಂದು ಬರೆಯಿರಿ.', NOW()),
('role_models_help', 'rm_help_q8', 'kn', 'ಅವರು ನಿಮ್ಮನ್ನು ಪ್ರೋತ್ಸಾಹಿಸಿದರೇ ಅಥವಾ ಸಲಹೆ ನೀಡಿದರೇ ಎಂದು ತಿಳಿಸಿ.', NOW()),
('role_models_help', 'rm_help_q9', 'kn', 'ನಿಮಗೆ ಯಾರು ಸಹಾಯ ಮಾಡಬಹುದು ಮತ್ತು ಅವರು ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು ಎಂದು ಬರೆಯಿರಿ.', NOW()),
('role_models_help', 'rm_help_q10', 'kn', 'ಶಿಕ್ಷಣ, ತರಬೇತಿ ಅಥವಾ ಮಾರ್ಗದರ್ಶನ ಇತ್ಯಾದಿ. ಯಾವುದು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ', NOW()),
('role_models_help', 'rm_help_q11', 'kn', 'ನೀವು ನಿಮ್ಮ ಇನ್ನಿತರ ಆಲೋಚನೆಗಳು ಅಥವಾ ಅಭಿಪ್ರಾಯಗಳನ್ನು ಬರೆಯಬಹುದು.', NOW()),
('role_models_help', 'rm_help_q12', 'kn', 'ನಿಮ್ಮ ಮತ್ತು ನಿಮ್ಮ ಮಾದರಿ ವ್ಯಕ್ತಿಯ ನಡುವಿನ ಸಮಾನ ಗುಣಗಳು, ಹವ್ಯಾಸಗಳು ಅಥವಾ ಆಲೋಚನೆಗಳ ಬಗ್ಗೆ ಯೋಚಿಸಿ ಮತ್ತು ಅವುಗಳನ್ನು ಬರೆಯಿರಿ.', NOW()),
('role_models_help', 'rm_help_q13', 'kn', 'ನಿಮ್ಮ ಮಾದರಿ ವ್ಯಕ್ತಿಯ ಒಳ್ಳೆಯ ಹವ್ಯಾಸಗಳು, ಶಿಸ್ತು ಮತ್ತು ಕಠಿಣ ಪರಿಶ್ರಮವನ್ನು ನಿಮ್ಮ ಜೀವನದಲ್ಲಿ ನೀವು ಹೇಗೆ ಅನುಸರಿಸುತ್ತೀರಿ ಎಂದು ಬರೆಯಿರಿ.', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 4. Update Summary Content
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('role_models_summary_question', 'title', 'kn', 'ಸಾರಾಂಶ: ನನ್ನ ಮುಂದಿನ ಯೋಜನೆ', NOW()),
('role_models_summary_question', 'question1', 'kn', 'ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳೊಂದಿಗೆ ನಿಮ್ಮ ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ನೀವು ಕೇಳಲು ಬಯಸುವ ೫ ರಿಂದ 10 ಪ್ರಶ್ನೆಗಳನ್ನು ಬರೆಯಿರಿ.', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- Verification
DO $$
DECLARE
    q_count INTEGER;
    h_count INTEGER;
    s_count INTEGER;
    mod_title TEXT;
BEGIN
    SELECT COUNT(*) INTO q_count FROM content_translations WHERE resource_type = 'role_models_questions' AND lang = 'kn';
    SELECT COUNT(*) INTO h_count FROM content_translations WHERE resource_type = 'role_models_help' AND lang = 'kn';
    SELECT COUNT(*) INTO s_count FROM content_translations WHERE resource_type = 'role_models_summary_question' AND lang = 'kn';
    SELECT text INTO mod_title FROM content_translations WHERE resource_type = 'role_models_module' AND resource_key = 'title' AND lang = 'kn';

    RAISE NOTICE 'Role Models Migration Complete:';
    RAISE NOTICE '- Questions Updated: %', q_count;
    RAISE NOTICE '- Help Texts Updated: %', h_count;
    RAISE NOTICE '- Summary Questions Updated: %', s_count;
    RAISE NOTICE '- Module Title: %', mod_title;
END $$;
