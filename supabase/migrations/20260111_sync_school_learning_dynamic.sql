-- Migration: Sync School Learning Assessment Content for Dynamic Fetching
-- Updates Questions and Help Text Translations to match the final approved content.

-- 1. Update Questions (school_learning_questions)
-- Q1
UPDATE school_learning_questions SET question_text = 'Do you like coming to school? Why?' WHERE sequence_number = 1;
-- Q2
UPDATE school_learning_questions SET question_text = 'What do you like to learn at school?' WHERE sequence_number = 2;
-- Q3
UPDATE school_learning_questions SET question_text = 'What are the reasons you do not like learning in school? Explain.' WHERE sequence_number = 3;
-- Q4
UPDATE school_learning_questions SET question_text = 'Who are your close friends in school? What qualities or traits in them have made them your close friends?' WHERE sequence_number = 4;
-- Q5
UPDATE school_learning_questions SET question_text = 'Which subjects do you like the most? Write them.' WHERE sequence_number = 5;
-- Q6
UPDATE school_learning_questions SET question_text = 'Why do you like this subject? Write the reason.' WHERE sequence_number = 6;
-- Q7
UPDATE school_learning_questions SET question_text = 'Which subjects do you not like to study?' WHERE sequence_number = 7;
-- Q8
UPDATE school_learning_questions SET question_text = 'Why do you have less interest in the above subjects? What help did you receive to learn these subjects?' WHERE sequence_number = 8;
-- Q9
UPDATE school_learning_questions SET question_text = 'Which subjects do you score the highest marks in?' WHERE sequence_number = 9;
-- Q10
UPDATE school_learning_questions SET question_text = 'Which subjects do you score low marks in?' WHERE sequence_number = 10;
-- Q11 (Options Question - Check DB structure. Assuming question_text is just the prompt)
UPDATE school_learning_questions SET question_text = 'Which learning methodologies from the following options resonate with you the most? (Mark with ✔ that applies to you)' WHERE sequence_number = 11;
-- Q12
UPDATE school_learning_questions SET question_text = 'Do you prefer to learn alone or in a group? Why? Write the reason.' WHERE sequence_number = 12;
-- Q13
UPDATE school_learning_questions SET question_text = 'Do you learn from your friends in school? List some of the things you have recently learned from friends at school.' WHERE sequence_number = 13;
-- Q14
UPDATE school_learning_questions SET question_text = 'Apart from textbook subjects, what aspects attract you to school?' WHERE sequence_number = 14;
-- Q15
UPDATE school_learning_questions SET question_text = 'Who are your two favourite teachers and why? How have these two teachers influenced you?' WHERE sequence_number = 15;
-- Q16
UPDATE school_learning_questions SET question_text = 'Is there any specific incident or experience in school that gave you a great sense of success or satisfaction? What is it?' WHERE sequence_number = 16;
-- Q17
UPDATE school_learning_questions SET question_text = 'How do the things you learned in school help you achieve your dreams and expectations?' WHERE sequence_number = 17;
-- Q18
UPDATE school_learning_questions SET question_text = 'What are the things you want to be changed in your school? What is the reason for that?' WHERE sequence_number = 18;
-- Q19
UPDATE school_learning_questions SET question_text = 'Do you have any special place to express yourself? Why is it necessary?' WHERE sequence_number = 19;
-- Q20
UPDATE school_learning_questions SET question_text = 'Does the school play an important role in your life related to learning? Write your opinion.' WHERE sequence_number = 20;
-- Q21
UPDATE school_learning_questions SET question_text = 'Do you like to discuss school activities and learning with your parents? What topics do you discuss with them?' WHERE sequence_number = 21;


-- 2. Update Help Text Translations (content_translations)
-- Resource Type: 'school_help', Lang: 'en'

INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES
    ('school_help', 'question1', 'en', 'Write whether you like coming to school and give the reason.'),
    ('school_help', 'question2', 'en', 'Write what you like to learn in school.'),
    ('school_help', 'question3', 'en', 'Clearly write the reasons why you do not like learning in school.'),
    ('school_help', 'question4', 'en', 'Write about your close friends and the qualities that make them special.'),
    ('school_help', 'question5', 'en', 'List the subjects you like the most.'),
    ('school_help', 'question6', 'en', 'You may like the subject because it is easy, interesting, or taught well by the teacher.'),
    ('school_help', 'question7', 'en', 'Some subjects may be disliked because they are difficult or hard to understand.'),
    ('school_help', 'question8', 'en', 'Interest may be less because the subject is difficult, and help from teachers or friends supports learning.'),
    ('school_help', 'question9', 'en', 'Students usually score higher marks in subjects they understand well and like.'),
    ('school_help', 'question10', 'en', 'Low marks may be due to lack of understanding or insufficient practice.'),
    ('school_help', 'question11', 'en', 'Check all the ways you like to learn. You can choose more than one.'),
    ('school_help', 'question12', 'en', 'Select your preferred learning method and write the reason.'),
    ('school_help', 'question13', 'en', 'Recall and list what you learned from your friends.'),
    ('school_help', 'question14', 'en', 'Write the other activities or aspects that make school appealing.'),
    ('school_help', 'question15', 'en', 'Write about your favourite teachers and how they influenced you.'),
    ('school_help', 'question16', 'en', 'Write about a school incident that made you feel successful or satisfied.'),
    ('school_help', 'question17', 'en', 'Relate what you learned in school to your dreams and goals.'),
    ('school_help', 'question18', 'en', 'Write the changes you want and the reasons for them.'),
    ('school_help', 'question19', 'en', 'Write about a place where you express yourself and why it is necessary.'),
    ('school_help', 'question20', 'en', 'Write your opinion about the role of school in your learning.'),
    ('school_help', 'question21', 'en', 'Write the school-related topics you discuss with your parents.')
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text;
