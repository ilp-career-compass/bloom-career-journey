-- Migration: Fix/Update School Learning Assessment Content
-- Updates specific questions and help texts as requested by user

-- Update Questions and Help Texts by sequence_number

-- Q1: Update Help Text only (Question not provided in list, but help text was)
UPDATE school_learning_questions 
SET help_text = 'Write whether you like coming to school and give the reason.'
WHERE sequence_number = 1;

-- Q2: Update Help Text only
UPDATE school_learning_questions 
SET help_text = 'Write what you like to learn in school.'
WHERE sequence_number = 2;

-- Q3
UPDATE school_learning_questions 
SET question_text = 'What are the reasons you do not like learning in school? Explain.',
    help_text = 'Clearly write the reasons why you do not like learning in school.'
WHERE sequence_number = 3;

-- Q4
UPDATE school_learning_questions 
SET question_text = 'Who are your close friends in school? What qualities or traits in them have made them your close friends?',
    help_text = 'Write about your close friends and the qualities that make them special.'
WHERE sequence_number = 4;

-- Q5
UPDATE school_learning_questions 
SET question_text = 'Which subjects do you like the most? Write them.',
    help_text = 'List the subjects you like the most.'
WHERE sequence_number = 5;

-- Q6
UPDATE school_learning_questions 
SET question_text = 'Why do you like this subject? Write the reason.',
    help_text = 'You may like the subject because it is easy, interesting, or taught well by the teacher.'
WHERE sequence_number = 6;

-- Q7
UPDATE school_learning_questions 
SET question_text = 'Which subjects do you not like to study?',
    help_text = 'Some subjects may be disliked because they are difficult or hard to understand.'
WHERE sequence_number = 7;

-- Q8
UPDATE school_learning_questions 
SET question_text = 'Why do you have less interest in the above subjects? What help did you receive to learn these subjects?',
    help_text = 'Interest may be less because the subject is difficult, and help from teachers or friends supports learning.'
WHERE sequence_number = 8;

-- Q9
UPDATE school_learning_questions 
SET question_text = 'Which subjects do you score the highest marks in?',
    help_text = 'Students usually score higher marks in subjects they understand well and like.'
WHERE sequence_number = 9;

-- Q10
UPDATE school_learning_questions 
SET question_text = 'Which subjects do you score low marks in?',
    help_text = 'Low marks may be due to lack of understanding or insufficient practice.'
WHERE sequence_number = 10;

-- Q11 skipped (not in user list)

-- Q12
UPDATE school_learning_questions 
SET question_text = 'Do you prefer to learn alone or in a group? Why? Write the reason.',
    help_text = 'Select your preferred learning method and write the reason.'
WHERE sequence_number = 12;

-- Q13
UPDATE school_learning_questions 
SET question_text = 'Do you learn from your friends in school? List some of the things you have recently learned from friends at school.',
    help_text = 'Recall and list what you learned from your friends.'
WHERE sequence_number = 13;

-- Q14
UPDATE school_learning_questions 
SET question_text = 'Apart from textbook subjects, what aspects attract you to school?',
    help_text = 'Write the other activities or aspects that make school appealing.'
WHERE sequence_number = 14;

-- Q15
UPDATE school_learning_questions 
SET question_text = 'Who are your two favourite teachers and why? How have these two teachers influenced you?',
    help_text = 'Write about your favourite teachers and how they influenced you.'
WHERE sequence_number = 15;

-- Q16
UPDATE school_learning_questions 
SET question_text = 'Is there any specific incident or experience in school that gave you a great sense of success or satisfaction? What is it?',
    help_text = 'Write about a school incident that made you feel successful or satisfied.'
WHERE sequence_number = 16;

-- Q17
UPDATE school_learning_questions 
SET question_text = 'How do the things you learned in school help you achieve your dreams and expectations?',
    help_text = 'Relate what you learned in school to your dreams and goals.'
WHERE sequence_number = 17;

-- Q18
UPDATE school_learning_questions 
SET question_text = 'What are the things you want to be changed in your school? What is the reason for that?',
    help_text = 'Write the changes you want and the reasons for them.'
WHERE sequence_number = 18;

-- Q19
UPDATE school_learning_questions 
SET question_text = 'Do you have any special place to express yourself? Why is it necessary?',
    help_text = 'Write about a place where you express yourself and why it is necessary.'
WHERE sequence_number = 19;

-- Q20
UPDATE school_learning_questions 
SET question_text = 'Does the school play an important role in your life related to learning? Write your opinion.',
    help_text = 'Write your opinion about the role of school in your learning.'
WHERE sequence_number = 20;

-- Q21
UPDATE school_learning_questions 
SET question_text = 'Do you like to discuss school activities and learning with your parents? What topics do you discuss with them?',
    help_text = 'Write the school-related topics you discuss with your parents.'
WHERE sequence_number = 21;


-- Verification
DO $$
DECLARE
    q3_text TEXT;
BEGIN
    SELECT question_text INTO q3_text FROM school_learning_questions WHERE sequence_number = 3;
    RAISE NOTICE 'Updated Q3 Text: %', q3_text;
END $$;
