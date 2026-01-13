-- Migration: Update English About Me Questions (Base Table)
-- Updates the about_me_fields table which serves as the base (English) content.

-- Update Questions and Help Text

-- Q1
UPDATE about_me_fields 
SET question_text = 'In your family, with whom can you freely share your opinions without fear or hesitation? And how much trust do you have in them?',
    help_text = 'Choose the family member you feel safest talking to.'
WHERE field_key = 'question1';

-- Q2
UPDATE about_me_fields 
SET question_text = 'Other than your family members, with whom can you freely share your opinions and feelings without fear or hesitation?',
    help_text = 'Think about someone outside your family whom you trust and feel comfortable talking to.'
WHERE field_key = 'question2';

-- Q3
UPDATE about_me_fields 
SET question_text = 'What are the tasks you do at home? (e.g., helping in agricultural activities, bringing vegetables and groceries from the shop, money-related work, taking care of animals, filling water, etc.)',
    help_text = 'Think about the daily work you help with at home.'
WHERE field_key = 'question3';

-- Q4
UPDATE about_me_fields 
SET question_text = 'The tasks you like to do: a. During school hours b. After school hours (before school starts and after school ends)',
    help_text = 'Write the activities you enjoy doing during and after school.'
WHERE field_key = 'question4';

-- Q5
UPDATE about_me_fields 
SET question_text = 'What are the activities you like to do alone, independently? (Tasks you do by yourself)',
    help_text = 'Think about activities you enjoy doing by yourself.'
WHERE field_key = 'question5';

-- Q6
UPDATE about_me_fields 
SET question_text = 'What activities do you like to do in a group or with your friends?',
    help_text = 'Think about activities you enjoy doing with friends.'
WHERE field_key = 'question6';

-- Q7
UPDATE about_me_fields 
SET question_text = 'What activities do you find difficult at school? Write them.',
    help_text = 'Think about school activities that are hard for you.'
WHERE field_key = 'question7';

-- Q8
UPDATE about_me_fields 
SET question_text = 'Apart from school work or activities, what other tasks do you find difficult?',
    help_text = 'Think about tasks outside school that you find difficult.'
WHERE field_key = 'question8';

-- Q9
UPDATE about_me_fields 
SET question_text = 'What activities do you like to do alone? For example, reading, drawing, playing, etc.',
    help_text = 'Think about activities you enjoy doing alone.'
WHERE field_key = 'question9';

-- Q10
UPDATE about_me_fields 
SET question_text = 'Do you like to do the activities you like or dislike by yourself?',
    help_text = 'Think about whether you like doing activities alone.'
WHERE field_key = 'question10';

-- Q11 (HIDDEN)
UPDATE about_me_fields 
SET question_text = '',
    help_text = ''
WHERE field_key = 'question11';

-- Q12 (Matches User Q11)
UPDATE about_me_fields 
SET question_text = 'What would you say about yourself? What qualities do you have?',
    help_text = 'What are your good qualities?'
WHERE field_key = 'question12';

-- Q13
UPDATE about_me_fields 
SET question_text = 'Which of your qualities do you think these people (parents, teachers, friends, etc.) like? List them. (Ask your parents, teachers, and friends and verify.)',
    help_text = 'What good qualities do your parents, teachers, and friends like?'
WHERE field_key = 'question13';

-- Q14
UPDATE about_me_fields 
SET question_text = 'Which habit or behaviour of yours do you want to improve or change?',
    help_text = 'Is there any habit or behaviour you want to change or improve?'
WHERE field_key = 'question14';

-- Q15
UPDATE about_me_fields 
SET question_text = 'Which of your qualities or behaviours do others want you to correct, or advise you to change?',
    help_text = 'Think about the feedback you get from others.'
WHERE field_key = 'question15';

-- Q16
UPDATE about_me_fields 
SET question_text = 'If you had a chance to become something or someone in the future, what would you like to become?',
    help_text = 'If you could become anything or anyone, what would you like to be?'
WHERE field_key = 'question16';

-- Q17
UPDATE about_me_fields 
SET question_text = 'Recall an interview or feedback you received about yourself. Which of your actions or work earned you appreciation? How did you achieve it? Explain briefly.',
    help_text = 'Think about a time when someone appreciated you'
WHERE field_key = 'question17';

-- Q18
UPDATE about_me_fields 
SET question_text = 'Think about a difficult or challenging situation you faced recently. How did you face it or overcome it? What lesson did you learn from it?',
    help_text = 'Think about a recent problem or challenge.'
WHERE field_key = 'question18';

-- Q19
UPDATE about_me_fields 
SET question_text = 'Recall a situation where others misunderstood you or had a wrong impression about you. How did you handle that situation, and what did you learn from it?',
    help_text = 'Think about a time when someone misunderstood you.'
WHERE field_key = 'question19';

-- Q20
UPDATE about_me_fields 
SET question_text = 'Based on the summary, write briefly about yourself. (You may use words, pictures, or symbols.)',
    help_text = 'Write a short note about yourself using the summary.'
WHERE field_key = 'question20';
