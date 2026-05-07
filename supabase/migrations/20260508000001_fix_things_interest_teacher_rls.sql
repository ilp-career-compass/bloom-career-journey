-- Fix teacher RLS policy on things_that_interest_me.
--
-- The original policy in 20260402000001_profile_card_approval.sql compared
-- things_that_interest_me.student_id (which stores users.id) against
-- students.id (the students table PK), which never matches.
-- Correct comparison is against students.user_id.

DROP POLICY IF EXISTS "Teachers can read interests for their students" ON things_that_interest_me;

CREATE POLICY "Teachers can read interests for their students"
  ON things_that_interest_me FOR SELECT
  USING (
    student_id IN (
      SELECT s.user_id FROM students s
      JOIN teachers t ON s.teacher_id = t.id
      WHERE t.user_id = auth.uid()
    )
  );
