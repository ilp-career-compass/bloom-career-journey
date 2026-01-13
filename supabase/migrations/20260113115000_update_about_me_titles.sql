-- Migration: Update About Me Module Titles (Kannada and Tamil)

INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('about_me_module', 'title', 'kn', 'ನನ್ನ ಬಗ್ಗೆ', NOW()),
('about_me_module', 'title', 'ta', 'என்னைப் பற்றி', NOW())

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
    SELECT text INTO kn_title FROM content_translations WHERE resource_type = 'about_me_module' AND resource_key = 'title' AND lang = 'kn';
    SELECT text INTO ta_title FROM content_translations WHERE resource_type = 'about_me_module' AND resource_key = 'title' AND lang = 'ta';
    
    RAISE NOTICE 'Kannada About Me Title: %', kn_title;
    RAISE NOTICE 'Tamil About Me Title: %', ta_title;
END $$;
