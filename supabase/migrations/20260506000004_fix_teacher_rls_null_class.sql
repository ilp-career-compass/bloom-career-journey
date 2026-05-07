-- Fix teacher RLS policies on career_roadmap and profile_card_cache.
--
-- Root causes:
-- (1) Original policies (20260308000002) joined through classes, so students with
--     class_id = NULL were invisible to their assigned teacher.
-- (2) The career_roadmap SELECT policy added in 20260402000001 compared
--     career_roadmap.student_id (users.id) against students.id — always false,
--     making it a no-op (original class-based policy was the only working path).
--
-- Fix: replace all class-based policies with teacher_id-based joins.
-- students.teacher_id is NOT NULL, so all students are covered regardless of class.

BEGIN;

-- ── career_roadmap ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Teachers can read career roadmap for students in their state" ON career_roadmap;
DROP POLICY IF EXISTS "Teachers can read career roadmap for their students" ON career_roadmap;

CREATE POLICY "Teachers can read career roadmap for their students"
  ON career_roadmap FOR SELECT
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM students s
      JOIN teachers t ON t.id = s.teacher_id
      WHERE s.user_id = career_roadmap.student_id
        AND t.user_id = auth.uid()
    )
  );

-- ── profile_card_cache ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Teachers can read profile card cache for students in their state" ON profile_card_cache;
DROP POLICY IF EXISTS "Teachers can update profile card cache for their students" ON profile_card_cache;

CREATE POLICY "Teachers can read profile card cache for their students"
  ON profile_card_cache FOR SELECT
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM students s
      JOIN teachers t ON t.id = s.teacher_id
      WHERE s.user_id = profile_card_cache.student_id
        AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update profile card cache for their students"
  ON profile_card_cache FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN teachers t ON t.id = s.teacher_id
      WHERE s.user_id = profile_card_cache.student_id
        AND t.user_id = auth.uid()
    )
  );

COMMIT;
