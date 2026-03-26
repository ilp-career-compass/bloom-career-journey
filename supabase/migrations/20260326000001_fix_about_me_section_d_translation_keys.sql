-- Fix About Me Section D translation key shift
-- The 20260318 migration renumbered Section D questions (question13-20)
-- but did not update content_translations, leaving them under question12-19.
-- This caused the i18n RPC to overlay stale translations, making Q7 and Q8
-- render the same text ("Recall a situation where others misunderstood you...").

BEGIN;

-- 1. Save existing stale translations to a temp table
CREATE TEMP TABLE _about_me_shift AS
SELECT * FROM content_translations
WHERE resource_type IN ('about_me_question', 'about_me_help')
  AND resource_key IN ('question12','question13','question14','question15',
                       'question16','question17','question18','question19');

-- 2. Delete stale translations (question12-19)
DELETE FROM content_translations
WHERE resource_type IN ('about_me_question', 'about_me_help')
  AND resource_key IN ('question12','question13','question14','question15',
                       'question16','question17','question18','question19');

-- 3. Re-insert with shifted keys (+1): question12→13, 13→14, ... 19→20
INSERT INTO content_translations (resource_type, resource_key, lang, text)
SELECT
  resource_type,
  'question' || (CAST(SUBSTRING(resource_key FROM 9) AS INTEGER) + 1),
  lang,
  text
FROM _about_me_shift
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();

DROP TABLE _about_me_shift;

COMMIT;
