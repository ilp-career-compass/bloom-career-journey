-- Migration: Update ALL Assessment Summary Templates
-- This migration consolidates the summary questions for all assessment types into the central
-- assessment_summary_templates table, which is used by the AI Summary Service.
-- Sources:
-- - Inspiration: 20251230_update_inspiration_i18n.sql
-- - School Learning: 20251231_update_school_learning_i18n.sql
-- - Hobbies: 20251231_update_hobbies_i18n.sql
-- - About Me: 20251231_update_about_me_i18n.sql
-- - Dreams: 20250201000005_add_dreams_summary_template.sql
-- - Role Models: 20251231_update_role_models_i18n.sql (Q17, Q18)

-- 1. INSPIRATION
INSERT INTO assessment_summary_templates (assessment_type, title, summary_questions) VALUES
('inspiration', 'Summary: Things I was Inspired By', 
 '{
   "en": {
     "question1": "After watching all these videos, list the points that inspired you from your experience",
     "question2": "After watching these videos, which behavior do you think you should avoid? Write it down.",
     "question3": "Discuss with your friend about the character in this video that inspired you and a person in real life who has inspired you. Write a summary of your discussion."
   },
   "ta": {
     "question1": "இந்த அனைத்து வீடியோக்களையும் பார்த்த பிறகு, உங்கள் அனுபவத்தில் முக்கியமானவற்றை பட்டியலிடுங்கள்",
     "question2": "இந்த விடியோக்களை பார்த்த பிறகு, நீங்கள் தவிர்க்க வேண்டும் என்று நினைக்கும் செயல் என்ன? எழுதுங்கள்.",
     "question3": "இந்த விடியோவில் உங்களை கவர்ந்த கதாபாத்திரம் மற்றும் நிஜ வாழ்க்கையில் உங்களை கவர்ந்த நபர் பற்றி உங்கள் நண்பருடன் விவாதிக்கவும். உங்கள் விவாதத்தின் சுருக்கத்தை எழுதுங்கள்."
   },
   "kn": {
     "question1": "ಈ ಎಲ್ಲ ವಿಡಿಯೋವನ್ನು ನೋಡಿದಾಗ ನಿಮ್ಮ ಅನುಭವದಿಂದ ನೀವು ಪ್ರೇರಣೆ ಪಡೆದ ಅಂಶವನ್ನು ಪಟ್ಟಿಮಾಡಿ",
     "question2": "ಈ ಎಲ್ಲ ವಿಡಿಯೋಗಳನ್ನು ನೋಡಿದಾಗ ನೀವು ಅನುಭವಿಸಿದ ನಿಜ ಜೀವನದಲ್ಲಿ ಇರದಿದ್ದರೆ ನೀವು ಮಾಡಬೇಕಾದ ನಡವಳಿಕೆ ಯಾವುದು? ಅದನ್ನು ಬರೆಯಿರಿ.",
     "question3": "ನಿಮ್ಮ ಗೆಳೆಯರೊಂದಿಗೆ, ಈ ವಿಡಿಯೋದಲ್ಲಿ ನಿಮಗೆ ಪ್ರೇರಣೆ ನೀಡಿದ ಪಾತ್ರ ಮತ್ತು ಅದು ನಿಮ್ಮ ನಿಜ ಜೀವನದಲ್ಲಿ ಯಾರಿಗೆ ಪ್ರೇರಣೆಯಾದದ್ದೋ ಆ ವ್ಯಕ್ತಿಯ ಬಗ್ಗೆ ಚರ್ಚಿಸಿ. ಆ ಚರ್ಚೆಯ ಸಾರಾಂಶವನ್ನು ಬರೆಯಿರಿ."
   }
 }'::jsonb)
ON CONFLICT (assessment_type) DO UPDATE SET title = EXCLUDED.title, summary_questions = EXCLUDED.summary_questions, updated_at = NOW();

-- 2. DREAMS
INSERT INTO assessment_summary_templates (assessment_type, title, summary_questions) VALUES
('dreams', 'Summary: My Dream Portfolio', 
 '{
   "en": {
     "question1": "Dream",
     "question2": "Which quality, value, strength will help you achieve your dream",
     "question3": "What you will have to do to ensure that the dream doesn''t fail",
     "question4": "What should you study after 10th to achieve this dream (if applicable)"
   },
   "kn": {
     "question1": "ಕನಸು",
     "question2": "ನಿಮ್ಮ ಕನಸನ್ನು ಸಾಧಿಸಲು ನಿಮಗೆ ಸಹಾಯ ಮಾಡುವ ಯಾವ ಗುಣ, ಮೌಲ್ಯ, ಶಕ್ತಿ",
     "question3": "ಕನಸು ವಿಫಲವಾಗದಂತೆ ಮಾಡಲು ನೀವು ಏನು ಮಾಡಬೇಕು",
     "question4": "ಈ ಕನಸನ್ನು ಸಾಧಿಸಲು ನೀವು 10 ನೇ ತರಗತಿಯ ನಂತರ ಏನು ಅಧ್ಯಯನ ಮಾಡಬೇಕು (ಬೇಕಿದ್ದರೆ)"
   }
 }'::jsonb)
ON CONFLICT (assessment_type) DO UPDATE SET title = EXCLUDED.title, summary_questions = EXCLUDED.summary_questions, updated_at = NOW();

-- 3. SCHOOL LEARNING
INSERT INTO assessment_summary_templates (assessment_type, title, summary_questions) VALUES
('school_learning', 'Summary: Me, My School, My Learning and I', 
 '{
   "en": {
     "question1": "Subjects I like",
     "question2": "Careers I can pursue based on the subjects I like",
     "question3": "Subjects I do not like",
     "question4": "Careers I can pursue if I make progress in the subjects I do not like",
     "question5": "Other activities / areas in which I perform well along with academic subjects",
     "question6": "If I improve these skills, it will help me in choosing my job / career."
   },
   "ta": {
     "question1": "எனக்கு பிடித்த பாடங்கள்",
     "question2": "எனக்குப் பிடித்த பாடங்களின் அடிப்படையில் நான் தேர்ந்தெடுக்கக்கூடிய தொழில்கள்",
     "question3": "எனக்கு பிடிக்காத பாடங்கள்",
     "question4": "எனக்குப் பிடிக்காத பாடங்களில் முன்னேற்றம் கண்டால் நான் தேர்ந்தெடுக்கக்கூடிய தொழில்கள்",
     "question5": "கல்விப் பாடங்களுடன் நான் சிறப்பாகச் செயல்படும் பிற செயல்பாடுகள் / துறைகள்",
     "question6": "இந்தத் திறன்களை வளர்த்துக்கொண்டால், எனது வேலை / தொழிலைத் தேர்ந்தெடுக்க உதவும்."
   },
   "kn": {
     "question1": "ನನಗೆ ಇಷ್ಟವಾದ ವಿಷಯಗಳು",
     "question2": "ನನಗೆ ಇಷ್ಟವಾದ ವಿಷಯಗಳ ಆಧಾರದ ಮೇಲೆ ನಾನು ಕೈಗೊಳ್ಳಬಹುದಾದ ವೃತ್ತಿಗಳು",
     "question3": "ನನಗೆ ಇಷ್ಟವಿಲ್ಲದ ವಿಷಯಗಳು",
     "question4": "ನನಗೆ ಇಷ್ಟವಿಲ್ಲದ ವಿಷಯಗಳಲ್ಲಿ ಪ್ರಗತಿ ಸಾಧಿಸಿದರೆ ನಾನು ಕೈಗೊಳ್ಳಬಹುದಾದ ವೃತ್ತಿಗಳು",
     "question5": "ಪಠ್ಯ ವಿಷಯಗಳ ಜೊತೆಗೆ ನಾನು ಉತ್ತಮವಾಗಿ ನಿರ್ವಹಿಸುವ ಇತರೆ ಚಟುವಟಿಕೆಗಳು / ಕ್ಷೇತ್ರಗಳು",
     "question6": "ಈ ಕೌಶಲಗಳನ್ನು ಉತ್ತಮಪಡಿಸಿಕೊಂಡರೆ, ನನ್ನ ಕೆಲಸ / ವೃತ್ತಿಯನ್ನು ಆಯ್ಕೆ ಮಾಡಲು ಸಹಾಯವಾಗುತ್ತದೆ."
   }
 }'::jsonb)
ON CONFLICT (assessment_type) DO UPDATE SET title = EXCLUDED.title, summary_questions = EXCLUDED.summary_questions, updated_at = NOW();

-- 4. HOBBIES (Talents)
INSERT INTO assessment_summary_templates (assessment_type, title, summary_questions) VALUES
('hobbies', 'Summary: My Talents and Hobbies', 
 '{
   "en": {
     "question1": "Talents",
     "question2": "Do you want to make this talent a profession?",
     "question3": "Careers that match with these talents",
     "question4": "People you know who have made their talents into professions",
     "question5": "Each step",
     "question6": "Do you like to convert each step into a picture?",
     "question7": "Pictures that can cause difficulty at each step",
     "question8": "People known to you who have converted each of your steps into pictures"
   },
   "ta": {
     "question1": "திறமைகள்",
     "question2": "இந்த திறமையை தொழிலாக மாற்ற விருப்பமா?",
     "question3": "இந்த திறமைகளுடன் பொருந்தக்கூடிய தொழில்கள்",
     "question4": "தங்கள் திறமைகளை தொழில்களாக மாற்றியுள்ள உங்களுக்கு அறிமுகமான நபர்கள்",
     "question5": "ஒவ்வொரு அடியும்",
     "question6": "ஒவ்வொரு அடியையும் படமாக மாற்றுவது உங்களுக்கு பிடிக்குமா?",
     "question7": "ஒவ்வொரு படியுடனும் சிரமத்தை ஏற்படுத்தக்கூடிய படங்கள்",
     "question8": "உங்கள் ஒவ்வொரு அடியையும் படங்களாக மாற்றி வைத்துள்ள, உங்களுக்கு அறிமுகமான நபர்கள்"
   },
   "kn": {
     "question1": "ಪ್ರತಿಭೆಗಳು",
     "question2": "ಈ ಪ್ರತಿಭೆಯನ್ನು ವೃತ್ತಿಯಾಗಿ ಮಾಡಲು ಇಷ್ಟವೇ?",
     "question3": "ಈ ಪ್ರತಿಭೆಗಳೊಂದಿಗೆ ಹೊಂದಾಣಿಕೆಯಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು",
     "question4": "ತಮ್ಮ ಪ್ರತಿಭೆಗಳನ್ನು ವೃತ್ತಿಗಳಾಗಿ ಮಾಡಿಕೊಂಡಿರುವ ನಿಮಗೆ ಪರಿಚಿತ ವ್ಯಕ್ತಿಗಳು",
     "question5": "ಪ್ರತಿ ಹೆಜ್ಜೆ",
     "question6": "ಪ್ರತಿ ಹೆಜ್ಜೆಯನ್ನು ಚಿತ್ರವಾಗಿ ಮಾಡುವುದು ಇಷ್ಟವೇ?",
     "question7": "ಪ್ರತಿ ಹೆಜ್ಜೆಯೊಂದಿಗೆ ತೊಂದಾನಿಕೆಯಾಗಬಲ್ಲ ಚಿತ್ರಗಳು",
     "question8": "ನಿಮ್ಮ ಪ್ರತಿ ಹೆಜ್ಜೆಯನ್ನು ಚಿತ್ರಗಳನ್ನಾಗಿ ಮಾಡಿಕೊಂಡಿರುವ ನಿಮಗೆ ಪರಿಚಯವಿರುವ ವ್ಯಕ್ತಿಗಳು"
   }
 }'::jsonb)
ON CONFLICT (assessment_type) DO UPDATE SET title = EXCLUDED.title, summary_questions = EXCLUDED.summary_questions, updated_at = NOW();

-- 5. ABOUT ME
INSERT INTO assessment_summary_templates (assessment_type, title, summary_questions) VALUES
('about_me', 'Summary: About Me', 
 '{
   "en": {
     "header1": "Prepare a personal profile or your own self-portrait. Summarize the points you wrote about yourself above in one or a few words.",
     "question1": "Who are my friends outside my family?",
     "question2": "What activities do I do daily?",
     "question3": "Which activities do I enjoy during school time?",
     "question4": "Which activities do I enjoy outside school?",
     "question5": "What activities do I enjoy personally?",
     "question6": "What activities do I enjoy doing as a team?",
     "question7": "Which school activity do I find difficult even though I must do it? Which activity do I find difficult to manage after school or outside school?",
     "question8": "What activities must I do?",
     "question9": "Which activities can I do easily?",
     "question10": "Which activities are not easy for me to do?",
     "question11": "What qualities do I like about myself?",
     "question12": "What qualities do others like in me?",
     "question13": "Which qualities or aspects do I need to improve?"
   },
   "ta": {
     "header1": "ஒரு தனிப்பட்ட சுயவிவரம் அல்லது உங்கள் சொந்த சுயப்படத்தை தயாரிக்கவும். மேலே உங்களைப் பற்றி நீங்கள் எழுதிய அம்சங்களை ஒரு அல்லது சில சொற்களில் சுருக்கமாக எழுதுங்கள்.",
     "question1": "என் குடும்பத்தைத் தவிர, என் நண்பர்கள் யார்?",
     "question2": "நான் தினமும் என்ன வேலைகளை செய்கிறேன்?",
     "question3": "பள்ளி நேரத்தில் நான் ரசிக்கும் செயல்கள் என்ன?",
     "question4": "பள்ளிக்கு வெளியே நான் ரசிக்கும் செயல்கள் என்ன?",
     "question5": "தனிப்பட்ட முறையில் நான் ரசிக்கும் செயல்கள் என்ன?",
     "question6": "குழுவாகச் செய்யும்போது நான் ரசிக்கும் செயல்கள் என்ன?",
     "question7": "பள்ளியில் செய்ய வேண்டியிருந்தாலும் எனக்கு கடினமாக இருக்கும் செயல் எது? பள்ளிக்கு பிறகு அல்லது பள்ளிக்கு வெளியே செய்ய கடினமாக இருப்பது எது?",
     "question8": "நான் கட்டாயமாக செய்ய வேண்டிய செயல்கள் என்ன?",
     "question9": "நான் எளிதாக செய்யக்கூடிய செயல்கள் என்ன?",
     "question10": "எனக்கு எளிதாக செய்ய முடியாத செயல்கள் என்ன?",
     "question11": "என்னிடத்தில் நான் விரும்பும் குணங்கள் என்ன?",
     "question12": "மற்றவர்கள் என்னிடத்தில் விரும்பும் குணங்கள் என்ன?",
     "question13": "நான் மேம்படுத்த வேண்டிய குணங்கள் /அம்சங்கள் என்ன?"
   },
   "kn": {
     "header1": "ವೈಯಕ್ತಿಕ ಪ್ರೊಫೈಲ್ ಅಥವಾ ನಿಮ್ಮದೇ ವ್ಯಕ್ತಿಚಿತ್ರವನ್ನು ಸಿದ್ಧಪಡಿಸಿ. ಮೇಲೆ ನಿಮ್ಮ ಬಗ್ಗೆ ನೀವು ಬರೆದ ಅಂಶಗಳನ್ನು ಒಂದು ಅಥವಾ ಕೆಲವು ಪದಗಳಲ್ಲಿ ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಬರೆಯಿರಿ.",
     "question1": "ನನ್ನ ಸ್ನೇಹಿತರು ಯಾರು?",
     "question2": "ನಾನು ದಿನನಿತ್ಯದಲ್ಲಿ ಯಾವ ಕೆಲಸಗಳನ್ನು ಮಾಡುತ್ತೇನೆ?",
     "question3": "ಶಾಲೆಯ ಸಮಯದಲ್ಲಿ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?",
     "question4": "ಶಾಲೆ ಹೊರಗೆ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?",
     "question5": "ವೈಯಕ್ತಿಕವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸಗಳು / ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?",
     "question6": "ತಂಡವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸಗಳು / ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?",
     "question7": "ಶಾಲೆಯಲ್ಲಿ ಮಾಡಬೇಕಾದರೂ ನನಗೆ ಕಷ್ಟವಾಗುವ ಚಟುವಟಿಕೆ ಯಾವುದು? ಶಾಲೆಯ ನಂತರ ಅಥವಾ ಶಾಲೆ ಹೊರಗೆ ನನಗೆ ನಿರ್ವಹಿಸಲು ಕಷ್ಟವಾಗುವ ಚಟುವಟಿಕೆ ಯಾವುದು?",
     "question8": "ನಾನು ಮಾಡಲೇಬೇಕಾದ ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?",
     "question9": "ನಾನು ಸುಲಭವಾಗಿ ಮಾಡಬಹುದಾದ ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?",
     "question10": "ನನಗೆ ಸುಲಭವಾಗಿ ಮಾಡಲು ಬಾರದ ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?",
     "question11": "ನನ್ನಲ್ಲಿರುವ ನಾನು ಇಷ್ಟಪಡುವ ಗುಣಗಳು ಯಾವುವು?",
     "question12": "ಇತರರು ನನ್ನಲ್ಲಿ ಇಷ್ಟ ಪಡುವ ಗುಣಗಳು ಯಾವುವು?",
     "question13": "ನಾನು ಸುಧಾರಿಸಿಕೊಳ್ಳಬೇಕಾದ ಗುಣಗಳು / ಅಂಶಗಳು ಯಾವುವು?"
   }
 }'::jsonb)
ON CONFLICT (assessment_type) DO UPDATE SET title = EXCLUDED.title, summary_questions = EXCLUDED.summary_questions, updated_at = NOW();

-- 6. ROLE MODELS
INSERT INTO assessment_summary_templates (assessment_type, title, summary_questions) VALUES
('role_models', 'Summary: My Role Models', 
 '{
   "en": {
     "question1": "My future plan",
     "question2": "Write 5 to 10 questions you would like to ask your role model for career guidance."
   },
   "ta": {
     "question1": "என் எதிர்கால திட்டம்",
     "question2": "உங்கள் முன்மாதிரி நபரிடம் உங்கள் தொழில் வழிகாட்டலுக்காக நீங்கள் கேட்க விரும்பும் 5 முதல் 10 கேள்விகளை எழுதுங்கள்."
   },
   "kn": {
     "question1": "ನನ್ನ ಮುಂದಿನ ಯೋಜನೆ",
     "question2": "ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಯೊಂದಿಗೆ ನಿಮ್ಮ ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ನೀವು ಕೇಳಲು ಬಯಸುವ 5 ರಿಂದ 10 ಪ್ರಶ್ನೆಗಳನ್ನು ಬರೆಯಿರಿ."
   }
 }'::jsonb)
ON CONFLICT (assessment_type) DO UPDATE SET title = EXCLUDED.title, summary_questions = EXCLUDED.summary_questions, updated_at = NOW();

