-- Migration: Update Kannada content for About Me Assessment (19 Questions, 15 Summary Questions)

-- 1. Update Module Title & Intro
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('about_me_module', 'title', 'kn', 'ನನ್ನ ಬಗ್ಗೆ', NOW()),
('about_me_module', 'intro', 'kn', 'ಈ ಚಟುವಟಿಕೆಯ ಭಾಗವಾಗಿ, ನಿಮ್ಮ ಬಗ್ಗೆ ವಿಚಾರ ಮಾಡುತ್ತೀರಿ. ನೀವು ಏನನ್ನು ಚೆನ್ನಾಗಿ ಮಾಡಬಲ್ಲಿರಿ, ನಿಮಗೆ ಏನು ಮಾಡುವುದು ಇಷ್ಟ, ಕಷ್ಟ, ಮುಂತಾದವುಗಳನ್ನು ಇಲ್ಲಿ ಬರೆಯುತ್ತೀರಿ. ಈ ಚಟುವಟಿಕೆ ನಿಮ್ಮನ್ನು ನೀವು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಹಾಗೂ ಸುಧಾರಿಸಿಕೊಳ್ಳಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ. (ನಿಮ್ಮ ಕುಟುಂಬ, ಶಿಕ್ಷಕರು, ಸ್ನೇಹಿತರು ಮುಂತಾದವರೊಂದಿಗೆ ಮಾತನಾಡಿ ಅಗತ್ಯವಿರುವಲ್ಲಿ ಅವರಿಂದ ಸಹಾಯ, ಸಲಹೆಗಳನ್ನು ಪಡೆಯಿರಿ)', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 2. Update Questions (1-19)
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('about_me_question', 'question1', 'kn', 'ನಿಮ್ಮ ಕುಟುಂಬದಲ್ಲಿ ಯಾರೊಂದಿಗೆ ನೀವು ಭಯ/ಸಂಕೋಚವಿಲ್ಲದೆ ಮುಕ್ತವಾಗಿ ನಿಮ್ಮ ಅಭಿಪ್ರಾಯಗಳನ್ನು ಹಾಗೂ ಭಾವನೆಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಬಲ್ಲಿರಿ? ಮತ್ತು ಅವರೊಂದಿಗೆ ನಿಮಗೆ ಅಷ್ಟು ವಿಶ್ವಾಸವೇಕೆ?', NOW()),
('about_me_question', 'question2', 'kn', 'ನಿಮ್ಮ ಕುಟುಂಬದವರನ್ನು ಬಿಟ್ಟು ಬೇರೆ ಯಾರೊಂದಿಗೆ ನೀವು ಭಯ / ಸಂಕೋಚವಿಲ್ಲದೆ ಮುಕ್ತವಾಗಿ ನಿಮ್ಮ ಅಭಿಪ್ರಾಯಗಳನ್ನು ಹಾಗೂ ಭಾವನೆಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಬಲ್ಲಿರಿ?', NOW()),
('about_me_question', 'question3', 'kn', 'ಮನೆಯಲ್ಲಿ ನೀವು ಮಾಡುವ ಕೆಲಸಗಳು ಯಾವುವು? (ಉದಾ: ಕೃಷಿ ಚಟುವಟಿಕೆಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡುವುದು, ಅಂಗಡಿಯಿಂದ ತರಕಾರಿ, ಕಿರಾಣಿ ಸಾಮಗ್ರಿಗಳನ್ನು ತರುವುದು, ದನ-ಕರುಗಳ, ಪ್ರಾಣಿಗಳ ಆರೈಕೆ, ನೀರು ತುಂಬಿಸುವುದು ಇತ್ಯಾದಿ)', NOW()),
('about_me_question', 'question4', 'kn', 'ನೀವು ಸಂತೋಷದಿಂದ ಮಾಡುವ ಕೆಲಸಗಳು : (ಒಂದಕ್ಕಿಂತ ಹೆಚ್ಚು ಪ್ರಶ್ನೆಗಳಿಗೆ ನೀವು ನೀಡುವ ಉತ್ತರ ಒಂದೇ ಆಗಿರಬಹುದು) ನೀವು ಇಷ್ಟಪಟ್ಟು ಮಾಡುವ ಕೆಲಸಗಳು: ೧. ಶಾಲಾ ಅವಧಿಯಲ್ಲಿ ೨. ಶಾಲಾ ಅವಧಿಯ ನಂತರ (ಶಾಲಾ ಅವಧಿ ಪ್ರಾರಂಭವಾಗುವ ಮೊದಲು ಮತ್ತು ಶಾಲಾ ಅವಧಿ ಮುಗಿದ ನಂತರ)', NOW()),
('about_me_question', 'question5', 'kn', 'ನೀವೊಬ್ಬರೇ ಸ್ವತಂತ್ರವಾಗಿ ಮಾಡಲು ಇಷ್ಟಪಡುವ ಕೆಲಸಗಳು ಯಾವುವು? (ಪ್ರತ್ಯೇಕವಾಗಿ ಒಬ್ಬರೇ ನರ್ವಹಿಸುವ ಕರ್ಯಗಳು)', NOW()),
('about_me_question', 'question6', 'kn', 'ನೀವು ಗುಂಪಿನಲ್ಲಿ / ನಿಮ್ಮ ಸ್ನೇಹಿತರೊಂದಿಗೆ ಯಾವ ಕೆಲಸಗಳನ್ನು ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತೀರಿ?', NOW()),
('about_me_question', 'question7', 'kn', 'ನಿಮಗೆ ಕಷ್ಟವೆನಿಸುವ ಕೆಲಸ/ಚಟುವಟಿಕೆಗಳು: ನಿಮಗೆ ಶಾಲೆಯಲ್ಲಿ ಕಷ್ಟವೆನಿಸುವ ಚಟುವಟಿಕೆಗಳು ಯಾವುವು? ಬರೆಯಿರಿ.', NOW()),
('about_me_question', 'question8', 'kn', 'ಶಾಲೆಯ ಕೆಲಸ / ಚಟುವಟಿಕೆಗಳನ್ನು ಹೊರತುಪಡಿಸಿ ನಿಮಗೆ ಕಷ್ಟಕರವಾದ ಇನ್ನುಳಿದ ಕೆಲಸಗಳು ಯಾವವು?', NOW()),
('about_me_question', 'question9', 'kn', 'ನೀವು ಮಾಡಲು ಇಷ್ಟ ಪಡದ ಆದರೆ ಮಾಡಲೇಬೇಕಾದ ಕೆಲಸಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ.', NOW()),
('about_me_question', 'question10', 'kn', 'ನೀವು ಮಾಡುವ ಕೆಲಸ/ಚಟುವಟಿಕೆಗಳಲ್ಲಿ, ಸಹಜವಾಗಿ ತೊಡಗಿಸಿಕೊಳ್ಳುವ ಕೆಲಸ/ಚಟುವಟಿಕೆಗಳನ್ನು ಪಟ್ಟಿಮಾಡಿ.', NOW()),
('about_me_question', 'question11', 'kn', 'ನೀವು ಮಾಡುವ ಕೆಲಸ/ಚಟುವಟಿಕೆಗಳಲ್ಲಿ, ಸಹಜವಾಗಿ ಮಾಡಲು ಬಾರದ ಕೆಲಸ/ಚಟುವಟಿಕೆಗಳನ್ನು ಪಟ್ಟಿಮಾಡಿ.', NOW()),
('about_me_question', 'question12', 'kn', 'ನಿಮ್ಮ ಬಗ್ಗೆ ಇನ್ನಷ್ಟು ವಿಚಾರಗಳನ್ನು ತಿಳಿಯಲು ಈ ಕೆಳಗಿನ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ. ನಿಮ್ಮ ಬಗ್ಗೆ ನೀವೆ ಹೆಮ್ಮೆಪಟ್ಟುಕೊಳ್ಳುವ, ನಿಮ್ಮಲ್ಲಿನ ಗುಣಗಳು ಯಾವವು?', NOW()),
('about_me_question', 'question13', 'kn', 'ಇತರರು (ಪಾಲಕರು, ಶಿಕ್ಷಕರು, ಸ್ನೇಹಿತರು ಇತ್ಯಾದಿ) ನಿಮ್ಮ ಯಾವ ಗುಣಗಳನ್ನು ಇಷ್ಟಪಡುತ್ತಾರೆ ಎಂದು ಭಾವಿಸುತ್ತೀರಿ? ಪಟ್ಟಿ ಮಾಡಿ. (ಪೋಷಕರು, ಶಿಕ್ಷಕರು, ಸ್ನೇಹಿತರನ್ನು ಕೇಳಿ ಪರಿಶೀಲಿಸಿಕೊಳ್ಳಿ)', NOW()),
('about_me_question', 'question14', 'kn', 'ನಿಮ್ಮಲ್ಲಿನ ಯಾವ ಸ್ವಭಾವವನ್ನು ಸುಧಾರಣೆ / ಬದಲಾವಣೆ ಮಾಡಿಕೊಳ್ಳಲು ನೀವು ಬಯಸುತ್ತೀರಿ?', NOW()),
('about_me_question', 'question15', 'kn', 'ನಿಮ್ಮ ಯಾವ ಗುಣ /ಸ್ವಭಾವವನ್ನು ತಿದ್ದಿಕೊಳ್ಳಬೇಕು ಎಂದು ಇತರರು ಬಯಸುತ್ತಾರೆ ಅಥವಾ ಸಲಹೆ ನೀಡುತ್ತಾರೆ?', NOW()),
('about_me_question', 'question16', 'kn', 'ಜೀವನದಲ್ಲಿ ನಿಮಗೆ ಏನಾದರೂ / ಯಾರಾದರೂ ಆಗುವ ಅವಕಾಶ ಇದ್ದರೆ, ನೀವು ಏನಾಗಲು / ಯಾರಾಗಲು ಬಯಸುತ್ತೀರಿ?', NOW()),
('about_me_question', 'question17', 'kn', 'ನಿಮ್ಮ ಬಗ್ಗೆ ನೀವು ಹೆಮ್ಮೆ ಪಟ್ಟುಕೊಂಡ ಸಂರ್ಭವನ್ನು ಮೆಲುಕುಹಾಕಿ. ನಿಮ್ಮ ಯಾವ ಕೆಲಸದಿಂದ ನಿಮಗೆ ಮೆಚ್ಚುಗೆ ದೊರೆಯಿತು? ಅದನ್ನು ಹೇಗೆ ಸಾಧಿಸಿದಿರಿ? ಸಂಕ್ಷಿಪ್ತವಾಗಿ ವಿವರಿಸಿ', NOW()),
('about_me_question', 'question18', 'kn', 'ನೀವು ಇತ್ತೀಚೆಗೆ ಎದುರಿಸಿದ ಕಠೀಣ/ಕಷ್ಟಕರ ಸನ್ನಿವೇಶದ ಬಗ್ಗೆ ಯೋಚಿಸಿ. ಅದನ್ನು ನೀವು ಹೇಗೆ ಎದುರಿಸಿದಿರಿ ಅಥವಾ ಅದರಿಂದ ಹೇಗೆ ಪಾರಾದಿರಿ? ಅದರಿಂದ ಕಲಿತ ಪಾಠವೇನು?', NOW()),
('about_me_question', 'question19', 'kn', 'ಇತರರು ನಿಮ್ಮನ್ನು ತಪ್ಪಾಗಿ ತಿಳಿದ (ನಿಮ್ಮ ಬಗ್ಗೆ ತಪ್ಪು ಕಲ್ಪನೆ ಹೊಂದಿದ) ಸಂರ್ಭವನ್ನು ನೆನಪಿಸಿಕೊಳ್ಳಿ. ನೀವು ಆ ಪರಿಸ್ಥಿತಿಯನ್ನು ಹೇಗೆ ನರ್ವಹಿಸಿದಿರಿ ಮತ್ತು ಅದರಿಂದ ನೀವು ಏನು ಕಲಿತಿರಿ?', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 3. Update Help Text (1-19)
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('about_me_help', 'question1', 'kn', 'ನಿಮ್ಮ ಮನೆಯಲ್ಲಿ ಯಾರೊಂದಿಗೆ ನೀವು ಮುಕ್ತವಾಗಿ ಮಾತನಾಡಬಹುದು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ', NOW()),
('about_me_help', 'question2', 'kn', 'ಮನೆಯವರ ಹೊರತು ಇನ್ನಾರು ನಿಮ್ಮ ಮಾತು ಕೇಳುತ್ತಾರೆ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ', NOW()),
('about_me_help', 'question3', 'kn', 'ನೀವು ಮನೆಯಲ್ಲಿ ಮಾಡುವ ಕೆಲಸಗಳು ಯಾವುವು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ', NOW()),
('about_me_help', 'question4', 'kn', 'ಶಾಲೆಯಲ್ಲಿ ನಿಮಗೆ ಇಷ್ಟವಾಗುವ ವಿಷಯಗಳು ಅಥವಾ ಕೆಲಸಗಳು ಯಾವುವು? ಶಾಲೆ ಮುಗಿದ ನಂತರ ಅಥವಾ ಶಾಲೆಗೆ ಮೊದಲು ನೀವು ಏನು ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತೀರಿ? ಎಂಬುದರ ಬಗ್ಗೆ ಬರೆಯಿರಿ', NOW()),
('about_me_help', 'question5', 'kn', 'ನೀವು ಒಬ್ಬರೇ ಏನು ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತೀರಿ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ', NOW()),
('about_me_help', 'question6', 'kn', 'ನಿಮ್ಮ ಸ್ನೇಹಿತರ ಜೊತೆ ನೀವು ಏನು ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತೀರಿ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ', NOW()),
('about_me_help', 'question7', 'kn', 'ಶಾಲೆಯಲ್ಲಿ ನಿಮಗೆ ಕಷ್ಟವಾಗುವ ವಿಷಯಗಳು ಯಾವುವು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ', NOW()),
('about_me_help', 'question8', 'kn', 'ಶಾಲೆಯ ಹೊರತುಪಡಿಸಿ ನಿಮಗೆ ಕಷ್ಟವಾಗುವ ಕೆಲಸಗಳು ಯಾವುವು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ', NOW()),
('about_me_help', 'question9', 'kn', 'ನಿಮಗೆ ಇಷ್ಟವಿಲ್ಲದರೂ ಮಾಡಲೇಬೇಕಾದ ಕೆಲಸಗಳು ಯಾವುವು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ', NOW()),
('about_me_help', 'question10', 'kn', 'ನೀವು ಸುಲಭವಾಗಿ ಮಾಡುವ ಕೆಲಸಗಳು ಯಾವುವು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ', NOW()),
('about_me_help', 'question11', 'kn', 'ನಿಮಗೆ ಸುಲಭವಾಗಿ ಆಗದ ಕೆಲಸಗಳು ಯಾವುವು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ', NOW()),
('about_me_help', 'question12', 'kn', 'ನಿಮ್ಮಲ್ಲಿ ನಿಮಗೆ ಇಷ್ಟವಾಗುವ ಗುಣಗಳು ಯಾವುವು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ', NOW()),
('about_me_help', 'question13', 'kn', 'ಇತರರು ನಿಮ್ಮಲ್ಲಿ ಇಷ್ಟಪಡುವ ಗುಣಗಳು ಯಾವುವು? ಅದನ್ನು ಬರೆಯಿರಿ', NOW()),
('about_me_help', 'question14', 'kn', 'ನಿಮ್ಮಲ್ಲಿ ನೀವು ಬದಲಾಯಿಸಿಕೊಳ್ಳಲು ಬಯಸುವ ಗುಣ ಯಾವುದು? ಅದನ್ನು ಬರೆಯಿರಿ', NOW()),
('about_me_help', 'question15', 'kn', 'ನಿಮ್ಮಲ್ಲಿ ಯಾವ ಗುಣವನ್ನು ಬದಲಾಯಿಸು ಎಂದು ಇತರರು ಹೇಳುತ್ತಾರೆ? ಅದನ್ನು ಬರೆಯಿರಿ', NOW()),
('about_me_help', 'question16', 'kn', 'ಭವಿಷ್ಯದಲ್ಲಿ ನೀವು ಏನಾಗಲು ಬಯಸುತ್ತೀರಿ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ', NOW()),
('about_me_help', 'question17', 'kn', 'ನೀವು ಮಾಡಿದ ಯಾವ ಕೆಲಸಕ್ಕೆ ನಿಮಗೆ ಮೆಚ್ಚುಗೆ ಸಿಕ್ಕಿತು? ಎಂಬುದನ್ನು ಬರೆಯಿರಿ', NOW()),
('about_me_help', 'question18', 'kn', 'ಇತ್ತೀಚೆಗೆ ನಿಮಗೆ ಕಷ್ಟವಾದ ಒಂದು ಘಟನೆ ಯಾವುದು? ಅದನ್ನು ನೀವು ಹೇಗೆ ಎದುರಿಸಿದಿರಿ? ಎಂಬುದನ್ನು ಬರೆಯಿರಿ', NOW()),
('about_me_help', 'question19', 'kn', 'ಯಾರಾದರೂ ನಿಮ್ಮ ಬಗ್ಗೆ ತಪ್ಪಾಗಿ ಯೋಚಿಸಿದ ಸಂರ್ಭವಿದೆಯೇ? ನೀವು ಅದನ್ನು ಹೇಗೆ ಸರಿಪಡಿಸಿದಿರಿ? ಎಂಬುದರ ಬಗ್ಗೆ ಬರೆಯಿರಿ', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 4. Re-populate Summary Questions (15 items)
-- We truncate to remove the old 13-item structure and replace with 15.
TRUNCATE about_me_summary_questions;

INSERT INTO about_me_summary_questions (sequence_number, section_header, question_text) VALUES
(1, 'Prepare a personal profile or your own self-portrait. Summarize the points you wrote about yourself above in one or a few words.', 'Friend in my family'),
(2, NULL, 'Friend outside family'),
(3, NULL, 'Tasks I do at home'),
(4, NULL, 'Activities I enjoy during school'),
(5, NULL, 'Activities I enjoy outside school'),
(6, NULL, 'Activities I enjoy personally'),
(7, NULL, 'Activities I enjoy in a team'),
(8, NULL, 'Difficult activities during school'),
(9, NULL, 'Difficult activities after/outside school'),
(10, NULL, 'Mandatory activities'),
(11, NULL, 'Activities I can do naturally/easily'),
(12, NULL, 'Activities I cannot do naturally/easily'),
(13, NULL, 'Qualities I like in myself'),
(14, NULL, 'Qualities others like in me'),
(15, NULL, 'Qualities/Aspects I need to improve');

-- 5. Insert Summary Translations (Kannada)
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('about_me_summary_question', 'header1', 'kn', 'ವೈಯಕ್ತಿಕ ಪ್ರೊಫೈಲ್ ಅಥವಾ ನಿಮ್ಮದೇ ವ್ಯಕ್ತಿಚಿತ್ರ ಸಿದ್ಧಪಡಿಸಿ. ಮೇಲೆ ನಿಮ್ಮ ಬಗ್ಗೆ ನೀವು ಬರೆದ ಅಂಶಗಳನ್ನು ಒಂದು ಅಥವಾ ಕೆಲವು ಪದಗಳಲ್ಲಿ ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಬರೆಯಿರಿ.', NOW()),
('about_me_summary_question', 'question1', 'kn', 'ನನ್ನ ಕುಟುಂಬದಲ್ಲಿ ನನ್ನ ಸ್ನೇಹಿತ', NOW()),
('about_me_summary_question', 'question2', 'kn', 'ಕುಟುಂಬ ಬಿಟ್ಟು ಹೊರಗಿನ ನನ್ನ ಸ್ನೇಹಿತ', NOW()),
('about_me_summary_question', 'question3', 'kn', 'ನಾನು ಮನೆಯಲ್ಲಿ ಯಾವ ಕೆಲಸಗಳನ್ನು ಮಾಡುತ್ತಿದ್ದೇನೆ?', NOW()),
('about_me_summary_question', 'question4', 'kn', 'ಶಾಲೆಯ ಸಮಯದಲ್ಲಿ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆ/ಅಂಶಗಳು', NOW()),
('about_me_summary_question', 'question5', 'kn', 'ಶಾಲೆಯ ಹೊರಗೆ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆ/ಅಂಶಗಳು', NOW()),
('about_me_summary_question', 'question6', 'kn', 'ವೈಯಕ್ತಿಕವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸ / ಚಟುವಟಿಕೆಗಳು', NOW()),
('about_me_summary_question', 'question7', 'kn', 'ತಂಡವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸ / ಚಟುವಟಿಕೆಗಳು', NOW()),
('about_me_summary_question', 'question8', 'kn', 'ಶಾಲಾವಧಿಯಲ್ಲಿ ಮಾಡಬೇಕಾದ, ಆದರೆ ನನಗೆ ಕಷ್ಟವೆನಿಸುವ ಚಟುವಟಿಕೆ', NOW()),
('about_me_summary_question', 'question9', 'kn', 'ಶಾಲಾವಧಿಯ ನಂತರ, ಶಾಲೆಯ ಆಚೆ ನನಗೆ ನರ್ವಹಿಸಲು ಕಷ್ಟವೆನಿಸುವ ಚಟುವಟಿಕೆ', NOW()),
('about_me_summary_question', 'question10', 'kn', 'ನಾನು ಮಾಡಲೇಬೇಕಾದ ಚಟುವಟಿಕೆಗಳು', NOW()),
('about_me_summary_question', 'question11', 'kn', 'ನಾನು ಸಹಜವಾಗಿ ಮಾಡಬಹುದಾದ ಚಟುವಟಿಕೆಗಳು', NOW()),
('about_me_summary_question', 'question12', 'kn', 'ನನಗೆ ಸಹಜವಾಗಿ ಮಾಡಲು ಬಾರದಿರುವ ಚಟುವಟಿಕೆಗಳು', NOW()),
('about_me_summary_question', 'question13', 'kn', 'ನನ್ನಲ್ಲಿರುವ, ನಾನು ಇಷ್ಟಪಡುವ ಗುಣಗಳು', NOW()),
('about_me_summary_question', 'question14', 'kn', 'ಇತರರು ನನ್ನಲ್ಲಿ ಇಷ್ಟಪಡುವ ಗುಣಗಳು', NOW()),
('about_me_summary_question', 'question15', 'kn', 'ನಾನು ಸುಧಾರಿಸಿಕೊಳ್ಳಬೇಕಾದ ಗುಣ/ ಅಂಶಗಳು', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- Verification
DO $$
DECLARE
    q_count INTEGER;
    h_count INTEGER;
    s_count INTEGER;
    mod_title TEXT;
BEGIN
    SELECT COUNT(*) INTO q_count FROM content_translations WHERE resource_type = 'about_me_question' AND lang = 'kn';
    SELECT COUNT(*) INTO h_count FROM content_translations WHERE resource_type = 'about_me_help' AND lang = 'kn';
    SELECT COUNT(*) INTO s_count FROM content_translations WHERE resource_type = 'about_me_summary_question' AND lang = 'kn';
    SELECT text INTO mod_title FROM content_translations WHERE resource_type = 'about_me_module' AND resource_key = 'title' AND lang = 'kn';

    RAISE NOTICE 'About Me Migration Complete:';
    RAISE NOTICE '- Questions Updated: %', q_count;
    RAISE NOTICE '- Help Texts Updated: %', h_count;
    RAISE NOTICE '- Summary Questions Updated: %', s_count;
    RAISE NOTICE '- Module Title: %', mod_title;
END $$;
