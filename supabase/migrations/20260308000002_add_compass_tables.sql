-- Migration: Add profile_card_cache and career_roadmap tables for "My Compass" feature
-- Generated: 2026-03-08

BEGIN;

-- ============================================================================
-- Table 1: profile_card_cache
-- Caches AI-generated keyword summaries per assessment module per student
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_card_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_type text NOT NULL,
  keywords jsonb NOT NULL DEFAULT '{}',
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, assessment_type)
);

ALTER TABLE profile_card_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own profile card cache"
  ON profile_card_cache FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert own profile card cache"
  ON profile_card_cache FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own profile card cache"
  ON profile_card_cache FOR UPDATE
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can read profile card cache for students in their state"
  ON profile_card_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN teachers t ON t.state_id = c.state_id
      WHERE s.user_id = profile_card_cache.student_id
        AND t.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Table 2: career_roadmap
-- Stores student career choices at different timeline milestones
-- ============================================================================

CREATE TABLE IF NOT EXISTS career_roadmap (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  milestone text NOT NULL CHECK (milestone IN (
    'beginning_9th', 'end_9th', 'beginning_10th',
    'midterm_10th', 'post_exam_10th', 'before_results_10th', 'final_decision'
  )),
  plan_a text DEFAULT '',
  plan_b text DEFAULT '',
  plan_c text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, milestone)
);

ALTER TABLE career_roadmap ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own career roadmap"
  ON career_roadmap FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert own career roadmap"
  ON career_roadmap FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own career roadmap"
  ON career_roadmap FOR UPDATE
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can read career roadmap for students in their state"
  ON career_roadmap FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN teachers t ON t.state_id = c.state_id
      WHERE s.user_id = career_roadmap.student_id
        AND t.user_id = auth.uid()
    )
  );

COMMIT;
