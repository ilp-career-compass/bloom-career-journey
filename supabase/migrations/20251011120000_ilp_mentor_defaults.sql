-- ILP Mentor: defaults, auto-assignment, seeding, and backfill
-- Safe to run multiple times (guarded with IF NOT EXISTS / ON CONFLICT)

-- 1) Schema change: add is_default flag to teachers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'teachers' AND column_name = 'is_default'
  ) THEN
    ALTER TABLE public.teachers
      ADD COLUMN is_default boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- 2) Partial unique index: only one default mentor per state
-- If the index already exists, this will error; so guard with IF NOT EXISTS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'teachers_unique_default_per_state'
  ) THEN
    CREATE UNIQUE INDEX teachers_unique_default_per_state
      ON public.teachers(state_id)
      WHERE is_default = true;
  END IF;
END $$;

-- 3) Helpful index for queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'idx_teachers_is_default_state'
  ) THEN
    CREATE INDEX idx_teachers_is_default_state
      ON public.teachers(state_id)
      WHERE is_default = true;
  END IF;
END $$;

-- Ensure students.teacher_id is indexed for dashboards/analytics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'idx_students_teacher_id'
  ) THEN
    CREATE INDEX idx_students_teacher_id ON public.students(teacher_id);
  END IF;
END $$;

-- 4) Trigger function: auto-assign default mentor when students.teacher_id is NULL
CREATE OR REPLACE FUNCTION public.assign_default_mentor()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_state_id uuid;
  v_teacher_id uuid;
BEGIN
  -- Only act when teacher_id is NULL
  IF NEW.teacher_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Resolve state via class if available
  IF NEW.class_id IS NOT NULL THEN
    SELECT c.state_id INTO v_state_id
    FROM public.classes c
    WHERE c.id = NEW.class_id;
  END IF;

  -- Fallback: resolve state via user's profile
  IF v_state_id IS NULL THEN
    SELECT u.state_id INTO v_state_id
    FROM public.users u
    WHERE u.id = NEW.user_id;
  END IF;

  -- Assign default mentor for the resolved state
  IF v_state_id IS NOT NULL THEN
    SELECT t.id INTO v_teacher_id
    FROM public.teachers t
    WHERE t.state_id = v_state_id
      AND t.is_default = true
    LIMIT 1;

    IF v_teacher_id IS NOT NULL THEN
      NEW.teacher_id = v_teacher_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 5) Create trigger (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_assign_default_mentor' AND tgrelid = 'public.students'::regclass
  ) THEN
    CREATE TRIGGER trg_assign_default_mentor
    BEFORE INSERT ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_default_mentor();
  END IF;
END $$;

-- 6) Seed per-state ILP Mentor (user + teacher) if missing
-- Note: We prefer one mentor per state for clean state-scoped RLS
-- Requires pgcrypto/gen_random_uuid(); available by default in Supabase

-- Create mentor users per state using state_code for a stable unique email
WITH state_rows AS (
  SELECT s.id AS state_id,
         COALESCE(s.state_name, s.name)::text AS state_name,
         COALESCE(s.state_code, lower(replace(COALESCE(s.state_name, s.name)::text, ' ', '-')))::text AS state_code
  FROM public.states s
)
INSERT INTO public.users (id, password_hash, role, full_name, email, state_id, created_at, updated_at)
SELECT gen_random_uuid(), 'handled_by_auth', 'teacher',
       ('ILP Mentor - ' || sr.state_name),
       lower('ilp-mentor+' || sr.state_code || '@internal.app'),
       sr.state_id,
       now(), now()
FROM state_rows sr
WHERE NOT EXISTS (
  SELECT 1 FROM public.teachers t WHERE t.state_id = sr.state_id AND t.is_default = true
)
ON CONFLICT (id) DO NOTHING;

-- Create teacher rows pointing to the newly created or existing mentor users
WITH mentor_candidates AS (
  SELECT u.id AS user_id, u.state_id
  FROM public.users u
  WHERE u.role = 'teacher'
    AND u.email LIKE 'ilp-mentor+%@internal.app'
),
missing_default AS (
  SELECT mc.user_id, mc.state_id
  FROM mentor_candidates mc
  LEFT JOIN public.teachers t
    ON t.user_id = mc.user_id
  WHERE t.id IS NULL
)
INSERT INTO public.teachers (id, user_id, state_id, is_default, is_active, joining_date)
SELECT gen_random_uuid(), md.user_id, md.state_id, true, true, now()
FROM missing_default md
ON CONFLICT (id) DO NOTHING;

-- Ensure exactly one default per state (if multiple legacy defaults exist, keep the newest)
-- Demote older duplicates
WITH ranked AS (
  SELECT id, state_id, is_default,
         row_number() OVER (PARTITION BY state_id ORDER BY COALESCE(joining_date, now()) DESC NULLS LAST) AS rn
  FROM public.teachers
  WHERE is_default = true
)
UPDATE public.teachers t
SET is_default = false
FROM ranked r
WHERE t.id = r.id AND r.rn > 1;

-- 7) Backfill existing students with NULL teacher_id to default mentor
-- First, via class → state
UPDATE public.students s
SET teacher_id = t.id
FROM public.classes c
JOIN public.teachers t ON t.state_id = c.state_id AND t.is_default = true
WHERE s.class_id = c.id
  AND s.teacher_id IS NULL;

-- Fallback: via user → state (for students without class)
UPDATE public.students s
SET teacher_id = t.id
FROM public.users u
JOIN public.teachers t ON t.state_id = u.state_id AND t.is_default = true
WHERE s.user_id = u.id
  AND s.class_id IS NULL
  AND s.teacher_id IS NULL;

-- Done


