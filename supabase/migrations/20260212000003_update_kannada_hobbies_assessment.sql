-- Migration: Update Kannada content for My Talents and Hobbies Assessment
-- Updates Module Title, Intro, Questions (1-14), Help Text (1-14), Summary Questions

-- 1. Update Module Title & Intro
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('hobbies_module', 'title', 'kn', 'ನನ್ನ ಪ್ರತಿಭೆ ಮತ್ತು ಹವ್ಯಾಸಗಳು', NOW()),
('hobbies_module', 'intro', 'kn', 'ಈ ಚಟುವಟಿಕೆ ಮೂಲಕ ನೀವು ನಿಮ್ಮಲ್ಲಿರುವ ಪ್ರತಿಭೆ, ನಿಮ್ಮ ಹವ್ಯಾಸಗಳು ಮತ್ತು ನಿಮಗೆ ಸಂತೋಷ ನೀಡುವ ಕೆಲಸ/ಚಟುವಟಿಕೆಗಳ ಕುರಿತು ಅವಲೋಕನ ಮಾಡಿಕೊಳ್ಳುತ್ತೀರಿ. ಇದರಿಂದ ನಿಮ್ಮ ಆಸಕ್ತಿಗಳೇನು, ನಿಮ್ಮ ಹವ್ಯಾಸಗಳು ಯಾವವು ಮತ್ತು ನಿಮ್ಮ ಪ್ರತಿಭೆಯ ಕ್ಷೇತ್ರಗಳು ಯಾವುದೆಂದು ನೀವೇ ಅರಿಯಲು ಸಾಧ್ಯವಾಗುತ್ತದೆ. ಈ ಮೂಲಕ ನಿಮ್ಮ ಸ್ವಭಾವ, ಆಸಕ್ತಿ ಮತ್ತು ಭಾವನೆಗೆ ಸರಿಹೊಂದುವ ವೃತ್ತಿಗಳನ್ನು ಗುರುತಿಸಿ ನಿರ್ಧರಿಸಲು ಈ ಚಟುವಟಿಕೆ ಸಹಕಾರಿಯಾಗುತ್ತದೆ.

“ಹವ್ಯಾಸಗಳು ನಮ್ಮಲ್ಲಿರುವ ಪ್ರತಿಭೆಯನ್ನು ಮುನ್ನೆಲೆಗೆ ತರುತ್ತವೆ ಮತ್ತು ಕನಸುಗಳನ್ನು ಈಡೇರಿಸಲು ಸ್ಫೂರ್ತಿ ನೀಡುತ್ತವೆ.”

I. ಹವ್ಯಾಸ (Hobby) ಎಂದರೆ ಏನು?
a) ಅದು ನಾವು ಖುಷಿಯಿಂದ, ನಮ್ಮ ದೈನಂದಿನ ಕೆಲಸಗಳು ಆದಮೇಲೆ ಮಾಡುವ ಚಟುವಟಿಕೆ.
b) ಸಮಯ ಕಳೆಯಲು ಅಥವಾ ಮನಸ್ಸಿಗೆ ಸಂತೋಷ ನೀಡಲು ಮಾಡುವ ಕೆಲಸ.
c) ಹವ್ಯಾಸ ಕಲಿತು ಬೆಳೆಸಿಕೊಳ್ಳಬಹುದಾದದ್ದು.
ಉದಾಹರಣೆಗಳು: ಚಿತ್ರ ಬಿಡಿಸುವುದು, ಹಾಡು ಹಾಡುವುದು, ಓದು, ನೃತ್ಯ, ಹಕ್ಕಿಗಳನ್ನು ನೋಡುವುದು, ತೋಟಗಾರಿಕೆ ಇತ್ಯಾದಿ.

II. ಪ್ರತಿಭೆ (Talent) ಎಂದರೆ ಏನು?
a) ಹುಟ್ಟಿನಿಂದಲೇ ನಮ್ಮೊಳಗೆ ಇರುವ ಒಂದು ನೈಸರ್ಗಿಕ ಸಾಮರ್ಥ್ಯ.
b) ಹೆಚ್ಚು ಅಭ್ಯಾಸ ಮಾಡದೇಸಹ ಸುಲಭವಾಗಿ ಮಾಡಬಹುದಾದ ಕೌಶಲ್ಯ.
c) ಇದು ಇನ್ನಷ್ಟು ಅಭ್ಯಾಸದಿಂದ ಅಪಾರ ಸಾಧನೆಗೆ ದಾರಿ ಮಾಡಬಹುದು.
ಉದಾಹರಣೆಗಳು: ಸಹಜವಾಗಿ ಹಾಡುವಂತ, ಸ್ಪಷ್ಟವಾಗಿ ಸಂವಹನ ಮಾಡುವಂತ, ಗಣಿತದಲ್ಲಿ ವೇಗವಾಗಿ ಉತ್ತರ ನೀಡುವಂತ, ತ್ವರಿತವಾಗಿ ಕಲಿಯುವಂತ ಸಾಮರ್ಥ್ಯಗಳು ಇತ್ಯಾದಿ.', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 2. Update Questions (1-14)
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('hobbies_question', 'question1', 'kn', 'ನೀವು ಬಿಡುವಿನ ವೇಳೆಯಲ್ಲಿ ಯಾವ ಕೆಲಸ/ ಚಟುವಟಿಕೆಗಳನ್ನು ಮಾಡುತ್ತೀರಿ?', NOW()),
('hobbies_question', 'question2', 'kn', 'ನಿಮಗೆ ಯಾವುದಾದರೂ ಹವ್ಯಾಸಗಳು ಇದೆಯೇ? ನಿಮ್ಮಲ್ಲಿರುವ ಒಳ್ಳೆಯ ಹವ್ಯಾಸಗಳನ್ನು ಪಟ್ಟಿಮಾಡಿ', NOW()),
('hobbies_question', 'question3', 'kn', 'ನೀವು ಮೇಲೆ ಪಟ್ಟಿಮಾಡಿದ ಹವ್ಯಾಸಗಳಲ್ಲಿ ನಿಮ್ಮ ನೆಚ್ಚಿನ ಹವ್ಯಾಸ ಯಾವುದು? ಯಾಕೆ? ಕಾರಣ ವಿವರಿಸಿ', NOW()),
('hobbies_question', 'question4', 'kn', 'ನಿಮ್ಮ ಹವ್ಯಾಸಗಳು (Hobbies) ಎಂದಾದರೂ ಬದಲಾಗಿವೆಯೇ?', NOW()),
('hobbies_question', 'question5', 'kn', 'ನಿಮ್ಮ ಹವ್ಯಾಸಗಳಿಗೆ ಪ್ರೇರಣೆ ನೀಡಿದ ಸಂಗತಿ ಯಾವುದು? ಯಾವುದಾದರೂ ಹವ್ಯಾಸ ನಿಮ್ಮ ಕುಟುಂಬದಿಂದ, ಅನುವಂಶಿಕವಾಗಿ ಬಂದಿದೆಯೇ? ಈ ಕುರಿತು ಆಲೋಚಿಸಿ ತಿಳಿಸಿ', NOW()),
('hobbies_question', 'question6', 'kn', 'ನಿಮಗೆ ಪರಿಚಿತವಿರುವ ಯಾರಾದರೂ ಇದೇ ರೀತಿಯ ಹವ್ಯಾಸಗಳು ಅಥವಾ ಆಸಕ್ತಿಗಳನ್ನು ಹೊಂದಿದ್ದಾರೆಯೇ? ಅವರು ಯಾರು?', NOW()),
('hobbies_question', 'question7', 'kn', 'ನಿಮ್ಮ ನೆಚ್ಚಿನ ಹವ್ಯಾಸದಲ್ಲಿ ತೊಡಗಿಸಿಕೊಂಡಾಗ ನಿಮಗೆ ಹೇಗನಿಸುತ್ತದೆ? ಅದು ನಿಮಗೆ ವಿಶ್ರಾಂತಿ ಪಡೆಯಲು ಅಥವಾ ಹೆಚ್ಚು ಆತ್ಮವಿಶ್ವಾಸವನ್ನು ಅನುಭವಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆಯೇ?', NOW()),
('hobbies_question', 'question8', 'kn', 'ನಿಮ್ಮಲ್ಲಿರುವ ಪ್ರತಿಭೆಗಳನ್ನು (Talents) ಪಟ್ಟಿ ಮಾಡಿ.', NOW()),
('hobbies_question', 'question9', 'kn', 'ನಿಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ಇನ್ನಷ್ಟು ಉತ್ತಮಗೊಳಿಸಲು ನೀವು ಪ್ರಯತ್ನ ಮಾಡುತ್ತಿದ್ದೀರಾ? ಮಾಡುತ್ತಿದ್ದರೆ ಹೇಗೆ ಎಂಬುದನ್ನು ತಿಳಿಸಿ', NOW()),
('hobbies_question', 'question10', 'kn', 'ನಿಮ್ಮ ಹವ್ಯಾಸ ಮತ್ತು ಪ್ರತಿಭೆಗಳನ್ನು ಮುಂದುವರೆಸಲು ಮತ್ತು ಪ್ರದರ್ಶಿಸಲು ಶಾಲೆ ಮತ್ತು ಮನೆಯಲ್ಲಿ ಪ್ರೋತ್ಸಾಹ ಹಾಗೂ ಅವಕಾಶ ಸಿಗುತ್ತಿದೆಯೇ?', NOW()),
('hobbies_question', 'question11', 'kn', 'ನಿಮ್ಮ ಹವ್ಯಾಸ ಮತ್ತು ಪ್ರತಿಭೆಯನ್ನು ಇನ್ನಷ್ಟು ಉತ್ತಮಗೊಳಿಸುವ ನಿಮ್ಮ ಪ್ರಯತ್ನಕ್ಕೆ ಪಾಲಕರು ಬೆಂಬಲ ನೀಡುತ್ತಾರೆಯೇ? ಯಾವ ರೀತಿ ತಿಳಿಸಿ.', NOW()),
('hobbies_question', 'question12', 'kn', 'ನಿಮ್ಮ ಯಾವುದಾದರೂ ಹವ್ಯಾಸಗಳು ನಿಮ್ಮ ಸ್ವಾಭಾವಿಕ ಪ್ರತಿಭೆ ಮತ್ತು ಸಾಮರ್ಥ್ಯಗಳೊಂದಿಗೆ ಹೊಂದಿಕೆಯಾಗುತ್ತವೆಯೇ?', NOW()),
('hobbies_question', 'question13', 'kn', 'ನಿಮ್ಮ ಯಾವುದಾದರೂ ಹವ್ಯಾಸವನ್ನು ಭವಿಷ್ಯದಲ್ಲಿ ನಿಮ್ಮ ವೃತ್ತಿಯಾಗಿ ಮುಂದುವರೆಸಲು ಸಾಧ್ಯವೇ? ಸಾಧ್ಯವೆಂದಾದರೆ, ಅದಕ್ಕಾಗಿ ನೀವು ಅನುಸರಿಸುವ ಕ್ರಮ/ಸಿದ್ಧತೆಗಳೇನು?', NOW()),
('hobbies_question', 'question14', 'kn', 'ತಮ್ಮ ಹವ್ಯಾಸವನ್ನೇ ವೃತ್ತಿಯಾಗಿ ಮಾಡಿಕೊಂಡಿರುವ ನಿಮ್ಮ ಪರಿಚಯದ ಯಾರಾದರೂ ಇದ್ದಾರಾ? ಅವರು ಯಾರು ಮತ್ತು ಹೇಗೆ ಅವರು ತಮ್ಮ ಹವ್ಯಾಸವನ್ನೇ ವೃತ್ತಿಯಾಗಿ ಮಾಡಿಕೊಂಡರು ಎಂಬುದನ್ನು ತಿಳಿಸಿ.', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 3. Update Help Text (1-14)
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('hobbies_help', 'question1', 'kn', 'ಬಿಡುವಿನ ಸಮಯದಲ್ಲಿ ನೀವು ಮಾಡುವ ಕೆಲಸ ಅಥವಾ ಚಟುವಟಿಕೆಗಳ ಬಗ್ಗೆ ಬರೆಯಬಹುದು. ಉದಾಹರಣೆಗೆ: ಪುಸ್ತಕಗಳನ್ನು ಓದುವುದು, ಚಿತ್ರ ಬಿಡಿಸುವುದು, ಆಟವಾಡುವುದು, ಸಂಗೀತ ಕೇಳುವುದು.', NOW()),
('hobbies_help', 'question2', 'kn', 'ಬಿಡುವಿನ ಸಮಯದಲ್ಲಿ ಸಂತೋಷಕ್ಕಾಗಿ ಅಥವಾ ಆನಂದಕ್ಕಾಗಿ ರೂಢಿಸಿಕೊಂಡ ಒಳ್ಳೆಯ ಕೆಲಸ ಅಥವಾ ಚಟುವಟಿಕೆಗಳನ್ನುಬರೆಯಿರಿ ಉದಾಹರಣೆಗೆ: ಪುಸ್ತಕಗಳನ್ನು ಓದುವುದು, ಚಿತ್ರ ಬಿಡಿಸುವುದು, ಆಟವಾಡುವುದು, ಸಂಗೀತ ಕೇಳುವುದು', NOW()),
('hobbies_help', 'question3', 'kn', 'ಈ ಪ್ರಶ್ನೆಯು ಈ ಹಿಂದೆ ನೀವು ಪಟ್ಟಿ ಮಾಡಿದ ಹವ್ಯಾಸಗಳಲ್ಲಿ ನಿಮಗೆ ಅತಿ ಹೆಚ್ಚು ಇಷ್ಟವಾದದ್ದನ್ನು ಆರಿಸಲು ಮತ್ತು ಅದು ಏಕೆ ಇಷ್ಟ ಎಂದು ವಿವರಿಸಲು ಕೇಳುತ್ತದೆ. ನೀವು ೨-೩ ವಾಕ್ಯಗಳಲ್ಲಿ ಉತ್ತರವನ್ನು ಬರೆಯಬಹುದು. ಉದಾಹರಣೆ: ನನಗೆ ಓದುವುದು ಎಂದರೆ ತುಂಬಾ ಇಷ್ಟ, ಏಕೆಂದರೆ ಅದು ನನಗೆ ಸಂತೋಷ ನೀಡುತ್ತದೆ.', NOW()),
('hobbies_help', 'question4', 'kn', 'ಕಾಲಾನಂತರದಲ್ಲಿ ನಿಮ್ಮ ಹವ್ಯಾಸಗಳು ಬದಲಾಗಿವೆಯೇ ? ನೀವು "ಹೌದು" ಅಥವಾ "ಇಲ್ಲ" ಎಂದು ಉತ್ತರಿಸಬಹುದು ಮತ್ತು ಸಣ್ಣ ವಿವರಣೆಯನ್ನು ನೀಡಬಹುದು. ಉದಾಹರಣೆ: ಹೌದು, ಮೊದಲು ನನಗೆ ಚಿತ್ರ ಬಿಡಿಸುವುದು ಇಷ್ಟವಿತ್ತು, ಆದರೆ ಈಗ ಪುಸ್ತಕಗಳನ್ನು ಓದುವುದು ಇಷ್ಟ.', NOW()),
('hobbies_help', 'question5', 'kn', 'ನಿಮ್ಮ ಹವ್ಯಾಸಗಳಿಗೆ ಪ್ರೇರಣೆ ನೀಡಿದವರು ಯಾರು ಎಂದು ಈ ಪ್ರಶ್ನೆ ಕೇಳುತ್ತದೆ. ಆ ಪ್ರೇರಣೆಯು ಪೋಷಕರು, ಶಿಕ್ಷಕರು, ಸ್ನೇಹಿತರು ಅಥವಾ ಕುಟುಂಬದ ಸದಸ್ಯರಿಂದ ಬಂದಿರಬಹುದು. ನಿಮ್ಮ ಕುಟುಂಬದ ಯಾರನ್ನಾದರೂ ನೋಡಿ ನೀವು ಈ ಹವ್ಯಾಸ ಕಲಿತಿದ್ದರೆ ಅದನ್ನು ಸಹ ಇಲ್ಲಿ ತಿಳಿಸಬಹುದು. ಉದಾಹರಣೆ: ನನ್ನ ತಾಯಿ ಹಾಡುವುದನ್ನು ನೋಡಿ ನನಗೆ ಹಾಡುವುದರಲ್ಲಿ ಆಸಕ್ತಿ ಮೂಡಿತು.', NOW()),
('hobbies_help', 'question6', 'kn', 'ನಿಮ್ಮಂತೆಯೇ ಹವ್ಯಾಸ ಇರುವ ಯಾರಾದರೂ ನಿಮಗೆ ತಿಳಿದಿದೆಯೇ ಎಂದು ಈ ಪ್ರಶ್ನೆ ಕೇಳುತ್ತದೆ. ಆ ವ್ಯಕ್ತಿ ಸ್ನೇಹಿತ, ಸಂಬಂಧಿ, ಶಿಕ್ಷಕ ಅಥವಾ ನಿಮಗೆ ತಿಳಿದಿರುವ ಯಾವುದೇ ವ್ಯಕ್ತಿಯಾಗಿರಬಹುದು. ಆ ವ್ಯಕ್ತಿ ಯಾರು ಎಂದು ನೀವು ತಿಳಿಸಬಹುದು. ಉದಾಹರಣೆ: ನನ್ನ ಗೆಳೆಯ ರವಿ ಚಿತ್ರ ಬಿಡಿಸುವ ಹವ್ಯಾಸ ಉಳ್ಳವನಾಗಿದ್ದಾನೆ', NOW()),
('hobbies_help', 'question7', 'kn', 'ನಿಮ್ಮ ನೆಚ್ಚಿನ ಹವ್ಯಾಸವು ನಿಮಗೆ ಸಂತೋಷ, ನಿರಾಳತೆ ಅಥವಾ ಹೆಚ್ಚಿನ ಆತ್ಮವಿಶ್ವಾಸವನ್ನು ನೀಡುತ್ತದೆಯೇ ಎಂದು ಬರೆಯಿರಿ.', NOW()),
('hobbies_help', 'question8', 'kn', 'ಯಾವ್ಯಾವ ಪ್ರತಿಭೆ ನಿಮ್ಮಲ್ಲಿದೆ ಬರೆಯಿರಿ.', NOW()),
('hobbies_help', 'question9', 'kn', 'ನಿಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ಸುಧಾರಿಸಲು ನೀವು ಏನು ಮಾಡುತ್ತಿದ್ದೀರಿ ಎಂದು ಬರೆಯಿರಿ.', NOW()),
('hobbies_help', 'question10', 'kn', 'ಶಾಲೆಯಲ್ಲಿ ಅಥವಾ ಮನೆಯಲ್ಲಿ ನಿಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ವ್ಯಕ್ತಪಡಿಸಲು/ತೋರಿಸಲು ನಿಮಗೆ ಪ್ರೋತ್ಸಾಹ ಮತ್ತು ಅವಕಾಶಗಳು ಸಿಗುತ್ತವೆಯೇ ಎಂದು ಬರೆಯಿರಿ.', NOW()),
('hobbies_help', 'question11', 'kn', 'ನಿಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ಬೆಳೆಸಿಕೊಳ್ಳಲು ನಿಮ್ಮ ಪೋಷಕರು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ನೀಡುತ್ತಾರೆ ಎಂದು ಬರೆಯಿರಿ.', NOW()),
('hobbies_help', 'question12', 'kn', 'ನಿಮ್ಮ ಹವ್ಯಾಸಕ್ಕೆ ಹೊಂದುವ ಯಾವುದಾದರೂ ಪ್ರತಿಭೆ ನಿಮ್ಮಲ್ಲಿದೆಯೇ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ. ಉ.ದಾ. ನಿಮ್ಮ ಸಂತೋಷಕ್ಕಾಗಿ ನೀವು ಚಿತ್ರಬಿಡಿಸುತ್ತೀರಿ ಮತ್ತು ಸುಂದರವಾಗಿ ಚಿತ್ರ ಬಿಡಿಸುವ ಸಾಮರ್ಥ್ಯವೂ ನಿಮ್ಮಲ್ಲಿದೆ.', NOW()),
('hobbies_help', 'question13', 'kn', 'ನಿಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ಭವಿಷ್ಯದ ವೃತ್ತಿಯನ್ನಾಗಿ ಮಾಡಲು ನೀವು ಬಯಸುತ್ತೀರಾ ಮತ್ತು ಅದಕ್ಕಾಗಿ ನಿಮ್ಮ ಯೋಜನೆ ಏನು ಎಂದು ಬರೆಯಿರಿ. ಉ.ದಾ. ಹೌದು, ನನ್ನ ಹವ್ಯಾಸ ಆಟವಾಡುವುದು. ನಾನು ಒಬ್ಬ ಕಬ್ಬಡ್ಡಿ ಆಟಗಾರನಾಗಲು ಬಯಸಿದ್ದೇನೆ. ಅದಕ್ಕಾಗಿ ದಿನವೂ ತಪ್ಪದೇ ಕಬ್ಬಡ್ಡಿ ಆಟವನ್ನು ಅಭ್ಯಾಸ ಮಾಡುತ್ತೇನೆ.', NOW()),
('hobbies_help', 'question14', 'kn', 'ತಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ವೃತ್ತಿಯನ್ನಾಗಿ ಪರಿವರ್ತಿಸಿಕೊಂಡ ವ್ಯಕ್ತಿಯ ಬಗ್ಗೆ ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಬರೆಯಿರಿ.', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 4. Update Summary Content
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('hobbies_summary_question', 'title', 'kn', 'ಸಾರಾಂಶ: ಹವ್ಯಾಸಗಳು ಮತ್ತು ಪ್ರತಿಭೆಗಳು', NOW()),
('hobbies_summary_question', 'subtitle', 'kn', 'ನಿಮ್ಮ ಹವ್ಯಾಸಗಳು ಮತ್ತು ಪ್ರತಿಭೆಗಳ ಸಾರಾಂಶ.', NOW()),
('hobbies_summary_question', 'question1', 'kn', 'ಈ ಹವ್ಯಾಸವನ್ನು ವೃತ್ತಿ ಆಗಿಸಲು ಇಷ್ಟವೇ?', NOW()),
('hobbies_summary_question', 'question2', 'kn', 'ಈ ಹವ್ಯಾಸಗಳೊಂದಿಗೆ ಹೊಂದಾಣಿಕೆಯಾಗಬಲ್ಲ ವೃತ್ತಿಗಳು', NOW()),
('hobbies_summary_question', 'question3', 'kn', 'ತಮ್ಮ ಹವ್ಯಾಸಗಳನ್ನು ವೃತ್ತಿಗಳನ್ನಾಗಿ ಮಾಡಿಕೊಂಡಿರುವ ನಿಮಗೆ ಪರಿಚಿತವಿರುವ ವ್ಯಕ್ತಿಗಳು', NOW()),
('hobbies_summary_question', 'question4', 'kn', 'ಪ್ರತಿಭೆಯನ್ನು ವೃತಿಯಾಗಿಸಲು ಇಷ್ಟವೇ?', NOW()),
('hobbies_summary_question', 'question5', 'kn', 'ಪ್ರತಿಭೆಗಳೊಂದಿಗೆ ಹೊಂದಾಣಿಕೆಯಾಗಬಲ್ಲ ವೃತ್ತಿಗಳು', NOW()),
('hobbies_summary_question', 'question6', 'kn', 'ತಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ವೃತ್ತಿಗಳನ್ನಾಗಿ ಮಾಡಿಕೊಂಡಿರುವ ನಿಮಗೆ ಪರಿಚಿತವಿರುವ ವ್ಯಕ್ತಿಗಳು', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 5. Update Summary Help Text (Standard placeholders as none provided, or reused from questions if possible)
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('hobbies_summary_help', 'question1', 'kn', 'ನಿಮ್ಮ ಹವ್ಯಾಸವನ್ನು ವೃತ್ತಿಯಾಗಿ ಮುಂದುವರಿಸಲು ನಿಮಗೆ ಆಸಕ್ತಿಯಿದೆಯೇ ಎಂದು ಬರೆಯಿರಿ.', NOW()),
('hobbies_summary_help', 'question2', 'kn', 'ನಿಮ್ಮ ಹವ್ಯಾಸಗಳಿಗೆ ಸಂಬಂಧಿಸಿದ ವೃತ್ತಿಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ.', NOW()),
('hobbies_summary_help', 'question3', 'kn', 'ಹವ್ಯಾಸವನ್ನೇ ವೃತ್ತಿಯಾಗಿಸಿಕೊಂಡಿರುವ ವ್ಯಕ್ತಿಗಳ ಬಗ್ಗೆ ಬರೆಯಿರಿ.', NOW()),
('hobbies_summary_help', 'question4', 'kn', 'ನಿಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ವೃತ್ತಿಯಾಗಿ ಮುಂದುವರಿಸಲು ನಿಮಗೆ ಆಸಕ್ತಿಯಿದೆಯೇ ಎಂದು ಬರೆಯಿರಿ.', NOW()),
('hobbies_summary_help', 'question5', 'kn', 'ನಿಮ್ಮ ಪ್ರತಿಭೆಗಳಿಗೆ ಸಂಬಂಧಿಸಿದ ವೃತ್ತಿಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ.', NOW()),
('hobbies_summary_help', 'question6', 'kn', 'ಪ್ರತಿಭೆಯನ್ನೇ ವೃತ್ತಿಯಾಗಿಸಿಕೊಂಡಿರುವ ವ್ಯಕ್ತಿಗಳ ಬಗ್ಗೆ ಬರೆಯಿರಿ.', NOW())
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
    SELECT COUNT(*) INTO q_count FROM content_translations WHERE resource_type = 'hobbies_question' AND lang = 'kn';
    SELECT COUNT(*) INTO h_count FROM content_translations WHERE resource_type = 'hobbies_help' AND lang = 'kn';
    SELECT COUNT(*) INTO s_count FROM content_translations WHERE resource_type = 'hobbies_summary_question' AND lang = 'kn';
    SELECT text INTO mod_title FROM content_translations WHERE resource_type = 'hobbies_module' AND resource_key = 'title' AND lang = 'kn';

    RAISE NOTICE 'Hobbies Migration Complete:';
    RAISE NOTICE '- Questions Updated: %', q_count;
    RAISE NOTICE '- Help Texts Updated: %', h_count;
    RAISE NOTICE '- Summary Questions Updated: %', s_count;
    RAISE NOTICE '- Module Title: %', mod_title;
END $$;
