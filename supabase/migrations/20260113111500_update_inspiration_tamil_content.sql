-- Migration: Update Tamil Inspiration Questions and Help Text (10 questions)

-- ============================================================================
-- INSPIRATION ASSESSMENT - Updated Tamil Questions
-- ============================================================================

INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
-- Question 1
('inspiration_question', 'question1', 'ta', 'இந்த வீடியோ/ஆடியோவில் உங்களுக்கு மிகவும் பிடித்த பகுதி அல்லது உத்வேகத்தை அளித்தது எது?', NOW()),
-- Question 2
('inspiration_question', 'question2', 'ta', 'இந்த வீடியோ/ஆடியோவில் உங்களுக்கு யாருடைய செயல் அல்லது பேசும் விதம் மிகவும் பிடித்தது? ?', NOW()),
-- Question 3
('inspiration_question', 'question3', 'ta', 'பயிற்சியாளரின் எந்த பண்புகளை நீங்கள் கவனித்தீர்கள்?', NOW()),
-- Question 4
('inspiration_question', 'question4', 'ta', 'பயிற்சியாளரின் எந்த குணம்/பண்பு உங்கள் வாழ்க்கையில் நல்ல மாற்றத்தை கொண்டுவரும்?', NOW()),
-- Question 5
('inspiration_question', 'question5', 'ta', 'கதையில் உள்ள கதாபாத்திரம் சோகமாக அல்லது வேதனைப்படுவது போல உங்களுக்கு தோன்றினால், அதற்கான காரணத்தை எழுத முடியுமா?', NOW()),
-- Question 6
('inspiration_question', 'question6', 'ta', 'கதையில் உள்ள கதாபாத்திரம் போல நீங்கள் உண்மையான வாழ்க்கையில் யாருக்காவது உதவியிருக்கிறீர்களா? அந்த அனுபவத்தை சுருக்கமாக விவரித்து, அதைப் பற்றிச் சிந்தியுங்கள்', NOW()),
-- Question 7
('inspiration_question', 'question7', 'ta', 'நீங்கள் அந்த கதாபாத்திரமாக இருந்தால், நீங்கள் என்ன செய்வீர்கள்?', NOW()),
-- Question 8
('inspiration_question', 'question8', 'ta', 'இந்த வீடியோ/ஆடியோவில் ஏதாவது கதாபாத்திரம் உங்களை ஊக்கமளித்ததா? அந்த மனிதர் உங்களை ஊக்கமளிப்பவர் என்பதை விளக்கும் காரணத்தை எழுதுங்கள்.', NOW()),
-- Question 9
('inspiration_question', 'question9', 'ta', 'அந்த கதாபாத்திரத்தின் எந்த குணத்தை நீங்கள் உண்மையான வாழ்க்கையில் பின்பற்ற விரும்புகிறீர்கள்?', NOW()),
-- Question 10
('inspiration_question', 'question10', 'ta', 'கதாபாத்திரத்தின் வேறு ஏதாவது குணம் உங்களுக்கு பிடித்திருந்தால், அதை எழுதுங்கள்', NOW())

ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET 
    text = EXCLUDED.text,
    updated_at = NOW();

-- ============================================================================
-- INSPIRATION ASSESSMENT - Updated Tamil Help Text
-- ============================================================================

INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
-- Help 1
('inspiration_help', 'question1', 'ta', 'இந்த வீடியோ/ஆடியோவில் எந்த பகுதி உங்களை அதிகம் ஊக்கமளித்தது?', NOW()),
-- Help 2
('inspiration_help', 'question2', 'ta', 'யாருடைய செயல் உங்களுக்கு மிகவும் பிடித்தது?', NOW()),
-- Help 3
('inspiration_help', 'question3', 'ta', 'பயிற்சியாளருக்கு என்னென்ன குணங்கள் உள்ளன?', NOW()),
-- Help 4
('inspiration_help', 'question4', 'ta', 'பயிற்சியாளரின் எந்த குணம் உங்களுக்கு உதவும்?', NOW()),
-- Help 5
('inspiration_help', 'question5', 'ta', 'அந்த கதாபாத்திரம் ஏன் வருத்தமாக இருந்தது?', NOW()),
-- Help 6
('inspiration_help', 'question6', 'ta', 'நீங்கள் அந்த கதாபாத்திரம் போல யாருக்காவது உதவியுள்ளீர்களா?', NOW()),
-- Help 7
('inspiration_help', 'question7', 'ta', 'நீங்கள் அந்த கதாபாத்திரமாக இருந்தால் என்ன செய்வீர்கள்?', NOW()),
-- Help 8
('inspiration_help', 'question8', 'ta', 'எந்த கதாபாத்திரம் உங்களை ஊக்கமளித்தது? ஏன்?', NOW()),
-- Help 9
('inspiration_help', 'question9', 'ta', 'நீங்கள் எந்த குணத்தை பின்பற்ற விரும்புகிறீர்கள்?', NOW()),
-- Help 10
('inspiration_help', 'question10', 'ta', 'கதாபாத்திரத்தின் மற்றொரு பிடித்த குணத்தை எழுதுங்கள்.', NOW())

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
    inspiration_h_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO inspiration_q_count
    FROM content_translations
    WHERE resource_type = 'inspiration_question' AND lang = 'ta';

    SELECT COUNT(*) INTO inspiration_h_count
    FROM content_translations
    WHERE resource_type = 'inspiration_help' AND lang = 'ta';
    
    RAISE NOTICE 'Updated Tamil Translations. Questions: %, Help Texts: %', inspiration_q_count, inspiration_h_count;
    
    IF inspiration_q_count >= 10 AND inspiration_h_count >= 10 THEN
        RAISE NOTICE '✅ All 10 Tamil questions and help texts present.';
    ELSE
        RAISE WARNING '⚠️ Counts mismatch. Questions: %/10, Help: %/10', inspiration_q_count, inspiration_h_count;
    END IF;
END $$;
