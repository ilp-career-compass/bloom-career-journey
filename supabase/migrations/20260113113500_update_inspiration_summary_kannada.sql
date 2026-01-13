-- Migration: Update Kannada Inspiration Summary Questions

INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
-- Header
('inspiration_summary_question', 'header1', 'kn', 'ಸಾರಾಂಶ: ನಾನು ಪ್ರೇರಣೆ ಪಡೆದ ಅಂಶವೇ…', NOW()),
-- Question 1
('inspiration_summary_question', 'question1', 'kn', 'ಈ ಎಲ್ಲ ವಿಡಿಯೋವನ್ನು ನೋಡಿದಾಗ ನಿಮ್ಮ ಅನುಭವದಿಂದ ನೀವು ಪ್ರೇರಣೆ ಪಡೆದ ಅಂಶವನ್ನು ಪಟ್ಟಿಮಾಡಿ', NOW()),
-- Question 2
('inspiration_summary_question', 'question2', 'kn', 'ಈ ಎಲ್ಲ ವಿಡಿಯೋಗಳನ್ನು ನೋಡಿದಾಗ ನೀವು ಅನುಭವಿಸಿದ—ನಿಜ ಜೀವನದಲ್ಲಿ ಇರದಿದ್ದರೆ ನೀವು ಮಾಡಬೇಕಾದ ನಡವಳಿಕೆ ಯಾವುದು? ಅದನ್ನು ಬರೆಯಿರಿ', NOW()),
-- Question 3 (Removed '3.' prefix as numbering is handled by UI/Sequence)
('inspiration_summary_question', 'question3', 'kn', 'ನಿಮ್ಮ ಗೆಳೆಯರೊಂದಿಗೆ, ಈ ವಿಡಿಯೋದಲ್ಲಿ ನಿಮಗೆ ಪ್ರೇರಣೆ ನೀಡಿದ ಪಾತ್ರ ಮತ್ತು ಅದು ನಿಮ್ಮ ನಿಜ ಜೀವನದಲ್ಲಿ ಯಾರಿಗೆ ಪ್ರೇರಣೆಯಾದದ್ದೋ ಆ ವ್ಯಕ್ತಿಯ ಬಗ್ಗೆ ಚರ್ಚಿಸಿ. ಆ ಚರ್ಚೆಯ ಸಾರಾಂಶವನ್ನು ಬರೆಯಿರಿ.', NOW())

ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET 
    text = EXCLUDED.text,
    updated_at = NOW();

-- Verification
DO $$
DECLARE
    q_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO q_count
    FROM content_translations
    WHERE resource_type = 'inspiration_summary_question' AND lang = 'kn';
    
    RAISE NOTICE 'Updated Kannada Summary Questions. Total count: %', q_count;
END $$;
