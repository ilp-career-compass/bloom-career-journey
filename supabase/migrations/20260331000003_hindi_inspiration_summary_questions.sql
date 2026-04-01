-- Migration: Add Hindi translations for inspiration summary questions,
-- re-key existing Tamil/Kannada from 'questionN' to 'summary_question_N'
-- (to match the RPC key fix in 20260326000002), and fix Tamil question3.

-- ============================================================
-- 1. Re-key existing Tamil/Kannada inspiration summary questions
--    from 'questionN' to 'summary_question_N' to match updated RPC
-- ============================================================

UPDATE content_translations
SET resource_key = 'summary_question_1'
WHERE resource_type = 'inspiration_summary_question'
  AND resource_key = 'question1'
  AND lang IN ('ta', 'kn');

UPDATE content_translations
SET resource_key = 'summary_question_2'
WHERE resource_type = 'inspiration_summary_question'
  AND resource_key = 'question2'
  AND lang IN ('ta', 'kn');

UPDATE content_translations
SET resource_key = 'summary_question_3'
WHERE resource_type = 'inspiration_summary_question'
  AND resource_key = 'question3'
  AND lang IN ('ta', 'kn');

-- ============================================================
-- 2. Insert Hindi summary question translations (new key format)
-- ============================================================

INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('inspiration_summary_question', 'header1', 'hi', $$सारांश: जिसने मुझे प्रेरित किया...$$),
('inspiration_summary_question', 'summary_question_1', 'hi', $$इन सभी वीडियो को देखने के बाद, अपने अनुभव से प्रेरित करने वाली बातों की सूची बनाएं$$),
('inspiration_summary_question', 'summary_question_2', 'hi', $$इन वीडियो को देखने के बाद, आपको लगता है कि कौन सा व्यवहार आपको नहीं करना चाहिए? लिखें।$$),
('inspiration_summary_question', 'summary_question_3', 'hi', $$इस वीडियो में जिस पात्र ने आपको प्रेरित किया और वास्तविक जीवन में जिस व्यक्ति ने आपको प्रेरित किया, उसके बारे में अपने मित्र से चर्चा करें। चर्चा का सारांश लिखें।$$)
ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- ============================================================
-- 3. Fix Tamil question3 (was empty string in original migration)
-- ============================================================

UPDATE content_translations
SET text = $$இந்த வீடியோவில் உங்களை ஊக்கமளித்த கதாபாத்திரம் மற்றும் உண்மையான வாழ்க்கையில் உங்களை ஊக்கமளித்த நபர் பற்றி உங்கள் நண்பருடன் விவாதிக்கவும். விவாதத்தின் சுருக்கத்தை எழுதுங்கள்.$$
WHERE resource_type = 'inspiration_summary_question'
  AND resource_key = 'summary_question_3'
  AND lang = 'ta'
  AND (text IS NULL OR text = '');
