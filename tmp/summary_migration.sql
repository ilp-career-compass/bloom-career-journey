-- 1. Update My Inspiration Summary Questions
TRUNCATE inspiration_summary_questions;
INSERT INTO inspiration_summary_questions (sequence_number, section_header, question_text) VALUES
(1, 'What inspired me to…', 'After watching all these videos, list the points that inspired you from your experience'),
(2, NULL, 'After watching these videos, which behavior do you think you should avoid? Write it down.'),
(3, NULL, 'Discuss with your friend about the character in this video that inspired you and a person in real life who has inspired you. Write a summary of your discussion.');

-- My Inspiration Translations
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('inspiration_summary_question', 'header1', 'ta', 'எனக்கு ஊக்கம் அளித்தது…'),
('inspiration_summary_question', 'question1', 'ta', 'இந்த அனைத்து வீடியோக்களையும் பார்த்த பிறகு, உங்கள் அனுபவத்தில் உங்களை ஊக்கமளித்த முக்கியமானவற்றை பட்டியலிடுங்கள்'),
('inspiration_summary_question', 'question2', 'ta', 'இந்த வீடியோக்களை பார்த்த பிறகு, நீங்கள் தவிர்க்க வேண்டும் என்று நினைக்கும் செயல் என்ன? எழுதுங்கள்.'),
('inspiration_summary_question', 'question3', 'ta', 'உங்கள் நண்பர்களுடன், இந்த வீடியோவில் உங்களுக்கு ஊக்கமளித்த பாத்திரம் யார், மேலும் அது உங்கள் நிஜ வாழ்க்கையில் யாரை அடிப்படையாகக் கொண்டு உருவாக்கப்பட்டது என்பதைக் குறித்து விவாதிக்கவும். அந்த விவாதத்தின் சுருக்கத்தை எழுதுங்கள்.'),
('inspiration_summary_question', 'header1', 'kn', 'ನಾನು ಸ್ಫರ್ತಿ ಪಡೆದ ಅಂಶಗಳು'),
('inspiration_summary_question', 'question1', 'kn', 'ಈ ಎಲ್ಲಾ ವಿಡಿಯೋಗಳನ್ನು ನೋಡಿದಾಗ ಮತ್ತು ಸ್ವಂತ ಅನುಭವದಿಂದ ನೀವು ಸ್ಪರ್ತಿ ಪಡೆದ ಅಂಶಗಳನ್ನು ಪಟ್ಟಿಮಾಡಿ.'),
('inspiration_summary_question', 'question2', 'kn', 'ಈ ಎಲ್ಲಾ ವಿಡಿಯೋಗಳನ್ನು ನೋಡಿದಾಗ ಮತ್ತು ನಿಮಗೆ ಅನಿಸುತ್ತಿರುವ - ನಿಮ್ಮಲ್ಲಿ ಇರಬಾರದೆನಿಸಿದ ನಡವಳಿಕೆಗಳು ಯಾವವು? ಅದನ್ನು ಬರೆಯಿರಿ'),
('inspiration_summary_question', 'question3', 'kn', 'ನಿಮ್ಮ ಗೆಳೆಯೊರೊಂದಿಗೆ, ಈ ವಿಡಿಯೋಗಳಲ್ಲಿನ ನಿಮಗೆ ಪ್ರೇರಣೆ ನೀಡಿದ ಪಾತ್ರಗಳು ಮತ್ತು ನಿಮ್ಮ ನಿಜ ಜೀವನದಲ್ಲಿ ನಿಮಗೆ ಸ್ಪರ್ತಿ ನೀಡಿದ ವ್ಯಕ್ತಿಗಳಿಗೂ ಇರುವ ಹೋಲಿಕೆಗಳನ್ನು ಕುರಿತು ರ್ಚಿಸಿ. ಆ ಸಾರಾಂಶವನ್ನು ಬರೆಯಿರಿ')
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- 2. Update About Me Summary Questions (14 items)
TRUNCATE about_me_summary_questions;
INSERT INTO about_me_summary_questions (sequence_number, section_header, question_text) VALUES
(1, 'Prepare a personal profile or your own self-portrait. Summarize the points you wrote about yourself above in one or a few words.', 'Who are my friends outside my family?'),
(2, NULL, 'What activities do I do daily?'),
(3, NULL, 'Which activities do I enjoy during school time?'),
(4, NULL, 'Which activities do I enjoy outside school?'),
(5, NULL, 'What activities do I enjoy personally?'),
(6, NULL, 'What activities do I enjoy doing as a team?'),
(7, NULL, 'Which school activity do I find difficult even though I must do it?'),
(8, NULL, 'Which activity do I find difficult to manage after school or outside school?'),
(9, NULL, 'What activities must I do?'),
(10, NULL, 'Which activities can I do easily?'),
(11, NULL, 'Which activities are not easy for me to do?'),
(12, NULL, 'What qualities do I like about myself?'),
(13, NULL, 'What qualities do others like in me?'),
(14, NULL, 'Which qualities or aspects do I need to improve?');

-- About Me Translations
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('about_me_summary_question', 'header1', 'ta', 'ஒரு தனிப்பட்ட சுயவிவரம் அல்லது உங்கள் சொந்த சுயப்படத்தை தயாரிக்கவும்.மேலே உங்களைப் பற்றி நீங்கள் எழுதிய அம்சங்களை ஒரு அல்லது சில சொற்களில் சுருக்கமாக எழுதுங்கள்.'),
('about_me_summary_question', 'question1', 'ta', 'என் குடும்பத்தைத் தவிர, என் நண்பர்கள் யார்?'),
('about_me_summary_question', 'question2', 'ta', 'நான் தினமும் என்ன வேலைகளை செய்கிறேன்?'),
('about_me_summary_question', 'question3', 'ta', 'பள்ளி நேரத்தில் நான் ரசிக்கும் செயல்கள் என்ன?'),
('about_me_summary_question', 'question4', 'ta', 'பள்ளிக்கு வெளியே நான் ரசிக்கும் செயல்கள் என்ன?'),
('about_me_summary_question', 'question5', 'ta', 'தனிப்பட்ட முறையில் நான் ரசிக்கும் செயல்கள் என்ன?'),
('about_me_summary_question', 'question6', 'ta', 'குழுவாகச் செய்யும்போது நான் ரசிக்கும் செயல்கள் என்ன?'),
('about_me_summary_question', 'question7', 'ta', 'பள்ளியில் செய்ய வேண்டியிருந்தாலும் எனக்கு கடினமாக இருக்கும் செயல் எது?'),
('about_me_summary_question', 'question8', 'ta', 'பள்ளிக்கு பிறகு அல்லது பள்ளிக்கு வெளியே செய்ய கடினமாக இருப்பது எது?'),
('about_me_summary_question', 'question9', 'ta', 'நான் கட்டாயமாக செய்ய வேண்டிய செயல்கள் என்ன?'),
('about_me_summary_question', 'question10', 'ta', 'நான் எளிதாக செய்யக்கூடிய செயல்கள் என்ன?'),
('about_me_summary_question', 'question11', 'ta', 'எனக்கு எளிதாக செய்ய முடியாத செயல்கள் என்ன?'),
('about_me_summary_question', 'question12', 'ta', 'என்னிடத்தில் நான் விரும்பும் குணங்கள் என்ன?'),
('about_me_summary_question', 'question13', 'ta', 'மற்றவர்கள் என்னிடத்தில் விரும்பும் குணங்கள் என்ன?'),
('about_me_summary_question', 'question14', 'ta', 'நான் மேம்படுத்த வேண்டிய குணங்கள் / அம்சங்கள் என்ன?'),
('about_me_summary_question', 'header1', 'kn', 'ವೈಯಕ್ತಿಕ ಪ್ರೊಫೈಲ್ ಅಥವಾ ನಿಮ್ಮದೇ ವ್ಯಕ್ತಿಚಿತ್ರ ಸಿದ್ಧಪಡಿಸಿ. ಮೇಲೆ ನಿಮ್ಮ ಬಗ್ಗೆ ನೀವು ಬರೆದ ಅಂಶಗಳನ್ನು ಒಂದು ಅಥವಾ ಕೆಲವು ಪದಗಳಲ್ಲಿ ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಬರೆಯಿರಿ.'),
('about_me_summary_question', 'question1', 'kn', 'ಕುಟುಂಬ ಬಿಟ್ಟು ಹೊರಗಿನ ನನ್ನ ಸ್ನೇಹಿತ'),
('about_me_summary_question', 'question2', 'kn', 'ನಾನು ಮನೆಯಲ್ಲಿ ಯಾವ ಕೆಲಸಗಳನ್ನು ಮಾಡುತ್ತಿದ್ದೇನೆ?'),
('about_me_summary_question', 'question3', 'kn', 'ಶಾಲೆಯ ಸಮಯದಲ್ಲಿ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆ/ಅಂಶಗಳು'),
('about_me_summary_question', 'question4', 'kn', 'ಶಾಲೆಯ ಹೊರಗೆ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆ/ಅಂಶಗಳು'),
('about_me_summary_question', 'question5', 'kn', 'ವೈಯಕ್ತಿಕವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸ / ಚಟುವಟಿಕೆಗಳು'),
('about_me_summary_question', 'question6', 'kn', 'ತಂಡವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸ / ಚಟುವಟಿಕೆಗಳು'),
('about_me_summary_question', 'question7', 'kn', 'ಶಾಲಾವಧಿಯಲ್ಲಿ ಮಾಡಬೇಕಾದ, ಆದರೆ ನನಗೆ ಕಷ್ಟವೆನಿಸುವ ಚಟುವಟಿಕೆ'),
('about_me_summary_question', 'question8', 'kn', 'ಶಾಲಾವಧಿಯ ನಂತರ, ಶಾಲೆಯ ಆಚೆ ನನಗೆ ನರ್ವಹಿಸಲು ಕಷ್ಟವೆನಿಸುವ ಚಟುವಟಿಕೆ'),
('about_me_summary_question', 'question9', 'kn', 'ನಾನು ಮಾಡಲೇಬೇಕಾದ ಚಟುವಟಿಕೆಗಳು'),
('about_me_summary_question', 'question10', 'kn', 'ನಾನು ಸಹಜವಾಗಿ ಮಾಡಬಹುದಾದ ಚಟುವಟಿಕೆಗಳು'),
('about_me_summary_question', 'question11', 'kn', 'ನಮಗೆ ಸಹಜವಾಗಿ ಮಾಡಲು ಬಾರದಿರುವ ಚಟುವಟಿಕೆಗಳು'),
('about_me_summary_question', 'question12', 'kn', 'ನನ್ನಲ್ಲಿರುವ, ನಾನು ಇಷ್ಟಪಡುವ ಗುಣಗಳು'),
('about_me_summary_question', 'question13', 'kn', 'ಇತರರು ನನ್ನಲ್ಲಿ ಇಷ್ಟಪಡುವ ಗುಣಗಳು'),
('about_me_summary_question', 'question14', 'kn', 'ನಾನು ಸುಧಾರಿಸಿಕೊಳ್ಳಬೇಕಾದ ಗುಣ/ ಅಂಶಗಳು')
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- AI Template Update (Sync)
INSERT INTO assessment_summary_templates (assessment_type, title, summary_questions) VALUES
('about_me', 'Summary: About Me', 
 '{
   "en": {
     "title": "Prepare a personal profile or your own self-portrait. Summarize the points you wrote about yourself above in one or a few words.",
     "question1": "Who are my friends outside my family?",
     "question2": "What activities do I do daily?",
     "question3": "Which activities do I enjoy during school time?",
     "question4": "Which activities do I enjoy outside school?",
     "question5": "What activities do I enjoy personally?",
     "question6": "What activities do I enjoy doing as a team?",
     "question7": "Which school activity do I find difficult even though I must do it?",
     "question8": "Which activity do I find difficult to manage after school or outside school?",
     "question9": "What activities must I do?",
     "question10": "Which activities can I do easily?",
     "question11": "Which activities are not easy for me to do?",
     "question12": "What qualities do I like about myself?",
     "question13": "What qualities do others like in me?",
     "question14": "Which qualities or aspects do I need to improve?"
   },
   "ta": {
     "title": "ஒரு தனிப்பட்ட சுயவிவரம் அல்லது உங்கள் சொந்த சுயப்படத்தை தயாரிக்கவும். மேலே உங்களைப் பற்றி நீங்கள் எழுதிய அம்சங்களை ஒரு அல்லது சில சொற்களில் சுருக்கமாக எழுதுங்கள்.",
     "question1": "என் குடும்பத்தைத் தவிர, என் நண்பர்கள் யார்?",
     "question2": "நான் தினமும் என்ன வேலைகளை செய்கிறேன்?",
     "question3": "பள்ளி நேரத்தில் நான் ரசிக்கும் செயல்கள் என்ன?",
     "question4": "பள்ளிக்கு வெளியே நான் ரசிக்கும் செயல்கள் என்ன?",
     "question5": "தனிப்பட்ட முறையில் நான் ரசிக்கும் செயல்கள் என்ன?",
     "question6": "குழுவாகச் செய்யும்போது நான் ரசிக்கும் செயல்கள் என்ன?",
     "question7": "பள்ளியில் செய்ய வேண்டியிருந்தாலும் எனக்கு கடினமாக இருக்கும் செயல் எது?",
     "question8": "பள்ளிக்கு பிறகு அல்லது பள்ளிக்கு வெளியே செய்ய கடினமாக இருப்பது எது?",
     "question9": "நான் கட்டாயமாக செய்ய வேண்டிய செயல்கள் என்ன?",
     "question10": "நான் எளிதாக செய்யக்கூடிய செயல்கள் என்ன?",
     "question11": "எனக்கு எளிதாக செய்ய முடியாத செயல்கள் என்ன?",
     "question12": "என்னிடத்தில் நான் விரும்பும் குணங்கள் என்ன?",
     "question13": "மற்றவர்கள் என்னிடத்தில் விரும்பும் குணங்கள் என்ன?",
     "question14": "நான் மேம்படுத்த வேண்டிய குணங்கள் / அம்சங்கள் என்ன?"
   },
   "kn": {
     "title": "ವೈಯಕ್ತಿಕ ಪ್ರೊಫೈಲ್ ಅಥವಾ ನಿಮ್ಮದೇ ವ್ಯಕ್ತಿಚಿತ್ರ ಸಿದ್ಧಪಡಿಸಿ. ಮೇಲೆ ನಿಮ್ಮ ಬಗ್ಗೆ ನೀವು ಬರೆದ ಅಂಶಗಳನ್ನು ಒಂದು ಅಥವಾ ಕೆಲವು ಪದಗಳಲ್ಲಿ ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಬರೆಯಿರಿ.",
     "question1": "ಕುಟುಂಬ ಬಿಟ್ಟು ಹೊರಗಿನ ನನ್ನ ಸ್ನೇಹಿತ",
     "question2": "ನಾನು ಮನೆಯಲ್ಲಿ ಯಾವ ಕೆಲಸಗಳನ್ನು ಮಾಡುತ್ತಿದ್ದೇನೆ?",
     "question3": "ಶಾಲೆಯ ಸಮಯದಲ್ಲಿ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆ/ಅಂಶಗಳು",
     "question4": "ಶಾಲೆಯ ಹೊರಗೆ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆ/ಅಂಶಗಳು",
     "question5": "ವೈಯಕ್ತಿಕವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸ / ಚಟುವಟಿಕೆಗಳು",
     "question6": "ತಂಡವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸ / ಚಟುವಟಿಕೆಗಳು",
     "question7": "ಶಾಲಾವಧಿಯಲ್ಲಿ ಮಾಡಬೇಕಾದ, ಆದರೆ ನನಗೆ ಕಷ್ಟವೆನಿಸುವ ಚಟುವಟಿಕೆ",
     "question8": "ಶಾಲಾವಧಿಯ ನಂತರ, ಶಾಲೆಯ ಆಚೆ ನನಗೆ ನರ್ವಹಿಸಲು ಕಷ್ಟವೆನಿಸುವ ಚಟುವಟಿಕೆ",
     "question9": "ನಾನು ಮಾಡಲೇಬೇಕಾದ ಚಟುವಟಿಕೆಗಳು",
     "question10": "ನಾನು ಸಹಜವಾಗಿ ಮಾಡಬಹುದಾದ ಚಟುವಟಿಕೆಗಳು",
     "question11": "ನಮಗೆ ಸಹಜವಾಗಿ ಮಾಡಲು ಬಾರದಿರುವ ಚಟುವಟಿಕೆಗಳು",
     "question12": "ನನ್ನಲ್ಲಿರುವ, ನಾನು ಇಷ್ಟಪಡುವ ಗುಣಗಳು",
     "question13": "ಇತರರು ನನ್ನಲ್ಲಿ ಇಷ್ಟಪಡುವ ಗುಣಗಳು",
     "question14": "ನಾನು ಸುಧಾರಿಸಿಕೊಳ್ಳಬೇಕಾದ ಗುಣ/ ಅಂಶಗಳು"
   }
 }'::jsonb)
ON CONFLICT (assessment_type) DO UPDATE SET title = EXCLUDED.title, summary_questions = EXCLUDED.summary_questions, updated_at = NOW();

-- Similar update for my_inspiration
INSERT INTO assessment_summary_templates (assessment_type, title, summary_questions) VALUES
('inspiration', 'Summary: Things I was Inspired By', 
 '{
   "en": {
     "title": "What inspired me to…",
     "question1": "After watching all these videos, list the points that inspired you from your experience",
     "question2": "After watching these videos, which behavior do you think you should avoid? Write it down.",
     "question3": "Discuss with your friend about the character in this video that inspired you and a person in real life who has inspired you. Write a summary of your discussion."
   },
   "ta": {
     "title": "எனக்கு ஊக்கம் அளித்தது…",
     "question1": "இந்த அனைத்து வீடியோக்களையும் பார்த்த பிறகு, உங்கள் அனுபவத்தில் உங்களை ஊக்கமளித்த முக்கியமானவற்றை பட்டியலிடுங்கள்",
     "question2": "இந்த வீடியோக்களை பார்த்த பிறகு, நீங்கள் தவிர்க்க வேண்டும் என்று நினைக்கும் செயல் என்ன? எழுதுங்கள்.",
     "question3": "உங்கள் நண்பர்களுடன், இந்த வீடியோவில் உங்களுக்கு ஊக்கமளித்த பாத்திரம் யார், மேலும் அது உங்கள் நிஜ வாழ்க்கையில் யாரை அடிப்படையாகக் கொண்டு உருவாக்கப்பட்டது என்பதைக் குறித்து விவாதிக்கவும். அந்த விவாதத்தின் சுருக்கத்தை எழுதுங்கள்."
   },
   "kn": {
     "title": "ನಾನು ಸ್ಫರ್ತಿ ಪಡೆದ ಅಂಶಗಳು",
     "question1": "ಈ ಎಲ್ಲಾ ವಿಡಿಯೋಗಳನ್ನು ನೋಡಿದಾಗ ಮತ್ತು ಸ್ವಂತ ಅನುಭವದಿಂದ ನೀವು ಸ್ಪರ್ತಿ ಪಡೆದ ಅಂಶಗಳನ್ನು ಪಟ್ಟಿಮಾಡಿ.",
     "question2": "ಈ ಎಲ್ಲಾ ವಿಡಿಯೋಗಳನ್ನು ನೋಡಿದಾಗ ಮತ್ತು ನಿಮಗೆ ಅನಿಸುತ್ತಿರುವ - ನಿಮ್ಮಲ್ಲಿ ಇರಬಾರದೆನಿಸಿದ ನಡವಳಿಕೆಗಳು ಯಾವವು? ಅದನ್ನು ಬರೆಯಿರಿ",
     "question3": "ನಿಮ್ಮ ಗೆಳೆಯೊರೊಂದಿಗೆ, ಈ ವಿಡಿಯೋಗಳಲ್ಲಿನ ನಿಮಗೆ ಪ್ರೇರಣೆ ನೀಡಿದ ಪಾತ್ರಗಳು ಮತ್ತು ನಿಮ್ಮ ನಿಜ ಜೀವನದಲ್ಲಿ ನಿಮಗೆ ಸ್ಪರ್ತಿ ನೀಡಿದ ವ್ಯಕ್ತಿಗಳಿಗೂ ಇರುವ ಹೋಲಿಕೆಗಳನ್ನು ಕುರಿತು ರ್ಚಿಸಿ. ಆ ಸಾರಾಂಶವನ್ನು ಬರೆಯಿರಿ"
   }
 }'::jsonb)
ON CONFLICT (assessment_type) DO UPDATE SET title = EXCLUDED.title, summary_questions = EXCLUDED.summary_questions, updated_at = NOW();

