-- Fix RLS infinite recursion on users by avoiding self-referential policy
-- Introduce is_admin(uid) SECURITY DEFINER helper and update policies to use it

-- 1) Helper function: is_admin
CREATE OR REPLACE FUNCTION public.is_admin(p_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = p_uid AND u.role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- 2) Recreate users policy to avoid self-selection inside policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='users' AND policyname='users_select_self_or_admin'
  ) THEN
    DROP POLICY "users_select_self_or_admin" ON public.users;
  END IF;
END $$;

CREATE POLICY "users_select_self_or_admin"
ON public.users
FOR SELECT TO authenticated
USING (
  users.id = auth.uid() OR public.is_admin(auth.uid())
);

-- 3) Recreate teachers policy to use is_admin
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='teachers' AND policyname='teachers_select_self_or_admin'
  ) THEN
    DROP POLICY "teachers_select_self_or_admin" ON public.teachers;
  END IF;
END $$;

CREATE POLICY "teachers_select_self_or_admin"
ON public.teachers
FOR SELECT TO authenticated
USING (
  teachers.user_id = auth.uid() OR public.is_admin(auth.uid())
);

-- 4) Update students policies to use is_admin to avoid querying users inside policies
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

CREATE POLICY "students_select_admin_or_assigned_teacher"
ON public.students
FOR SELECT TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.teachers t
    WHERE t.user_id = auth.uid() AND t.id = students.teacher_id
  )
  OR students.user_id = auth.uid()
);

CREATE POLICY "students_update_admin_or_assigned_teacher"
ON public.students
FOR UPDATE TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.teachers t
    WHERE t.user_id = auth.uid() AND t.id = students.teacher_id
  )
)
WITH CHECK (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.teachers t
    WHERE t.user_id = auth.uid() AND t.id = students.teacher_id
  )
);


