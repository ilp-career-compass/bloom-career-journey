-- Migration: Update Talents and Hobbies Content (I18N)

-- 1. Drop constraints if they exist to avoid issues
ALTER TABLE hobbies_questions DROP CONSTRAINT IF EXISTS hobbies_questions_section_check;

-- Optional: Add constraint if needed, but keeping it flexible
-- ALTER TABLE hobbies_questions ADD CONSTRAINT hobbies_questions_section_check CHECK (section IN ('section1', 'section2', 'section3'));

-- 2. Update/Reset Hobbies Questions
DELETE FROM hobbies_questions;

-- Inserting English questions (Base)
-- Section 1: Hobbies & Interests
INSERT INTO hobbies_questions (section, question_text, help_text, sequence_number) VALUES
('section1', 'What activities / work do you do in your free time?', 'This question asks about the activities you do in your free time. You can write about your hobbies or favorite activities. For example: reading books, drawing, playing games, listening to music.', 1);

-- Section 2: Talents & Practice
INSERT INTO hobbies_questions (section, question_text, help_text, sequence_number) VALUES
('section2', 'Do you have any talent? List any one talent that you have.', 'This question asks about a talent you have. You can write any one activity that you are good at. For example: singing, drawing, dancing, sports.', 2),
('section2', 'Among the talents listed above, which talent do you like the most? Why? Explain the reason.', 'This question asks you to choose your favorite talent from the list you wrote earlier and explain why you like it. You can write the answer in 2–3 sentences. Example: I like singing the most because it makes me happy.', 3),
('section2', 'Have your talents (hobbies) changed at any time?', 'This question asks whether your hobbies or talents have changed over time. You can answer Yes or No and give a short explanation. Example: Yes, earlier I liked drawing, but now I like reading books.', 4),
('section2', 'What inspired your talents? Did any of your talents come from your family by imitation? Think about this.', 'This question asks what inspired your talent. The inspiration could be from parents, teachers, friends, or family members. You can also mention if you learned the talent by watching someone in your family. Example: I developed an interest in singing by watching my mother sing.', 5),
('section2', 'Do you know anyone who has a similar talent or that ability? Who is that person?', 'This question asks whether you know someone who has a talent similar to yours. That person could be a friend, relative, teacher, or any known person. You can mention who the person is. Example: My friend Ravi is good at drawing.', 6),
('section2', 'How do you feel when you engage in your favorite talent? Does it help you relax or feel more confident?', 'Write whether your favorite talent makes you feel happy, relaxed, or more confident.', 7),
('section2', 'List the talents you have.', 'Write the talents that you are good at in a list.', 8),
('section2', 'Are you trying to improve your talent further? If yes, explain how.', 'Write what you are doing to improve your talent.', 9);

-- Section 3: Support & Career Connection
INSERT INTO hobbies_questions (section, question_text, help_text, sequence_number) VALUES
('section3', 'Do you get encouragement and opportunities at school or at home to continue and showcase your talents?', 'Write whether you get encouragement and opportunities to show your talents at school or home.', 10),
('section3', 'Do your parents support your efforts to further improve your talent? If yes, in what way?', 'Write how your parents support you in developing your talent.', 11),
('section3', 'Does any of your talent match with your natural abilities and strengths?', 'Write whether your talent matches your natural abilities and strengths.', 12),
('section3', 'Can any of your talents be pursued as your career in the future? If yes, what steps or plans will you follow for that?', 'Write whether you want to make your talent a future career and the plan for it.', 13),
('section3', 'Do you know anyone who has made their talent their profession? Who are they and how did they make their talent their career?', 'Write briefly about a person who turned their talent into a career.', 14);


-- 2. Create Talents Summary Questions Table
CREATE TABLE IF NOT EXISTS hobbies_summary_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    help_text TEXT,
    sequence_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE hobbies_summary_questions ENABLE ROW LEVEL SECURITY;

-- Policy for reading
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON hobbies_summary_questions;
CREATE POLICY "Enable read access for authenticated users" ON hobbies_summary_questions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Clean up existing summary questions
DELETE FROM hobbies_summary_questions;

-- Insert Summary Questions
INSERT INTO hobbies_summary_questions (question_text, help_text, sequence_number) VALUES
('Talents', NULL, 1),
('Do you want to make this talent a profession?', NULL, 2),
('Careers that match with these talents', NULL, 3),
('People you know who have made their talents into professions', NULL, 4),
('Each step', NULL, 5),
('Do you like to convert each step into a picture?', NULL, 6),
('Pictures that can cause difficulty at each step', NULL, 7),
('People known to you who have converted each of your steps into pictures', NULL, 8);


-- 3. Insert Translations into content_translations
DELETE FROM content_translations WHERE resource_type IN ('hobbies_question', 'hobbies_help', 'hobbies_module', 'hobbies_summary_question', 'hobbies_summary_help');

-- Module Title
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('hobbies_module', 'title', 'ta', 'என் திறமைகள் மற்றும் பொழுதுபோக்குகள்'),
('hobbies_module', 'title', 'kn', 'ನನ್ನ ಪ್ರತಿಭೆಗಳು ಮತ್ತು ಹವ್ಯಾಸಗಳು');

-- Tamil Questions
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('hobbies_question', 'question1', 'ta', '1. நீங்கள் ஓய்வு நேரத்தில் எந்த வேலைகள் / செயல்களை செய்கிறீர்கள்?'),
('hobbies_question', 'question2', 'ta', '2. உங்களுக்கு ஏதேனும் ஒரு திறமை உள்ளதா? உங்களிடம் உள்ள ஒரு திறமையை பட்டியலிடுங்கள்?'),
('hobbies_question', 'question3', 'ta', '3. மேலே பட்டியலிட்ட திறமைகளில் உங்களுக்கு மிகவும் பிடித்த திறமை எது? ஏன்? காரணம் விளக்குங்கள்.'),
('hobbies_question', 'question4', 'ta', '4. உங்கள் திறமைகள் (பொழுதுபோக்குகள்) எப்போதாவது மாறியுள்ளதா?'),
('hobbies_question', 'question5', 'ta', '5. உங்கள் திறமைகளுக்கு ஊக்கம் அளித்தது எது? ஏதேனும் ஒரு திறமை உங்கள் குடும்பத்திலிருந்து, முன்மாதிரியாக (பின்பற்றி) வந்ததா? இதைப் பற்றி சிந்தியுங்கள்.'),
('hobbies_question', 'question6', 'ta', '6. உங்களுக்கு அறிமுகமானவர்களில் யாராவது இதே போன்ற திறமை அல்லது அந்த சக்தியை கொண்டுள்ளார்களா? அவர்கள் யார்?'),
('hobbies_question', 'question7', 'ta', '7. உங்களுக்கு பிடித்த திறமையில் ஈடுபடும்போது நீங்கள் எப்படி உணர்கிறீர்கள் ? அது உங்களுக்கு ஓய்வு பெற அல்லது அதிக தன்னம்பிக்கையை உணர உதவுகிறதா?'),
('hobbies_question', 'question8', 'ta', '8. உங்களிடம் உள்ள திறமைகளை (Talents) பட்டியலிடுங்கள்.'),
('hobbies_question', 'question9', 'ta', '9. உங்கள் திறமையை மேலும் மேம்படுத்த நீங்கள் முயற்சி செய்து கொண்டிருக்கிறீர்களா? செய்தால், எவ்வாறு என்பதை விளக்குங்கள்.'),
('hobbies_question', 'question10', 'ta', '10. உங்கள் திறமைகளை தொடர்ந்து வெளிப்படுத்த பள்ளியிலும் வீட்டிலும் ஊக்கம் மற்றும் வாய்ப்பு கிடைக்கிறதா?'),
('hobbies_question', 'question11', 'ta', '11. உங்கள் திறமையை மேலும் மேம்படுத்த நீங்கள் செய்யும் முயற்சிகளுக்கு உங்கள் பெற்றோர் ஆதரவு அளிக்கிறார்களா? எவ்வாறு என்பதை விளக்குங்கள்.'),
('hobbies_question', 'question12', 'ta', '12. உங்களின் ஏதேனும் ஒரு திறமை உங்கள் இயல்பான திறன் மற்றும் தன்மைகளுடன் பொருந்துகிறதா?'),
('hobbies_question', 'question13', 'ta', '13. உங்கள் ஏதேனும் ஒரு திறமையை எதிர்காலத்தில் உங்கள் தொழிலாக மாற்ற முடியுமா? முடிந்தால், அதற்காக நீங்கள் பின்பற்றும் திட்டம் / நடைமுறை என்ன?'),
('hobbies_question', 'question14', 'ta', '14. தங்கள் திறமையை தொழிலாக மாற்றிக் கொண்டுள்ள உங்கள் அறிமுகத்தில் யாராவது உள்ளார்களா? அவர்கள் யார் மற்றும் எவ்வாறு அவர்கள் தங்கள் திறமையை தொழிலாக மாற்றினர் என்பதை விளக்குங்கள்.');

-- Tamil Help Texts
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('hobbies_help', 'question1', 'ta', 'இந்த கேள்வி, நீங்கள் ஓய்வு நேரத்தில் செய்ய விரும்பும் செயல்களை பற்றி கேட்கிறது. உங்கள் பொழுதுபோக்கு அல்லது விருப்பமான செயல்களை எழுதலாம். உதாரணமாக: புத்தகம் படித்தல், ஓவியம் வரைவது, விளையாடுதல், பாடல் கேட்பது.'),
('hobbies_help', 'question2', 'ta', 'இந்த கேள்வி, உங்களிடம் இருக்கும் திறமை பற்றி கேட்கிறது. நீங்கள் நன்றாக செய்யக்கூடிய ஒரு செயலை எழுதலாம். உதாரணமாக: பாடல் பாடுதல், ஓவியம் வரைவது, நடனம், விளையாட்டுகள்.'),
('hobbies_help', 'question3', 'ta', 'இந்த கேள்வி, நீங்கள் பட்டியலிட்ட திறமைகளில் உங்களுக்கு மிகவும் பிடித்ததை தேர்வு செய்து, அதை ஏன் விரும்புகிறீர்கள் என்பதை காரணத்துடன் எழுத சொல்லுகிறது. 2–3 வரிகளில் விளக்கமாக எழுதலாம். உதாரணம்: எனக்கு பாடல் பாடுவது மிகவும் பிடிக்கும். அது எனக்கு மகிழ்ச்சி தருகிறது.'),
('hobbies_help', 'question4', 'ta', 'இந்த கேள்வி, உங்கள் பொழுதுபோக்குகள் அல்லது திறமைகள் காலத்துக்கு காலம் மாறியுள்ளதா என்பதை கேட்கிறது. ஆம் அல்லது இல்லை என்று பதிலளித்து, சிறிது விளக்கலாம். உதாரணம்: ஆம், முன்பு ஓவியம் வரைவது பிடித்தது. இப்போது புத்தகம் படிப்பது பிடிக்கிறது.'),
('hobbies_help', 'question5', 'ta', 'இந்த கேள்வி, உங்கள் திறமைக்கு ஊக்கம் அளித்த காரணம் என்ன என்பதை கேட்கிறது. அது பெற்றோர், ஆசிரியர், நண்பர் அல்லது குடும்ப உறுப்பினராக இருக்கலாம். குடும்பத்தில் யாரையாவது பார்த்து அந்த திறமை வந்ததா என்பதையும் எழுதலாம். உதாரணம்: எனக்கு பாடல் பாடுவதில் ஆர்வம் என் அம்மாவைப் பார்த்து வந்தது.'),
('hobbies_help', 'question6', 'ta', 'இந்த கேள்வி, உங்களுக்கு தெரிந்தவர்களில் உங்களைப் போன்ற திறமை கொண்டவர் உள்ளாரா என்பதை கேட்கிறது. அந்த நபர் நண்பர், உறவினர், ஆசிரியர் அல்லது பிரபலமானவர் யாராகவும் இருக்கலாம். அவரின் பெயர் அல்லது அவருடன் உள்ள தொடர்பை எழுதலாம். உதாரணம்: என் நண்பர் ரவி நல்ல ஓவியர்.'),
('hobbies_help', 'question7', 'ta', 'உங்கள் பிடித்த திறமை உங்களுக்கு மகிழ்ச்சி, ஓய்வு அல்லது தன்னம்பிக்கை தருகிறதா என்பதை எழுதுங்கள்.'),
('hobbies_help', 'question8', 'ta', 'நீங்கள் நன்றாக செய்யக்கூடிய திறமைகளை பட்டியலாக எழுதுங்கள்.'),
('hobbies_help', 'question9', 'ta', 'உங்கள் திறமையை மேம்படுத்த நீங்கள் செய்யும் முயற்சிகளை எழுதுங்கள்.'),
('hobbies_help', 'question10', 'ta', 'பள்ளி அல்லது வீட்டில் உங்கள் திறமைகளை வெளிப்படுத்த ஊக்கம் கிடைக்கிறதா என்பதை எழுதுங்கள்.'),
('hobbies_help', 'question11', 'ta', 'உங்கள் திறமையை வளர்க்க பெற்றோர் எப்படி ஆதரிக்கிறார்கள் என்பதை எழுதுங்கள்.'),
('hobbies_help', 'question12', 'ta', 'உங்கள் திறமை உங்கள் இயல்பான திறன்களுடன் பொருந்துகிறதா என்பதை எழுதுங்கள்.'),
('hobbies_help', 'question13', 'ta', 'உங்கள் திறமையை எதிர்கால தொழிலாக மாற்ற விருப்பமுள்ளதா மற்றும் அதற்கான திட்டத்தை எழுதுங்கள்.'),
('hobbies_help', 'question14', 'ta', 'திறமையை தொழிலாக மாற்றிய ஒருவரைப் பற்றி சுருக்கமாக எழுதுங்கள்.');


-- Kannada Questions
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('hobbies_question', 'question1', 'kn', '1. ನೀವು ಬಿಡುವಿನ ವೇಳೆಯಲ್ಲಿ ಯಾವ ಕೆಲಸ / ಚಟುವಟಿಕೆಗಳನ್ನು ಮಾಡುತ್ತೀರಿ?'),
('hobbies_question', 'question2', 'kn', '2. ನಿಮಗೆ ಯಾವುದಾದರೂ ಪ್ರತಿಭೆ ಇದೆಯೇ? ನಿಮ್ಮಲ್ಲಿರುವ ಒಬ್ಬೇ ಒಂದು ಪ್ರತಿಭೆಯನ್ನು ಪಟ್ಟಿ ಮಾಡಿ.'),
('hobbies_question', 'question3', 'kn', '3. ನೀವು ಮೇಲೆ ಪಟ್ಟಿ ಮಾಡಿದ ಪ್ರತಿಭೆಗಳಲ್ಲೆ ನಿಮ್ಮ ಮೆಚ್ಚಿನ ಪ್ರತಿಭೆ ಯಾವುದು? ಯಾಕೆ? ಕಾರಣ ವಿವರಿಸಿ.'),
('hobbies_question', 'question4', 'kn', '4. ನಿಮ್ಮ ಪ್ರತಿಭೆಗಳು (ಹವ್ಯಾಸಗಳು) ಎಂದಾದರೂ ಬದಲಾಗಿವೆಯೇ?'),
('hobbies_question', 'question5', 'kn', '5. ನಿಮ್ಮ ಪ್ರತಿಭೆಗಳಿಗೆ ಪ್ರೇರಣೆ ನೀಡಿದ ಸಂಗತಿ ಯಾವುದು? ಯಾವುದಾದರೂ ಪ್ರತಿಭೆ ನಿಮ್ಮ ಕುಟುಂಬದಿಂದ, ಅನುಕರಣವಾಗಿ ಬಂದಿದೆಯೇ? ಈ ಕುರಿತು ಆಲೋಚಿಸಿ.'),
('hobbies_question', 'question6', 'kn', '6. ನಿಮಗೆ ಪರಿಚಿತರಾಗಿರುವ ಯಾರಾದರೂ ಇದೇ ರೀತಿಯ ಪ್ರತಿಭೆ ಅಥವಾ ಆ ಶಕ್ತಿಯನ್ನು ಹೊಂದಿದ್ದಾರೆಯೇ? ಅವರು ಯಾರು?'),
('hobbies_question', 'question7', 'kn', '7. ನಿಮ್ಮ ಮೆಚ್ಚಿನ ಪ್ರತಿಭೆಯಲ್ಲಿ ತೊಡಗಿಕೊಂಡಾಗ ನಿಮಗೆ ಹೇಗನಿಸುತ್ತದೆ? ಅದು ನಿಮಗೆ ವಿಶ್ರಾಂತಿ ಪಡೆಯಲು ಅಥವಾ ಹೆಚ್ಚು ಆತ್ಮವಿಶ್ವಾಸವನ್ನು ಅನುಭವಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆಯೇ?'),
('hobbies_question', 'question8', 'kn', '8. ನಿಮ್ಮಲ್ಲಿರುವ ಪ್ರತಿಭೆಗಳನ್ನು (Talents) ಪಟ್ಟಿ ಮಾಡಿ.'),
('hobbies_question', 'question9', 'kn', '9. ನಿಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ಇನ್ನಷ್ಟು ಉತ್ತಮಗೊಳಿಸಲು ನೀವು ಪ್ರಯತ್ನ ಮಾಡುತ್ತಿದ್ದೀರಾ? ಮಾಡುತ್ತಿದ್ದರೆ ಹೇಗೆ ಎಂಬುದನ್ನು ವಿವರಿಸಿ.'),
('hobbies_question', 'question10', 'kn', '10. ನಿಮ್ಮ ಪ್ರತಿಭೆಗಳನ್ನು ಮುಂದುವರಿಸಿ ಪ್ರದರ್ಶಿಸಲು ಶಾಲೆ ಅಥವಾ ಮನೆಯಲ್ಲೇ ಪ್ರೋತ್ಸಾಹ ಹಾಗೂ ಅವಕಾಶ ದೊರಕುತ್ತಿದೆಯೇ?'),
('hobbies_question', 'question11', 'kn', '11. ನಿಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ಇನ್ನಷ್ಟು ಉತ್ತಮಗೊಳಿಸಲು ನಿಮ್ಮ ಪ್ರಯತ್ನಕ್ಕೆ ಪಾಲಕರು ಬೆಂಬಲ ನೀಡುತ್ತಾರೆಯೇ? ಯಾವ ರೀತಿಯಲ್ಲಿ ವಿವರಿಸಿ.'),
('hobbies_question', 'question12', 'kn', '12. ನಿಮ್ಮ ಯಾವುದಾದರೂ ಪ್ರತಿಭೆ ನಿಮ್ಮ ಸ್ವಭಾವಿಕ ಪ್ರತಿಭೆ ಮತ್ತು ಸಾಮರ್ಥ್ಯಗಳೊಂದಿಗೆ ಹೊಂದಿಕೆಯಾಗುತ್ತಿದೆಯೇ?'),
('hobbies_question', 'question13', 'kn', '13. ನಿಮ್ಮ ಯಾವುದಾದರೂ ಪ್ರತಿಭೆಯನ್ನು ಭವಿಷ್ಯದಲ್ಲಿ ನಿಮ್ಮ ವೃತ್ತಿಯಾಗಿ ಮುಂದುವರಿಸಲು ಸಾಧ್ಯವೇ? ಸಾಧ್ಯವೆಂದರೆ, ಅದಕ್ಕಾಗಿ ನೀವು ಅನುಸರಿಸುವ ಕ್ರಮ / ಯೋಜನೆ ಯಾವುದು?'),
('hobbies_question', 'question14', 'kn', '14. ತಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ವೃತ್ತಿಯಾಗಿ ಮಾಡಿಕೊಂಡಿರುವ ನಿಮ್ಮ ಪರಿಚಯದ ಯಾರಾದರೂ ಇದ್ದಾರೆಯೇ? ಅವರು ಯಾರು ಮತ್ತು ಹೇಗೆ ಅವರು ತಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ವೃತ್ತಿಯಾಗಿ ಮಾಡಿಕೊಂಡರು ಎಂಬುದನ್ನು ವಿವರಿಸಿ.');


-- Summary Questions Translations
-- Tamil
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('hobbies_summary_question', 'question1', 'ta', 'திறமைகள்'),
('hobbies_summary_question', 'question2', 'ta', 'இந்த திறமையை தொழிலாக மாற்ற விருப்பமா?'),
('hobbies_summary_question', 'question3', 'ta', 'இந்த திறமைகளுடன் பொருந்தக்கூடிய தொழில்கள்'),
('hobbies_summary_question', 'question4', 'ta', 'தங்கள் திறமைகளை தொழில்களாக மாற்றியுள்ள உங்களுக்கு அறிமுகமான நபர்கள்'),
('hobbies_summary_question', 'question5', 'ta', 'ஒவ்வொரு அடியும்'),
('hobbies_summary_question', 'question6', 'ta', 'ஒவ்வொரு அடியையும் படமாக மாற்றுவது உங்களுக்கு பிடிக்குமா?'),
('hobbies_summary_question', 'question7', 'ta', 'ஒவ்வொரு படியுடனும் சிரமத்தை ஏற்படுத்தக்கூடிய படங்கள்'),
('hobbies_summary_question', 'question8', 'ta', 'உங்கள் ஒவ்வொரு அடியையும் படங்களாக மாற்றி வைத்துள்ள, உங்களுக்கு அறிமுகமான நபர்கள்');


-- Kannada Summary Questions
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('hobbies_summary_question', 'question1', 'kn', 'ಪ್ರತಿಭೆಗಳು'),
('hobbies_summary_question', 'question2', 'kn', 'ಈ ಪ್ರತಿಭೆಯನ್ನು ವೃತ್ತಿಯಾಗಿ ಮಾಡಲು ಇಷ್ಟವೇ?'),
('hobbies_summary_question', 'question3', 'kn', 'ಈ ಪ್ರತಿಭೆಗಳೊಂದಿಗೆ ಹೊಂದಾಣಿಕೆಯಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು'),
('hobbies_summary_question', 'question4', 'kn', 'ತಮ್ಮ ಪ್ರತಿಭೆಗಳನ್ನು ವೃತ್ತಿಗಳಾಗಿ ಮಾಡಿಕೊಂಡಿರುವ ನಿಮಗೆ ಪರಿಚಿತ ವ್ಯಕ್ತಿಗಳು'),
('hobbies_summary_question', 'question5', 'kn', 'ಪ್ರತಿ ಹೆಜ್ಜೆ'),
('hobbies_summary_question', 'question6', 'kn', 'ಪ್ರತಿ ಹೆಜ್ಜೆಯನ್ನು ಚಿತ್ರವಾಗಿ ಮಾಡುವುದು ಇಷ್ಟವೇ?'),
('hobbies_summary_question', 'question7', 'kn', 'ಪ್ರತಿ ಹೆಜ್ಜೆಯೊಂದಿಗೆ ತೊಂದಾನಿಕೆಯಾಗಬಲ್ಲ ಚಿತ್ರಗಳು'),
('hobbies_summary_question', 'question8', 'kn', 'ನಿಮ್ಮ ಪ್ರತಿ ಹೆಜ್ಜೆಯನ್ನು ಚಿತ್ರಗಳನ್ನಾಗಿ ಮಾಡಿಕೊಂಡಿರುವ ನಿಮಗೆ ಪರಿಚಯವಿರುವ ವ್ಯಕ್ತಿಗಳು');



-- 4. Create/Update RPCs

-- Get Hobbies Questions I18N
DROP FUNCTION IF EXISTS get_hobbies_questions_i18n(text);
CREATE OR REPLACE FUNCTION get_hobbies_questions_i18n(p_lang text)
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
            public.get_translation('hobbies_question', 'question' || q.sequence_number, p_lang),
            q.question_text
        ) as text,
        COALESCE(
            public.get_translation('hobbies_help', 'question' || q.sequence_number, p_lang),
            q.help_text
        ) as help_text,
        q.sequence_number
    FROM hobbies_questions q
    WHERE q.is_active = true
    ORDER BY q.sequence_number;
END $$;

GRANT EXECUTE ON FUNCTION get_hobbies_questions_i18n(text) TO authenticated;


-- Get Hobbies Summary Questions I18N
DROP FUNCTION IF EXISTS get_hobbies_summary_questions_i18n(text);
CREATE OR REPLACE FUNCTION get_hobbies_summary_questions_i18n(p_lang text)
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
            public.get_translation('hobbies_summary_question', 'question' || q.sequence_number, p_lang),
            q.question_text
        ) as text,
        COALESCE(
            public.get_translation('hobbies_summary_help', 'question' || q.sequence_number, p_lang),
            q.help_text
        ) as help_text,
        q.sequence_number
    FROM hobbies_summary_questions q
    WHERE q.is_active = true
    ORDER BY q.sequence_number;
END $$;

GRANT EXECUTE ON FUNCTION get_hobbies_summary_questions_i18n(text) TO authenticated;


-- Get Module Title I18N
CREATE OR REPLACE FUNCTION get_hobbies_module_title_i18n(p_lang text)
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
    WHERE resource_type = 'hobbies_module' 
    AND resource_key = 'title'
    AND lang = p_lang;
    
    RETURN QUERY SELECT COALESCE(v_title, 'My Talents and Hobbies'), CAST(NULL AS TEXT);
END $$;

GRANT EXECUTE ON FUNCTION get_hobbies_module_title_i18n(text) TO authenticated;
