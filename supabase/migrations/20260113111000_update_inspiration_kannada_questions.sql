-- Migration: Update Kannada Inspiration Questions (10 questions)

-- ============================================================================
-- INSPIRATION ASSESSMENT - Updated Kannada Questions
-- ============================================================================

INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
-- Question 1
('inspiration_question', 'question1', 'kn', 'ಈ ವೀಡಿಯೋ / ಆಡಿಯೋದಲ್ಲಿ ನಿಮಗೆ ಹೆಚ್ಚು ಇಷ್ಟವಾದ / ಪ್ರೇರಣಾದಾಯಕ ಅಂಶಗಳು ಯಾವುವು?', NOW()),
-- Question 2
('inspiration_question', 'question2', 'kn', 'ಈ ವೀಡಿಯೋ/ಆಡಿಯೋದಲ್ಲಿ ನಿಮಗೆ ಯಾರ ನಡೆ-ನುಡಿಗೆ ಹೆಚ್ಚು ಇಷ್ಟವಾಯಿತು?', NOW()),
-- Question 3
('inspiration_question', 'question3', 'kn', 'ಅಚರ್ಯರಲ್ಲಿ ನಿಮಗೆ ಗೊತ್ತಾದ ಗುಣಗಳು ಯಾವುವು?', NOW()),
-- Question 4
('inspiration_question', 'question4', 'kn', 'ಅಧ್ಯಾಪಕನಲ್ಲಿ ಯಾವ ಅಂಶ ನಿಮಗೆ ಜೀವನದಲ್ಲಿ ಉತ್ತಮ ಬದಲಾವಣೆ ತರಲಿದೆ?', NOW()),
-- Question 5
('inspiration_question', 'question5', 'kn', 'ಯಾಚಿ ಪಾತ್ರ ನಿಮಗೆ ಹೆಚ್ಚು ನೋವು/ದುಃಖಕರವಾಗಿ ಕಂಡುದು ಎಂದು ನೀವು ಅನುಭವಿಸಿದರೆ, ಅದಕ್ಕೆ ಕಾರಣವೇನು ಎಂದು ತಿಳಿಸಬಹುದೇ?', NOW()),
-- Question 6
('inspiration_question', 'question6', 'kn', 'ನೀವು ನಿಜ ಜೀವನದಲ್ಲಿ ಕಥಾಪಾತ್ರದಂತೆಯೇ ಯಾರಿಗಾದರೂ ಸಹಾಯ ಮಾಡಿದಿರಾ? ಆ ಅನುಭವವನ್ನು ಸಂಕ್ಷಿಪ್ತವಾಗಿ ವಿವರಿಸಿ ಮತ್ತು ಚಿಂತಿಸಿ.', NOW()),
-- Question 7
('inspiration_question', 'question7', 'kn', 'ನೀವು ಆ ಪಾತ್ರಧಾರಿಯಾದರೆ ಏನು ಮಾಡುತ್ತಿರೀರಿ?', NOW()),
-- Question 8
('inspiration_question', 'question8', 'kn', 'ಈ ವೀಡಿಯೋ/ಆಡಿಯೋದಲ್ಲಿ ನೀವು ನೋಡಿದ ಪಾತ್ರ ನಿಮಗೆ ಪ್ರೇರಣೆಯಾಗಿದೆಯೇ? ಆ ವ್ಯಕ್ತಿಯು ನಿಮಗೆ ಪ್ರೇರಣೆಯಾದ ಅಂಶವನ್ನು ಬರೆಯಿರಿ', NOW()),
-- Question 9
('inspiration_question', 'question9', 'kn', 'ಆ ಪಾತ್ರದಿಂದ ನೀವು ಯಾವ ಅಂಶವನ್ನು ನಿಜ ಜೀವನದಲ್ಲಿ ಅನುಸರಿಸಲು ಬಯಸುತ್ತೀರಿ?', NOW()),
-- Question 10
('inspiration_question', 'question10', 'kn', 'ನೀವು ಗಮನಿಸಿದ್ದ ಪಾತ್ರದಿಂದ ಇನ್ನೇನಾದರೂ ಹೆಚ್ಚು ಇಷ್ಟವಾದ ಅಂಶವಿದ್ದರೆ, ಅದನ್ನು ಬರೆಯಿರಿ.', NOW())

ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET 
    text = EXCLUDED.text,
    updated_at = NOW();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
    inspiration_q_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO inspiration_q_count
    FROM content_translations
    WHERE resource_type = 'inspiration_question' AND lang = 'kn';
    
    RAISE NOTICE 'Updated Kannada Translations for Inspiration Questions. Total count: %', inspiration_q_count;
    
    IF inspiration_q_count >= 10 THEN
        RAISE NOTICE '✅ All 10 Kannada inspiration questions present.';
    ELSE
        RAISE WARNING '⚠️ Expected at least 10 questions, found %. Check inserts.', inspiration_q_count;
    END IF;
END $$;
