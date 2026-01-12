-- Migration: Update School Learning Content (I18N)

-- 1. Drop existing constraints to allow new values
ALTER TABLE school_learning_questions DROP CONSTRAINT IF EXISTS school_learning_questions_question_type_check;
ALTER TABLE school_learning_questions DROP CONSTRAINT IF EXISTS school_learning_questions_section_check;

-- Optional: Re-add updated constraints if desired, or leave open. 
-- For now, we will add more flexible constraints.
ALTER TABLE school_learning_questions ADD CONSTRAINT school_learning_questions_question_type_check CHECK (question_type IN ('text', 'textarea', 'checkbox'));
-- We won't add a strict section check to allow sections 1-5 without issues.

-- 2. Update/Reset School Learning Questions
DELETE FROM school_learning_questions;

-- Inserting English questions (Base)
-- Section 1: Q1-4
INSERT INTO school_learning_questions (section, question_text, help_text, sequence_number, question_type) VALUES
('section1', 'Do you like coming to school? Why?', 'Write whether you like coming to school and give the reason.', 1, 'textarea'),
('section1', 'What do you like to learn in school?', 'Write what you like to learn in school.', 2, 'textarea'),
('section1', 'What are the reasons you do not like learning in school? Explain.', 'Clearly write the reasons why you do not like learning in school.', 3, 'textarea'),
('section1', 'Who are your close friends in school? What qualities or traits in them have made them your close friends?', 'Write about your close friends and the qualities that make them special.', 4, 'textarea');

-- Section 2: Q5-8
INSERT INTO school_learning_questions (section, question_text, help_text, sequence_number, question_type) VALUES
('section2', 'Who is your favorite teacher in your school? What qualities do you like in them?', 'Write about your favorite teacher and the qualities you like in them.', 5, 'textarea'),
('section2', 'Which subjects do you like the most? Why?', 'Write about your favorite subjects and the reasons for liking them.', 6, 'textarea'),
('section2', 'Which are the subjects you do not like? Why?', 'Write about the subjects you do not like and the reasons.', 7, 'textarea'),
('section2', 'Are there any subjects you find difficult to understand? What are the reasons for the difficulty?', 'Write about the subjects that are difficult for you to understand and the reasons.', 8, 'textarea');

-- Section 3: Q9-12
INSERT INTO school_learning_questions (section, question_text, help_text, sequence_number, question_type) VALUES
('section3', 'Does the help/guidance of teachers and parents help you in your learning?', 'Write about the help you receive from teachers and parents.', 9, 'textarea'),
('section3', 'In which subjects do you score high marks? In which subjects do you score low marks?', 'Write the subjects in which you score high and low marks.', 10, 'textarea'),
('section3', 'Which of the following learning methods do you like the most? (Put a ✔ mark for the one that applies to you)', NULL, 11, 'checkbox'),
('section3', 'Do you prefer to learn alone or in a group? Why? Write the reason.', 'Choose your preferred way of learning and write the reason.', 12, 'textarea');

-- Section 4: Q13-16
INSERT INTO school_learning_questions (section, question_text, help_text, sequence_number, question_type) VALUES
('section4', 'What kind of help do you get from your friends in learning lessons?', 'Write about the help you receive from your friends.', 13, 'textarea'),
('section4', 'Apart from academic subjects, what other activities are you involved in / interested in?', 'Write about your other interests and activities.', 14, 'textarea'),
('section4', 'Write about an event in your school that made you very happy or satisfied.', 'Write about a happy event that happened in school.', 15, 'textarea'),
('section4', 'What changes do you think should be made in your school?', 'Write the changes you think should be made in your school.', 16, 'textarea');

-- Section 5: Q17-21
INSERT INTO school_learning_questions (section, question_text, help_text, sequence_number, question_type) VALUES
('section5', 'Is there any special place in your school to exhibit your talents? (E.g., laboratory, playground, library, etc.)', 'Write about the place in your school where you can exhibit your talents.', 17, 'textarea'),
('section5', 'Communication is an important skill. Where do you get the opportunity to express your views/opinions in your school?', 'Write where you get the opportunity to express your opinion.', 18, 'textarea'),
('section5', 'What are your opinions on the school activities and learning?', 'Write your opinion on school activities and learning.', 19, 'textarea'),
('section5', 'Do you talk to your parents about school activities and learning?', 'Write whether you talk to your parents about school activities.', 20, 'textarea'),
('section5', 'Do you like to discuss school activities and learning with your parents? What topics do you discuss with them?', 'Write what you discuss with your parents.', 21, 'textarea');



-- 2. Create School Learning Summary Questions Table
CREATE TABLE IF NOT EXISTS school_learning_summary_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    help_text TEXT,
    sequence_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE school_learning_summary_questions ENABLE ROW LEVEL SECURITY;

-- Policy for reading
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON school_learning_summary_questions;
CREATE POLICY "Enable read access for authenticated users" ON school_learning_summary_questions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Clean up existing summary questions
DELETE FROM school_learning_summary_questions;

-- Insert Summary Questions
INSERT INTO school_learning_summary_questions (question_text, help_text, sequence_number) VALUES
('Subjects I like', 'Note: You have the opportunity to choose your career based on your areas of interest. At the end of this book, on the page titled “My Areas of Interest,” record which lessons you would like to learn in the coming days, which subjects/lessons you like, and why you like them. This will help you understand the careers related to these subjects, how the lessons learned here are useful in different professions/fields, and support you in making future career decisions.', 1),
('Careers I can pursue based on the subjects I like', 'Record your areas of interest to understand suitable careers and make informed future career decisions.', 2),
('Subjects I do not like', NULL, 3),
('Careers I can pursue if I make progress in the subjects I do not like', NULL, 4),
('Other activities / areas in which I perform well along with academic subjects', NULL, 5),
('If I improve these skills, it will help me in choosing my job / career.', NULL, 6);


-- 3. Insert Translations into content_translations
DELETE FROM content_translations WHERE resource_type IN ('school_learning_question', 'school_learning_help', 'school_learning_module', 'school_learning_summary_question', 'school_learning_summary_help');

-- Module Title
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('school_learning_module', 'title', 'ta', 'நானும், என் பள்ளியும், என் கற்றலும்'),
('school_learning_module', 'title', 'kn', 'ನನ್ನ ಶಾಲೆ, ನನ್ನ ಕಲಿಕೆ');

-- Tamil Questions
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('school_learning_question', 'question1', 'ta', 'உங்களுக்கு பள்ளிக்கு செல்ல விருப்பமா? ஏன்?'),
('school_learning_question', 'question2', 'ta', 'பள்ளியில் நீங்கள் என்ன கற்றுக்கொள்ள விரும்புகிறீர்கள்?'),
('school_learning_question', 'question3', 'ta', 'பள்ளியில் கற்றுக்கொள்ள உங்களுக்கு பிடிக்காத காரணங்கள் என்ன? விளக்குங்கள்.'),
('school_learning_question', 'question4', 'ta', 'பள்ளியில் உங்களுக்கு நெருங்கிய நண்பர்கள் யார்? அவர்களிடம் உள்ள எந்த குணங்கள் / அம்சங்கள் அவர்களை உங்கள் நெருங்கிய நண்பர்களாக ஆக்கியது?'),
('school_learning_question', 'question5', 'ta', 'உங்கள் பள்ளியில் உங்களுக்கு பிடித்த ஆசிரியர் யார்? அவர்களிடம் உங்களுக்கு பிடித்த குணங்கள் என்ன?'),
('school_learning_question', 'question6', 'ta', 'எந்த பாடங்களை நீங்கள் அதிகம் விரும்புகிறீர்கள்? ஏன்?'),
('school_learning_question', 'question7', 'ta', 'உங்களுக்கு விருப்பமில்லாத பாடப்பிரிவுகள் எவை? ஏன்?'),
('school_learning_question', 'question8', 'ta', 'புரிந்துகொள்ள கடினமாக உள்ள பாடங்கள் ஏதேனும் உள்ளதா? கடினமாக இருப்பதற்கு காரணங்கள் என்ன?'),
('school_learning_question', 'question9', 'ta', 'ஆசிரியர்கள் மற்றும் பெற்றோரின் உதவி மற்றும் வழிகாட்டுதல் உங்கள் கற்றலுக்கு உதவுகிறதா?'),
('school_learning_question', 'question10', 'ta', 'எந்த பாடங்களில் நீங்கள் அதிக மதிப்பெண் பெறுகிறீர்கள்? எதில் குறைவான மதிப்பெண் பெறுகிறீர்கள்?'),
('school_learning_question', 'question11', 'ta', 'கீழ்க்கண்டவற்றில் உங்களுக்குப் பிடித்த கற்றல் முறை எது? (உங்களுக்குப் பொருந்தும் ஒன்றிற்கு ✔ குறியிடவும்)'),
('school_learning_question', 'question12', 'ta', 'நீங்கள் தனியாகக் கற்றுக்கொள்ள விரும்புகிறீர்களா அல்லது குழுவாகக் கற்றுக்கொள்ள விரும்புகிறீர்களா? ஏன்? காரணத்தை எழுதுங்கள்.'),
('school_learning_question', 'question13', 'ta', 'பாடங்களை கற்பதில் நண்பர்களிடமிருந்து உங்களால் எத்தகைய உதவிகள் பெறப்படுகின்றன?'),
('school_learning_question', 'question14', 'ta', 'கல்விப் பாடங்களைத் தவிர, வேறு என்ன செயல்பாடுகளில் நீங்கள் ஈடுபட்டுள்ளீர்கள் / ஆர்வமாக உள்ளீர்கள்?'),
('school_learning_question', 'question15', 'ta', 'உங்கள் பள்ளியில் உங்களுக்கு மிகுந்த மகிழ்ச்சியை அல்லது திருப்தியை ஏற்படுத்திய ஒரு நிகழ்வைப் பற்றி எழுதுங்கள்.'),
('school_learning_question', 'question16', 'ta', 'உங்கள் பள்ளியில் என்ன மாற்றங்கள் செய்யப்பட வேண்டும் என்று நீங்கள் நினைக்கிறீர்கள்?'),
('school_learning_question', 'question17', 'ta', 'உங்கள் திறமைகளை வெளிப்படுத்துவதற்கு உங்கள் பள்ளியில் ஏதேனும் சிறப்பு இடம் உள்ளதா? (உ.தா: ஆய்வகம், விளையாட்டு மைதானம், நூலகம் போன்றவை)'),
('school_learning_question', 'question18', 'ta', 'தொடர்பாடல் என்பது ஒரு முக்கியமான திறன். உங்கள் பள்ளியில் உங்கள் கருத்துக்களை/எண்ணங்களை வெளிப்படுத்த உங்களுக்கு எங்கு வாய்ப்பு கிடைக்கிறது?'),
('school_learning_question', 'question19', 'ta', 'பள்ளி செயல்பாடுகள் மற்றும் கற்றல் குறித்து உங்கள் கருத்துக்கள் என்ன?'),
('school_learning_question', 'question20', 'ta', 'பள்ளி செயல்பாடுகள் மற்றும் கற்றல் குறித்து உங்கள் பெற்றோருடன் நீங்கள் பேசுகிறீர்களா?'),
('school_learning_question', 'question21', 'ta', 'பள்ளி செயல்பாடுகள் மற்றும் கற்றல் குறித்து உங்கள் பெற்றோருடன் விவாதிக்க உங்களுக்கு விருப்பமா? அவர்களுடன் என்ன தலைப்புகளை விவாதிக்கிறீர்கள்?');

-- Tamil Help Texts
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('school_learning_help', 'question1', 'ta', 'பள்ளிக்குச் செல்ல விருப்பம் உள்ளதா என்பதை காரணத்துடன் எழுதுங்கள்.'),
('school_learning_help', 'question2', 'ta', 'பள்ளியில் உங்களுக்கு பிடித்த கற்றல் விஷயங்களை எழுதுங்கள்.'),
('school_learning_help', 'question3', 'ta', 'கற்றலில் விருப்பமில்லாத காரணங்களை தெளிவாக எழுதுங்கள்.'),
('school_learning_help', 'question4', 'ta', 'உங்கள் நெருங்கிய நண்பர்கள் மற்றும் அவர்களின் நல்ல குணங்களை எழுதுங்கள்.'),
('school_learning_help', 'question5', 'ta', 'பிடித்த ஆசிரியர் மற்றும் அவர்களின் நல்ல குணங்களை எழுதுங்கள்.'),
('school_learning_help', 'question6', 'ta', 'பிடித்த பாடம் மற்றும் அதற்கான காரணத்தை எழுதுங்கள்.'),
('school_learning_help', 'question7', 'ta', 'விருப்பமில்லாத பாடம் மற்றும் அதற்கான காரணத்தை எழுதுங்கள்.'),
('school_learning_help', 'question8', 'ta', 'புரிந்துகொள்ள கடினமாக இருக்கும் பாடங்களையும், அதற்கான காரணங்களையும் எழுதுங்கள்.'),
('school_learning_help', 'question9', 'ta', 'ஆசிரியர்கள் மற்றும் பெற்றோரின் உதவி எவ்வாறு கிடைக்கிறது என்று எழுதுங்கள்.'),
('school_learning_help', 'question10', 'ta', 'அதிக மதிப்பெண் மற்றும் குறைவான மதிப்பெண் பெறும் பாடங்களை எழுதுங்கள்.'),
('school_learning_help', 'question11', 'ta', 'உங்களுக்கு பிடித்த கற்றல் முறையை தேர்வு செய்யவும்.'),
('school_learning_help', 'question12', 'ta', 'உங்களுக்கு பிடித்த கற்றல் முறையை தேர்வு செய்து அதற்கான காரணத்தை எழுதுங்கள்.'),
('school_learning_help', 'question13', 'ta', 'நண்பர்களிடமிருந்து கற்றலுக்கு கிடைக்கும் உதவிகளை எழுதுங்கள்.'),
('school_learning_help', 'question14', 'ta', 'பாடப்புத்தகப் பாடங்களைத் தவிர பிற செயல்பாடுகளில் உள்ள ஆர்வத்தை எழுதுங்கள்.'),
('school_learning_help', 'question15', 'ta', 'பள்ளியில் உங்களுக்கு மகிழ்ச்சி அளித்த நிகழ்வை எழுதுங்கள்.'),
('school_learning_help', 'question16', 'ta', 'பள்ளியில் வேண்டும் என்று நீங்கள் விரும்பும் மாற்றங்களை எழுதுங்கள்.'),
('school_learning_help', 'question17', 'ta', 'உங்கள் திறமையை வெளிப்படுத்தும் இடத்தை எழுதுங்கள்.'),
('school_learning_help', 'question18', 'ta', 'உங்கள் கருத்துக்களை வெளிப்படுத்தும் வாய்ப்புகள் பற்றி எழுதுங்கள்.'),
('school_learning_help', 'question19', 'ta', 'பள்ளி செயல்பாடுகள் மற்றும் கற்றல் குறித்து உங்கள் கருத்துக்களை எழுதுங்கள்.'),
('school_learning_help', 'question20', 'ta', 'பள்ளி செயல்பாடுகள் பற்றி பெற்றோருடன் பேசுவீர்களா என்பதை எழுதுங்கள்.'),
('school_learning_help', 'question21', 'ta', 'பெற்றோருடன் விவாதிக்கும் தலைப்புகளை எழுதுங்கள்.');

-- Kannada Questions
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('school_learning_question', 'question1', 'kn', 'ನಿಮಗೆ ಶಾಲೆಗೆ ಬರಲು ಇಷ್ಟವೇ? ಯಾಕೆ?'),
('school_learning_question', 'question2', 'kn', 'ಶಾಲೆಯಲ್ಲಿ ನೀವು ಏನು ಕಲಿಯಲು ಇಷ್ಟಪಡುತ್ತೀರಿ?'),
('school_learning_question', 'question3', 'kn', 'ನೀವು ಶಾಲೆಯಲ್ಲಿ ಕಲಿಯಲು ಇಷ್ಟಪಡದಿರುವ ಕಾರಣಗಳೇನು? ವಿವರಿಸಿ.'),
('school_learning_question', 'question4', 'kn', 'ಶಾಲೆಯಲ್ಲಿ ನಿಮಗೆ ಆತ್ಮೀಯ ಸ್ನೇಹಿತರು ಯಾರು? ಅವರಲ್ಲಿ ಇರುವ ಯಾವ ಗುಣಗಳು / ಸಂಗತಿಗಳು ಅವರನ್ನು ನಿಮ್ಮ ಆತ್ಮೀಯ ಸ್ನೇಹಿತರಾಗಿಸಿದ್ದಾರೆ?'),
('school_learning_question', 'question5', 'kn', 'ನಿಮ್ಮ ಶಾಲೆಯಲ್ಲಿ ನಿಮಗೆ ಇಷ್ಟವಾದ ಶಿಕ್ಷಕರು ಯಾರು? ಅವರಲ್ಲಿರುವ ಯಾವ ಅಂಶಗಳು ನಿಮಗೆ ಇಷ್ಟವಾಗುತ್ತವೆ?'),
('school_learning_question', 'question6', 'kn', 'ಯಾವ ವಿಷಯಗಳೆಂದರೆ ನಿಮಗೆ ಹೆಚ್ಚು ಇಷ್ಟ? ಏಕೆ?'),
('school_learning_question', 'question7', 'kn', 'ನಿಮಗೆ ಇಷ್ಟವಿಲ್ಲದ ವಿಷಯಗಳು ಯಾವುವು? ಏಕೆ?'),
('school_learning_question', 'question8', 'kn', 'ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಕಷ್ಟ ಎನಿಸುವ ವಿಷಯಗಳು ಯಾವುದಾದರೂ ಇದೆಯೇ? ಕಷ್ಟ ಎನಿಸಲು ಕಾರಣಗಳೇನು?'),
('school_learning_question', 'question9', 'kn', 'ಶಿಕ್ಷಕರು ಮತ್ತು ಪೋಷಕರ ನೆರವು / ಮಾರ್ಗದರ್ಶನ ನಿಮ್ಮ ಕಲಿಕೆಗೆ ಸಹಾಯವಾಗುತ್ತಿದೆಯೇ?'),
('school_learning_question', 'question10', 'kn', 'ಯಾವ ವಿಷಯಗಳಲ್ಲಿ ನೀವು ಹೆಚ್ಚು ಅಂಕಗಳನ್ನು ಪಡೆಯುತ್ತೀರಿ? ಯಾವುದರಲ್ಲಿ ಕಡಿಮೆ ಅಂಕಗಳನ್ನು ಪಡೆಯುತ್ತೀರಿ?'),
('school_learning_question', 'question11', 'kn', 'ಈ ಕೆಳಗಿನವುಗಳಲ್ಲಿ ನಿಮಗೆ ಹೆಚ್ಚು ಇಷ್ಟವಾಗುವ ಕಲಿಕಾ ವಿಧಾನ ಯಾವುದು? (ನಿಮಗೆ ಅನ್ವಯವಾಗುವ ಒಂದಕ್ಕೆ ✔ ಗುರುತು ಹಾಕಿ)'),
('school_learning_question', 'question12', 'kn', 'ನೀವು ಒಂಟಿಯಾಗಿ ಕಲಿಯಲು ಇಷ್ಟಪಡುತ್ತೀರಾ ಅಥವಾ ಗುಂಪಿನಲ್ಲಿ ಕಲಿಯಲು ಇಷ್ಟಪಡುತ್ತೀರಾ? ಏಕೆ? ಕಾರಣವನ್ನು ಬರೆಯಿರಿ.'),
('school_learning_question', 'question13', 'kn', 'ಪಾಠಗಳನ್ನು ಕಲಿಯುವಲ್ಲಿ ಸ್ನೇಹಿತರಿಂದ ನಿಮಗೆ ಎಂತಹ ಸಹಾಯಗಳು ದೊರೆಯುತ್ತವೆ?'),
('school_learning_question', 'question14', 'kn', 'ಪಠ್ಯ ವಿಷಯಗಳನ್ನು ಹೊರತುಪಡಿಸಿ ಇತರೆ ಯಾವ ಚಟುವಟಿಕೆಗಳಲ್ಲಿ ತೊಡಗಿಸಿಕೊಂಡಿದ್ದೀರಿ / ಆಸಕ್ತಿ ಹೊಂದಿದ್ದೀರಿ?'),
('school_learning_question', 'question15', 'kn', 'ನಿಮ್ಮ ಶಾಲೆಯಲ್ಲಿ ನಿಮಗೆ ತುಂಬಾ ಸಂತೋಷ ಅಥವಾ ತೃಪ್ತಿ ತಂದುಕೊಟ್ಟ ಒಂದು ಘಟನೆಯ ಬಗ್ಗೆ ಬರೆಯಿರಿ.'),
('school_learning_question', 'question16', 'kn', 'ನಿಮ್ಮ ಶಾಲೆಯಲ್ಲಿ ಏನೇನು ಬದಲಾವಣೆಗಳನ್ನು ಮಾಡಬೇಕೆಂದು ನೀವು ಅಂದುಕೊಳ್ಳುತ್ತೀರಿ?'),
('school_learning_question', 'question17', 'kn', 'ನಿಮ್ಮ ಪ್ರತಿಭೆಗಳನ್ನು ಪ್ರದರ್ಶಿಸಲು ನಿಮ್ಮ ಶಾಲೆಯಲ್ಲಿ ಯಾವುದಾದರೂ ವಿಶೇಷ ಸ್ಥಳ ಇದೆಯೇ? (ಉ.ದಾ: ಪ್ರಯೋಗಾಲಯ, ಆಟದ ಮೈದಾನ, ಗ್ರಂಥಾಲಯ ಇತ್ಯಾದಿ)'),
('school_learning_question', 'question18', 'kn', 'ಸಂವಹನ ಒಂದು ಪ್ರಮುಖ ಕೌಶಲ. ನಿಮ್ಮ ಶಾಲೆಯಲ್ಲಿ ನಿಮ್ಮ ಅನಿಸಿಕೆ / ಅಭಿಪ್ರಾಯಗಳನ್ನು ವ್ಯಕ್ತಪಡಿಸಲು ನಿಮಗೆ ಎಲ್ಲಿ ಅವಕಾಶ ದೊರೆಯುತ್ತದೆ?'),
('school_learning_question', 'question19', 'kn', 'ಶಾಲಾ ಚಟುವಟಿಕೆಗಳು ಮತ್ತು ಕಲಿಕೆಯ ಬಗ್ಗೆ ನಿಮ್ಮ ಅಭಿಪ್ರಾಯಗಳೇನು?'),
('school_learning_question', 'question20', 'kn', 'ಶಾಲಾ ಚಟುವಟಿಕೆಗಳು ಮತ್ತು ಕಲಿಕೆಯ ಬಗ್ಗೆ ನಿಮ್ಮ ಪೋಷಕರೊಂದಿಗೆ ನೀವು ಮಾತನಾಡುತ್ತೀರಾ?'),
('school_learning_question', 'question21', 'kn', 'ಶಾಲಾ ಚಟುವಟಿಕೆಗಳು ಮತ್ತು ಕಲಿಕೆಯ ಬಗ್ಗೆ ನಿಮ್ಮ ಪೋಷಕರೊಂದಿಗೆ ಚರ್ಚಿಸಲು ನಿಮಗೆ ಇಷ್ಟವೇ? ಅವರೊಂದಿಗೆ ಯಾವ ವಿಷಯಗಳನ್ನು ಚರ್ಚಿಸುತ್ತೀರಿ?');

-- Helper: Kannada help texts (most are null in provided JSON, but good to have placeholders if needed)

-- Summary Questions Translations
-- Tamil
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('school_learning_summary_question', 'question1', 'ta', 'எனக்கு பிடித்த பாடங்கள்'),
('school_learning_summary_question', 'question2', 'ta', 'எனக்குப் பிடித்த பாடங்களின் அடிப்படையில் நான் தேர்ந்தெடுக்கக்கூடிய தொழில்கள்'),
('school_learning_summary_question', 'question3', 'ta', 'எனக்கு பிடிக்காத பாடங்கள்'),
('school_learning_summary_question', 'question4', 'ta', 'எனக்குப் பிடிக்காத பாடங்களில் முன்னேற்றம் கண்டால் நான் தேர்ந்தெடுக்கக்கூடிய தொழில்கள்'),
('school_learning_summary_question', 'question5', 'ta', 'கல்விப் பாடங்களுடன் நான் சிறப்பாகச் செயல்படும் பிற செயல்பாடுகள் / துறைகள்'),
('school_learning_summary_question', 'question6', 'ta', 'இந்தத் திறன்களை வளர்த்துக்கொண்டால், எனது வேலை / தொழிலைத் தேர்ந்தெடுக்க உதவும்.');

-- Tamil Summary Help
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('school_learning_summary_help', 'question1', 'ta', 'குறிப்பு: ஒவ்வொரு ஆர்வப் பாடத்தையும் அடிப்படையாகக் கொண்டு, உங்கள் தொழில் தேர்வைச் செய்யும் வாய்ப்பு உள்ளது. இந்தப் புத்தகத்தின் இறுதியில் “என் ஆர்வப் பாடங்கள்” என்ற பக்கத்தில் கொடுக்கப்பட்ட இடத்தில், எதிர்காலத்தில் நீங்கள் எந்த பாடங்களை கற்றுக்கொள்ள விரும்புகிறீர்கள், எந்த விஷயங்கள்/பாடங்கள் உங்களுக்கு ஏன் பிடிக்கின்றன என்பவற்றை பதிவு செய்யுங்கள். இதனால் பாடங்களுக்கு ஏற்ற தொழில்கள், இங்கு கற்ற பாடப்பிரிவுகள் எந்த தொழில்/துறையில் பயன்படும் என்பதையும் புரிந்து கொண்டு, எதிர்கால தொழில் முடிவுகளை எடுக்க உதவும்.'),
('school_learning_summary_help', 'question2', 'ta', 'உங்கள் ஆர்வப் பாடங்களை பதிவு செய்து, அவை எதிர்கால தொழில் தேர்வுக்கு எப்படி உதவும் என்பதை புரிந்து கொள்ளுங்கள்.');

-- Kannada Summary Questions
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('school_learning_summary_question', 'question1', 'kn', 'ನನಗೆ ಇಷ್ಟವಾದ ವಿಷಯಗಳು'),
('school_learning_summary_question', 'question2', 'kn', 'ನನಗೆ ಇಷ್ಟವಾದ ವಿಷಯಗಳ ಆಧಾರದ ಮೇಲೆ ನಾನು ಕೈಗೊಳ್ಳಬಹುದಾದ ವೃತ್ತಿಗಳು'),
('school_learning_summary_question', 'question3', 'kn', 'ನನಗೆ ಇಷ್ಟವಿಲ್ಲದ ವಿಷಯಗಳು'),
('school_learning_summary_question', 'question4', 'kn', 'ನನಗೆ ಇಷ್ಟವಿಲ್ಲದ ವಿಷಯಗಳಲ್ಲಿ ಪ್ರಗತಿ ಸಾಧಿಸಿದರೆ ನಾನು ಕೈಗೊಳ್ಳಬಹುದಾದ ವೃತ್ತಿಗಳು'),
('school_learning_summary_question', 'question5', 'kn', 'ಪಠ್ಯ ವಿಷಯಗಳ ಜೊತೆಗೆ ನಾನು ಉತ್ತಮವಾಗಿ ನಿರ್ವಹಿಸುವ ಇತರೆ ಚಟುವಟಿಕೆಗಳು / ಕ್ಷೇತ್ರಗಳು'),
('school_learning_summary_question', 'question6', 'kn', 'ಈ ಕೌಶಲಗಳನ್ನು ಉತ್ತಮಪಡಿಸಿಕೊಂಡರೆ, ನನ್ನ ಕೆಲಸ / ವೃತ್ತಿಯನ್ನು ಆಯ್ಕೆ ಮಾಡಲು ಸಹಾಯವಾಗುತ್ತದೆ.');



-- 4. Create/Update RPCs

-- Get School Learning Questions I18N
DROP FUNCTION IF EXISTS get_school_learning_questions_i18n(text);
CREATE OR REPLACE FUNCTION get_school_learning_questions_i18n(p_lang text)
RETURNS TABLE (
    id UUID,
    section TEXT,
    key TEXT,
    text TEXT,
    help_text TEXT,
    question_type TEXT,
    sequence_number INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.section,
        'question' || q.sequence_number as key,
        COALESCE(
            public.get_translation('school_learning_question', 'question' || q.sequence_number, p_lang),
            q.question_text
        ) as text,
        COALESCE(
            public.get_translation('school_learning_help', 'question' || q.sequence_number, p_lang),
            q.help_text
        ) as help_text,
        q.question_type,
        q.sequence_number
    FROM school_learning_questions q
    WHERE q.is_active = true
    ORDER BY q.sequence_number;
END $$;

GRANT EXECUTE ON FUNCTION get_school_learning_questions_i18n(text) TO authenticated;


-- Get School Learning Summary Questions I18N
DROP FUNCTION IF EXISTS get_school_learning_summary_questions_i18n(text);
CREATE OR REPLACE FUNCTION get_school_learning_summary_questions_i18n(p_lang text)
RETURNS TABLE (
    id UUID,
    key TEXT,
    text TEXT,
    help_text TEXT,
    sequence_number INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        'question' || q.sequence_number as key,
        COALESCE(
            public.get_translation('school_learning_summary_question', 'question' || q.sequence_number, p_lang),
            q.question_text
        ) as text,
        COALESCE(
            public.get_translation('school_learning_summary_help', 'question' || q.sequence_number, p_lang),
            q.help_text
        ) as help_text,
        q.sequence_number
    FROM school_learning_summary_questions q
    WHERE q.is_active = true
    ORDER BY q.sequence_number;
END $$;

GRANT EXECUTE ON FUNCTION get_school_learning_summary_questions_i18n(text) TO authenticated;


-- Get Module Title I18N
CREATE OR REPLACE FUNCTION get_school_learning_module_title_i18n(p_lang text)
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
    WHERE resource_type = 'school_learning_module' 
    AND resource_key = 'title'
    AND lang = p_lang;
    
    RETURN QUERY SELECT COALESCE(v_title, 'Me, My School, My Learning and I'), CAST(NULL AS TEXT);
END $$;

GRANT EXECUTE ON FUNCTION get_school_learning_module_title_i18n(text) TO authenticated;
