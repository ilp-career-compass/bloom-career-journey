-- Migration: Update About Me Summary Questions to 14 Items
-- Unifies English, Tamil, and Kannada summary sections to have 14 questions.

-- 1. Base English Table Update
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

-- 2. Tamil Translations Update
-- Header
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('about_me_summary_question', 'header1', 'ta', 'ஒரு தனிப்பட்ட சுயவிவரம் அல்லது உங்கள் சொந்த சுயப்படத்தை தயாரிக்கவும். மேலே உங்களைப் பற்றி நீங்கள் எழுதிய அம்சங்களை ஒரு அல்லது சில சொற்களில் சுருக்கமாக எழுதுங்கள்.', NOW())
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- Questions
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('about_me_summary_question', 'question1', 'ta', 'என் குடும்பத்தைத் தவிர, என் நண்பர்கள் யார்?', NOW()),
('about_me_summary_question', 'question2', 'ta', 'நான் தினமும் என்ன வேலைகளை செய்கிறேன்?', NOW()),
('about_me_summary_question', 'question3', 'ta', 'பள்ளி நேரத்தில் நான் ரசிக்கும் செயல்கள் என்ன?', NOW()),
('about_me_summary_question', 'question4', 'ta', 'பள்ளிக்கு வெளியே நான் ரசிக்கும் செயல்கள் என்ன?', NOW()),
('about_me_summary_question', 'question5', 'ta', 'தனிப்பட்ட முறையில் நான் ரசிக்கும் செயல்கள் என்ன?', NOW()),
('about_me_summary_question', 'question6', 'ta', 'குழுவாகச் செய்யும்போது நான் ரசிக்கும் செயல்கள் என்ன?', NOW()),
('about_me_summary_question', 'question7', 'ta', 'பள்ளியில் செய்ய வேண்டியிருந்தாலும் எனக்கு கடினமாக இருக்கும் செயல் எது?', NOW()),
('about_me_summary_question', 'question8', 'ta', 'பள்ளிக்கு பிறகு அல்லது பள்ளிக்கு வெளியே செய்ய கடினமாக இருப்பது எது?', NOW()),
('about_me_summary_question', 'question9', 'ta', 'நான் கட்டாயமாக செய்ய வேண்டிய செயல்கள் என்ன?', NOW()),
('about_me_summary_question', 'question10', 'ta', 'நான் எளிதாக செய்யக்கூடிய செயல்கள் என்ன?', NOW()),
('about_me_summary_question', 'question11', 'ta', 'எனக்கு எளிதாக செய்ய முடியாத செயல்கள் என்ன?', NOW()),
('about_me_summary_question', 'question12', 'ta', 'என்னிடத்தில் நான் விரும்பும் குணங்கள் என்ன?', NOW()),
('about_me_summary_question', 'question13', 'ta', 'மற்றவர்கள் என்னிடத்தில் விரும்பும் குணங்கள் என்ன?', NOW()),
('about_me_summary_question', 'question14', 'ta', 'நான் மேம்படுத்த வேண்டிய குணங்கள் / அம்சங்கள் என்ன?', NOW())
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();


-- 3. Kannada Translations Update
-- Header
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('about_me_summary_question', 'header1', 'kn', 'ವೈಯಕ್ತಿಕ ಪ್ರೊಫೈಲ್ ಅಥವಾ ನಿಮ್ಮದೇ ವ್ಯಕ್ತಿಚಿತ್ರವನ್ನು ಸಿದ್ಧಪಡಿಸಿ. ಮೇಲೆ ನಿಮ್ಮ ಬಗ್ಗೆ ನೀವು ಬರೆದ ಅಂಶಗಳನ್ನು ಒಂದು ಅಥವಾ ಕೆಲವು ಪದಗಳಲ್ಲಿ ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಬರೆಯಿರಿ.', NOW())
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- Questions
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('about_me_summary_question', 'question1', 'kn', 'ನನ್ನ ಕುಟುಂಬದಲ್ಲಿ ನನ್ನ ಸ್ನೇಹಿತ ಕುಟುಂಬ ಬಿಟ್ಟು ಹೊರಗಿನ ನನ್ನ ಸ್ನೇಹಿತರು ಯಾರು?', NOW()),
('about_me_summary_question', 'question2', 'kn', 'ನಾನು ದಿನನಿತ್ಯದಲ್ಲಿ ಯಾವ ಕೆಲಸಗಳನ್ನು ಮಾಡುತ್ತೇನೆ?', NOW()),
('about_me_summary_question', 'question3', 'kn', 'ಶಾಲೆಯ ಸಮಯದಲ್ಲಿ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?', NOW()),
('about_me_summary_question', 'question4', 'kn', 'ಶಾಲೆ ಹೊರಗೆ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?', NOW()),
('about_me_summary_question', 'question5', 'kn', 'ವೈಯಕ್ತಿಕವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸಗಳು / ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?', NOW()),
('about_me_summary_question', 'question6', 'kn', 'ತಂಡವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸಗಳು / ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?', NOW()),
('about_me_summary_question', 'question7', 'kn', 'ಶಾಲೆಯಲ್ಲಿ ಮಾಡಬೇಕಾದರೂ ನನಗೆ ಕಷ್ಟವಾಗುವ ಚಟುವಟಿಕೆ ಯಾವುದು?', NOW()),
('about_me_summary_question', 'question8', 'kn', 'ಶಾಲೆಯ ನಂತರ ಅಥವಾ ಶಾಲೆ ಹೊರಗೆ ನನಗೆ ನಿರ್ವಹಿಸಲು ಕಷ್ಟವಾಗುವ ಚಟುವಟಿಕೆ ಯಾವುದು?', NOW()),
('about_me_summary_question', 'question9', 'kn', 'ನಾನು ಮಾಡಲೇಬೇಕಾದ ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?', NOW()),
('about_me_summary_question', 'question10', 'kn', 'ನಾನು ಸುಲಭವಾಗಿ ಮಾಡಬಹುದಾದ ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?', NOW()),
('about_me_summary_question', 'question11', 'kn', 'ನನಗೆ ಸುಲಭವಾಗಿ ಮಾಡಲು ಬಾರದ ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?', NOW()),
('about_me_summary_question', 'question12', 'kn', 'ನನ್ನಲ್ಲಿರುವ, ನಾನು ಇಷ್ಟಪಡುವ ಗುಣಗಳು ಯಾವುವು?', NOW()),
('about_me_summary_question', 'question13', 'kn', 'ಇತರರು ನನ್ನಲ್ಲಿ ಇಷ್ಟಪಡುವ ಗುಣಗಳು ಯಾವುವು?', NOW()),
('about_me_summary_question', 'question14', 'kn', 'ನಾನು ಸುಧಾರಿಸಿಕೊಳ್ಳಬೇಕಾದ ಗುಣಗಳು / ಅಂಶಗಳು ಯಾವುವು?', NOW())

ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
