-- Restrict career_roadmap student writes to the 3 editable milestones.
-- Previously, the RLS policies only checked student_id = auth.uid(), so a
-- student with direct DB access could upsert rows for locked milestones
-- (beginning_10th, midterm_10th, post_exam_10th, before_results_10th,
-- final_decision). This migration narrows INSERT and UPDATE to the three
-- milestones that the UI actually exposes.

BEGIN;

DROP POLICY IF EXISTS "Students can insert own career roadmap" ON career_roadmap;
DROP POLICY IF EXISTS "Students can update own career roadmap" ON career_roadmap;

CREATE POLICY "Students can insert own career roadmap"
  ON career_roadmap FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND milestone IN ('beginning_9th', 'midterm_9th', 'end_9th')
  );

CREATE POLICY "Students can update own career roadmap"
  ON career_roadmap FOR UPDATE
  USING (
    student_id = auth.uid()
    AND milestone IN ('beginning_9th', 'midterm_9th', 'end_9th')
  );

COMMIT;
