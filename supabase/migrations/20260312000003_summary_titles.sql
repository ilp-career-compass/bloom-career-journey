-- ============================================================
-- Summary Titles Migration (Phase 1C)
-- Inserts kn/ta summary_title rows for 4 assessments
-- English comes from component fallback — never inserted
-- ============================================================

BEGIN;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES
  -- Inspiration
  ('inspiration_module', 'summary_title', 'kn', $$ಸಾರಾಂಶ: ನನು ಸ್ಫೂರ್ತಿ ಪಡೆದ ಅಂಶಗಳು$$),
  ('inspiration_module', 'summary_title', 'ta', $$சுருக்கம்: எனக்கு ஊக்கம் அளித்தது$$),

  -- About Me
  ('about_me_module', 'summary_title', 'kn', $$ಸಾರಾಂಶ: ನನ್ನ ಮುಂದಿನ ಯೋಜನೆ$$),
  ('about_me_module', 'summary_title', 'ta', $$சுருக்கம்: எனது எதிர்காலத் திட்டம்$$),

  -- Dreams
  ('dreams_module', 'summary_title', 'kn', $$ಕನಸು$$),
  ('dreams_module', 'summary_title', 'ta', $$கனவு$$),

  -- Role Models
  ('role_models_module', 'summary_title', 'kn', $$ಸಾರಾಂಶ: ನನ್ನ ಮುಂದಿನ ಯೋಜನೆ$$),
  ('role_models_module', 'summary_title', 'ta', $$சுருக்கம்: என் எதிர்கால திட்டம்$$)

ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text;

COMMIT;
