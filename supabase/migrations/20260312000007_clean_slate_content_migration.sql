-- ============================================================
-- Clean Slate Content Migration
-- Generated: 2026-03-18T00:28:18.218Z
-- Source: scripts/sheet_dump_2026-03-18.json
-- ============================================================
-- This migration wipes and re-inserts ALL content_translations
-- and assessment_summary_templates for the 6 core assessments.
-- Safe for test environments only.
-- ============================================================

BEGIN;

-- ============================================================
-- STEP 0: Add 'hi' to content_translations lang CHECK constraint
-- ============================================================

ALTER TABLE content_translations
DROP CONSTRAINT IF EXISTS content_translations_lang_check;

ALTER TABLE content_translations
ADD CONSTRAINT content_translations_lang_check
CHECK (lang IN ('en', 'kn', 'ta', 'hi'));

-- ============================================================
-- STEP 1: DELETE existing content
-- ============================================================

DELETE FROM content_translations WHERE resource_type IN (
  'inspiration_module',
  'inspiration_question',
  'inspiration_help',
  'inspiration_summary_question',
  'inspiration_section',
  'about_me_module',
  'about_me_question',
  'about_me_help',
  'about_me_summary_question',
  'about_me_section',
  'dreams_module',
  'dreams_question',
  'dreams_help',
  'dreams_summary_question',
  'dreams_section',
  'school_learning_module',
  'school_learning_question',
  'school_learning_help',
  'school_learning_summary_question',
  'school_learning_section',
  'hobbies_module',
  'hobbies_question',
  'hobbies_help',
  'hobbies_summary_question',
  'hobbies_section',
  'role_models_module',
  'role_models_question',
  'role_models_help',
  'role_models_summary_question',
  'role_models_section',
  'role_models_questions',
  'school_learning_option',
  'school_learning_summary_help',
  'school_help',
  'school_question'
);

DELETE FROM assessment_summary_templates WHERE assessment_type IN (
  'inspiration', 'about_me', 'dreams', 'school_learning', 'hobbies', 'role_models'
);

-- ============================================================
-- STEP 2: INSERT content_translations
-- ============================================================

-- ------------------------------------------------------------
-- 9.1_My Inspiration (inspiration)
-- ------------------------------------------------------------

-- Module title
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_module', 'title', 'kn', $$ನನ್ನ ಪ್ರೇರಣೆ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_module', 'title', 'ta', $$என் உத்வேகம்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_module', 'title', 'en', $$My Inspiration$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_module', 'title', 'hi', $$मेरी प्रेरणा$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Title text (intro)
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_module', 'intro', 'kn', $$“ಪ್ರತಿಯೊಬ್ಬರೂ ಬೇರೆ, ಬೇರೆ ವಿಷಯಗಳಿಂದ ಪ್ರೇರಣೆ/ಸ್ಪೂರ್ತಿ ಪಡೆಯುತ್ತೇವೆ. ಈ ಪ್ರೇರಣೆ/ಸ್ಫೂರ್ತಿಗಳಿಂದ ನಾವು ಯಾವ ರೀತಿಯ ವ್ಯಕ್ತಿಯಾಗಲು ಬಯಸುತ್ತೇವೆ ಮತ್ತು ನಮ್ಮ ವೃತ್ತಿಜೀವನದಲ್ಲಿ ಅನುಸರಿಸಲು ಬಯಸುವ ಮೌಲ್ಯಗಳೇನು ಎಂಬ ಬಗ್ಗೆ ಅರಿವನ್ನು ಪಡೆಯುತ್ತೇವೆ. ನಮ್ಮನ್ನು ಪ್ರೇರೇಪಿಸುವ ಅಂಶವು, ನಾವು ಇಷ್ಟಪಡುವ ಗುಣಗಳು ಮತ್ತು ಮೌಲ್ಯಗಳನ್ನು ಪ್ರತಿಬಿಂಬಿಸುತ್ತದೆ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_module', 'intro', 'ta', $$நாம் ஒவ்வொருவரும் வெவ்வேறு மனிதர்களிடமிருந்தும், வெவ்வேறு விஷயங்களிலிருந்தும் ஊக்கம் பெறுகிறோம். அந்த ஊக்கத்தின் மூலம், நாம் எந்த மாதிரியான மனிதராக ஆக வேண்டும் என்பதையும், வாழ்க்கையில் நாம் பின்பற்ற விரும்பும் மதிப்புகள் என்ன என்பதையும் புரிந்துகொள்கிறோம். நமக்கு ஊக்கம் அளிக்கும் விஷயங்கள், நாம் விரும்பும் குணங்களையும் மதிப்புகளையும் காட்டுகின்றன.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_module', 'intro', 'en', $$Each of us gets inspiration from different people and different things. This inspiration helps us understand what kind of person we want to become and what values we want to follow in our life and work. The things that inspire us show the qualities and values that we like and respect.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_module', 'intro', 'hi', $$हम में से हर कोई अलग-अलग चीजों से प्रेरित होता है। जो हमें प्रेरित करता है, वह अक्सर हमारी पसंद और हमारे अच्छे मूल्यों (values) के बारे में बताता है। इन प्रेरणाओं का अन्वेषण करके, हम यह समझ पाते हैं कि हम किस तरह के व्यक्ति बनना चाहते हैं और अपने भविष्य के करियर में हम किन मूल्यों को अपनाना चाहते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Subtitle text
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_module', 'subtitle', 'kn', $$ಸೂಚನೆ: ಶಿಕ್ಷಕರ ಮಾರ್ಗದರ್ಶನ ಮತ್ತು ವಿವರಣೆ ನಂತರ, ವೀಡಿಯೋ/ಆಡಿಯೋ ನೋಡಿದ/ಕೇಳಿದ ನಂತರ ಯೋಚಿಸಿ ಪ್ರಶ್ನೆಗಳಿಗೆ ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_module', 'subtitle', 'ta', $$குறிப்பு: கல்வி வழிகாட்டியின் (Vidya Saathi) வழிகாட்டுதல் மற்றும் விளக்கத்திற்குப் பிறகு, காணொளிகளைப் பார்த்துவிட்டு, கீழே உள்ள கேள்விகளுக்கு உங்கள் பதில்களை எழுதுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_module', 'subtitle', 'en', $$Note: After the Vidya Saathi's guidance and explanation, watch the videos and then write your responses to the questions below.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_module', 'subtitle', 'hi', $$टिप्पणी: शिक्षक के मार्गदर्शन और स्पष्टीकरण के बाद, वीडियो देखें और फिर नीचे दिए गए प्रश्नों के उत्तर लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Summary title
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_module', 'summary_title', 'kn', $$ಸಾರಾಂಶ: ನಾನು ಸ್ಫೂರ್ತಿ ಪಡೆದ ಅಂಶಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_module', 'summary_title', 'ta', $$சுருக்கம்: எனக்கு ஊக்கம் அளித்தது$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_module', 'summary_title', 'en', $$Summary: Things that Inspired Me$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_module', 'summary_title', 'hi', $$सारांश: प्रेरणा के बिंदु$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Section titles
-- Questions (10 total)
-- Section: Section_1
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_1', 'kn', $$ಈ ವೀಡಿಯೋ / ಆಡಿಯೋದಲ್ಲಿ ನಿಮಗೆ ಹೆಚ್ಚು ಇಷ್ಟವಾದ / ಪ್ರೇರಣಾದಾಯಕ ಅಂಶಗಳು ಯಾವುವು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_1', 'ta', $$இந்த வீடியோ/ஆடியோவில் உங்களுக்கு மிகவும் பிடித்த பகுதி அல்லது உத்வேகத்தை அளித்தது எது?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_1', 'en', $$Which parts of this video/audio did you like the most or find inspiring?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_1', 'hi', $$इस वीडियो/ऑडियो के कौन से पहलू आपको सबसे अधिक पसंद आए या सबसे अधिक प्रेरणादायक लगे?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_1', 'kn', $$ವೀಡಿಯೊ/ಆಡಿಯೋದ ಯಾವ ಭಾಗವು ನಿಮಗೆ ಹೆಚ್ಚು ಸ್ಫೂರ್ತಿ ನೀಡಿತು ಎಂಬುದರ ಬಗ್ಗೆ ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_1', 'ta', $$இந்த வீடியோ/ஆடியோவில் எந்த பகுதி உங்களை அதிகம் ஊக்கமளித்தது?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_1', 'en', $$Which part of the video/audio inspired you most?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_1', 'hi', $$वीडियो या ऑडियो के उस हिस्से के बारे में लिखें जिसने आपको सबसे ज्यादा प्रेरित किया।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_2', 'kn', $$ಈ ವೀಡಿಯೋ/ಆಡಿಯೋದಲ್ಲಿ ನಿಮಗೆ ಯಾರ ನಡವಳಿಕೆ ಹೆಚ್ಚು ಇಷ್ಟವಾಯಿತು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_2', 'ta', $$இந்த வீடியோ/ஆடியோவில் உங்களுக்கு யாருடைய செயல் அல்லது பேசும் விதம் மிகவும் பிடித்தது? ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_2', 'en', $$Whose behavior or way of speaking did you like the most in this video/audio?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_2', 'hi', $$इस वीडियो/ऑडियो में आपको किसका व्यवहार (conduct) सबसे अधिक पसंद आया?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_2', 'kn', $$ಯಾರ ನಡವಳಿಕೆ ಅಥವಾ ನಡತೆ ನಿಮಗೆ ಹೆಚ್ಚು ಇಷ್ಟವಾಯಿತು ಎಂಬುದನ್ನು ಬಗ್ಗೆ ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_2', 'ta', $$யாருடைய செயல் அல்லது பேசும் விதம் உங்களுக்கு பிடித்தது என்பதை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_2', 'en', $$Whose behavior or speech did you like most?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_2', 'hi', $$लिखें कि किस व्यक्ति का व्यवहार या काम करने का तरीका आपको सबसे अच्छा लगा।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_3', 'kn', $$ಅವರಲ್ಲಿ ನೀವು ಗಮನಿಸಿದ ಗುಣಗಳು ಯಾವುವು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_3', 'ta', $$அவர்களில் நீங்கள் கவனித்த குணங்கள் என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_3', 'en', $$What qualities did you observe in them?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_3', 'hi', $$आप अपने जीवन में कौन से विशिष्ट गुण या मूल्य शामिल करना चाहेंगे?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_3', 'kn', $$ಪಾತ್ರಗಳಲ್ಲಿ ನೀವು ಗಮನಿಸಿದ ಉತ್ತಮ ಗುಣಗಳು ಯಾವವುಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_3', 'ta', $$இந்தக் கேள்வி, கதாபாத்திரங்களில் நீங்கள் கவனித்த நல்ல குணங்களை எழுதச் சொல்லுகிறது.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_3', 'en', $$This question asks you to write the good qualities you noticed in the characters.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_3', 'hi', $$वीडियो के पात्रों में आपने जो अच्छी खूबियाँ देखीं, उन्हें यहाँ लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_4', 'kn', $$ಅವುಗಳಲ್ಲಿನ ಯಾವ ಅಂಶ ನಿಮ್ಮ ಜೀವನದಲ್ಲಿ ಉತ್ತಮ ಬದಲಾವಣೆ ತರಬಹುದು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_4', 'ta', $$அந்த நபரின் எந்த குணம் உங்கள் வாழ்க்கையில் நல்ல மாற்றத்தை ஏற்படுத்தும்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_4', 'en', $$Which quality of the person can bring a positive change in your life?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_4', 'hi', $$उनमें से कौन सी बात आपके जीवन में सकारात्मक बदलाव ला सकती है?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_4', 'kn', $$ಆ ಗುಣಗಳಲ್ಲಿ ಯಾವುದು ನಿಮ್ಮ ಜೀವನದಲ್ಲಿ ಒಳ್ಳೆಯ ಬದಲಾವಣೆ ತರಲು ಸಹಾಯ ಮಾಡಬಹುದು ಎಂಬುದರ ಬಗ್ಗೆ ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_4', 'ta', $$அந்த நபரின் எந்த குணம் உங்களுக்கு உதவும் என்று எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_4', 'en', $$Write the quality that can help you bring a positive change in your life.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_4', 'hi', $$उन खूबियों में से कौन सी ऐसी है जिसे अपनाकर आप अपने जीवन को बेहतर बना सकते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_5', 'kn', $$ಯಾವ ಪಾತ್ರ ನಿಮಗೆ ಹೋಲಿಕೆಯಾಯಿತು ಎಂದು ಅನಿಸಿತು ಮತ್ತು ಅದಕ್ಕೆ ಕಾರಣಗಳನ್ನು ತಿಳಿಸುವಿರಾ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_5', 'ta', $$உங்களைப் போலவே இருக்கும் கதாபாத்திரம் எது என்று தோன்றுகிறது? அதற்கான காரணங்களைக் கூற முடியுமா?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_5', 'en', $$Which character did you find relatable to yourself, and can you explain the reasons for it?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_5', 'hi', $$आपको कौन सा पात्र (character) अपने जैसा लगा और क्यों?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_5', 'kn', $$ನಿಮ್ಮ ಸ್ವಭಾವವನ್ನೇ ಹೋಲುವ ಪಾತ್ರದ ಬಗ್ಗೆ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_5', 'ta', $$உங்கள் சுபாவத்தைப் போன்றே இருக்கும் கதாபாத்திரத்தைப் பற்றி எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_5', 'en', $$Write about the character that matches your own nature$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_5', 'hi', $$उस पात्र का नाम लिखें जिसका स्वभाव या आदतें आपसे मिलती-जुलती हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_6', 'kn', $$ನೀವು ನಿಜ ಜೀವನದಲ್ಲಿ ಮೆಚ್ಚುವ ಯಾವುದೇ ಮೌಲ್ಯಗಳನ್ನು ಎಂದಾದರೂ ಪ್ರದರ್ಶಿಸಿದ್ದೀರಾ? ಆ ಸನ್ನಿವೇಶವನ್ನು ಸಂಕ್ಷಿಪ್ತವಾಗಿ ವಿವರಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_6', 'ta', $$கதையில் உள்ள கதாபாத்திரம் போல நீங்கள் உண்மையான வாழ்க்கையில் யாருக்காவது உதவியிருக்கிறீர்களா? அந்த அனுபவத்தை சுருக்கமாக விவரித்து, அதைப் பற்றிச் சிந்தியுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_6', 'en', $$Have you ever demonstrated any of the values you admire in real life? Describe the situation briefly.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_6', 'hi', $$क्या आपने कभी वास्तविक जीवन में अपने किसी आदर्श मूल्य का प्रदर्शन किया है? उस स्थिति का संक्षेप में वर्णन करें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_6', 'kn', $$ಪಾತ್ರದಲ್ಲಿ ನೀವು ಇಷ್ಟಪಡುವ ಒಳ್ಳೆಯ ನಡತೆಯನ್ನು ನೀವು ಪ್ರದರ್ಶಿಸಿದ್ದೀರಾ ಎಂಬ ಬಗ್ಗೆ ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_6', 'ta', $$கதாபாத்திரத்தில் நீங்கள் விரும்பும் நல்ல நடத்தையை நீங்கள் காட்டியிருக்கிறீர்களா என்பதைப் பற்றி எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_6', 'en', $$Write about whether you have demonstrated the good behavior you liked in the character.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_6', 'hi', $$किसी ऐसी घटना के बारे में लिखें जहाँ आपने ईमानदारी या साहस जैसा कोई अच्छा गुण दिखाया हो।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_7', 'kn', $$ನಿವೇ ಆ ಪಾತ್ರಧಾರಿ ಆಗಿದ್ದರೆ ಏನು ಮಾಡುತ್ತಿದ್ದಿರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_7', 'ta', $$நீங்கள் அந்த கதாபாத்திரமாக இருந்தால், நீங்கள் என்ன செய்வீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_7', 'en', $$If you were that character, what would you do?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_7', 'hi', $$यदि आप उस पात्र की जगह होते, तो आप उस स्थिति में क्या करते?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_7', 'kn', $$ನಿವು ಇಷ್ಟಪಟ್ಟ ಪಾತ್ರ ನೀವೇ ಆದರೆ ನಿಮ್ಮ ವರ್ತನೆ ಹೇಗಿರುತ್ತಿತ್ತು? ಎಂಬ ಬಗ್ಗೆ ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_7', 'ta', $$நீங்கள் அந்த கதாபாத்திரமாக இருந்தால் என்ன செய்வீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_7', 'en', $$What would you do as the character?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_7', 'hi', $$कल्पना कीजिए कि आप उस स्थिति में हैं; आप उस समय कैसा व्यवहार करते या क्या निर्णय लेते?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_8', 'kn', $$ಈ ವಿಡಿಯೋ/ಆಡಿಯೋದಲ್ಲಿ ನೋಡಿರುವ ಹಾಗೆ ನಿಮ್ಮನ್ನು ಪ್ರೇರೇಪಿಸಿರುವ ವ್ಯಕ್ತಿ ಅಥವಾ ಸನ್ನಿವೇಶವನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_8', 'ta', $$இந்த வீடியோ/ஆடியோவில் ஏதாவது கதாபாத்திரம் உங்களை ஊக்கமளித்ததா? அந்த மனிதர் உங்களை ஊக்கமளிப்பவர் என்பதை விளக்கும் காரணத்தை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_8', 'en', $$In this video/audio, did any character inspire you? Write down what makes that person an inspiration to you$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_8', 'hi', $$इस वीडियो की तरह, क्या आपके जीवन में कोई ऐसी घटना या व्यक्ति है जिसने आपको प्रेरित किया हो?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_8', 'kn', $$ನಿಮಗೆ ಸ್ಫೂರ್ತಿ ನೀಡಿದ ಪಾತ್ರ ಮತ್ತು ಅದು ಹೇಗೆ ಸ್ಪೂರ್ತಿ ನೀಡಿದೆ? ಎಂಬುದರ ಬಗ್ಗೆ ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_8', 'ta', $$எந்த கதாபாத்திரம் உங்களை ஊக்கமளித்தது? ஏன்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_8', 'en', $$Write about the character that inspired you and how it inspired you.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_8', 'hi', $$अपने जीवन की किसी ऐसी घटना या व्यक्ति का नाम लिखें जिससे आपको आगे बढ़ने की सीख मिली हो।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_9', 'kn', $$ಆ ಪಾತ್ರಗಳಿಂದ ಯಾವ ಹೊಸ ಅಂಶಗಳನ್ನು ನಿಮ್ಮ ಜೀವನದಲ್ಲಿ ಅಳವಡಿಸಿಕೊಳ್ಳಲು ಬಯಸುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_9', 'ta', $$அந்த கதாபாத்திரத்தின் எந்த குணத்தை நீங்கள் உண்மையான வாழ்க்கையில் பின்பற்ற விரும்புகிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_9', 'en', $$Which quality of that character would you like to follow in real life?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_9', 'hi', $$उन पात्रों से आप अपने जीवन में कौन सी नई बातें अपनाना चाहेंगे?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_9', 'kn', $$ಅದರಲ್ಲಿನ ಯಾವ ಗುಣವನ್ನು ನೀವು ಅನುಸರಿಸುತ್ತೀರಿ? ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_9', 'ta', $$நீங்கள் எந்த குணத்தை பின்பற்ற விரும்புகிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_9', 'en', $$Which quality will you follow?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_9', 'hi', $$उन पात्रों की कौन सी अच्छी आदत आप अपने खुद के जीवन में शुरू करना चाहते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_10', 'kn', $$ನೀವು ಹಂಚಿಕೊಳ್ಳಬಹುದಾದ ಇನ್ನೇನಾದರೂ ಹೆಚ್ಚಿನ ಅಂಶಗಳನ್ನು ಗಮನಿಸಿದ್ದರೆ ಅದನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_10', 'ta', $$கதாபாத்திரத்தின் வேறு ஏதாவது குணம் உங்களுக்கு பிடித்திருந்தால், அதை எழுதுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_10', 'en', $$If there are any additional points you noticed that you can share, write them down.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_question', 'question_10', 'hi', $$क्या आपने कुछ और भी गौर किया है जिसे आप साझा करना चाहते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_10', 'kn', $$ನೀವು ಇಷ್ಟಪಟ್ಟ ಪಾತ್ರದ ಯಾವುದೇ ಇತರ ಗುಣವನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_10', 'ta', $$கதாபாத்திரத்தின் மற்றொரு பிடித்த குணத்தை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_10', 'en', $$Write any other quality of the character you liked.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_help', 'question_10', 'hi', $$अपने पसंदीदा पात्र या वीडियो के बारे में कोई अन्य खास बात यहाँ लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Summary questions (3 total)
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_summary_question', 'summary_question_1', 'kn', $$ಈ ಎಲ್ಲಾ ವಿಡಿಯೋಗಳನ್ನು ನೋಡಿದಾಗ ಮತ್ತು ಸ್ವಂತ ಅನುಭವದಿಂದ ನೀವು ಸ್ಪೂರ್ತಿ ಪಡೆದ ಅಂಶಗಳನ್ನು ಪಟ್ಟಿಮಾಡಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_summary_question', 'summary_question_1', 'ta', $$இந்த அனைத்து வீடியோக்களையும் பார்த்த பிறகு, உங்கள் அனுபவத்தில் உங்களை ஊக்கமளித்த முக்கியமானவற்றை பட்டியலிடுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_summary_question', 'summary_question_1', 'en', $$After watching all these videos, list the points that inspired you from your experience$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_summary_question', 'summary_question_1', 'hi', $$इन सभी वीडियो को देखने के बाद और अपने स्वयं के अनुभवों से आपने जो प्रेरणा ली है, उसकी सूची बनाएं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_summary_question', 'summary_question_2', 'kn', $$ಈ ಎಲ್ಲಾ ವಿಡಿಯೋಗಳನ್ನು ನೋಡಿದಾಗ ಮತ್ತು ನಿಮಗೆ ಅನಿಸುತ್ತಿರುವ - ನಿಮ್ಮಲ್ಲಿ ಇರಬಾರದೆನಿಸಿದ ನಡವಳಿಕೆಗಳು ಯಾವವು? ಅದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_summary_question', 'summary_question_2', 'ta', $$இந்த வீடியோக்களைப் பார்த்த பிறகு, உங்களிடம் இருக்கக்கூடாது என்று நீங்கள் நினைக்கும் பழக்கவழக்கங்கள்/நடத்தைகள் எவை?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_summary_question', 'summary_question_2', 'en', $$After watching these videos, which behaviors do you feel you should not have?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_summary_question', 'summary_question_2', 'hi', $$इन सभी वीडियो को देखने के बाद, आपको अपने व्यवहार में कौन सी बातें पसंद नहीं आईं या आप उन्हें बदलना चाहते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_summary_question', 'summary_question_3', 'kn', $$ನಿಮ್ಮ ಗೆಳೆಯೊರೊಂದಿಗೆ, ಈ ವಿಡಿಯೋಗಳಲ್ಲಿನ ನಿಮಗೆ ಪ್ರೇರಣೆ ನೀಡಿದ ಪಾತ್ರಗಳು ಮತ್ತು ನಿಮ್ಮ ನಿಜ ಜೀವನದಲ್ಲಿ ನಿಮಗೆ ಸ್ಪೂರ್ತಿ ನೀಡಿದ ವ್ಯಕ್ತಿಗಳಿಗೂ ಇರುವ ಹೋಲಿಕೆಗಳನ್ನು ಕುರಿತು ಚರ್ಚಿಸಿ. ಆ ಸಾರಾಂಶವನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_summary_question', 'summary_question_3', 'ta', $$உங்கள் நண்பர்களுடன், இந்த வீடியோவில் உங்களுக்கு ஊக்கமளித்த பாத்திரம் யார், மேலும் அது உங்கள் நிஜ வாழ்க்கையில் உங்களுக்கு ஊக்கமளிக்கும் நபர்களுக்கும் இடையிலான ஒற்றுமைகளைப் பற்றி விவாதிக்கவும்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_summary_question', 'summary_question_3', 'en', $$Discuss with your friend about the similarities between the characters in the video and the people who inspire you in real life.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('inspiration_summary_question', 'summary_question_3', 'hi', $$अपने दोस्तों के साथ चर्चा करें कि इन वीडियो के प्रेरणादायक पात्रों और आपके वास्तविक जीवन के प्रेरणादायक व्यक्तियों के बीच क्या समानताएं हैं। उस चर्चा का सारांश लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;


-- ------------------------------------------------------------
-- 9.2_About Me (about_me)
-- ------------------------------------------------------------

-- Module title
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_module', 'title', 'kn', $$ನನ್ನ ಬಗ್ಗೆ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_module', 'title', 'ta', $$என்னைப் பற்றி$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_module', 'title', 'en', $$About Me$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_module', 'title', 'hi', $$मेरे बारे में$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Title text (intro)
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_module', 'intro', 'kn', $$ಈ ಚಟುವಟಿಕೆಯ ಭಾಗವಾಗಿ, ನಿಮ್ಮ ಬಗ್ಗೆ ವಿಚಾರ ಮಾಡುತ್ತೀರಿ. ನೀವು ಏನನ್ನು ಚೆನ್ನಾಗಿ ಮಾಡಬಲ್ಲಿರಿ, ನಿಮಗೆ ಏನು ಮಾಡುವುದು ಇಷ್ಟ, ಕಷ್ಟ, ಮುಂತಾದವುಗಳನ್ನು ಇಲ್ಲಿ ಬರೆಯುತ್ತೀರಿ. ಈ ಚಟುವಟಿಕೆ ನಿಮ್ಮನ್ನು ನೀವು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಹಾಗೂ ಸುಧಾರಿಸಿಕೊಳ್ಳಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ. (ನಿಮ್ಮ ಕುಟುಂಬ, ಶಿಕ್ಷಕರು, ಸ್ನೇಹಿತರು ಮುಂತಾದವರೊಂದಿಗೆ ಮಾತನಾಡಿ ಅಗತ್ಯವಿರುವಲ್ಲಿ ಅವರಿಂದ ಸಹಾಯ, ಸಲಹೆಗಳನ್ನು ಪಡೆಯಿರಿ)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_module', 'intro', 'ta', $$இந்தச் செயல்பாட்டின் ஒரு பகுதியாக, உங்களைப் பற்றி நீங்கள் சிந்திப்பீர்கள். நீங்கள் எதைச் சிறப்பாகச் செய்ய முடியும், உங்களுக்கு என்ன செய்ய பிடிக்கும், எது கடினமாக உள்ளது என்பது போன்றவற்றை இங்கே எழுதுவீர்கள். இந்தச் செயல்பாடு உங்களைப் பற்றி நீங்களே புரிந்துகொள்ளவும், உங்களை மேம்படுத்திக்கொள்ளவும் உதவும். (உங்கள் குடும்பத்தினர், ஆசிரியர்கள், நண்பர்கள் போன்றவர்களிடம் பேசி, தேவையான இடங்களில் அவர்களிடம் உதவி மற்றும் ஆலோசனைகளைப் பெறுங்கள்).$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_module', 'intro', 'en', $$As part of this activity, you will reflect on yourself. Write here about what you can do well, what you like to do, what you find difficult, and so on. This activity will help you understand yourself better and improve. (Talk to your family, teachers, friends, etc., and seek their help or advice wherever necessary).$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_module', 'intro', 'hi', $$इस गतिविधि के हिस्से के रूप में, आप अपने बारे में विचार करेंगे। आप क्या अच्छी तरह से कर सकते हैं, आपको क्या करना पसंद है, क्या कठिन लगता है, आदि के बारे में यहाँ लिखें। यह गतिविधि आपको खुद को समझने और सुधारने में मदद करेगी। (अपने परिवार, शिक्षकों, दोस्तों आदि से बात करें और जहाँ आवश्यक हो उनसे सहायता और सलाह लें)।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Summary title
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_module', 'summary_title', 'kn', $$ಸಾರಾಂಶ: ನನ್ನ ಮುಂದಿನ ಯೋಜನೆ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_module', 'summary_title', 'ta', $$சுருக்கம்: எனது எதிர்காலத் திட்டம்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_module', 'summary_title', 'en', $$Summary: My Future Plan$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_module', 'summary_title', 'hi', $$सारांश: मेरी अगली योजना$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Summary subtitle
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_module', 'summary_subtitle', 'kn', $$ವೈಯಕ್ತಿಕ ಪ್ರೊಫೈಲ್ ಅಥವಾ ನಿಮ್ಮದೇ ವ್ಯಕ್ತಿಚಿತ್ರ ಸಿದ್ಧಪಡಿಸಿ. ಮೇಲೆ ನಿಮ್ಮ ಬಗ್ಗೆ ನೀವು ಬರೆದ ಅಂಶಗಳನ್ನು ಒಂದು ಅಥವಾ ಕೆಲವು ಪದಗಳಲ್ಲಿ ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_module', 'summary_subtitle', 'ta', $$ஒரு தனிப்பட்ட சுயவிவரம் அல்லது உங்கள் சொந்த சுயப்படத்தை தயாரிக்கவும்.மேலே உங்களைப் பற்றி நீங்கள் எழுதிய அம்சங்களை ஒரு அல்லது சில சொற்களில் சுருக்கமாக எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_module', 'summary_subtitle', 'en', $$Prepare a personal profile or your own self-portrait.Summarize the points you wrote about yourself above in one or a few words.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_module', 'summary_subtitle', 'hi', $$व्यक्तिगत प्रोफ़ाइल या अपना स्वयं का चित्र तैयार करें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Section titles
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_section', 'section_1_title', 'kn', $$ನನ್ನ ವೈಯಕ್ತಿಕ ಸ್ಥಳ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_section', 'section_1_title', 'ta', $$தனிப்பட்ட விவரங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_section', 'section_1_title', 'en', $$My Personal Space$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_section', 'section_1_title', 'hi', $$मेरा निजी दुनिया$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_section', 'section_2_title', 'kn', $$ನೀವು ಸಂತೋಷದಿಂದ ಮಾಡುವ ಕೆಲಸಗಳು : (ಒಂದಕ್ಕಿಂತ ಹೆಚ್ಚು ಪ್ರಶ್ನೆಗಳಿಗೆ ನೀವು ನೀಡುವ ಉತ್ತರ ಒಂದೇ ಆಗಿರಬಹುದು)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_section', 'section_2_title', 'ta', $$நீங்கள் மகிழ்ச்சியுடன் செய்யும் வேலைகள்: (ஒன்றுக்கும் மேற்பட்ட கேள்விகளுக்கு உங்கள் பதில் ஒன்றாகவே இருக்கலாம்)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_section', 'section_2_title', 'en', $$Activities You Enjoy (Answers to more than one question below can be the similar)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_section', 'section_2_title', 'hi', $$वे काम जो आप खुशी से करते है$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_section', 'section_3_title', 'kn', $$ನಿಮಗೆ ಕಷ್ಟವೆನಿಸುವ ಕೆಲಸ/ಚಟುವಟಿಕೆಗಳು:$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_section', 'section_3_title', 'ta', $$நீங்கள் சவாலாகக் கருதும் பணிகள் அல்லது செயல்பாடுகள்:$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_section', 'section_3_title', 'en', $$Tasks or activities you find challenging:$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_section', 'section_3_title', 'hi', $$वे कार्य या गतिविधियां जो आपको मुश्किल लगती हैं:$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_section', 'section_4_title', 'kn', $$ನಿಮ್ಮ ಬಗ್ಗೆ ಇನ್ನಷ್ಟು ವಿಚಾರಗಳನ್ನು ತಿಳಿಯಲು ಈ ಕೆಳಗಿನ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_section', 'section_4_title', 'ta', $$உங்களைப் பற்றி மேலும் அறிய பின்வரும் கேள்விகளு
க்குப் பதிலளிக்கவும்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_section', 'section_4_title', 'en', $$Let's delve deeper into understanding more about you.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_section', 'section_4_title', 'hi', $$अपने बारे में और अधिक जानें$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Questions (19 total)
-- Section: My Personal Space
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_1', 'kn', $$ನಿಮ್ಮ ಕುಟುಂಬದಲ್ಲಿ ಯಾರೊಂದಿಗೆ ನೀವು ಭಯ/ಸಂಕೋಚವಿಲ್ಲದೆ ಮುಕ್ತವಾಗಿ ನಿಮ್ಮ ಅಭಿಪ್ರಾಯಗಳನ್ನು ಹಾಗೂ ಭಾವನೆಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಬಲ್ಲಿರಿ? ಮತ್ತು ಅವರೊಂದಿಗೆ ನಿಮಗೆ ಅಷ್ಟು ವಿಶ್ವಾಸವೇಕೆ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_1', 'ta', $$உங்கள் குடும்பத்தில், பயம் அல்லது தயக்கம் இல்லாமல் உங்கள் கருத்துகளையும் உணர்வுகளையும் யாருடன் சுதந்திரமாகப் பகிர்ந்து கொள்ள முடியும்? அவர்கள் மீது உங்களுக்கு ஏன் அவ்வளவு நம்பிக்கை?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_1', 'en', $$In your family, with whom can you freely share your opinions and feelings without fear or hesitation? And why do you trust them so much?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_1', 'hi', $$अपने परिवार में, आप किसके साथ बिना किसी डर या संकोच के अपने विचारों और भावनाओं को खुलकर साझा कर सकते हैं? और आपको उन पर इतना भरोसा क्यों है?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_1', 'kn', $$ನಿಮ್ಮ ಮನೆಯಲ್ಲಿ ಯಾರೊಂದಿಗೆ ನೀವು ಮುಕ್ತವಾಗಿ ಮಾತನಾಡಬಹುದು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_1', 'ta', $$நீங்கள் பாதுகாப்பாக பேச முடியும் என்ற குடும்ப உறுப்பினரை தேர்வு செய்யவும்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_1', 'en', $$Choose the family member you feel safest talking to.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_1', 'hi', $$लिखें कि आप अपने घर में किसके साथ सबसे खुलकर बात कर सकते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_2', 'kn', $$ನಿಮ್ಮ ಕುಟುಂಬದವರನ್ನು ಬಿಟ್ಟು ಬೇರೆ ಯಾರೊಂದಿಗೆ ನೀವು ಭಯ / ಸಂಕೋಚವಿಲ್ಲದೆ ಮುಕ್ತವಾಗಿ ನಿಮ್ಮ ಅಭಿಪ್ರಾಯಗಳನ್ನು ಹಾಗೂ ಭಾವನೆಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಬಲ್ಲಿರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_2', 'ta', $$உங்கள் குடும்பத்தினரைத் தவிர, பயம் அல்லது தயக்கம் இல்லாமல் உங்கள் கருத்துகளையும் உணர்வுகளையும் யாருடன் சுதந்திரமாக பகிர்ந்து கொள்ள முடியும்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_2', 'en', $$Other than your family members, with whom can you freely share your opinions and feelings without fear or hesitation?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_2', 'hi', $$परिवार के सदस्यों को छोड़कर, और कौन है जिसके साथ आप अपने विचारों और भावनाओं को खुलकर साझा कर सकते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_2', 'kn', $$ಮನೆಯವರ ಹೊರತು ಇನ್ನಾರು ನಿಮ್ಮ ಮಾತು ಕೇಳುತ್ತಾರೆ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_2', 'ta', $$உங்கள் குடும்பத்திற்கு வெளியே, நீங்கள் நம்பி நிம்மதியாக பேச முடியும் நபரை நினைத்துப் பதிலளிக்கவும்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_2', 'en', $$Think about someone outside your family whom you trust and feel comfortable talking to.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_2', 'hi', $$परिवार के अलावा और कौन आपकी बात ध्यान से सुनता है, उनका नाम लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_3', 'kn', $$ಮನೆಯಲ್ಲಿ ನೀವು ಮಾಡುವ ಕೆಲಸಗಳು ಯಾವುವು? 
 (ಉದಾ: ಕೃಷಿ ಚಟುವಟಿಕೆಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡುವುದು, ಅಂಗಡಿಯಿಂದ ತರಕಾರಿ, ಕಿರಾಣಿ ಸಾಮಗ್ರಿಗಳನ್ನು ತರುವುದು, ದನ-ಕರುಗಳ, ಪ್ರಾಣಿಗಳ ಆರೈಕೆ, ನೀರು ತುಂಬಿಸುವುದು ಇತ್ಯಾದಿ)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_3', 'ta', $$வீட்டில் நீங்கள் செய்யும் வேலைகள் என்னென்ன?
(உதா: விவசாயப் பணிகளில் உதவுதல், கடையிலிருந்து காய்கறிகள் மற்றும் மளிகைப் பொருட்கள் வாங்கி வருதல், பணம் தொடர்பான வேலைகள், விலங்குகளை  பராமரித்தல், தண்ணீர் நிரப்புதல் போன்றவை)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_3', 'en', $$What are the tasks you do at home?
(e.g., helping in agricultural activities, bringing vegetables and groceries from the shop, money-related work, taking care of animals, filling water, etc.)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_3', 'hi', $$3. आप घर पर कौन-कौन से काम करते हैं? (उदाहरण: खेती में मदद करना, दुकान से सामान लाना, पशुओं की देखभाल, पानी भरना आदि)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_3', 'kn', $$ನೀವು ಮನೆಯಲ್ಲಿ ಮಾಡುವ ಕೆಲಸಗಳು ಯಾವುವು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_3', 'ta', $$வீட்டில் நீங்கள் தினமும் செய்யும்  வேலைகளை நினைத்து பதிலளிக்கவும்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_3', 'en', $$Think about the daily work you help with at home.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_3', 'hi', $$आप घर पर नियमित रूप से जो भी काम करते हैं, उनके बारे में लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Section: Activities You Enjoy (Answers to more than one question below can be the similar)
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_4', 'kn', $$ನೀವು ಇಷ್ಟಪಟ್ಟು ಮಾಡುವ ಕೆಲಸಗಳು:$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_4', 'ta', $$நீங்கள் விரும்பி செய்யும் வேலைகள்:$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_4', 'en', $$Activities you find most enjoyable and fulfilling:$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_4', 'hi', $$वे काम जो आप पसंद से करते हैं:$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_4', 'kn', $$ಶಾಲೆಯಲ್ಲಿ ನಿಮಗೆ ಇಷ್ಟವಾಗುವ ವಿಷಯಗಳು ಅಥವಾ ಕೆಲಸಗಳು ಯಾವುವು? 
 ಶಾಲೆ ಮುಗಿದ ನಂತರ ಅಥವಾ ಶಾಲೆಗೆ ಮೊದಲು ನೀವು ಏನು ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತೀರಿ? 
ಎಂಬುದರ ಬಗ್ಗೆ ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_4', 'ta', $$பள்ளி நேரத்திலும் , பள்ளிக்குப் பிறகும் நீங்கள் விரும்பி செய்யும் செயல்களை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_4', 'en', $$Write the activities you enjoy doing during and after school.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_4', 'hi', $$स्कूल में आपको कौन से विषय या गतिविधियाँ पसंद हैं? स्कूल के अलावा खाली समय में आप क्या करना पसंद करते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_5', 'kn', $$ನೀವೊಬ್ಬರೇ ಸ್ವತಂತ್ರವಾಗಿ ಮಾಡಲು ಇಷ್ಟಪಡುವ ಕೆಲಸಗಳು ಯಾವುವು? (ಪ್ರತ್ಯೇಕವಾಗಿ ಒಬ್ಬರೇ ನಿರ್ವಹಿಸುವ ಕಾರ್ಯಗಳು)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_5', 'ta', $$நீங்கள் சுயமாக செய்ய விரும்பும் வேலைகள் என்னென்ன?
(தனியாகவே செய்து முடிக்கும் பணிகள்)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_5', 'en', $$What are the activities you like to do alone, independently?
(Tasks you do by yourself)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_5', 'hi', $$ऐसे कौन से काम हैं जो आप अकेले स्वतंत्र रूप से करना पसंद करते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_5', 'kn', $$ನೀವು ಒಬ್ಬರೇ ಏನು ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತೀರಿ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_5', 'ta', $$நீங்கள் தனியாக செய்து மகிழும் செயல்களை நினைத்து பதிலளிக்கவும்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_5', 'en', $$Think about activities you enjoy doing by yourself.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_5', 'hi', $$उन कामों के बारे में लिखें जिन्हें आप बिना किसी की मदद के अकेले करना पसंद करते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_6', 'kn', $$ನೀವು ಗುಂಪಿನಲ್ಲಿ / ನಿಮ್ಮ ಸ್ನೇಹಿತರೊಂದಿಗೆ ಯಾವ ಕೆಲಸಗಳನ್ನು ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_6', 'ta', $$நீங்கள் குழுவாக அல்லது உங்கள் நண்பர்களுடன் செய்ய விரும்பும் செயல்கள் என்னென்ன?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_6', 'en', $$What activities do you like to do in a group or with your friends?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_6', 'hi', $$आप समूह में या अपने दोस्तों के साथ कौन से काम करना पसंद करते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_6', 'kn', $$ನಿಮ್ಮ ಸ್ನೇಹಿತರ ಜೊತೆ ನೀವು ಏನು ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತೀರಿ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_6', 'ta', $$நண்பர்களுடன் சேர்ந்து செய்ய விரும்பும் செயல்களை நினைத்து பதிலளிக்கவும்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_6', 'en', $$Think about activities you enjoy doing with friends.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_6', 'hi', $$अपने दोस्तों के साथ मिलकर आप कौन सी गतिविधियाँ करना पसंद करते हैं, उनके बारे में लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Section: Tasks or activities you find challenging:
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_7', 'kn', $$ನಿಮಗೆ ಶಾಲೆಯಲ್ಲಿ ಕಷ್ಟವೆನಿಸುವ ಚಟುವಟಿಕೆಗಳು ಯಾವುವು? ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_7', 'ta', $$பள்ளியில் உங்களுக்கு கடினமாக தோன்றும் செயல்கள் என்னென்ன? எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_7', 'en', $$What activities do you find difficult at school? Write them.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_7', 'hi', $$स्कूल में आपको कौन सी गतिविधियाँ या विषय कठिन लगते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_7', 'kn', $$ಶಾಲೆಯಲ್ಲಿ ನಿಮಗೆ ಕಷ್ಟವಾಗುವ ವಿಷಯಗಳು ಯಾವುವು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_7', 'ta', $$பள்ளியில் உங்களுக்கு கடினமாக இருக்கும் செயல்களை நினைத்து பதிலளிக்கவும்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_7', 'en', $$Think about school activities that are hard for you.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_7', 'hi', $$स्कूल की उन चीजों के बारे में लिखें जिन्हें करने में आपको मुश्किल आती है।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_8', 'kn', $$ಶಾಲೆಯ ಕೆಲಸ / ಚಟುವಟಿಕೆಗಳನ್ನು ಹೊರತುಪಡಿಸಿ ನಿಮಗೆ ಕಷ್ಟಕರವಾದ ಇನ್ನುಳಿದ ಕೆಲಸಗಳು ಯಾವವು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_8', 'ta', $$பள்ளி வேலைகள் / செயல்களைத் தவிர, உங்களுக்கு கடினமாக இருக்கும் மற்ற வேலைகள் என்னென்ன?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_8', 'en', $$Apart from school work or activities, what other tasks do you find difficult?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_8', 'hi', $$स्कूल के कामों के अलावा, आपको अन्य कौन से काम कठिन लगते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_8', 'kn', $$ಶಾಲೆಯ ಹೊರತುಪಡಿಸಿ ನಿಮಗೆ ಕಷ್ಟವಾಗುವ ಕೆಲಸಗಳು ಯಾವುವು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_8', 'ta', $$பள்ளிக்கு வெளியே உங்களுக்கு கடினமாக இருக்கும் வேலைகளை நினைத்து பதிலளிக்கவும்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_8', 'en', $$Think about tasks outside school that you find difficult.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_8', 'hi', $$स्कूल के बाहर के उन कामों के बारे में लिखें जो आपको चुनौतीपूर्ण लगते हैं$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_9', 'kn', $$ನೀವು ಮಾಡಲು ಇಷ್ಟ ಪಡದ ಆದರೆ ಮಾಡಲೇಬೇಕಾದ ಕೆಲಸಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_9', 'ta', $$உங்களுக்குப் பிடிக்காத ஆனால் நீங்கள் செய்ய வேண்டிய வேலைகளைப் பட்டியலிடுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_9', 'en', $$List the tasks that you don't like doing but have to do.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_9', 'hi', $$उन कामों की सूची बनाएं जो आपको पसंद नहीं हैं लेकिन आपको करने ही पड़ते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_9', 'kn', $$ನಿಮಗೆ ಇಷ್ಟವಿಲ್ಲದರೂ ಮಾಡಲೇಬೇಕಾದ ಕೆಲಸಗಳು ಯಾವುವು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_9', 'ta', $$நீங்கள் தனியாக செய்து மகிழும் செயல்களை நினைத்து பதிலளிக்கவும்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_9', 'en', $$Write about the tasks you have to do even if you don't like them.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_9', 'hi', $$ऐसे कामों के बारे में लिखें जिन्हें आप मजबूरी में या जिम्मेदारी समझकर करते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_10', 'kn', $$ನೀವು ಮಾಡುವ ಕೆಲಸ/ಚಟುವಟಿಕೆಗಳಲ್ಲಿ, ಸಹಜವಾಗಿ ತೊಡಗಿಸಿಕೊಳ್ಳುವ ಕೆಲಸ/ಚಟುವಟಿಕೆಗಳನ್ನು ಪಟ್ಟಿಮಾಡಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_10', 'ta', $$நீங்கள் செய்யும் வேலைகளில், நீங்கள் இயல்பாகவே/ஈடுபாட்டுடன் செய்யும் செயல்களைப் பட்டியலிடுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_10', 'en', $$List the activities that you get involved in naturally/effortlessly.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_10', 'hi', $$अपनी उन गतिविधियों की सूची बनाएं जिनमें आप स्वाभाविक रूप से (आसानी से) शामिल हो जाते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_10', 'kn', $$ನೀವು ಸುಲಭವಾಗಿ ಮಾಡುವ ಕೆಲಸಗಳು ಯಾವುವು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_10', 'ta', $$நீங்கள் எளிதாகச் செய்யும் வேலைகளை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_10', 'en', $$Write about the tasks that come easily to you.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_10', 'hi', $$उन कामों के बारे में लिखें जिन्हें आप बहुत सहजता और आसानी से कर लेते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_11', 'kn', $$ನೀವು ಮಾಡುವ ಕೆಲಸ/ಚಟುವಟಿಕೆಗಳಲ್ಲಿ, ಸಹಜವಾಗಿ ಮಾಡಲು ಬಾರದ ಕೆಲಸ/ಚಟುವಟಿಕೆಗಳನ್ನು ಪಟ್ಟಿಮಾಡಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_11', 'ta', $$நீங்கள் செய்யும் வேலைகளில், உங்களுக்கு இயல்பாக வராத செயல்களைப் பட்டியலிடுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_11', 'en', $$List the activities that do not come naturally to you.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_11', 'hi', $$अपनी उन गतिविधियों की सूची बनाएं जो आप स्वाभाविक रूप से नहीं कर पाते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_11', 'kn', $$ನಿಮಗೆ ಸುಲಭವಾಗಿ ಆಗದ ಕೆಲಸಗಳು ಯಾವುವು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_11', 'ta', $$உங்களுக்கு எளிதாக வராத வேலைகளைப் பற்றி எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_11', 'en', $$Write about the tasks that are not easy for you.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_11', 'hi', $$उन कामों के बारे में लिखें जो आपके लिए सहज नहीं हैं या जिन्हें करने में बहुत मेहनत लगती है।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Section: Let's delve deeper into understanding more about you.
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_12', 'kn', $$ನಿಮ್ಮ ಬಗ್ಗೆ ನೀವೆ ಹೆಮ್ಮೆಪಟ್ಟುಕೊಳ್ಳುವ, ನಿಮ್ಮಲ್ಲಿನ ಗುಣಗಳು ಯಾವವು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_12', 'ta', $$உங்களைப் பற்றி நீங்களே பெருமைப்படும் குணங்கள் எவை?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_12', 'en', $$What qualities or aspects do you love & appreciate about yourself?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_12', 'hi', $$आपके वे कौन से गुण हैं जिन पर आपको स्वयं गर्व है?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_12', 'kn', $$ನಿಮ್ಮಲ್ಲಿ ನಿಮಗೆ ಇಷ್ಟವಾಗುವ ಗುಣಗಳು ಯಾವುವು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_12', 'ta', $$உங்களிடம் உங்களுக்குப் பிடித்த குணங்களைப் பற்றி எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_12', 'en', $$Write about the qualities you like in yourself.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_12', 'hi', $$अपनी उन खूबियों के बारे में लिखें जो आपको अपने आप में सबसे अच्छी लगती हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_13', 'kn', $$ಇತರರು (ಪಾಲಕರು, ಶಿಕ್ಷಕರು, ಸ್ನೇಹಿತರು ಇತ್ಯಾದಿ) ನಿಮ್ಮ ಯಾವ ಗುಣಗಳನ್ನು ಇಷ್ಟಪಡುತ್ತಾರೆ ಎಂದು ಭಾವಿಸುತ್ತೀರಿ? ಪಟ್ಟಿ ಮಾಡಿ. (ಪೋಷಕರು, ಶಿಕ್ಷಕರು, ಸ್ನೇಹಿತರನ್ನು ಕೇಳಿ ಪರಿಶೀಲಿಸಿಕೊಳ್ಳಿ)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_13', 'ta', $$மற்றவர்கள் (பெற்றோர், ஆசிரியர்கள், நண்பர்கள் போன்றவை) உங்கள் எந்த குணங்களை விரும்புகிறார்கள் என்று நினைக்கிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_13', 'en', $$Which of your qualities do you think these people (parents, teachers, friends, etc.) like?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_13', 'hi', $$आपको क्या लगता है कि दूसरे (माता-पिता, शिक्षक, मित्र) आपके किन गुणों को पसंद करते हैं? (पूछकर पुष्टि करें)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_13', 'kn', $$ಇತರರು ನಿಮ್ಮಲ್ಲಿ ಇಷ್ಟಪಡುವ ಗುಣಗಳು ಯಾವುವು? ಅದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_13', 'ta', $$மற்றவர்கள் உங்களிடம் விரும்பும் குணங்கள் எவை என்று எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_13', 'en', $$Write about the qualities that others like in you.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_13', 'hi', $$उन गुणों को लिखें जिन्हें आपके करीबी लोग आप में पसंद करते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_14', 'kn', $$ನಿಮ್ಮಲ್ಲಿನ ಯಾವ ಸ್ವಭಾವವನ್ನು ಸುಧಾರಣೆ / ಬದಲಾವಣೆ ಮಾಡಿಕೊಳ್ಳಲು ನೀವು ಬಯಸುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_14', 'ta', $$உங்களிடம் உள்ள எந்த சுபாவத்தை/பண்பை மேம்படுத்த அல்லது மாற்ற விரும்புகிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_14', 'en', $$Which habit or behaviour of yours do you want to improve or change?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_14', 'hi', $$आप अपने स्वभाव में किस तरह का सुधार या बदलाव करना चाहेंगे?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_14', 'kn', $$ನಿಮ್ಮಲ್ಲಿ ನೀವು ಬದಲಾಯಿಸಿಕೊಳ್ಳಲು ಬಯಸುವ ಗುಣ ಯಾವುದು? ಅದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_14', 'ta', $$நீங்கள் மாற்ற அல்லது மேம்படுத்த விரும்பும் பழக்கம் அல்லது நடத்தை ஏதாவது உள்ளதா?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_14', 'en', $$Is there any habit or behaviour you want to change or improve?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_14', 'hi', $$अपनी उस आदत या स्वभाव के बारे में लिखें जिसे आप बदलना चाहते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_15', 'kn', $$ನಿಮ್ಮ ಯಾವ ಗುಣ /ಸ್ವಭಾವವನ್ನು ತಿದ್ದಿಕೊಳ್ಳಬೇಕು ಎಂದು ಇತರರು ಬಯಸುತ್ತಾರೆ ಅಥವಾ ಸಲಹೆ ನೀಡುತ್ತಾರೆ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_15', 'ta', $$உங்கள் எந்த குணம் அல்லது சுபாவத்தை மாற்றிக்கொள்ள வேண்டும் என்று மற்றவர்கள் விரும்புகிறார்கள் அல்லது ஆலோசனை கூறுகிறார்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_15', 'en', $$Which of your qualities or behaviors do others suggest you should correct or change?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_15', 'hi', $$आपके किस गुण या स्वभाव को बदलने के लिए दूसरे आपको सलाह देते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_15', 'kn', $$ನಿಮ್ಮಲ್ಲಿ ಯಾವ ಗುಣವನ್ನು ಬದಲಾಯಿಸು ಎಂದು ಇತರರು ಹೇಳುತ್ತಾರೆ? ಅದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_15', 'ta', $$உங்கள் எந்த குணத்தை மாற்றிக்கொள்ள வேண்டும் என்று மற்றவர்கள் சொல்கிறார்கள் என்பதை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_15', 'en', $$Write about the quality that others tell you to change or improve.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_15', 'hi', $$दूसरे लोग आपको अक्सर क्या सुधारने के लिए कहते हैं, उसके बारे में लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_16', 'kn', $$ಜೀವನದಲ್ಲಿ ನಿಮಗೆ ಏನಾದರೂ / ಯಾರಾದರೂ ಆಗುವ ಅವಕಾಶ ಇದ್ದರೆ, ನೀವು ಏನಾಗಲು / ಯಾರಾಗಲು ಬಯಸುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_16', 'ta', $$வாழ்க்கையில் உங்களுக்கு ஏதேனும் அல்லது யாராவது ஆகும் வாய்ப்பு கிடைத்தால், நீங்கள் என்னவாக/யாராக விரும்புகிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_16', 'en', $$If you had a chance to become something or someone in the future, what/who would you like to become?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_16', 'hi', $$यदि आपको जीवन में कुछ भी या कोई भी बनने का अवसर मिले, तो आप क्या बनना चाहेंगे?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_16', 'kn', $$ಭವಿಷ್ಯದಲ್ಲಿ ನೀವು ಏನಾಗಲು ಬಯಸುತ್ತೀರಿ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_16', 'ta', $$எதிர்காலத்தில் நீங்கள் என்னவாக விரும்புகிறீர்கள் என்பதை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_16', 'en', $$Write about what you want to become in the future.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_16', 'hi', $$भविष्य में आप क्या बनने का सपना देखते हैं, उसके बारे में लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_17', 'kn', $$ನಿಮ್ಮ ಬಗ್ಗೆ ನೀವು ಹೆಮ್ಮೆ ಪಟ್ಟುಕೊಂಡ ಸಂದರ್ಭವನ್ನು ಮೆಲುಕುಹಾಕಿ. ನಿಮ್ಮ ಯಾವ ಕೆಲಸದಿಂದ ನಿಮಗೆ ಮೆಚ್ಚುಗೆ ದೊರೆಯಿತು? ಅದನ್ನು ಹೇಗೆ ಸಾಧಿಸಿದಿರಿ? ಸಂಕ್ಷಿಪ್ತವಾಗಿ ವಿವರಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_17', 'ta', $$உங்களைப் பற்றி நீங்கள் பெருமைப்பட்ட ஒரு தருணத்தை நினைவுகூருங்கள். உங்கள் எந்தச் செயலால் உங்களுக்கு பாராட்டு கிடைத்தது? அதை எப்படிச் சாதித்தீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_17', 'en', $$Reflect on a time when you felt proud of yourself. Which of your actions earned you appreciation? How did you achieve it?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_17', 'hi', $$उस समय को याद करें जब आपको अपने आप पर गर्व हुआ था। आपको किस काम के लिए प्रशंसा मिली और आपने उसे कैसे हासिल किया?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_17', 'kn', $$ನೀವು ಮಾಡಿದ ಯಾವ ಕೆಲಸಕ್ಕೆ ನಿಮಗೆ ಮೆಚ್ಚುಗೆ ಸಿಕ್ಕಿತು? ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_17', 'ta', $$எந்த வேலை அல்லது செயலில் உங்களுக்கு பாராட்டு கிடைத்தது?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_17', 'en', $$Write about the work or action for which you received appreciation.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_17', 'hi', $$अपनी किसी सफलता या अच्छे काम के बारे में संक्षेप में लिखें जिसके लिए आपकी तारीफ हुई थी।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_18', 'kn', $$ನೀವು ಇತ್ತೀಚೆಗೆ ಎದುರಿಸಿದ ಕಠೀಣ/ಕಷ್ಟಕರ ಸನ್ನಿವೇಶದ ಬಗ್ಗೆ ಯೋಚಿಸಿ. ಅದನ್ನು ನೀವು ಹೇಗೆ ಎದುರಿಸಿದಿರಿ ಅಥವಾ ಅದರಿಂದ ಹೇಗೆ ಪಾರಾದಿರಿ? ಅದರಿಂದ ಕಲಿತ ಪಾಠವೇನು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_18', 'ta', $$சமீபத்தில் நீங்கள் எதிர்கொண்ட ஒரு கடினமான சூழ்நிலையைப் பற்றி யோசியுங்கள். அதை எப்படி எதிர்கொண்டீர்கள் அல்லது அதிலிருந்து எப்படி மீண்டீர்கள்? அதிலிருந்து நீங்கள் கற்றுக்கொண்ட பாடம் என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_18', 'en', $$Think about a difficult or challenging situation you faced recently.
How did you face it or overcome it?
What lesson did you learn from it?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_18', 'hi', $$हाल ही में आपने जिस कठिन स्थिति का सामना किया, उसके बारे में सोचें। आपने उसका सामना कैसे किया और उससे क्या सीखा?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_18', 'kn', $$ಇತ್ತೀಚೆಗೆ ನಿಮಗೆ ಕಷ್ಟವಾದ ಒಂದು ಘಟನೆ ಯಾವುದು? ಅದನ್ನು ನೀವು ಹೇಗೆ ಎದುರಿಸಿದಿರಿ? ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_18', 'ta', $$சமீபத்தில் உங்களுக்குக் கடினமாக இருந்த ஒரு நிகழ்வு எது? அதை எப்படி எதிர்கொண்டீர்கள் என்று எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_18', 'en', $$Write about a recent difficult event and how you handled it.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_18', 'hi', $$किसी हालिया मुश्किल घटना और उससे मिली सीख के बारे में लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_19', 'kn', $$ಇತರರು ನಿಮ್ಮನ್ನು ತಪ್ಪಾಗಿ ತಿಳಿದ (ನಿಮ್ಮ ಬಗ್ಗೆ ತಪ್ಪು ಕಲ್ಪನೆ ಹೊಂದಿದ) ಸಂದರ್ಭವನ್ನು ನೆನಪಿಸಿಕೊಳ್ಳಿ. ನೀವು ಆ ಪರಿಸ್ಥಿತಿಯನ್ನು ಹೇಗೆ ನಿರ್ವಹಿಸಿದಿರಿ ಮತ್ತು ಅದರಿಂದ ನೀವು ಏನು ಕಲಿತಿರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_19', 'ta', $$மற்றவர்கள் உங்களைத் தவறாகப் புரிந்துகொண்ட ஒரு தருணத்தை நினைவுகூருங்கள். அந்தச் சூழ்நிலையை நீங்கள் எப்படி கையாண்டீர்கள், அதிலிருந்து என்ன கற்றுக்கொண்டீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_19', 'en', $$Recall a situation where others misunderstood you. How did you handle that situation and what did you learn from it?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_question', 'question_19', 'hi', $$उस घटना को याद करें जब दूसरों ने आपको गलत समझा था। आपने उस स्थिति को कैसे संभाला और क्या सीखा?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_19', 'kn', $$ಯಾರಾದರೂ ನಿಮ್ಮ ಬಗ್ಗೆ ತಪ್ಪಾಗಿ ಯೋಚಿಸಿದ ಸಂದರ್ಭವಿದೆಯೇ? ನೀವು ಅದನ್ನು ಹೇಗೆ ಸರಿಪಡಿಸಿದಿರಿ? ಎಂಬುದರ ಬಗ್ಗೆ ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_19', 'ta', $$யாராவது உங்களைப் பற்றித் தவறாக நினைத்த சந்தர்ப்பம் உண்டா? அதை எப்படிச் சரி செய்தீர்கள் என்பதைப் பற்றி எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_19', 'en', $$Was there a time when someone thought wrongly about you? Write about how you corrected it.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_help', 'question_19', 'hi', $$क्या कभी किसी ने आपके बारे में गलत धारणा बनाई थी? आपने उस स्थिति को कैसे ठीक किया, उसके बारे में लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Summary questions (16 total)
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_1', 'kn', $$ನನ್ನ ಕುಟುಂಬದಲ್ಲಿ ನನ್ನ ಸ್ನೇಹಿತ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_1', 'ta', $$என் குடும்பத்தில் உள்ள எனது நண்பர்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_1', 'en', $$The friend in my family$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_1', 'hi', $$मेरे परिवार में मेरा मित्र$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_2', 'kn', $$ಕುಟುಂಬ ಬಿಟ್ಟು ಹೊರಗಿನ ನನ್ನ ಸ್ನೇಹಿತ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_2', 'ta', $$குடும்பத்திற்கு வெளியே உள்ள நண்பர்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_2', 'en', $$My family outside of my family$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_2', 'hi', $$परिवार के बाहर मेरा मित्र$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_3', 'kn', $$ನಾನು ಮನೆಯಲ್ಲಿ ಯಾವ ಕೆಲಸಗಳನ್ನು ಮಾಡುತ್ತಿದ್ದೇನೆ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_3', 'ta', $$நான் வீட்டில் செய்யும் வேலைகள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_3', 'en', $$Activities I am doing at home$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_3', 'hi', $$मैं घर पर कौन से काम कर रहा/रही हूँ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_4', 'kn', $$ಶಾಲೆಯ ಸಮಯದಲ್ಲಿ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆ/ಅಂಶಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_4', 'ta', $$பள்ளி நேரத்தில் நான் ரசிக்கும் விஷயங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_4', 'en', $$Activities I enjoy during the school hours$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_4', 'hi', $$स्कूल के समय के दौरान जिन गतिविधियों/पहलुओं का मैं आनंद लेता/लेती हूँ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_5', 'kn', $$ಶಾಲೆಯ ಹೊರಗೆ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆ/ಅಂಶಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_5', 'ta', $$பள்ளிக்கு வெளியே நான் ரசிக்கும் விஷயங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_5', 'en', $$Activities I enjoy outside the school$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_5', 'hi', $$स्कूल के बाहर जिन गतिविधियों/पहलुओं का मैं आनंद लेता/लेती हूँ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_6', 'kn', $$ವೈಯಕ್ತಿಕವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸ / ಚಟುವಟಿಕೆಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_6', 'ta', $$நான் தனியாக ரசித்துச் செய்யும் செயல்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_6', 'en', $$Work/activities I enjoy personally$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_6', 'hi', $$व्यक्तिगत रूप से वे काम/गतिविधियाँ जिनका मैं आनंद लेता/लेती हूँ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_7', 'kn', $$ತಂಡವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸ / ಚಟುವಟಿಕೆಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_7', 'ta', $$நான் குழுவாக ரசித்துச் செய்யும் செயல்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_7', 'en', $$Work/activities I enjoy as a team$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_7', 'hi', $$एक टीम के रूप में वे काम/गतिविधियाँ जिनका मैं आनंद लेता/लेती हूँ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_8', 'kn', $$ಶಾಲಾವಧಿಯಲ್ಲಿ ಮಾಡಬೇಕಾದ, ಆದರೆ ನನಗೆ ಕಷ್ಟವೆನಿಸುವ ಚಟುವಟಿಕೆ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_8', 'ta', $$பள்ளியில் எனக்குக் கடினமாகத் தோன்றும் செயல்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_8', 'en', $$Activity that needs to be done in the school but I find difficult$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_8', 'hi', $$स्कूल के घंटों के दौरान की जाने वाली गतिविधियाँ जो मुझे कठिन लगती हैं$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_9', 'kn', $$ಶಾಲಾವಧಿಯ ನಂತರ, ಶಾಲೆಯ ಆಚೆ ನನಗೆ ನಿರ್ವಹಿಸಲು ಕಷ್ಟವೆನಿಸುವ ಚಟುವಟಿಕೆ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_9', 'ta', $$பள்ளிக்கு வெளியே எனக்குக் கடினமாகத் தோன்றும் வேலைகள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_9', 'en', $$Activity that I find difficult to do after school hours$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_9', 'hi', $$स्कूल के बाद या स्कूल के बाहर वे गतिविधियाँ जिन्हें करना मेरे लिए कठिन है$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_10', 'kn', $$ನಾನು ಮಾಡಲೇಬೇಕಾದ ಚಟುವಟಿಕೆಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_10', 'ta', $$நான் கட்டாயம் செய்ய வேண்டிய வேலைகள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_10', 'en', $$Activities I must do$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_10', 'hi', $$वे गतिविधियाँ जो मुझे करनी ही चाहिए (अनिवार्य कार्य)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_11', 'kn', $$ನಾನು ಸಹಜವಾಗಿ ಮಾಡಬಹುದಾದ ಚಟುವಟಿಕೆಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_11', 'ta', $$நான் இயல்பாகச் செய்யும் செயல்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_11', 'en', $$Activities that come naturally to me$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_11', 'hi', $$वे गतिविधियाँ जो मैं स्वाभाविक रूप से कर सकता/सकती हूँ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_12', 'kn', $$ನನಗೆ ಸಹಜವಾಗಿ ಮಾಡಲು ಬಾರದಿರುವ ಚಟುವಟಿಕೆಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_12', 'ta', $$எனக்கு எளிதாக வராத செயல்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_12', 'en', $$Activities that don't come naturally to me$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_12', 'hi', $$वे गतिविधियाँ जो मैं स्वाभाविक रूप से नहीं कर पाता/पाती$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_13', 'kn', $$ನನ್ನಲ್ಲಿರುವ, ನಾನು ಇಷ್ಟಪಡುವ ಗುಣಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_13', 'ta', $$என்னிடத்தில் எனக்குப் பிடித்த குணங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_13', 'en', $$Qualities I like in myself$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_13', 'hi', $$मेरे अपने वे गुण जिन्हें मैं पसंद करता/करती हूँ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_14', 'kn', $$ಇತರರು ನನ್ನಲ್ಲಿ ಇಷ್ಟಪಡುವ ಗುಣಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_14', 'ta', $$மற்றவர்கள் என்னிடம் விரும்பும் குணங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_14', 'en', $$Qualities that others like in me$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_14', 'hi', $$मेरे वे गुण जिन्हें दूसरे पसंद करते हैं$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_15', 'kn', $$ನಾನು ಸುಧಾರಿಸಿಕೊಳ್ಳಬೇಕಾದ ಗುಣ/ ಅಂಶಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_15', 'ta', $$நான் மேம்படுத்த வேண்டிய விஷயங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_15', 'en', $$Qualities that I need to improve on$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_15', 'hi', $$वे गुण/पहलू जिनमें मुझे सुधार करने की आवश्यकता है$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_16', 'kn', $$ಸಾರಾಂಶದ ಆಧಾರದ ಮೇಲೆ ನಿಮ್ಮ ಬಗ್ಗೆ ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_16', 'ta', $$சுருக்கத்தின் அடிப்படையில் உங்களைப் பற்றிச் சுருக்கமாக எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_16', 'en', $$Write a brief description of yourself based on the summary.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('about_me_summary_question', 'summary_question_16', 'hi', $$सारांश के आधार पर अपने बारे में संक्षेप में लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;


-- ------------------------------------------------------------
-- 9.3_My Dreams (dreams)
-- ------------------------------------------------------------

-- Module title
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_module', 'title', 'kn', $$ನನ್ನ ಕನಸುಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_module', 'title', 'ta', $$என் கனவுகள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_module', 'title', 'en', $$My Dreams$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_module', 'title', 'hi', $$मेरे सपने$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Title text (intro)
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_module', 'intro', 'kn', $$“ನೀವು ನಿದ್ರೆ ಮಾಡುವಾಗ ಕಾಣುವುದು ಕನಸಲ್ಲ, ಯಾವ ಕನಸು ನಿಮ್ಮನ್ನು ನಿದ್ರಿಸಲು ಬಿಡುವುದಿಲ್ಲವೋ ಅದೇ ನಿಜವಾದ ಕನಸು.” - ಡಾ. ಎ. ಪಿ. ಜೆ. ಅಬ್ದುಲ್ ಕಲಾಮ್$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_module', 'intro', 'ta', $$“தூக்கத்தில் வருவதல்ல கனவு; உன்னைத் தூங்கவிடாமல் செய்வதே கனவு.” - டாக்டர் ஏ.பி.ஜே. அப்துல் கலாம்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_module', 'intro', 'en', $$“Dream is not that which you see while sleeping, it is something that does not let you sleep.” - Dr. A.P.J. Abdul Kalam$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_module', 'intro', 'hi', $$"सपना वह नहीं है जो आप नींद में देखते हैं, सपना वह है जो आपको सोने नहीं देता।"
— डॉ. ए. पी. जे. अब्दुल कलाम$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Subtitle text
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_module', 'subtitle', 'kn', $$ನಾವೆಲ್ಲರೂ ನಮ್ಮ, ನಮ್ಮ ಭವಿಷ್ಯದ ಬಗ್ಗೆ ಕನಸುಗಳನ್ನು ಹೊಂದಿದ್ದೇವಲ್ಲವೇ? ಹಾಗಾದರೆ ನಿಮ್ಮ ಪ್ರಕಾರ ಕನಸು ಎಂದರೇನು? ನಿಮ್ಮ ಕನಸುಗಳು ಯಾವುವು? ನಿಮಗನಿಸುವ ಪ್ರಕಾರ ನಿಮ್ಮನ್ನು ಪದೇ ಪದೇ ಕಾಡುವ ಕನಸುಗಳು ಯಾವುದು? - ಈ ಎಲ್ಲದರ ಕುರಿತು ನಿಮ್ಮ ಅಭಿಪ್ರಾಯಗಳನ್ನು ಈ ಚಟುವಟಿಕೆಯಲ್ಲಿ ವ್ಯಕ್ತಪಡಿಸುತ್ತೀರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_module', 'subtitle', 'ta', $$நமது எதிர்காலத்தைப் பற்றி நாம் அனைவரும் கனவுகளைக் கொண்டுள்ளோம் அல்லவா? உங்கள் கருத்துப்படி கனவு என்றால் என்ன? உங்கள் கனவுகள் யாவை? உங்களை அடிக்கடித் தூண்டும் கனவுகள் எவை என்று நீங்கள் கருதுகிறீர்கள்? - இவை அனைத்தைப் பற்றியும் உங்கள் கருத்துக்களை இந்தச் செயல்பாட்டில் வெளிப்படுத்துவீர்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_module', 'subtitle', 'en', $$We all have dreams for our future, don't we? So, according to you, what is a dream? What are your dreams? Which dreams do you feel haunt or recur in your mind frequently? - You will express your opinions on all of these in this activity.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_module', 'subtitle', 'hi', $$हम सभी के अपने भविष्य के बारे में कुछ सपने होते हैं, है ना? तो आपके अनुसार सपना क्या है? आपके सपने क्या हैं? आपको क्या लगता है कि वे कौन से सपने हैं जो आपको बार-बार आते हैं या प्रभावित करते हैं? - इस गतिविधि में आप इन सभी के बारे में अपनी राय व्यक्त करेंगे।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Summary title
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_module', 'summary_title', 'kn', $$ಸಾರಾಂಶ: ನನ್ನ ಮುಂದಿನ ಯೋಜನೆ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_module', 'summary_title', 'ta', $$சுருக்கம்: எனது அடுத்த திட்டம்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_module', 'summary_title', 'en', $$Summary: My Next Plan$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_module', 'summary_title', 'hi', $$सारांश: मेरी अगली योजना$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Summary subtitle
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_module', 'summary_subtitle', 'kn', $$ಈ ಚಟುವಟಿಕೆಯ ಸಾರಾಂಶವಾಗಿ, ನಿಮ್ಮ ಕನಸುಗಳ ಪೋರ್ಟ್ಫೋಲಿಯೊವನ್ನು ರಚಿಸೋಣ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_module', 'summary_subtitle', 'ta', $$இந்தச் செயல்பாட்டின் சுருக்கமாக, உங்கள் கனவுகளின் தொகுப்பை (Portfolio) உருவாக்குவோம்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_module', 'summary_subtitle', 'en', $$As a summary of this activity, let's create your dream portfolio.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_module', 'summary_subtitle', 'hi', $$इस गतिविधि के सारांश के रूप में, आइए आपके सपनों का एक पोर्टफोलियो बनाएं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Section titles
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_1_title', 'kn', $$ನಿಮ್ಮ ಕನಸುಗಳು ಮತ್ತು ಭವಿಷ್ಯದ ಗುರಿಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_1_title', 'ta', $$உங்கள் கனவுகள் மற்றும் எதிர்கால இலக்குகள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_1_title', 'en', $$Your Dreams & Future Goals$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_1_title', 'hi', $$आपके सपने और भविष्य के लक्ष्य$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_1_subtitle', 'kn', $$ನಿಮ್ಮ ಭವಿಷ್ಯದ ಕನಸುಗಳನ್ನು ಮತ್ತು ನೀವು ಏನನ್ನು ಸಾಧಿಸಲು ಬಯಸುತ್ತೀರಿ ಎಂಬುದನ್ನು ವ್ಯಕ್ತಪಡಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_1_subtitle', 'ta', $$எதிர்காலத்திற்கான உங்கள் கனவுகளையும் நீங்கள் எதைச் சாதிக்க விரும்புகிறீர்கள் என்பதையும் வெளிப்படுத்துங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_1_subtitle', 'en', $$Express your dreams for the future and what you aspire to achieve.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_1_subtitle', 'hi', $$भविष्य के लिए अपने सपनों और आप क्या हासिल करना चाहते हैं, उसे व्यक्त करें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_2_title', 'kn', $$ವೃತ್ತಿಜೀವನ ಮತ್ತು ಜೀವನದ ಆಕಾಂಕ್ಷೆಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_2_title', 'ta', $$தொழில் மற்றும் வாழ்க்கை அபிலாஷைகள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_2_title', 'en', $$Career & Life Aspirations$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_2_title', 'hi', $$करियर और जीवन की आकांक्षाएं$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_2_subtitle', 'kn', $$ನಿಮ್ಮ ವೃತ್ತಿಜೀವನ ಮತ್ತು ಜೀವನದ ಗುರಿಗಳು, ನೀವು ಎಲ್ಲಿ ವಾಸಿಸಲು ಬಯಸುತ್ತೀರಿ ಮತ್ತು ನೀವು ಹೇಗೆ ಕೊಡುಗೆ ನೀಡಲು ಬಯಸುತ್ತೀರಿ ಎಂಬುದನ್ನು ಕಂಡುಕೊಳ್ಳಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_2_subtitle', 'ta', $$உங்கள் தொழில் மற்றும் வாழ்க்கை இலக்குகள், நீங்கள் எங்கு வாழ விரும்புகிறீர்கள் மற்றும் உங்கள் பங்களிப்பு எப்படி இருக்க வேண்டும் என்பதை ஆராயுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_2_subtitle', 'en', $$Explore your career and life goals, where you want to live, and how you want to contribute$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_2_subtitle', 'hi', $$अपने करियर और जीवन के लक्ष्यों को जानें, आप कहाँ रहना चाहते हैं और आप समाज में क्या योगदान देना चाहते हैं, उसे पहचानें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_3_title', 'kn', $$ಕನಸುಗಳನ್ನು ನನಸಾಗಿಸುವುದು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_3_title', 'ta', $$கனவுகளை நனவாக்குதல்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_3_title', 'en', $$Making Dreams Reality$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_3_title', 'hi', $$सपनों को सच करना$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_3_subtitle', 'kn', $$ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ನನಸಾಗಿಸಲು ಬೇಕಾದ ಹಂತಗಳನ್ನು ಯೋಜಿಸಿ ಮತ್ತು ಎದುರಾಗಬಹುದಾದ ಅಡೆತಡೆಗಳನ್ನು ಗುರುತಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_3_subtitle', 'ta', $$கனவுகளை நனவாக்குதல்	உங்கள் கனவுகளை அடையத் தேவையான படிகளைத் திட்டமிடுங்கள் மற்றும் வரக்கூடிய தடைகளை அடையாளம் காணுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_3_subtitle', 'en', $$Plan the steps needed to achieve your dreams and identify potential obstacles$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_section', 'section_3_subtitle', 'hi', $$अपने सपनों को पूरा करने के लिए आवश्यक कदमों की योजना बनाएं और संभावित बाधाओं की पहचान करें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Questions (18 total)
-- Section: Your Dreams & Future Goals
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_1', 'kn', $$ನಿಮ್ಮ ಭವಿಷ್ಯದ ಬಗ್ಗೆ ನಿಮ್ಮ ಕನಸುಗಳು ಏನು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_1', 'ta', $$உங்கள் எதிர்காலத்தைப் பற்றி உங்கள் கனவு என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_1', 'en', $$What are your dreams about your future?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_1', 'hi', $$भविष्य को लेकर आपके सपने क्या हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_1', 'kn', $$ಭವಿಷ್ಯದಲ್ಲಿ ನೀವು ಏನಾಗಲು ಬಯಸುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_1', 'ta', $$நீங்கள் எதிர்காலத்தில் என்ன ஆக விரும்புகிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_1', 'en', $$What do you want to become in the future?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_1', 'hi', $$भविष्य में आप क्या बनना चाहते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_2', 'kn', $$ನೀವು ಪಡೆಯಲು ಬಯಸುವ ಶಿಕ್ಷಣ/ಶೈಕ್ಷಣಿಕ ಪದವಿ ಯಾವುದು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_2', 'ta', $$நீங்கள் எந்த கல்விப் பட்டப்படிப்பை படிக்க விரும்புகிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_2', 'en', $$What are your academic goals and what would you like to achieve in your studies?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_2', 'hi', $$आप कौन सी शिक्षा/शैक्षिक डिग्री प्राप्त करना चाहते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_2', 'kn', $$ನೀವು ಯಾವ ಪದವಿ ವ್ಯಾಸಂಗ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_2', 'ta', $$நீங்கள் படிக்க விரும்பும் பட்டப்படிப்பு என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_2', 'en', $$Which degree do you want to study?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_2', 'hi', $$आप किस डिग्री की पढ़ाई करना चाहते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_3', 'kn', $$ನೀವು ಯಾವ ವೃತ್ತಿಯನ್ನು ಮಾಡುವ ಕನಸು ಕಾಣುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_3', 'ta', $$நீங்கள் எந்த தொழிலை செய்ய கனவு காண்கிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_3', 'en', $$Which profession do you dream of pursuing?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_3', 'hi', $$आप किस करियर या पेशे का सपना देखते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_3', 'kn', $$ನೀವು ಯಾವ ಕೆಲಸ (ಉದ್ಯೋಗ) ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_3', 'ta', $$நீங்கள் செய்ய விரும்பும் வேலை என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_3', 'en', $$What job do you want to do?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_3', 'hi', $$आप कौन सा काम (नौकरी) करना चाहते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_4', 'kn', $$ನೀವು ವೃತ್ತಿಪರವಾಗಿ ಆಡಲು ಬಯಸುವ ಕ್ರೀಡೆ ಯಾವುದು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_4', 'ta', $$நீங்கள் தொழில்முறையாக விளையாட விரும்பும் விளையாட்டு எது?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_4', 'en', $$Which sport do you want to play professionally?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_4', 'hi', $$वह कौन सा खेल है जिसे आप पेशेवर रूप से खेलना चाहते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_4', 'kn', $$ನಿಮಗೆ ಅತಿ ಹೆಚ್ಚು ಇಷ್ಟವಾದ ಕ್ರೀಡೆ ಯಾವುದು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_4', 'ta', $$நீங்கள் எந்த விளையாட்டில் ஆர்வம் உள்ளவர்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_4', 'en', $$Which sport do you like most?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_4', 'hi', $$आपका सबसे पसंदीदा खेल कौन सा है?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_5', 'kn', $$ನೀವು ಬರಹಗಾರರಾಗಲು ಸಾಧ್ಯವಾದರೆ, ಯಾವ ಕ್ಷೇತ್ರದಲ್ಲಿ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_5', 'ta', $$நீங்கள் ஒரு எழுத்தாளராகும் வாய்ப்பு கிடைத்தால், எந்தத் துறையைத் தேர்ந்தெடுப்பீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_5', 'en', $$If you could be a writer, which field would you choose?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_5', 'hi', $$यदि आप लेखक बन सकें, तो किस क्षेत्र में?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_5', 'kn', $$ಕಥೆ, ಕವನ, ಕಾದಂಬರಿ, ಲೇಖನ, ಇತ್ಯಾದಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_5', 'ta', $$கதை, கவிதை, நாவல், கட்டுரை போன்றவை.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_5', 'en', $$Story, poem, novel, article, etc.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_5', 'hi', $$कहानी, कविता, उपन्यास, लेख, आदि।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_6', 'kn', $$ಸಂಗೀತ ಕ್ಷೇತ್ರದಲ್ಲಿ ನೀವು ಬಯಸುವ ವಿಭಾಗ? (ಹಾಡುಗಾರಿಕೆ / ಯಾವುದೇ ವಾದ್ಯ)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_6', 'ta', $$இசைத்துறையில் நீங்கள் எதை விரும்புகிறீர்கள்? (பாடல் / இசைக்கருவி)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_6', 'en', $$Which branch of music do you prefer? (Singing / Instrument)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_6', 'hi', $$संगीत के क्षेत्र में आपकी पसंद का विभाग क्या है?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_6', 'kn', $$ಹಾಡುಗಾರಿಕೆ ಅಥವಾ ವಾದ್ಯದ ಹೆಸರನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_6', 'ta', $$பாடுதல் அல்லது இசைக்கருவியின் பெயரை எழுதுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_6', 'en', $$Write "Singing" or name of instrument.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_6', 'hi', $$गायन या किसी वाद्य यंत्र का नाम लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Section: Career & Life Aspirations
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_7', 'kn', $$ನೀವು ಆಯ್ಕೆ ಮಾಡಿಕೊಳ್ಳಲು ಬಯಸುವ ಕಾಲೇಜು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_7', 'ta', $$நீங்கள் தேர்வு செய்ய விரும்பும் கல்லூரி எது?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_7', 'en', $$The college that you want to choose.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_7', 'hi', $$वह कॉलेज जिसे आप चुनना चाहते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_7', 'kn', $$ಕಾಲೇಜಿನ ಹೆಸರು ಅಥವಾ ಸ್ಥಳವನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_7', 'ta', $$தெரிந்தால் கல்லூரி பெயரை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_7', 'en', $$Write college name or place.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_7', 'hi', $$कॉलेज का नाम या स्थान लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_8', 'kn', $$ನೀವು ಜಗತ್ತಿನಲ್ಲಿ ಯಾರಿಗಾದರೂ ಅಥವಾ ಯಾವುದಕ್ಕಾದರೂ ಸೇವೆ ಮಾಡಲು ನಿಮ್ಮ ಬದುಕು ಮೀಸಲಿಡುವುದಾದರೆ, ನಿಮ್ಮ ಆಯ್ಕೆ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_8', 'ta', $$நீங்கள் சேவை செய்ய விரும்பினால் யாருக்கு அல்லது எதற்கு செய்வீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_8', 'en', $$If you want to serve others, whom or what will you serve?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_8', 'hi', $$यदि आप दुनिया में किसी की सेवा के लिए अपना जीवन समर्पित करना चाहें, तो आपकी पसंद क्या होगी?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_8', 'kn', $$ಜನರು, ಬಡವರು, ಸಮಾಜ, ದೇಶ, ಪ್ರಾಣಿಗಳು- ಇತ್ಯಾದಿ.. ಯಾವುದು ಎಂಬುದನ್ನು ತಿಳಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_8', 'ta', $$மக்கள், ஏழைகள், நாடு, விலங்குகள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_8', 'en', $$People, poor, society, country, animals.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_8', 'hi', $$लोग, गरीब, समाज, देश, जानवर आदि में से बताएं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_9', 'kn', $$ಪ್ರಪಂಚದ ಬೇರೊಂದು ಸ್ಥಳದಲ್ಲಿ ನಿಮಗೆ ವಾಸ್ತವ್ಯ ಹೂಡಲು ಅವಕಾಶ ಸಿಕ್ಕರೆ, ಅದು ಎಲ್ಲಿ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_9', 'ta', $$உலகில் எங்கு வேண்டுமானாலும்  வாழ வாய்ப்பு கிடைத்தால், எங்கு வாழ விரும்புவீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_9', 'en', $$If you could live anywhere in the world, where would it be?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_9', 'hi', $$यदि आपको दुनिया में कहीं और रहने का मौका मिले, तो वह जगह कौन सी होगी?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_9', 'kn', $$ದೇಶ ಅಥವಾ ನಗರದ ಹೆಸರನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_9', 'ta', $$நாடு அல்லது நகரத்தின் பெயரை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_9', 'en', $$Write country or city name.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_9', 'hi', $$देश या शहर का नाम लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_10', 'kn', $$ನೀವು ಕಲಾವಿದರಾಗಲು ಸಾಧ್ಯವಾದರೆ, ನೀವು ಬಯಸುವ ಕಲೆ ಯಾವುದು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_10', 'ta', $$நீங்கள் கலைஞராக இருந்தால் எந்த வகை கலையை தேர்வு செய்வீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_10', 'en', $$If you could be an artist, what kind of art would you pursue?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_10', 'hi', $$यदि आप कलाकार बन सकें, तो आप कौन सी कला चुनेंगे?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_10', 'kn', $$ಚಿತ್ರಕಲೆ, ಪೇಂಟಿಂಗ್, ನೃತ್ಯ, ಇತ್ಯಾದಿ.. ಯಾವುದು ಎಂಬುದನ್ನು ತಿಳಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_10', 'ta', $$ஓவியம், நடனம் போன்றவற்றை எழுதுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_10', 'en', $$Drawing, painting, dance, etc.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_10', 'hi', $$चित्रकला (Painting), नृत्य (Dance) आदि में से बताएं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_11', 'kn', $$ನೀವು ಪ್ರಯಾಣ/ಪ್ರವಾಸ ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತೀರಾ? ಪ್ರಯಾಣದ ಯಾವ ಅಂಶ/ಸಂಗತಿಗಳು ನಿಮ್ಮನ್ನು ಹೆಚ್ಚು ಆಕರ್ಷಿಸುತ್ತದೆ? ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_11', 'ta', $$பயணத்தில் எந்த விஷயங்கள் உங்களை மிகவும் ஈர்க்கின்றன?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_11', 'en', $$Do you like travelling? If so, what do you like the most about travelling?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_11', 'hi', $$क्या आपको यात्रा करना पसंद है? यात्रा का कौन सा पहलू आपको सबसे अधिक आकर्षित करता है?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_11', 'kn', $$ಸ್ಥಳಗಳು, ಪ್ರಕೃತಿ, ಆಹಾರ, ಸಂಸ್ಕೃತಿ.ಇತ್ಯಾದಿ.. ಯಾವುದು ಎಂಬುದನ್ನು ತಿಳಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_11', 'ta', $$இடங்கள், இயற்கை, உணவு என்று எழுதலாம்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_11', 'en', $$Places, nature, food, culture.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_11', 'hi', $$स्थान, प्रकृति, भोजन, संस्कृति आदि में से बताएं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_12', 'kn', $$ನೀವು ಒಂದು ದಿನ ಒಬ್ಬ ವೃತ್ತಿಪರ/ಉದ್ಯೋಗಿಯನ್ನು ಗಮನಿಸಿ ಕಲಿಯಲು ಸಾಧ್ಯವಾದರೆ, ಅದು ಯಾರು ಮತ್ತು ಏಕೆ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_12', 'ta', $$ஒரு நாள் ஒரு தொழில்முறை நபரிடமிருந்து கற்றுக்கொள்ள வாய்ப்பு கிடைத்தால், அவர் யார்? ஏன்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_12', 'en', $$If you could learn from a professional for one day, who would it be and why?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_12', 'hi', $$यदि आपको एक दिन किसी पेशेवर व्यक्ति को करीब से देखकर सीखने का मौका मिले, तो वह कौन होगा और क्यों?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_12', 'kn', $$ಶಿಕ್ಷಕ, ವೈದ್ಯ, ವಿಜ್ಞಾನಿ, ನಾಯಕ ಇತ್ಯಾದಿ.. ಯಾವುದು ಎಂಬುದನ್ನು ತಿಳಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_12', 'ta', $$ஆசிரியர், மருத்துவர், பொறியாளர், விஞ்ஞானி.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_12', 'en', $$Teacher, doctor, scientist, leader.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_12', 'hi', $$शिक्षक, डॉक्टर, वैज्ञानिक, नेता आदि में से बताएं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Section: Making Dreams Reality
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_13', 'kn', $$ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ನನಸಾಗಿಸಲು ನೀವು ಬಯಸುವಿರಾ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_13', 'ta', $$உங்கள் கனவுகளை நிஜமாக்க விரும்புகிறீர்களா?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_13', 'en', $$Do you want to make your dreams come true?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_13', 'hi', $$क्या आप अपने सपनों को सच करना चाहते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_13', 'kn', $$ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_13', 'ta', $$ஆம் அல்லது இல்லை என்று எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_13', 'en', $$Write Yes or No.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_13', 'hi', $$हाँ' या 'नहीं' लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_14', 'kn', $$ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ನನಸಾಗಿಸಲು ಏನೆಲ್ಲಾ ಅವಶ್ಯಕತೆಗಳಿವೆ? (ನಿಮ್ಮ ಯಾವುದಾದರೂ ಒಂದು ಕನಸು, ನನಸಾಗಿಸುವುದು ಹೇಗೆ ತಿಳಿಸಿ)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_14', 'ta', $$உங்கள் கனவுகளை நனவாக்க என்னென்ன தேவை? (உங்களது ஏதேனும் ஒரு கனவை எப்படி நனவாக்குவீர்கள் என்று கூறுங்கள்)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_14', 'en', $$What are the things needed to make your dreams come true? (Explain how you will make any one of your dreams come true)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_14', 'hi', $$अपने सपनों को साकार करने के लिए किन चीजों की आवश्यकता है?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_14', 'kn', $$ಕಠಿಣ ಪರಿಶ್ರಮ, ಸಮಯ, ಬೆಂಬಲ, ಅಭ್ಯಾಸ-  ಇತ್ಯಾದಿ.. ಯಾವುದು ಎಂಬುದನ್ನು ತಿಳಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_14', 'ta', $$கடின உழைப்பு, நேரம், ஆதரவு, பயிற்சி போன்றவற்றில் உங்களுக்கு எது தேவை என்பதைக் குறிப்பிடுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_14', 'en', $$Mention what you need, such as hard work, time, support, practice, etc.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_14', 'hi', $$कड़ी मेहनत, समय, समर्थन, अभ्यास आदि में से बताएं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_15', 'kn', $$ನಿಮ್ಮ ಆಕಾಂಕ್ಷೆಗಳು ಅಥವಾ ಕನಸುಗಳನ್ನು ನನಸಾಗಿಸಲು ಮೊದಲ ಹೆಜ್ಜೆ ಯಾವುದು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_15', 'ta', $$உங்கள் லட்சியங்கள் அல்லது கனவுகளை நனவாக்க நீங்கள் எடுக்கும் முதல் படி என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_15', 'en', $$What is the first step toward making your aspirations or dreams come true?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_15', 'hi', $$अपनी आकांक्षाओं या सपनों को पूरा करने की दिशा में पहला कदम क्या है?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_15', 'kn', $$ಚೆನ್ನಾಗಿ ಓದುವುದು, ಪ್ರತಿದಿನ ಅಭ್ಯಾಸ ಮಾಡುವುದು.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_15', 'ta', $$நன்றாக படித்தல், பயிற்சி செய்தல்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_15', 'en', $$Study well, practice daily.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_15', 'hi', $$अच्छी तरह से पढ़ाई करना, हर दिन अभ्यास करना आदि।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_16', 'kn', $$ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ಸಾಧಿಸುವ ಛಲ ಮತ್ತು ಉತ್ಸಾಹವನ್ನು ನೀವು ಹೊಂದಿದ್ದೀರಾ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_16', 'ta', $$உங்கள் கனவுகளை அடைய தேவையான உறுதியும் உற்சாகமும் உங்களிடம் இருக்கிறதா?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_16', 'en', $$Do you have the determination and enthusiasm to achieve your dreams?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_16', 'hi', $$क्या आपके पास अपने सपनों को हासिल करने का दृढ़ संकल्प और उत्साह है?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_16', 'kn', $$ಪ್ರಾಮಾಣಿಕವಾಗಿ ಉತ್ತರಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_16', 'ta', $$நேர்மையாக பதில் எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_16', 'en', $$Answer honestly.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_16', 'hi', $$ईमानदारी से उत्तर दें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_17', 'kn', $$ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ಸಾಧಿಸಲು ಅಡೆತಡೆಗಳೇನಾದರೂ ಇದೆಯೇ? ಇದ್ದರೆ ಅವುಗಳು ಯಾವವು? ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_17', 'ta', $$உங்கள் கனவுகளை அடைய ஏதேனும் தடைகள் இருக்கிறதா? இருந்தால் அவை என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_17', 'en', $$Are there any obstacles to achieving your dreams? If yes, what are they?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_17', 'hi', $$क्या आपके सपनों को पूरा करने में कोई बाधाएँ हैं? यदि हाँ, तो वे क्या हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_17', 'kn', $$ಹಣ, ಭಯ, ಅಂಕಗಳು, ಕೌಟುಂಬಿಕ ಸಮಸ್ಯೆಗಳು ಇತ್ಯಾದಿ.. ಯಾವುದು ಎಂಬುದನ್ನು ತಿಳಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_17', 'ta', $$பணம், பயம், மதிப்பெண்கள், குடும்பப் பிரச்சனைகள் போன்றவை.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_17', 'en', $$Money, fear, marks, family issues.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_17', 'hi', $$पैसा, डर, अंक (Marks), पारिवारिक समस्याएँ आदि।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_18', 'kn', $$ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ನನಸಾಗಿಸಲು ಈಗ ನೀವು ಶಾಲೆಯಲ್ಲಿ ಪಡೆಯುತ್ತಿರುವ ಶಿಕ್ಷಣ/ಕಲಿಕೆಯು ಸಹಾಯವಾಗುತ್ತದೆಯೇ? ಹೌದು ಎಂದಾದರೆ ಹೇಗೆ? ತಿಳಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_18', 'ta', $$பள்ளியில் நீங்கள் பெறும் கல்வி உங்கள் கனவுக்கு உதவுமா? ஆம் என்றால், எப்படி?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_18', 'en', $$Is the education/learning you receive in school helpful for your dreams? If yes, how?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_question', 'question_18', 'hi', $$क्या वर्तमान में स्कूल में मिल रही शिक्षा आपके सपनों को पूरा करने में मदद कर रही है? यदि हाँ, तो कैसे?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_18', 'kn', $$ವಿಷಯಗಳು ಜ್ಞಾನ ಮತ್ತು ಕೌಶಲ್ಯಗಳನ್ನು ನೀಡುತ್ತವೆ. ಇತ್ಯಾದಿ..
ಯಾವುದು ಮತ್ತು ಹೇಗೆ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_18', 'ta', $$பாடங்கள் அறிவும் திறனும் தரும்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_18', 'en', $$Subjects give knowledge and skills.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_help', 'question_18', 'hi', $$विषय, ज्ञान और कौशल प्रदान करते हैं। यह कैसे मदद करता है, लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Summary questions (4 total)
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_1', 'kn', $$ಕನಸು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_1', 'ta', $$கனவு$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_1', 'en', $$Dream$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_1', 'hi', $$सपना$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_2', 'kn', $$ನಿಮ್ಮಲ್ಲಿ ಈಗಾಗಲೇ ಕಂಡುಕೊಂಡಿರುವ ಯಾವ ಗುಣ/ ಮೌಲ್ಯ/ ಸಾಮರ್ಥ್ಯ ನಿಮ್ಮ ಕನಸನ್ನು ಸಾಧಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_2', 'ta', $$எனது கனவை அடைய என்னிடம் ஏற்கனவே உள்ள பண்புகள்/திறமைகள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_2', 'en', $$Qualities/abilities I already have to achieve my dream$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_2', 'hi', $$आपके भीतर पहले से मौजूद कौन से गुण/मूल्य/क्षमता आपके सपने को हासिल करने में मदद करेंगे?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_3', 'kn', $$ಕನಸು ವಿಫಲವಾಗುವುದಿಲ್ಲ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಲು ನೀವು ಏನು ಮಾಡಬೇಕಾಗುತ್ತದೆ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_3', 'ta', $$என் கனவு தோற்காமல் இருக்க நான் செய்ய வேண்டியவை$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_3', 'en', $$What I need to do to ensure my dream does not fail$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_3', 'hi', $$यह सुनिश्चित करने के लिए कि आपका सपना विफल न हो, आपको क्या करने की आवश्यकता है?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_4', 'kn', $$ಈ ಕನಸನ್ನುಸಾಧಿಸಲು 10ನೇ ತರಗತಿಯ ನಂತರ ನೀವು ಏನು ಅಧ್ಯಯನ ಮಾಡಬೇಕು? (ಅನ್ವಯಿಸಿದರೆ)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_4', 'ta', $$இந்தக் கனவை அடைய 10-ஆம் வகுப்பிற்குப் பிறகு நான் படிக்க வேண்டியவை$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_4', 'en', $$What I need to study after Class 10 to achieve this dream (if applicable)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('dreams_summary_question', 'summary_question_4', 'hi', $$इस सपने को पूरा करने के लिए आपको 10वीं कक्षा के बाद क्या अध्ययन करना चाहिए? (यदि लागू हो)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;


-- ------------------------------------------------------------
-- 9.4_My School, Learnings and I (school_learning)
-- ------------------------------------------------------------

-- Module title
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_module', 'title', 'kn', $$ನಾನು, ನನ್ನ ಶಾಲೆ, ನನ್ನ ಕಲಿಕೆ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_module', 'title', 'ta', $$நானும், என் பள்ளியும், என் கற்றலும்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_module', 'title', 'en', $$My School, My Learning and I$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_module', 'title', 'hi', $$मैं, मेरा स्कूल, मेरी सीख$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Title text (intro)
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_module', 'intro', 'kn', $$ಈ ಚುಟುವಟಿಕೆಯಲ್ಲಿ ನೀವು ನಿಮ್ಮ ಶಾಲೆಯ ಬಗ್ಗೆ ಏನು ಇಷ್ಟಪಡುತ್ತೀರಿ? ಏನನ್ನು ಕಲಿಯಲು ಇಷ್ಟಪಡುತ್ತೀರಿ? ಮತ್ತು ಏನನ್ನು ಇಷ್ಟಪಡುವುದಿಲ್ಲ? ಹಾಗೂ ಕಲಿಕೆ, ಏಕೆ ಮತ್ತು ಹೇಗೆ ಎಂಬುದರ ಬಗ್ಗೆ ಯೋಚಿಸಬೇಕೆಂದು ನಾವು ಅಪೇಕ್ಷಿಸುತ್ತೇವೆ. ಇದರಿಂದ ಉನ್ನತ ಶಿಕ್ಷಣದಲ್ಲಿ ನಿಮ್ಮ ಕನಸಿಗೆ ಹೊಂದುವಂತೆ ಏನು ಕಲಿಯಬೇಕೆಂಬ ಅರಿವು ಮತ್ತು ಸೂಕ್ತವಾದ ವೃತ್ತಿಗಳನ್ನು ಆಯ್ದುಕೊಳ್ಳಲು ನಿಮಗೆ ಸಹಕಾರಿಯಾಗುತ್ತದೆ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_module', 'intro', 'ta', $$இந்தப் பயிற்சியில், உங்கள் பள்ளியில் உங்களுக்குப் பிடித்தவை எவை? நீங்கள் எதைக் கற்க விரும்புகிறீர்கள்? எதை விரும்பவில்லை? மற்றும் எதற்காக, எப்படி கற்கிறீர்கள் என்பதைப் பற்றிச் சிந்திக்க விரும்புகிறோம். இது உங்கள் உயர்கல்வியில் உங்கள் கனவுகளுக்கு ஏற்ப என்ன கற்க வேண்டும் என்ற விழிப்புணர்வையும், பொருத்தமான தொழிலைத் தேர்ந்தெடுப்பதற்கான உதவியையும் வழங்கும்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_module', 'intro', 'en', $$In this activity, we want you to think about what you like about your school, what you like to learn, and what you don't like. We also want you to reflect on why and how you learn. This will help you understand what to study in higher education to match your dreams and help you choose suitable careers.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_module', 'intro', 'hi', $$इस अभ्यास खंड में, लक्ष्य आपकी खूबियों, विकास के क्षेत्रों, जुनून, चुनौतियों, विचारों और भावनाओं को उजागर करना है। यह प्रक्रिया आपको खुद को बेहतर जानने में मदद करेगी। परिवार, मित्रों, शिक्षकों और मार्गदर्शकों से मार्गदर्शन लेने से आपको आप खुद को और भी बेहतर तरीके से समझ पाएंगे।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Subtitle text
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_module', 'subtitle', 'kn', $$ಸೂಚನೆ: ನಿಮಗೆ ಇಷ್ಟವಾದ ಅಥವಾ ಆನಂದಿಸುವ ವಿಷಯಗಳನ್ನು ಗುರುತಿಸುವುದು ಒಂದು ಬಾರಿಯ ಚಟುವಟಿಕೆಯಲ್ಲ; ಇದನ್ನು ನಿರಂತರವಾಗಿ ಗಮನಿಸುತ್ತಿರಬೇಕು. ಮುಂಬರುವ ದಿನಗಳಲ್ಲಿ ನೀವು ಯಾವುದಾದರೂ ಆಸಕ್ತಿದಾಯಕ ವಿಷಯವನ್ನು ಕಲಿತಾಗ, ಆ ಪಾಠ ಅಥವಾ ವಿಷಯವನ್ನು ದಾಖಲಿಸಲು "ನನ್ನ ಆಸಕ್ತಿಯ ಕ್ಷೇತ್ರಗಳು" ಕೋಷ್ಟಕವನ್ನು ಭರ್ತಿ ಮಾಡಿ. ಇದು ನಿಮಗೆ ಯಾವ ರೀತಿಯ ವಿಷಯಗಳು ಇಷ್ಟವೆಂದು ಅರಿಯಲು ಮತ್ತು ಅದಕ್ಕೆ ಅನುಗುಣವಾಗಿ ನಿಮ್ಮ ವೃತ್ತಿಜೀವನದ ಆಯ್ಕೆಗಳನ್ನು ರೂಪಿಸಿಕೊಳ್ಳಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_module', 'subtitle', 'ta', $$குறிப்பு: உங்களுக்குப் பிடித்த அல்லது நீங்கள் ரசிக்கும் விஷயங்களைக் கவனிப்பது ஒருமுறை செய்யும் செயல் அல்ல; இது தொடர்ந்து கவனிக்கப்பட வேண்டிய ஒன்று. வரும் நாட்களில் நீங்கள் ஏதேனும் சுவாரஸ்யமான விஷயத்தைக் கற்றுக் கொள்ளும்போது, அந்தப் பாடம் அல்லது பாடத்தைப் பதிவு செய்ய "எனது ஆர்வமுள்ள பகுதிகள்" என்ற அட்டவணையை நிரப்பவும். இது உங்களுக்கு எந்த வகையான பாடங்கள் பிடிக்கும் என்பதை உணரவும், அதற்கேற்ப உங்கள் தொழில் தேர்வுகளை அமைத்துக் கொள்ளவும் உதவும்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_module', 'subtitle', 'en', $$Note: Noticing things you like or enjoy is not a one-time activity; it is something to be observed continuously. When you learn something interesting in the coming days, fill in the table "My Areas of Interest" to record that lesson/subject. This will help you realize what types of subjects you like and allow you to align your career choices accordingly.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_module', 'subtitle', 'hi', $$नोट: अपनी पसंद या आनंद की चीज़ों पर ध्यान देना केवल एक बार की गतिविधि नहीं है; इसे निरंतर देखा जाना चाहिए। आने वाले दिनों में जब आप कुछ दिलचस्प सीखें, तो उस पाठ/विषय को दर्ज करने के लिए "मेरी रुचि के क्षेत्र" तालिका भरें। इससे आपको यह समझने में मदद मिलेगी कि आपको किस प्रकार के विषय पसंद हैं और आप उसी के अनुसार अपने करियर विकल्पों को चुन सकेंगे।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Summary title
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_module', 'summary_title', 'kn', $$ಸಾರಾಂಶ: ನನ್ನ ಮುಂದಿನ ಯೋಜನೆ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_module', 'summary_title', 'ta', $$சுருக்கம்: என் எதிர்கால திட்டம்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_module', 'summary_title', 'en', $$Summary: My future plan$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_module', 'summary_title', 'hi', $$सारांश: मेरी अगली योजना$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Section titles
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_section', 'section_1_title', 'kn', $$ಶಾಲಾ ಅನುಭವ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_section', 'section_1_title', 'ta', $$பள்ளி அனுபவம்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_section', 'section_1_title', 'en', $$School Experience$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_section', 'section_1_title', 'hi', $$स्कूल का अनुभव$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_section', 'section_2_title', 'kn', $$ವಿಷಯಗಳು ಮತ್ತು ಕಲಿಕೆಯ ಆಸಕ್ತಿಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_section', 'section_2_title', 'ta', $$பாடங்கள் மற்றும் கற்றல் விருப்பங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_section', 'section_2_title', 'en', $$Subjects & Learning Preferences$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_section', 'section_2_title', 'hi', $$विषय और सीखने की पसंद$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_section', 'section_3_title', 'kn', $$ಶೈಕ್ಷಣಿಕ ಸಾಧನೆ ಮತ್ತು ಕಲಿಕೆಯ ವಿಧಾನಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_section', 'section_3_title', 'ta', $$கல்வித் திறன் மற்றும் கற்றல் முறைகள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_section', 'section_3_title', 'en', $$Academic Performance & Learning Methods$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_section', 'section_3_title', 'hi', $$शैक्षणिक प्रदर्शन और सीखने के तरीके$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_section', 'section_4_title', 'kn', $$ಶಾಲಾ ಸಂಬಂಧಗಳು ಮತ್ತು ಅನುಭವಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_section', 'section_4_title', 'ta', $$பள்ளியில் உறவுகள் மற்றும் அனுபவங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_section', 'section_4_title', 'en', $$School Relationships & Experiences$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_section', 'section_4_title', 'hi', $$स्कूल के संबंध और अनुभव$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_section', 'section_5_title', 'kn', $$ಭವಿಷ್ಯ ಮತ್ತು ಅವಲೋಕನ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_section', 'section_5_title', 'ta', $$எதிர்காலம் மற்றும் பிரதிபலிப்பு$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_section', 'section_5_title', 'en', $$Future & Reflection$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_section', 'section_5_title', 'hi', $$भविष्य और आत्म-चिंतन$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Questions (21 total)
-- Section: School Experience
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_1', 'kn', $$ನಿಮಗೆ ಶಾಲೆಗೆ ಬರುವುದೆಂದರೆ ಇಷ್ಟವೇ? ಯಾಕೆ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_1', 'ta', $$உங்களுக்கு பள்ளிக்கு செல்ல விருப்பமா? ஏன்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_1', 'en', $$Do you like coming to school? Why?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_1', 'hi', $$क्या आपको स्कूल आना पसंद है? क्यों?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_1', 'kn', $$ನಿಮಗೆ ಶಾಲೆಗೆ ಬರಲು ಇಷ್ಟವೇ ಎಂದು ಬರೆಯಿರಿ ಮತ್ತು ಅದಕ್ಕೆ ಕಾರಣ ನೀಡಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_1', 'ta', $$பள்ளிக்குச் செல்ல விருப்பம் உள்ளதா என்பதை காரணத்துடன் எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_1', 'en', $$Write whether you like coming to school and give the reason.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_1', 'hi', $$लिखें कि क्या आपको स्कूल आना पसंद है और उसका कारण दें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_2', 'kn', $$ಶಾಲೆಯಲ್ಲಿ ಏನನ್ನು ಕಲಿಯಲು ಇಷ್ಟಪಡುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_2', 'ta', $$பள்ளியில் நீங்கள் என்ன கற்றுக்கொள்ள விரும்புகிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_2', 'en', $$What do you like to learn in school?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_2', 'hi', $$आप स्कूल में क्या सीखना पसंद करते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_2', 'kn', $$ನೀವು ಶಾಲೆಯಲ್ಲಿ ಏನನ್ನು ಕಲಿಯಲು ಇಷ್ಟಪಡುತ್ತೀರಿ ಎಂದು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_2', 'ta', $$பள்ளியில் உங்களுக்கு பிடித்த கற்றல் விஷயங்களை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_2', 'en', $$Write what you like to learn in school.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_2', 'hi', $$लिखें कि आप स्कूल में क्या सीखना पसंद करते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_3', 'kn', $$ನೀವು ಶಾಲೆಯಲ್ಲಿ ಕಲಿಯಲು ಇಷ್ಟಪಡದಿರಲು ಕಾರಣಗಳೇನು? ವಿವರಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_3', 'ta', $$பள்ளியில் கற்றுக்கொள்ள உங்களுக்கு பிடிக்காத காரணங்கள் என்ன? விளக்குங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_3', 'en', $$What are the reasons you do not like learning in school? Explain.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_3', 'hi', $$स्कूल में सीखने में आपकी अरुचि के क्या कारण हैं? विस्तार से बताएं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_3', 'kn', $$ನಿಮಗೆ ಶಾಲೆಯಲ್ಲಿ ಕಲಿಯುವುದು ಏಕೆ ಇಷ್ಟವಿಲ್ಲ ಎಂಬುದಕ್ಕೆ ಕಾರಣಗಳನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_3', 'ta', $$கற்றலில் விருப்பமில்லாத காரணங்களை தெளிவாக எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_3', 'en', $$Clearly write the reasons why you do not like learning in school.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_3', 'hi', $$स्पष्ट रूप से लिखें कि आपको स्कूल में पढ़ना क्यों पसंद नहीं है।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_4', 'kn', $$ಶಾಲೆಯಲ್ಲಿ ನಿಮಗೆ ಆತ್ಮೀಯ ಸ್ನೇಹಿತರು ಯಾರು? ಅವರಲ್ಲಿ ಇರುವ ಯಾವ ಗುಣ/ ಸಂಗತಿಗಳು ನೀವಿಬ್ಬರು ಸ್ನೇಹಿತರಾಗುವಂತೆ ಮಾಡಿದೆ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_4', 'ta', $$பள்ளியில் உங்களுக்கு நெருங்கிய நண்பர்கள் யார்? அவர்களிடம் உள்ள எந்த குணங்கள் / அம்சங்கள் அவர்களை உங்கள் நெருங்கிய நண்பர்களாக ஆக்கியது?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_4', 'en', $$Who are your close friends in school? What qualities or traits in them have made them your close friends?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_4', 'hi', $$स्कूल में आपके सबसे अच्छे दोस्त कौन हैं? उनके किन गुणों के कारण आप दोस्त बने?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_4', 'kn', $$ನಿಮ್ಮ ಆಪ್ತ ಸ್ನೇಹಿತರು ಮತ್ತು ಅವರ ವಿಶೇಷ ಗುಣಗಳ ಬಗ್ಗೆ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_4', 'ta', $$உங்கள் நெருங்கிய நண்பர்கள் மற்றும் அவர்களின் நல்ல குணங்களை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_4', 'en', $$Write about your close friends and the qualities that make them special.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_4', 'hi', $$अपने करीबी दोस्तों और उनके विशेष गुणों के बारे में लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Section: Subjects & Learning Preferences
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_5', 'kn', $$ನೀವು ಹೆಚ್ಚು ಇಷ್ಟಪಡುವ ಪಠ್ಯ ವಿಷಯಗಳು ಯಾವುವು? ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_5', 'ta', $$நீங்கள் அதிகம் விரும்பும் பாடப்பிரிவுகள் எவை? எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_5', 'en', $$Which subjects do you like the most? Write them.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_5', 'hi', $$आपके पसंदीदा विषय कौन से हैं? लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_5', 'kn', $$ನಿಮಗೆ ಅತಿ ಹೆಚ್ಚು ಇಷ್ಟವಾಗುವ ವಿಷಯಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_5', 'ta', $$உங்களுக்கு பிடித்த பாடங்களை பட்டியலிடுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_5', 'en', $$List the subjects you like the most.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_5', 'hi', $$उन विषयों की सूची बनाएं जिन्हें आप सबसे अधिक पसंद करते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_6', 'kn', $$ನೀವು ಈ ವಿಷಯಗಳನ್ನು ಏಕೆ ಇಷ್ಟಪಡುತ್ತೀರಿ? ಕಾರಣವನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_6', 'ta', $$நீங்கள் இந்த பாடத்தை ஏன் விரும்புகிறீர்கள்? காரணத்தை எழுதுக.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_6', 'en', $$Why do you like this subject? Write the reason.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_6', 'hi', $$आप इन विषयों को क्यों पसंद करते हैं? कारण लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_6', 'kn', $$ಯಾಕೆ ಇಷ್ಟ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ. ಉದಾಹರಣೆ :ಆ ವಿಷಯವು ಸುಲಭವಾಗಿರುವುದರಿಂದ, ಆಸಕ್ತಿದಾಯಕವಾಗಿರುವುದರಿಂದ ಅಥವಾ ಶಿಕ್ಷಕರು ಚೆನ್ನಾಗಿ ಬೋಧಿಸುವುದರಿಂದ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_6', 'ta', $$பாடம் எளிதாக இருப்பது, சுவாரசியமாக இருப்பது அல்லது ஆசிரியர் நன்றாக கற்பிப்பது காரணமாக இருக்கலாம்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_6', 'en', $$You may like the subject because it is easy, interesting, or taught well by the teacher.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_6', 'hi', $$कारण लिखें कि वे क्यों पसंद हैं। उदाहरण: विषय आसान है, दिलचस्प है या शिक्षक अच्छा पढ़ाते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_7', 'kn', $$ನಿಮಗೆ ಕಲಿಯಲು ಇಷ್ಟವಿಲ್ಲದ ಪಠ್ಯ ವಿಷಯಗಳು ಯಾವವು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_7', 'ta', $$உங்களுக்கு கற்க விருப்பமில்லாத பாடப்பிரிவுகள் எவை?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_7', 'en', $$Which subjects do you not like to study?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_7', 'hi', $$आपको कौन से विषय पढ़ना पसंद नहीं है?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_7', 'kn', $$ಯಾಕೆ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ. 
 ಉದಾಹರಣೆ : ಕಷ್ಟಕರವಾಗಿರುವುದರಿಂದ, ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಕಠಿಣವಾಗಿರುವುದರಿಂದ ಇತ್ಯಾದಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_7', 'ta', $$பாடம் கடினமாக இருப்பது அல்லது புரியாமல் இருப்பது காரணமாக சில பாடங்கள் பிடிக்காமல் இருக்கலாம்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_7', 'en', $$Some subjects may be disliked because they are difficult or hard to understand.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_7', 'hi', $$कारण लिखें। उदाहरण: कठिन होने के कारण, समझ में न आने के कारण आदि।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_8', 'kn', $$ಮೇಲಿನ ತಿಳಿಸಿದ ವಿಷಯಗಳಲ್ಲಿ ನಿಮಗೆ ಕಡಿಮೆ ಆಸಕ್ತಿ ಏಕೆ? ಈ ವಿಷಯಗಳನ್ನು ಕಲಿಯಲು ನೀವು ಯಾವ ಸವಾಲುಗಳನ್ನು ಪಡೆದಿದ್ದೀರಾ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_8', 'ta', $$மேலே கூறிய பாடங்களில் உங்களுக்கு ஏன் குறைந்த ஆர்வம் உள்ளது? இந்த பாடங்களை கற்க நீங்கள் எந்த உதவிகளை பெற்றீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_8', 'en', $$Why do you have less interest in the above subjects? What help did you receive to learn these subjects?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_8', 'hi', $$ऊपर बताए गए विषयों में आपकी रुचि कम क्यों है? इन्हें सीखने में आपको किन चुनौतियों का सामना करना पड़ा?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_8', 'kn', $$ಯಾಕೆ ಕಡಿಮೆ ಆಸಕ್ತಿ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ. ಶಿಕ್ಷಕರು, ಸ್ನೇಹಿತರು ಅಥವಾ ಇನ್ಯಾರ ಸಹಾಯ ಪಡೆದಿರಿ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_8', 'ta', $$பாடம் கடினமாக இருப்பதால் ஆர்வம் குறையலாம், ஆசிரியர் மற்றும் நண்பர்களின் உதவி கற்றலுக்கு உதவுகிறது.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_8', 'en', $$Interest may be less because the subject is difficult, and help from teachers or friends supports learning.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_8', 'hi', $$रुचि कम होने का कारण लिखें। यह भी लिखें कि आपने शिक्षकों, दोस्तों या किसी और की मदद ली या नहीं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Section: Academic Performance & Learning Methods
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_9', 'kn', $$ನೀವು ಹೆಚ್ಚು ಅಂಕಗಳಿಸುತ್ತಿರುವ ವಿಷಯಗಳು ಯಾವುವು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_9', 'ta', $$நீங்கள் அதிக மதிப்பெண் பெறும் பாடங்கள் எவை?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_9', 'en', $$Which subjects do you score the highest marks in?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_9', 'hi', $$आप किन विषयों में अधिक अंक प्राप्त कर रहे हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_9', 'kn', $$ನೀವು ಯಾವ ವಿಷಯಗಳಲ್ಲಿ ಹೆಚ್ಚಿನ ಅಂಕಗಳನ್ನು ಪಡೆಯುತ್ತಿದ್ದೀರಿ ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_9', 'ta', $$எளிதாக புரியும் மற்றும் விருப்பமான பாடங்களில் மாணவர்கள் அதிக மதிப்பெண் பெறுவார்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_9', 'en', $$Students usually score higher marks in subjects they understand well and like.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_9', 'hi', $$उन विषयों के नाम लिखें जिनमें आपको अच्छे अंक मिलते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_10', 'kn', $$ನೀವು ಕಡಿಮೆ ಅಂಕಗಳಿಸುತ್ತಿರುವ ವಿಷಯಗಳು ಯಾವುವು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_10', 'ta', $$நீங்கள் குறைந்த மதிப்பெண் பெறும் பாடங்கள் எவை?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_10', 'en', $$Which subjects do you score low marks in?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_10', 'hi', $$आप किन विषयों में कम अंक प्राप्त कर रहे हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_10', 'kn', $$ನೀವು ಯಾವ ವಿಷಯಗಳಲ್ಲಿ ಕಡಿಮೆ ಅಂಕಗಳನ್ನು ಪಡೆಯುತ್ತಿದ್ದೀರಿ ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_10', 'ta', $$பாடம் புரியாமல் இருப்பது அல்லது பயிற்சி குறைவாக இருப்பது குறைந்த மதிப்பெண்களுக்கு காரணமாகும்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_10', 'en', $$Low marks may be due to lack of understanding or insufficient practice.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_10', 'hi', $$उन विषयों के नाम लिखें जिनमें आपके अंक कम आते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_11', 'kn', $$ಈ ಕೆಳಗಿನ ಯಾವ ಕಲಿಕಾ ವಿಧಾನಗಳನ್ನು ನೀವು ಹೆಚ್ಚು ಇಷ್ಟಪಡುತ್ತೀರಿ? (ನಿಮಗೆ ಅನ್ವಯವಾಗುವುದನ್ನು ✔ ಎಂದು ಗುರುತು ಮಾಡಿ)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_11', 'ta', $$கீழ்க்கண்ட எந்த கற்றல் முறைகளை நீங்கள் அதிகமாக விரும்புகிறீர்கள்? (உங்களுக்கு பொருந்துவதை ✔ என்று குறிக்கவும்)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_11', 'en', $$Which of the following learning methods do you like the most? (Put a ✔ mark for the one that applies to you)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_11', 'hi', $$आप इनमें से कौन सी सीखने की विधि सबसे अधिक पसंद करते हैं? (✔️ का निशान लगाएं)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_11', 'kn', $$ನಿಮಗೆ ಅನ್ವಯಿಸುವ ಆಯ್ಕೆಗಳಿಗೆ ಮಾತ್ರ ಸರಿಯಾದ (✔️) ಗುರುತು ಹಾಕಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_11', 'ta', $$மாணவர்கள் தங்களுக்கு எளிதாக புரியும் மற்றும் விருப்பமான கற்றல் முறையை தேர்வு செய்ய வேண்டும்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_11', 'en', $$Tick ✔ only the options that apply to you.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_11', 'hi', $$केवल उन्हीं विकल्पों पर (✔️) का निशान लगाएं जो आप पर लागू होते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_12', 'kn', $$ನೀವು ಒಬ್ಬರೇ ಕಲಿಯಲು ಇಷ್ಟಪಡುತ್ತೀರಾ ಅಥವಾ ಗುಂಪಿನಲ್ಲಿ ಕಲಿಯಲು ಇಷ್ಟಪಡುತ್ತೀರಾ? ಏಕೆ? ಕಾರಣ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_12', 'ta', $$நீங்கள் தனியாகக் கற்றுக்கொள்ள விரும்புகிறீர்களா அல்லது குழுவாக  கற்றுக்கொள்ள விரும்புகிறீர்களா? ஏன்? காரணத்தை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_12', 'en', $$Do you prefer to learn alone or in a group? Why? Write the reason.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_12', 'hi', $$क्या आप अकेले पढ़ना पसंद करते हैं या समूह में? क्यों? कारण लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_12', 'kn', $$ನಿಮ್ಮ ಮೆಚ್ಚಿನ ಕಲಿಕಾ ವಿಧಾನವನ್ನು ಆರಿಸಿ ಮತ್ತು ಕಾರಣವನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_12', 'ta', $$உங்களுக்கு பிடித்த கற்றல் முறையை தேர்வு செய்து காரணத்தை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_12', 'en', $$Select your preferred learning method and write the reason.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_12', 'hi', $$अपनी पसंदीदा सीखने की विधि चुनें और उसका कारण लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Section: School Relationships & Experiences
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_13', 'kn', $$ಶಾಲೆಯಲ್ಲಿ ನೀವು ನಿಮ್ಮ ಸ್ನೇಹಿತರಿಂದ ಕಲಿಯುತ್ತೀರಾ? ಶಾಲೆಯಲ್ಲಿ ಇತ್ತೀಚೆಗೆ ಸ್ನೇಹಿತರಿಂದ ಕಲಿತ ಕೆಲವು ವಿಷಯಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_13', 'ta', $$பள்ளியில் நீங்கள் உங்கள் நண்பர்களிடமிருந்து கற்றுக்கொள்கிறீர்களா? பள்ளியில் சமீபத்தில் நண்பர்களிடமிருந்து கற்ற சில விஷயங்களை பட்டியலிடுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_13', 'en', $$Do you learn from your friends in school? List some of the things you have recently learned from friends at school.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_13', 'hi', $$क्या आप स्कूल में अपने दोस्तों से सीखते हैं? हाल ही में दोस्तों से सीखी गई कुछ चीज़ों की सूची बनाएं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_13', 'kn', $$ನಿಮ್ಮ ಸ್ನೇಹಿತರಿಂದ ನೀವು ಕಲಿತದ್ದನ್ನು ನೆನಪಿಸಿಕೊಳ್ಳಿ ಮತ್ತು ಪಟ್ಟಿ ಮಾಡಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_13', 'ta', $$நண்பர்களிடமிருந்து கற்ற விஷயங்களை நினைத்து பட்டியலிடுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_13', 'en', $$Recall and list what you learned from your friends.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_13', 'hi', $$याद करें कि आपने अपने दोस्तों से क्या सीखा है और उसकी सूची बनाएं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_14', 'kn', $$ಪಠ್ಯ ವಿಷಯಗಳನ್ನು ಹೊರತುಪಡಿಸಿ, ಶಾಲೆಗೆ ನಿಮ್ಮನ್ನು ಆಕರ್ಷಿಸುವ ಅಂಶಗಳು ಯಾವುವು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_14', 'ta', $$பாடப்புத்தகப் பாடங்களைத் தவிர, பள்ளிக்குச் செல்ல உங்களை ஈர்க்கும் அம்சங்கள் எவை?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_14', 'en', $$Apart from textbook subjects, what aspects attract you to school?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_14', 'hi', $$विषयों के अलावा, स्कूल की कौन सी बातें आपको आकर्षित करती हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_14', 'kn', $$ಶಾಲೆಯನ್ನು ಆಕರ್ಷಕವಾಗಿಸುವ ಇತರ ಚಟುವಟಿಕೆಗಳು ಅಥವಾ ಅಂಶಗಳನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_14', 'ta', $$பள்ளி மீது விருப்பத்தை ஏற்படுத்தும் பிற செயல்கள் அல்லது அம்சங்களை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_14', 'en', $$Write the other activities or aspects that make school appealing.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_14', 'hi', $$उन गतिविधियों या बातों के बारे में लिखें जो स्कूल को आकर्षक बनाती हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_15', 'kn', $$ನಿಮ್ಮ ನೆಚ್ಚಿನ ಶಿಕ್ಷಕರು ಯಾರು ಮತ್ತು ಏಕೆ? ಈ ಶಿಕ್ಷಕರು ನಿಮ್ಮ ಮೇಲೆ ಹೇಗೆ ಪ್ರಭಾವ ಬೀರುತ್ತಿದ್ದಾರೆ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_15', 'ta', $$உங்களுக்கு பிடித்த 2 ஆசிரியர்கள் யார்? ஏன்? இந்த 2 ஆசிரியர்கள் உங்கள் மீது எவ்வாறு தாக்கம் ஏற்படுத்தியுள்ளனர்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_15', 'en', $$Who are your two favourite teachers and why? How have these two teachers influenced you?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_15', 'hi', $$आपके पसंदीदा शिक्षक कौन हैं और क्यों? वे आप पर कैसा प्रभाव डालते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_15', 'kn', $$ನಿಮ್ಮ ನೆಚ್ಚಿನ ಶಿಕ್ಷಕರು ಮತ್ತು ಅವರು ನಿಮ್ಮ ಮೇಲೆ ಹೇಗೆ ಪ್ರಭಾವ ಬೀರಿದ್ದಾರೆ ಎಂಬುದರ ಬಗ್ಗೆ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_15', 'ta', $$பிடித்த ஆசிரியர்களையும் அவர்கள் உங்களை மாற்றிய விதத்தையும் எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_15', 'en', $$Write about your favourite teachers and how they influenced you.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_15', 'hi', $$अपने प्रिय शिक्षक के बारे में और उन्होंने आपको कैसे प्रभावित किया, इसके बारे में लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_16', 'kn', $$ಶಾಲೆಯಲ್ಲಿ ನಿಮಗೆ ತುಂಬಾ ಯಶಸ್ಸು ಅಥವಾ ಹೆಮ್ಮೆ ಅನಿಸುವಂತೆ ಮಾಡಿದ ಒಂದು ನಿರ್ದಿಷ್ಟ ಘಟನೆ / ಸನ್ನಿವೇಶ ಇದೆಯೇ? ಅದು ಏನು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_16', 'ta', $$பள்ளியில் உங்களுக்கு மிகுந்த வெற்றி அல்லது திருப்தி உணர்வை ஏற்படுத்திய ஒரு குறிப்பிட்ட நிகழ்வு / அனுபவம் உள்ளதா? அது என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_16', 'en', $$Is there any specific incident or experience in school that gave you a great sense of success or satisfaction? What is it?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_16', 'hi', $$क्या स्कूल में ऐसी कोई विशेष घटना हुई है जिससे आपको बहुत सफलता या गर्व महसूस हुआ हो? वह क्या थी?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_16', 'kn', $$ನೀವು ಹೆಮ್ಮೆ ಅಥವಾ ಸಂತೋಷ ಅನುಭವಿಸುವಂತೆ ಮಾಡಿದ ಶಾಲಾ ಘಟನೆಯ ಬಗ್ಗೆ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_16', 'ta', $$உங்களுக்கு பெருமை அல்லது திருப்தி அளித்த பள்ளி நிகழ்வை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_16', 'en', $$Write about a school incident that made you feel successful or satisfied.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_16', 'hi', $$स्कूल की उस घटना के बारे में लिखें जिसने आपको गर्व या खुशी महसूस कराई।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Section: Future & Reflection
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_17', 'kn', $$ನಿಮ್ಮ ಕನಸು ಮತ್ತು ನಿರೀಕ್ಷೆಗಳನ್ನು ಸಾಧಿಸಲು ಶಾಲೆಯಲ್ಲಿ ನೀವು ಕಲಿತ ವಿಷಯಗಳು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡುತ್ತ+B32:B33ವೆ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_17', 'ta', $$உங்கள் கனவுகள் மற்றும் எதிர்பார்ப்புகளை அடைய, பள்ளியில் நீங்கள் கற்ற விஷயங்கள் உங்களுக்கு எவ்வாறு உதவுகின்றன?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_17', 'en', $$How do the things you learned in school help you achieve your dreams and expectations?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_17', 'hi', $$स्कूल में सीखी गई बातें आपके सपनों और उम्मीदों को पूरा करने में कैसे मदद करती हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_17', 'kn', $$ಶಾಲೆಯಲ್ಲಿ ನೀವು ಕಲಿತದ್ದನ್ನು ನಿಮ್ಮ ಕನಸುಗಳು ಮತ್ತು ಗುರಿಗಳಿಗೆ ಸಂಬಂಧಿಸಿ ನೋಡಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_17', 'ta', $$பள்ளியில் கற்றதை உங்கள் கனவுகளுடன் தொடர்புபடுத்தி எழுதுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_17', 'en', $$Relate what you learned in school to your dreams and goals.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_17', 'hi', $$स्कूल में आपने जो सीखा है उसे अपने सपनों और लक्ष्यों से जोड़कर देखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_18', 'kn', $$ನಿಮ್ಮ ಶಾಲೆಯಲ್ಲಿ ಯಾವ, ಯಾವ ಸಂಗತಿಗಳು ಬದಲಾಗಬೇಕು ಎಂದು ನೀವು ಬಯಸುತ್ತೀರಿ? ಅದಕ್ಕೆ ಕಾರಣವೇನು ತಿಳಿಸಿ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_18', 'ta', $$உங்கள் பள்ளியில் எந்த எந்த விஷயங்கள் மாற்றப்பட வேண்டும் என்று நீங்கள் விரும்புகிறீர்கள்? அதற்கான காரணம் என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_18', 'en', $$What are the things you want to be changed in your school? What is the reason for that?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_18', 'hi', $$आप अपने स्कूल में किन चीज़ों को बदलना चाहते हैं? इसका कारण बताएं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_18', 'kn', $$ನೀವು ಬಯಸುವ ಬದಲಾವಣೆಗಳು ಮತ್ತು ಅವುಗಳಿಗೆ ಕಾರಣಗಳನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_18', 'ta', $$மாற்றம் வேண்டிய விஷயங்களையும் அதற்கான காரணத்தையும் எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_18', 'en', $$Write the changes you want and the reasons for them.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_18', 'hi', $$उन बदलावों के बारे में लिखें जिन्हें आप देखना चाहते हैं और उनका कारण भी बताएं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_19', 'kn', $$ಅಭ್ಯಾಸ ಮಾಡಲು ಯಾವುದಾದರೂ ಪ್ರತ್ಯೇಕ ಸ್ಥಳ ಇದೆಯೇ? ಅದು ಯಾಕೆ ಅಗತ್ಯ? ತಿಳಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_19', 'ta', $$உங்களுக்குப் படிக்கத் தனியாக இடம் உள்ளதா? அது ஏன் அவசியம்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_19', 'en', $$Do you have a separate place to study? Why is it necessary?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_19', 'hi', $$क्या पढ़ाई के लिए कोई अलग जगह है? वह क्यों आवश्यक है? बताएं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_19', 'kn', $$ನಿಮ್ಮ ಅಭ್ಯಾಸಕ್ಕೆಂದು ಪ್ರತ್ಯೇಕ ಸ್ಥಳ ಇದೆಯೇ? ಹಾಗು ಅದು ಯಾಕೆ ಅಗತ್ಯ ಎಂಬುದರ ಬಗ್ಗೆ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_19', 'ta', $$உங்கள் படிப்பிற்கெனத் தனி இடம் இருக்கிறதா என்பதைப் பற்றி எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_19', 'en', $$Write about whether you have a separate place for your studies.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_19', 'hi', $$लिखें कि क्या आपके पास पढ़ाई के लिए कोई अलग जगह है और वह क्यों जरूरी है।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_20', 'kn', $$ನಿಮ್ಮ ಜೀವನದಲ್ಲಿ ಕಲಿಕೆಗೆ ಸಂಬಂಧಿಸಿದಂತೆ ಶಾಲೆ ಮಹತ್ವದ ಪಾತ್ರವಹಿಸಿದೆಯೇ? ನಿಮ್ಮ ಅಭಿಪ್ರಾಯವನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_20', 'ta', $$உங்கள் வாழ்க்கை, கற்றலுடன் தொடர்புடையதாக மாற்றுவதில்  பள்ளிக்கு முக்கியமான பங்கு உள்ளதா? உங்கள் கருத்தை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_20', 'en', $$Does the school play an important role in your life related to learning? Write your opinion.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_20', 'hi', $$क्या आपके जीवन में शिक्षा के मामले में स्कूल ने महत्वपूर्ण भूमिका निभाई है? अपनी राय लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_20', 'kn', $$ನಿಮ್ಮ ಕಲಿಕೆಯಲ್ಲಿ ಶಾಲೆಯ ಪಾತ್ರದ ಬಗ್ಗೆ ನಿಮ್ಮ ಅಭಿಪ್ರಾಯವನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_20', 'ta', $$கற்றலில் பள்ளியின் பங்கைப் பற்றி உங்கள் கருத்தை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_20', 'en', $$Write your opinion about the role of school in your learning.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_20', 'hi', $$अपनी पढ़ाई और सीखने में स्कूल की भूमिका पर अपनी राय लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_21', 'kn', $$ಶಾಲೆಯ ಚಟುವಟಿಕೆಗಳು ಮತ್ತು ಕಲಿಕೆಯ ಬಗ್ಗೆ ನಿಮ್ಮ ಪಾಲಕರೊಂದಿಗೆ ಚರ್ಚಿಸಲು ಹೇಳಿಕೊಳ್ಳುವುದೆಂದರೆ ನಿಮಗೆ ಇಷ್ಟವೇ? ಯಾವೆಲ್ಲ ವಿಷಯಗಳನ್ನು ನೀವು ಅವರೊಂದಿಗೆ ಚರ್ಚಿಸುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_21', 'ta', $$பள்ளியின் செயல்பாடுகள் மற்றும் கற்றல் குறித்து உங்கள் பெற்றோருடன் விவாதிக்க உங்களுக்கு விருப்பமா? அவர்களுடன் நீங்கள் எந்த விஷயங்களைப் பேசுகிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_21', 'en', $$Do you like to discuss school activities and learning with your parents? What topics do you discuss with them?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_question', 'question_21', 'hi', $$क्या आपको अपने माता-पिता के साथ स्कूल की गतिविधियों और पढ़ाई के बारे में चर्चा करना पसंद है? आप उनके साथ किन विषयों पर चर्चा करते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_21', 'kn', $$ನಿಮ್ಮ ಪೋಷಕರೊಂದಿಗೆ ನೀವು ಚರ್ಚಿಸುವ ಶಾಲೆಗೆ ಸಂಬಂಧಿಸಿದ ವಿಷಯ ಯಾವುದು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_21', 'ta', $$பெற்றோருடன் நீங்கள் பேசும் பள்ளி தொடர்பான விஷயங்களை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_21', 'en', $$Write the school-related topics you discuss with your parents.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_help', 'question_21', 'hi', $$स्कूल से संबंधित उन विषयों के बारे में लिखें जिन पर आप अपने माता-पिता के साथ चर्चा करते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Summary questions (7 total)
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_1', 'kn', $$ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_1', 'ta', $$எனக்கு பிடித்த பாடங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_1', 'en', $$Subjects I like$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_1', 'hi', $$वे विषय जो मुझे पसंद हैं$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_2', 'kn', $$ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳಿಂದ ನಾನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_2', 'ta', $$விருப்பமான பாடங்கள் மூலம் நான் அடையக்கூடிய தொழில்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_2', 'en', $$Careers I can pursue based on the subjects I like$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_2', 'hi', $$मेरी पसंद के विषयों से मैं जो करियर/पेशे अपना सकता हूँ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_3', 'kn', $$ನಾನು ಇಷ್ಟಪಡದ ವಿಷಯಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_3', 'ta', $$எனக்கு பிடிக்காத பாடங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_3', 'en', $$Subjects I do not like$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_3', 'hi', $$वे विषय जो मुझे पसंद नहीं हैं$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_4', 'kn', $$ಇಷ್ಟಪಡದ ವಿಷಯಗಳಲ್ಲಿ ನಾನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_4', 'ta', $$விருப்பமில்லாத பாடங்களில் முன்னேறினால் நான் அடையக்கூடிய தொழில்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_4', 'en', $$Careers I can pursue if I make progress in the subjects I do not like$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_4', 'hi', $$जिन विषयों को मैं पसंद नहीं करता, यदि उनमें सुधार करूँ तो मैं कौन से करियर अपना सकता हूँ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_5', 'kn', $$ಪಠ್ಯ ವಿಷಯಗಳ ಜೊತೆಗೆ, ನಾನು ಉತ್ತಮ ಸಾಧನೆ ಮಾಡುವ ಇತರ ಚಟುವಟಿಕೆಗಳು / ವಿಷಯಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_5', 'ta', $$நான் சிறப்பாகச் செய்யும் பிற செயல்பாடுகள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_5', 'en', $$Other activities I perform well in$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_5', 'hi', $$शैक्षणिक विषयों के अलावा, अन्य गतिविधियाँ / विषय जिनमें मैं अच्छा प्रदर्शन करता हूँ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_6', 'kn', $$ನಾನು ಈ ಕೌಶಲ್ಯಗಳನ್ನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ನನ್ನ ಕೆಲಸ / ವೃತ್ತಿಯ ಆಯ್ಕೆಗೆ ಸಹಾಯವಾಗುತ್ತದೆ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_6', 'ta', $$நான் மேம்படுத்த வேண்டிய திறன்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_6', 'en', $$If I improve these skills, it will help me in choosing my job / career.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('school_learning_summary_question', 'summary_question_6', 'hi', $$यदि मैं इन कौशलों (skills) में सुधार करता हूँ, तो इससे मुझे अपने काम / करियर के चुनाव में मदद मिलेगी।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;


-- ------------------------------------------------------------
-- 9.5_My Talents and Hobbies (hobbies)
-- ------------------------------------------------------------

-- Module title
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_module', 'title', 'kn', $$ನನ್ನ ಪ್ರತಿಭೆ ಮತ್ತು ಹವ್ಯಾಸಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_module', 'title', 'ta', $$என் திறமைகள் மற்றும் பொழுதுபோக்குகள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_module', 'title', 'en', $$My Talents and Hobbies$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_module', 'title', 'hi', $$मेरा प्रतिबाएँ और शौक$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Title text (intro)
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_module', 'intro', 'kn', $$ಈ ಚಟುವಟಿಕೆ ಮೂಲಕ ನೀವು ನಿಮ್ಮಲ್ಲಿರುವ ಪ್ರತಿಭೆ, ನಿಮ್ಮ ಹವ್ಯಾಸಗಳು ಮತ್ತು ನಿಮಗೆ ಸಂತೋಷ ನೀಡುವ ಕೆಲಸ/ಚಟುವಟಿ ಕೆಗಳ ಕುರಿತು ಅವಲೋಕನ ಮಾಡಿಕೊಳ್ಳುತ್ತೀರಿ. ಇದರಿಂದ ನಿಮ್ಮ ಆಸಕ್ತಿಗಳೇನು, ನಿಮ್ಮ ಹವ್ಯಾಸಗಳು ಯಾವವು ಮತ್ತು ನಿಮ್ಮ ಪ್ರತಿಭೆಯ ಕ್ಷೇತ್ರಗಳು ಯಾವುದೆಂದು ನೀವೇ ಅರಿಯಲು ಸಾಧ್ಯವಾಗುತ್ತದೆ. ಈ ಮೂಲಕ ನಿಮ್ಮ ಸ್ವಭಾವ, ಆಸಕ್ತಿ ಮತ್ತು ಭಾವನೆಗೆ ಸರಿಹೊಂದುವ ವೃತ್ತಿಗಳನ್ನು ಗುರುತಿಸಿ ನಿರ್ಧರಿಸಲು ಈ ಚಟುವಟಿಕೆ ಸಹಕಾರಿಯಾಗುತ್ತದೆ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_module', 'intro', 'ta', $$இந்த செயல்பாட்டின் மூலம், உங்களிடம் உள்ள திறமைகள், உங்கள் பொழுதுபோக்குகள் மற்றும் உங்களுக்கு மகிழ்ச்சி அளிக்கும் செயல்கள் குறித்து நீங்கள் சிந்திக்க முடியும். இதனால், உங்கள் ஆர்வங்கள் என்ன, உங்கள் பொழுதுபோக்குகள் எவை, மற்றும் உங்கள் திறமை இருக்கும் துறைகள் எவை என்பதையும் நீங்கள் புரிந்துகொள்ள முடியும். இதன் மூலம், உங்கள் தன்மை, ஆர்வம் மற்றும் உணர்வுகளுக்கு ஏற்ற தொழில்களை அடையாளம் காணவும் தீர்மானிக்கவும் இந்த செயல்பாடு உதவுகிறது.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_module', 'intro', 'en', $$In this practice section, we delve into your interests, hobbies, pastimes, and activities that bring you joy, exploring the depths of your creativity. By delving into your hobbies and interests, you can not only fi nd happiness but also identify your unique learning style and potential professions aligned with your passions.
Through this activity, you will explore your talents, hobbies, and the work/activities that bring you joy. This will help you understand your interests, hobbies, and areas of talent, and guide you in identifying careers that suit your personality, interests, and passions."$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_module', 'intro', 'hi', $$इस अभ्यास खंड में, हम आपकी रुचियों, शौक, मनोरंजन और उन गतिविधियों पर गहराई से चर्चा करेंगे जो आपको खुशी देती हैं, और आपकी रचनात्मकता की गहराई को उजागर करेंगे। अपने शौक और रुचियों पर गहराई से विचार करके, आप न केवल खुशी पा सकते हैं, बल्कि अपनी अनूठी सीखने की शैली और अपने जुनून से जुड़े संभावित व्यवसायों की भी पहचान कर सकते हैं।
इस गतिविधि के माध्यम से, आप अपनी प्रतिभाओं, शौक और उन कामों/गतिविधियों का पता लगाएंगे जो आपको खुशी देते हैं। इससे आपको अपनी रुचियों, शौक और प्रतिभा के क्षेत्रों को समझने में मदद मिलेगी, और आपको अपने व्यक्तित्व, रुचियों और जुनून के अनुकूल करियर चुनने में मदद मिलेगी।
"शौक हमारी प्रतिभा को सामने लाते हैं और हमें अपने सपनों को पूरा करने के लिए प्रेरित करते हैं।"$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Subtitle text
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_module', 'subtitle', 'kn', $$“ಹವ್ಯಾಸಗಳು ನಮ್ಮಲ್ಲಿರುವ ಪ್ರತಿಭೆಯನ್ನು ಮುನ್ನೆಲೆಗೆ ತರುತ್ತವೆ ಮತ್ತು ಕನಸುಗಳನ್ನು ಈಡೇರಿಸಲು ಸ್ಪೂರ್ತಿ ನೀಡುತ್ತವೆ.
 I. ಹವ್ಯಾಸ (Hobby) ಎಂದರೆ ಏನು? 
 a) ಅದು ನಾವು ಖುಷಿಯಿಂದ, ನಮ್ಮ ದೈನಂದಿನ ಕೆಲಸಗಳು ಆದಮೇಲೆ ಮಾಡುವ ಚಟುವಟಿಕೆ. 
 b) ಸಮಯ ಕಳೆಯಲು ಅಥವಾ ಮನಸ್ಸಿಗೆ ಸಂತೋಷ ನೀಡಲು ಮಾಡುವ ಕೆಲಸ. 
 c) ಹವ್ಯಾಸ ಕಲಿತು ಬೆಳೆಸಿಕೊಳ್ಳಬಹುದಾದದ್ದು. 
 ಉದಾಹರಣೆಗಳು: ಚಿತ್ರ ಬಿಡಿಸುವುದು, ಹಾಡು ಹಾಡುವುದು, ಓದು, ನೃತ್ಯ, ಹಕ್ಕಿಗಳನ್ನು ನೋಡುವುದು, ತೋಟಗಾರಿಕೆ ಇತ್ಯಾದಿ.

II. ಪ್ರತಿಭೆ (Talent) ಎಂದರೆ ಏನು? 
 a) ಹುಟ್ಟಿನಿಂದಲೇ ನಮ್ಮೊಳಗೆ ಇರುವ ಒಂದು ನೈಸರ್ಗಿಕ ಸಾಮರ್ಥ್ಯ. 
 b) ಹೆಚ್ಚು ಅಭ್ಯಾಸ ಮಾಡದೇಸಹ ಸುಲಭವಾಗಿ ಮಾಡಬಹುದಾದ ಕೌಶಲ್ಯ.
 c) ಇದು ಇನ್ನಷ್ಟು ಅಭ್ಯಾಸದಿಂದ ಅಪಾರ ಸಾಧನೆಗೆ ದಾರಿ ಮಾಡಬಹುದು. 
 ಉದಾಹರಣೆಗಳು: ಸಹಜವಾಗಿ ಹಾಡುವಂತ, ಸ್ಪಷ್ಟವಾಗಿ ಸಂವಹನ ಮಾಡುವಂತ, ಗಣಿತದಲ್ಲಿ ವೇಗವಾಗಿ ಉತ್ತರ ನೀಡುವಂತ, ತ್ವರಿತವಾಗಿ ಕಲಿಯುವಂತ ಸಾಮರ್ಥ್ಯಗಳು ಇತ್ಯಾದಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_module', 'subtitle', 'ta', $$I. பொழுதுபோக்கு (Hobby) என்றால் என்ன?
a) நமது மகிழ்ச்சிக்காக, தினசரி வேலைகளுடன் சேர்த்து செய்யப்படும் செயல்கள்.                
b) நேரத்தை பயனுள்ளதாக கழிக்க அல்லது மனதிற்கு மகிழ்ச்சி தர செய்யப்படும் செயல்கள்.                
c) பொழுதுபோக்கை கற்றுக்கொண்டு வளர்த்துக்கொள்ளலாம்.

II. திறமை (Talent) என்றால் என்ன?
a) பிறப்பிலிருந்தே நமக்கு உள்ள இயற்கையான திறன்.                                
b) அதிக பயிற்சி இல்லாமலேயே எளிதாக செய்யக்கூடிய திறமை.                                
c) இதை மேலும் பயிற்சி செய்வதன் மூலம் பெரிய சாதனைகளை அடையலாம்.                                
                                
உதாரணங்கள்:                                
எளிதாக பாடும் திறன், தெளிவாக பேசும் திறன், கணிதத்தில் வேகமாக விடை அளிக்கும் திறன், விரைவாக கற்றுக்கொள்ளும் திறன் போன்றவை.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_module', 'subtitle', 'en', $$I. What is a Hobby?
a) An activity that we do for our happiness along with our daily work.        
b) An activity done to spend time usefully or to give happiness to the mind.        
c) A hobby can be learned and developed.

II. What is Talent?
a) A natural ability that we are born with.                
b) A skill that can be done easily even without much practice.                
c) With more practice, it can lead to great achievements.                
                
Examples:                
Ability to sing easily, speak clearly, give quick answers in mathematics, learn quickly, etc.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_module', 'subtitle', 'hi', $$I. शौक क्या है?
क) यह एक ऐसी गतिविधि है जिसे हम अपने दैनिक कार्यों के बाद मनोरंजन के लिए करते हैं।
ख) समय बिताने या मन को प्रसन्न करने के लिए किया गया कार्य।
ग) शौक एक ऐसी चीज़ है जिसे समय के साथ सीखा और विकसित किया जा सकता है।
उदाहरण: चित्रकारी, गायन, पढ़ना, नृत्य, पक्षी देखना, बागवानी, आदि।

II. प्रतिभा क्या है?
क) एक प्राकृतिक क्षमता जो हमारे साथ जन्म से होती है।
ख) ऐसा कौशल जो बिना अधिक अभ्यास के आसानी से किया जा सकता है।
ग) अधिक अभ्यास से इससे अपार उपलब्धि प्राप्त की जा सकती है।
उदाहरण: स्वाभाविक रूप से गाने, स्पष्ट रूप से संवाद करने, गणित में प्रश्नों का शीघ्रता से उत्तर देने, शीघ्रता से सीखने आदि की क्षमता।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Summary title
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_module', 'summary_title', 'kn', $$ಸಾರಾಂಶ: ನನ್ನ ಮುಂದಿನ ಯೋಜನೆ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_module', 'summary_title', 'ta', $$சுருக்கம்: எனது அடுத்த திட்டம்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_module', 'summary_title', 'en', $$My Next Plan$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_module', 'summary_title', 'hi', $$सारांश: मेरी अगली योजना$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Summary subtitle
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_module', 'summary_subtitle', 'kn', $$ನನ್ನ ಆಸಕ್ತಿಯ ಸಾರಾಂಶ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_module', 'summary_subtitle', 'ta', $$எனது ஆர்வங்களின் சுருக்கம்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_module', 'summary_subtitle', 'en', $$Summary of my interests$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_module', 'summary_subtitle', 'hi', $$मेरी रुचियों का सारांश$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Section titles
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_1_title', 'kn', $$ಹವ್ಯಾಸಗಳು ಮತ್ತು ಆಸಕ್ತಿಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_1_title', 'ta', $$பொழுதுபோக்குகள் மற்றும் ஆர்வங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_1_title', 'en', $$Hobbies & Interests$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_1_title', 'hi', $$शौक और रुचियां$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_1_subtitle', 'kn', $$ನಿಮ್ಮ ಹವ್ಯಾಸಗಳ ಬಗ್ಗೆ ಮತ್ತು ಅವುಗಳಿಗೆ ಪ್ರೇರಣೆ ನೀಡಿದ ವಿಷಯಗಳ ಬಗ್ಗೆ ತಿಳಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_1_subtitle', 'ta', $$உங்கள் பொழுதுபோக்குகள் மற்றும் அவற்றிற்கான உத்வேகம் பற்றி உங்கள் கருத்துக்களைப் பகிர்ந்து கொள்ளுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_1_subtitle', 'en', $$Share your thoughts about your hobbies and what inspires them$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_1_subtitle', 'hi', $$अपने शौक और उन्हें प्रेरित करने वाली चीजों के बारे में अपने विचार साझा करें$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_2_title', 'kn', $$ಪ್ರತಿಭೆಗಳು ಮತ್ತು ಅಭ್ಯಾಸ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_2_title', 'ta', $$திறமைகள் மற்றும் பயிற்சி$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_2_title', 'en', $$Talents & Practice$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_2_title', 'hi', $$प्रतिभा और अभ्यास$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_2_subtitle', 'kn', $$ನಿಮ್ಮಲ್ಲಿರುವ ನೈಸರ್ಗಿಕ ಪ್ರತಿಭೆಗಳು ಮತ್ತು ಅವುಗಳನ್ನು ನೀವು ಹೇಗೆ ಬೆಳೆಸಿಕೊಳ್ಳುತ್ತೀರಿ ಎಂಬುದನ್ನು ಕಂಡುಕೊಳ್ಳಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_2_subtitle', 'ta', $$உங்கள் இயல்பான திறமைகளையும் அவற்றை நீங்கள் எவ்வாறு மேம்படுத்துகிறீர்கள் என்பதையும் ஆராயுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_2_subtitle', 'en', $$Explore your natural talents and how you develop them$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_2_subtitle', 'hi', $$अपनी प्राकृतिक प्रतिभाओं को पहचानें और जानें कि आप उन्हें कैसे विकसित करते हैं$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_3_title', 'kn', $$ಬೆಂಬಲ ಮತ್ತು ವೃತ್ತಿ ಸಂಬಂಧ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_3_title', 'ta', $$ஆதரவு மற்றும் தொழில் தொடர்பு$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_3_title', 'en', $$Support & Career Connection$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_3_title', 'hi', $$सहयोग और करियर संबंध$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_3_subtitle', 'kn', $$ನಿಮ್ಮ ಹವ್ಯಾಸಗಳಿಂದ ಸಿಗುವ ಬೆಂಬಲ ಮತ್ತು ವೃತ್ತಿ ಅವಕಾಶಗಳ ಬಗ್ಗೆ ಆಲೋಚಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_3_subtitle', 'ta', $$உங்கள் பொழுதுபோக்குகளிலிருந்து கிடைக்கும் ஆதரவு மற்றும் தொழில் வாய்ப்புகள் பற்றிச் சிந்தியுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_3_subtitle', 'en', $$Reflect on support systems and career possibilities from your hobbies$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_section', 'section_3_subtitle', 'hi', $$अपने शौक से मिलने वाले सहयोग और करियर की संभावनाओं पर विचार करें$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Questions (14 total)
-- Section: Hobbies & Interests
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_1', 'kn', $$ನೀವು ಬಿಡುವಿನ ವೇಳೆಯಲ್ಲಿ ಯಾವ ಕೆಲಸ/ ಚಟುವಟಿಕೆಗಳನ್ನು ಮಾಡುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_1', 'ta', $$நீங்கள் ஓய்வு நேரத்தில் எந்த வேலைகள் / செயல்களை செய்கிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_1', 'en', $$What activities / work do you do in your free time?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_1', 'hi', $$आप अपने खाली समय में कौन से काम या गतिविधियाँ करते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_1', 'kn', $$ಬಿಡುವಿನ ಸಮಯದಲ್ಲಿ ನೀವು ಮಾಡುವ ಕೆಲಸ ಅಥವಾ ಚಟುವಟಿಕೆಗಳ ಬಗ್ಗೆ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_1', 'ta', $$புத்தகம் படிப்பது, வரைவது அல்லது விளையாடுவது போன்றவற்றை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_1', 'en', $$Write about activities like reading, drawing or playing$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_1', 'hi', $$खाली समय में आप जो भी काम करते हैं, उनके बारे में लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_2', 'kn', $$ನಿಮಗೆ ಯಾವುದಾದರೂ ಹವ್ಯಾಸಗಳು ಇದೆಯೇ? ನಿಮ್ಮಲ್ಲಿರುವ ಒಳ್ಳೆಯ ಹವ್ಯಾಸಗಳನ್ನು ಪಟ್ಟಿಮಾಡಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_2', 'ta', $$உங்களுக்கு ஏதேனும் பொழுதுபோக்குகள் (Hobbies) உண்டா? பட்டியலிடுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_2', 'en', $$Do you have any hobbies? List them.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_2', 'hi', $$क्या आपका कोई शौक (Hobby) है? अपने अच्छे शौकों की सूची बनाएं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_2', 'kn', $$ಸಂತೋಷಕ್ಕಾಗಿ ರೂಢಿಸಿಕೊಂಡ ಒಳ್ಳೆಯ ಕೆಲಸ ಅಥವಾ ಚಟುವಟಿಕೆಗಳನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_2', 'ta', $$உங்களுக்கு மகிழ்ச்சி தரும் செயல்களைப் பட்டியலிடுங்கள் (உதாரணம்: தோட்டம் வளர்த்தல்).$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_2', 'en', $$List activities you do for joy (e.g., gardening, singing).$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_2', 'hi', $$खुशी के लिए आप जो अच्छे काम या गतिविधियाँ करते हैं, उनके बारे में लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_3', 'kn', $$ನೀವು ಮೇಲೆ ಪಟ್ಟಿಮಾಡಿದ ಹವ್ಯಾಸಗಳಲ್ಲಿ ನಿಮ್ಮ ನೆಚ್ಚಿನ ಹವ್ಯಾಸ ಯಾವುದು? ಯಾಕೆ? ಕಾರಣ ವಿವರಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_3', 'ta', $$மேலே பட்டியலிட்ட திறமைகளில் உங்களுக்கு மிகவும் பிடித்த திறமை எது? ஏன்? காரணம் விளக்குங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_3', 'en', $$Among the hobbies listed above, which is your favorite? Why?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_3', 'hi', $$ऊपर बताए गए शौकों में से आपका सबसे पसंदीदा शौक कौन सा है? और क्यों?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_3', 'kn', $$ನಿಮಗೆ ಅತಿ ಹೆಚ್ಚು ಇಷ್ಟವಾದದ್ದನ್ನು ಆರಿಸಿ ಮತ್ತು ಅದು ಏಕೆ ಇಷ್ಟ ಎಂದು ವಿವರಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_3', 'ta', $$அது ஏன் உங்களுக்கு மகிழ்ச்சி தருகிறது என்பதை 2-3 வரிகளில் விளக்குங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_3', 'en', $$Choose your favorite and explain why it brings you joy.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_3', 'hi', $$अपना सबसे पसंदीदा शौक चुनें और बताएं कि वह आपको क्यों पसंद है।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_4', 'kn', $$ನಿಮ್ಮ ಹವ್ಯಾಸಗಳು (Hobbies) ಎಂದಾದರೂ ಬದಲಾಗಿವೆಯೇ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_4', 'ta', $$உங்கள் பொழுதுபோக்குகள் எப்போதாவது மாறியுள்ளதா?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_4', 'en', $$Have your hobbies changed at any time?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_4', 'hi', $$क्या समय के साथ आपके शौक (Hobbies) कभी बदले हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_4', 'kn', $$ಕಾಲಾನಂತರದಲ್ಲಿ ನಿಮ್ಮ ಹವ್ಯಾಸಗಳು ಬದಲಾಗಿವೆಯೇ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_4', 'ta', $$முன்பு பிடித்தது மற்றும் இப்போது பிடித்ததை ஒப்பிட்டு எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_4', 'en', $$Mention if your interests have changed over the years$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_4', 'hi', $$क्या बड़े होने के साथ-साथ आपके पुराने शौक बदल गए हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_5', 'kn', $$ನಿಮ್ಮ ಹವ್ಯಾಸಗಳಿಗೆ ಪ್ರೇರಣೆ ನೀಡಿದ ಸಂಗತಿ ಯಾವುದು? ಯಾವುದಾದರೂ ಹವ್ಯಾಸ ನಿಮ್ಮ ಕುಟುಂಬದಿಂದ, ಅನುವಂಶಿಕವಾಗಿ ಬಂದಿದೆಯೇ? ಈ ಕುರಿತು ಆಲೋಚಿಸಿ ತಿಳಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_5', 'ta', $$உங்கள் பொழுதுபோக்கிற்குத் ஊக்கம் அளித்தது எது?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_5', 'en', $$What inspired your hobbies?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_5', 'hi', $$आपको ये शौक पालने की प्रेरणा कहाँ से मिली? क्या कोई शौक आपको अपने परिवार या बुजुर्गों से मिला है?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_5', 'kn', $$ನಿಮ್ಮ ಹವ್ಯಾಸಗಳಿಗೆ ಪ್ರೇರಣೆ ನೀಡಿದವರು ಯಾರು ಎಂದು ತಿಳಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_5', 'ta', $$உங்கள் குடும்பம், நண்பர்கள் அல்லது ஆசிரியர் யாராவது காரணமா என எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_5', 'en', $$Mention who or what inspired you (family, friends, etc.).$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_5', 'hi', $$बताएं कि आपको इन शौकों के लिए किसने प्रेरित किया या बढ़ावा दिया।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_6', 'kn', $$ನಿಮಗೆ ಪರಿಚಿತವಿರುವ ಯಾರಾದರೂ ಇದೇ ರೀತಿಯ ಹವ್ಯಾಸಗಳು ಅಥವಾ ಆಸಕ್ತಿಗಳನ್ನು ಹೊಂದಿದ್ದಾರೆಯೇ? ಅವರು ಯಾರು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_6', 'ta', $$உங்களுக்கு அறிமுகமானவர்களில் யாராவது இதே போன்ற பொழுதுபோக்கு கொண்டுள்ளார்களா? அவர்கள் யார்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_6', 'en', $$Do you know anyone who has similar hobbies?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_6', 'hi', $$क्या आपके जान-पहचान में किसी और के भी ऐसे ही शौक हैं? वे कौन हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_6', 'kn', $$ಹವ್ಯಾಸ ಇರುವ ವ್ಯಕ್ತಿ ಸ್ನೇಹಿತ, ಸಂಬಂಧಿ ಅಥವಾ ಶಿಕ್ಷಕ ಇರಬಹುದು.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_6', 'ta', $$தெரிந்த நண்பர் அல்லது உறவினரின் பெயரைக் குறிப்பிடுங்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_6', 'en', $$Name a friend, relative, or teacher with the same hobby.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_6', 'hi', $$वे व्यक्ति आपके दोस्त, रिश्तेदार या शिक्षक भी हो सकते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_7', 'kn', $$ನಿಮ್ಮ ನೆಚ್ಚಿನ ಹವ್ಯಾಸದಲ್ಲಿ ತೊಡಗಿಸಿಕೊಂಡಾಗ ನಿಮಗೆ ಹೇಗನಿಸುತ್ತದೆ? ಅದು ನಿಮಗೆ ವಿಶ್ರಾಂತಿ ಪಡೆಯಲು ಅಥವಾ ಹೆಚ್ಚು ಆತ್ಮವಿಶ್ವಾಸವನ್ನು ಅನುಭವಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆಯೇ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_7', 'ta', $$பொழுதுபோக்கில் ஈடுபடும்போது எப்படி உணர்கிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_7', 'en', $$How do you feel when engaging in your favorite hobby?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_7', 'hi', $$जब आप अपने पसंदीदा शौक में समय बिताते हैं, तो आपको कैसा लगता है?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_7', 'kn', $$ನಿಮ್ಮ ನೆಚ್ಚಿನ ಹವ್ಯಾಸವು ನಿಮಗೆ ಸಂತೋಷ, ನಿರಾಳತೆ ಅಥವಾ ಹೆಚ್ಚಿನ ಆತ್ಮವಿಶ್ವಾಸವನ್ನು ನೀಡುತ್ತದೆಯೇ ಎಂದು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_7', 'ta', $$அது உங்களுக்கு ஓய்வு அல்லது தன்னம்பிக்கையைத் தருகிறதா என எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_7', 'en', $$Write whether your favorite hobby makes you feel happy, relaxed, or more confident.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_7', 'hi', $$लिखें कि क्या आपका शौक आपको खुशी, शांति या आत्मविश्वास देता है।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Section: Talents & Practice
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_8', 'kn', $$ನಿಮ್ಮಲ್ಲಿರುವ ಪ್ರತಿಭೆಗಳನ್ನು (Talents) ಪಟ್ಟಿ ಮಾಡಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_8', 'ta', $$உங்களிடம் உள்ள திறமைகளை (Talents) பட்டியலிடுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_8', 'en', $$List the talents you have.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_8', 'hi', $$अपनी प्रतिभाओं (Talents) की सूची बनाएं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_8', 'kn', $$ಯಾವ್ಯಾವ ಪ್ರತಿಭೆ ನಿಮ್ಮಲ್ಲಿದೆ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_8', 'ta', $$நீங்கள் இயற்கையாகவே சிறந்து விளங்கும் திறன்களை எழுதுங்கள் (உதாரணம்: கணிதம்).$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_8', 'en', $$List skills you are naturally good at (e.g., Math, Singing).$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_8', 'hi', $$आपमें कौन-कौन सी खूबियां या हुनर हैं, उनके बारे में लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_9', 'kn', $$ನಿಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ಇನ್ನಷ್ಟು ಉತ್ತಮಗೊಳಿಸಲು ನೀವು ಪ್ರಯತ್ನ ಮಾಡುತ್ತಿದ್ದೀರಾ? ಮಾಡುತ್ತಿದ್ದರೆ ಹೇಗೆ ಎಂಬುದನ್ನು ತಿಳಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_9', 'ta', $$உங்கள் திறமையை மேலும் மேம்படுத்த நீங்கள் முயற்சி செய்து கொண்டிருக்கிறீர்களா? செய்தால், எவ்வாறு என்பதை விளக்குங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_9', 'en', $$Are you trying to improve your talent further? If yes, explain how.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_9', 'hi', $$क्या आप अपनी प्रतिभा को और बेहतर बनाने की कोशिश कर रहे हैं? यदि हाँ, तो कैसे?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_9', 'kn', $$ನಿಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ಸುಧಾರಿಸಲು ನೀವು ಏನು ಮಾಡುತ್ತಿದ್ದೀರಿ ಎಂದು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_9', 'ta', $$உங்கள் பயிற்சி அல்லது கூடுதல் கற்றல் முறைகளைப் பற்றி எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_9', 'en', $$Mention how you practice or learn to get better.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_9', 'hi', $$अपनी प्रतिभा या हुनर को निखारने के लिए आप क्या कर रहे हैं, लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Section: Support & Career Connection
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_10', 'kn', $$ನಿಮ್ಮ ಹವ್ಯಾಸ ಮತ್ತು ಪ್ರತಿಭೆಗಳನ್ನು ಮುಂದುವರೆಸಲು ಮತ್ತು ಪ್ರದರ್ಶಿಸಲು ಶಾಲೆ ಮತ್ತು ಮನೆಯಲ್ಲಿ ಪ್ರೋತ್ಸಾಹ ಹಾಗೂ ಅವಕಾಶ ಸಿಗುತ್ತಿದೆಯೇ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_10', 'ta', $$உங்கள் திறமைகளை தொடர்ந்து வெளிப்படுத்த பள்ளியிலும் வீட்டிலும் ஊக்கம் மற்றும் வாய்ப்பு கிடைக்கிறதா?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_10', 'en', $$Do you get encouragement and opportunities at school or at home to continue and showcase your talents?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_10', 'hi', $$क्या आपको स्कूल या घर पर अपने शौक और प्रतिभा को दिखाने का मौका और प्रोत्साहन मिलता है?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_10', 'kn', $$ಶಾಲೆಯಲ್ಲಿ ಅಥವಾ ಮನೆಯಲ್ಲಿ ನಿಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ವ್ಯಕ್ತಪಡಿಸಲು/ತೋರಿಸಲು ನಿಮಗೆ ಪ್ರೋತ್ಸಾಹ ಮತ್ತು ಅವಕಾಶಗಳು ಸಿಗುತ್ತವೆಯೇ ಎಂದು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_10', 'ta', $$உங்கள் திறமையை வெளிப்படுத்த உங்களுக்குக் கிடைக்கும் வாய்ப்புகளை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_10', 'en', $$Mention if you get chances to show what you are good at.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_10', 'hi', $$लिखें कि क्या आपको अपनी प्रतिभा दिखाने के लिए स्कूल या घर से मदद और अवसर मिलते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_11', 'kn', $$ನಿಮ್ಮ ಹವ್ಯಾಸ ಮತ್ತು ಪ್ರತಿಭೆಯನ್ನು ಇನ್ನಷ್ಟು ಉತ್ತಮಗೊಳಿಸುವ ನಿಮ್ಮ ಪ್ರಯತ್ನಕ್ಕೆ ಪಾಲಕರು ಬೆಂಬಲ ನೀಡುತ್ತಾರೆಯೇ? ಯಾವ ರೀತಿ ತಿಳಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_11', 'ta', $$உங்கள் திறமையை மேலும் மேம்படுத்த நீங்கள் செய்யும் முயற்சிகளுக்கு உங்கள் பெற்றோர் ஆதரவு அளிக்கிறார்களா? எவ்வாறு என்பதை விளக்குங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_11', 'en', $$Do your parents support your efforts to further improve your talent? If yes, in what way?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_11', 'hi', $$क्या आपकी प्रतिभा को बेहतर बनाने में आपके माता-पिता आपकी मदद करते हैं? कैसे?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_11', 'kn', $$ನಿಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ಬೆಳೆಸಿಕೊಳ್ಳಲು ನಿಮ್ಮ ಪೋಷಕರು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ನೀಡುತ್ತಾರೆ ಎಂದು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_11', 'ta', $$அவர்கள் உங்களுக்கு எப்படி உதவுகிறார்கள் என்பதை விளக்குங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_11', 'en', $$Write how your parents support you in developing your talent.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_11', 'hi', $$लिखें कि आपके माता-पिता आपकी प्रतिभा को निखारने में किस तरह सहायता करते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_12', 'kn', $$ನಿಮ್ಮ ಯಾವುದಾದರೂ ಹವ್ಯಾಸಗಳು ನಿಮ್ಮ ಸ್ವಾಭಾವಿಕ ಪ್ರತಿಭೆ ಮತ್ತು ಸಾಮರ್ಥ್ಯಗಳೊಂದಿಗೆ ಹೊಂದಿಕೆಯಾಗುತ್ತವೆಯೇ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_12', 'ta', $$உங்கள் பொழுதுபோக்கு, உங்கள் இயற்கை திறமையோடு பொருந்துகிறதா?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_12', 'en', $$Does any of your hobby match with your natural talents?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_12', 'hi', $$क्या आपका कोई शौक आपकी स्वाभाविक प्रतिभा या काबिलियत से मेल खाता है?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_12', 'kn', $$ಹವ್ಯಾಸಕ್ಕೆ ಹೊಂದುವ ಪ್ರತಿಭೆ ನಿಮ್ಮಲ್ಲಿದೆಯೇ ಎಂಬುದನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_12', 'ta', $$உதாரணம்: நீங்கள் கிரிக்கெட் விரும்பி விளையாடலாம் (ஆர்வம்) மற்றும் வேகமாக ஓடலாம் (திறமை).$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_12', 'en', $$e.g., You love cricket (Hobby) and are a fast runner (Talent).$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_12', 'hi', $$लिखें कि क्या आपके पास ऐसा कोई हुनर है जो आपके शौक से जुड़ा हो।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_13', 'kn', $$ನಿಮ್ಮ ಯಾವುದಾದರೂ ಹವ್ಯಾಸವನ್ನು ಭವಿಷ್ಯದಲ್ಲಿ ನಿಮ್ಮ ವೃತ್ತಿಯಾಗಿ ಮುಂದುವರೆಸಲು ಸಾಧ್ಯವೇ? ಸಾಧ್ಯವೆಂದಾದರೆ, ಅದಕ್ಕಾಗಿ ನೀವು ಅನುಸರಿಸುವ ಕ್ರಮ/ಸಿದ್ಧತೆಗಳೇನು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_13', 'ta', $$உங்கள் பொழுதுபோக்கை எதிர்காலத் தொழிலாக மாற்ற முடியுமா?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_13', 'en', $$Can any of your hobbies be pursued as a career? If yes, how?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_13', 'hi', $$क्या आप भविष्य में अपने किसी शौक को अपना पेशा (नौकरी/काम) बना सकते हैं? इसके लिए आपकी क्या तैयारी है?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_13', 'kn', $$ನಿಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ಭವಿಷ್ಯದ ವೃತ್ತಿಯನ್ನಾಗಿ ಮಾಡಲು ನಿಮ್ಮ ಯೋಜನೆ ಏನು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_13', 'ta', $$இதைத் தொழிலாக மாற்ற உங்களுக்கு என்ன திட்டம் உள்ளது என எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_13', 'en', $$If yes, what steps or plans do you have to achieve this?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_13', 'hi', $$अपनी प्रतिभा को भविष्य के करियर में बदलने के लिए आपकी क्या योजना है?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_14', 'kn', $$ತಮ್ಮ ಹವ್ಯಾಸವನ್ನೇ ವೃತ್ತಿಯಾಗಿ ಮಾಡಿಕೊಂಡಿರುವ ನಿಮ್ಮ ಪರಿಚಯದ ಯಾರಾದರೂ ಇದ್ದಾರಾ? ಅವರು ಯಾರು ಮತ್ತು ಹೇಗೆ ಅವರು ತಮ್ಮ ಹವ್ಯಾಸವನ್ನೇ ವೃತ್ತಿಯಾಗಿ ಮಾಡಿಕೊಂಡರು ಎಂಬುದನ್ನು ತಿಳಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_14', 'ta', $$பொழுதுபோக்கைத் தொழிலாக மாற்றியவர் யாராவது உண்டா?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_14', 'en', $$Do you know anyone who turned a hobby into a career?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_question', 'question_14', 'hi', $$क्या आप किसी ऐसे व्यक्ति को जानते हैं जिसने अपने शौक को ही अपना पेशा बनाया हो? उनके बारे में बताएं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_14', 'kn', $$ತಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ವೃತ್ತಿಯನ್ನಾಗಿ ಪರಿವರ್ತಿಸಿಕೊಂಡ ವ್ಯಕ್ತಿಯ ಬಗ್ಗೆ ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_14', 'ta', $$தெரிந்த நபர் மற்றும் அவர்களின் தொழிலைப் பற்றிச் சுருக்கமாக எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_14', 'en', $$Briefly mention someone who turned their passion into a profession.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_help', 'question_14', 'hi', $$उस व्यक्ति के बारे में संक्षेप में लिखें जिसने अपने हुनर को ही अपनी आजीविका (कमाई का साधन) बना लिया।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Summary questions (8 total)
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_1', 'kn', $$ಹವ್ಯಾಸಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_1', 'ta', $$பொழுதுபோக்குகள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_1', 'en', $$Hobbies$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_1', 'hi', $$शौक$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_2', 'kn', $$ನನ್ನ ಈ ಹವ್ಯಾಸವನ್ನು ವೃತ್ತಿಯಾಗಿ ರೂಪಿಸಿಕೊಳ್ಳಲು ನಾನು ಬಯಸುತ್ತೇನೆ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_2', 'ta', $$இந்தப் பொழுதுபோக்கை ஒரு தொழிலாக மாற்ற நான் விரும்புகிறேன்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_2', 'en', $$I would like to turn this hobby into a career$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_2', 'hi', $$मैं इस शौक को करियर में बदलना चाहता हूँ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_3', 'kn', $$ಈ ಹವ್ಯಾಸಗಳೊಂದಿಗೆ ಹೊಂದಾಣಿಕೆಯಾಗಬಲ್ಲ ವೃತ್ತಿಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_3', 'ta', $$இந்தப் பொழுதுபோக்குகளுக்கு ஏற்ற தொழில்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_3', 'en', $$Careers that match with these hobbies$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_3', 'hi', $$इन शौकों के साथ मेल खाने वाले करियर$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_4', 'kn', $$ತಮ್ಮ ಹವ್ಯಾಸಗಳನ್ನು ವೃತ್ತಿಗಳನ್ನಾಗಿ ಮಾಡಿಕೊಂಡಿರುವ ನಿಮಗೆ ಪರಿಚಿತವಿರುವ ವ್ಯಕ್ತಿಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_4', 'ta', $$தங்களது பொழுதுபோக்கை தொழிலாக மாற்றிக்கொண்ட எனக்குத் தெரிந்த நபர்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_4', 'en', $$People known to me who have turned their hobbies into careers$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_4', 'hi', $$ऐसे लोग जिन्हें मैं जानता हूँ जिन्होंने अपने शौक को करियर बनाया है$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_5', 'kn', $$ಪ್ರತಿಭೆಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_5', 'ta', $$திறமைகள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_5', 'en', $$Talents$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_5', 'hi', $$प्रतिभा$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_6', 'kn', $$ನಾನು ಈ ಪ್ರತಿಭೆಯನ್ನು ವೃತ್ತಿಯಾಗಿ ರೂಪಿಸಿಕೊಳ್ಳಲು ಬಯಸುತ್ತೇನೆ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_6', 'ta', $$இந்தத் திறமையை ஒரு தொழிலாக மாற்ற நான் விரும்புகிறேன்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_6', 'en', $$I would like to turn this talent into a career.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_6', 'hi', $$मैं इस प्रतिभा को करियर में बदलना चाहता हूँ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_7', 'kn', $$ಪ್ರತಿಭೆಗಳೊಂದಿಗೆ ಹೊಂದಾಣಿಕೆಯಾಗಬಲ್ಲ ವೃತ್ತಿಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_7', 'ta', $$இந்தத் திறமைகளுக்கு ஏற்ற தொழில்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_7', 'en', $$Careers that match your talents$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_7', 'hi', $$मैं अपनी प्रतिभा को करियर में बदलना चाहता हूँ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_8', 'kn', $$ತಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ವೃತ್ತಿಗಳನ್ನಾಗಿ ಮಾಡಿಕೊಂಡಿರುವ ನನಗೆ ಪರಿಚಿತವಿರುವ ವ್ಯಕ್ತಿಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_8', 'ta', $$தங்களது திறமையை தொழிலாக மாற்றிக்கொண்ட எனக்குத் தெரிந்த நபர்கள்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_8', 'en', $$People known to me who have turned their talents into careers.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('hobbies_summary_question', 'summary_question_8', 'hi', $$ऐसे लोग जिन्हें मैं जानता हूँ जिन्होंने अपनी प्रतिभा को करियर बनाया है$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;


-- ------------------------------------------------------------
-- 9.6_My Role Models (role_models)
-- ------------------------------------------------------------

-- Module title
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_module', 'title', 'kn', $$ನನ್ನ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_module', 'title', 'ta', $$என் முன்மாதிரி நபர்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_module', 'title', 'en', $$My Role Model$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_module', 'title', 'hi', $$मेरे आदर्श$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Title text (intro)
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_module', 'intro', 'kn', $$ನಾವೆಲ್ಲರೂ ವಿಶಿಷ್ಟ ಗುಣವುಳ್ಳ ವ್ಯಕ್ತಿಗಳಿಂದ ಪ್ರೇರಿತರಾಗಿರುತ್ತೇವೆ. ಅಂತಹ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳ ಬಗ್ಗೆ ತಿಳಿಯುವುದು ನಮ್ಮ ವ್ಯಕ್ತಿತ್ವ ರೂಪಿಸಿಕೊಳ್ಳಲು ಸ್ಪೂರ್ತಿ ನೀಡುತ್ತದೆ. ಈ ಚಟುವಟಿಕೆಯ ಮೂಲಕ ಅಂತಹವರನ್ನು ಗುರುತಿಸಿ, ಅವರ ಬಗ್ಗೆ ಇನ್ನಷ್ಟು ತಿಳಿದುಕೊಳ್ಳೋಣ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_module', 'intro', 'ta', $$நாம் அனைவரும் தனித்துவமான பண்புகளைக் கொண்ட மனிதர்களால் ஈர்க்கப்படுகிறோம். அத்தகைய முன்மாதிரிகளைப் பற்றித் தெரிந்துகொள்வது நமது ஆளுமையை வடிவமைக்க உதவும். இந்தச் செயல்பாட்டின் மூலம் உங்களின் முன்மாதிரிகளைக் கண்டறிந்து அவர்களைப் பற்றி மேலும் தெரிந்துகொள்வோம்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_module', 'intro', 'en', $$We are all inspired by people with unique qualities. Learning about these role models helps shape our own personalities. Use this activity to identify your role models and discover what makes them inspiring.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_module', 'intro', 'hi', $$हम सभी विशिष्ट गुणों वाले व्यक्तियों से प्रेरित होते हैं। ऐसे आदर्श व्यक्तियों के बारे में जानना हमारे व्यक्तित्व को संवारने में मदद करता है। आइए, इस गतिविधि के माध्यम से अपने प्रेरणास्रोतों को पहचानें और उनके बारे में और जानें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Subtitle text
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_module', 'subtitle', 'kn', $$ನಿಮ್ಮ ಆಯ್ಕೆಯ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳ ಕುರಿತು ಈ ಕೆಳಗಿನ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ:$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_module', 'subtitle', 'ta', $$நீங்கள் தேர்ந்தெடுத்த முன்மாதிரிகளைப் பற்றி பின்வரும் கேள்விகளுக்குப் பதிலளிக்கவும்:$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_module', 'subtitle', 'en', $$Answer the following questions about your chosen role models:$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_module', 'subtitle', 'hi', $$अपने चुने हुए प्रेरणास्रोतों के बारे में निम्नलिखित प्रश्नों के उत्तर दें:$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Summary title
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_module', 'summary_title', 'kn', $$ಸಾರಾಂಶ: ನನ್ನ ಮುಂದಿನ ಯೋಜನೆ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_module', 'summary_title', 'ta', $$சுருக்கம்: என் எதிர்கால திட்டம்$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_module', 'summary_title', 'en', $$Summary: My future plan$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Section titles
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_section', 'section_1_title', 'kn', $$ಮಾದರಿ ವ್ಯಕ್ತಿ - 1 (ನಿಮಗೆ ಹತ್ತಿರದಿಂದ ಪರಿಚಯವಿರುವ ವ್ಯಕ್ತಿ)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_section', 'section_1_title', 'ta', $$முன்மாதிரி - 1 (உங்களுக்கு நெருக்கமாகத் தெரிந்தவர்)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_section', 'section_1_title', 'en', $$Role Model - 1 (Preferably Closely Known Person)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_section', 'section_1_title', 'hi', $$प्रेरणास्रोत - 1 (कोई ऐसा व्यक्ति जिसे आप करीब से जानते हों)$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_section', 'section_2_title', 'kn', $$ಅವಲೋಕನ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_section', 'section_2_title', 'ta', $$பிரதிபலிப்பு$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_section', 'section_2_title', 'en', $$Reflection$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_section', 'section_2_title', 'hi', $$आत्म-चिंतन$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Questions (13 total)
-- Section: Role Model - 1 (Preferably Closely Known Person)
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_1', 'kn', $$ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳ ಹೆಸರು$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_1', 'ta', $$உங்கள் முன்மாதிரி நபரின் பெயர் என்ன?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_1', 'en', $$What is the name of your role model?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_1', 'hi', $$अपने आदर्श व्यक्ति का नाम।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_1', 'kn', $$ನಿಮ್ಮ ಮಾದರಿ ವ್ಯಕ್ತಿಯ ಪೂರ್ಣ ಹೆಸರನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_1', 'ta', $$முன்மாதிரி நபரின் முழுப் பெயரை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_1', 'en', $$Write the full name of your role model.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_1', 'hi', $$अपने आदर्श व्यक्ति का पूरा नाम लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_2', 'kn', $$ಇವರು ನಿಮ್ಮ ಕುಟುಂಬದವರೇ? ಸಂಬಂಧಿಕರೆ? ಪರಿಚಯದವರೇ? ತಿಳಿಸಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_2', 'ta', $$அவர் உங்கள் குடும்ப உறுப்பினரா, உறவினரா அல்லது அறிமுகமானவரா?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_2', 'en', $$Is the person a family member, relative, or someone you know?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_2', 'hi', $$क्या वे आपके परिवार, रिश्तेदार या परिचित व्यक्ति हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_2', 'kn', $$ಆ ವ್ಯಕ್ತಿಯು ನಿಮಗೆ ಹೇಗೆ ಸಂಬಂಧಪಟ್ಟವರು ಎಂದು ತಿಳಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_2', 'ta', $$அவர் உங்களுடன் எந்த வகை தொடர்பில் உள்ளார் என்பதை குறிப்பிடுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_2', 'en', $$Mention how the person is related to you.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_2', 'hi', $$बताएं कि वह व्यक्ति आपसे कैसे संबंधित है।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_3', 'kn', $$ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳಲ್ಲಿ ನೀವು ಮೆಚ್ಚುವ ಗುಣಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ ಹಾಗೂ ಅವರು ನಿಮಗೆ ವಿಶೇಷವಾಗಿ ಕಾಣುವ ಕಾರಣ ಹಂಚಿಕೊಳ್ಳಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_3', 'ta', $$அவர்களிடம் நீங்கள் வியக்கும் பண்புகள் யாவை? அவர்கள் ஏன் உங்களுக்குச் சிறப்பானவர்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_3', 'en', $$What qualities do you admire in your role model? Why are they special to you?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_3', 'hi', $$अपने आदर्श व्यक्ति के उन गुणों की सूची बनाएं जिन्हें आप पसंद करते हैं और बताएं कि वे आपके लिए विशेष क्यों हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_3', 'kn', $$ಕಠಿಣ ಪರಿಶ್ರಮ, ಪ್ರಾಮಾಣಿಕತೆ ಮತ್ತು ಧೈರ್ಯದಂತಹ ಗುಣಗಳ ಬಗ್ಗೆ ಯೋಚಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_3', 'ta', $$உழைப்பு, நேர்மை, தைரியம் போன்ற பண்புகளை நினைத்து எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_3', 'en', $$Think about qualities like hard work, honesty, and courage.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_3', 'hi', $$कड़ी मेहनत, ईमानदारी और साहस जैसे गुणों के बारे में सोचें और उन्हें लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_4', 'kn', $$ಇವರು ಯಾವ ಕೆಲಸ/ ಉದ್ಯೋಗ ಮಾಡುತ್ತಿದ್ದಾರೆ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_4', 'ta', $$அவர் எந்த வேலை அல்லது தொழில் செய்கிறார்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_4', 'en', $$What work or profession does the person do?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_4', 'hi', $$वे क्या काम या व्यवसाय करते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_4', 'kn', $$ಅವರ ಉದ್ಯೋಗ ಅಥವಾ ವೃತ್ತಿಯ ಬಗ್ಗೆ ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_4', 'ta', $$அவரின் வேலை அல்லது தொழிலை எளிமையாக எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_4', 'en', $$Briefly describe the work they do.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_4', 'hi', $$उनके काम या करियर के बारे में जानकारी लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_5', 'kn', $$ಇವರ ಪ್ರೇರಣೆಯಿಂದ ನಿಮ್ಮಲ್ಲಿರುವ ಯಾವ ಕೌಶಲ್ಯ ಅಥವಾ ಪ್ರತಿಭೆಯನ್ನು ಉತ್ತಮ ಪಡಿಸಿಕೊಳ್ಳಲು ಬಯಸುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_5', 'ta', $$அவரின் ஊக்கத்தால் உங்கள் எந்த திறன் அல்லது திறமையை வளர்க்க விரும்புகிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_5', 'en', $$Which skill or talent of yours do you want to develop inspired by them?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_5', 'hi', $$उनकी प्रेरणा से आप अपने किस कौशल या प्रतिभा में सुधार करना चाहते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_5', 'kn', $$ಅವರಲ್ಲಿರುವ - ಅಧ್ಯಯನ, ನಾಯಕತ್ವ ಅಥವಾ ಸಂವಹನದಂತಹ ಕೌಶಲಗಳ ಬಗ್ಗೆ ಯೋಚಿಸಿ, ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_5', 'ta', $$படிப்பு, தலைமைத் திறன், பேசும் திறன் போன்றவற்றை யோசிக்கவும்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_5', 'en', $$Think about skills like studies, leadership, or communication.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_5', 'hi', $$उनके अध्ययन, नेतृत्व या संचार (communication) जैसे कौशलों के बारे में सोचें और लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_6', 'kn', $$ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳೊಂದಿಗೆ ನಿಮ್ಮ ಆಯ್ಕೆಯ ವೃತ್ತಿ/ ಉದ್ಯೋಗದ ಬಗ್ಗೆ ಚರ್ಚಿಸಿದಿರಾ? ಏನನ್ನು ಚರ್ಚಿಸಿದಿರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_6', 'ta', $$உங்கள் முன்மாதிரி நபருடன் நீங்கள் தேர்ந்தெடுத்த தொழில் அல்லது வேலை பற்றி பேசினீர்களா? என்ன பேசினீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_6', 'en', $$Have you discussed your chosen career or job with your role model? What did you discuss?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_6', 'hi', $$क्या आपने अपने आदर्श व्यक्ति के साथ अपने पसंदीदा करियर के बारे में चर्चा की है? आपने क्या चर्चा की?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_6', 'kn', $$ನೀವು ಮಾಡಲು ಬಯಸುವ ಉದ್ಯೋಗ, ಶಿಕ್ಷಣ ಅಥವಾ ಭವಿಷ್ಯದ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಚರ್ಚಿಸಿದ್ದೀರಾ ಎಂದು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_6', 'ta', $$வேலை தேர்வு, படிப்பு வழி, எதிர்கால திட்டங்கள் பற்றி பேசினீர்களா என்று எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_6', 'en', $$Write if you discussed career choice, education path, or future plans.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_6', 'hi', $$बताएं कि क्या आपने अपनी शिक्षा, नौकरी या भविष्य की योजनाओं के बारे में उनसे बात की है।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_7', 'kn', $$ಇಲ್ಲ ಎಂದರೆ, ಅವರೊಂದಿಗೆ ನಿಮ್ಮ ಕನಸಿನ ಯೋಜನೆ ಬಗ್ಗೆ ಅವರ ಅಭಿಪ್ರಾಯ ಪಡೆಯುವ ಯೋಚನೆ ಮಾಡಿದ್ದೀರಾ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_7', 'ta', $$இல்லையென்றால், அவர்களிடம் ஆலோசனை பெறும் எண்ணம் உள்ளதா?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_7', 'en', $$If not, do you plan to seek their advice or opinion?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_7', 'hi', $$यदि नहीं, तो क्या आपने अपने सपनों की योजना के बारे में उनकी राय लेने के बारे में सोचा है?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_7', 'kn', $$ನಿಮ್ಮ ಕನಸು ಅಥವಾ ಭವಿಷ್ಯದ ಯೋಜನೆಯ ಬಗ್ಗೆ ಅವರು ಏನು ಹೇಳುತ್ತಾರೆ ಎಂದು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_7', 'ta', $$உங்கள் கனவுத் திட்டம் பற்றி அவரிடம் பேசத் திட்டமிட்டுள்ளீர்களா என எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_7', 'en', $$Write whether you plan to discuss your dream or future plan with them.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_7', 'hi', $$अपने सपनों या भविष्य की योजना के बारे में उनकी संभावित राय के बारे में लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_8', 'kn', $$ನಿಮ್ಮ ಕನಸಿನ ಉದ್ಯೋಗ/ವೃತ್ತಿಯ ಬಗ್ಗೆ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳು ಏನು ಹೇಳುತ್ತಾರೆ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_8', 'ta', $$உங்கள் கனவு வேலை அல்லது தொழில் பற்றி முன்மாதிரி நபர் என்ன கூறுகிறார்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_8', 'en', $$What does your role model say about your dream job or career?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_8', 'hi', $$आपके सपनों के करियर के बारे में आपके आदर्श व्यक्ति क्या कहते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_8', 'kn', $$ಅವರು ನಿಮ್ಮನ್ನು ಪ್ರೋತ್ಸಾಹಿಸಿದರೇ ಅಥವಾ ಸಲಹೆ ನೀಡಿದರೇ ಎಂದು ತಿಳಿಸಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_8', 'ta', $$அவர் ஊக்குவித்தாரா, அறிவுரை கொடுத்தாரா என்பதை குறிப்பிடுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_8', 'en', $$Mention if they encouraged you or gave you specific advice.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_8', 'hi', $$लिखें कि उन्होंने आपको प्रोत्साहित किया या कोई विशेष सलाह दी।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_9', 'kn', $$ಯಾವುದಾದರೂ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳು ನಿಮ್ಮ ಕನಸಿನ ವೃತ್ತಿಯ ಆಯ್ಕೆಯಲ್ಲಿ ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಹುದೆ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_9', 'ta', $$எந்த முன்மாதிரி நபர் உங்கள் கனவு தொழில் தேர்வில் உங்களுக்கு உதவி செய்தாரா?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_9', 'en', $$Has any role model helped you in choosing your dream career?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_9', 'hi', $$क्या कोई आदर्श व्यक्ति आपके सपनों के करियर के चुनाव में आपकी मदद कर सकता है?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_9', 'kn', $$ನಿಮಗೆ ಯಾರು ಸಹಾಯ ಮಾಡಬಹುದು ಮತ್ತು ಅವರು ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು ಎಂದು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_9', 'ta', $$யார் உதவி செய்தார், எவ்வாறு உதவி செய்தார் என்பதை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_9', 'en', $$Write who helped you and how they helped you.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_9', 'hi', $$लिखें कि कौन आपकी मदद कर सकता है और वे किस तरह से मददगार हो सकते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_10', 'kn', $$ಹೌದಾದಲ್ಲಿ, ನೀವು ಯಾವ ರೀತಿಯ ಸಹಾಯವನ್ನು ನಿರೀಕ್ಷಿಸುತ್ತೀರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_10', 'ta', $$ஆம் என்றால், நீங்கள் எந்த வகையான உதவியை எதிர்பார்க்கிறீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_10', 'en', $$If yes, what kind of help do you expect?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_10', 'hi', $$यदि हाँ, तो आप किस प्रकार की सहायता की अपेक्षा करते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_10', 'kn', $$ಶಿಕ್ಷಣ, ತರಬೇತಿ ಅಥವಾ ಮಾರ್ಗದರ್ಶನ etc. ಯಾವುದು ಎಂಬುದನ್ನು ಬರೆಯಿರಿ$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_10', 'ta', $$படிப்பு, பயிற்சி, வழிகாட்டுதல் போன்ற உதவிகளை நினைத்து எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_10', 'en', $$Think about help like education, training, or guidance.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_10', 'hi', $$शिक्षा, प्रशिक्षण या मार्गदर्शन आदि में से आपको किस तरह की मदद चाहिए, उसे लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_11', 'kn', $$ಮೇಲಿನ ಪ್ರಶ್ನೆಗಳ ಹೊರತಾಗಿ ಏನನ್ನಾದರೂ ತಿಳಿಸಲು ಬಯಸುವಿರಾ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_11', 'ta', $$மேலுள்ள கேள்விகளுக்கு கூடுதலாக நீங்கள் வேறு ஏதாவது சொல்ல விரும்புகிறீர்களா?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_11', 'en', $$Apart from the above questions, is there anything else you would like to say?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_11', 'hi', $$क्या आप उपरोक्त प्रश्नों के अलावा कुछ और बताना चाहते हैं?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_11', 'kn', $$ನೀವು ನಿಮ್ಮಇನ್ನಿತರ ಆಲೋಚನೆಗಳು ಅಥವಾ ಅಭಿಪ್ರಾಯಗಳನ್ನು ಬರೆಯಬಹುದು.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_11', 'ta', $$உங்கள் எண்ணங்கள் அல்லது கருத்துகளை சுதந்திரமாக எழுதலாம்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_11', 'en', $$You may write any additional thoughts or opinions.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_11', 'hi', $$आप अपने अन्य विचार या राय यहाँ लिख सकते हैं।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Section: Reflection
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_12', 'kn', $$ನಿಮ್ಮ ಹಾಗೂ ನೀವು ಆದರ್ಶವೆಂದು ಭಾವಿಸಿದ ಈ ಮೇಲಿನ ವ್ಯಕ್ತಿಗಳ ವ್ಯಕ್ತಿತ್ವದಲ್ಲಿರುವ ಹೋಲಿಕೆ ಅಥವಾ ಸಾಮ್ಯತೆಯನ್ನು ಗಮನಿಸಿದ್ದೀರಾ? ಏನದು?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_12', 'ta', $$உங்களுக்கும் அவருக்கும் உள்ள குண ஒற்றுமைகளைக் கவனித்துள்ளீர்களா?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_12', 'en', $$Have you noticed any similarity or comparison between your personality and that of the above role models?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_12', 'hi', $$क्या आपने अपने और अपने आदर्श व्यक्ति के व्यक्तित्व में कोई समानता देखी है? वह क्या है?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_12', 'kn', $$ನಿಮ್ಮ ಮತ್ತು ನಿಮ್ಮ ಮಾದರಿ ವ್ಯಕ್ತಿಯ ನಡುವಿನ ಸಮಾನ ಗುಣಗಳು, ಹವ್ಯಾಸಗಳು ಅಥವಾ ಆಲೋಚನೆಗಳ ಬಗ್ಗೆ ಯೋಚಿಸಿ ಮತ್ತು ಅವುಗಳನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_12', 'ta', $$உங்களுக்கும் உங்கள் முன்மாதிரி நபருக்கும் உள்ள ஒத்த குணங்கள், பழக்கங்கள் அல்லது எண்ணங்களை நினைத்து எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_12', 'en', $$Think about common qualities, habits, or thoughts between you and your role model and write them.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_12', 'hi', $$अपने और अपने आदर्श व्यक्ति के बीच समान गुणों, शौक या विचारों के बारे में सोचें और उन्हें लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_13', 'kn', $$ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳ ಗುಣಗಳನ್ನು ನಿಮ್ಮ ಜೀವನದಲ್ಲಿ ಅಳವಡಿಸಿಕೊಳ್ಳಲು ನೀವು ಹೇಗೆ ಪ್ರಯತ್ನ ಮಾಡುವಿರಿ?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_13', 'ta', $$அவர்களின் நல்ல பண்புகளை உங்கள் வாழ்க்கையில் எப்படிப் பின்பற்றுவீர்கள்?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_13', 'en', $$How do you try to adopt the qualities of your role model in your life?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_question', 'question_13', 'hi', $$आप अपने आदर्श व्यक्ति के गुणों को अपने जीवन में अपनाने का प्रयास कैसे करेंगे?$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_13', 'kn', $$ನಿಮ್ಮ ಮಾದರಿ ವ್ಯಕ್ತಿಯ ಒಳ್ಳೆಯ ಹವ್ಯಾಸಗಳು, ಶಿಸ್ತು ಮತ್ತು ಕಠಿಣ ಪರಿಶ್ರಮವನ್ನು ನಿಮ್ಮ ಜೀವನದಲ್ಲಿ ನೀವು ಹೇಗೆ ಅನುಸರಿಸುತ್ತೀರಿ ಎಂದು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_13', 'ta', $$உங்கள் முன்மாதிரி நபரின் நல்ல பழக்கங்கள், ஒழுக்கம், உழைப்பு போன்றவற்றை நீங்கள் எப்படி பின்பற்றுகிறீர்கள் என்பதை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_13', 'en', $$Write how you follow your role model’s good habits, discipline, and hard work in your life.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_help', 'question_13', 'hi', $$लिखें कि आप अपने आदर्श व्यक्ति की अच्छी आदतों, अनुशासन और कड़ी मेहनत का पालन अपने जीवन में कैसे करेंगे।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- Summary questions (1 total)
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_summary_question', 'summary_question_1', 'kn', $$ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳೊಂದಿಗೆ ನಿಮ್ಮ ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ನೀವು ಕೇಳಲು ಬಯಸುವ 5 ರಿಂದ 10 ಪ್ರಶ್ನೆಗಳನ್ನು ಬರೆಯಿರಿ.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_summary_question', 'summary_question_1', 'ta', $$உங்கள் முன்மாதிரி நபரிடம் உங்கள் தொழில் வழிகாட்டலுக்காக நீங்கள் கேட்க விரும்பும் 5 முதல் 10 கேள்விகளை எழுதுங்கள்.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_summary_question', 'summary_question_1', 'en', $$Write 5 to 10 questions you would like to ask your role model for career guidance.$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES ('role_models_summary_question', 'summary_question_1', 'hi', $$अपने आदर्श व्यक्तियों (Role Models) से अपने करियर मार्गदर्शन के लिए आप जो 5 से 10 प्रश्न पूछना चाहते हैं, उन्हें लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;


-- ============================================================
-- STEP 3: INSERT assessment_summary_templates
-- ============================================================

-- 9.1_My Inspiration summary template
INSERT INTO assessment_summary_templates (assessment_type, title, summary_questions)
VALUES ('inspiration', 'My Inspiration',
$${
  "en": {
    "question1": "After watching all these videos, list the points that inspired you from your experience",
    "question2": "After watching these videos, which behaviors do you feel you should not have?",
    "question3": "Discuss with your friend about the similarities between the characters in the video and the people who inspire you in real life."
  },
  "kn": {
    "question1": "ಈ ಎಲ್ಲಾ ವಿಡಿಯೋಗಳನ್ನು ನೋಡಿದಾಗ ಮತ್ತು ಸ್ವಂತ ಅನುಭವದಿಂದ ನೀವು ಸ್ಪೂರ್ತಿ ಪಡೆದ ಅಂಶಗಳನ್ನು ಪಟ್ಟಿಮಾಡಿ.",
    "question2": "ಈ ಎಲ್ಲಾ ವಿಡಿಯೋಗಳನ್ನು ನೋಡಿದಾಗ ಮತ್ತು ನಿಮಗೆ ಅನಿಸುತ್ತಿರುವ - ನಿಮ್ಮಲ್ಲಿ ಇರಬಾರದೆನಿಸಿದ ನಡವಳಿಕೆಗಳು ಯಾವವು? ಅದನ್ನು ಬರೆಯಿರಿ",
    "question3": "ನಿಮ್ಮ ಗೆಳೆಯೊರೊಂದಿಗೆ, ಈ ವಿಡಿಯೋಗಳಲ್ಲಿನ ನಿಮಗೆ ಪ್ರೇರಣೆ ನೀಡಿದ ಪಾತ್ರಗಳು ಮತ್ತು ನಿಮ್ಮ ನಿಜ ಜೀವನದಲ್ಲಿ ನಿಮಗೆ ಸ್ಪೂರ್ತಿ ನೀಡಿದ ವ್ಯಕ್ತಿಗಳಿಗೂ ಇರುವ ಹೋಲಿಕೆಗಳನ್ನು ಕುರಿತು ಚರ್ಚಿಸಿ. ಆ ಸಾರಾಂಶವನ್ನು ಬರೆಯಿರಿ"
  },
  "ta": {
    "question1": "இந்த அனைத்து வீடியோக்களையும் பார்த்த பிறகு, உங்கள் அனுபவத்தில் உங்களை ஊக்கமளித்த முக்கியமானவற்றை பட்டியலிடுங்கள்",
    "question2": "இந்த வீடியோக்களைப் பார்த்த பிறகு, உங்களிடம் இருக்கக்கூடாது என்று நீங்கள் நினைக்கும் பழக்கவழக்கங்கள்/நடத்தைகள் எவை?",
    "question3": "உங்கள் நண்பர்களுடன், இந்த வீடியோவில் உங்களுக்கு ஊக்கமளித்த பாத்திரம் யார், மேலும் அது உங்கள் நிஜ வாழ்க்கையில் உங்களுக்கு ஊக்கமளிக்கும் நபர்களுக்கும் இடையிலான ஒற்றுமைகளைப் பற்றி விவாதிக்கவும்"
  },
  "hi": {
    "question1": "इन सभी वीडियो को देखने के बाद और अपने स्वयं के अनुभवों से आपने जो प्रेरणा ली है, उसकी सूची बनाएं।",
    "question2": "इन सभी वीडियो को देखने के बाद, आपको अपने व्यवहार में कौन सी बातें पसंद नहीं आईं या आप उन्हें बदलना चाहते हैं?",
    "question3": "अपने दोस्तों के साथ चर्चा करें कि इन वीडियो के प्रेरणादायक पात्रों और आपके वास्तविक जीवन के प्रेरणादायक व्यक्तियों के बीच क्या समानताएं हैं। उस चर्चा का सारांश लिखें।"
  }
}$$::jsonb
)
ON CONFLICT (assessment_type) DO UPDATE SET title = EXCLUDED.title, summary_questions = EXCLUDED.summary_questions;

-- 9.2_About Me summary template
INSERT INTO assessment_summary_templates (assessment_type, title, summary_questions)
VALUES ('about_me', 'About Me',
$${
  "en": {
    "question1": "The friend in my family",
    "question2": "My family outside of my family",
    "question3": "Activities I am doing at home",
    "question4": "Activities I enjoy during the school hours",
    "question5": "Activities I enjoy outside the school",
    "question6": "Work/activities I enjoy personally",
    "question7": "Work/activities I enjoy as a team",
    "question8": "Activity that needs to be done in the school but I find difficult",
    "question9": "Activity that I find difficult to do after school hours",
    "question10": "Activities I must do",
    "question11": "Activities that come naturally to me",
    "question12": "Activities that don't come naturally to me",
    "question13": "Qualities I like in myself",
    "question14": "Qualities that others like in me",
    "question15": "Qualities that I need to improve on",
    "question16": "Write a brief description of yourself based on the summary."
  },
  "kn": {
    "question1": "ನನ್ನ ಕುಟುಂಬದಲ್ಲಿ ನನ್ನ ಸ್ನೇಹಿತ",
    "question2": "ಕುಟುಂಬ ಬಿಟ್ಟು ಹೊರಗಿನ ನನ್ನ ಸ್ನೇಹಿತ",
    "question3": "ನಾನು ಮನೆಯಲ್ಲಿ ಯಾವ ಕೆಲಸಗಳನ್ನು ಮಾಡುತ್ತಿದ್ದೇನೆ?",
    "question4": "ಶಾಲೆಯ ಸಮಯದಲ್ಲಿ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆ/ಅಂಶಗಳು",
    "question5": "ಶಾಲೆಯ ಹೊರಗೆ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆ/ಅಂಶಗಳು",
    "question6": "ವೈಯಕ್ತಿಕವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸ / ಚಟುವಟಿಕೆಗಳು",
    "question7": "ತಂಡವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸ / ಚಟುವಟಿಕೆಗಳು",
    "question8": "ಶಾಲಾವಧಿಯಲ್ಲಿ ಮಾಡಬೇಕಾದ, ಆದರೆ ನನಗೆ ಕಷ್ಟವೆನಿಸುವ ಚಟುವಟಿಕೆ",
    "question9": "ಶಾಲಾವಧಿಯ ನಂತರ, ಶಾಲೆಯ ಆಚೆ ನನಗೆ ನಿರ್ವಹಿಸಲು ಕಷ್ಟವೆನಿಸುವ ಚಟುವಟಿಕೆ",
    "question10": "ನಾನು ಮಾಡಲೇಬೇಕಾದ ಚಟುವಟಿಕೆಗಳು",
    "question11": "ನಾನು ಸಹಜವಾಗಿ ಮಾಡಬಹುದಾದ ಚಟುವಟಿಕೆಗಳು",
    "question12": "ನನಗೆ ಸಹಜವಾಗಿ ಮಾಡಲು ಬಾರದಿರುವ ಚಟುವಟಿಕೆಗಳು",
    "question13": "ನನ್ನಲ್ಲಿರುವ, ನಾನು ಇಷ್ಟಪಡುವ ಗುಣಗಳು",
    "question14": "ಇತರರು ನನ್ನಲ್ಲಿ ಇಷ್ಟಪಡುವ ಗುಣಗಳು",
    "question15": "ನಾನು ಸುಧಾರಿಸಿಕೊಳ್ಳಬೇಕಾದ ಗುಣ/ ಅಂಶಗಳು",
    "question16": "ಸಾರಾಂಶದ ಆಧಾರದ ಮೇಲೆ ನಿಮ್ಮ ಬಗ್ಗೆ ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಬರೆಯಿರಿ."
  },
  "ta": {
    "question1": "என் குடும்பத்தில் உள்ள எனது நண்பர்",
    "question2": "குடும்பத்திற்கு வெளியே உள்ள நண்பர்",
    "question3": "நான் வீட்டில் செய்யும் வேலைகள்",
    "question4": "பள்ளி நேரத்தில் நான் ரசிக்கும் விஷயங்கள்",
    "question5": "பள்ளிக்கு வெளியே நான் ரசிக்கும் விஷயங்கள்",
    "question6": "நான் தனியாக ரசித்துச் செய்யும் செயல்கள்",
    "question7": "நான் குழுவாக ரசித்துச் செய்யும் செயல்கள்",
    "question8": "பள்ளியில் எனக்குக் கடினமாகத் தோன்றும் செயல்கள்",
    "question9": "பள்ளிக்கு வெளியே எனக்குக் கடினமாகத் தோன்றும் வேலைகள்",
    "question10": "நான் கட்டாயம் செய்ய வேண்டிய வேலைகள்",
    "question11": "நான் இயல்பாகச் செய்யும் செயல்கள்",
    "question12": "எனக்கு எளிதாக வராத செயல்கள்",
    "question13": "என்னிடத்தில் எனக்குப் பிடித்த குணங்கள்",
    "question14": "மற்றவர்கள் என்னிடம் விரும்பும் குணங்கள்",
    "question15": "நான் மேம்படுத்த வேண்டிய விஷயங்கள்",
    "question16": "சுருக்கத்தின் அடிப்படையில் உங்களைப் பற்றிச் சுருக்கமாக எழுதுங்கள்."
  },
  "hi": {
    "question1": "मेरे परिवार में मेरा मित्र",
    "question2": "परिवार के बाहर मेरा मित्र",
    "question3": "मैं घर पर कौन से काम कर रहा/रही हूँ?",
    "question4": "स्कूल के समय के दौरान जिन गतिविधियों/पहलुओं का मैं आनंद लेता/लेती हूँ",
    "question5": "स्कूल के बाहर जिन गतिविधियों/पहलुओं का मैं आनंद लेता/लेती हूँ",
    "question6": "व्यक्तिगत रूप से वे काम/गतिविधियाँ जिनका मैं आनंद लेता/लेती हूँ",
    "question7": "एक टीम के रूप में वे काम/गतिविधियाँ जिनका मैं आनंद लेता/लेती हूँ",
    "question8": "स्कूल के घंटों के दौरान की जाने वाली गतिविधियाँ जो मुझे कठिन लगती हैं",
    "question9": "स्कूल के बाद या स्कूल के बाहर वे गतिविधियाँ जिन्हें करना मेरे लिए कठिन है",
    "question10": "वे गतिविधियाँ जो मुझे करनी ही चाहिए (अनिवार्य कार्य)",
    "question11": "वे गतिविधियाँ जो मैं स्वाभाविक रूप से कर सकता/सकती हूँ",
    "question12": "वे गतिविधियाँ जो मैं स्वाभाविक रूप से नहीं कर पाता/पाती",
    "question13": "मेरे अपने वे गुण जिन्हें मैं पसंद करता/करती हूँ",
    "question14": "मेरे वे गुण जिन्हें दूसरे पसंद करते हैं",
    "question15": "वे गुण/पहलू जिनमें मुझे सुधार करने की आवश्यकता है",
    "question16": "सारांश के आधार पर अपने बारे में संक्षेप में लिखें।"
  }
}$$::jsonb
)
ON CONFLICT (assessment_type) DO UPDATE SET title = EXCLUDED.title, summary_questions = EXCLUDED.summary_questions;

-- 9.3_My Dreams summary template
INSERT INTO assessment_summary_templates (assessment_type, title, summary_questions)
VALUES ('dreams', 'My Dreams',
$${
  "en": {
    "question1": "Dream",
    "question2": "Qualities/abilities I already have to achieve my dream",
    "question3": "What I need to do to ensure my dream does not fail",
    "question4": "What I need to study after Class 10 to achieve this dream (if applicable)"
  },
  "kn": {
    "question1": "ಕನಸು",
    "question2": "ನಿಮ್ಮಲ್ಲಿ ಈಗಾಗಲೇ ಕಂಡುಕೊಂಡಿರುವ ಯಾವ ಗುಣ/ ಮೌಲ್ಯ/ ಸಾಮರ್ಥ್ಯ ನಿಮ್ಮ ಕನಸನ್ನು ಸಾಧಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
    "question3": "ಕನಸು ವಿಫಲವಾಗುವುದಿಲ್ಲ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಲು ನೀವು ಏನು ಮಾಡಬೇಕಾಗುತ್ತದೆ",
    "question4": "ಈ ಕನಸನ್ನುಸಾಧಿಸಲು 10ನೇ ತರಗತಿಯ ನಂತರ ನೀವು ಏನು ಅಧ್ಯಯನ ಮಾಡಬೇಕು? (ಅನ್ವಯಿಸಿದರೆ)"
  },
  "ta": {
    "question1": "கனவு",
    "question2": "எனது கனவை அடைய என்னிடம் ஏற்கனவே உள்ள பண்புகள்/திறமைகள்",
    "question3": "என் கனவு தோற்காமல் இருக்க நான் செய்ய வேண்டியவை",
    "question4": "இந்தக் கனவை அடைய 10-ஆம் வகுப்பிற்குப் பிறகு நான் படிக்க வேண்டியவை"
  },
  "hi": {
    "question1": "सपना",
    "question2": "आपके भीतर पहले से मौजूद कौन से गुण/मूल्य/क्षमता आपके सपने को हासिल करने में मदद करेंगे?",
    "question3": "यह सुनिश्चित करने के लिए कि आपका सपना विफल न हो, आपको क्या करने की आवश्यकता है?",
    "question4": "इस सपने को पूरा करने के लिए आपको 10वीं कक्षा के बाद क्या अध्ययन करना चाहिए? (यदि लागू हो)"
  }
}$$::jsonb
)
ON CONFLICT (assessment_type) DO UPDATE SET title = EXCLUDED.title, summary_questions = EXCLUDED.summary_questions;

-- 9.4_My School, Learnings and I summary template
INSERT INTO assessment_summary_templates (assessment_type, title, summary_questions)
VALUES ('school_learning', 'My School, My Learning and I',
$${
  "en": {
    "question1": "Subjects I like",
    "question2": "Careers I can pursue based on the subjects I like",
    "question3": "Subjects I do not like",
    "question4": "Careers I can pursue if I make progress in the subjects I do not like",
    "question5": "Other activities I perform well in",
    "question6": "If I improve these skills, it will help me in choosing my job / career."
  },
  "kn": {
    "question1": "ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳು",
    "question2": "ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳಿಂದ ನಾನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು",
    "question3": "ನಾನು ಇಷ್ಟಪಡದ ವಿಷಯಗಳು",
    "question4": "ಇಷ್ಟಪಡದ ವಿಷಯಗಳಲ್ಲಿ ನಾನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು",
    "question5": "ಪಠ್ಯ ವಿಷಯಗಳ ಜೊತೆಗೆ, ನಾನು ಉತ್ತಮ ಸಾಧನೆ ಮಾಡುವ ಇತರ ಚಟುವಟಿಕೆಗಳು / ವಿಷಯಗಳು",
    "question6": "ನಾನು ಈ ಕೌಶಲ್ಯಗಳನ್ನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ನನ್ನ ಕೆಲಸ / ವೃತ್ತಿಯ ಆಯ್ಕೆಗೆ ಸಹಾಯವಾಗುತ್ತದೆ."
  },
  "ta": {
    "question1": "எனக்கு பிடித்த பாடங்கள்",
    "question2": "விருப்பமான பாடங்கள் மூலம் நான் அடையக்கூடிய தொழில்கள்",
    "question3": "எனக்கு பிடிக்காத பாடங்கள்",
    "question4": "விருப்பமில்லாத பாடங்களில் முன்னேறினால் நான் அடையக்கூடிய தொழில்கள்",
    "question5": "நான் சிறப்பாகச் செய்யும் பிற செயல்பாடுகள்",
    "question6": "நான் மேம்படுத்த வேண்டிய திறன்கள்"
  },
  "hi": {
    "question1": "वे विषय जो मुझे पसंद हैं",
    "question2": "मेरी पसंद के विषयों से मैं जो करियर/पेशे अपना सकता हूँ",
    "question3": "वे विषय जो मुझे पसंद नहीं हैं",
    "question4": "जिन विषयों को मैं पसंद नहीं करता, यदि उनमें सुधार करूँ तो मैं कौन से करियर अपना सकता हूँ",
    "question5": "शैक्षणिक विषयों के अलावा, अन्य गतिविधियाँ / विषय जिनमें मैं अच्छा प्रदर्शन करता हूँ",
    "question6": "यदि मैं इन कौशलों (skills) में सुधार करता हूँ, तो इससे मुझे अपने काम / करियर के चुनाव में मदद मिलेगी।"
  }
}$$::jsonb
)
ON CONFLICT (assessment_type) DO UPDATE SET title = EXCLUDED.title, summary_questions = EXCLUDED.summary_questions;

-- 9.5_My Talents and Hobbies summary template
INSERT INTO assessment_summary_templates (assessment_type, title, summary_questions)
VALUES ('hobbies', 'My Talents and Hobbies',
$${
  "en": {
    "question1": "Hobbies",
    "question2": "I would like to turn this hobby into a career",
    "question3": "Careers that match with these hobbies",
    "question4": "People known to me who have turned their hobbies into careers",
    "question5": "Talents",
    "question6": "I would like to turn this talent into a career.",
    "question7": "Careers that match your talents",
    "question8": "People known to me who have turned their talents into careers."
  },
  "kn": {
    "question1": "ಹವ್ಯಾಸಗಳು",
    "question2": "ನನ್ನ ಈ ಹವ್ಯಾಸವನ್ನು ವೃತ್ತಿಯಾಗಿ ರೂಪಿಸಿಕೊಳ್ಳಲು ನಾನು ಬಯಸುತ್ತೇನೆ.",
    "question3": "ಈ ಹವ್ಯಾಸಗಳೊಂದಿಗೆ ಹೊಂದಾಣಿಕೆಯಾಗಬಲ್ಲ ವೃತ್ತಿಗಳು",
    "question4": "ತಮ್ಮ ಹವ್ಯಾಸಗಳನ್ನು ವೃತ್ತಿಗಳನ್ನಾಗಿ ಮಾಡಿಕೊಂಡಿರುವ ನಿಮಗೆ ಪರಿಚಿತವಿರುವ ವ್ಯಕ್ತಿಗಳು",
    "question5": "ಪ್ರತಿಭೆಗಳು",
    "question6": "ನಾನು ಈ ಪ್ರತಿಭೆಯನ್ನು ವೃತ್ತಿಯಾಗಿ ರೂಪಿಸಿಕೊಳ್ಳಲು ಬಯಸುತ್ತೇನೆ.",
    "question7": "ಪ್ರತಿಭೆಗಳೊಂದಿಗೆ ಹೊಂದಾಣಿಕೆಯಾಗಬಲ್ಲ ವೃತ್ತಿಗಳು",
    "question8": "ತಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ವೃತ್ತಿಗಳನ್ನಾಗಿ ಮಾಡಿಕೊಂಡಿರುವ ನನಗೆ ಪರಿಚಿತವಿರುವ ವ್ಯಕ್ತಿಗಳು"
  },
  "ta": {
    "question1": "பொழுதுபோக்குகள்",
    "question2": "இந்தப் பொழுதுபோக்கை ஒரு தொழிலாக மாற்ற நான் விரும்புகிறேன்.",
    "question3": "இந்தப் பொழுதுபோக்குகளுக்கு ஏற்ற தொழில்கள்.",
    "question4": "தங்களது பொழுதுபோக்கை தொழிலாக மாற்றிக்கொண்ட எனக்குத் தெரிந்த நபர்கள்.",
    "question5": "திறமைகள்",
    "question6": "இந்தத் திறமையை ஒரு தொழிலாக மாற்ற நான் விரும்புகிறேன்.",
    "question7": "இந்தத் திறமைகளுக்கு ஏற்ற தொழில்கள்",
    "question8": "தங்களது திறமையை தொழிலாக மாற்றிக்கொண்ட எனக்குத் தெரிந்த நபர்கள்"
  },
  "hi": {
    "question1": "शौक",
    "question2": "मैं इस शौक को करियर में बदलना चाहता हूँ",
    "question3": "इन शौकों के साथ मेल खाने वाले करियर",
    "question4": "ऐसे लोग जिन्हें मैं जानता हूँ जिन्होंने अपने शौक को करियर बनाया है",
    "question5": "प्रतिभा",
    "question6": "मैं इस प्रतिभा को करियर में बदलना चाहता हूँ",
    "question7": "मैं अपनी प्रतिभा को करियर में बदलना चाहता हूँ",
    "question8": "ऐसे लोग जिन्हें मैं जानता हूँ जिन्होंने अपनी प्रतिभा को करियर बनाया है"
  }
}$$::jsonb
)
ON CONFLICT (assessment_type) DO UPDATE SET title = EXCLUDED.title, summary_questions = EXCLUDED.summary_questions;

-- 9.6_My Role Models summary template
INSERT INTO assessment_summary_templates (assessment_type, title, summary_questions)
VALUES ('role_models', 'My Role Models', 
$${
  "en": {
    "question1": "Write 5 to 10 questions you would like to ask your role model for career guidance."
  },
  "kn": {
    "question1": "ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳೊಂದಿಗೆ ನಿಮ್ಮ ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ನೀವು ಕೇಳಲು ಬಯಸುವ 5 ರಿಂದ 10 ಪ್ರಶ್ನೆಗಳನ್ನು ಬರೆಯಿರಿ."
  },
  "ta": {
    "question1": "உங்கள் முன்மாதிரி நபரிடம் உங்கள் தொழில் வழிகாட்டலுக்காக நீங்கள் கேட்க விரும்பும் 5 முதல் 10 கேள்விகளை எழுதுங்கள்."
  },
  "hi": {
    "question1": "अपने आदर्श व्यक्तियों (Role Models) से अपने करियर मार्गदर्शन के लिए आप जो 5 से 10 प्रश्न पूछना चाहते हैं, उन्हें लिखें।"
  }
}$$::jsonb
)
ON CONFLICT (assessment_type) DO UPDATE SET title = EXCLUDED.title, summary_questions = EXCLUDED.summary_questions;

COMMIT;
