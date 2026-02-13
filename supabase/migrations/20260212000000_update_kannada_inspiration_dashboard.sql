-- Migration: Update Kannada content for Inspiration Dashboard and Assessment
-- Updates Title (Intro), Subtitle (Instructions), Questions, Help Text, and Summary

-- 1. Update Module Intro and Instructions (Title/Subtitle)
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('inspiration_module', 'intro', 'kn', 'ಪ್ರತಿಯೊಬ್ಬರೂ ಬೇರೆ, ಬೇರೆ ವಿಷಯಗಳಿಂದ ಪ್ರೇರಣೆ/ಸ್ಪರ್ತಿ ಪಡೆಯುತ್ತೇವೆ. ಈ ಪ್ರೇರಣೆ/ಸ್ಫರ್ತಿಗಳಿಂದ ನಾವು ಯಾವ ರೀತಿಯ ವ್ಯಕ್ತಿಯಾಗಲು ಬಯಸುತ್ತೇವೆ ಮತ್ತು ನಮ್ಮ ವೃತ್ತಿಜೀವನದಲ್ಲಿ ಅನುಸರಿಸಲು ಬಯಸುವ ಮೌಲ್ಯಗಳೇನು ಎಂಬ ಬಗ್ಗೆ ಅರಿವನ್ನು ಪಡೆಯುತ್ತೇವೆ. ನಮ್ಮನ್ನು ಪ್ರೇರೇಪಿಸುವ ಅಂಶವು, ನಾವು ಇಷ್ಟಪಡುವ ಗುಣಗಳು ಮತ್ತು ಮೌಲ್ಯಗಳನ್ನು ಪ್ರತಿಬಿಂಬಿಸುತ್ತದೆ.', NOW()),
('inspiration_module', 'watch_and_answer', 'kn', 'ಸೂಚನೆ: ಶಿಕ್ಷಕರ ಮರ್ಗರ್ಶನ ಮತ್ತು ವಿವರಣೆ ನಂತರ, ವೀಡಿಯೋ/ಆಡಿಯೋ ನೋಡಿದ/ಕೇಳಿದ ನಂತರ ಯೋಚಿಸಿ ಪ್ರಶ್ನೆಗಳಿಗೆ ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ಬರೆಯಿರಿ.', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 2. Update Questions (1-10)
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('inspiration_question', 'question1', 'kn', 'ಈ ವೀಡಿಯೋ / ಆಡಿಯೋದಲ್ಲಿ ನಿಮಗೆ ಹೆಚ್ಚು ಇಷ್ಟವಾದ / ಪ್ರೇರಣಾದಾಯಕ ಅಂಶಗಳು ಯಾವುವು?', NOW()),
('inspiration_question', 'question2', 'kn', 'ಈ ವೀಡಿಯೋ/ಆಡಿಯೋದಲ್ಲಿ ನಿಮಗೆ ಯಾರ ನಡವಳಿಕೆ ಹೆಚ್ಚು ಇಷ್ಟವಾಯಿತು?', NOW()),
('inspiration_question', 'question3', 'kn', 'ಅವರಲ್ಲಿ ನೀವು ಗಮನಿಸಿದ ಗುಣಗಳು ಯಾವುವು?', NOW()),
('inspiration_question', 'question4', 'kn', 'ಅವುಗಳಲ್ಲಿನ ಯಾವ ಅಂಶ ನಿಮ್ಮ ಜೀವನದಲ್ಲಿ ಉತ್ತಮ ಬದಲಾವಣೆ ತರಬಹುದು?', NOW()),
('inspiration_question', 'question5', 'kn', 'ಯಾವ ಪಾತ್ರ ನಿಮಗೆ ಹೋಲಿಕೆಯಾಯಿತು ಎಂದು ಅನಿಸಿತು ಮತ್ತು ಅದಕ್ಕೆ ಕಾರಣಗಳನ್ನು ತಿಳಿಸುವಿರಾ?', NOW()),
('inspiration_question', 'question6', 'kn', 'ನೀವು ನಿಜ ಜೀವನದಲ್ಲಿ ಮೆಚ್ಚುವ ಯಾವುದೇ ಮೌಲ್ಯಗಳನ್ನು ಎಂದಾದರೂ ಪ್ರರ್ಶಿಸಿದ್ದೀರಾ? ಆ ಸನ್ನಿವೇಶವನ್ನು ಸಂಕ್ಷಿಪ್ತವಾಗಿ ವಿವರಿಸಿ.', NOW()),
('inspiration_question', 'question7', 'kn', 'ನಿವೇ ಆ ಪಾತ್ರಧಾರಿ ಆಗಿದ್ದರೆ ಏನು ಮಾಡುತ್ತಿದ್ದಿರಿ?', NOW()),
('inspiration_question', 'question8', 'kn', 'ಈ ವಿಡಿಯೋ/ಆಡಿಯೋದಲ್ಲಿ ನೋಡಿರುವ ಹಾಗೆ ನಿಮ್ಮನ್ನು ಪ್ರೇರೇಪಿಸಿರುವ ವ್ಯಕ್ತಿ ಅಥವಾ ಸನ್ನಿವೇಶವನ್ನು ಬರೆಯಿರಿ.', NOW()),
('inspiration_question', 'question9', 'kn', 'ಆ ಪಾತ್ರಗಳಿಂದ ಯಾವ ಹೊಸ ಅಂಶಗಳನ್ನು ನಿಮ್ಮ ಜೀವನದಲ್ಲಿ ಅಳವಡಿಸಿಕೊಳ್ಳಲು ಬಯಸುತ್ತೀರಿ?', NOW()),
('inspiration_question', 'question10', 'kn', 'ನೀವು ಹಂಚಿಕೊಳ್ಳಬಹುದಾದ ಇನ್ನೇನಾದರೂ ಹೆಚ್ಚಿನ ಅಂಶಗಳನ್ನು ಗಮನಿಸಿದ್ದರೆ ಅದನ್ನು ಬರೆಯಿರಿ.', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 3. Update Help Text (1-10)
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('inspiration_help', 'question1', 'kn', 'ವೀಡಿಯೊ/ಆಡಿಯೋದ ಯಾವ ಭಾಗವು ನಿಮಗೆ ಹೆಚ್ಚು ಸ್ಫರ್ತಿ ನೀಡಿತು ಎಂಬುದರ ಬಗ್ಗೆ ಬರೆಯಿರಿ', NOW()),
('inspiration_help', 'question2', 'kn', 'ಯಾರ ನಡವಳಿಕೆ ಅಥವಾ ನಡತೆ ನಿಮಗೆ ಹೆಚ್ಚು ಇಷ್ಟವಾಯಿತು ಎಂಬುದನ್ನು ಬಗ್ಗೆ ಬರೆಯಿರಿ', NOW()),
('inspiration_help', 'question3', 'kn', 'ಪಾತ್ರಗಳಲ್ಲಿ ನೀವು ಗಮನಿಸಿದ ಉತ್ತಮ ಗುಣಗಳು ಯಾವವುಬರೆಯಿರಿ.', NOW()),
('inspiration_help', 'question4', 'kn', 'ಆ ಗುಣಗಳಲ್ಲಿ ಯಾವುದು ನಿಮ್ಮ ಜೀವನದಲ್ಲಿ ಒಳ್ಳೆಯ ಬದಲಾವಣೆ ತರಲು ಸಹಾಯ ಮಾಡಬಹುದು ಎಂಬುದರ ಬಗ್ಗೆ ಬರೆಯಿರಿ', NOW()),
('inspiration_help', 'question5', 'kn', 'ನಿಮ್ಮ ಸ್ವಭಾವವನ್ನೇ ಹೋಲುವ ಪಾತ್ರದ ಬಗ್ಗೆ ಬರೆಯಿರಿ.', NOW()),
('inspiration_help', 'question6', 'kn', 'ಪಾತ್ರದಲ್ಲಿ ನೀವು ಇಷ್ಟಪಡುವ ಒಳ್ಳೆಯ ನಡತೆಯನ್ನು ನೀವು ಪ್ರರ್ಶಿಸಿದ್ದೀರಾ ಎಂಬ ಬಗ್ಗೆ ಬರೆಯಿರಿ', NOW()),
('inspiration_help', 'question7', 'kn', 'ನಿವು ಇಷ್ಟಪಟ್ಟ ಪಾತ್ರ ನೀವೇ ಆದರೆ ನಿಮ್ಮ ರ್ತನೆ ಹೇಗಿರುತ್ತಿತ್ತು? ಎಂಬ ಬಗ್ಗೆ ಬರೆಯಿರಿ', NOW()),
('inspiration_help', 'question8', 'kn', 'ನಿಮಗೆ ಸ್ಫರ್ತಿ ನೀಡಿದ ಪಾತ್ರ ಮತ್ತು ಅದು ಹೇಗೆ ಸ್ಪರ್ತಿ ನೀಡಿದೆ? ಎಂಬುದರ ಬಗ್ಗೆ ಬರೆಯಿರಿ', NOW()),
('inspiration_help', 'question9', 'kn', 'ಅದರಲ್ಲಿನ ಯಾವ ಗುಣವನ್ನು ನೀವು ಅನುಸರಿಸುತ್ತೀರಿ? ಎಂಬುದನ್ನು ಬರೆಯಿರಿ', NOW()),
('inspiration_help', 'question10', 'kn', 'ನೀವು ಇಷ್ಟಪಟ್ಟ ಪಾತ್ರದ ಯಾವುದೇ ಇತರ ಗುಣವನ್ನು ಬರೆಯಿರಿ.', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 4. Update Summary Header and Questions
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('inspiration_summary_question', 'header1', 'kn', 'ಸಾರಾಂಶ: ನಾನು ಸ್ಫರ್ತಿ ಪಡೆದ ಅಂಶಗಳು', NOW()),
('inspiration_summary_question', 'question1', 'kn', 'ಈ ಎಲ್ಲಾ ವಿಡಿಯೋಗಳನ್ನು ನೋಡಿದಾಗ ಮತ್ತು ಸ್ವಂತ ಅನುಭವದಿಂದ ನೀವು ಸ್ಪೂರ್ತಿ ಪಡೆದ ಅಂಶಗಳನ್ನು ಪಟ್ಟಿಮಾಡಿ.', NOW()),
('inspiration_summary_question', 'question2', 'kn', 'ಈ ಎಲ್ಲಾ ವಿಡಿಯೋಗಳನ್ನು ನೋಡಿದಾಗ ಮತ್ತು ನಿಮಗೆ ಅನಿಸುತ್ತಿರುವ - ನಿಮ್ಮಲ್ಲಿ ಇರಬಾರದೆನಿಸಿದ ನಡವಳಿಕೆಗಳು ಯಾವವು? ಅದನ್ನು ಬರೆಯಿರಿ', NOW()),
('inspiration_summary_question', 'question3', 'kn', 'ನಿಮ್ಮ ಗೆಳೆಯೊರೊಂದಿಗೆ, ಈ ವಿಡಿಯೋಗಳಲ್ಲಿನ ನಿಮಗೆ ಪ್ರೇರಣೆ ನೀಡಿದ ಪಾತ್ರಗಳು ಮತ್ತು ನಿಮ್ಮ ನಿಜ ಜೀವನದಲ್ಲಿ ನಿಮಗೆ ಸ್ಪೂರ್ತಿ ನೀಡಿದ ವ್ಯಕ್ತಿಗಳಿಗೂ ಇರುವ ಹೋಲಿಕೆಗಳನ್ನು ಕುರಿತು ಚರ್ಚಿಸಿ. ಆ ಸಾರಾಂಶವನ್ನು ಬರೆಯಿರಿ', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- Verification
DO $$
DECLARE
    q_count INTEGER;
    h_count INTEGER;
    s_count INTEGER;
    mod_intro TEXT;
BEGIN
    SELECT COUNT(*) INTO q_count FROM content_translations WHERE resource_type = 'inspiration_question' AND lang = 'kn';
    SELECT COUNT(*) INTO h_count FROM content_translations WHERE resource_type = 'inspiration_help' AND lang = 'kn';
    SELECT COUNT(*) INTO s_count FROM content_translations WHERE resource_type = 'inspiration_summary_question' AND lang = 'kn';
    SELECT text INTO mod_intro FROM content_translations WHERE resource_type = 'inspiration_module' AND resource_key = 'intro' AND lang = 'kn';

    RAISE NOTICE 'Migration Complete:';
    RAISE NOTICE '- Questions Updated: %', q_count;
    RAISE NOTICE '- Help Texts Updated: %', h_count;
    RAISE NOTICE '- Summary Items Updated: %', s_count;
    RAISE NOTICE '- Module Intro: %', substring(mod_intro, 1, 50) || '...';
END $$;
