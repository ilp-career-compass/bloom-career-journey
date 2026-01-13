-- Migration: Update English Inspiration Summary Header

-- Update the base table which serves as the English content
UPDATE inspiration_summary_questions
SET section_header = 'Summary: What inspired me to…', -- Using the specific ellipsis character asked by user
    updated_at = NOW()
WHERE sequence_number = 1;

-- Verification
DO $$
DECLARE
    header_text TEXT;
BEGIN
    SELECT section_header INTO header_text
    FROM inspiration_summary_questions
    WHERE sequence_number = 1;
    
    RAISE NOTICE 'Updated English Summary Header: %', header_text;
END $$;
