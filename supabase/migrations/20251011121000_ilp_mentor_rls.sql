-- RLS policies for ILP Mentor and Admin access on students

-- Drop existing policies if they conflict (idempotent guards)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'students' AND policyname = 'students_select_admin_or_assigned_teacher'
  ) THEN
    DROP POLICY "students_select_admin_or_assigned_teacher" ON public.students;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'students' AND policyname = 'students_update_admin_or_assigned_teacher'
  ) THEN
    DROP POLICY "students_update_admin_or_assigned_teacher" ON public.students;
  END IF;
END $$;

-- SELECT: allow
-- - admins (users.role = 'admin')
-- - assigned teachers (teachers.user_id = auth.uid() AND teachers.id = students.teacher_id)
-- - the student themselves (students.user_id = auth.uid())
CREATE POLICY "students_select_admin_or_assigned_teacher"
ON public.students
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM public.teachers t
    WHERE t.user_id = auth.uid() AND t.id = students.teacher_id
  )
  OR students.user_id = auth.uid()
);

-- UPDATE: allow admins and assigned teachers
CREATE POLICY "students_update_admin_or_assigned_teacher"
ON public.students
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM public.teachers t
    WHERE t.user_id = auth.uid() AND t.id = students.teacher_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM public.teachers t
    WHERE t.user_id = auth.uid() AND t.id = students.teacher_id
  )
);

-- Note: existing insert policy for students (self-insert) is kept as-is


