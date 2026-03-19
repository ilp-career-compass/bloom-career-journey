-- ============================================================
-- Add unique constraint on (student_id, assessment_type) to
-- prevent duplicate assessment_responses rows from autosave.
-- First cleans up all existing duplicates using DISTINCT ON.
-- ============================================================

BEGIN;

-- Step 1: Identify the ONE row to keep per (student_id, assessment_type)
-- Priority: completed first, then most recently updated
CREATE TEMP TABLE keep_ids AS
SELECT DISTINCT ON (student_id, assessment_type) id
FROM assessment_responses
ORDER BY student_id, assessment_type,
  completed_at DESC NULLS LAST,
  updated_at DESC NULLS LAST;

-- Step 2: Delete orphaned summaries for rows being removed
DELETE FROM assessment_summaries
WHERE assessment_response_id NOT IN (SELECT id FROM keep_ids)
  AND assessment_response_id IN (SELECT id FROM assessment_responses);

-- Step 3: Delete all duplicate rows (keep only the best one per student+type)
DELETE FROM assessment_responses
WHERE id NOT IN (SELECT id FROM keep_ids);

-- Step 4: Clean up temp table
DROP TABLE keep_ids;

-- Step 5: Add unique constraint
ALTER TABLE assessment_responses
ADD CONSTRAINT unique_student_assessment
UNIQUE (student_id, assessment_type);

COMMIT;
