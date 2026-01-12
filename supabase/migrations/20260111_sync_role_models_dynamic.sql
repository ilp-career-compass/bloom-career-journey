-- Migration: Sync Role Models Assessment Content for Dynamic Fetching
-- Updates Questions and Help Text Translations to match the final approved content.

-- 1. Update Questions (content_translations with resource_type='role_models_questions')
DELETE FROM content_translations WHERE resource_type = 'role_models_questions' AND lang = 'en';

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES
    ('role_models_questions', 'rm_q1', 'en', 'What is the name of your role model?'),
    ('role_models_questions', 'rm_q2', 'en', 'Is the person a family member, relative, or someone you know?'),
    ('role_models_questions', 'rm_q3', 'en', 'What qualities do you like in your role model? Why are they special to you?'),
    ('role_models_questions', 'rm_q4', 'en', 'What work or profession does the person do?'),
    ('role_models_questions', 'rm_q5', 'en', 'Which skill or talent of yours do you want to develop inspired by them?'),
    ('role_models_questions', 'rm_q6', 'en', 'Have you discussed your chosen career or job with your role model? What did you discuss?'),
    ('role_models_questions', 'rm_q7', 'en', 'Have you taken advice or opinion from your role model about your dream plan?'),
    ('role_models_questions', 'rm_q8', 'en', 'What does your role model say about your dream job or career?'),
    ('role_models_questions', 'rm_q9', 'en', 'Has any role model helped you in choosing your dream career?'),
    ('role_models_questions', 'rm_q10', 'en', 'If yes, what kind of help do you expect?'),
    ('role_models_questions', 'rm_q11', 'en', 'Apart from the above questions, is there anything else you would like to say?'),
    ('role_models_questions', 'rm_q12', 'en', 'Have you noticed any similarity or comparison between your personality and that of the above role models?'),
    ('role_models_questions', 'rm_q13', 'en', 'How do you try to adopt the qualities of your role model in your life?');

-- 2. Update Help Text (content_translations with resource_type='role_models_help')
DELETE FROM content_translations WHERE resource_type = 'role_models_help' AND lang = 'en';

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES
    ('role_models_help', 'rm_help_q1', 'en', 'Write the full name of your role model.'),
    ('role_models_help', 'rm_help_q2', 'en', 'Mention how the person is related to you.'),
    ('role_models_help', 'rm_help_q3', 'en', 'Think about qualities like hard work, honesty, and courage.'),
    ('role_models_help', 'rm_help_q4', 'en', 'Write their job or profession simply.'),
    ('role_models_help', 'rm_help_q5', 'en', 'Think about skills like studies, leadership, or communication.'),
    ('role_models_help', 'rm_help_q6', 'en', 'Write if you discussed career choice, education path, or future plans.'),
    ('role_models_help', 'rm_help_q7', 'en', 'Write whether you discussed your dream or future plan with them.'),
    ('role_models_help', 'rm_help_q8', 'en', 'Mention whether they encouraged you or gave advice.'),
    ('role_models_help', 'rm_help_q9', 'en', 'Write who helped you and how they helped you.'),
    ('role_models_help', 'rm_help_q10', 'en', 'Think about help like education, training, or guidance.'),
    ('role_models_help', 'rm_help_q11', 'en', 'You may write any additional thoughts or opinions.'),
    ('role_models_help', 'rm_help_q12', 'en', 'Think about common qualities, habits, or thoughts between you and your role model and write them.'),
    ('role_models_help', 'rm_help_q13', 'en', 'Write how you follow your role model''s good habits, discipline, and hard work in your life.');
