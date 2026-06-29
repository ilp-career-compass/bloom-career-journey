-- Update search_students to support optional filters (state, language, class)
DROP FUNCTION IF EXISTS search_students(uuid, text);
DROP FUNCTION IF EXISTS search_students(uuid, text, uuid, text, uuid);

CREATE OR REPLACE FUNCTION search_students(
  teacher_user_id uuid,
  query text DEFAULT NULL,
  p_state_id uuid DEFAULT NULL,
  p_language text DEFAULT NULL,
  p_class_id uuid DEFAULT NULL
)
RETURNS TABLE (
  student_user_id uuid,
  full_name text,
  mobile text,
  preferred_language text,
  current_class_id uuid,
  current_class text,
  mentor_name text,
  is_default_mentor boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_teacher_state uuid;
  v_target_state uuid;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> teacher_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT t.state_id INTO v_teacher_state
  FROM public.teachers t
  WHERE t.user_id = teacher_user_id;

  IF v_teacher_state IS NULL THEN
    RETURN;
  END IF;

  -- Use provided state filter, or fallback to teacher's state
  v_target_state := COALESCE(p_state_id, v_teacher_state);

  RETURN QUERY
  SELECT
    u.id AS student_user_id,
    u.full_name,
    COALESCE(u.mobile::text, ''::text) AS mobile,
    COALESCE(u.preferred_language::text, 'en'::text) AS preferred_language,
    s.class_id AS current_class_id,
    COALESCE(c.name::text, ''::text) AS current_class,
    COALESCE(mu.full_name::text, 'None'::text) AS mentor_name,
    COALESCE(mt.is_default, false) AS is_default_mentor
  FROM public.users u
  LEFT JOIN public.students s ON s.user_id = u.id
  LEFT JOIN public.classes c ON c.id = s.class_id
  LEFT JOIN public.teachers mt ON mt.id = s.teacher_id
  LEFT JOIN public.users mu ON mu.id = mt.user_id
  WHERE u.role = 'student'
    AND u.state_id = v_target_state
    AND (
      NULLIF(query, '') IS NULL OR
      (u.mobile IS NOT NULL AND u.mobile ILIKE '%' || query || '%') OR
      (u.full_name ILIKE '%' || query || '%')
    )
    AND (
      NULLIF(p_language, '') IS NULL OR 
      u.preferred_language = p_language
    )
    AND (
      p_class_id IS NULL OR 
      s.class_id = p_class_id
    )
  ORDER BY u.full_name ASC
  LIMIT 50;
END;
$$;

GRANT EXECUTE ON FUNCTION search_students(uuid, text, uuid, text, uuid) TO authenticated;
