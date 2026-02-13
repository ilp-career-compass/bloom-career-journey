-- Migration: Update Kannada content for My Dreams Assessment
-- Updates Module Title, Quote, Intro, Questions (1-18), Help Text (1-18), and Summary Table Headers

-- 1. Update Module Intro, Quote, Title
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('dreams_module', 'title', 'kn', 'ನನ್ನ ಕನಸುಗಳು', NOW()),
('dreams_module', 'quote', 'kn', '“ನೀವು ನಿದ್ರೆ ಮಾಡುವಾಗ ಕಾಣುವುದು ಕನಸಲ್ಲ, ಯಾವ ಕನಸು ನಿಮ್ಮನ್ನು ನಿದ್ರಿಸಲು ಬಿಡುವುದಿಲ್ಲವೋ ಅದೇ ನಿಜವಾದ ಕನಸು.” - ಡಾ. ಎ. ಪಿ. ಜೆ. ಅಬ್ದುಲ್ ಕಲಾಮ್', NOW()),
('dreams_module', 'intro', 'kn', 'ನಾವೆಲ್ಲರೂ ನಮ್ಮ, ನಮ್ಮ ಭವಿಷ್ಯದ ಬಗ್ಗೆ ಕನಸುಗಳನ್ನು ಹೊಂದಿದ್ದೇವಲ್ಲವೇ? ಹಾಗಾದರೆ ನಿಮ್ಮ ಪ್ರಕಾರ ಕನಸು ಎಂದರೇನು? ನಿಮ್ಮ ಕನಸುಗಳು ಯಾವುವು? ನಿಮಗನಿಸುವ ಪ್ರಕಾರ ನಿಮ್ಮನ್ನು ಪದೇ ಪದೇ ಕಾಡುವ ಕನಸುಗಳು ಯಾವುದು? - ಈ ಎಲ್ಲದರ ಕುರಿತು ನಿಮ್ಮ ಅಭಿಪ್ರಾಯಗಳನ್ನು ಈ ಚಟುವಟಿಕೆಯಲ್ಲಿ ವ್ಯಕ್ತಪಡಿಸುತ್ತೀರಿ.', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 2. Update Questions (1-18)
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('dreams_question', 'question1', 'kn', 'ನಿಮ್ಮ ಭವಿಷ್ಯದ ಬಗ್ಗೆ ನಿಮ್ಮ ಕನಸುಗಳು ಏನು?', NOW()),
('dreams_question', 'question2', 'kn', 'ನೀವು ಪಡೆಯಲು ಬಯಸುವ ಶಿಕ್ಷಣ/ಶೈಕ್ಷಣಿಕ ಪದವಿ ಯಾವುದು?', NOW()),
('dreams_question', 'question3', 'kn', 'ನೀವು ಯಾವ ವೃತ್ತಿಯನ್ನು ಮಾಡುವ ಕನಸು ಕಾಣುತ್ತೀರಿ?', NOW()),
('dreams_question', 'question4', 'kn', 'ನೀವು ವೃತ್ತಿಪರವಾಗಿ ಆಡಲು ಬಯಸುವ ಕ್ರೀಡೆ ಯಾವುದು?', NOW()),
('dreams_question', 'question5', 'kn', 'ನೀವು ಬರಹಗಾರರಾಗಲು ಸಾಧ್ಯವಾದರೆ, ಯಾವ ಕ್ಷೇತ್ರದಲ್ಲಿ?', NOW()),
('dreams_question', 'question6', 'kn', 'ಸಂಗೀತ ಕ್ಷೇತ್ರದಲ್ಲಿ ನೀವು ಬಯಸುವ ವಿಭಾಗ? (ಹಾಡುಗಾರಿಕೆ / ಯಾವುದೇ ವಾದ್ಯ)', NOW()),
('dreams_question', 'question7', 'kn', 'ನೀವು ಆಯ್ಕೆ ಮಾಡಿಕೊಳ್ಳಲು ಬಯಸುವ ಕಾಲೇಜು', NOW()),
('dreams_question', 'question8', 'kn', 'ನೀವು ಜಗತ್ತಿನಲ್ಲಿ ಯಾರಿಗಾದರೂ ಅಥವಾ ಯಾವುದಕ್ಕಾದರೂ ಸೇವೆ ಮಾಡಲು ನಿಮ್ಮ ಬದುಕು ಮೀಸಲಿಡುವುದಾದರೆ, ನಿಮ್ಮ ಆಯ್ಕೆ', NOW()),
('dreams_question', 'question9', 'kn', 'ಪ್ರಪಂಚದ ಬೇರೊಂದು ಸ್ಥಳದಲ್ಲಿ ನಿಮಗೆ ವಾಸ್ತವ್ಯ ಹೂಡಲು ಅವಕಾಶ ಸಿಕ್ಕರೆ, ಅದು ಎಲ್ಲಿ?', NOW()),
('dreams_question', 'question10', 'kn', 'ನೀವು ಕಲಾವಿದರಾಗಲು ಸಾಧ್ಯವಾದರೆ, ನೀವು ಬಯಸುವ ಕಲೆ ಯಾವುದು?', NOW()),
('dreams_question', 'question11', 'kn', 'ನೀವು ಪ್ರಯಾಣ/ಪ್ರವಾಸ ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತೀರಾ? ಪ್ರಯಾಣದ ಯಾವ ಅಂಶ/ಸಂಗತಿಗಳು ನಿಮ್ಮನ್ನು ಹೆಚ್ಚು ಆರ್ಷಿಸುತ್ತದೆ? ಬರೆಯಿರಿ.', NOW()),
('dreams_question', 'question12', 'kn', 'ನೀವು ಒಂದು ದಿನ ಒಬ್ಬ ವೃತ್ತಿಪರ/ಉದ್ಯೋಗಿಯನ್ನು ಗಮನಿಸಿ ಕಲಿಯಲು ಸಾಧ್ಯವಾದರೆ, ಅದು ಯಾರು ಮತ್ತು ಏಕೆ?', NOW()),
('dreams_question', 'question13', 'kn', 'ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ನನಸಾಗಿಸಲು ನೀವು ಬಯಸುವಿರಾ?', NOW()),
('dreams_question', 'question14', 'kn', 'ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ನನಸಾಗಿಸಲು ಏನೆಲ್ಲಾ ಅವಶ್ಯಕತೆಗಳಿವೆ? (ನಿಮ್ಮ ಯಾವುದಾದರೂ ಒಂದು ಕನಸು, ನನಸಾಗಿಸುವುದು ಹೇಗೆ ತಿಳಿಸಿ)', NOW()),
('dreams_question', 'question15', 'kn', 'ನಿಮ್ಮ ಆಕಾಂಕ್ಷೆಗಳು ಅಥವಾ ಕನಸುಗಳನ್ನು ನನಸಾಗಿಸಲು ಮೊದಲ ಹೆಜ್ಜೆ ಯಾವುದು?', NOW()),
('dreams_question', 'question16', 'kn', 'ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ಸಾಧಿಸುವ ಛಲ ಮತ್ತು ಉತ್ಸಾಹವನ್ನು ನೀವು ಹೊಂದಿದ್ದೀರಾ?', NOW()),
('dreams_question', 'question17', 'kn', 'ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ಸಾಧಿಸಲು ಅಡೆತಡೆಗಳೇನಾದರೂ ಇದೆಯೇ? ಇದ್ದರೆ ಅವುಗಳು ಯಾವವು? ಬರೆಯಿರಿ.', NOW()),
('dreams_question', 'question18', 'kn', 'ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ನನಸಾಗಿಸಲು ಈಗ ನೀವು ಶಾಲೆಯಲ್ಲಿ ಪಡೆಯುತ್ತಿರುವ ಶಿಕ್ಷಣ/ಕಲಿಕೆಯು ಸಹಾಯವಾಗುತ್ತದೆಯೇ? ಹೌದು ಎಂದಾದರೆ ಹೇಗೆ? ತಿಳಿಸಿ', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 3. Update Help Text (1-18)
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('dreams_help', 'question1', 'kn', 'ಭವಿಷ್ಯದಲ್ಲಿ ನೀವು ಏನಾಗಲು ಬಯಸುತ್ತೀರಿ?', NOW()),
('dreams_help', 'question2', 'kn', 'ನೀವು ಯಾವ ಪದವಿ ವ್ಯಾಸಂಗ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ', NOW()),
('dreams_help', 'question3', 'kn', 'ನೀವು ಯಾವ ಕೆಲಸ (ಉದ್ಯೋಗ) ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?', NOW()),
('dreams_help', 'question4', 'kn', 'ನಿಮಗೆ ಅತಿ ಹೆಚ್ಚು ಇಷ್ಟವಾದ ಕ್ರೀಡೆ ಯಾವುದು?', NOW()),
('dreams_help', 'question5', 'kn', 'ಕಥೆ, ಕವನ, ಕಾದಂಬರಿ, ಲೇಖನ, ಇತ್ಯಾದಿ.', NOW()),
('dreams_help', 'question6', 'kn', 'ಹಾಡುಗಾರಿಕೆ ಅಥವಾ ವಾದ್ಯದ ಹೆಸರನ್ನು ಬರೆಯಿರಿ.', NOW()),
('dreams_help', 'question7', 'kn', 'ಕಾಲೇಜಿನ ಹೆಸರು ಅಥವಾ ಸ್ಥಳವನ್ನು ಬರೆಯಿರಿ.', NOW()),
('dreams_help', 'question8', 'kn', 'ಜನರು, ಬಡವರು, ಸಮಾಜ, ದೇಶ, ಪ್ರಾಣಿಗಳು- ಇತ್ಯಾದಿ.. ಯಾವುದು ಎಂಬುದನ್ನು ತಿಳಿಸಿ.', NOW()),
('dreams_help', 'question9', 'kn', 'ದೇಶ ಅಥವಾ ನಗರದ ಹೆಸರನ್ನು ಬರೆಯಿರಿ.', NOW()),
('dreams_help', 'question10', 'kn', 'ಚಿತ್ರಕಲೆ, ಪೇಂಟಿಂಗ್, ನೃತ್ಯ, ಇತ್ಯಾದಿ.. ಯಾವುದು ಎಂಬುದನ್ನು ತಿಳಿಸಿ.', NOW()),
('dreams_help', 'question11', 'kn', 'ಸ್ಥಳಗಳು, ಪ್ರಕೃತಿ, ಆಹಾರ, ಸಂಸ್ಕೃತಿ.ಇತ್ಯಾದಿ.. ಯಾವುದು ಎಂಬುದನ್ನು ತಿಳಿಸಿ', NOW()),
('dreams_help', 'question12', 'kn', 'ಶಿಕ್ಷಕ, ವೈದ್ಯ, ವಿಜ್ಞಾನಿ, ನಾಯಕ ಇತ್ಯಾದಿ.. ಯಾವುದು ಎಂಬುದನ್ನು ತಿಳಿಸಿ', NOW()),
('dreams_help', 'question13', 'kn', 'ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಬರೆಯಿರಿ.', NOW()),
('dreams_help', 'question14', 'kn', 'ಕಠಿಣ ಪರಿಶ್ರಮ, ಸಮಯ, ಬೆಂಬಲ, ಅಭ್ಯಾಸ-  ಇತ್ಯಾದಿ.. ಯಾವುದು ಎಂಬುದನ್ನು ತಿಳಿಸಿ', NOW()),
('dreams_help', 'question15', 'kn', 'ಚೆನ್ನಾಗಿ ಓದುವುದು, ಪ್ರತಿದಿನ ಅಭ್ಯಾಸ ಮಾಡುವುದು.', NOW()),
('dreams_help', 'question16', 'kn', 'ಪ್ರಾಮಾಣಿಕವಾಗಿ ಉತ್ತರಿಸಿ.', NOW()),
('dreams_help', 'question17', 'kn', 'ಹಣ, ಭಯ, ಅಂಕಗಳು, ಕೌಟುಂಬಿಕ ಸಮಸ್ಯೆಗಳು ಇತ್ಯಾದಿ.. ಯಾವುದು ಎಂಬುದನ್ನು ತಿಳಿಸಿ', NOW()),
('dreams_help', 'question18', 'kn', 'ವಿಷಯಗಳು ಜ್ಞಾನ ಮತ್ತು ಕೌಶಲ್ಯಗಳನ್ನು ನೀಡುತ್ತವೆ. ಇತ್ಯಾದಿ.. ಯಾವುದು ಮತ್ತು ಹೇಗೆ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 4. Update Summary Table Columns (Dreams)
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('dreams_summary_question', 'col_dream', 'kn', 'ಕನಸು', NOW()),
('dreams_summary_question', 'col_quality', 'kn', 'ನಿಮ್ಮಲ್ಲಿ ಈಗಾಗಲೇ ಕಂಡುಕೊಂಡಿರುವ ಯಾವ ಗುಣ/ ಮೌಲ್ಯ/ ಸಾಮರ್ಥ್ಯ ನಿಮ್ಮ ಕನಸನ್ನು ಸಾಧಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.', NOW()),
('dreams_summary_question', 'col_prevent', 'kn', 'ಕನಸು ವಿಫಲವಾಗುವುದಿಲ್ಲ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಲು ನೀವು ಏನು ಮಾಡಬೇಕಾಗುತ್ತದೆ', NOW()),
('dreams_summary_question', 'col_study', 'kn', 'ಈ ಕನಸನ್ನುಸಾಧಿಸಲು 10ನೇ ತರಗತಿಯ ನಂತರ ನೀವು ಏನು ಅಧ್ಯಯನ ಮಾಡಬೇಕು? (ಅನ್ವಯಿಸಿದರೆ)', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- Verification
DO $$
DECLARE
    q_count INTEGER;
    h_count INTEGER;
    s_count INTEGER;
    mod_quote TEXT;
BEGIN
    SELECT COUNT(*) INTO q_count FROM content_translations WHERE resource_type = 'dreams_question' AND lang = 'kn';
    SELECT COUNT(*) INTO h_count FROM content_translations WHERE resource_type = 'dreams_help' AND lang = 'kn';
    SELECT COUNT(*) INTO s_count FROM content_translations WHERE resource_type = 'dreams_summary_question' AND lang = 'kn';
    SELECT text INTO mod_quote FROM content_translations WHERE resource_type = 'dreams_module' AND resource_key = 'quote' AND lang = 'kn';

    RAISE NOTICE 'Dreams Migration Complete:';
    RAISE NOTICE '- Questions Updated: %', q_count;
    RAISE NOTICE '- Help Texts Updated: %', h_count;
    RAISE NOTICE '- Summary Columns Updated: %', s_count;
    RAISE NOTICE '- Module Quote: %', substring(mod_quote, 1, 50) || '...';
END $$;
