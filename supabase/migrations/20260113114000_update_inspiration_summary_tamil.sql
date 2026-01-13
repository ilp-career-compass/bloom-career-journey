-- Migration: Update Tamil Inspiration Summary Questions

INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
-- Header
('inspiration_summary_question', 'header1', 'ta', 'சுருக்கம்: எனக்கு ஊக்கம் அளித்தது…', NOW()),
-- Question 1
('inspiration_summary_question', 'question1', 'ta', 'இந்த அனைத்து வீடியோக்களையும் பார்த்த பிறகு, உங்கள் அனுபவத்தில் உங்களை ஊக்கமளித்த முக்கியமானவற்றை பட்டியலிடுங்கள்', NOW()),
-- Question 2
('inspiration_summary_question', 'question2', 'ta', 'இந்த வீடியோக்களை பார்த்த பிறகு, நீங்கள் தவிர்க்க வேண்டும் என்று நினைக்கும் செயல் என்ன? எழுதுங்கள்.', NOW()),
-- Question 3 (Explicitly empty as Tamil only has 2 questions, prevents English fallback)
('inspiration_summary_question', 'question3', 'ta', '', NOW())

ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET 
    text = EXCLUDED.text,
    updated_at = NOW();

-- Verification
DO $$
DECLARE
    q3_text TEXT;
BEGIN
    SELECT text INTO q3_text
    FROM content_translations
    WHERE resource_type = 'inspiration_summary_question' AND lang = 'ta' AND resource_key = 'question3';
    
    IF q3_text = '' THEN
        RAISE NOTICE '✅ Question 3 is correctly set to empty for Tamil.';
    ELSE
        RAISE WARNING '⚠️ Question 3 is not empty: %', q3_text;
    END IF;
END $$;
