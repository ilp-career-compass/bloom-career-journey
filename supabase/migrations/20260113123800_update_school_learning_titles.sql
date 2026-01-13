-- Update School Learning Module Titles for Kannada and Tamil
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('school_learning_module', 'title', 'kn', 'ನನ್ನ ಶಾಲೆ, ನನ್ನ ಕಲಿಕೆ', NOW()),
('school_learning_module', 'title', 'ta', 'நானும், என் பள்ளியும், என் கற்றலும்', NOW())
ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET 
    text = EXCLUDED.text,
    updated_at = NOW();
