-- Fix About Me section C question 5 (question12) missing from content_translations.
--
-- Root cause (Phase 6A): translations were stored under key 'question11' but the
-- about_me_fields row uses field_key 'question12'.  about_me_fields has no row for
-- question11, and content_translations has no row for question12 in any language.
--
-- Fix: copy all four language rows from question11 to question12 so the
-- get_about_me_fields_i18n RPC returns translated text instead of the English
-- fallback from about_me_fields.question_text.

INSERT INTO content_translations (resource_type, resource_key, lang, text)
SELECT 'about_me_question', 'question12', lang, text
FROM content_translations
WHERE resource_type = 'about_me_question'
  AND resource_key = 'question11'
ON CONFLICT (resource_type, resource_key, lang) DO NOTHING;
