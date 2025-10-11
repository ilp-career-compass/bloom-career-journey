-- Update RPCs to be state-based instead of school-based

-- Function: search_students(teacher_user_id uuid, query text)
-- Returns students within the teacher's state that match the query
CREATE OR REPLACE FUNCTION public.search_students(
  teacher_user_id uuid,
  query text
)
RETURNS TABLE (
  student_user_id uuid,
  full_name text,
  mobile text,
  email text,
  current_class text
) AS $$
DECLARE
  v_teacher_state uuid;
BEGIN
  -- Caller must be the teacher making the request
  IF auth.uid() IS NULL OR auth.uid() <> teacher_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Resolve teacher's state
  SELECT t.state_id INTO v_teacher_state
  FROM public.teachers t
  WHERE t.user_id = teacher_user_id;

  IF v_teacher_state IS NULL THEN
    -- No state assigned, return empty set
    RETURN;
  END IF;

  RETURN QUERY
  SELECT u.id AS student_user_id,
         u.full_name,
         COALESCE(u.mobile, '') AS mobile,
         COALESCE(u.email, '')  AS email,
         COALESCE(c.name, '')   AS current_class
  FROM public.users u
  LEFT JOIN public.students s ON s.user_id = u.id
  LEFT JOIN public.classes  c ON c.id = s.class_id
  WHERE u.role = 'student'
    AND u.state_id = v_teacher_state
    AND (
      (u.mobile IS NOT NULL AND u.mobile = query) OR
      (u.email  IS NOT NULL AND u.email ILIKE '%' || query || '%') OR
      (u.full_name ILIKE '%' || query || '%')
    )
  ORDER BY u.full_name ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.search_students(uuid, text) TO authenticated;

-- Function: enroll_student_by_user_id(teacher_user_id uuid, student_user_id uuid, class_id uuid)
-- Links a student to a teacher and optionally a class within the same state.
CREATE OR REPLACE FUNCTION public.enroll_student_by_user_id(
  teacher_user_id uuid,
  student_user_id uuid,
  class_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_teacher_id uuid;
  v_teacher_state uuid;
  v_class_state uuid;
  v_student_state uuid;
  v_existing_class uuid;
BEGIN
  -- Auth check
  IF auth.uid() IS NULL OR auth.uid() <> teacher_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT t.id, t.state_id INTO v_teacher_id, v_teacher_state
  FROM public.teachers t
  WHERE t.user_id = teacher_user_id;

  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Teacher profile not found';
  END IF;

  -- If class_id not provided, try to use student's existing class
  IF class_id IS NULL THEN
    SELECT s.class_id INTO v_existing_class FROM public.students s WHERE s.user_id = student_user_id;
    IF v_existing_class IS NOT NULL THEN
      class_id := v_existing_class;
    END IF;
  END IF;

  IF class_id IS NOT NULL THEN
    SELECT c.state_id INTO v_class_state FROM public.classes c WHERE c.id = class_id;
    IF v_class_state IS NULL THEN
      RAISE EXCEPTION 'Class not found';
    END IF;
  END IF;

  SELECT u.state_id INTO v_student_state FROM public.users u WHERE u.id = student_user_id;
  IF v_student_state IS NULL THEN
    RAISE EXCEPTION 'Student user not found';
  END IF;

  -- Cross-state protection
  IF v_teacher_state <> v_student_state OR (class_id IS NOT NULL AND v_teacher_state <> v_class_state) THEN
    RAISE EXCEPTION 'Cross-state enrollment is not allowed';
  END IF;

  -- Upsert student enrollment
  INSERT INTO public.students (user_id, class_id, teacher_id, enrollment_status, enrollment_date)
  VALUES (student_user_id, class_id, v_teacher_id, 'active', now())
  ON CONFLICT (user_id) DO UPDATE
    SET class_id = COALESCE(EXCLUDED.class_id, public.students.class_id),
        teacher_id = EXCLUDED.teacher_id,
        enrollment_status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.enroll_student_by_user_id(uuid, uuid, uuid) TO authenticated;


