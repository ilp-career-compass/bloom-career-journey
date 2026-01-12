-- Migration: Restrict student takeover and enhance search feedback

-- 1) Update search_students to return mentor info
CREATE OR REPLACE FUNCTION public.search_students(
  teacher_user_id uuid,
  query text
)
RETURNS TABLE (
  student_user_id uuid,
  full_name text,
  mobile text,
  email text,
  current_class text,
  current_class_id uuid,
  mentor_name text,
  is_default_mentor boolean
) AS $$
DECLARE
  v_teacher_school uuid;
BEGIN
  -- Auth check
  IF auth.uid() IS NULL OR auth.uid() <> teacher_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Resolve teacher's school
  SELECT t.school_id INTO v_teacher_school
  FROM public.teachers t
  WHERE t.user_id = teacher_user_id;

  IF v_teacher_school IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT u.id AS student_user_id,
         u.full_name,
         COALESCE(u.mobile, '') AS mobile,
         COALESCE(u.email, '')  AS email,
         COALESCE(c.name, '')   AS current_class,
         c.id AS current_class_id,
         COALESCE(mu.full_name, 'None') AS mentor_name,
         COALESCE(mt.is_default, true) AS is_default_mentor
  FROM public.users u
  LEFT JOIN public.students s ON s.user_id = u.id
  LEFT JOIN public.classes  c ON c.id = s.class_id
  LEFT JOIN public.teachers mt ON mt.id = s.teacher_id
  LEFT JOIN public.users mu ON mu.id = mt.user_id
  WHERE u.role = 'student'
    AND u.school_id = v_teacher_school
    AND (
      (u.mobile IS NOT NULL AND u.mobile = query) OR
      (u.email  IS NOT NULL AND u.email ILIKE '%' || query || '%') OR
      (u.full_name ILIKE '%' || query || '%')
    )
  ORDER BY u.full_name ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2) Update enroll_student_by_user_id with takeover restriction logic
CREATE OR REPLACE FUNCTION public.enroll_student_by_user_id(
  teacher_user_id uuid,
  student_user_id uuid,
  class_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_teacher_id uuid;
  v_teacher_school uuid;
  v_student_school uuid;
  v_class_school uuid;
  v_current_mentor_name text;
  v_current_is_default boolean;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> teacher_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT t.id, t.school_id INTO v_teacher_id, v_teacher_school
  FROM public.teachers t
  WHERE t.user_id = teacher_user_id;

  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Teacher profile not found';
  END IF;

  -- Verify student school
  SELECT u.school_id INTO v_student_school FROM public.users u WHERE u.id = student_user_id;
  IF v_student_school IS NULL THEN
    RAISE EXCEPTION 'Student user not found';
  END IF;

  IF v_teacher_school <> v_student_school THEN
    RAISE EXCEPTION 'Cross-school enrollment is not allowed';
  END IF;

  -- Check current assignment
  SELECT mu.full_name, mt.is_default 
  INTO v_current_mentor_name, v_current_is_default
  FROM public.students s
  JOIN public.teachers mt ON mt.id = s.teacher_id
  JOIN public.users mu ON mu.id = mt.user_id
  WHERE s.user_id = student_user_id;

  -- Block if already assigned to a regular (non-default) teacher who isn't the caller
  IF v_current_mentor_name IS NOT NULL 
     AND v_current_is_default = false 
     AND EXISTS (SELECT 1 FROM public.teachers WHERE id = v_teacher_id AND user_id <> (SELECT user_id FROM public.teachers WHERE id = (SELECT teacher_id FROM public.students WHERE user_id = student_user_id)))
  THEN
     -- Check if the current teacher is actually DIFFERENT from the caller
     IF EXISTS (
         SELECT 1 FROM public.students s 
         JOIN public.teachers t ON t.id = s.teacher_id 
         WHERE s.user_id = student_user_id AND t.user_id <> teacher_user_id
     ) THEN
        RAISE EXCEPTION 'Student is already mentored by %', v_current_mentor_name;
     END IF;
  END IF;

  IF class_id IS NOT NULL THEN
    SELECT c.school_id INTO v_class_school FROM public.classes c WHERE c.id = class_id;
    IF v_class_school IS NULL OR v_class_school <> v_teacher_school THEN
      RAISE EXCEPTION 'Class does not belong to teacher school';
    END IF;
  END IF;

  INSERT INTO public.students (user_id, class_id, teacher_id, enrollment_status, enrollment_date)
  VALUES (student_user_id, class_id, v_teacher_id, 'active', now())
  ON CONFLICT (user_id) DO UPDATE
    SET class_id = COALESCE(EXCLUDED.class_id, public.students.class_id),
        teacher_id = EXCLUDED.teacher_id,
        enrollment_status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
