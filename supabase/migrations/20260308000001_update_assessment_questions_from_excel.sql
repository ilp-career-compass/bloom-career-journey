-- Migration: Update assessment questions from Updated_Qns.xlsx
-- Generated: 2026-03-08T10:18:43.244Z
-- Assessments updated:
--   inspiration: 10 main questions, 3 summary questions
--   about_me: 18 main questions, 15 summary questions
--   dreams: 18 main questions, 3 summary questions
--   school_learning: 21 main questions, 8 summary questions
--   hobbies: 14 main questions, 8 summary questions
--   role_models: 17 main questions, 0 summary questions
--
-- This migration uses UPSERT (INSERT ... ON CONFLICT DO UPDATE) for translations
-- and UPDATE for base question tables. Safe to run multiple times.

BEGIN;

-- ============================================================================
-- INSPIRATION (9.1_My Inspiration)
-- 10 main questions, 3 summary questions
-- ============================================================================

-- Main questions: base table updates (English) + translations (Kannada, Tamil)

UPDATE inspiration_questions SET question_text = $$Which parts of this video/audio did you like the most or find inspiring?$$, help_text = $$Which part of the video/audio inspired you most?$$ WHERE sequence_number = 1;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_question$$, $$question1$$, 'kn', $$ಈ ವೀಡಿಯೋ / ಆಡಿಯೋದಲ್ಲಿ ನಿಮಗೆ ಹೆಚ್ಚು ಇಷ್ಟವಾದ / ಪ್ರೇರಣಾದಾಯಕ ಅಂಶಗಳು ಯಾವುವು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_question$$, $$question1$$, 'ta', $$இந்த வீடியோ/ஆடியோவில் உங்களுக்கு மிகவும் பிடித்த பகுதி அல்லது உத்வேகத்தை அளித்தது எது?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_help$$, $$question1$$, 'kn', $$ವೀಡಿಯೊ/ಆಡಿಯೋದ ಯಾವ ಭಾಗವು ನಿಮಗೆ ಹೆಚ್ಚು ಸ್ಫೂರ್ತಿ ನೀಡಿತು ಎಂಬುದರ ಬಗ್ಗೆ ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_help$$, $$question1$$, 'ta', $$இந்த வீடியோ/ஆடியோவில் எந்த பகுதி உங்களை அதிகம் ஊக்கமளித்தது?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE inspiration_questions SET question_text = $$Whose behavior or way of speaking did you like the most in this video/audio?$$, help_text = $$Whose behavior or speech did you like most?$$ WHERE sequence_number = 2;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_question$$, $$question2$$, 'kn', $$ಈ ವೀಡಿಯೋ/ಆಡಿಯೋದಲ್ಲಿ ನಿಮಗೆ ಯಾರ ನಡವಳಿಕೆ ಹೆಚ್ಚು ಇಷ್ಟವಾಯಿತು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_question$$, $$question2$$, 'ta', $$இந்த வீடியோ/ஆடியோவில் உங்களுக்கு யாருடைய செயல் அல்லது பேசும் விதம் மிகவும் பிடித்தது? ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_help$$, $$question2$$, 'kn', $$ಯಾರ ನಡವಳಿಕೆ ಅಥವಾ ನಡತೆ ನಿಮಗೆ ಹೆಚ್ಚು ಇಷ್ಟವಾಯಿತು ಎಂಬುದನ್ನು ಬಗ್ಗೆ ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_help$$, $$question2$$, 'ta', $$யாருடைய செயல் அல்லது பேசும் விதம் உங்களுக்கு பிடித்தது என்பதை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE inspiration_questions SET question_text = $$What qualities did you observe in them?$$, help_text = $$This question asks you to write the good qualities you noticed in the characters.$$ WHERE sequence_number = 3;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_question$$, $$question3$$, 'kn', $$ಅವರಲ್ಲಿ ನೀವು ಗಮನಿಸಿದ ಗುಣಗಳು ಯಾವುವು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_question$$, $$question3$$, 'ta', $$அவர்களில் நீங்கள் கவனித்த குணங்கள் என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_help$$, $$question3$$, 'kn', $$ಪಾತ್ರಗಳಲ್ಲಿ ನೀವು ಗಮನಿಸಿದ ಉತ್ತಮ ಗುಣಗಳು ಯಾವವುಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_help$$, $$question3$$, 'ta', $$இந்தக் கேள்வி, கதாபாத்திரங்களில் நீங்கள் கவனித்த நல்ல குணங்களை எழுதச் சொல்லுகிறது.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE inspiration_questions SET question_text = $$Which quality of the person can bring a positive change in your life?$$, help_text = $$Write the quality that can help you bring a positive change in your life.$$ WHERE sequence_number = 4;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_question$$, $$question4$$, 'kn', $$ಅವುಗಳಲ್ಲಿನ ಯಾವ ಅಂಶ ನಿಮ್ಮ ಜೀವನದಲ್ಲಿ ಉತ್ತಮ ಬದಲಾವಣೆ ತರಬಹುದು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_question$$, $$question4$$, 'ta', $$அந்த நபரின் எந்த குணம் உங்கள் வாழ்க்கையில் நல்ல மாற்றத்தை ஏற்படுத்தும்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_help$$, $$question4$$, 'kn', $$ಆ ಗುಣಗಳಲ್ಲಿ ಯಾವುದು ನಿಮ್ಮ ಜೀವನದಲ್ಲಿ ಒಳ್ಳೆಯ ಬದಲಾವಣೆ ತರಲು ಸಹಾಯ ಮಾಡಬಹುದು ಎಂಬುದರ ಬಗ್ಗೆ ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_help$$, $$question4$$, 'ta', $$அந்த நபரின் எந்த குணம் உங்களுக்கு உதவும் என்று எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE inspiration_questions SET question_text = $$Which character did you find relatable to yourself, and can you explain the reasons for it?$$, help_text = $$Write about the character that matches your own nature$$ WHERE sequence_number = 5;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_question$$, $$question5$$, 'kn', $$ಯಾವ ಪಾತ್ರ ನಿಮಗೆ ಹೋಲಿಕೆಯಾಯಿತು ಎಂದು ಅನಿಸಿತು ಮತ್ತು ಅದಕ್ಕೆ ಕಾರಣಗಳನ್ನು ತಿಳಿಸುವಿರಾ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_question$$, $$question5$$, 'ta', $$உங்களைப் போலவே இருக்கும் கதாபாத்திரம் எது என்று தோன்றுகிறது? அதற்கான காரணங்களைக் கூற முடியுமா?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_help$$, $$question5$$, 'kn', $$ನಿಮ್ಮ ಸ್ವಭಾವವನ್ನೇ ಹೋಲುವ ಪಾತ್ರದ ಬಗ್ಗೆ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_help$$, $$question5$$, 'ta', $$உங்கள் சுபாவத்தைப் போன்றே இருக்கும் கதாபாத்திரத்தைப் பற்றி எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE inspiration_questions SET question_text = $$Have you ever demonstrated any of the values you admire in real life? Describe the situation briefly.$$, help_text = $$Write about whether you have demonstrated the good behavior you liked in the character.$$ WHERE sequence_number = 6;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_question$$, $$question6$$, 'kn', $$ನೀವು ನಿಜ ಜೀವನದಲ್ಲಿ ಮೆಚ್ಚುವ ಯಾವುದೇ ಮೌಲ್ಯಗಳನ್ನು ಎಂದಾದರೂ ಪ್ರದರ್ಶಿಸಿದ್ದೀರಾ? ಆ ಸನ್ನಿವೇಶವನ್ನು ಸಂಕ್ಷಿಪ್ತವಾಗಿ ವಿವರಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_question$$, $$question6$$, 'ta', $$கதையில் உள்ள கதாபாத்திரம் போல நீங்கள் உண்மையான வாழ்க்கையில் யாருக்காவது உதவியிருக்கிறீர்களா? அந்த அனுபவத்தை சுருக்கமாக விவரித்து, அதைப் பற்றிச் சிந்தியுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_help$$, $$question6$$, 'kn', $$ಪಾತ್ರದಲ್ಲಿ ನೀವು ಇಷ್ಟಪಡುವ ಒಳ್ಳೆಯ ನಡತೆಯನ್ನು ನೀವು ಪ್ರದರ್ಶಿಸಿದ್ದೀರಾ ಎಂಬ ಬಗ್ಗೆ ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_help$$, $$question6$$, 'ta', $$கதாபாத்திரத்தில் நீங்கள் விரும்பும் நல்ல நடத்தையை நீங்கள் காட்டியிருக்கிறீர்களா என்பதைப் பற்றி எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE inspiration_questions SET question_text = $$If you were that character, what would you do?$$, help_text = $$What would you do as the character?$$ WHERE sequence_number = 7;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_question$$, $$question7$$, 'kn', $$ನಿವೇ ಆ ಪಾತ್ರಧಾರಿ ಆಗಿದ್ದರೆ ಏನು ಮಾಡುತ್ತಿದ್ದಿರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_question$$, $$question7$$, 'ta', $$நீங்கள் அந்த கதாபாத்திரமாக இருந்தால், நீங்கள் என்ன செய்வீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_help$$, $$question7$$, 'kn', $$ನಿವು ಇಷ್ಟಪಟ್ಟ ಪಾತ್ರ ನೀವೇ ಆದರೆ ನಿಮ್ಮ ವರ್ತನೆ ಹೇಗಿರುತ್ತಿತ್ತು? ಎಂಬ ಬಗ್ಗೆ ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_help$$, $$question7$$, 'ta', $$நீங்கள் அந்த கதாபாத்திரமாக இருந்தால் என்ன செய்வீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE inspiration_questions SET question_text = $$In this video/audio, did any character inspire you? Write down what makes that person an inspiration to you$$, help_text = $$Write about the character that inspired you and how it inspired you.$$ WHERE sequence_number = 8;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_question$$, $$question8$$, 'kn', $$ಈ ವಿಡಿಯೋ/ಆಡಿಯೋದಲ್ಲಿ ನೋಡಿರುವ ಹಾಗೆ ನಿಮ್ಮನ್ನು ಪ್ರೇರೇಪಿಸಿರುವ ವ್ಯಕ್ತಿ ಅಥವಾ ಸನ್ನಿವೇಶವನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_question$$, $$question8$$, 'ta', $$இந்த வீடியோ/ஆடியோவில் ஏதாவது கதாபாத்திரம் உங்களை ஊக்கமளித்ததா? அந்த மனிதர் உங்களை ஊக்கமளிப்பவர் என்பதை விளக்கும் காரணத்தை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_help$$, $$question8$$, 'kn', $$ನಿಮಗೆ ಸ್ಫೂರ್ತಿ ನೀಡಿದ ಪಾತ್ರ ಮತ್ತು ಅದು ಹೇಗೆ ಸ್ಪೂರ್ತಿ ನೀಡಿದೆ? ಎಂಬುದರ ಬಗ್ಗೆ ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_help$$, $$question8$$, 'ta', $$எந்த கதாபாத்திரம் உங்களை ஊக்கமளித்தது? ஏன்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE inspiration_questions SET question_text = $$Which quality of that character would you like to follow in real life?$$, help_text = $$Which quality will you follow?$$ WHERE sequence_number = 9;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_question$$, $$question9$$, 'kn', $$ಆ ಪಾತ್ರಗಳಿಂದ ಯಾವ ಹೊಸ ಅಂಶಗಳನ್ನು ನಿಮ್ಮ ಜೀವನದಲ್ಲಿ ಅಳವಡಿಸಿಕೊಳ್ಳಲು ಬಯಸುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_question$$, $$question9$$, 'ta', $$அந்த கதாபாத்திரத்தின் எந்த குணத்தை நீங்கள் உண்மையான வாழ்க்கையில் பின்பற்ற விரும்புகிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_help$$, $$question9$$, 'kn', $$ಅದರಲ್ಲಿನ ಯಾವ ಗುಣವನ್ನು ನೀವು ಅನುಸರಿಸುತ್ತೀರಿ? ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_help$$, $$question9$$, 'ta', $$நீங்கள் எந்த குணத்தை பின்பற்ற விரும்புகிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE inspiration_questions SET question_text = $$If there are any additional points you noticed that you can share, write them down.$$, help_text = $$Write any other quality of the character you liked.$$ WHERE sequence_number = 10;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_question$$, $$question10$$, 'kn', $$ನೀವು ಹಂಚಿಕೊಳ್ಳಬಹುದಾದ ಇನ್ನೇನಾದರೂ ಹೆಚ್ಚಿನ ಅಂಶಗಳನ್ನು ಗಮನಿಸಿದ್ದರೆ ಅದನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_question$$, $$question10$$, 'ta', $$கதாபாத்திரத்தின் வேறு ஏதாவது குணம் உங்களுக்கு பிடித்திருந்தால், அதை எழுதுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_help$$, $$question10$$, 'kn', $$ನೀವು ಇಷ್ಟಪಟ್ಟ ಪಾತ್ರದ ಯಾವುದೇ ಇತರ ಗುಣವನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_help$$, $$question10$$, 'ta', $$கதாபாத்திரத்தின் மற்றொரு பிடித்த குணத்தை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- Summary questions (assessment_summary_templates JSONB)

UPDATE assessment_summary_templates
SET summary_questions = jsonb_build_object(
  'en', '{"question1":"After watching all these videos, list the points that inspired you from your experience","question2":"After watching these videos, which behaviors do you feel you should not have?","question3":"Discuss with your friend about the similarities between the characters in the video and the people who inspire you in real life."}'::jsonb,
  'kn', '{"question1":"ಈ ಎಲ್ಲಾ ವಿಡಿಯೋಗಳನ್ನು ನೋಡಿದಾಗ ಮತ್ತು ಸ್ವಂತ ಅನುಭವದಿಂದ ನೀವು ಸ್ಪೂರ್ತಿ ಪಡೆದ ಅಂಶಗಳನ್ನು ಪಟ್ಟಿಮಾಡಿ.","question2":"ಈ ಎಲ್ಲಾ ವಿಡಿಯೋಗಳನ್ನು ನೋಡಿದಾಗ ಮತ್ತು ನಿಮಗೆ ಅನಿಸುತ್ತಿರುವ - ನಿಮ್ಮಲ್ಲಿ ಇರಬಾರದೆನಿಸಿದ ನಡವಳಿಕೆಗಳು ಯಾವವು? ಅದನ್ನು ಬರೆಯಿರಿ","question3":"ನಿಮ್ಮ ಗೆಳೆಯೊರೊಂದಿಗೆ, ಈ ವಿಡಿಯೋಗಳಲ್ಲಿನ ನಿಮಗೆ ಪ್ರೇರಣೆ ನೀಡಿದ ಪಾತ್ರಗಳು ಮತ್ತು ನಿಮ್ಮ ನಿಜ ಜೀವನದಲ್ಲಿ ನಿಮಗೆ ಸ್ಪೂರ್ತಿ ನೀಡಿದ ವ್ಯಕ್ತಿಗಳಿಗೂ ಇರುವ ಹೋಲಿಕೆಗಳನ್ನು ಕುರಿತು ಚರ್ಚಿಸಿ. ಆ ಸಾರಾಂಶವನ್ನು ಬರೆಯಿರಿ"}'::jsonb,
  'ta', '{"question1":"இந்த அனைத்து வீடியோக்களையும் பார்த்த பிறகு, உங்கள் அனுபவத்தில் உங்களை ஊக்கமளித்த முக்கியமானவற்றை பட்டியலிடுங்கள்","question2":"இந்த வீடியோக்களைப் பார்த்த பிறகு, உங்களிடம் இருக்கக்கூடாது என்று நீங்கள் நினைக்கும் பழக்கவழக்கங்கள்/நடத்தைகள் எவை?","question3":"உங்கள் நண்பர்களுடன், இந்த வீடியோவில் உங்களுக்கு ஊக்கமளித்த பாத்திரம் யார், மேலும் அது உங்கள் நிஜ வாழ்க்கையில் உங்களுக்கு ஊக்கமளிக்கும் நபர்களுக்கும் இடையிலான ஒற்றுமைகளைப் பற்றி விவாதிக்கவும்"}'::jsonb
),
    updated_at = NOW()
WHERE assessment_type = 'inspiration';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_summary_question$$, $$question1$$, 'kn', $$ಈ ಎಲ್ಲಾ ವಿಡಿಯೋಗಳನ್ನು ನೋಡಿದಾಗ ಮತ್ತು ಸ್ವಂತ ಅನುಭವದಿಂದ ನೀವು ಸ್ಪೂರ್ತಿ ಪಡೆದ ಅಂಶಗಳನ್ನು ಪಟ್ಟಿಮಾಡಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_summary_question$$, $$question1$$, 'ta', $$இந்த அனைத்து வீடியோக்களையும் பார்த்த பிறகு, உங்கள் அனுபவத்தில் உங்களை ஊக்கமளித்த முக்கியமானவற்றை பட்டியலிடுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_summary_question$$, $$question1$$, 'en', $$After watching all these videos, list the points that inspired you from your experience$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_summary_question$$, $$question2$$, 'kn', $$ಈ ಎಲ್ಲಾ ವಿಡಿಯೋಗಳನ್ನು ನೋಡಿದಾಗ ಮತ್ತು ನಿಮಗೆ ಅನಿಸುತ್ತಿರುವ - ನಿಮ್ಮಲ್ಲಿ ಇರಬಾರದೆನಿಸಿದ ನಡವಳಿಕೆಗಳು ಯಾವವು? ಅದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_summary_question$$, $$question2$$, 'ta', $$இந்த வீடியோக்களைப் பார்த்த பிறகு, உங்களிடம் இருக்கக்கூடாது என்று நீங்கள் நினைக்கும் பழக்கவழக்கங்கள்/நடத்தைகள் எவை?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_summary_question$$, $$question2$$, 'en', $$After watching these videos, which behaviors do you feel you should not have?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_summary_question$$, $$question3$$, 'kn', $$ನಿಮ್ಮ ಗೆಳೆಯೊರೊಂದಿಗೆ, ಈ ವಿಡಿಯೋಗಳಲ್ಲಿನ ನಿಮಗೆ ಪ್ರೇರಣೆ ನೀಡಿದ ಪಾತ್ರಗಳು ಮತ್ತು ನಿಮ್ಮ ನಿಜ ಜೀವನದಲ್ಲಿ ನಿಮಗೆ ಸ್ಪೂರ್ತಿ ನೀಡಿದ ವ್ಯಕ್ತಿಗಳಿಗೂ ಇರುವ ಹೋಲಿಕೆಗಳನ್ನು ಕುರಿತು ಚರ್ಚಿಸಿ. ಆ ಸಾರಾಂಶವನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_summary_question$$, $$question3$$, 'ta', $$உங்கள் நண்பர்களுடன், இந்த வீடியோவில் உங்களுக்கு ஊக்கமளித்த பாத்திரம் யார், மேலும் அது உங்கள் நிஜ வாழ்க்கையில் உங்களுக்கு ஊக்கமளிக்கும் நபர்களுக்கும் இடையிலான ஒற்றுமைகளைப் பற்றி விவாதிக்கவும்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$inspiration_summary_question$$, $$question3$$, 'en', $$Discuss with your friend about the similarities between the characters in the video and the people who inspire you in real life.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- ============================================================================
-- ABOUT_ME (9.2_About Me)
-- 19 main questions, 15 summary questions
-- ============================================================================

-- Main questions: base table updates (English) + translations (Kannada, Tamil)

UPDATE about_me_fields SET question_text = $$A. My Personal Space
1. In your family, with whom can you freely share your opinions and feelings without fear or hesitation? And why do you trust them so much?$$, help_text = $$Choose the family member you feel safest talking to.$$ WHERE field_key = 'question1';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question1$$, 'kn', $$A. ವೈಯಕ್ತಿಕ
1. ನಿಮ್ಮ ಕುಟುಂಬದಲ್ಲಿ ಯಾರೊಂದಿಗೆ ನೀವು ಭಯ/ಸಂಕೋಚವಿಲ್ಲದೆ ಮುಕ್ತವಾಗಿ ನಿಮ್ಮ ಅಭಿಪ್ರಾಯಗಳನ್ನು ಹಾಗೂ ಭಾವನೆಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಬಲ್ಲಿರಿ? ಮತ್ತು ಅವರೊಂದಿಗೆ ನಿಮಗೆ ಅಷ್ಟು ವಿಶ್ವಾಸವೇಕೆ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question1$$, 'ta', $$A. தனிப்பட்ட விவரங்கள்
1. உங்கள் குடும்பத்தில், பயம் அல்லது தயக்கம் இல்லாமல் உங்கள் கருத்துகளையும் உணர்வுகளையும் யாருடன் சுதந்திரமாகப் பகிர்ந்து கொள்ள முடியும்? அவர்கள் மீது உங்களுக்கு ஏன் அவ்வளவு நம்பிக்கை?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question1$$, 'kn', $$ನಿಮ್ಮ ಮನೆಯಲ್ಲಿ ಯಾರೊಂದಿಗೆ ನೀವು ಮುಕ್ತವಾಗಿ ಮಾತನಾಡಬಹುದು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question1$$, 'ta', $$நீங்கள் பாதுகாப்பாக பேச முடியும் என்ற குடும்ப உறுப்பினரை தேர்வு செய்யவும்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE about_me_fields SET question_text = $$2. Other than your family members, with whom can you freely share your opinions and feelings without fear or hesitation?$$, help_text = $$Think about someone outside your family whom you trust and feel comfortable talking to.$$ WHERE field_key = 'question2';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question2$$, 'kn', $$2. ನಿಮ್ಮ ಕುಟುಂಬದವರನ್ನು ಬಿಟ್ಟು ಬೇರೆ ಯಾರೊಂದಿಗೆ ನೀವು ಭಯ / ಸಂಕೋಚವಿಲ್ಲದೆ ಮುಕ್ತವಾಗಿ ನಿಮ್ಮ ಅಭಿಪ್ರಾಯಗಳನ್ನು ಹಾಗೂ ಭಾವನೆಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಬಲ್ಲಿರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question2$$, 'ta', $$2. உங்கள் குடும்பத்தினரைத் தவிர, பயம் அல்லது தயக்கம் இல்லாமல் உங்கள் கருத்துகளையும் உணர்வுகளையும் யாருடன் சுதந்திரமாக பகிர்ந்து கொள்ள முடியும்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question2$$, 'kn', $$ಮನೆಯವರ ಹೊರತು ಇನ್ನಾರು ನಿಮ್ಮ ಮಾತು ಕೇಳುತ್ತಾರೆ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question2$$, 'ta', $$உங்கள் குடும்பத்திற்கு வெளியே, நீங்கள் நம்பி நிம்மதியாக பேச முடியும் நபரை நினைத்துப் பதிலளிக்கவும்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE about_me_fields SET question_text = $$3. What are the tasks you do at home?
(e.g., helping in agricultural activities, bringing vegetables and groceries from the shop, money-related work, taking care of animals, filling water, etc.)$$, help_text = $$Think about the daily work you help with at home.$$ WHERE field_key = 'question3';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question3$$, 'kn', $$3. ಮನೆಯಲ್ಲಿ ನೀವು ಮಾಡುವ ಕೆಲಸಗಳು ಯಾವುವು? 
 (ಉದಾ: ಕೃಷಿ ಚಟುವಟಿಕೆಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡುವುದು, ಅಂಗಡಿಯಿಂದ ತರಕಾರಿ, ಕಿರಾಣಿ ಸಾಮಗ್ರಿಗಳನ್ನು ತರುವುದು, ದನ-ಕರುಗಳ, ಪ್ರಾಣಿಗಳ ಆರೈಕೆ, ನೀರು ತುಂಬಿಸುವುದು ಇತ್ಯಾದಿ)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question3$$, 'ta', $$3. வீட்டில் நீங்கள் செய்யும் வேலைகள் என்னென்ன?
(உதா: விவசாயப் பணிகளில் உதவுதல், கடையிலிருந்து காய்கறிகள் மற்றும் மளிகைப் பொருட்கள் வாங்கி வருதல், பணம் தொடர்பான வேலைகள், விலங்குகளை  பராமரித்தல், தண்ணீர் நிரப்புதல் போன்றவை)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question3$$, 'kn', $$ನೀವು ಮನೆಯಲ್ಲಿ ಮಾಡುವ ಕೆಲಸಗಳು ಯಾವುವು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question3$$, 'ta', $$வீட்டில் நீங்கள் தினமும் செய்யும்  வேலைகளை நினைத்து பதிலளிக்கவும்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE about_me_fields SET question_text = $$B. Activities You Enjoy (Answers to more than one question below can be the similar)
1.Activities you find most enjoyable and fulfilling:
a. During school hours        
b. After school hours (before school starts and after school ends)$$, help_text = $$Write the activities you enjoy doing during and after school.$$ WHERE field_key = 'question4';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question4$$, 'kn', $$B. ನೀವು ಸಂತೋಷದಿಂದ ಮಾಡುವ ಕೆಲಸಗಳು : (ಒಂದಕ್ಕಿಂತ ಹೆಚ್ಚು ಪ್ರಶ್ನೆಗಳಿಗೆ ನೀವು ನೀಡುವ ಉತ್ತರ ಒಂದೇ ಆಗಿರಬಹುದು)
 1. ನೀವು ಇಷ್ಟಪಟ್ಟು ಮಾಡುವ ಕೆಲಸಗಳು: 
 a. ಶಾಲಾ ಅವಧಿಯಲ್ಲಿ 
 b. ಶಾಲಾ ಅವಧಿಯ ನಂತರ (ಶಾಲಾ ಅವಧಿ ಪ್ರಾರಂಭವಾಗುವ ಮೊದಲು ಮತ್ತು ಶಾಲಾ ಅವಧಿ ಮುಗಿದ ನಂತರ)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question4$$, 'ta', $$B. நீங்கள் மகிழ்ச்சியுடன் செய்யும் வேலைகள்: (ஒன்றுக்கும் மேற்பட்ட கேள்விகளுக்கு உங்கள் பதில் ஒன்றாகவே இருக்கலாம்)
1. நீங்கள் விரும்பி செய்யும் வேலைகள்:
a. பள்ளி நேரத்தில்        
b. பள்ளி நேரத்திற்கு பிறகு (பள்ளி தொடங்குவதற்கு முன் மற்றும் பள்ளி முடிந்த பிறகு)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question4$$, 'kn', $$ಶಾಲೆಯಲ್ಲಿ ನಿಮಗೆ ಇಷ್ಟವಾಗುವ ವಿಷಯಗಳು ಅಥವಾ ಕೆಲಸಗಳು ಯಾವುವು? 
 ಶಾಲೆ ಮುಗಿದ ನಂತರ ಅಥವಾ ಶಾಲೆಗೆ ಮೊದಲು ನೀವು ಏನು ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತೀರಿ? 
ಎಂಬುದರ ಬಗ್ಗೆ ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question4$$, 'ta', $$பள்ளி நேரத்திலும் , பள்ளிக்குப் பிறகும் நீங்கள் விரும்பி செய்யும் செயல்களை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE about_me_fields SET question_text = $$What are the activities you like to do alone, independently?
(Tasks you do by yourself)$$, help_text = $$Think about activities you enjoy doing by yourself.$$ WHERE field_key = 'question5';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question5$$, 'kn', $$2. ನೀವೊಬ್ಬರೇ ಸ್ವತಂತ್ರವಾಗಿ ಮಾಡಲು ಇಷ್ಟಪಡುವ ಕೆಲಸಗಳು ಯಾವುವು? (ಪ್ರತ್ಯೇಕವಾಗಿ ಒಬ್ಬರೇ ನಿರ್ವಹಿಸುವ ಕಾರ್ಯಗಳು)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question5$$, 'ta', $$நீங்கள் சுயமாக செய்ய விரும்பும் வேலைகள் என்னென்ன?
(தனியாகவே செய்து முடிக்கும் பணிகள்)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question5$$, 'kn', $$ನೀವು ಒಬ್ಬರೇ ಏನು ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತೀರಿ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question5$$, 'ta', $$நீங்கள் தனியாக செய்து மகிழும் செயல்களை நினைத்து பதிலளிக்கவும்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE about_me_fields SET question_text = $$What activities do you like to do in a group or with your friends?$$, help_text = $$Think about activities you enjoy doing with friends.$$ WHERE field_key = 'question6';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question6$$, 'kn', $$3. ನೀವು ಗುಂಪಿನಲ್ಲಿ / ನಿಮ್ಮ ಸ್ನೇಹಿತರೊಂದಿಗೆ ಯಾವ ಕೆಲಸಗಳನ್ನು ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question6$$, 'ta', $$நீங்கள் குழுவாக அல்லது உங்கள் நண்பர்களுடன் செய்ய விரும்பும் செயல்கள் என்னென்ன?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question6$$, 'kn', $$ನಿಮ್ಮ ಸ್ನೇಹಿತರ ಜೊತೆ ನೀವು ಏನು ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತೀರಿ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question6$$, 'ta', $$நண்பர்களுடன் சேர்ந்து செய்ய விரும்பும் செயல்களை நினைத்து பதிலளிக்கவும்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE about_me_fields SET question_text = $$What activities do you find difficult at school? Write them.$$, help_text = $$Think about school activities that are hard for you.$$ WHERE field_key = 'question7';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question7$$, 'kn', $$C. ನಿಮಗೆ ಕಷ್ಟವೆನಿಸುವ ಕೆಲಸ/ಚಟುವಟಿಕೆಗಳು:
 1. ನಿಮಗೆ ಶಾಲೆಯಲ್ಲಿ ಕಷ್ಟವೆನಿಸುವ ಚಟುವಟಿಕೆಗಳು ಯಾವುವು? ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question7$$, 'ta', $$பள்ளியில் உங்களுக்கு கடினமாக தோன்றும் செயல்கள் என்னென்ன? எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question7$$, 'kn', $$ಶಾಲೆಯಲ್ಲಿ ನಿಮಗೆ ಕಷ್ಟವಾಗುವ ವಿಷಯಗಳು ಯಾವುವು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question7$$, 'ta', $$பள்ளியில் உங்களுக்கு கடினமாக இருக்கும் செயல்களை நினைத்து பதிலளிக்கவும்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE about_me_fields SET question_text = $$Apart from school work or activities, what other tasks do you find difficult?$$, help_text = $$Think about tasks outside school that you find difficult.$$ WHERE field_key = 'question8';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question8$$, 'kn', $$2. ಶಾಲೆಯ ಕೆಲಸ / ಚಟುವಟಿಕೆಗಳನ್ನು ಹೊರತುಪಡಿಸಿ ನಿಮಗೆ ಕಷ್ಟಕರವಾದ ಇನ್ನುಳಿದ ಕೆಲಸಗಳು ಯಾವವು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question8$$, 'ta', $$பள்ளி வேலைகள் / செயல்களைத் தவிர, உங்களுக்கு கடினமாக இருக்கும் மற்ற வேலைகள் என்னென்ன?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question8$$, 'kn', $$ಶಾಲೆಯ ಹೊರತುಪಡಿಸಿ ನಿಮಗೆ ಕಷ್ಟವಾಗುವ ಕೆಲಸಗಳು ಯಾವುವು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question8$$, 'ta', $$பள்ளிக்கு வெளியே உங்களுக்கு கடினமாக இருக்கும் வேலைகளை நினைத்து பதிலளிக்கவும்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE about_me_fields SET question_text = $$List the tasks that you don't like doing but have to do.$$, help_text = $$Write about the tasks you have to do even if you don't like them.$$ WHERE field_key = 'question9';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question9$$, 'kn', $$3. ನೀವು ಮಾಡಲು ಇಷ್ಟ ಪಡದ ಆದರೆ ಮಾಡಲೇಬೇಕಾದ ಕೆಲಸಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question9$$, 'ta', $$உங்களுக்குப் பிடிக்காத ஆனால் நீங்கள் செய்ய வேண்டிய வேலைகளைப் பட்டியலிடுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question9$$, 'kn', $$ನಿಮಗೆ ಇಷ್ಟವಿಲ್ಲದರೂ ಮಾಡಲೇಬೇಕಾದ ಕೆಲಸಗಳು ಯಾವುವು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question9$$, 'ta', $$நீங்கள் தனியாக செய்து மகிழும் செயல்களை நினைத்து பதிலளிக்கவும்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE about_me_fields SET question_text = $$List the activities that you get involved in naturally/effortlessly.$$, help_text = $$Write about the tasks that come easily to you.$$ WHERE field_key = 'question10';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question10$$, 'kn', $$4. ನೀವು ಮಾಡುವ ಕೆಲಸ/ಚಟುವಟಿಕೆಗಳಲ್ಲಿ, ಸಹಜವಾಗಿ ತೊಡಗಿಸಿಕೊಳ್ಳುವ ಕೆಲಸ/ಚಟುವಟಿಕೆಗಳನ್ನು ಪಟ್ಟಿಮಾಡಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question10$$, 'ta', $$நீங்கள் செய்யும் வேலைகளில், நீங்கள் இயல்பாகவே/ஈடுபாட்டுடன் செய்யும் செயல்களைப் பட்டியலிடுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question10$$, 'kn', $$ನೀವು ಸುಲಭವಾಗಿ ಮಾಡುವ ಕೆಲಸಗಳು ಯಾವುವು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question10$$, 'ta', $$நீங்கள் எளிதாகச் செய்யும் வேலைகளை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE about_me_fields SET question_text = $$D. Let's delve deeper into understanding more about you.
1. What qualities or aspects do you love & appreciate about yourself?$$, help_text = $$Write about the qualities you like in yourself.$$ WHERE field_key = 'question12';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question12$$, 'kn', $$D. ನಿಮ್ಮ ಬಗ್ಗೆ ಇನ್ನಷ್ಟು ವಿಚಾರಗಳನ್ನು ತಿಳಿಯಲು ಈ ಕೆಳಗಿನ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ.
 1. ನಿಮ್ಮ ಬಗ್ಗೆ ನೀವೆ ಹೆಮ್ಮೆಪಟ್ಟುಕೊಳ್ಳುವ, ನಿಮ್ಮಲ್ಲಿನ ಗುಣಗಳು ಯಾವವು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question12$$, 'ta', $$D. உங்களைப் பற்றி மேலும் அறிய பின்வரும் கேள்விகளு
க்குப் பதிலளிக்கவும்.
1. உங்களைப் பற்றி நீங்களே பெருமைப்படும் குணங்கள் எவை?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question12$$, 'kn', $$ನಿಮ್ಮಲ್ಲಿ ನಿಮಗೆ ಇಷ್ಟವಾಗುವ ಗುಣಗಳು ಯಾವುವು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question12$$, 'ta', $$உங்களிடம் உங்களுக்குப் பிடித்த குணங்களைப் பற்றி எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE about_me_fields SET question_text = $$2. Which of your qualities do you think these people (parents, teachers, friends, etc.) like?$$, help_text = $$Write about the qualities that others like in you.$$ WHERE field_key = 'question13';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question13$$, 'kn', $$2. ಇತರರು (ಪಾಲಕರು, ಶಿಕ್ಷಕರು, ಸ್ನೇಹಿತರು ಇತ್ಯಾದಿ) ನಿಮ್ಮ ಯಾವ ಗುಣಗಳನ್ನು ಇಷ್ಟಪಡುತ್ತಾರೆ ಎಂದು ಭಾವಿಸುತ್ತೀರಿ? ಪಟ್ಟಿ ಮಾಡಿ. (ಪೋಷಕರು, ಶಿಕ್ಷಕರು, ಸ್ನೇಹಿತರನ್ನು ಕೇಳಿ ಪರಿಶೀಲಿಸಿಕೊಳ್ಳಿ)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question13$$, 'ta', $$2. மற்றவர்கள் (பெற்றோர், ஆசிரியர்கள், நண்பர்கள் போன்றவை) உங்கள் எந்த குணங்களை விரும்புகிறார்கள் என்று நினைக்கிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question13$$, 'kn', $$ಇತರರು ನಿಮ್ಮಲ್ಲಿ ಇಷ್ಟಪಡುವ ಗುಣಗಳು ಯಾವುವು? ಅದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question13$$, 'ta', $$மற்றவர்கள் உங்களிடம் விரும்பும் குணங்கள் எவை என்று எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE about_me_fields SET question_text = $$3. Which habit or behaviour of yours do you want to improve or change?$$, help_text = $$Is there any habit or behaviour you want to change or improve?$$ WHERE field_key = 'question14';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question14$$, 'kn', $$3. ನಿಮ್ಮಲ್ಲಿನ ಯಾವ ಸ್ವಭಾವವನ್ನು ಸುಧಾರಣೆ / ಬದಲಾವಣೆ ಮಾಡಿಕೊಳ್ಳಲು ನೀವು ಬಯಸುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question14$$, 'ta', $$3. உங்களிடம் உள்ள எந்த சுபாவத்தை/பண்பை மேம்படுத்த அல்லது மாற்ற விரும்புகிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question14$$, 'kn', $$ನಿಮ್ಮಲ್ಲಿ ನೀವು ಬದಲಾಯಿಸಿಕೊಳ್ಳಲು ಬಯಸುವ ಗುಣ ಯಾವುದು? ಅದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question14$$, 'ta', $$நீங்கள் மாற்ற அல்லது மேம்படுத்த விரும்பும் பழக்கம் அல்லது நடத்தை ஏதாவது உள்ளதா?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE about_me_fields SET question_text = $$4. Which of your qualities or behaviors do others suggest you should correct or change?$$, help_text = $$Write about the quality that others tell you to change or improve.$$ WHERE field_key = 'question15';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question15$$, 'kn', $$4. ನಿಮ್ಮ ಯಾವ ಗುಣ /ಸ್ವಭಾವವನ್ನು ತಿದ್ದಿಕೊಳ್ಳಬೇಕು ಎಂದು ಇತರರು ಬಯಸುತ್ತಾರೆ ಅಥವಾ ಸಲಹೆ ನೀಡುತ್ತಾರೆ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question15$$, 'ta', $$4. உங்கள் எந்த குணம் அல்லது சுபாவத்தை மாற்றிக்கொள்ள வேண்டும் என்று மற்றவர்கள் விரும்புகிறார்கள் அல்லது ஆலோசனை கூறுகிறார்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question15$$, 'kn', $$ನಿಮ್ಮಲ್ಲಿ ಯಾವ ಗುಣವನ್ನು ಬದಲಾಯಿಸು ಎಂದು ಇತರರು ಹೇಳುತ್ತಾರೆ? ಅದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question15$$, 'ta', $$உங்கள் எந்த குணத்தை மாற்றிக்கொள்ள வேண்டும் என்று மற்றவர்கள் சொல்கிறார்கள் என்பதை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE about_me_fields SET question_text = $$5. If you had a chance to become something or someone in the future, what/who would you like to become?$$, help_text = $$Write about what you want to become in the future.$$ WHERE field_key = 'question16';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question16$$, 'kn', $$5. ಜೀವನದಲ್ಲಿ ನಿಮಗೆ ಏನಾದರೂ / ಯಾರಾದರೂ ಆಗುವ ಅವಕಾಶ ಇದ್ದರೆ, ನೀವು ಏನಾಗಲು / ಯಾರಾಗಲು ಬಯಸುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question16$$, 'ta', $$5. வாழ்க்கையில் உங்களுக்கு ஏதேனும் அல்லது யாராவது ஆகும் வாய்ப்பு கிடைத்தால், நீங்கள் என்னவாக/யாராக விரும்புகிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question16$$, 'kn', $$ಭವಿಷ್ಯದಲ್ಲಿ ನೀವು ಏನಾಗಲು ಬಯಸುತ್ತೀರಿ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question16$$, 'ta', $$எதிர்காலத்தில் நீங்கள் என்னவாக விரும்புகிறீர்கள் என்பதை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE about_me_fields SET question_text = $$6. Reflect on a time when you felt proud of yourself. Which of your actions earned you appreciation? How did you achieve it?$$, help_text = $$Write about the work or action for which you received appreciation.$$ WHERE field_key = 'question17';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question17$$, 'kn', $$6. ನಿಮ್ಮ ಬಗ್ಗೆ ನೀವು ಹೆಮ್ಮೆ ಪಟ್ಟುಕೊಂಡ ಸಂದರ್ಭವನ್ನು ಮೆಲುಕುಹಾಕಿ. ನಿಮ್ಮ ಯಾವ ಕೆಲಸದಿಂದ ನಿಮಗೆ ಮೆಚ್ಚುಗೆ ದೊರೆಯಿತು? ಅದನ್ನು ಹೇಗೆ ಸಾಧಿಸಿದಿರಿ? ಸಂಕ್ಷಿಪ್ತವಾಗಿ ವಿವರಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question17$$, 'ta', $$6. உங்களைப் பற்றி நீங்கள் பெருமைப்பட்ட ஒரு தருணத்தை நினைவுகூருங்கள். உங்கள் எந்தச் செயலால் உங்களுக்கு பாராட்டு கிடைத்தது? அதை எப்படிச் சாதித்தீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question17$$, 'kn', $$ನೀವು ಮಾಡಿದ ಯಾವ ಕೆಲಸಕ್ಕೆ ನಿಮಗೆ ಮೆಚ್ಚುಗೆ ಸಿಕ್ಕಿತು? ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question17$$, 'ta', $$எந்த வேலை அல்லது செயலில் உங்களுக்கு பாராட்டு கிடைத்தது?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE about_me_fields SET question_text = $$7. Think about a difficult or challenging situation you faced recently.
How did you face it or overcome it?
What lesson did you learn from it?$$, help_text = $$Write about a recent difficult event and how you handled it.$$ WHERE field_key = 'question18';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question18$$, 'kn', $$7. ನೀವು ಇತ್ತೀಚೆಗೆ ಎದುರಿಸಿದ ಕಠೀಣ/ಕಷ್ಟಕರ ಸನ್ನಿವೇಶದ ಬಗ್ಗೆ ಯೋಚಿಸಿ. ಅದನ್ನು ನೀವು ಹೇಗೆ ಎದುರಿಸಿದಿರಿ ಅಥವಾ ಅದರಿಂದ ಹೇಗೆ ಪಾರಾದಿರಿ? ಅದರಿಂದ ಕಲಿತ ಪಾಠವೇನು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question18$$, 'ta', $$7. சமீபத்தில் நீங்கள் எதிர்கொண்ட ஒரு கடினமான சூழ்நிலையைப் பற்றி யோசியுங்கள். அதை எப்படி எதிர்கொண்டீர்கள் அல்லது அதிலிருந்து எப்படி மீண்டீர்கள்? அதிலிருந்து நீங்கள் கற்றுக்கொண்ட பாடம் என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question18$$, 'kn', $$ಇತ್ತೀಚೆಗೆ ನಿಮಗೆ ಕಷ್ಟವಾದ ಒಂದು ಘಟನೆ ಯಾವುದು? ಅದನ್ನು ನೀವು ಹೇಗೆ ಎದುರಿಸಿದಿರಿ? ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question18$$, 'ta', $$சமீபத்தில் உங்களுக்குக் கடினமாக இருந்த ஒரு நிகழ்வு எது? அதை எப்படி எதிர்கொண்டீர்கள் என்று எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE about_me_fields SET question_text = $$8. Recall a situation where others misunderstood you. How did you handle that situation and what did you learn from it?$$, help_text = $$Was there a time when someone thought wrongly about you? Write about how you corrected it.$$ WHERE field_key = 'question19';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question19$$, 'kn', $$8. ಇತರರು ನಿಮ್ಮನ್ನು ತಪ್ಪಾಗಿ ತಿಳಿದ (ನಿಮ್ಮ ಬಗ್ಗೆ ತಪ್ಪು ಕಲ್ಪನೆ ಹೊಂದಿದ) ಸಂದರ್ಭವನ್ನು ನೆನಪಿಸಿಕೊಳ್ಳಿ. ನೀವು ಆ ಪರಿಸ್ಥಿತಿಯನ್ನು ಹೇಗೆ ನಿರ್ವಹಿಸಿದಿರಿ ಮತ್ತು ಅದರಿಂದ ನೀವು ಏನು ಕಲಿತಿರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_question$$, $$question19$$, 'ta', $$8. மற்றவர்கள் உங்களைத் தவறாகப் புரிந்துகொண்ட ஒரு தருணத்தை நினைவுகூருங்கள். அந்தச் சூழ்நிலையை நீங்கள் எப்படி கையாண்டீர்கள், அதிலிருந்து என்ன கற்றுக்கொண்டீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question19$$, 'kn', $$ಯಾರಾದರೂ ನಿಮ್ಮ ಬಗ್ಗೆ ತಪ್ಪಾಗಿ ಯೋಚಿಸಿದ ಸಂದರ್ಭವಿದೆಯೇ? ನೀವು ಅದನ್ನು ಹೇಗೆ ಸರಿಪಡಿಸಿದಿರಿ? ಎಂಬುದರ ಬಗ್ಗೆ ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_help$$, $$question19$$, 'ta', $$யாராவது உங்களைப் பற்றித் தவறாக நினைத்த சந்தர்ப்பம் உண்டா? அதை எப்படிச் சரி செய்தீர்கள் என்பதைப் பற்றி எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- Summary questions (assessment_summary_templates JSONB)

UPDATE assessment_summary_templates
SET summary_questions = jsonb_build_object(
  'en', '{"question1":"The friend in my family","question2":"My family outside of my family","question3":"Activities I am doing at home","question4":"Activities I enjoy during the school hours","question5":"Activities I enjoy outside the school","question6":"Work/activities I enjoy personally","question7":"Work/activities I enjoy as a team","question8":"Activity that needs to be done in the school but I find difficult","question9":"Activity that I find difficult to do after school hours","question10":"Activities I must do","question11":"Activities that come naturally to me","question12":"Activities that don''t come naturally to me","question13":"Qualities I like in myself","question14":"Qualities that others like in me","question15":"Qualities that I need to improve on"}'::jsonb,
  'kn', '{"question1":"ನನ್ನ ಕುಟುಂಬದಲ್ಲಿ ನನ್ನ ಸ್ನೇಹಿತ","question2":"ಕುಟುಂಬ ಬಿಟ್ಟು ಹೊರಗಿನ ನನ್ನ ಸ್ನೇಹಿತ","question3":"ನಾನು ಮನೆಯಲ್ಲಿ ಯಾವ ಕೆಲಸಗಳನ್ನು ಮಾಡುತ್ತಿದ್ದೇನೆ?","question4":"ಶಾಲೆಯ ಸಮಯದಲ್ಲಿ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆ/ಅಂಶಗಳು","question5":"ಶಾಲೆಯ ಹೊರಗೆ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆ/ಅಂಶಗಳು","question6":"ವೈಯಕ್ತಿಕವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸ / ಚಟುವಟಿಕೆಗಳು","question7":"ತಂಡವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸ / ಚಟುವಟಿಕೆಗಳು","question8":"ಶಾಲಾವಧಿಯಲ್ಲಿ ಮಾಡಬೇಕಾದ, ಆದರೆ ನನಗೆ ಕಷ್ಟವೆನಿಸುವ ಚಟುವಟಿಕೆ","question9":"ಶಾಲಾವಧಿಯ ನಂತರ, ಶಾಲೆಯ ಆಚೆ ನನಗೆ ನಿರ್ವಹಿಸಲು ಕಷ್ಟವೆನಿಸುವ ಚಟುವಟಿಕೆ","question10":"ನಾನು ಮಾಡಲೇಬೇಕಾದ ಚಟುವಟಿಕೆಗಳು","question11":"ನಾನು ಸಹಜವಾಗಿ ಮಾಡಬಹುದಾದ ಚಟುವಟಿಕೆಗಳು","question12":"ನನಗೆ ಸಹಜವಾಗಿ ಮಾಡಲು ಬಾರದಿರುವ ಚಟುವಟಿಕೆಗಳು","question13":"ನನ್ನಲ್ಲಿರುವ, ನಾನು ಇಷ್ಟಪಡುವ ಗುಣಗಳು","question14":"ಇತರರು ನನ್ನಲ್ಲಿ ಇಷ್ಟಪಡುವ ಗುಣಗಳು","question15":"ನಾನು ಸುಧಾರಿಸಿಕೊಳ್ಳಬೇಕಾದ ಗುಣ/ ಅಂಶಗಳು"}'::jsonb,
  'ta', '{"question1":"என் குடும்பத்தில் உள்ள எனது நண்பர்","question2":"குடும்பத்திற்கு வெளியே உள்ள நண்பர்","question3":"நான் வீட்டில் செய்யும் வேலைகள்","question4":"பள்ளி நேரத்தில் நான் ரசிக்கும் விஷயங்கள்","question5":"பள்ளிக்கு வெளியே நான் ரசிக்கும் விஷயங்கள்","question6":"நான் தனியாக ரசித்துச் செய்யும் செயல்கள்","question7":"நான் குழுவாக ரசித்துச் செய்யும் செயல்கள்","question8":"பள்ளியில் எனக்குக் கடினமாகத் தோன்றும் செயல்கள்","question9":"பள்ளிக்கு வெளியே எனக்குக் கடினமாகத் தோன்றும் வேலைகள்","question10":"நான் கட்டாயம் செய்ய வேண்டிய வேலைகள்","question11":"நான் இயல்பாகச் செய்யும் செயல்கள்","question12":"எனக்கு எளிதாக வராத செயல்கள்","question13":"என்னிடத்தில் எனக்குப் பிடித்த குணங்கள்","question14":"மற்றவர்கள் என்னிடம் விரும்பும் குணங்கள்","question15":"நான் மேம்படுத்த வேண்டிய விஷயங்கள்"}'::jsonb
),
    updated_at = NOW()
WHERE assessment_type = 'about_me';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question1$$, 'kn', $$ನನ್ನ ಕುಟುಂಬದಲ್ಲಿ ನನ್ನ ಸ್ನೇಹಿತ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question1$$, 'ta', $$என் குடும்பத்தில் உள்ள எனது நண்பர்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question1$$, 'en', $$The friend in my family$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question2$$, 'kn', $$ಕುಟುಂಬ ಬಿಟ್ಟು ಹೊರಗಿನ ನನ್ನ ಸ್ನೇಹಿತ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question2$$, 'ta', $$குடும்பத்திற்கு வெளியே உள்ள நண்பர்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question2$$, 'en', $$My family outside of my family$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question3$$, 'kn', $$ನಾನು ಮನೆಯಲ್ಲಿ ಯಾವ ಕೆಲಸಗಳನ್ನು ಮಾಡುತ್ತಿದ್ದೇನೆ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question3$$, 'ta', $$நான் வீட்டில் செய்யும் வேலைகள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question3$$, 'en', $$Activities I am doing at home$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question4$$, 'kn', $$ಶಾಲೆಯ ಸಮಯದಲ್ಲಿ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆ/ಅಂಶಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question4$$, 'ta', $$பள்ளி நேரத்தில் நான் ரசிக்கும் விஷயங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question4$$, 'en', $$Activities I enjoy during the school hours$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question5$$, 'kn', $$ಶಾಲೆಯ ಹೊರಗೆ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆ/ಅಂಶಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question5$$, 'ta', $$பள்ளிக்கு வெளியே நான் ரசிக்கும் விஷயங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question5$$, 'en', $$Activities I enjoy outside the school$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question6$$, 'kn', $$ವೈಯಕ್ತಿಕವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸ / ಚಟುವಟಿಕೆಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question6$$, 'ta', $$நான் தனியாக ரசித்துச் செய்யும் செயல்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question6$$, 'en', $$Work/activities I enjoy personally$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question7$$, 'kn', $$ತಂಡವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸ / ಚಟುವಟಿಕೆಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question7$$, 'ta', $$நான் குழுவாக ரசித்துச் செய்யும் செயல்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question7$$, 'en', $$Work/activities I enjoy as a team$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question8$$, 'kn', $$ಶಾಲಾವಧಿಯಲ್ಲಿ ಮಾಡಬೇಕಾದ, ಆದರೆ ನನಗೆ ಕಷ್ಟವೆನಿಸುವ ಚಟುವಟಿಕೆ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question8$$, 'ta', $$பள்ளியில் எனக்குக் கடினமாகத் தோன்றும் செயல்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question8$$, 'en', $$Activity that needs to be done in the school but I find difficult$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question9$$, 'kn', $$ಶಾಲಾವಧಿಯ ನಂತರ, ಶಾಲೆಯ ಆಚೆ ನನಗೆ ನಿರ್ವಹಿಸಲು ಕಷ್ಟವೆನಿಸುವ ಚಟುವಟಿಕೆ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question9$$, 'ta', $$பள்ளிக்கு வெளியே எனக்குக் கடினமாகத் தோன்றும் வேலைகள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question9$$, 'en', $$Activity that I find difficult to do after school hours$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question10$$, 'kn', $$ನಾನು ಮಾಡಲೇಬೇಕಾದ ಚಟುವಟಿಕೆಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question10$$, 'ta', $$நான் கட்டாயம் செய்ய வேண்டிய வேலைகள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question10$$, 'en', $$Activities I must do$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question11$$, 'kn', $$ನಾನು ಸಹಜವಾಗಿ ಮಾಡಬಹುದಾದ ಚಟುವಟಿಕೆಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question11$$, 'ta', $$நான் இயல்பாகச் செய்யும் செயல்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question11$$, 'en', $$Activities that come naturally to me$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question12$$, 'kn', $$ನನಗೆ ಸಹಜವಾಗಿ ಮಾಡಲು ಬಾರದಿರುವ ಚಟುವಟಿಕೆಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question12$$, 'ta', $$எனக்கு எளிதாக வராத செயல்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question12$$, 'en', $$Activities that don't come naturally to me$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question13$$, 'kn', $$ನನ್ನಲ್ಲಿರುವ, ನಾನು ಇಷ್ಟಪಡುವ ಗುಣಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question13$$, 'ta', $$என்னிடத்தில் எனக்குப் பிடித்த குணங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question13$$, 'en', $$Qualities I like in myself$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question14$$, 'kn', $$ಇತರರು ನನ್ನಲ್ಲಿ ಇಷ್ಟಪಡುವ ಗುಣಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question14$$, 'ta', $$மற்றவர்கள் என்னிடம் விரும்பும் குணங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question14$$, 'en', $$Qualities that others like in me$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question15$$, 'kn', $$ನಾನು ಸುಧಾರಿಸಿಕೊಳ್ಳಬೇಕಾದ ಗುಣ/ ಅಂಶಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question15$$, 'ta', $$நான் மேம்படுத்த வேண்டிய விஷயங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$about_me_summary_question$$, $$question15$$, 'en', $$Qualities that I need to improve on$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- ============================================================================
-- DREAMS (9.3_My Dreams)
-- 18 main questions, 3 summary questions
-- ============================================================================

-- Main questions: base table updates (English) + translations (Kannada, Tamil)

UPDATE dreams_questions SET question_text = $$What are your dreams about your future?$$, help_text = $$What do you want to become in the future?$$ WHERE sequence_number = 1;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question1$$, 'kn', $$ನಿಮ್ಮ ಭವಿಷ್ಯದ ಬಗ್ಗೆ ನಿಮ್ಮ ಕನಸುಗಳು ಏನು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question1$$, 'ta', $$உங்கள் எதிர்காலத்தைப் பற்றி உங்கள் கனவு என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question1$$, 'kn', $$ಭವಿಷ್ಯದಲ್ಲಿ ನೀವು ಏನಾಗಲು ಬಯಸುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question1$$, 'ta', $$நீங்கள் எதிர்காலத்தில் என்ன ஆக விரும்புகிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE dreams_questions SET question_text = $$What are your academic goals and what would you like to achieve in your studies?$$, help_text = $$Which degree do you want to study?$$ WHERE sequence_number = 2;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question2$$, 'kn', $$ನೀವು ಪಡೆಯಲು ಬಯಸುವ ಶಿಕ್ಷಣ/ಶೈಕ್ಷಣಿಕ ಪದವಿ ಯಾವುದು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question2$$, 'ta', $$நீங்கள் எந்த கல்விப் பட்டப்படிப்பை படிக்க விரும்புகிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question2$$, 'kn', $$ನೀವು ಯಾವ ಪದವಿ ವ್ಯಾಸಂಗ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question2$$, 'ta', $$நீங்கள் படிக்க விரும்பும் பட்டப்படிப்பு என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE dreams_questions SET question_text = $$Which profession do you dream of pursuing?$$, help_text = $$What job do you want to do?$$ WHERE sequence_number = 3;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question3$$, 'kn', $$ನೀವು ಯಾವ ವೃತ್ತಿಯನ್ನು ಮಾಡುವ ಕನಸು ಕಾಣುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question3$$, 'ta', $$நீங்கள் எந்த தொழிலை செய்ய கனவு காண்கிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question3$$, 'kn', $$ನೀವು ಯಾವ ಕೆಲಸ (ಉದ್ಯೋಗ) ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question3$$, 'ta', $$நீங்கள் செய்ய விரும்பும் வேலை என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE dreams_questions SET question_text = $$Which sport do you want to play professionally?$$, help_text = $$Which sport do you like most?$$ WHERE sequence_number = 4;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question4$$, 'kn', $$ನೀವು ವೃತ್ತಿಪರವಾಗಿ ಆಡಲು ಬಯಸುವ ಕ್ರೀಡೆ ಯಾವುದು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question4$$, 'ta', $$நீங்கள் தொழில்முறையாக விளையாட விரும்பும் விளையாட்டு எது?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question4$$, 'kn', $$ನಿಮಗೆ ಅತಿ ಹೆಚ್ಚು ಇಷ್ಟವಾದ ಕ್ರೀಡೆ ಯಾವುದು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question4$$, 'ta', $$நீங்கள் எந்த விளையாட்டில் ஆர்வம் உள்ளவர்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE dreams_questions SET question_text = $$If you could be a writer, which field would you choose?$$, help_text = $$Story, poem, novel, article, etc.$$ WHERE sequence_number = 5;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question5$$, 'kn', $$ನೀವು ಬರಹಗಾರರಾಗಲು ಸಾಧ್ಯವಾದರೆ, ಯಾವ ಕ್ಷೇತ್ರದಲ್ಲಿ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question5$$, 'ta', $$நீங்கள் ஒரு எழுத்தாளராகும் வாய்ப்பு கிடைத்தால், எந்தத் துறையைத் தேர்ந்தெடுப்பீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question5$$, 'kn', $$ಕಥೆ, ಕವನ, ಕಾದಂಬರಿ, ಲೇಖನ, ಇತ್ಯಾದಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question5$$, 'ta', $$கதை, கவிதை, நாவல், கட்டுரை போன்றவை.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE dreams_questions SET question_text = $$Which branch of music do you prefer? (Singing / Instrument)$$, help_text = $$Write "Singing" or name of instrument.$$ WHERE sequence_number = 6;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question6$$, 'kn', $$ಸಂಗೀತ ಕ್ಷೇತ್ರದಲ್ಲಿ ನೀವು ಬಯಸುವ ವಿಭಾಗ? (ಹಾಡುಗಾರಿಕೆ / ಯಾವುದೇ ವಾದ್ಯ)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question6$$, 'ta', $$இசைத்துறையில் நீங்கள் எதை விரும்புகிறீர்கள்? (பாடல் / இசைக்கருவி)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question6$$, 'kn', $$ಹಾಡುಗಾರಿಕೆ ಅಥವಾ ವಾದ್ಯದ ಹೆಸರನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question6$$, 'ta', $$பாடுதல் அல்லது இசைக்கருவியின் பெயரை எழுதுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE dreams_questions SET question_text = $$The college that you want to choose.$$, help_text = $$Write college name or place.$$ WHERE sequence_number = 7;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question7$$, 'kn', $$ನೀವು ಆಯ್ಕೆ ಮಾಡಿಕೊಳ್ಳಲು ಬಯಸುವ ಕಾಲೇಜು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question7$$, 'ta', $$நீங்கள் தேர்வு செய்ய விரும்பும் கல்லூரி எது?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question7$$, 'kn', $$ಕಾಲೇಜಿನ ಹೆಸರು ಅಥವಾ ಸ್ಥಳವನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question7$$, 'ta', $$தெரிந்தால் கல்லூரி பெயரை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE dreams_questions SET question_text = $$If you want to serve others, whom or what will you serve?$$, help_text = $$People, poor, society, country, animals.$$ WHERE sequence_number = 8;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question8$$, 'kn', $$ನೀವು ಜಗತ್ತಿನಲ್ಲಿ ಯಾರಿಗಾದರೂ ಅಥವಾ ಯಾವುದಕ್ಕಾದರೂ ಸೇವೆ ಮಾಡಲು ನಿಮ್ಮ ಬದುಕು ಮೀಸಲಿಡುವುದಾದರೆ, ನಿಮ್ಮ ಆಯ್ಕೆ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question8$$, 'ta', $$நீங்கள் சேவை செய்ய விரும்பினால் யாருக்கு அல்லது எதற்கு செய்வீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question8$$, 'kn', $$ಜನರು, ಬಡವರು, ಸಮಾಜ, ದೇಶ, ಪ್ರಾಣಿಗಳು- ಇತ್ಯಾದಿ.. ಯಾವುದು ಎಂಬುದನ್ನು ತಿಳಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question8$$, 'ta', $$மக்கள், ஏழைகள், நாடு, விலங்குகள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE dreams_questions SET question_text = $$If you could live anywhere in the world, where would it be?$$, help_text = $$Write country or city name.$$ WHERE sequence_number = 9;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question9$$, 'kn', $$ಪ್ರಪಂಚದ ಬೇರೊಂದು ಸ್ಥಳದಲ್ಲಿ ನಿಮಗೆ ವಾಸ್ತವ್ಯ ಹೂಡಲು ಅವಕಾಶ ಸಿಕ್ಕರೆ, ಅದು ಎಲ್ಲಿ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question9$$, 'ta', $$உலகில் எங்கு வேண்டுமானாலும்  வாழ வாய்ப்பு கிடைத்தால், எங்கு வாழ விரும்புவீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question9$$, 'kn', $$ದೇಶ ಅಥವಾ ನಗರದ ಹೆಸರನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question9$$, 'ta', $$நாடு அல்லது நகரத்தின் பெயரை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE dreams_questions SET question_text = $$If you could be an artist, what kind of art would you pursue?$$, help_text = $$Drawing, painting, dance, etc.$$ WHERE sequence_number = 10;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question10$$, 'kn', $$ನೀವು ಕಲಾವಿದರಾಗಲು ಸಾಧ್ಯವಾದರೆ, ನೀವು ಬಯಸುವ ಕಲೆ ಯಾವುದು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question10$$, 'ta', $$நீங்கள் கலைஞராக இருந்தால் எந்த வகை கலையை தேர்வு செய்வீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question10$$, 'kn', $$ಚಿತ್ರಕಲೆ, ಪೇಂಟಿಂಗ್, ನೃತ್ಯ, ಇತ್ಯಾದಿ.. ಯಾವುದು ಎಂಬುದನ್ನು ತಿಳಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question10$$, 'ta', $$ஓவியம், நடனம் போன்றவற்றை எழுதுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE dreams_questions SET question_text = $$Do you like travelling? If so, what do you like the most about travelling?$$, help_text = $$Places, nature, food, culture.$$ WHERE sequence_number = 11;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question11$$, 'kn', $$ನೀವು ಪ್ರಯಾಣ/ಪ್ರವಾಸ ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತೀರಾ? ಪ್ರಯಾಣದ ಯಾವ ಅಂಶ/ಸಂಗತಿಗಳು ನಿಮ್ಮನ್ನು ಹೆಚ್ಚು ಆಕರ್ಷಿಸುತ್ತದೆ? ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question11$$, 'ta', $$பயணத்தில் எந்த விஷயங்கள் உங்களை மிகவும் ஈர்க்கின்றன?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question11$$, 'kn', $$ಸ್ಥಳಗಳು, ಪ್ರಕೃತಿ, ಆಹಾರ, ಸಂಸ್ಕೃತಿ.ಇತ್ಯಾದಿ.. ಯಾವುದು ಎಂಬುದನ್ನು ತಿಳಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question11$$, 'ta', $$இடங்கள், இயற்கை, உணவு என்று எழுதலாம்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE dreams_questions SET question_text = $$If you could learn from a professional for one day, who would it be and why?$$, help_text = $$Teacher, doctor, scientist, leader.$$ WHERE sequence_number = 12;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question12$$, 'kn', $$ನೀವು ಒಂದು ದಿನ ಒಬ್ಬ ವೃತ್ತಿಪರ/ಉದ್ಯೋಗಿಯನ್ನು ಗಮನಿಸಿ ಕಲಿಯಲು ಸಾಧ್ಯವಾದರೆ, ಅದು ಯಾರು ಮತ್ತು ಏಕೆ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question12$$, 'ta', $$ஒரு நாள் ஒரு தொழில்முறை நபரிடமிருந்து கற்றுக்கொள்ள வாய்ப்பு கிடைத்தால், அவர் யார்? ஏன்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question12$$, 'kn', $$ಶಿಕ್ಷಕ, ವೈದ್ಯ, ವಿಜ್ಞಾನಿ, ನಾಯಕ ಇತ್ಯಾದಿ.. ಯಾವುದು ಎಂಬುದನ್ನು ತಿಳಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question12$$, 'ta', $$ஆசிரியர், மருத்துவர், பொறியாளர், விஞ்ஞானி.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE dreams_questions SET question_text = $$Do you want to make your dreams come true?$$, help_text = $$Write Yes or No.$$ WHERE sequence_number = 13;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question13$$, 'kn', $$ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ನನಸಾಗಿಸಲು ನೀವು ಬಯಸುವಿರಾ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question13$$, 'ta', $$உங்கள் கனவுகளை நிஜமாக்க விரும்புகிறீர்களா?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question13$$, 'kn', $$ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question13$$, 'ta', $$ஆம் அல்லது இல்லை என்று எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE dreams_questions SET question_text = $$What are the things needed to make your dreams come true? (Explain how you will make any one of your dreams come true)$$, help_text = $$Mention what you need, such as hard work, time, support, practice, etc.$$ WHERE sequence_number = 14;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question14$$, 'kn', $$ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ನನಸಾಗಿಸಲು ಏನೆಲ್ಲಾ ಅವಶ್ಯಕತೆಗಳಿವೆ? (ನಿಮ್ಮ ಯಾವುದಾದರೂ ಒಂದು ಕನಸು, ನನಸಾಗಿಸುವುದು ಹೇಗೆ ತಿಳಿಸಿ)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question14$$, 'ta', $$உங்கள் கனவுகளை நனவாக்க என்னென்ன தேவை? (உங்களது ஏதேனும் ஒரு கனவை எப்படி நனவாக்குவீர்கள் என்று கூறுங்கள்)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question14$$, 'kn', $$ಕಠಿಣ ಪರಿಶ್ರಮ, ಸಮಯ, ಬೆಂಬಲ, ಅಭ್ಯಾಸ-  ಇತ್ಯಾದಿ.. ಯಾವುದು ಎಂಬುದನ್ನು ತಿಳಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question14$$, 'ta', $$கடின உழைப்பு, நேரம், ஆதரவு, பயிற்சி போன்றவற்றில் உங்களுக்கு எது தேவை என்பதைக் குறிப்பிடுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE dreams_questions SET question_text = $$What is the first step toward making your aspirations or dreams come true?$$, help_text = $$Study well, practice daily.$$ WHERE sequence_number = 15;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question15$$, 'kn', $$ನಿಮ್ಮ ಆಕಾಂಕ್ಷೆಗಳು ಅಥವಾ ಕನಸುಗಳನ್ನು ನನಸಾಗಿಸಲು ಮೊದಲ ಹೆಜ್ಜೆ ಯಾವುದು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question15$$, 'ta', $$உங்கள் லட்சியங்கள் அல்லது கனவுகளை நனவாக்க நீங்கள் எடுக்கும் முதல் படி என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question15$$, 'kn', $$ಚೆನ್ನಾಗಿ ಓದುವುದು, ಪ್ರತಿದಿನ ಅಭ್ಯಾಸ ಮಾಡುವುದು.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question15$$, 'ta', $$நன்றாக படித்தல், பயிற்சி செய்தல்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE dreams_questions SET question_text = $$Do you have the determination and enthusiasm to achieve your dreams?$$, help_text = $$Answer honestly.$$ WHERE sequence_number = 16;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question16$$, 'kn', $$ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ಸಾಧಿಸುವ ಛಲ ಮತ್ತು ಉತ್ಸಾಹವನ್ನು ನೀವು ಹೊಂದಿದ್ದೀರಾ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question16$$, 'ta', $$உங்கள் கனவுகளை அடைய தேவையான உறுதியும் உற்சாகமும் உங்களிடம் இருக்கிறதா?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question16$$, 'kn', $$ಪ್ರಾಮಾಣಿಕವಾಗಿ ಉತ್ತರಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question16$$, 'ta', $$நேர்மையாக பதில் எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE dreams_questions SET question_text = $$Are there any obstacles to achieving your dreams? If yes, what are they?$$, help_text = $$Money, fear, marks, family issues.$$ WHERE sequence_number = 17;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question17$$, 'kn', $$ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ಸಾಧಿಸಲು ಅಡೆತಡೆಗಳೇನಾದರೂ ಇದೆಯೇ? ಇದ್ದರೆ ಅವುಗಳು ಯಾವವು? ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question17$$, 'ta', $$உங்கள் கனவுகளை அடைய ஏதேனும் தடைகள் இருக்கிறதா? இருந்தால் அவை என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question17$$, 'kn', $$ಹಣ, ಭಯ, ಅಂಕಗಳು, ಕೌಟುಂಬಿಕ ಸಮಸ್ಯೆಗಳು ಇತ್ಯಾದಿ.. ಯಾವುದು ಎಂಬುದನ್ನು ತಿಳಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question17$$, 'ta', $$பணம், பயம், மதிப்பெண்கள், குடும்பப் பிரச்சனைகள் போன்றவை.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE dreams_questions SET question_text = $$Is the education/learning you receive in school helpful for your dreams? If yes, how?$$, help_text = $$Subjects give knowledge and skills.$$ WHERE sequence_number = 18;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question18$$, 'kn', $$ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ನನಸಾಗಿಸಲು ಈಗ ನೀವು ಶಾಲೆಯಲ್ಲಿ ಪಡೆಯುತ್ತಿರುವ ಶಿಕ್ಷಣ/ಕಲಿಕೆಯು ಸಹಾಯವಾಗುತ್ತದೆಯೇ? ಹೌದು ಎಂದಾದರೆ ಹೇಗೆ? ತಿಳಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_question$$, $$question18$$, 'ta', $$பள்ளியில் நீங்கள் பெறும் கல்வி உங்கள் கனவுக்கு உதவுமா? ஆம் என்றால், எப்படி?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question18$$, 'kn', $$ವಿಷಯಗಳು ಜ್ಞಾನ ಮತ್ತು ಕೌಶಲ್ಯಗಳನ್ನು ನೀಡುತ್ತವೆ. ಇತ್ಯಾದಿ..
ಯಾವುದು ಮತ್ತು ಹೇಗೆ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_help$$, $$question18$$, 'ta', $$பாடங்கள் அறிவும் திறனும் தரும்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- Summary questions (assessment_summary_templates JSONB)

UPDATE assessment_summary_templates
SET summary_questions = jsonb_build_object(
  'en', '{"question1":"Qualities/abilities I already have to achieve my dream","question2":"What I need to do to ensure my dream does not fail","question3":"What I need to study after Class 10 to achieve this dream (if applicable)"}'::jsonb,
  'kn', '{"question1":"ನಿಮ್ಮಲ್ಲಿ ಈಗಾಗಲೇ ಕಂಡುಕೊಂಡಿರುವ ಯಾವ ಗುಣ/ ಮೌಲ್ಯ/ ಸಾಮರ್ಥ್ಯ ನಿಮ್ಮ ಕನಸನ್ನು ಸಾಧಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.","question2":"ಕನಸು ವಿಫಲವಾಗುವುದಿಲ್ಲ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಲು ನೀವು ಏನು ಮಾಡಬೇಕಾಗುತ್ತದೆ","question3":"ಈ ಕನಸನ್ನುಸಾಧಿಸಲು 10ನೇ ತರಗತಿಯ ನಂತರ ನೀವು ಏನು ಅಧ್ಯಯನ ಮಾಡಬೇಕು? (ಅನ್ವಯಿಸಿದರೆ)"}'::jsonb,
  'ta', '{"question1":"எனது கனவை அடைய என்னிடம் ஏற்கனவே உள்ள பண்புகள்/திறமைகள்","question2":"என் கனவு தோற்காமல் இருக்க நான் செய்ய வேண்டியவை","question3":"இந்தக் கனவை அடைய 10-ஆம் வகுப்பிற்குப் பிறகு நான் படிக்க வேண்டியவை"}'::jsonb
),
    updated_at = NOW()
WHERE assessment_type = 'dreams';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_summary_question$$, $$question1$$, 'kn', $$ನಿಮ್ಮಲ್ಲಿ ಈಗಾಗಲೇ ಕಂಡುಕೊಂಡಿರುವ ಯಾವ ಗುಣ/ ಮೌಲ್ಯ/ ಸಾಮರ್ಥ್ಯ ನಿಮ್ಮ ಕನಸನ್ನು ಸಾಧಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_summary_question$$, $$question1$$, 'ta', $$எனது கனவை அடைய என்னிடம் ஏற்கனவே உள்ள பண்புகள்/திறமைகள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_summary_question$$, $$question1$$, 'en', $$Qualities/abilities I already have to achieve my dream$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_summary_question$$, $$question2$$, 'kn', $$ಕನಸು ವಿಫಲವಾಗುವುದಿಲ್ಲ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಲು ನೀವು ಏನು ಮಾಡಬೇಕಾಗುತ್ತದೆ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_summary_question$$, $$question2$$, 'ta', $$என் கனவு தோற்காமல் இருக்க நான் செய்ய வேண்டியவை$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_summary_question$$, $$question2$$, 'en', $$What I need to do to ensure my dream does not fail$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_summary_question$$, $$question3$$, 'kn', $$ಈ ಕನಸನ್ನುಸಾಧಿಸಲು 10ನೇ ತರಗತಿಯ ನಂತರ ನೀವು ಏನು ಅಧ್ಯಯನ ಮಾಡಬೇಕು? (ಅನ್ವಯಿಸಿದರೆ)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_summary_question$$, $$question3$$, 'ta', $$இந்தக் கனவை அடைய 10-ஆம் வகுப்பிற்குப் பிறகு நான் படிக்க வேண்டியவை$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$dreams_summary_question$$, $$question3$$, 'en', $$What I need to study after Class 10 to achieve this dream (if applicable)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- ============================================================================
-- SCHOOL_LEARNING (9.4_My School, Learnings and I)
-- 21 main questions, 8 summary questions
-- ============================================================================

-- Main questions: base table updates (English) + translations (Kannada, Tamil)

UPDATE school_learning_questions SET question_text = $$Do you like coming to school? Why?$$, help_text = $$Write whether you like coming to school and give the reason.$$ WHERE sequence_number = 1;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question1$$, 'kn', $$ನಿಮಗೆ ಶಾಲೆಗೆ ಬರುವುದೆಂದರೆ ಇಷ್ಟವೇ? ಯಾಕೆ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question1$$, 'ta', $$உங்களுக்கு பள்ளிக்கு செல்ல விருப்பமா? ஏன்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question1$$, 'kn', $$ನಿಮಗೆ ಶಾಲೆಗೆ ಬರಲು ಇಷ್ಟವೇ ಎಂದು ಬರೆಯಿರಿ ಮತ್ತು ಅದಕ್ಕೆ ಕಾರಣ ನೀಡಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question1$$, 'ta', $$பள்ளிக்குச் செல்ல விருப்பம் உள்ளதா என்பதை காரணத்துடன் எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE school_learning_questions SET question_text = $$What do you like to learn in school?$$, help_text = $$Write what you like to learn in school.$$ WHERE sequence_number = 2;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question2$$, 'kn', $$ಶಾಲೆಯಲ್ಲಿ ಏನನ್ನು ಕಲಿಯಲು ಇಷ್ಟಪಡುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question2$$, 'ta', $$பள்ளியில் நீங்கள் என்ன கற்றுக்கொள்ள விரும்புகிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question2$$, 'kn', $$ನೀವು ಶಾಲೆಯಲ್ಲಿ ಏನನ್ನು ಕಲಿಯಲು ಇಷ್ಟಪಡುತ್ತೀರಿ ಎಂದು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question2$$, 'ta', $$பள்ளியில் உங்களுக்கு பிடித்த கற்றல் விஷயங்களை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE school_learning_questions SET question_text = $$What are the reasons you do not like learning in school? Explain.$$, help_text = $$Clearly write the reasons why you do not like learning in school.$$ WHERE sequence_number = 3;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question3$$, 'kn', $$ನೀವು ಶಾಲೆಯಲ್ಲಿ ಕಲಿಯಲು ಇಷ್ಟಪಡದಿರಲು ಕಾರಣಗಳೇನು? ವಿವರಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question3$$, 'ta', $$பள்ளியில் கற்றுக்கொள்ள உங்களுக்கு பிடிக்காத காரணங்கள் என்ன? விளக்குங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question3$$, 'kn', $$ನಿಮಗೆ ಶಾಲೆಯಲ್ಲಿ ಕಲಿಯುವುದು ಏಕೆ ಇಷ್ಟವಿಲ್ಲ ಎಂಬುದಕ್ಕೆ ಕಾರಣಗಳನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question3$$, 'ta', $$கற்றலில் விருப்பமில்லாத காரணங்களை தெளிவாக எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE school_learning_questions SET question_text = $$Who are your close friends in school? What qualities or traits in them have made them your close friends?$$, help_text = $$Write about your close friends and the qualities that make them special.$$ WHERE sequence_number = 4;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question4$$, 'kn', $$ಶಾಲೆಯಲ್ಲಿ ನಿಮಗೆ ಆತ್ಮೀಯ ಸ್ನೇಹಿತರು ಯಾರು? ಅವರಲ್ಲಿ ಇರುವ ಯಾವ ಗುಣ/ ಸಂಗತಿಗಳು ನೀವಿಬ್ಬರು ಸ್ನೇಹಿತರಾಗುವಂತೆ ಮಾಡಿದೆ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question4$$, 'ta', $$பள்ளியில் உங்களுக்கு நெருங்கிய நண்பர்கள் யார்? அவர்களிடம் உள்ள எந்த குணங்கள் / அம்சங்கள் அவர்களை உங்கள் நெருங்கிய நண்பர்களாக ஆக்கியது?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question4$$, 'kn', $$ನಿಮ್ಮ ಆಪ್ತ ಸ್ನೇಹಿತರು ಮತ್ತು ಅವರ ವಿಶೇಷ ಗುಣಗಳ ಬಗ್ಗೆ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question4$$, 'ta', $$உங்கள் நெருங்கிய நண்பர்கள் மற்றும் அவர்களின் நல்ல குணங்களை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE school_learning_questions SET question_text = $$Which subjects do you like the most? Write them.$$, help_text = $$List the subjects you like the most.$$ WHERE sequence_number = 5;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question5$$, 'kn', $$ನೀವು ಹೆಚ್ಚು ಇಷ್ಟಪಡುವ ಪಠ್ಯ ವಿಷಯಗಳು ಯಾವುವು? ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question5$$, 'ta', $$நீங்கள் அதிகம் விரும்பும் பாடப்பிரிவுகள் எவை? எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question5$$, 'kn', $$ನಿಮಗೆ ಅತಿ ಹೆಚ್ಚು ಇಷ್ಟವಾಗುವ ವಿಷಯಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question5$$, 'ta', $$உங்களுக்கு பிடித்த பாடங்களை பட்டியலிடுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE school_learning_questions SET question_text = $$Why do you like this subject? Write the reason.$$, help_text = $$You may like the subject because it is easy, interesting, or taught well by the teacher.$$ WHERE sequence_number = 6;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question6$$, 'kn', $$ನೀವು ಈ ವಿಷಯಗಳನ್ನು ಏಕೆ ಇಷ್ಟಪಡುತ್ತೀರಿ? ಕಾರಣವನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question6$$, 'ta', $$நீங்கள் இந்த பாடத்தை ஏன் விரும்புகிறீர்கள்? காரணத்தை எழுதுக.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question6$$, 'kn', $$ಯಾಕೆ ಇಷ್ಟ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ. ಉದಾಹರಣೆ :ಆ ವಿಷಯವು ಸುಲಭವಾಗಿರುವುದರಿಂದ, ಆಸಕ್ತಿದಾಯಕವಾಗಿರುವುದರಿಂದ ಅಥವಾ ಶಿಕ್ಷಕರು ಚೆನ್ನಾಗಿ ಬೋಧಿಸುವುದರಿಂದ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question6$$, 'ta', $$பாடம் எளிதாக இருப்பது, சுவாரசியமாக இருப்பது அல்லது ஆசிரியர் நன்றாக கற்பிப்பது காரணமாக இருக்கலாம்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE school_learning_questions SET question_text = $$Which subjects do you not like to study?$$, help_text = $$Some subjects may be disliked because they are difficult or hard to understand.$$ WHERE sequence_number = 7;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question7$$, 'kn', $$ನಿಮಗೆ ಕಲಿಯಲು ಇಷ್ಟವಿಲ್ಲದ ಪಠ್ಯ ವಿಷಯಗಳು ಯಾವವು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question7$$, 'ta', $$உங்களுக்கு கற்க விருப்பமில்லாத பாடப்பிரிவுகள் எவை?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question7$$, 'kn', $$ಯಾಕೆ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ. 
 ಉದಾಹರಣೆ : ಕಷ್ಟಕರವಾಗಿರುವುದರಿಂದ, ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಕಠಿಣವಾಗಿರುವುದರಿಂದ ಇತ್ಯಾದಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question7$$, 'ta', $$பாடம் கடினமாக இருப்பது அல்லது புரியாமல் இருப்பது காரணமாக சில பாடங்கள் பிடிக்காமல் இருக்கலாம்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE school_learning_questions SET question_text = $$Why do you have less interest in the above subjects? What help did you receive to learn these subjects?$$, help_text = $$Interest may be less because the subject is difficult, and help from teachers or friends supports learning.$$ WHERE sequence_number = 8;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question8$$, 'kn', $$ಮೇಲಿನ ತಿಳಿಸಿದ ವಿಷಯಗಳಲ್ಲಿ ನಿಮಗೆ ಕಡಿಮೆ ಆಸಕ್ತಿ ಏಕೆ? ಈ ವಿಷಯಗಳನ್ನು ಕಲಿಯಲು ನೀವು ಯಾವ ಸವಾಲುಗಳನ್ನು ಪಡೆದಿದ್ದೀರಾ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question8$$, 'ta', $$மேலே கூறிய பாடங்களில் உங்களுக்கு ஏன் குறைந்த ஆர்வம் உள்ளது? இந்த பாடங்களை கற்க நீங்கள் எந்த உதவிகளை பெற்றீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question8$$, 'kn', $$ಯಾಕೆ ಕಡಿಮೆ ಆಸಕ್ತಿ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ. ಶಿಕ್ಷಕರು, ಸ್ನೇಹಿತರು ಅಥವಾ ಇನ್ಯಾರ ಸಹಾಯ ಪಡೆದಿರಿ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question8$$, 'ta', $$பாடம் கடினமாக இருப்பதால் ஆர்வம் குறையலாம், ஆசிரியர் மற்றும் நண்பர்களின் உதவி கற்றலுக்கு உதவுகிறது.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE school_learning_questions SET question_text = $$Which subjects do you score the highest marks in?$$, help_text = $$Students usually score higher marks in subjects they understand well and like.$$ WHERE sequence_number = 9;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question9$$, 'kn', $$ನೀವು ಹೆಚ್ಚು ಅಂಕಗಳಿಸುತ್ತಿರುವ ವಿಷಯಗಳು ಯಾವುವು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question9$$, 'ta', $$நீங்கள் அதிக மதிப்பெண் பெறும் பாடங்கள் எவை?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question9$$, 'kn', $$ನೀವು ಯಾವ ವಿಷಯಗಳಲ್ಲಿ ಹೆಚ್ಚಿನ ಅಂಕಗಳನ್ನು ಪಡೆಯುತ್ತಿದ್ದೀರಿ ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question9$$, 'ta', $$எளிதாக புரியும் மற்றும் விருப்பமான பாடங்களில் மாணவர்கள் அதிக மதிப்பெண் பெறுவார்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE school_learning_questions SET question_text = $$Which subjects do you score low marks in?$$, help_text = $$Low marks may be due to lack of understanding or insufficient practice.$$ WHERE sequence_number = 10;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question10$$, 'kn', $$ನೀವು ಕಡಿಮೆ ಅಂಕಗಳಿಸುತ್ತಿರುವ ವಿಷಯಗಳು ಯಾವುವು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question10$$, 'ta', $$நீங்கள் குறைந்த மதிப்பெண் பெறும் பாடங்கள் எவை?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question10$$, 'kn', $$ನೀವು ಯಾವ ವಿಷಯಗಳಲ್ಲಿ ಕಡಿಮೆ ಅಂಕಗಳನ್ನು ಪಡೆಯುತ್ತಿದ್ದೀರಿ ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question10$$, 'ta', $$பாடம் புரியாமல் இருப்பது அல்லது பயிற்சி குறைவாக இருப்பது குறைந்த மதிப்பெண்களுக்கு காரணமாகும்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE school_learning_questions SET question_text = $$Which of the following learning methods do you like the most? (Put a ✔ mark for the one that applies to you)$$, help_text = $$Tick ✔ only the options that apply to you.$$ WHERE sequence_number = 11;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question11$$, 'kn', $$ಈ ಕೆಳಗಿನ ಯಾವ ಕಲಿಕಾ ವಿಧಾನಗಳನ್ನು ನೀವು ಹೆಚ್ಚು ಇಷ್ಟಪಡುತ್ತೀರಿ? (ನಿಮಗೆ ಅನ್ವಯವಾಗುವುದನ್ನು ✔ ಎಂದು ಗುರುತು ಮಾಡಿ)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question11$$, 'ta', $$கீழ்க்கண்ட எந்த கற்றல் முறைகளை நீங்கள் அதிகமாக விரும்புகிறீர்கள்? (உங்களுக்கு பொருந்துவதை ✔ என்று குறிக்கவும்)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question11$$, 'kn', $$ನಿಮಗೆ ಅನ್ವಯಿಸುವ ಆಯ್ಕೆಗಳಿಗೆ ಮಾತ್ರ ಸರಿಯಾದ (✔️) ಗುರುತು ಹಾಕಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question11$$, 'ta', $$மாணவர்கள் தங்களுக்கு எளிதாக புரியும் மற்றும் விருப்பமான கற்றல் முறையை தேர்வு செய்ய வேண்டும்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE school_learning_questions SET question_text = $$Do you prefer to learn alone or in a group? Why? Write the reason.$$, help_text = $$Select your preferred learning method and write the reason.$$ WHERE sequence_number = 12;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question12$$, 'kn', $$ನೀವು ಒಬ್ಬರೇ ಕಲಿಯಲು ಇಷ್ಟಪಡುತ್ತೀರಾ ಅಥವಾ ಗುಂಪಿನಲ್ಲಿ ಕಲಿಯಲು ಇಷ್ಟಪಡುತ್ತೀರಾ? ಏಕೆ? ಕಾರಣ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question12$$, 'ta', $$நீங்கள் தனியாகக் கற்றுக்கொள்ள விரும்புகிறீர்களா அல்லது குழுவாக  கற்றுக்கொள்ள விரும்புகிறீர்களா? ஏன்? காரணத்தை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question12$$, 'kn', $$ನಿಮ್ಮ ಮೆಚ್ಚಿನ ಕಲಿಕಾ ವಿಧಾನವನ್ನು ಆರಿಸಿ ಮತ್ತು ಕಾರಣವನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question12$$, 'ta', $$உங்களுக்கு பிடித்த கற்றல் முறையை தேர்வு செய்து காரணத்தை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE school_learning_questions SET question_text = $$Do you learn from your friends in school? List some of the things you have recently learned from friends at school.$$, help_text = $$Recall and list what you learned from your friends.$$ WHERE sequence_number = 13;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question13$$, 'kn', $$ಶಾಲೆಯಲ್ಲಿ ನೀವು ನಿಮ್ಮ ಸ್ನೇಹಿತರಿಂದ ಕಲಿಯುತ್ತೀರಾ? ಶಾಲೆಯಲ್ಲಿ ಇತ್ತೀಚೆಗೆ ಸ್ನೇಹಿತರಿಂದ ಕಲಿತ ಕೆಲವು ವಿಷಯಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question13$$, 'ta', $$பள்ளியில் நீங்கள் உங்கள் நண்பர்களிடமிருந்து கற்றுக்கொள்கிறீர்களா? பள்ளியில் சமீபத்தில் நண்பர்களிடமிருந்து கற்ற சில விஷயங்களை பட்டியலிடுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question13$$, 'kn', $$ನಿಮ್ಮ ಸ್ನೇಹಿತರಿಂದ ನೀವು ಕಲಿತದ್ದನ್ನು ನೆನಪಿಸಿಕೊಳ್ಳಿ ಮತ್ತು ಪಟ್ಟಿ ಮಾಡಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question13$$, 'ta', $$நண்பர்களிடமிருந்து கற்ற விஷயங்களை நினைத்து பட்டியலிடுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE school_learning_questions SET question_text = $$Apart from textbook subjects, what aspects attract you to school?$$, help_text = $$Write the other activities or aspects that make school appealing.$$ WHERE sequence_number = 14;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question14$$, 'kn', $$ಪಠ್ಯ ವಿಷಯಗಳನ್ನು ಹೊರತುಪಡಿಸಿ, ಶಾಲೆಗೆ ನಿಮ್ಮನ್ನು ಆಕರ್ಷಿಸುವ ಅಂಶಗಳು ಯಾವುವು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question14$$, 'ta', $$பாடப்புத்தகப் பாடங்களைத் தவிர, பள்ளிக்குச் செல்ல உங்களை ஈர்க்கும் அம்சங்கள் எவை?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question14$$, 'kn', $$ಶಾಲೆಯನ್ನು ಆಕರ್ಷಕವಾಗಿಸುವ ಇತರ ಚಟುವಟಿಕೆಗಳು ಅಥವಾ ಅಂಶಗಳನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question14$$, 'ta', $$பள்ளி மீது விருப்பத்தை ஏற்படுத்தும் பிற செயல்கள் அல்லது அம்சங்களை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE school_learning_questions SET question_text = $$Who are your two favourite teachers and why? How have these two teachers influenced you?$$, help_text = $$Write about your favourite teachers and how they influenced you.$$ WHERE sequence_number = 15;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question15$$, 'kn', $$ನಿಮ್ಮ ನೆಚ್ಚಿನ ಶಿಕ್ಷಕರು ಯಾರು ಮತ್ತು ಏಕೆ? ಈ ಶಿಕ್ಷಕರು ನಿಮ್ಮ ಮೇಲೆ ಹೇಗೆ ಪ್ರಭಾವ ಬೀರುತ್ತಿದ್ದಾರೆ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question15$$, 'ta', $$உங்களுக்கு பிடித்த 2 ஆசிரியர்கள் யார்? ஏன்? இந்த 2 ஆசிரியர்கள் உங்கள் மீது எவ்வாறு தாக்கம் ஏற்படுத்தியுள்ளனர்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question15$$, 'kn', $$ನಿಮ್ಮ ನೆಚ್ಚಿನ ಶಿಕ್ಷಕರು ಮತ್ತು ಅವರು ನಿಮ್ಮ ಮೇಲೆ ಹೇಗೆ ಪ್ರಭಾವ ಬೀರಿದ್ದಾರೆ ಎಂಬುದರ ಬಗ್ಗೆ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question15$$, 'ta', $$பிடித்த ஆசிரியர்களையும் அவர்கள் உங்களை மாற்றிய விதத்தையும் எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE school_learning_questions SET question_text = $$Is there any specific incident or experience in school that gave you a great sense of success or satisfaction? What is it?$$, help_text = $$Write about a school incident that made you feel successful or satisfied.$$ WHERE sequence_number = 16;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question16$$, 'kn', $$ಶಾಲೆಯಲ್ಲಿ ನಿಮಗೆ ತುಂಬಾ ಯಶಸ್ಸು ಅಥವಾ ಹೆಮ್ಮೆ ಅನಿಸುವಂತೆ ಮಾಡಿದ ಒಂದು ನಿರ್ದಿಷ್ಟ ಘಟನೆ / ಸನ್ನಿವೇಶ ಇದೆಯೇ? ಅದು ಏನು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question16$$, 'ta', $$பள்ளியில் உங்களுக்கு மிகுந்த வெற்றி அல்லது திருப்தி உணர்வை ஏற்படுத்திய ஒரு குறிப்பிட்ட நிகழ்வு / அனுபவம் உள்ளதா? அது என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question16$$, 'kn', $$ನೀವು ಹೆಮ್ಮೆ ಅಥವಾ ಸಂತೋಷ ಅನುಭವಿಸುವಂತೆ ಮಾಡಿದ ಶಾಲಾ ಘಟನೆಯ ಬಗ್ಗೆ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question16$$, 'ta', $$உங்களுக்கு பெருமை அல்லது திருப்தி அளித்த பள்ளி நிகழ்வை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE school_learning_questions SET question_text = $$How do the things you learned in school help you achieve your dreams and expectations?$$, help_text = $$Relate what you learned in school to your dreams and goals.$$ WHERE sequence_number = 17;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question17$$, 'kn', $$ನಿಮ್ಮ ಕನಸು ಮತ್ತು ನಿರೀಕ್ಷೆಗಳನ್ನು ಸಾಧಿಸಲು ಶಾಲೆಯಲ್ಲಿ ನೀವು ಕಲಿತ ವಿಷಯಗಳು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡುತ್ತ+B32:B33ವೆ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question17$$, 'ta', $$உங்கள் கனவுகள் மற்றும் எதிர்பார்ப்புகளை அடைய, பள்ளியில் நீங்கள் கற்ற விஷயங்கள் உங்களுக்கு எவ்வாறு உதவுகின்றன?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question17$$, 'kn', $$ಶಾಲೆಯಲ್ಲಿ ನೀವು ಕಲಿತದ್ದನ್ನು ನಿಮ್ಮ ಕನಸುಗಳು ಮತ್ತು ಗುರಿಗಳಿಗೆ ಸಂಬಂಧಿಸಿ ನೋಡಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question17$$, 'ta', $$பள்ளியில் கற்றதை உங்கள் கனவுகளுடன் தொடர்புபடுத்தி எழுதுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE school_learning_questions SET question_text = $$What are the things you want to be changed in your school? What is the reason for that?$$, help_text = $$Write the changes you want and the reasons for them.$$ WHERE sequence_number = 18;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question18$$, 'kn', $$ನಿಮ್ಮ ಶಾಲೆಯಲ್ಲಿ ಯಾವ, ಯಾವ ಸಂಗತಿಗಳು ಬದಲಾಗಬೇಕು ಎಂದು ನೀವು ಬಯಸುತ್ತೀರಿ? ಅದಕ್ಕೆ ಕಾರಣವೇನು ತಿಳಿಸಿ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question18$$, 'ta', $$உங்கள் பள்ளியில் எந்த எந்த விஷயங்கள் மாற்றப்பட வேண்டும் என்று நீங்கள் விரும்புகிறீர்கள்? அதற்கான காரணம் என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question18$$, 'kn', $$ನೀವು ಬಯಸುವ ಬದಲಾವಣೆಗಳು ಮತ್ತು ಅವುಗಳಿಗೆ ಕಾರಣಗಳನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question18$$, 'ta', $$மாற்றம் வேண்டிய விஷயங்களையும் அதற்கான காரணத்தையும் எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE school_learning_questions SET question_text = $$Do you have a separate place to study? Why is it necessary?$$, help_text = $$Write about whether you have a separate place for your studies.$$ WHERE sequence_number = 19;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question19$$, 'kn', $$ಅಭ್ಯಾಸ ಮಾಡಲು ಯಾವುದಾದರೂ ಪ್ರತ್ಯೇಕ ಸ್ಥಳ ಇದೆಯೇ? ಅದು ಯಾಕೆ ಅಗತ್ಯ? ತಿಳಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question19$$, 'ta', $$உங்களுக்குப் படிக்கத் தனியாக இடம் உள்ளதா? அது ஏன் அவசியம்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question19$$, 'kn', $$ನಿಮ್ಮ ಅಭ್ಯಾಸಕ್ಕೆಂದು ಪ್ರತ್ಯೇಕ ಸ್ಥಳ ಇದೆಯೇ? ಹಾಗು ಅದು ಯಾಕೆ ಅಗತ್ಯ ಎಂಬುದರ ಬಗ್ಗೆ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question19$$, 'ta', $$உங்கள் படிப்பிற்கெனத் தனி இடம் இருக்கிறதா என்பதைப் பற்றி எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE school_learning_questions SET question_text = $$Does the school play an important role in your life related to learning? Write your opinion.$$, help_text = $$Write your opinion about the role of school in your learning.$$ WHERE sequence_number = 20;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question20$$, 'kn', $$ನಿಮ್ಮ ಜೀವನದಲ್ಲಿ ಕಲಿಕೆಗೆ ಸಂಬಂಧಿಸಿದಂತೆ ಶಾಲೆ ಮಹತ್ವದ ಪಾತ್ರವಹಿಸಿದೆಯೇ? ನಿಮ್ಮ ಅಭಿಪ್ರಾಯವನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question20$$, 'ta', $$உங்கள் வாழ்க்கை, கற்றலுடன் தொடர்புடையதாக மாற்றுவதில்  பள்ளிக்கு முக்கியமான பங்கு உள்ளதா? உங்கள் கருத்தை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question20$$, 'kn', $$ನಿಮ್ಮ ಕಲಿಕೆಯಲ್ಲಿ ಶಾಲೆಯ ಪಾತ್ರದ ಬಗ್ಗೆ ನಿಮ್ಮ ಅಭಿಪ್ರಾಯವನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question20$$, 'ta', $$கற்றலில் பள்ளியின் பங்கைப் பற்றி உங்கள் கருத்தை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE school_learning_questions SET question_text = $$Do you like to discuss school activities and learning with your parents? What topics do you discuss with them?$$, help_text = $$Write the school-related topics you discuss with your parents.$$ WHERE sequence_number = 21;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question21$$, 'kn', $$ಶಾಲೆಯ ಚಟುವಟಿಕೆಗಳು ಮತ್ತು ಕಲಿಕೆಯ ಬಗ್ಗೆ ನಿಮ್ಮ ಪಾಲಕರೊಂದಿಗೆ ಚರ್ಚಿಸಲು ಹೇಳಿಕೊಳ್ಳುವುದೆಂದರೆ ನಿಮಗೆ ಇಷ್ಟವೇ? ಯಾವೆಲ್ಲ ವಿಷಯಗಳನ್ನು ನೀವು ಅವರೊಂದಿಗೆ ಚರ್ಚಿಸುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_question$$, $$question21$$, 'ta', $$பள்ளியின் செயல்பாடுகள் மற்றும் கற்றல் குறித்து உங்கள் பெற்றோருடன் விவாதிக்க உங்களுக்கு விருப்பமா? அவர்களுடன் நீங்கள் எந்த விஷயங்களைப் பேசுகிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question21$$, 'kn', $$ನಿಮ್ಮ ಪೋಷಕರೊಂದಿಗೆ ನೀವು ಚರ್ಚಿಸುವ ಶಾಲೆಗೆ ಸಂಬಂಧಿಸಿದ ವಿಷಯ ಯಾವುದು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_help$$, $$question21$$, 'ta', $$பெற்றோருடன் நீங்கள் பேசும் பள்ளி தொடர்பான விஷயங்களை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- Checkbox options for Q11

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_option$$, $$visual$$, 'kn', $$ವಿಡಿಯೋಗಳನ್ನು ವೀಕ್ಷಿಸುವುದು ಅಥವಾ ಚಿತ್ರಗಳ ಮೂಲಕ ತಿಳಿಯುವುದು (ದೃಶ್ಯ ಮಾಧ್ಯಮ)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_option$$, $$visual$$, 'ta', $$வீடியோக்களைப் பார்ப்பது அல்லது படங்களின் மூலம் புரிந்துகொள்வது (காட்சி முறை)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
UPDATE school_learning_options SET option_text = $$Watching videos or learning through pictures (Visual)$$ WHERE option_value = $$visual$$;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_option$$, $$reading$$, 'kn', $$ಪಠ್ಯಪುಸ್ತಕ ಅಥವಾ ಲೇಖನಗಳನ್ನು ಓದುವುದು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_option$$, $$reading$$, 'ta', $$பாடப்புத்தகங்கள் அல்லது கட்டுரைகளை வாசிப்பது$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
UPDATE school_learning_options SET option_text = $$Reading textbooks or articles$$ WHERE option_value = $$reading$$;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_option$$, $$audio$$, 'kn', $$ವಿವರಣೆಗಳನ್ನು ಆಲಿಸುವುದು (ಶ್ರವಣ ಮಾಧ್ಯಮ)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_option$$, $$audio$$, 'ta', $$விளக்கங்களைக் கேட்டுப் புரிந்துகொள்வது (ஒலி முறை)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
UPDATE school_learning_options SET option_text = $$Listening to explanations (Audio)$$ WHERE option_value = $$audio$$;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_option$$, $$experimenting$$, 'kn', $$ಪ್ರಯೋಗ ಅಥವಾ ಚಟುವಟಿಕೆಗಳ ಮೂಲಕ ಕಲಿಯುವುದು (ಅನುಭವಾತ್ಮಕ)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_option$$, $$experimenting$$, 'ta', $$சோதனைகள் அல்லது செய்முறைப் பயிற்சிகள் மூலம் கற்றல் (அனுபவ முறை)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
UPDATE school_learning_options SET option_text = $$Learning through experiments or hands-on activities (Experiential)$$ WHERE option_value = $$experimenting$$;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_option$$, $$discuss$$, 'kn', $$ವಿಷಯಗಳ ಬಗ್ಗೆ ಚರ್ಚಿಸುವುದು ಅಥವಾ ತಾರ್ಕಿಕವಾಗಿ ಯೋಚಿಸುವುದು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_option$$, $$discuss$$, 'ta', $$கருத்துகளை விவாதிப்பது அல்லது தர்க்கரீதியாகச் சிந்திப்பது$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
UPDATE school_learning_options SET option_text = $$Discussing ideas or logical reasoning$$ WHERE option_value = $$discuss$$;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_option$$, $$groupDiscussions$$, 'kn', $$ಸ್ನೇಹಿತರೊಂದಿಗೆ ಗುಂಪು ಚರ್ಚೆ ಮಾಡುವುದು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_option$$, $$groupDiscussions$$, 'ta', $$நண்பர்களுடன் குழுவாக விவாதிப்பது$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
UPDATE school_learning_options SET option_text = $$Group discussions with friends$$ WHERE option_value = $$groupDiscussions$$;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_option$$, $$writing$$, 'kn', $$ಟಿಪ್ಪಣಿಗಳನ್ನು ಬರೆಯುವುದು ಅಥವಾ ಬರೆದು ಅಭ್ಯಾಸ ಮಾಡುವುದು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_option$$, $$writing$$, 'ta', $$குறிப்புகளை எழுதுவது அல்லது எழுதிப் பழகுவது$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
UPDATE school_learning_options SET option_text = $$Writing notes or practicing by writing$$ WHERE option_value = $$writing$$;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_option$$, $$memorizing$$, 'kn', $$ಓದುವುದು ಮತ್ತು ನೆನಪಿಟ್ಟುಕೊಳ್ಳುವುದು (ಬಾಯಿಪಾಠ)$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_option$$, $$memorizing$$, 'ta', $$வாசித்தல் மற்றும் மனப்பாடம் செய்தல்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
UPDATE school_learning_options SET option_text = $$Reading and memorizing (Byheart)$$ WHERE option_value = $$memorizing$$;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_option$$, $$teaching$$, 'kn', $$ಇತರರಿಗೆ ಕಲಿಸುವ ಮೂಲಕ ಅಥವಾ ವಿವರಿಸುವ ಮೂಲಕ ಕಲಿಯುವುದು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_option$$, $$teaching$$, 'ta', $$மற்றவர்களுக்குக் கற்பிப்பதன் மூலம் அல்லது விளக்குவதன் மூலம் கற்றல்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
UPDATE school_learning_options SET option_text = $$Learning by teaching or explaining to others$$ WHERE option_value = $$teaching$$;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_option$$, $$other$$, 'kn', $$ನಿಮಗೆ ಅನ್ವಯಿಸುವ ಬೇರೆ ಯಾವುದೇ ವಿಧಾನ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_option$$, $$other$$, 'ta', $$உங்களுக்குப் பொருந்தும் வேறு ஏதேனும் முறை$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
UPDATE school_learning_options SET option_text = $$Any other method that works for you$$ WHERE option_value = $$other$$;

-- Summary questions (assessment_summary_templates JSONB)

UPDATE assessment_summary_templates
SET summary_questions = jsonb_build_object(
  'en', '{"question1":"English","question2":"Subjects I like","question3":"Careers I can pursue based on the subjects I like","question4":"Subjects I do not like","question5":"Careers I can pursue if I make progress in the subjects I do not like","question6":"Other activities I perform well in","question7":"If I improve these skills, it will help me in choosing my job / career.","question8":"Note: You have the opportunity to choose your career based on your areas of interest. At the end of this book, on the page titled “My Areas of Interest,” record which lessons you would like to learn in the coming days, which subjects/lessons you like, and why you like them. This will help you understand the careers related to these subjects, how the lessons learned here are useful in different professions/fields, and support you in making future career decisions."}'::jsonb,
  'kn', '{"question1":"Kannada","question2":"ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳು","question3":"ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳಿಂದ ನಾನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು","question4":"ನಾನು ಇಷ್ಟಪಡದ ವಿಷಯಗಳು","question5":"ಇಷ್ಟಪಡದ ವಿಷಯಗಳಲ್ಲಿ ನಾನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು","question6":"ಪಠ್ಯ ವಿಷಯಗಳ ಜೊತೆಗೆ, ನಾನು ಉತ್ತಮ ಸಾಧನೆ ಮಾಡುವ ಇತರ ಚಟುವಟಿಕೆಗಳು / ವಿಷಯಗಳು","question7":"ನಾನು ಈ ಕೌಶಲ್ಯಗಳನ್ನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ನನ್ನ ಕೆಲಸ / ವೃತ್ತಿಯ ಆಯ್ಕೆಗೆ ಸಹಾಯವಾಗುತ್ತದೆ.","question8":"ಸೂಚನೆ: ಪ್ರತಿ ಆಸಕ್ತಿಯ ವಿಷಯಗಳ ಆಧಾರದ ಮೇಲು ವೃತ್ತಿ ಆಯ್ಕೆ ಮಾಡಿಕೊಳ್ಳುವ ಅವಕಾಶವಿದ್ದು, ಈ ಪುಸ್ತಕದ ಕೊನೆಯಲ್ಲಿ “ನನ್ನ ಆಸಕ್ತಿಯ ವಿಷಯಗಳು” ಎಂಬ ಪುಟದಲ್ಲಿ ನೀಡಿರುವ ಸ್ಥಳದಲ್ಲಿ ಮುಂದಿನ ದಿನಗಳಲ್ಲಿ ಯಾವುದೇ ಪಾಠವನ್ನು ಕಲಿಯುವಾಗ ನಿಮಗೆ ಇಷ್ಟವಾಗುವ ವಿಷಯ, ಪಾಠ ಮತ್ತು ಏಕೆ ಅಥವಾ ಯಾವ ಅಂಶಗಳು ಇಷ್ಟವಾಗಲು ಕಾರಣವಾಯಿತು ಈ ಎಲ್ಲಾ ಅಂಶಗಳನ್ನು ದಾಖಲಿಸಿ. ಇದು ವಿಷಯಕ್ಕೆ ಅನುಗುಣವಾಗಿರುವ ವೃತ್ತಿಗಳು, ಇಲ್ಲಿ ಕಲಿತ ಪಠ್ಯ ವಿಷಯ ಯಾವ ವೃತ್ತಿ/ವಲಯದಲ್ಲಿ ಉಪಯುಕ್ತವಾಗುವುದು ಎಂಬುದನ್ನು ಅರ್ಥೈಸಿಕೊಳ್ಳಲು ಮತ್ತು ಮುಂದಿನ ವೃತ್ತಿ ನಿರ್ಧಾರ ತೆಗೆದುಕೊಳ್ಳಲು ಸಹಾಯವಾಗುತ್ತದೆ."}'::jsonb,
  'ta', '{"question1":"Tamil","question2":"எனக்கு பிடித்த பாடங்கள்","question3":"விருப்பமான பாடங்கள் மூலம் நான் அடையக்கூடிய தொழில்கள்","question4":"எனக்கு பிடிக்காத பாடங்கள்","question5":"விருப்பமில்லாத பாடங்களில் முன்னேறினால் நான் அடையக்கூடிய தொழில்கள்","question6":"நான் சிறப்பாகச் செய்யும் பிற செயல்பாடுகள்","question7":"நான் மேம்படுத்த வேண்டிய திறன்கள்","question8":"குறிப்பு: ஒவ்வொரு ஆர்வப் பாடத்தையும் அடிப்படையாகக் கொண்டு, உங்கள் தொழில் தேர்வைச் செய்யும் வாய்ப்பு உள்ளது. இந்தப் புத்தகத்தின் இறுதியில் “என் ஆர்வப் பாடங்கள்” என்ற பக்கத்தில் கொடுக்கப்பட்ட இடத்தில், எதிர்காலத்தில் நீங்கள் எந்த பாடங்களை கற்றுக்கொள்ள விரும்புகிறீர்கள், எந்த விஷயங்கள்/பாடங்கள் உங்களுக்கு ஏன் பிடிக்கின்றன என்பவற்றை பதிவு செய்யுங்கள். இதனால் பாடங்களுக்கு ஏற்ற தொழில்கள், இங்கு கற்ற பாடப்பிரிவுகள் எந்த தொழில்/துறையில் பயன்படும் என்பதையும் புரிந்து கொண்டு, எதிர்கால தொழில் முடிவுகளை எடுக்க உதவும்."}'::jsonb
),
    updated_at = NOW()
WHERE assessment_type = 'school_learning';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question1$$, 'kn', $$Kannada$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question1$$, 'ta', $$Tamil$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question1$$, 'en', $$English$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question2$$, 'kn', $$ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question2$$, 'ta', $$எனக்கு பிடித்த பாடங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question2$$, 'en', $$Subjects I like$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question3$$, 'kn', $$ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳಿಂದ ನಾನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question3$$, 'ta', $$விருப்பமான பாடங்கள் மூலம் நான் அடையக்கூடிய தொழில்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question3$$, 'en', $$Careers I can pursue based on the subjects I like$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question4$$, 'kn', $$ನಾನು ಇಷ್ಟಪಡದ ವಿಷಯಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question4$$, 'ta', $$எனக்கு பிடிக்காத பாடங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question4$$, 'en', $$Subjects I do not like$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question5$$, 'kn', $$ಇಷ್ಟಪಡದ ವಿಷಯಗಳಲ್ಲಿ ನಾನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question5$$, 'ta', $$விருப்பமில்லாத பாடங்களில் முன்னேறினால் நான் அடையக்கூடிய தொழில்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question5$$, 'en', $$Careers I can pursue if I make progress in the subjects I do not like$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question6$$, 'kn', $$ಪಠ್ಯ ವಿಷಯಗಳ ಜೊತೆಗೆ, ನಾನು ಉತ್ತಮ ಸಾಧನೆ ಮಾಡುವ ಇತರ ಚಟುವಟಿಕೆಗಳು / ವಿಷಯಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question6$$, 'ta', $$நான் சிறப்பாகச் செய்யும் பிற செயல்பாடுகள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question6$$, 'en', $$Other activities I perform well in$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question7$$, 'kn', $$ನಾನು ಈ ಕೌಶಲ್ಯಗಳನ್ನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ನನ್ನ ಕೆಲಸ / ವೃತ್ತಿಯ ಆಯ್ಕೆಗೆ ಸಹಾಯವಾಗುತ್ತದೆ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question7$$, 'ta', $$நான் மேம்படுத்த வேண்டிய திறன்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question7$$, 'en', $$If I improve these skills, it will help me in choosing my job / career.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question8$$, 'kn', $$ಸೂಚನೆ: ಪ್ರತಿ ಆಸಕ್ತಿಯ ವಿಷಯಗಳ ಆಧಾರದ ಮೇಲು ವೃತ್ತಿ ಆಯ್ಕೆ ಮಾಡಿಕೊಳ್ಳುವ ಅವಕಾಶವಿದ್ದು, ಈ ಪುಸ್ತಕದ ಕೊನೆಯಲ್ಲಿ “ನನ್ನ ಆಸಕ್ತಿಯ ವಿಷಯಗಳು” ಎಂಬ ಪುಟದಲ್ಲಿ ನೀಡಿರುವ ಸ್ಥಳದಲ್ಲಿ ಮುಂದಿನ ದಿನಗಳಲ್ಲಿ ಯಾವುದೇ ಪಾಠವನ್ನು ಕಲಿಯುವಾಗ ನಿಮಗೆ ಇಷ್ಟವಾಗುವ ವಿಷಯ, ಪಾಠ ಮತ್ತು ಏಕೆ ಅಥವಾ ಯಾವ ಅಂಶಗಳು ಇಷ್ಟವಾಗಲು ಕಾರಣವಾಯಿತು ಈ ಎಲ್ಲಾ ಅಂಶಗಳನ್ನು ದಾಖಲಿಸಿ. ಇದು ವಿಷಯಕ್ಕೆ ಅನುಗುಣವಾಗಿರುವ ವೃತ್ತಿಗಳು, ಇಲ್ಲಿ ಕಲಿತ ಪಠ್ಯ ವಿಷಯ ಯಾವ ವೃತ್ತಿ/ವಲಯದಲ್ಲಿ ಉಪಯುಕ್ತವಾಗುವುದು ಎಂಬುದನ್ನು ಅರ್ಥೈಸಿಕೊಳ್ಳಲು ಮತ್ತು ಮುಂದಿನ ವೃತ್ತಿ ನಿರ್ಧಾರ ತೆಗೆದುಕೊಳ್ಳಲು ಸಹಾಯವಾಗುತ್ತದೆ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question8$$, 'ta', $$குறிப்பு: ஒவ்வொரு ஆர்வப் பாடத்தையும் அடிப்படையாகக் கொண்டு, உங்கள் தொழில் தேர்வைச் செய்யும் வாய்ப்பு உள்ளது. இந்தப் புத்தகத்தின் இறுதியில் “என் ஆர்வப் பாடங்கள்” என்ற பக்கத்தில் கொடுக்கப்பட்ட இடத்தில், எதிர்காலத்தில் நீங்கள் எந்த பாடங்களை கற்றுக்கொள்ள விரும்புகிறீர்கள், எந்த விஷயங்கள்/பாடங்கள் உங்களுக்கு ஏன் பிடிக்கின்றன என்பவற்றை பதிவு செய்யுங்கள். இதனால் பாடங்களுக்கு ஏற்ற தொழில்கள், இங்கு கற்ற பாடப்பிரிவுகள் எந்த தொழில்/துறையில் பயன்படும் என்பதையும் புரிந்து கொண்டு, எதிர்கால தொழில் முடிவுகளை எடுக்க உதவும்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$school_learning_summary_question$$, $$question8$$, 'en', $$Note: You have the opportunity to choose your career based on your areas of interest. At the end of this book, on the page titled “My Areas of Interest,” record which lessons you would like to learn in the coming days, which subjects/lessons you like, and why you like them. This will help you understand the careers related to these subjects, how the lessons learned here are useful in different professions/fields, and support you in making future career decisions.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- ============================================================================
-- HOBBIES (9.5_My Talents and Hobbies)
-- 14 main questions, 8 summary questions
-- ============================================================================

-- Main questions: base table updates (English) + translations (Kannada, Tamil)

UPDATE hobbies_questions SET question_text = $$1. What activities / work do you do in your free time?$$, help_text = $$Write about activities like reading, drawing or playing$$ WHERE sequence_number = 1;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question1$$, 'kn', $$ನೀವು ಬಿಡುವಿನ ವೇಳೆಯಲ್ಲಿ ಯಾವ ಕೆಲಸ/ ಚಟುವಟಿಕೆಗಳನ್ನು ಮಾಡುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question1$$, 'ta', $$1. நீங்கள் ஓய்வு நேரத்தில் எந்த வேலைகள் / செயல்களை செய்கிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question1$$, 'kn', $$ಬಿಡುವಿನ ಸಮಯದಲ್ಲಿ ನೀವು ಮಾಡುವ ಕೆಲಸ ಅಥವಾ ಚಟುವಟಿಕೆಗಳ ಬಗ್ಗೆ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question1$$, 'ta', $$புத்தகம் படிப்பது, வரைவது அல்லது விளையாடுவது போன்றவற்றை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE hobbies_questions SET question_text = $$2. Do you have any hobbies? List them.$$, help_text = $$List activities you do for joy (e.g., gardening, singing).$$ WHERE sequence_number = 2;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question2$$, 'kn', $$ನಿಮಗೆ ಯಾವುದಾದರೂ ಹವ್ಯಾಸಗಳು ಇದೆಯೇ? ನಿಮ್ಮಲ್ಲಿರುವ ಒಳ್ಳೆಯ ಹವ್ಯಾಸಗಳನ್ನು ಪಟ್ಟಿಮಾಡಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question2$$, 'ta', $$2. உங்களுக்கு ஏதேனும் பொழுதுபோக்குகள் (Hobbies) உண்டா? பட்டியலிடுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question2$$, 'kn', $$ಸಂತೋಷಕ್ಕಾಗಿ ರೂಢಿಸಿಕೊಂಡ ಒಳ್ಳೆಯ ಕೆಲಸ ಅಥವಾ ಚಟುವಟಿಕೆಗಳನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question2$$, 'ta', $$உங்களுக்கு மகிழ்ச்சி தரும் செயல்களைப் பட்டியலிடுங்கள் (உதாரணம்: தோட்டம் வளர்த்தல்).$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE hobbies_questions SET question_text = $$3. Among the hobbies listed above, which is your favorite? Why?$$, help_text = $$Choose your favorite and explain why it brings you joy.$$ WHERE sequence_number = 3;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question3$$, 'kn', $$ನೀವು ಮೇಲೆ ಪಟ್ಟಿಮಾಡಿದ ಹವ್ಯಾಸಗಳಲ್ಲಿ ನಿಮ್ಮ ನೆಚ್ಚಿನ ಹವ್ಯಾಸ ಯಾವುದು? ಯಾಕೆ? ಕಾರಣ ವಿವರಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question3$$, 'ta', $$3. மேலே பட்டியலிட்ட திறமைகளில் உங்களுக்கு மிகவும் பிடித்த திறமை எது? ஏன்? காரணம் விளக்குங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question3$$, 'kn', $$ನಿಮಗೆ ಅತಿ ಹೆಚ್ಚು ಇಷ್ಟವಾದದ್ದನ್ನು ಆರಿಸಿ ಮತ್ತು ಅದು ಏಕೆ ಇಷ್ಟ ಎಂದು ವಿವರಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question3$$, 'ta', $$அது ஏன் உங்களுக்கு மகிழ்ச்சி தருகிறது என்பதை 2-3 வரிகளில் விளக்குங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE hobbies_questions SET question_text = $$4. Have your hobbies changed at any time?$$, help_text = $$Mention if your interests have changed over the years$$ WHERE sequence_number = 4;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question4$$, 'kn', $$ನಿಮ್ಮ ಹವ್ಯಾಸಗಳು (Hobbies) ಎಂದಾದರೂ ಬದಲಾಗಿವೆಯೇ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question4$$, 'ta', $$4. உங்கள் பொழுதுபோக்குகள் எப்போதாவது மாறியுள்ளதா?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question4$$, 'kn', $$ಕಾಲಾನಂತರದಲ್ಲಿ ನಿಮ್ಮ ಹವ್ಯಾಸಗಳು ಬದಲಾಗಿವೆಯೇ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question4$$, 'ta', $$முன்பு பிடித்தது மற்றும் இப்போது பிடித்ததை ஒப்பிட்டு எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE hobbies_questions SET question_text = $$5. What inspired your hobbies?$$, help_text = $$Mention who or what inspired you (family, friends, etc.).$$ WHERE sequence_number = 5;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question5$$, 'kn', $$ನಿಮ್ಮ ಹವ್ಯಾಸಗಳಿಗೆ ಪ್ರೇರಣೆ ನೀಡಿದ ಸಂಗತಿ ಯಾವುದು? ಯಾವುದಾದರೂ ಹವ್ಯಾಸ ನಿಮ್ಮ ಕುಟುಂಬದಿಂದ, ಅನುವಂಶಿಕವಾಗಿ ಬಂದಿದೆಯೇ? ಈ ಕುರಿತು ಆಲೋಚಿಸಿ ತಿಳಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question5$$, 'ta', $$5. உங்கள் பொழுதுபோக்கிற்குத் ஊக்கம் அளித்தது எது?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question5$$, 'kn', $$ನಿಮ್ಮ ಹವ್ಯಾಸಗಳಿಗೆ ಪ್ರೇರಣೆ ನೀಡಿದವರು ಯಾರು ಎಂದು ತಿಳಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question5$$, 'ta', $$உங்கள் குடும்பம், நண்பர்கள் அல்லது ஆசிரியர் யாராவது காரணமா என எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE hobbies_questions SET question_text = $$6. Do you know anyone who has similar hobbies?$$, help_text = $$Name a friend, relative, or teacher with the same hobby.$$ WHERE sequence_number = 6;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question6$$, 'kn', $$ನಿಮಗೆ ಪರಿಚಿತವಿರುವ ಯಾರಾದರೂ ಇದೇ ರೀತಿಯ ಹವ್ಯಾಸಗಳು ಅಥವಾ ಆಸಕ್ತಿಗಳನ್ನು ಹೊಂದಿದ್ದಾರೆಯೇ? ಅವರು ಯಾರು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question6$$, 'ta', $$6. உங்களுக்கு அறிமுகமானவர்களில் யாராவது இதே போன்ற பொழுதுபோக்கு கொண்டுள்ளார்களா? அவர்கள் யார்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question6$$, 'kn', $$ಹವ್ಯಾಸ ಇರುವ ವ್ಯಕ್ತಿ ಸ್ನೇಹಿತ, ಸಂಬಂಧಿ ಅಥವಾ ಶಿಕ್ಷಕ ಇರಬಹುದು.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question6$$, 'ta', $$தெரிந்த நண்பர் அல்லது உறவினரின் பெயரைக் குறிப்பிடுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE hobbies_questions SET question_text = $$7. How do you feel when engaging in your favorite hobby?$$, help_text = $$Write whether your favorite hobby makes you feel happy, relaxed, or more confident.$$ WHERE sequence_number = 7;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question7$$, 'kn', $$ನಿಮ್ಮ ನೆಚ್ಚಿನ ಹವ್ಯಾಸದಲ್ಲಿ ತೊಡಗಿಸಿಕೊಂಡಾಗ ನಿಮಗೆ ಹೇಗನಿಸುತ್ತದೆ? ಅದು ನಿಮಗೆ ವಿಶ್ರಾಂತಿ ಪಡೆಯಲು ಅಥವಾ ಹೆಚ್ಚು ಆತ್ಮವಿಶ್ವಾಸವನ್ನು ಅನುಭವಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆಯೇ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question7$$, 'ta', $$7. பொழுதுபோக்கில் ஈடுபடும்போது எப்படி உணர்கிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question7$$, 'kn', $$ನಿಮ್ಮ ನೆಚ್ಚಿನ ಹವ್ಯಾಸವು ನಿಮಗೆ ಸಂತೋಷ, ನಿರಾಳತೆ ಅಥವಾ ಹೆಚ್ಚಿನ ಆತ್ಮವಿಶ್ವಾಸವನ್ನು ನೀಡುತ್ತದೆಯೇ ಎಂದು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question7$$, 'ta', $$அது உங்களுக்கு ஓய்வு அல்லது தன்னம்பிக்கையைத் தருகிறதா என எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE hobbies_questions SET question_text = $$8. List the talents you have.$$, help_text = $$List skills you are naturally good at (e.g., Math, Singing).$$ WHERE sequence_number = 8;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question8$$, 'kn', $$ನಿಮ್ಮಲ್ಲಿರುವ ಪ್ರತಿಭೆಗಳನ್ನು (Talents) ಪಟ್ಟಿ ಮಾಡಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question8$$, 'ta', $$8. உங்களிடம் உள்ள திறமைகளை (Talents) பட்டியலிடுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question8$$, 'kn', $$ಯಾವ್ಯಾವ ಪ್ರತಿಭೆ ನಿಮ್ಮಲ್ಲಿದೆ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question8$$, 'ta', $$நீங்கள் இயற்கையாகவே சிறந்து விளங்கும் திறன்களை எழுதுங்கள் (உதாரணம்: கணிதம்).$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE hobbies_questions SET question_text = $$9. Are you trying to improve your talent further? If yes, explain how.$$, help_text = $$Mention how you practice or learn to get better.$$ WHERE sequence_number = 9;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question9$$, 'kn', $$ನಿಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ಇನ್ನಷ್ಟು ಉತ್ತಮಗೊಳಿಸಲು ನೀವು ಪ್ರಯತ್ನ ಮಾಡುತ್ತಿದ್ದೀರಾ? ಮಾಡುತ್ತಿದ್ದರೆ ಹೇಗೆ ಎಂಬುದನ್ನು ತಿಳಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question9$$, 'ta', $$9. உங்கள் திறமையை மேலும் மேம்படுத்த நீங்கள் முயற்சி செய்து கொண்டிருக்கிறீர்களா? செய்தால், எவ்வாறு என்பதை விளக்குங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question9$$, 'kn', $$ನಿಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ಸುಧಾರಿಸಲು ನೀವು ಏನು ಮಾಡುತ್ತಿದ್ದೀರಿ ಎಂದು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question9$$, 'ta', $$உங்கள் பயிற்சி அல்லது கூடுதல் கற்றல் முறைகளைப் பற்றி எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE hobbies_questions SET question_text = $$10. Do you get encouragement and opportunities at school or at home to continue and showcase your talents?$$, help_text = $$Mention if you get chances to show what you are good at.$$ WHERE sequence_number = 10;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question10$$, 'kn', $$ನಿಮ್ಮ ಹವ್ಯಾಸ ಮತ್ತು ಪ್ರತಿಭೆಗಳನ್ನು ಮುಂದುವರೆಸಲು ಮತ್ತು ಪ್ರದರ್ಶಿಸಲು ಶಾಲೆ ಮತ್ತು ಮನೆಯಲ್ಲಿ ಪ್ರೋತ್ಸಾಹ ಹಾಗೂ ಅವಕಾಶ ಸಿಗುತ್ತಿದೆಯೇ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question10$$, 'ta', $$10. உங்கள் திறமைகளை தொடர்ந்து வெளிப்படுத்த பள்ளியிலும் வீட்டிலும் ஊக்கம் மற்றும் வாய்ப்பு கிடைக்கிறதா?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question10$$, 'kn', $$ಶಾಲೆಯಲ್ಲಿ ಅಥವಾ ಮನೆಯಲ್ಲಿ ನಿಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ವ್ಯಕ್ತಪಡಿಸಲು/ತೋರಿಸಲು ನಿಮಗೆ ಪ್ರೋತ್ಸಾಹ ಮತ್ತು ಅವಕಾಶಗಳು ಸಿಗುತ್ತವೆಯೇ ಎಂದು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question10$$, 'ta', $$உங்கள் திறமையை வெளிப்படுத்த உங்களுக்குக் கிடைக்கும் வாய்ப்புகளை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE hobbies_questions SET question_text = $$11. Do your parents support your efforts to further improve your talent? If yes, in what way?$$, help_text = $$Write how your parents support you in developing your talent.$$ WHERE sequence_number = 11;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question11$$, 'kn', $$ನಿಮ್ಮ ಹವ್ಯಾಸ ಮತ್ತು ಪ್ರತಿಭೆಯನ್ನು ಇನ್ನಷ್ಟು ಉತ್ತಮಗೊಳಿಸುವ ನಿಮ್ಮ ಪ್ರಯತ್ನಕ್ಕೆ ಪಾಲಕರು ಬೆಂಬಲ ನೀಡುತ್ತಾರೆಯೇ? ಯಾವ ರೀತಿ ತಿಳಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question11$$, 'ta', $$11. உங்கள் திறமையை மேலும் மேம்படுத்த நீங்கள் செய்யும் முயற்சிகளுக்கு உங்கள் பெற்றோர் ஆதரவு அளிக்கிறார்களா? எவ்வாறு என்பதை விளக்குங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question11$$, 'kn', $$ನಿಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ಬೆಳೆಸಿಕೊಳ್ಳಲು ನಿಮ್ಮ ಪೋಷಕರು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ನೀಡುತ್ತಾರೆ ಎಂದು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question11$$, 'ta', $$அவர்கள் உங்களுக்கு எப்படி உதவுகிறார்கள் என்பதை விளக்குங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE hobbies_questions SET question_text = $$12. Does any of your hobby match with your natural talents?$$, help_text = $$e.g., You love cricket (Hobby) and are a fast runner (Talent).$$ WHERE sequence_number = 12;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question12$$, 'kn', $$ನಿಮ್ಮ ಯಾವುದಾದರೂ ಹವ್ಯಾಸಗಳು ನಿಮ್ಮ ಸ್ವಾಭಾವಿಕ ಪ್ರತಿಭೆ ಮತ್ತು ಸಾಮರ್ಥ್ಯಗಳೊಂದಿಗೆ ಹೊಂದಿಕೆಯಾಗುತ್ತವೆಯೇ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question12$$, 'ta', $$12. உங்கள் பொழுதுபோக்கு, உங்கள் இயற்கை திறமையோடு பொருந்துகிறதா?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question12$$, 'kn', $$ಹವ್ಯಾಸಕ್ಕೆ ಹೊಂದುವ ಪ್ರತಿಭೆ ನಿಮ್ಮಲ್ಲಿದೆಯೇ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question12$$, 'ta', $$உதாரணம்: நீங்கள் கிரிக்கெட் விரும்பி விளையாடலாம் (ஆர்வம்) மற்றும் வேகமாக ஓடலாம் (திறமை).$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE hobbies_questions SET question_text = $$13. Can any of your hobbies be pursued as a career? If yes, how?$$, help_text = $$If yes, what steps or plans do you have to achieve this?$$ WHERE sequence_number = 13;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question13$$, 'kn', $$ನಿಮ್ಮ ಯಾವುದಾದರೂ ಹವ್ಯಾಸವನ್ನು ಭವಿಷ್ಯದಲ್ಲಿ ನಿಮ್ಮ ವೃತ್ತಿಯಾಗಿ ಮುಂದುವರೆಸಲು ಸಾಧ್ಯವೇ? ಸಾಧ್ಯವೆಂದಾದರೆ, ಅದಕ್ಕಾಗಿ ನೀವು ಅನುಸರಿಸುವ ಕ್ರಮ/ಸಿದ್ಧತೆಗಳೇನು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question13$$, 'ta', $$13. உங்கள் பொழுதுபோக்கை எதிர்காலத் தொழிலாக மாற்ற முடியுமா?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question13$$, 'kn', $$ನಿಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ಭವಿಷ್ಯದ ವೃತ್ತಿಯನ್ನಾಗಿ ಮಾಡಲು ನಿಮ್ಮ ಯೋಜನೆ ಏನು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question13$$, 'ta', $$இதைத் தொழிலாக மாற்ற உங்களுக்கு என்ன திட்டம் உள்ளது என எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE hobbies_questions SET question_text = $$14. Do you know anyone who turned a hobby into a career?$$, help_text = $$Briefly mention someone who turned their passion into a profession.$$ WHERE sequence_number = 14;
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question14$$, 'kn', $$ತಮ್ಮ ಹವ್ಯಾಸವನ್ನೇ ವೃತ್ತಿಯಾಗಿ ಮಾಡಿಕೊಂಡಿರುವ ನಿಮ್ಮ ಪರಿಚಯದ ಯಾರಾದರೂ ಇದ್ದಾರಾ? ಅವರು ಯಾರು ಮತ್ತು ಹೇಗೆ ಅವರು ತಮ್ಮ ಹವ್ಯಾಸವನ್ನೇ ವೃತ್ತಿಯಾಗಿ ಮಾಡಿಕೊಂಡರು ಎಂಬುದನ್ನು ತಿಳಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_question$$, $$question14$$, 'ta', $$14. பொழுதுபோக்கைத் தொழிலாக மாற்றியவர் யாராவது உண்டா?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question14$$, 'kn', $$ತಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ವೃತ್ತಿಯನ್ನಾಗಿ ಪರಿವರ್ತಿಸಿಕೊಂಡ ವ್ಯಕ್ತಿಯ ಬಗ್ಗೆ ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_help$$, $$question14$$, 'ta', $$தெரிந்த நபர் மற்றும் அவர்களின் தொழிலைப் பற்றிச் சுருக்கமாக எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- Summary questions (assessment_summary_templates JSONB)

UPDATE assessment_summary_templates
SET summary_questions = jsonb_build_object(
  'en', '{"question1":"Hobbies","question2":"I would like to turn this hobby into a career","question3":"Careers that match with these hobbies","question4":"People you know who have made their hobbies into careers","question5":"Talents","question6":"Do you want to turn your talent into a career?","question7":"Careers that match your talents","question8":"People you know who have turned their talents into careers"}'::jsonb,
  'kn', '{"question1":"ಹವ್ಯಾಸಗಳು","question2":"ಈ ಹವ್ಯಾಸವನ್ನು ವೃತ್ತಿ ಆಗಿಸಲು ಇಷ್ಟವೇ?","question3":"ಈ ಹವ್ಯಾಸಗಳೊಂದಿಗೆ ಹೊಂದಾಣಿಕೆಯಾಗಬಲ್ಲ ವೃತ್ತಿಗಳು","question4":"ತಮ್ಮ ಹವ್ಯಾಸಗಳನ್ನು ವೃತ್ತಿಗಳನ್ನಾಗಿ ಮಾಡಿಕೊಂಡಿರುವ ನಿಮಗೆ ಪರಿಚಿತವಿರುವ ವ್ಯಕ್ತಿಗಳು","question5":"ಪ್ರತಿಭೆಗಳು","question6":"ಪ್ರತಿಭೆಯನ್ನು ವೃತಿಯಾಗಿಸಲು ಇಷ್ಟವೇ?","question7":"ಪ್ರತಿಭೆಗಳೊಂದಿಗೆ ಹೊಂದಾಣಿಕೆಯಾಗಬಲ್ಲ ವೃತ್ತಿಗಳು","question8":"ತಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ವೃತ್ತಿಗಳನ್ನಾಗಿ ಮಾಡಿಕೊಂಡಿರುವ ನಿಮಗೆ ಪರಿಚಿತವಿರುವ ವ್ಯಕ್ತಿಗಳು"}'::jsonb,
  'ta', '{"question1":"திறமைகள்","question2":"இந்த திறமையை தொழிலாக மாற்ற விருப்பமா?","question3":"இந்த திறமைகளுடன் பொருந்தக்கூடிய தொழில்கள்","question4":"தங்கள் திறமைகளை தொழில்களாக மாற்றியுள்ள உங்களுக்கு அறிமுகமான நபர்கள்","question5":"திறமைகள்","question6":"இந்த திறமையை ஒரு தொழிலாக மாற்ற நீங்கள் விரும்புகிறீர்களா?","question7":"இந்த திறமைகளுடன் தொடர்புடைய தொழில்கள்","question8":"தங்கள் திறமைகளை தொழில்களாக மாற்றியுள்ள, நீங்கள் அறிந்த நபர்கள்"}'::jsonb
),
    updated_at = NOW()
WHERE assessment_type = 'hobbies';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question1$$, 'kn', $$ಹವ್ಯಾಸಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question1$$, 'ta', $$திறமைகள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question1$$, 'en', $$Hobbies$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question2$$, 'kn', $$ಈ ಹವ್ಯಾಸವನ್ನು ವೃತ್ತಿ ಆಗಿಸಲು ಇಷ್ಟವೇ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question2$$, 'ta', $$இந்த திறமையை தொழிலாக மாற்ற விருப்பமா?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question2$$, 'en', $$I would like to turn this hobby into a career$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question3$$, 'kn', $$ಈ ಹವ್ಯಾಸಗಳೊಂದಿಗೆ ಹೊಂದಾಣಿಕೆಯಾಗಬಲ್ಲ ವೃತ್ತಿಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question3$$, 'ta', $$இந்த திறமைகளுடன் பொருந்தக்கூடிய தொழில்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question3$$, 'en', $$Careers that match with these hobbies$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question4$$, 'kn', $$ತಮ್ಮ ಹವ್ಯಾಸಗಳನ್ನು ವೃತ್ತಿಗಳನ್ನಾಗಿ ಮಾಡಿಕೊಂಡಿರುವ ನಿಮಗೆ ಪರಿಚಿತವಿರುವ ವ್ಯಕ್ತಿಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question4$$, 'ta', $$தங்கள் திறமைகளை தொழில்களாக மாற்றியுள்ள உங்களுக்கு அறிமுகமான நபர்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question4$$, 'en', $$People you know who have made their hobbies into careers$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question5$$, 'kn', $$ಪ್ರತಿಭೆಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question5$$, 'ta', $$திறமைகள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question5$$, 'en', $$Talents$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question6$$, 'kn', $$ಪ್ರತಿಭೆಯನ್ನು ವೃತಿಯಾಗಿಸಲು ಇಷ್ಟವೇ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question6$$, 'ta', $$இந்த திறமையை ஒரு தொழிலாக மாற்ற நீங்கள் விரும்புகிறீர்களா?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question6$$, 'en', $$Do you want to turn your talent into a career?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question7$$, 'kn', $$ಪ್ರತಿಭೆಗಳೊಂದಿಗೆ ಹೊಂದಾಣಿಕೆಯಾಗಬಲ್ಲ ವೃತ್ತಿಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question7$$, 'ta', $$இந்த திறமைகளுடன் தொடர்புடைய தொழில்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question7$$, 'en', $$Careers that match your talents$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question8$$, 'kn', $$ತಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ವೃತ್ತಿಗಳನ್ನಾಗಿ ಮಾಡಿಕೊಂಡಿರುವ ನಿಮಗೆ ಪರಿಚಿತವಿರುವ ವ್ಯಕ್ತಿಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question8$$, 'ta', $$தங்கள் திறமைகளை தொழில்களாக மாற்றியுள்ள, நீங்கள் அறிந்த நபர்கள்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$hobbies_summary_question$$, $$question8$$, 'en', $$People you know who have turned their talents into careers$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- ============================================================================
-- ROLE_MODELS (9.6_My Role Models)
-- 17 main questions (shifted: intro removed, question19 removed), 0 summary questions
-- ============================================================================

-- Main questions: base table updates (English) + translations (Kannada, Tamil)

UPDATE role_models_questions SET question_text = $$Role model 1: What is the name and your relationship with them?$$, help_text = $$Write the name of your first role model and how they are related to you (parent, teacher, relative, etc.).$$ WHERE key = 'question1';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question1$$, 'kn', $$ಆದರ್ಶ ವ್ಯಕ್ತಿ 1 ನಮಗೆ ಹತ್ತಿರದ ಪರಿಚಿತ ವ್ಯಕ್ತಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question1$$, 'ta', $$முன்மாதிரி நபர் 1: அவரின் பெயர் மற்றும் உங்களுடன் உள்ள தொடர்பு என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question1$$, 'kn', $$ನಿಮ್ಮ ಮೊದಲ ಮಾದರಿ ವ್ಯಕ್ತಿಯ (Role model) ಹೆಸರು ಮತ್ತು ಅವರು ನಿಮಗೆ ಹೇಗೆ ಸಂಬಂಧಿಕರು (ಪೋಷಕರು, ಶಿಕ್ಷಕರು, ಸಂಬಂಧಿಕರು, ಇತ್ಯಾದಿ) ಎಂದು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question1$$, 'ta', $$நீங்கள் தேர்ந்தெடுத்த முதல் முன்மாதிரி நபரின் பெயர் மற்றும் அவர் உங்களுக்கு யார் (அப்பா, அம்மா, ஆசிரியர், உறவினர் போன்றவர்) என்பதை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE role_models_questions SET question_text = $$Role model 2: What is the name?$$, help_text = $$Write the name of the second role model. It may be someone you know.$$ WHERE key = 'question2';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question2$$, 'kn', $$ಆದರ್ಶ ವ್ಯಕ್ತಿ 2 ಪರಿಚಿತ ವ್ಯಕ್ತಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question2$$, 'ta', $$முன்மாதிரி நபர் 2: பெயர் என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question2$$, 'kn', $$ಎರಡನೇ ಮಾದರಿ ವ್ಯಕ್ತಿಯ ಹೆಸರನ್ನು ಬರೆಯಿರಿ. ಅವರು ನಿಮಗೆ ಪರಿಚಿತವಿರುವ ಯಾರಾದರೂ ಆಗಿರಬಹುದು.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question2$$, 'ta', $$இரண்டாவது முன்மாதிரி நபரின் பெயரை எழுதுங்கள். அவர் உங்களுக்குத் தெரிந்தவராக இருக்கலாம்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE role_models_questions SET question_text = $$Role model 3: What is the name? Is the person known to you or a famous person?$$, help_text = $$Mention whether the third role model is someone you know or a famous person.$$ WHERE key = 'question3';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question3$$, 'kn', $$ಆದರ್ಶ ವ್ಯಕ್ತಿ 3 ಪರಿಚಿತ/ಪ್ರಸಿದ್ಧ ವ್ಯಕ್ತಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question3$$, 'ta', $$முன்மாதிரி நபர் 3: பெயர் என்ன? அவர் அறிமுகமானவரா அல்லது பிரபலமானவரா?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question3$$, 'kn', $$ಮೂರನೇ ಮಾದರಿ ವ್ಯಕ್ತಿಯು ನಿಮಗೆ ತಿಳಿದಿರುವ ವ್ಯಕ್ತಿಯೇ ಅಥವಾ ಪ್ರಸಿದ್ಧ ವ್ಯಕ್ತಿಯೇ ಎಂದು ತಿಳಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question3$$, 'ta', $$மூன்றாவது முன்மாதிரி நபர் உங்களுக்கு தெரிந்தவரா அல்லது பிரபலமானவரா என்பதை குறிப்பிடுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE role_models_questions SET question_text = $$What is the name of your role model?$$, help_text = $$Write the full name of your role model.$$ WHERE key = 'question4';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question4$$, 'kn', $$ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳ ಹೆಸರು$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question4$$, 'ta', $$உங்கள் முன்மாதிரி நபரின் பெயர் என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question4$$, 'kn', $$ನಿಮ್ಮ ಮಾದರಿ ವ್ಯಕ್ತಿಯ ಪೂರ್ಣ ಹೆಸರನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question4$$, 'ta', $$முன்மாதிரி நபரின் முழுப் பெயரை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE role_models_questions SET question_text = $$Is the person a family member, relative, or someone you know?$$, help_text = $$Mention how the person is related to you.$$ WHERE key = 'question5';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question5$$, 'kn', $$ಇವರು ನಿಮ್ಮ ಕುಟುಂಬದವರೇ? ಸಂಬಂಧಿಕರೆ? ಪರಿಚಯದವರೇ? ತಿಳಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question5$$, 'ta', $$அவர் உங்கள் குடும்ப உறுப்பினரா, உறவினரா அல்லது அறிமுகமானவரா?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question5$$, 'kn', $$ಆ ವ್ಯಕ್ತಿಯು ನಿಮಗೆ ಹೇಗೆ ಸಂಬಂಧಪಟ್ಟವರು ಎಂದು ತಿಳಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question5$$, 'ta', $$அவர் உங்களுடன் எந்த வகை தொடர்பில் உள்ளார் என்பதை குறிப்பிடுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE role_models_questions SET question_text = $$What qualities do you like in your role model? Why are they special to you?$$, help_text = $$Think about qualities like hard work, honesty, and courage.$$ WHERE key = 'question6';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question6$$, 'kn', $$ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳಲ್ಲಿ ನೀವು ಮೆಚ್ಚುವ ಗುಣಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ ಹಾಗೂ ಅವರು ನಿಮಗೆ ವಿಶೇಷವಾಗಿ ಕಾಣುವ ಕಾರಣ ಹಂಚಿಕೊಳ್ಳಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question6$$, 'ta', $$உங்கள் முன்மாதிரி நபரின் எந்த பண்புகளை நீங்கள் விரும்புகிறீர்கள்? அவர்கள் உங்களுக்கு ஏன் சிறப்பாக தோன்றுகிறார்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question6$$, 'kn', $$ಕಠಿಣ ಪರಿಶ್ರಮ, ಪ್ರಾಮಾಣಿಕತೆ ಮತ್ತು ಧೈರ್ಯದಂತಹ ಗುಣಗಳ ಬಗ್ಗೆ ಯೋಚಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question6$$, 'ta', $$உழைப்பு, நேர்மை, தைரியம் போன்ற பண்புகளை நினைத்து எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE role_models_questions SET question_text = $$What work or profession does the person do?$$, help_text = $$Write their job or profession simply.$$ WHERE key = 'question7';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question7$$, 'kn', $$ಇವರು ಯಾವ ಕೆಲಸ/ ಉದ್ಯೋಗ ಮಾಡುತ್ತಿದ್ದಾರೆ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question7$$, 'ta', $$அவர் எந்த வேலை அல்லது தொழில் செய்கிறார்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question7$$, 'kn', $$ಅವರ ಉದ್ಯೋಗ ಅಥವಾ ವೃತ್ತಿಯ ಬಗ್ಗೆ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question7$$, 'ta', $$அவரின் வேலை அல்லது தொழிலை எளிமையாக எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE role_models_questions SET question_text = $$Which skill or talent of yours do you want to develop inspired by them?$$, help_text = $$Think about skills like studies, leadership, or communication.$$ WHERE key = 'question8';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question8$$, 'kn', $$ಇವರ ಪ್ರೇರಣೆಯಿಂದ ನಿಮ್ಮಲ್ಲಿರುವ ಯಾವ ಕೌಶಲ್ಯ ಅಥವಾ ಪ್ರತಿಭೆಯನ್ನು ಉತ್ತಮ ಪಡಿಸಿಕೊಳ್ಳಲು ಬಯಸುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question8$$, 'ta', $$அவரின் ஊக்கத்தால் உங்கள் எந்த திறன் அல்லது திறமையை வளர்க்க விரும்புகிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question8$$, 'kn', $$ಅವರಲ್ಲಿರುವ - ಅಧ್ಯಯನ, ನಾಯಕತ್ವ ಅಥವಾ ಸಂವಹನದಂತಹ ಕೌಶಲಗಳ ಬಗ್ಗೆ ಯೋಚಿಸಿ, ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question8$$, 'ta', $$படிப்பு, தலைமைத் திறன், பேசும் திறன் போன்றவற்றை யோசிக்கவும்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE role_models_questions SET question_text = $$Have you discussed your chosen career or job with your role model? What did you discuss?$$, help_text = $$Write if you discussed career choice, education path, or future plans.$$ WHERE key = 'question9';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question9$$, 'kn', $$ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳೊಂದಿಗೆ ನಿಮ್ಮ ಆಯ್ಕೆಯ ವೃತ್ತಿ/ ಉದ್ಯೋಗದ ಬಗ್ಗೆ ಚರ್ಚಿಸಿದಿರಾ? ಏನನ್ನು ಚರ್ಚಿಸಿದಿರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question9$$, 'ta', $$உங்கள் முன்மாதிரி நபருடன் நீங்கள் தேர்ந்தெடுத்த தொழில் அல்லது வேலை பற்றி பேசினீர்களா? என்ன பேசினீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question9$$, 'kn', $$ನೀವು ಮಾಡಲು ಬಯಸುವ ಉದ್ಯೋಗ, ಶಿಕ್ಷಣ ಅಥವಾ ಭವಿಷ್ಯದ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಚರ್ಚಿಸಿದ್ದೀರಾ ಎಂದು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question9$$, 'ta', $$வேலை தேர்வு, படிப்பு வழி, எதிர்கால திட்டங்கள் பற்றி பேசினீர்களா என்று எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE role_models_questions SET question_text = $$Have you taken advice or opinion from your role model about your dream plan?$$, help_text = $$Write whether you discussed your dream or future plan with them.$$ WHERE key = 'question10';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question10$$, 'kn', $$ಇಲ್ಲ ಎಂದರೆ, ಅವರೊಂದಿಗೆ ನಿಮ್ಮ ಕನಸಿನ ಯೋಜನೆ ಬಗ್ಗೆ ಅವರ ಅಭಿಪ್ರಾಯ ಪಡೆಯುವ ಯೋಚನೆ ಮಾಡಿದ್ದೀರಾ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question10$$, 'ta', $$உங்கள் கனவு திட்டம் குறித்து முன்மாதிரி நபரிடம் கருத்து கேட்டு ஆலோசனை பெற்றுள்ளீர்களா?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question10$$, 'kn', $$ನಿಮ್ಮ ಕನಸು ಅಥವಾ ಭವಿಷ್ಯದ ಯೋಜನೆಯ ಬಗ್ಗೆ ಅವರು ಏನು ಹೇಳುತ್ತಾರೆ ಎಂದು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question10$$, 'ta', $$உங்கள் கனவு, எதிர்கால திட்டம் பற்றி அவரிடம் பேசினீர்களா என்பதை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE role_models_questions SET question_text = $$What does your role model say about your dream job or career?$$, help_text = $$Mention whether they encouraged you or gave advice.$$ WHERE key = 'question11';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question11$$, 'kn', $$ನಿಮ್ಮ ಕನಸಿನ ಉದ್ಯೋಗ/ವೃತ್ತಿಯ ಬಗ್ಗೆ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳು ಏನು ಹೇಳುತ್ತಾರೆ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question11$$, 'ta', $$உங்கள் கனவு வேலை அல்லது தொழில் பற்றி முன்மாதிரி நபர் என்ன கூறுகிறார்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question11$$, 'kn', $$ಅವರು ನಿಮ್ಮನ್ನು ಪ್ರೋತ್ಸಾಹಿಸಿದರೇ ಅಥವಾ ಸಲಹೆ ನೀಡಿದರೇ ಎಂದು ತಿಳಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question11$$, 'ta', $$அவர் ஊக்குவித்தாரா, அறிவுரை கொடுத்தாரா என்பதை குறிப்பிடுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE role_models_questions SET question_text = $$Has any role model helped you in choosing your dream career?$$, help_text = $$Write who helped you and how they helped you.$$ WHERE key = 'question12';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question12$$, 'kn', $$ಯಾವುದಾದರೂ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳು ನಿಮ್ಮ ಕನಸಿನ ವೃತ್ತಿಯ ಆಯ್ಕೆಯಲ್ಲಿ ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಹುದೆ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question12$$, 'ta', $$எந்த முன்மாதிரி நபர் உங்கள் கனவு தொழில் தேர்வில் உங்களுக்கு உதவி செய்தாரா?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question12$$, 'kn', $$ನಿಮಗೆ ಯಾರು ಸಹಾಯ ಮಾಡಬಹುದು ಮತ್ತು ಅವರು ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು ಎಂದು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question12$$, 'ta', $$யார் உதவி செய்தார், எவ்வாறு உதவி செய்தார் என்பதை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE role_models_questions SET question_text = $$If yes, what kind of help do you expect?$$, help_text = $$Think about help like education, training, or guidance.$$ WHERE key = 'question13';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question13$$, 'kn', $$ಹೌದಾದಲ್ಲಿ, ನೀವು ಯಾವ ರೀತಿಯ ಸಹಾಯವನ್ನು ನಿರೀಕ್ಷಿಸುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question13$$, 'ta', $$ஆம் என்றால், நீங்கள் எந்த வகையான உதவியை எதிர்பார்க்கிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question13$$, 'kn', $$ಶಿಕ್ಷಣ, ತರಬೇತಿ ಅಥವಾ ಮಾರ್ಗದರ್ಶನ etc. ಯಾವುದು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question13$$, 'ta', $$படிப்பு, பயிற்சி, வழிகாட்டுதல் போன்ற உதவிகளை நினைத்து எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE role_models_questions SET question_text = $$Apart from the above questions, is there anything else you would like to say?$$, help_text = $$You may write any additional thoughts or opinions.$$ WHERE key = 'question14';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question14$$, 'kn', $$ಮೇಲಿನ ಪ್ರಶ್ನೆಗಳ ಹೊರತಾಗಿ ಏನನ್ನಾದರೂ ತಿಳಿಸಲು ಬಯಸುವಿರಾ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question14$$, 'ta', $$மேலுள்ள கேள்விகளுக்கு கூடுதலாக நீங்கள் வேறு ஏதாவது சொல்ல விரும்புகிறீர்களா?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question14$$, 'kn', $$ನೀವು ನಿಮ್ಮಇನ್ನಿತರ ಆಲೋಚನೆಗಳು ಅಥವಾ ಅಭಿಪ್ರಾಯಗಳನ್ನು ಬರೆಯಬಹುದು.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question14$$, 'ta', $$உங்கள் எண்ணங்கள் அல்லது கருத்துகளை சுதந்திரமாக எழுதலாம்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE role_models_questions SET question_text = $$Have you noticed any similarity or comparison between your personality and that of the above role models?$$, help_text = $$Think about common qualities, habits, or thoughts between you and your role model and write them.$$ WHERE key = 'question15';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question15$$, 'kn', $$ನಿಮ್ಮ ಹಾಗೂ ನೀವು ಆದರ್ಶವೆಂದು ಭಾವಿಸಿದ ಈ ಮೇಲಿನ ವ್ಯಕ್ತಿಗಳ ವ್ಯಕ್ತಿತ್ವದಲ್ಲಿರುವ ಹೋಲಿಕೆ ಅಥವಾ ಸಾಮ್ಯತೆಯನ್ನು ಗಮನಿಸಿದ್ದೀರಾ? ಏನದು?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question15$$, 'ta', $$நீங்கள் முன்மாதிரியாகக் கருதும் மேலுள்ள நபர்களின் பண்புகளுக்கும் உங்களுக்கும் இடையில் ஏதேனும் ஒற்றுமை அல்லது ஒப்பீட்டை கவனித்துள்ளீர்களா?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question15$$, 'kn', $$ನಿಮ್ಮ ಮತ್ತು ನಿಮ್ಮ ಮಾದರಿ ವ್ಯಕ್ತಿಯ ನಡುವಿನ ಸಮಾನ ಗುಣಗಳು, ಹವ್ಯಾಸಗಳು ಅಥವಾ ಆಲೋಚನೆಗಳ ಬಗ್ಗೆ ಯೋಚಿಸಿ ಮತ್ತು ಅವುಗಳನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question15$$, 'ta', $$உங்களுக்கும் உங்கள் முன்மாதிரி நபருக்கும் உள்ள ஒத்த குணங்கள், பழக்கங்கள் அல்லது எண்ணங்களை நினைத்து எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE role_models_questions SET question_text = $$How do you try to adopt the qualities of your role model in your life?$$, help_text = $$Write how you follow your role model’s good habits, discipline, and hard work in your life.$$ WHERE key = 'question16';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question16$$, 'kn', $$ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳ ಗುಣಗಳನ್ನು ನಿಮ್ಮ ಜೀವನದಲ್ಲಿ ಅಳವಡಿಸಿಕೊಳ್ಳಲು ನೀವು ಹೇಗೆ ಪ್ರಯತ್ನ ಮಾಡುವಿರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question16$$, 'ta', $$உங்கள் முன்மாதிரி நபரின் பண்புகளை உங்கள் வாழ்க்கையில் பின்பற்ற நீங்கள் எவ்வாறு முயற்சி செய்கிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question16$$, 'kn', $$ನಿಮ್ಮ ಮಾದರಿ ವ್ಯಕ್ತಿಯ ಒಳ್ಳೆಯ ಹವ್ಯಾಸಗಳು, ಶಿಸ್ತು ಮತ್ತು ಕಠಿಣ ಪರಿಶ್ರಮವನ್ನು ನಿಮ್ಮ ಜೀವನದಲ್ಲಿ ನೀವು ಹೇಗೆ ಅನುಸರಿಸುತ್ತೀರಿ ಎಂದು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question16$$, 'ta', $$உங்கள் முன்மாதிரி நபரின் நல்ல பழக்கங்கள், ஒழுக்கம், உழைப்பு போன்றவற்றை நீங்கள் எப்படி பின்பற்றுகிறீர்கள் என்பதை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

UPDATE role_models_questions SET question_text = $$Think about questions related to your future studies, job, or career choice and write them.$$ WHERE key = 'question17';
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question17$$, 'kn', $$ಸಾರಾಂಶ: ನನ್ನ ಮುಂದಿನ ಯೋಜನೆ$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_question$$, $$question17$$, 'ta', $$உங்கள் எதிர்கால படிப்பு, வேலை, தொழில் தேர்வு குறித்து சந்தேகமாக உள்ள கேள்விகளை நினைத்து எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_help$$, $$question17$$, 'ta', $$சுருக்கம்: என் எதிர்கால திட்டம்$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

-- Role models module intro text (from Excel SNo 1 instruction row)
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_module$$, $$intro$$, 'en', $$Answer the following questions about your chosen ideal person.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_module$$, $$intro$$, 'kn', $$ನಿಮ್ಮ ಆಯ್ಕೆಯ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳ ಕುರಿತು ಈ ಕೆಳಗಿನ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ:$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ($$role_models_module$$, $$intro$$, 'ta', $$நீங்கள் தேர்ந்தெடுத்த முன்மாதிரி நபரைப் பற்றி கீழே உள்ள கேள்விகளுக்கு பதிலளிக்கவும்.$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

COMMIT;
