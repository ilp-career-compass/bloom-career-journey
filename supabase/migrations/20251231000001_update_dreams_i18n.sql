-- Migration: Update Dreams Content (I18N)

-- 1. Update/Reset Dreams Questions
DELETE FROM dreams_questions;

-- Inserting English questions (Base)
INSERT INTO dreams_questions (section, question_text, help_text, sequence_number) VALUES
('section1', 'What is your dream about your future?', 'What do you want to become in the future?', 1),
('section1', 'Educational degree that you aspire to get?', 'Which degree do you want to study?', 2),
('section1', 'Which profession do you dream of pursuing?', 'What job do you want to do?', 3),
('section1', 'Which sport do you want to play professionally?', 'Which sport do you like most?', 4),
('section1', 'If you could be a writer, which field would you choose?', 'Story, poem, novel, article, etc.', 5),
('section1', 'What field of music do you want to major in? (Singing / Instruments)', 'Write singing or name of instrument.', 6),

('section2', 'The college that you want to choose.', 'Write college name or place.', 7),
('section2', 'If you want to serve others, whom or what will you serve?', 'People, poor, society, country, animals.', 8),
('section2', 'If you could live anywhere in the world, where would it be?', 'Write country or city name.', 9),
('section2', 'If you could be an artist, what kind of art would you pursue?', 'Drawing, painting, dance, etc.', 10),
('section2', 'Do you like travelling? What do you like in it?', 'Places, nature, food, culture.', 11),
('section2', 'If you could learn from a professional for one day, who would it be and why?', 'Teacher, doctor, scientist, leader.', 12),

('section3', 'Do you want to make your dreams come true?', 'Write Yes or No.', 13),
('section3', 'What is needed to make your dreams come true?', 'Hard work, time, support, practice.', 14),
('section3', 'What first steps will you take for your dreams?', 'Study well, practice daily.', 15),
('section3', 'Do you have confidence and motivation?', 'Answer honestly.', 16),
('section3', 'What problems may come in your dream path?', 'Money, fear, marks, family issues.', 17),
('section3', 'Will school education help your dreams? How?', 'Subjects give knowledge and skills.', 18);


-- 2. Insert Translations into content_translations
DELETE FROM content_translations WHERE resource_type IN ('dreams_question', 'dreams_help', 'dreams_module');

-- Module Title
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('dreams_module', 'title', 'ta', 'என் கனவுகள்'),
('dreams_module', 'title', 'kn', 'ನನ್ನ ಕನಸುಗಳು');

-- Tamil Questions
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('dreams_question', 'question1', 'ta', 'உங்கள் எதிர்காலத்தைப் பற்றி உங்கள் கனவு என்ன?'),
('dreams_question', 'question2', 'ta', 'நீங்கள் எந்த கல்விப் பட்டப்படிப்பை படிக்க விரும்புகிறீர்கள்?'),
('dreams_question', 'question3', 'ta', 'நீங்கள் எந்த தொழிலை செய்ய கனவு காண்கிறீர்கள்?'),
('dreams_question', 'question4', 'ta', 'நீங்கள் தொழில்முறையாக விளையாட விரும்பும் விளையாட்டு எது?'),
('dreams_question', 'question5', 'ta', 'நீங்கள் எழுத்தாளராக இருந்தால் எந்த துறையைத் தேர்வு செய்வீர்கள்?'),
('dreams_question', 'question6', 'ta', 'நீங்கள் இசையின் எந்த துறையில் சிறப்பு பெற விரும்புகிறீர்கள்?'),
('dreams_question', 'question7', 'ta', 'நீங்கள் தேர்வு செய்ய விரும்பும் கல்லூரி எது?'),
('dreams_question', 'question8', 'ta', 'நீங்கள் சேவை செய்ய விரும்பினால் யாருக்கு அல்லது எதற்கு செய்வீர்கள்?'),
('dreams_question', 'question9', 'ta', 'உலகில் எங்கு வேண்டுமானாலும் வாழ வாய்ப்பு கிடைத்தால், எங்கு வாழ விரும்புவீர்கள்?'),
('dreams_question', 'question10', 'ta', 'நீங்கள் கலைஞராக இருந்தால் எந்த வகை கலையை தேர்வு செய்வீர்கள்?'),
('dreams_question', 'question11', 'ta', 'உங்களுக்கு பயணம் செய்ய பிடிக்குமா? அதில் எது பிடிக்கும்?'),
('dreams_question', 'question12', 'ta', 'ஒரு நாள் ஒரு தொழில்முறை நபரிடமிருந்து கற்றுக்கொள்ள வாய்ப்பு கிடைத்தால், அவர் யார்? ஏன்?'),
('dreams_question', 'question13', 'ta', 'உங்கள் கனவுகளை நிஜமாக்க விரும்புகிறீர்களா?'),
('dreams_question', 'question14', 'ta', 'உங்கள் கனவுகளை நனவாக்க என்ன தேவை?'),
('dreams_question', 'question15', 'ta', 'உங்கள் கனவுக்காக முதல் முயற்சி என்ன?'),
('dreams_question', 'question16', 'ta', 'உங்களிடம் தன்னம்பிக்கை மற்றும் ஊக்கம் உள்ளதா?'),
('dreams_question', 'question17', 'ta', 'உங்கள் கனவு பாதையில் என்ன சவால்கள் வரலாம்?'),
('dreams_question', 'question18', 'ta', 'பள்ளி கல்வி உங்கள் கனவுக்கு உதவுமா? எப்படி?');

-- Tamil Help Texts
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('dreams_help', 'question1', 'ta', 'நீங்கள் எதிர்காலத்தில் என்ன ஆக விரும்புகிறீர்கள்?'),
('dreams_help', 'question2', 'ta', 'நீங்கள் படிக்க விரும்பும் பட்டப்படிப்பு என்ன?'),
('dreams_help', 'question3', 'ta', 'நீங்கள் செய்ய விரும்பும் வேலை என்ன?'),
('dreams_help', 'question4', 'ta', 'நீங்கள் எந்த விளையாட்டில் ஆர்வம் உள்ளவர்?'),
('dreams_help', 'question5', 'ta', 'கதை, கவிதை, கட்டுரை போன்றவற்றில் ஒன்றை எழுதுங்கள்.'),
('dreams_help', 'question6', 'ta', 'பாடகரா அல்லது இசையமைப்பாளரா என்று எழுதுங்கள்.'),
('dreams_help', 'question7', 'ta', 'தெரிந்தால் கல்லூரி பெயரை எழுதுங்கள்.'),
('dreams_help', 'question8', 'ta', 'மக்கள், ஏழைகள், நாடு, விலங்குகள்'),
('dreams_help', 'question9', 'ta', 'நாடு அல்லது நகரத்தின் பெயரை எழுதுங்கள்.'),
('dreams_help', 'question10', 'ta', 'ஓவியம், நடனம் போன்றவற்றை எழுதுங்கள்'),
('dreams_help', 'question11', 'ta', 'இடங்கள், இயற்கை, உணவு என்று எழுதலாம்.'),
('dreams_help', 'question12', 'ta', 'ஆசிரியர், மருத்துவர், பொறியாளர், விஞ்ஞானி.'),
('dreams_help', 'question13', 'ta', 'ஆம் அல்லது இல்லை என்று எழுதுங்கள்.'),
('dreams_help', 'question14', 'ta', 'உழைப்பு, நேரம், பயிற்சி.'),
('dreams_help', 'question15', 'ta', 'நன்றாக படித்தல், பயிற்சி செய்தல்.'),
('dreams_help', 'question16', 'ta', 'நேர்மையாக பதில் எழுதுங்கள்.'),
('dreams_help', 'question17', 'ta', 'பணம், பயம், மதிப்பெண்கள்.'),
('dreams_help', 'question18', 'ta', 'பாடங்கள் அறிவும் திறனும் தரும்.');


-- Kannada Questions
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('dreams_question', 'question1', 'kn', 'ನಿಮ್ಮ ಭವಿಷ್ಯದ ಬಗ್ಗೆ ನಿಮ್ಮ ಕನಸು ಏನು?'),
('dreams_question', 'question2', 'kn', 'ನೀವು ಯಾವ ಶೈಕ್ಷಣಿಕ ಪದವಿಯನ್ನು ಪಡೆಯಲು ಆಸೆಪಡುತ್ತೀರಿ?'),
('dreams_question', 'question3', 'kn', 'ನೀವು ಯಾವ ವೃತ್ತಿಯನ್ನು ಮಾಡಲು ಕನಸು ಕಾಣುತ್ತೀರಿ?'),
('dreams_question', 'question4', 'kn', 'ನೀವು ವೃತ್ತಿಪರವಾಗಿ ಆಡಲು ಬಯಸುವ ಕ್ರೀಡೆ ಯಾವುದು?'),
('dreams_question', 'question5', 'kn', 'ನೀವು ಬರಹಗಾರರಾಗಿದ್ದರೆ, ಯಾವ ಕ್ಷೇತ್ರವನ್ನು ಆಯ್ಕೆ ಮಾಡುತ್ತೀರಿ?'),
('dreams_question', 'question6', 'kn', 'ನೀವು ಸಂಗೀತದ ಯಾವ ಕ್ಷೇತ್ರದಲ್ಲಿ ಪ್ರಮುಖವಾಗಲು ಬಯಸುತ್ತೀರಿ? (ಹಾಡುಗಾರಿಕೆ / ವಾದ್ಯಗಳು)'),
('dreams_question', 'question7', 'kn', 'ನೀವು ಆಯ್ಕೆ ಮಾಡಬೇಕೆಂದಿರುವ ಕಾಲೇಜು ಯಾವುದು?'),
('dreams_question', 'question8', 'kn', 'ನೀವು ಇತರರಿಗೆ ಸೇವೆ ಸಲ್ಲಿಸಲು ನಿಮ್ಮ ಶ್ರಮವನ್ನು ಸಮರ್ಪಿಸಬೇಕಾದರೆ, ಯಾರಿಗೆ ಅಥವಾ ಯಾವುದಕ್ಕೆ ಸೇವೆ ಮಾಡುತ್ತೀರಿ?'),
('dreams_question', 'question9', 'kn', 'ನಿಮಗೆ ಜಗತ್ತಿನ ಯಾವ ಸ್ಥಳದಲ್ಲಿ ವಾಸಿಸಲು ಅವಕಾಶ ಸಿಕ್ಕರೆ, ಎಲ್ಲಿ ವಾಸಿಸುತ್ತೀರಿ?'),
('dreams_question', 'question10', 'kn', 'ನೀವು ಕಲಾವಿದರಾಗಿದ್ದರೆ, ಯಾವ ರೀತಿಯ ಕಲೆ ಅನುಸರಿಸುತ್ತೀರಿ?'),
('dreams_question', 'question11', 'kn', 'ನಿಮಗೆ ಪ್ರವಾಸ ಮಾಡುವ ಆಸಕ್ತಿ ಇದೆಯೇ? ಹೌದಾದರೆ, ಯಾವುದು ನಿಮಗೆ ಹೆಚ್ಚು ಇಷ್ಟ?'),
('dreams_question', 'question12', 'kn', 'ನೀವು ಒಂದು ದಿನ ವೃತ್ತಿಪರ ವ್ಯಕ್ತಿಯಿಂದ ಕಲಿಯುವ ಅವಕಾಶ ದೊರೆತರೆ, ಯಾರು ಮತ್ತು ಏಕೆ?'),
('dreams_question', 'question13', 'kn', 'ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ನನಸಾಗಿಸಲು ನೀವು ಬಯಸುತ್ತೀರಾ?'),
('dreams_question', 'question14', 'kn', 'ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ನನಸಾಗಿಸಲು ಯಾವ ಅಂಶಗಳು ಅಗತ್ಯ?'),
('dreams_question', 'question15', 'kn', 'ನಿಮ್ಮ ಕನಸುಗಳಿಗಾಗಿ ನೀವು ಮೊದಲಿಗೆ ಏನು ಮಾಡುತ್ತೀರಿ?'),
('dreams_question', 'question16', 'kn', 'ನಿಮ್ಮಲ್ಲಿ ಆತ್ಮವಿಶ್ವಾಸ ಮತ್ತು ಪ್ರೇರಣೆ ಇದೆಯೇ?'),
('dreams_question', 'question17', 'kn', 'ನಿಮ್ಮ ಕನಸುಗಳ ಮಾರ್ಗದಲ್ಲಿ ಯಾವ ಅಡಚಣೆಗಳು ಬರಬಹುದು?'),
('dreams_question', 'question18', 'kn', 'ಶಾಲಾ ಶಿಕ್ಷಣವು ನಿಮ್ಮ ಕನಸುಗಳಿಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆಯೇ? ಹೇಗೆ?');


-- 3. Update RPC for Dreams Questions to include help text
DROP FUNCTION IF EXISTS get_dreams_questions_i18n(text);
CREATE OR REPLACE FUNCTION get_dreams_questions_i18n(p_lang text)
RETURNS TABLE (
    key TEXT,
    text TEXT,
    help_text TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'question' || d.sequence_number as key,
        COALESCE(
            public.get_translation('dreams_question', 'question' || d.sequence_number, p_lang),
            d.question_text
        ) as text,
        COALESCE(
            public.get_translation('dreams_help', 'question' || d.sequence_number, p_lang),
            d.help_text
        ) as help_text
    FROM dreams_questions d
    WHERE d.is_active = true
    ORDER BY d.sequence_number;
END $$;

GRANT EXECUTE ON FUNCTION get_dreams_questions_i18n(text) TO authenticated;


-- 4. Helper to get module title
CREATE OR REPLACE FUNCTION get_dreams_module_title_i18n(p_lang text)
RETURNS TABLE (
    title TEXT,
    subtitle TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_title text;
BEGIN
    SELECT text INTO v_title
    FROM content_translations
    WHERE resource_type = 'dreams_module' 
    AND resource_key = 'title'
    AND lang = p_lang;
    
    RETURN QUERY SELECT COALESCE(v_title, 'My Dreams'), CAST(NULL AS TEXT);
END $$;

GRANT EXECUTE ON FUNCTION get_dreams_module_title_i18n(text) TO authenticated;
