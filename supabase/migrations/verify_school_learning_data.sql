-- Verify School Learning Questions Data
SELECT id, sequence_number, question_text FROM school_learning_questions ORDER BY sequence_number;

-- Verify Content Translations for Kannada
SELECT resource_key, text FROM content_translations 
WHERE resource_type = 'school_learning_question' AND lang = 'kn'
ORDER BY resource_key;

-- Test the RPC directly
SELECT * FROM get_school_learning_questions_i18n('kn');
