-- Phase 1: Ensure student signup persists class into public.students

-- Drop existing policy if present (CREATE POLICY doesn't support IF NOT EXISTS)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'students' AND policyname = 'student_insert_own'
  ) THEN
    DROP POLICY "student_insert_own" ON public.students;
  END IF;
END $$;

CREATE POLICY "student_insert_own"
ON public.students
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- 2) Prevent duplicates for a user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'students_user_unique'
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_user_unique UNIQUE (user_id);
  END IF;
END $$;


