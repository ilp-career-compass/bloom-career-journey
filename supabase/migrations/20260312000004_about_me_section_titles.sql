-- ============================================================
-- About Me Section Titles Migration (Phase 1D)
-- Inserts kn/ta section title rows for About Me assessment
-- English comes from DB section column fallback — never inserted
-- ============================================================

BEGIN;

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES
  ('about_me_module', 'section_a_title', 'kn', $$A. ನನ್ನ ವೈಯಕ್ತಿಕ ಸ್ಥಳ$$),
  ('about_me_module', 'section_a_title', 'ta', $$A. என் தனிப்பட்ட இடம்$$),

  ('about_me_module', 'section_b_title', 'kn', $$B. ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆಗಳು$$),
  ('about_me_module', 'section_b_title', 'ta', $$B. நான் விரும்பும் செயல்கள்$$),

  ('about_me_module', 'section_c_title', 'kn', $$C. ನನಗೆ ಸವಾಲಾಗಿರುವ ಕೆಲಸಗಳು$$),
  ('about_me_module', 'section_c_title', 'ta', $$C. எனக்கு சிரமமாக இருக்கும் வேலைகள்$$),

  ('about_me_module', 'section_d_title', 'kn', $$D. ನನ್ನ ಬಗ್ಗೆ ಇನ್ನಷ್ಟು ತಿಳಿದುಕೊಳ್ಳೋಣ$$),
  ('about_me_module', 'section_d_title', 'ta', $$D. என்னைப் பற்றி ஆழமாக அறிதல்$$)

ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text;

COMMIT;
