-- Migration: Update Dreams Section 3 help text to be friendlier and shorter
-- Makes the help text more appropriate for Grade 9-12 students by removing heavy, adult-like language

UPDATE dreams_questions
SET help_text = CASE sequence_number
    -- Question 13: Do you want to make your dream come true?
    WHEN 13 THEN 'Is this dream important to you? Are you ready to work for it?'
    
    -- Question 14: What essential elements do you believe are necessary to transform your dreams into reality?
    WHEN 14 THEN 'What do you need to make it happen? Think about skills, help from others, or things you need to learn. Pick one dream and explain.'
    
    -- Question 15: What initial steps do you plan to take in order to transform your aspirations and dreams into reality?
    WHEN 15 THEN 'What can you start doing right now? Write down the first few things you can do this week or month.'
    
    -- Question 16: Do you believe you have a positive mindset and the motivation necessary to achieve your dreams and aspirations?
    WHEN 16 THEN 'Do you feel good about your chances? What keeps you going? What makes it hard sometimes?'
    
    -- Question 17: Have you contemplated the potential hurdles or challenges that could arise on your journey towards achieving your dreams?
    WHEN 17 THEN 'What problems might come up? Money, time, skills, or other things? It''s okay to think about challenges - it helps you plan better.'
    
    -- Question 18: Do you believe the education and knowledge you are acquiring in school will aid in achieving your dreams?
    WHEN 18 THEN 'How can school help? Which subjects or things you learn in class connect to your dream?'
    
    ELSE help_text
END
WHERE section = 'section3'
  AND sequence_number BETWEEN 13 AND 18;

