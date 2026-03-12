-- Migration: Update Role Models Content (I18N)

-- 1. Create/Update Role Models Questions Table
DROP TABLE IF EXISTS role_models_questions CASCADE;
CREATE TABLE role_models_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    help_text TEXT,
    sequence_number INTEGER NOT NULL,
    key TEXT NOT NULL UNIQUE, -- To map to frontend (question1, question2, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE role_models_questions ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON role_models_questions;
CREATE POLICY "Allow read access to authenticated users"
    ON role_models_questions
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. Populate Questions
DELETE FROM role_models_questions;

INSERT INTO role_models_questions (sequence_number, key, question_text, help_text) VALUES
-- Intro Questions (Maybe used for tabs or specific logic, included for completeness)
(1, 'question1', 'Role model 1: What is the name and your relationship with them?', 'Write the name of your first role model and how they are related to you (parent, teacher, relative, etc.).'),
(2, 'question2', 'Role model 2: What is the name?', 'Write the name of the second role model. It may be someone you know.'),
(3, 'question3', 'Role model 3: What is the name? Is the person known to you or a famous person?', 'Mention whether the third role model is someone you know or a famous person.'),

-- Detailed Questions (Repeated for each Role Model)
(4, 'question4', 'What is the name of your role model?', 'Write the full name of your role model.'),
(5, 'question5', 'Is the person a family member, relative, or someone you know?', 'Mention how the person is related to you.'),
(6, 'question6', 'What qualities do you like in your role model? Why are they special to you?', 'Think about qualities like hard work, honesty, and courage.'),
(7, 'question7', 'What work or profession does the person do?', 'Write their job or profession simply.'),
(8, 'question8', 'Which skill or talent of yours do you want to develop inspired by them?', 'Think about skills like studies, leadership, or communication.'),
(9, 'question9', 'Have you discussed your chosen career or job with your role model? What did you discuss?', 'Write if you discussed career choice, education path, or future plans.'),
(10, 'question10', 'Have you taken advice or opinion from your role model about your dream plan?', 'Write whether you discussed your dream or future plan with them.'),
(11, 'question11', 'What does your role model say about your dream job or career?', 'Mention whether they encouraged you or gave advice.'),
(12, 'question12', 'Has any role model helped you in choosing your dream career?', 'Write who helped you and how they helped you.'),
(13, 'question13', 'If yes, what kind of help do you expect?', 'Think about help like education, training, or guidance.'),
(14, 'question14', 'Apart from the above questions, is there anything else you would like to say?', 'You may write any additional thoughts or opinions.'),
(15, 'question15', 'Have you noticed any similarity or comparison between your personality and that of the above role models?', 'Think about common qualities, habits, or thoughts between you and your role model and write them.'),
(16, 'question16', 'How do you try to adopt the qualities of your role model in your life?', 'Write how you follow your role model’s good habits, discipline, and hard work in your life.'),

-- Summary Questions
(17, 'question17', 'Summary: My future plan', 'Think about questions related to your future studies, job, or career choice and write them.'),
(18, 'question18', 'Write 5 to 10 questions you would like to ask your role model for career guidance.', NULL);


-- 3. Insert Translations
DELETE FROM content_translations WHERE resource_type = 'role_models_question';
DELETE FROM content_translations WHERE resource_type = 'role_models_help';
DELETE FROM content_translations WHERE resource_type = 'role_models_module';

-- Module Title
INSERT INTO content_translations (lang, resource_type, resource_key, text) VALUES
('ta', 'role_models_module', 'title', 'என் முன்மாதிரி நபர்'),
('kn', 'role_models_module', 'title', 'ನನ್ನ ಆದರ್ಶ ವ್ಯಕ್ತಿ ಯಾರು?');

-- Questions & Help Texts (Tamil)
INSERT INTO content_translations (lang, resource_type, resource_key, text) VALUES
('ta', 'role_models_question', 'question1', 'முன்மாதிரி நபர் 1: அவரின் பெயர் மற்றும் உங்களுடன் உள்ள தொடர்பு என்ன?'),
('ta', 'role_models_help', 'question1', 'நீங்கள் தேர்ந்தெடுத்த முதல் முன்மாதிரி நபரின் பெயர் மற்றும் அவர் உங்களுக்கு யார் (அப்பா, அம்மா, ஆசிரியர், உறவினர் போன்றவர்) என்பதை எழுதுங்கள்.'),
('ta', 'role_models_question', 'question2', 'முன்மாதிரி நபர் 2: பெயர் என்ன?'),
('ta', 'role_models_help', 'question2', 'இரண்டாவது முன்மாதிரி நபரின் பெயரை எழுதுங்கள்.'),
('ta', 'role_models_question', 'question3', 'முன்மாதிரி நபர் 3: பெயர் என்ன? அவர் அறிமுகமானவரா அல்லது பிரபலமானவரா?'),
('ta', 'role_models_help', 'question3', 'மூன்றாவது முன்மாதிரி நபர் உங்களுக்கு தெரிந்தவரா அல்லது பிரபலமானவரா என்பதை குறிப்பிடுங்கள்.'),
('ta', 'role_models_question', 'question4', 'உங்கள் முன்மாதிரி நபரின் பெயர் என்ன?'),
('ta', 'role_models_help', 'question4', 'முன்மாதிரி நபரின் முழுப் பெயரை எழுதுங்கள்.'),
('ta', 'role_models_question', 'question5', 'அவர் உங்கள் குடும்ப உறுப்பினரா, உறவினரா அல்லது அறிமுகமானவரா?'),
('ta', 'role_models_help', 'question5', 'அவர் உங்களுடன் எந்த வகை தொடர்பில் உள்ளார் என்பதை குறிப்பிடுங்கள்.'),
('ta', 'role_models_question', 'question6', 'உங்கள் முன்மாதிரி நபரின் எந்த பண்புகளை நீங்கள் விரும்புகிறீர்கள்? அவர்கள் உங்களுக்கு ஏன் சிறப்பாக தோன்றுகிறார்கள்?'),
('ta', 'role_models_help', 'question6', 'உழைப்பு, நேர்மை, தைரியம் போன்ற பண்புகளை நினைத்து எழுதுங்கள்.'),
('ta', 'role_models_question', 'question7', 'அவர் எந்த வேலை அல்லது தொழில் செய்கிறார்?'),
('ta', 'role_models_help', 'question7', 'அவரின் வேலை அல்லது தொழிலை எளிமையாக எழுதுங்கள்.'),
('ta', 'role_models_question', 'question8', 'அவரின் ஊக்கத்தால் உங்கள் எந்த திறன் அல்லது திறமையை வளர்க்க விரும்புகிறீர்கள்?'),
('ta', 'role_models_help', 'question8', 'படிப்பு, தலைமைத் திறன், பேசும் திறன் போன்றவற்றை யோசிக்கவும்.'),
('ta', 'role_models_question', 'question9', 'உங்கள் முன்மாதிரி நபருடன் நீங்கள் தேர்ந்தெடுத்த தொழில் அல்லது வேலை பற்றி பேசினீர்களா? என்ன பேசினீர்கள்?'),
('ta', 'role_models_help', 'question9', 'வேலை தேர்வு, படிப்பு வழி, எதிர்கால திட்டங்கள் பற்றி பேசினீர்களா என்று எழுதுங்கள்.'),
('ta', 'role_models_question', 'question10', 'உங்கள் கனவு திட்டம் குறித்து முன்மாதிரி நபரிடம் கருத்து கேட்டு ஆலோசனை பெற்றுள்ளீர்களா?'),
('ta', 'role_models_help', 'question10', 'உங்கள் கனவு, எதிர்கால திட்டம் பற்றி அவரிடம் பேசினீர்களா என்பதை எழுதுங்கள்.'),
('ta', 'role_models_question', 'question11', 'உங்கள் கனவு வேலை அல்லது தொழில் பற்றி முன்மாதிரி நபர் என்ன கூறுகிறார்?'),
('ta', 'role_models_help', 'question11', 'அவர் ஊக்குவித்தாரா, அறிவுரை கொடுத்தாரா என்பதை குறிப்பிடுங்கள்.'),
('ta', 'role_models_question', 'question12', 'எந்த முன்மாதிரி நபர் உங்கள் கனவு தொழில் தேர்வில் உங்களுக்கு உதவி செய்தாரா?'),
('ta', 'role_models_help', 'question12', 'யார் உதவி செய்தார், எவ்வாறு உதவி செய்தார் என்பதை எழுதுங்கள்.'),
('ta', 'role_models_question', 'question13', 'ஆம் என்றால், நீங்கள் எந்த வகையான உதவியை எதிர்பார்க்கிறீர்கள்?'),
('ta', 'role_models_help', 'question13', 'படிப்பு, பயிற்சி, வழிகாட்டுதல் போன்ற உதவிகளை நினைத்து எழுதுங்கள்.'),
('ta', 'role_models_question', 'question14', 'மேலுள்ள கேள்விகளுக்கு கூடுதலாக நீங்கள் வேறு ஏதாவது சொல்ல விரும்புகிறீர்களா?'),
('ta', 'role_models_help', 'question14', 'உங்கள் எண்ணங்கள் அல்லது கருத்துகளை சுதந்திரமாக எழுதலாம்.'),
('ta', 'role_models_question', 'question15', 'நீங்கள் முன்மாதிரியாகக் கருதும் மேலுள்ள நபர்களின் பண்புகளுக்கும் உங்களுக்கும் இடையில் ஏதேனும் ஒற்றுமை அல்லது ஒப்பீட்டை கவனித்துள்ளீர்களா?'),
('ta', 'role_models_help', 'question15', 'உங்களுக்கும் உங்கள் முன்மாதிரி நபருக்கும் உள்ள ஒத்த குணங்கள், பழக்கங்கள் அல்லது எண்ணங்களை நினைத்து எழுதுங்கள்.'),
('ta', 'role_models_question', 'question16', 'உங்கள் முன்மாதிரி நபரின் பண்புகளை உங்கள் வாழ்க்கையில் பின்பற்ற நீங்கள் எவ்வாறு முயற்சி செய்கிறீர்கள்?'),
('ta', 'role_models_help', 'question16', 'உங்கள் முன்மாதிரி நபரின் நல்ல பழக்கங்கள், ஒழுக்கம், உழைப்பு போன்றவற்றை நீங்கள் எப்படி பின்பற்றுகிறீர்கள் என்பதை எழுதுங்கள்.'),
('ta', 'role_models_question', 'question17', 'சுருக்கம்: என் எதிர்கால திட்டம்'),
('ta', 'role_models_help', 'question17', 'உங்கள் எதிர்கால படிப்பு, வேலை, தொழில் தேர்வு குறித்து சந்தேகமாக உள்ள கேள்விகளை நினைத்து எழுதுங்கள்.'),
('ta', 'role_models_question', 'question18', 'உங்கள் முன்மாதிரி நபரிடம் உங்கள் தொழில் வழிகாட்டலுக்காக நீங்கள் கேட்க விரும்பும் 5 முதல் 10 கேள்விகளை எழுதுங்கள்.');

-- Questions & Help Texts (Kannada)
INSERT INTO content_translations (lang, resource_type, resource_key, text) VALUES
('kn', 'role_models_question', 'question1', 'ಆದರ್ಶ ವ್ಯಕ್ತಿ 1: ಹೆಸರು ಮತ್ತು ನಿಮಗೆ ಇರುವ ಪರಿಚಯ ಏನು?'),
('kn', 'role_models_question', 'question2', 'ಆದರ್ಶ ವ್ಯಕ್ತಿ 2: ಹೆಸರು ಏನು?'),
('kn', 'role_models_question', 'question3', 'ಆದರ್ಶ ವ್ಯಕ್ತಿ 3: ಹೆಸರು ಮತ್ತು ಅವರು ಪರಿಚಿತ ವ್ಯಕ್ತಿಯೇ ಅಥವಾ ಪ್ರಸಿದ್ಧ ವ್ಯಕ್ತಿಯೇ?'),
('kn', 'role_models_question', 'question4', 'ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಯ ಹೆಸರು ಏನು?'),
('kn', 'role_models_question', 'question5', 'ಅವರು ನಿಮ್ಮ ಕುಟುಂಬದವರೇ, ಸಂಬಂಧಿಕರೇ ಅಥವಾ ಪರಿಚಿತ ವ್ಯಕ್ತಿಯೇ?'),
('kn', 'role_models_question', 'question6', 'ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಯಲ್ಲಿ ನೀವು ಮೆಚ್ಚುವ ಗುಣಗಳನ್ನು ಪಟ್ಟಿಮಾಡಿ ಮತ್ತು ಅವರು ನಿಮಗೆ ವಿಶೇಷವಾಗಿ ಕಾಣುವ ಕಾರಣವನ್ನು ವಿವರಿಸಿ.'),
('kn', 'role_models_question', 'question7', 'ಅವರು ಯಾವ ಕೆಲಸ ಅಥವಾ ಉದ್ಯೋಗ ಮಾಡುತ್ತಿದ್ದಾರೆ?'),
('kn', 'role_models_question', 'question8', 'ಅವರ ಪ್ರೇರಣೆಯಿಂದ ನಿಮ್ಮಲ್ಲಿರುವ ಯಾವ ಕೌಶಲ್ಯ ಅಥವಾ ಪ್ರತಿಭೆಯನ್ನು ನೀವು ಉತ್ತೇಜಿಸಲು ಬಯಸುತ್ತೀರಿ?'),
('kn', 'role_models_question', 'question9', 'ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಯೊಂದಿಗೆ ನಿಮ್ಮ ಆಯ್ಕೆಯ ವೃತ್ತಿ ಅಥವಾ ಉದ್ಯೋಗದ ಬಗ್ಗೆ ಚರ್ಚಿಸಿದ್ದೀರಾ? ಏನನ್ನು ಚರ್ಚಿಸಿದ್ದೀರಿ?'),
('kn', 'role_models_question', 'question10', 'ಅವರು ನಿಮ್ಮ ಕನಸಿನ ಯೋಜನೆಯ ಕುರಿತು ಅಭಿಪ್ರಾಯ ಪಡೆದು ಯೋಚನೆ ಮಾಡಿದ್ದೀರಾ?'),
('kn', 'role_models_question', 'question11', 'ನಿಮ್ಮ ಕನಸಿನ ಉದ್ಯೋಗ ಅಥವಾ ವೃತ್ತಿಯ ಕುರಿತು ಆದರ್ಶ ವ್ಯಕ್ತಿ ಏನು ಹೇಳುತ್ತಾರೆ?'),
('kn', 'role_models_question', 'question12', 'ಯಾವುದಾದರೂ ಆದರ್ಶ ವ್ಯಕ್ತಿ ನಿಮ್ಮ ಕನಸಿನ ವೃತ್ತಿಯ ಆಯ್ಕೆಯಲ್ಲಿ ನಿಮಗೆ ಸಹಾಯ ಮಾಡಿದ್ದಾರಾ?'),
('kn', 'role_models_question', 'question13', 'ಹೌದಾದರೆ, ನೀವು ಯಾವ ರೀತಿಯ ಸಹಾಯವನ್ನು ನಿರೀಕ್ಷಿಸುತ್ತೀರಿ?'),
('kn', 'role_models_question', 'question14', 'ಮೇಲಿನ ಪ್ರಶ್ನೆಗಳ ಹೊರತಾಗಿ ಇನ್ನೇನಾದರೂ ಹೇಳಲು ಬಯಸುವಿರಾ?'),
('kn', 'role_models_question', 'question15', 'ನೀವು ಆದರ್ಶವೆಂದು ಭಾವಿಸಿದ ಮೇಲಿನ ವ್ಯಕ್ತಿಗಳ ವ್ಯಕ್ತಿತ್ವದಲ್ಲಿ ನಿಮ್ಮೊಂದಿಗೆ ಇರುವ ತೋಲಿಕೆ ಅಥವಾ ಸಾಮ್ಯತೆಯನ್ನು ಗಮನಿಸಿದ್ದೀರಾ?'),
('kn', 'role_models_question', 'question16', 'ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಯ ಗುಣಗಳನ್ನು ನಿಮ್ಮ ಜೀವನದಲ್ಲಿ ಅಳವಡಿಸಿಕೊಳ್ಳಲು ನೀವು ಹೇಗೆ ಪ್ರಯತ್ನ ಮಾಡುತ್ತೀರಿ?'),
('kn', 'role_models_question', 'question17', 'ಸಾರಾಂಶ: ನನ್ನ ಮುಂದಿನ ಯೋಜನೆ'),
('kn', 'role_models_question', 'question18', 'ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಯೊಂದಿಗೆ ನಿಮ್ಮ ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ನೀವು ಕೇಳಲು ಬಯಸುವ 5 ರಿಂದ 10 ಪ್ರಶ್ನೆಗಳನ್ನು ಬರೆಯಿರಿ.');

-- 4. Create RPCs
DROP FUNCTION IF EXISTS get_role_models_questions_i18n(text);
CREATE OR REPLACE FUNCTION get_role_models_questions_i18n(p_lang text DEFAULT 'en')
RETURNS TABLE (
    sequence_number INTEGER,
    key TEXT,
    text TEXT,
    help_text TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.sequence_number,
        q.key,
        COALESCE(t.text, q.question_text) as text,
        COALESCE(th.text, q.help_text) as help_text
    FROM role_models_questions q
    LEFT JOIN content_translations t ON q.key = t.resource_key 
        AND t.resource_type = 'role_models_question' 
        AND t.lang = p_lang
    LEFT JOIN content_translations th ON q.key = th.resource_key 
        AND th.resource_type = 'role_models_help' 
        AND th.lang = p_lang
    ORDER BY q.sequence_number;
END;
$$;

DROP FUNCTION IF EXISTS get_role_models_module_title_i18n(text);
CREATE OR REPLACE FUNCTION get_role_models_module_title_i18n(p_lang text DEFAULT 'en')
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    v_title text;
BEGIN
    SELECT COALESCE(text, 'My Role Models')
    INTO v_title
    FROM content_translations
    WHERE resource_type = 'role_models_module'
      AND resource_key = 'title'
      AND lang = p_lang;

    RETURN COALESCE(v_title, 'My Role Models');
END;
$$;
