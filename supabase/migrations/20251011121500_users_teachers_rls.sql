-- RLS policies to allow reading own user row and own teacher row; admins can read all

-- USERS table policies
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
  users.id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users admin
    WHERE admin.id = auth.uid() AND admin.role = 'admin'
  )
);

-- TEACHERS table policies
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
  teachers.user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users admin
    WHERE admin.id = auth.uid() AND admin.role = 'admin'
  )
);


