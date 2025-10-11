-- Enhance search_students to also return current_class_id for preselecting in UI

-- Drop previous signature to allow changing OUT parameters (Postgres limitation)
DROP FUNCTION IF EXISTS public.search_students(uuid, text);

CREATE OR REPLACE FUNCTION public.search_students(
  teacher_user_id uuid,
  query text
)
RETURNS TABLE (
  student_user_id uuid,
  full_name text,
  mobile text,
  email text,
  current_class_id uuid,
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
  SELECT 
    u.id AS student_user_id,
    u.full_name,
    COALESCE(u.mobile, '') AS mobile,
    COALESCE(u.email, '')  AS email,
    s.class_id AS current_class_id,
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


