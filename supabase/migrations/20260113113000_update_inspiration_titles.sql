-- Migration: Update Inspiration Module Titles (Kannada and Tamil)

INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('inspiration_module', 'title', 'kn', 'ನನ್ನ ಪ್ರೇರಣೆ', NOW()),
('inspiration_module', 'title', 'ta', 'என் உத்வேகம்', NOW())

ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET 
    text = EXCLUDED.text,
    updated_at = NOW();

-- Verification
DO $$
DECLARE
    kn_title TEXT;
    ta_title TEXT;
BEGIN
    SELECT text INTO kn_title FROM content_translations WHERE resource_type = 'inspiration_module' AND resource_key = 'title' AND lang = 'kn';
    SELECT text INTO ta_title FROM content_translations WHERE resource_type = 'inspiration_module' AND resource_key = 'title' AND lang = 'ta';
    
    RAISE NOTICE 'Kannada Title: %', kn_title;
    RAISE NOTICE 'Tamil Title: %', ta_title;
END $$;
