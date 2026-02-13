-- Migration: Update Kannada content for My School, Learning and I Assessment
-- Updates Module Title, Intro, Questions (1-21), Help Text (1-21), Summary Questions, and Options

-- 1. Update Module Title & Intro
-- Note: Combined User's "Title text" and "Subtitle Text" into 'intro' as per UI structure.
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('school_learning_module', 'title', 'kn', 'ನನ್ನ ಶಾಲೆ, ನನ್ನ ಕಲಿಕೆ ಮತ್ತು ನಾನು', NOW()),
('school_learning_module', 'intro', 'kn', 'ಈ ಚಟುವಟಿಕೆಯಲ್ಲಿ ನೀವು ನಿಮ್ಮ ಶಾಲೆಯ ಬಗ್ಗೆ ಏನು ಇಷ್ಟಪಡುತ್ತೀರಿ? ಏನನ್ನು ಕಲಿಯಲು ಇಷ್ಟಪಡುತ್ತೀರಿ? ಮತ್ತು ಏನನ್ನು ಇಷ್ಟಪಡುವುದಿಲ್ಲ? ಹಾಗೂ ಕಲಿಕೆ, ಏಕೆ ಮತ್ತು ಹೇಗೆ ಎಂಬುದರ ಬಗ್ಗೆ ಯೋಚಿಸಬೇಕೆಂದು ನಾವು ಅಪೇಕ್ಷಿಸುತ್ತೇವೆ. ಇದರಿಂದ ಉನ್ನತ ಶಿಕ್ಷಣದಲ್ಲಿ ನಿಮ್ಮ ಕನಸಿಗೆ ಹೊಂದುವಂತೆ ಏನು ಕಲಿಯಬೇಕೆಂಬ ಅರಿವು ಮತ್ತು ಸೂಕ್ತವಾದ ವೃತ್ತಿಗಳನ್ನು ಆಯ್ದುಕೊಳ್ಳಲು ನಿಮಗೆ ಸಹಕಾರಿಯಾಗುತ್ತದೆ.

ಗಮನಿಸಿ: ನೀವು ಇಷ್ಟಪಡುವ ಅಥವಾ ಆನಂದಿಸುವ ವಿಷಯಗಳನ್ನು ಗಮನದಲ್ಲಿಡುವುದು ಒಮ್ಮೆ ಮಾತ್ರ ಮಾಡುವ ಚಟುವಟಿಕೆ ಅಲ್ಲ, ಅದು ನಿರಂತರವಾಗಿ ಗಮನದಲ್ಲಿಡಬೇಕಾದ ವಿಷಯ. ಮುಂದಿನ ದಿನಗಳಲ್ಲಿ ಇಷ್ಟವಾದ ವಿಷಯವನ್ನು ಕಲಿಯುವಾಗ ನಿಮಗೆ ಆ ಪಾಠ/ವಿಷಯವನ್ನು ಈ ಪುಸ್ತಕದ ಕೊನೆಯಲ್ಲಿ “ನನ್ನ ಆಸಕ್ತಿಯ ವಿಷಯಗಳು” ಎಂಬ ಪುಟದಲ್ಲಿ ದಾಖಲಿಸಲು ಸ್ಥಳವನ್ನು ನೀಡಲಾಗಿದೆ. ಇದರಿಂದ ನಿಮಗೆ ಯಾವ ರೀತಿಯ ವಿಷಯಗಳು ಇಷ್ಟವಾಗುತ್ತವೆ ಎಂಬುದರ ಅರಿವು ಬರುತ್ತದೆ ಮತ್ತು ನೀವು ಆ ವಿಷಯಕ್ಕೆ ಅನುಗುಣವಾಗಿರುವ ಅಥವಾ ಹೊಂದಾಣಿಕೆಯಾಗುವ ನಿಮ್ಮ ವೃತ್ತಿ ಆಯ್ಕೆಯನ್ನು ಹೊಂದಿಸಬಹುದು.', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 2. Update Questions (1-21)
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('school_learning_question', 'question1', 'kn', 'ನಿಮಗೆ ಶಾಲೆಗೆ ಬರುವುದೆಂದರೆ ಇಷ್ಟವೇ? ಯಾಕೆ?', NOW()),
('school_learning_question', 'question2', 'kn', 'ಶಾಲೆಯಲ್ಲಿ ಏನನ್ನು ಕಲಿಯಲು ಇಷ್ಟಪಡುತ್ತೀರಿ?', NOW()),
('school_learning_question', 'question3', 'kn', 'ನೀವು ಶಾಲೆಯಲ್ಲಿ ಕಲಿಯಲು ಇಷ್ಟಪಡದಿರಲು ಕಾರಣಗಳೇನು? ವಿವರಿಸಿ.', NOW()),
('school_learning_question', 'question4', 'kn', 'ಶಾಲೆಯಲ್ಲಿ ನಿಮಗೆ ಆತ್ಮೀಯ ಸ್ನೇಹಿತರು ಯಾರು? ಅವರಲ್ಲಿ ಇರುವ ಯಾವ ಗುಣ/ ಸಂಗತಿಗಳು ನೀವಿಬ್ಬರು ಸ್ನೇಹಿತರಾಗುವಂತೆ ಮಾಡಿದೆ?', NOW()),
('school_learning_question', 'question5', 'kn', 'ನೀವು ಹೆಚ್ಚು ಇಷ್ಟಪಡುವ ಪಠ್ಯ ವಿಷಯಗಳು ಯಾವುವು? ಬರೆಯಿರಿ.', NOW()),
('school_learning_question', 'question6', 'kn', 'ನೀವು ಈ ವಿಷಯಗಳನ್ನು ಏಕೆ ಇಷ್ಟಪಡುತ್ತೀರಿ? ಕಾರಣವನ್ನು ಬರೆಯಿರಿ.', NOW()),
('school_learning_question', 'question7', 'kn', 'ನಿಮಗೆ ಕಲಿಯಲು ಇಷ್ಟವಿಲ್ಲದ ಪಠ್ಯ ವಿಷಯಗಳು ಯಾವವು?', NOW()),
('school_learning_question', 'question8', 'kn', 'ಮೇಲಿನ ತಿಳಿಸಿದ ವಿಷಯಗಳಲ್ಲಿ ನಿಮಗೆ ಕಡಿಮೆ ಆಸಕ್ತಿ ಏಕೆ? ಈ ವಿಷಯಗಳನ್ನು ಕಲಿಯಲು ನೀವು ಯಾವ ಸವಾಲುಗಳನ್ನು ಪಡೆದಿದ್ದೀರಾ?', NOW()),
('school_learning_question', 'question9', 'kn', 'ನೀವು ಹೆಚ್ಚು ಅಂಕಗಳಿಸುತ್ತಿರುವ ವಿಷಯಗಳು ಯಾವುವು?', NOW()),
('school_learning_question', 'question10', 'kn', 'ನೀವು ಕಡಿಮೆ ಅಂಕಗಳಿಸುತ್ತಿರುವ ವಿಷಯಗಳು ಯಾವುವು?', NOW()),
('school_learning_question', 'question11', 'kn', 'ಈ ಕೆಳಗಿನ ಯಾವ ಕಲಿಕಾ ವಿಧಾನಗಳನ್ನು ನೀವು ಹೆಚ್ಚು ಇಷ್ಟಪಡುತ್ತೀರಿ? (ನಿಮಗೆ ಅನ್ವಯವಾಗುವುದನ್ನು ✔ ಎಂದು ಗುರುತು ಮಾಡಿ)', NOW()),
('school_learning_question', 'question12', 'kn', 'ನೀವು ಒಬ್ಬರೇ ಕಲಿಯಲು ಇಷ್ಟಪಡುತ್ತೀರಾ ಅಥವಾ ಗುಂಪಿನಲ್ಲಿ ಕಲಿಯಲು ಇಷ್ಟಪಡುತ್ತೀರಾ? ಏಕೆ? ಕಾರಣ ಬರೆಯಿರಿ.', NOW()),
('school_learning_question', 'question13', 'kn', 'ಶಾಲೆಯಲ್ಲಿ ನೀವು ನಿಮ್ಮ ಸ್ನೇಹಿತರಿಂದ ಕಲಿಯುತ್ತೀರಾ? ಶಾಲೆಯಲ್ಲಿ ಇತ್ತೀಚೆಗೆ ಸ್ನೇಹಿತರಿಂದ ಕಲಿತ ಕೆಲವು ವಿಷಯಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ.', NOW()),
('school_learning_question', 'question14', 'kn', 'ಪಠ್ಯ ವಿಷಯಗಳನ್ನು ಹೊರತುಪಡಿಸಿ, ಶಾಲೆಗೆ ನಿಮ್ಮನ್ನು ಆಕರ್ಷಿಸುವ ಅಂಶಗಳು ಯಾವುವು?', NOW()),
('school_learning_question', 'question15', 'kn', 'ನಿಮ್ಮ ನೆಚ್ಚಿನ ಶಿಕ್ಷಕರು ಯಾರು ಮತ್ತು ಏಕೆ? ಈ ಶಿಕ್ಷಕರು ನಿಮ್ಮ ಮೇಲೆ ಹೇಗೆ ಪ್ರಭಾವ ಬೀರುತ್ತಿದ್ದಾರೆ?', NOW()),
('school_learning_question', 'question16', 'kn', 'ಶಾಲೆಯಲ್ಲಿ ನಿಮಗೆ ತುಂಬಾ ಯಶಸ್ಸು ಅಥವಾ ಹೆಮ್ಮೆ ಅನಿಸುವಂತೆ ಮಾಡಿದ ಒಂದು ನಿರ್ದಿಷ್ಟ ಘಟನೆ / ಸನ್ನಿವೇಶ ಇದೆಯೇ? ಅದು ಏನು?', NOW()),
('school_learning_question', 'question17', 'kn', 'ನಿಮ್ಮ ಕನಸು ಮತ್ತು ನಿರೀಕ್ಷೆಗಳನ್ನು ಸಾಧಿಸಲು ಶಾಲೆಯಲ್ಲಿ ನೀವು ಕಲಿತ ವಿಷಯಗಳು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡುತ್ತವೆ?', NOW()),
('school_learning_question', 'question18', 'kn', 'ನಿಮ್ಮ ಶಾಲೆಯಲ್ಲಿ ಯಾವ, ಯಾವ ಸಂಗತಿಗಳು ಬದಲಾಗಬೇಕು ಎಂದು ನೀವು ಬಯಸುತ್ತೀರಿ? ಅದಕ್ಕೆ ಕಾರಣವೇನು ತಿಳಿಸಿ?', NOW()),
('school_learning_question', 'question19', 'kn', 'ಅಭ್ಯಾಸ ಮಾಡಲು ಯಾವುದಾದರೂ ಪ್ರತ್ಯೇಕ ಸ್ಥಳ ಇದೆಯೇ? ಅದು ಯಾಕೆ ಅಗತ್ಯ? ತಿಳಿಸಿ', NOW()),
('school_learning_question', 'question20', 'kn', 'ನಿಮ್ಮ ಜೀವನದಲ್ಲಿ ಕಲಿಕೆಗೆ ಸಂಬಂಧಿಸಿದಂತೆ ಶಾಲೆ ಮಹತ್ವದ ಪಾತ್ರವಹಿಸಿದೆಯೇ? ನಿಮ್ಮ ಅಭಿಪ್ರಾಯವನ್ನು ಬರೆಯಿರಿ.', NOW()),
('school_learning_question', 'question21', 'kn', 'ಶಾಲೆಯ ಚಟುವಟಿಕೆಗಳು ಮತ್ತು ಕಲಿಕೆಯ ಬಗ್ಗೆ ನಿಮ್ಮ ಪಾಲಕರೊಂದಿಗೆ ಚರ್ಚಿಸಲು ಹೇಳಿಕೊಳ್ಳುವುದೆಂದರೆ ನಿಮಗೆ ಇಷ್ಟವೇ? ಯಾವೆಲ್ಲ ವಿಷಯಗಳನ್ನು ನೀವು ಅವರೊಂದಿಗೆ ಚರ್ಚಿಸುತ್ತೀರಿ?', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 3. Update Question Options (For Question 11)
-- Mapping User Options (a-i) to Code Keys:
-- a -> visual
-- b -> audio
-- c -> experimenting
-- d -> discuss
-- e -> groupDiscussions
-- f -> presentation (Mapped to 'Writing' as per user text 'ಬರವಣಿಗೆ')
-- g -> rolePlay (Mapped to 'Reading' as per user text 'ಓದುವಿಕೆ ಮತ್ತು ಬಾಯಿಪಾಠ')
-- h -> teaching
-- i -> other

INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('school_learning_option', 'visual', 'kn', 'ವಿಡಿಯೋಗಳನ್ನು ವೀಕ್ಷಿಸುವುದು ಅಥವಾ ಚಿತ್ರಗಳೊಂದಿಗೆ ಸಂಬಂಧೀಕರಿಸುವಿಕೆ. (ದೃಶ್ಯ–ಶ್ರವಣ ಮಾಧ್ಯಮ)', NOW()),
('school_learning_option', 'audio', 'kn', 'ಆಲಿಸುವಿಕೆ (ಶ್ರವಣ ಮಾಧ್ಯಮ)', NOW()),
('school_learning_option', 'experimenting', 'kn', 'ಪ್ರಯೋಗ / ಅನುಭವಾತ್ಮಕವಾಗಿ ಕಲಿಯುವುದು', NOW()),
('school_learning_option', 'discuss', 'kn', 'ಚರ್ಚೆ / ತರ್ಕ', NOW()),
('school_learning_option', 'groupDiscussions', 'kn', 'ಗುಂಪು ಚರ್ಚೆ', NOW()),
('school_learning_option', 'presentation', 'kn', 'ಬರವಣಿಗೆ', NOW()),
('school_learning_option', 'rolePlay', 'kn', 'ಓದುವಿಕೆ ಮತ್ತು ಬಾಯಿಪಾಠ', NOW()),
('school_learning_option', 'teaching', 'kn', 'ನಾನು ಇತರರಿಗೆ ಕಲಿಸುವುದರಿಂದ ಕಲಿಯುತ್ತೇನೆ.', NOW()),
('school_learning_option', 'other', 'kn', 'ನಿಮಗೆ ಅನ್ವಯಿಸುವ ಬೇರೆ ಕಲಿಕಾ ವಿಧಾನ', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 4. Update Help Text (1-21)
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('school_learning_help', 'question1', 'kn', 'ನಿಮಗೆ ಶಾಲೆಗೆ ಬರಲು ಇಷ್ಟವೇ ಎಂದು ಬರೆಯಿರಿ ಮತ್ತು ಅದಕ್ಕೆ ಕಾರಣ ನೀಡಿ.', NOW()),
('school_learning_help', 'question2', 'kn', 'ನೀವು ಶಾಲೆಯಲ್ಲಿ ಏನನ್ನು ಕಲಿಯಲು ಇಷ್ಟಪಡುತ್ತೀರಿ ಎಂದು ಬರೆಯಿರಿ.', NOW()),
('school_learning_help', 'question3', 'kn', 'ನಿಮಗೆ ಶಾಲೆಯಲ್ಲಿ ಕಲಿಯುವುದು ಏಕೆ ಇಷ್ಟವಿಲ್ಲ ಎಂಬುದಕ್ಕೆ ಕಾರಣಗಳನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಬರೆಯಿರಿ.', NOW()),
('school_learning_help', 'question4', 'kn', 'ನಿಮ್ಮ ಆಪ್ತ ಸ್ನೇಹಿತರು ಮತ್ತು ಅವರ ವಿಶೇಷ ಗುಣಗಳ ಬಗ್ಗೆ ಬರೆಯಿರಿ.', NOW()),
('school_learning_help', 'question5', 'kn', 'ನಿಮಗೆ ಅತಿ ಹೆಚ್ಚು ಇಷ್ಟವಾಗುವ ವಿಷಯಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ.', NOW()),
('school_learning_help', 'question6', 'kn', 'ಯಾಕೆ ಇಷ್ಟ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ. ಉದಾಹರಣೆ :ಆ ವಿಷಯವು ಸುಲಭವಾಗಿರುವುದರಿಂದ, ಆಸಕ್ತಿದಾಯಕವಾಗಿರುವುದರಿಂದ ಅಥವಾ ಶಿಕ್ಷಕರು ಚೆನ್ನಾಗಿ ಬೋಧಿಸುವುದರಿಂದ.', NOW()),
('school_learning_help', 'question7', 'kn', 'ಯಾಕೆ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ. 
 ಉದಾಹರಣೆ : ಕಷ್ಟಕರವಾಗಿರುವುದರಿಂದ, ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಕಠಿಣವಾಗಿರುವುದರಿಂದ ಇತ್ಯಾದಿ', NOW()),
('school_learning_help', 'question8', 'kn', 'ಯಾಕೆ ಕಡಿಮೆ ಆಸಕ್ತಿ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ. ಶಿಕ್ಷಕರು, ಸ್ನೇಹಿತರು ಅಥವಾ ಇನ್ಯಾರ ಸಹಾಯ ಪಡೆದಿರಿ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ.', NOW()),
('school_learning_help', 'question9', 'kn', 'ನೀವು ಯಾವ ವಿಷಯಗಳಲ್ಲಿ ಹೆಚ್ಚಿನ ಅಂಕಗಳನ್ನು ಪಡೆಯುತ್ತಿದ್ದೀರಿ ಬರೆಯಿರಿ', NOW()),
('school_learning_help', 'question10', 'kn', 'ನೀವು ಯಾವ ವಿಷಯಗಳಲ್ಲಿ ಕಡಿಮೆ ಅಂಕಗಳನ್ನು ಪಡೆಯುತ್ತಿದ್ದೀರಿ ಬರೆಯಿರಿ', NOW()),
('school_learning_help', 'question11', 'kn', 'ನಿಮಗೆ ಅನ್ವಯಿಸುವ ಆಯ್ಕೆಗಳಿಗೆ ಮಾತ್ರ ಸರಿಯಾದ (✔️) ಗುರುತು ಹಾಕಿ.

a. ಗಮನಿಸಿ ಮತ್ತು ಸಂಬಂಧಿತ ಚಿತ್ರಗಳನ್ನು ಬಳಸಿಕೊಂಡು ತಿಳಿದುಕೊಳ್ಳುವುದು
b. ಮೌಖಿಕ ವಿವರಣೆಯ ಮೂಲಕ ಸ್ಪಷ್ಟವಾಗಿ ತಿಳಿದುಕೊಳ್ಳುವುದು.
c. ಪ್ರಾಯೋಗಿಕ ಚಟುವಟಿಕೆ ಮತ್ತು ಅನುಭವದ ಮೂಲಕ ಕಲಿಕೆ.
d. ವಿಚಾರಗಳನ್ನು ಚರ್ಚಿಸಿ ಮತ್ತು ತರ್ಕಿಕವಾಗಿ ತಿಳಿದುಕೊಳ್ಳುವುದು
e. ವಿಚಾರಗಳ ಹಂಚಿಕೆ, ಚರ್ಚೆಯ ಮೂಲಕ ಕಲಿಕೆ
f. ವಿಷಯವನ್ನು ಬರೆಯುವ ಮೂಲಕ ಅರ್ಥೈಸಿಕೊಳ್ಳುವುದು
g. ಓದುವುದು ಮತ್ತು ಪುನಃ, ಪುನಃ ಓದಿ ನೆನೆಪಿಟ್ಟುಕೊಳ್ಳುವುದು.
h. ಇತರರಿಗೆ ಕಲಿಸುವ ಮೂಲಕ ನೀವು ಕಲಿಯುತ್ತೀರಿ
i. ನಿಮಗೆ ಸೂಕ್ತವೆನಿಸುವ ಯಾವುದೇ ಇತರ ಕಲಿಕಾ ವಿಧಾನವನ್ನು ಬರೆಯಿರಿ.', NOW()),
('school_learning_help', 'question12', 'kn', 'ನಿಮ್ಮ ಮೆಚ್ಚಿನ ಕಲಿಕಾ ವಿಧಾನವನ್ನು ಆರಿಸಿ ಮತ್ತು ಕಾರಣವನ್ನು ಬರೆಯಿರಿ.', NOW()),
('school_learning_help', 'question13', 'kn', 'ನಿಮ್ಮ ಸ್ನೇಹಿತರಿಂದ ನೀವು ಕಲಿತದ್ದನ್ನು ನೆನಪಿಸಿಕೊಳ್ಳಿ ಮತ್ತು ಪಟ್ಟಿ ಮಾಡಿ.', NOW()),
('school_learning_help', 'question14', 'kn', 'ಶಾಲೆಯನ್ನು ಆಕರ್ಷಕವಾಗಿಸುವ ಇತರ ಚಟುವಟಿಕೆಗಳು ಅಥವಾ ಅಂಶಗಳನ್ನು ಬರೆಯಿರಿ.', NOW()),
('school_learning_help', 'question15', 'kn', 'ನಿಮ್ಮ ನೆಚ್ಚಿನ ಶಿಕ್ಷಕರು ಮತ್ತು ಅವರು ನಿಮ್ಮ ಮೇಲೆ ಹೇಗೆ ಪ್ರಭಾವ ಬೀರಿದ್ದಾರೆ ಎಂಬುದರ ಬಗ್ಗೆ ಬರೆಯಿರಿ.', NOW()),
('school_learning_help', 'question16', 'kn', 'ನೀವು ಹೆಮ್ಮೆ ಅಥವಾ ಸಂತೋಷ ಅನುಭವಿಸುವಂತೆ ಮಾಡಿದ ಶಾಲಾ ಘಟನೆಯ ಬಗ್ಗೆ ಬರೆಯಿರಿ.', NOW()),
('school_learning_help', 'question17', 'kn', 'ಶಾಲೆಯಲ್ಲಿ ನೀವು ಕಲಿತದ್ದನ್ನು ನಿಮ್ಮ ಕನಸುಗಳು ಮತ್ತು ಗುರಿಗಳಿಗೆ ಸಂಬಂಧಿಸಿ ನೋಡಿ.', NOW()),
('school_learning_help', 'question18', 'kn', 'ನೀವು ಬಯಸುವ ಬದಲಾವಣೆಗಳು ಮತ್ತು ಅವುಗಳಿಗೆ ಕಾರಣಗಳನ್ನು ಬರೆಯಿರಿ.', NOW()),
('school_learning_help', 'question19', 'kn', 'ನಿಮ್ಮ ಅಭ್ಯಾಸಕ್ಕೆಂದು ಪ್ರತ್ಯೇಕ ಸ್ಥಳ ಇದೆಯೇ? ಹಾಗು ಅದು ಯಾಕೆ ಅಗತ್ಯ ಎಂಬುದರ ಬಗ್ಗೆ ಬರೆಯಿರಿ.', NOW()),
('school_learning_help', 'question20', 'kn', 'ನಿಮ್ಮ ಕಲಿಕೆಯಲ್ಲಿ ಶಾಲೆಯ ಪಾತ್ರದ ಬಗ್ಗೆ ನಿಮ್ಮ ಅಭಿಪ್ರಾಯವನ್ನು ಬರೆಯಿರಿ.', NOW()),
('school_learning_help', 'question21', 'kn', 'ನಿಮ್ಮ ಪೋಷಕರೊಂದಿಗೆ ನೀವು ಚರ್ಚಿಸುವ ಶಾಲೆಗೆ ಸಂಬಂಧಿಸಿದ ವಿಷಯ ಯಾವುದು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ.', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 5. Update Summary Content
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('school_learning_summary_question', 'title', 'kn', 'ಸಾರಾಂಶ: ನನ್ನ ಮುಂದಿನ ಯೋಜನೆ', NOW()),
('school_learning_summary_question', 'subtitle', 'kn', 'ನಿಮ್ಮ ಭವಿಷ್ಯದ ಯೋಜನೆಯ ಸಂಕ್ಷಿಪ್ತ ಸಾರಾಂಶವನ್ನು ಬರೆಯಿರಿ.', NOW()),
('school_learning_summary_question', 'question1', 'kn', 'ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳು', NOW()),
('school_learning_summary_question', 'question2', 'kn', 'ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳಿಂದ ನಾನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು', NOW()),
('school_learning_summary_question', 'question3', 'kn', 'ನಾನು ಇಷ್ಟಪಡದ ವಿಷಯಗಳು', NOW()),
('school_learning_summary_question', 'question4', 'kn', 'ಇಷ್ಟಪಡದ ವಿಷಯಗಳಲ್ಲಿ ನಾನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು', NOW()),
('school_learning_summary_question', 'question5', 'kn', 'ಪಠ್ಯ ವಿಷಯಗಳ ಜೊತೆಗೆ, ನಾನು ಉತ್ತಮ ಸಾಧನೆ ಮಾಡುವ ಇತರ ಚಟುವಟಿಕೆಗಳು / ವಿಷಯಗಳು', NOW()),
('school_learning_summary_question', 'question6', 'kn', 'ನಾನು ಈ ಕೌಶಲ್ಯಗಳನ್ನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ನನ್ನ ಕೆಲಸ / ವೃತ್ತಿಯ ಆಯ್ಕೆಗೆ ಸಹಾಯವಾಗುತ್ತದೆ.', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- 6. Update Summary Help Text
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('school_learning_summary_help', 'question1', 'kn', 'ನಿಮಗೆ ಇಷ್ಟವಾದ ವಿಷಯಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ.', NOW()),
('school_learning_summary_help', 'question2', 'kn', 'ನಿಮಗೆ ಇಷ್ಟವಾದ ವಿಷಯಗಳ ಆಧಾರದ ಮೇಲೆ ನೀವು ಯಾವ ವೃತ್ತಿಜೀವನವನ್ನು ಆರಿಸಿಕೊಳ್ಳಬಹುದು ಎಂದು ಬರೆಯಿರಿ.', NOW()),
('school_learning_summary_help', 'question3', 'kn', 'ನಿಮಗೆ ಇಷ್ಟವಿಲ್ಲದ ವಿಷಯಗಳನ್ನು ಬರೆಯಿರಿ.', NOW()),
('school_learning_summary_help', 'question4', 'kn', 'ನಿಮಗೆ ಇಷ್ಟವಿಲ್ಲದ ವಿಷಯಗಳಲ್ಲಿ ನೀವು ಸುಧಾರಣೆ ಕಂಡರೆ ಯಾವ ವೃತ್ತಿಜೀವನವನ್ನು ಆರಿಸಿಕೊಳ್ಳಬಹುದು ಎಂದು ಬರೆಯಿರಿ.', NOW()),
('school_learning_summary_help', 'question5', 'kn', 'ಅಧ್ಯಯನದ ಜೊತೆಗೆ ನೀವು ಉತ್ತಮವಾಗಿ ಕಾರ್ಯನರ್ವಹಿಸುವ ಇತರ ಚಟುವಟಿಕೆಗಳು ಅಥವಾ ಕ್ಷೇತ್ರಗಳನ್ನು ಬರೆಯಿರಿ.', NOW()),
('school_learning_summary_help', 'question6', 'kn', 'ನೀವು ಸುಧಾರಿಸಿಕೊಳ್ಳಬೇಕಾದ ಕೌಶಲ್ಯಗಳು ಮತ್ತು ವೃತ್ತಿಜೀವನದ ಆಯ್ಕೆಯಲ್ಲಿ ಅವು ಹೇಗೆ ಸಹಾಯ ಮಾಡುತ್ತವೆ ಎಂದು ಬರೆಯಿರಿ.', NOW())
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
    SELECT COUNT(*) INTO q_count FROM content_translations WHERE resource_type = 'school_learning_question' AND lang = 'kn';
    SELECT COUNT(*) INTO h_count FROM content_translations WHERE resource_type = 'school_learning_help' AND lang = 'kn';
    SELECT COUNT(*) INTO s_count FROM content_translations WHERE resource_type = 'school_learning_summary_question' AND lang = 'kn';
    SELECT text INTO mod_title FROM content_translations WHERE resource_type = 'school_learning_module' AND resource_key = 'title' AND lang = 'kn';

    RAISE NOTICE 'School Learning Migration Complete:';
    RAISE NOTICE '- Questions Updated: %', q_count;
    RAISE NOTICE '- Help Texts Updated: %', h_count;
    RAISE NOTICE '- Summary Questions Updated: %', s_count;
    RAISE NOTICE '- Module Title: %', mod_title;
END $$;
