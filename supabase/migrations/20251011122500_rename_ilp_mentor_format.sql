-- Rename default mentor display names to format: "ILP Mentor (State Name)"
-- Example: ILP Mentor (Tamil Nadu)

-- Update existing default mentors created previously with hyphen style
WITH mentor_rows AS (
  SELECT 
    u.id AS user_id,
    btrim(regexp_replace(COALESCE(s.state_name, s.name)::text, '^ILP[-_\s]*', '', 'i')) AS clean_state
  FROM public.teachers t
  JOIN public.users u ON u.id = t.user_id
  JOIN public.states s ON s.id = t.state_id
  WHERE t.is_default = true
    AND u.email LIKE 'ilp-mentor+%@internal.app'
)
UPDATE public.users u
SET full_name = 'ILP Mentor (' || m.clean_state || ')'
FROM mentor_rows m
WHERE u.id = m.user_id
  AND u.full_name IS DISTINCT FROM ('ILP Mentor (' || m.clean_state || ')');


