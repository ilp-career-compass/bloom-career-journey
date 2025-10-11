-- RENAME_SCHOOLS_TO_STATES.sql
-- This script will rename your existing schools table to states and update columns

-- ===========================================
-- 1. RENAME THE SCHOOLS TABLE TO STATES
-- ===========================================
ALTER TABLE public.schools RENAME TO states;
SELECT 'Table public.schools renamed to public.states' as status;

-- ===========================================
-- 2. RENAME COLUMNS IN THE NEW STATES TABLE
-- ===========================================
ALTER TABLE public.states RENAME COLUMN name TO state_name;
ALTER TABLE public.states RENAME COLUMN school_code TO state_code;
SELECT 'Columns "name" and "school_code" renamed in public.states' as status;

-- ===========================================
-- 3. UPDATE FOREIGN KEY REFERENCES
-- ===========================================

-- CLASSES TABLE: Update school_id to state_id
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS state_id uuid;

-- Copy data from old school_id to new state_id
UPDATE public.classes
SET state_id = school_id
WHERE school_id IS NOT NULL AND state_id IS NULL;

-- Drop old foreign key constraint if it exists
ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_school_id_fkey;

-- Drop the old school_id column
ALTER TABLE public.classes DROP COLUMN IF EXISTS school_id;

-- Add new foreign key constraint
ALTER TABLE public.classes ADD CONSTRAINT classes_state_id_fkey 
FOREIGN KEY (state_id) REFERENCES public.states(id) ON DELETE CASCADE;
ALTER TABLE public.classes ALTER COLUMN state_id SET NOT NULL;
SELECT 'Classes table updated: school_id replaced with state_id' as status;

-- USERS TABLE: Update school_id to state_id
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS state_id uuid;

-- Copy data from old school_id to new state_id
UPDATE public.users
SET state_id = school_id
WHERE school_id IS NOT NULL AND state_id IS NULL;

-- Drop old foreign key constraint if it exists
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_school_id_fkey;

-- Drop the old school_id column
ALTER TABLE public.users DROP COLUMN IF EXISTS school_id;

-- Add new foreign key constraint
ALTER TABLE public.users ADD CONSTRAINT users_state_id_fkey 
FOREIGN KEY (state_id) REFERENCES public.states(id) ON DELETE SET NULL;
SELECT 'Users table updated: school_id replaced with state_id' as status;

-- TEACHERS TABLE: Update school_id to state_id
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS state_id uuid;

-- Copy data from old school_id to new state_id
UPDATE public.teachers
SET state_id = school_id
WHERE school_id IS NOT NULL AND state_id IS NULL;

-- Drop old foreign key constraint if it exists
ALTER TABLE public.teachers DROP CONSTRAINT IF EXISTS teachers_school_id_fkey;

-- Drop the old school_id column
ALTER TABLE public.teachers DROP COLUMN IF EXISTS school_id;

-- Add new foreign key constraint
ALTER TABLE public.teachers ADD CONSTRAINT teachers_state_id_fkey 
FOREIGN KEY (state_id) REFERENCES public.states(id) ON DELETE SET NULL;
SELECT 'Teachers table updated: school_id replaced with state_id' as status;

-- ===========================================
-- 4. ADD MISSING CLASSES FOR EACH STATE
-- ===========================================
DO $$
BEGIN
  INSERT INTO public.classes (name, state_id)
  SELECT class_name, s.id
  FROM (
    SELECT 'Class 8' as class_name UNION ALL
    SELECT 'Class 9' UNION ALL
    SELECT 'Class 10' UNION ALL
    SELECT 'Class 11' UNION ALL
    SELECT 'Class 12'
  ) AS classes_to_insert
  CROSS JOIN public.states s
  WHERE NOT EXISTS (
    SELECT 1 FROM public.classes c WHERE c.name = classes_to_insert.class_name AND c.state_id = s.id
  );
END $$;
SELECT 'Missing classes (8-12) added for each state' as status;

-- ===========================================
-- 5. RLS POLICIES FOR STATES AND CLASSES
-- ===========================================

-- RLS for states
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users on states" ON public.states;
CREATE POLICY "Enable read access for all users on states" ON public.states FOR SELECT USING (true);
SELECT 'RLS policy for public.states applied' as status;

-- RLS for classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users on classes" ON public.classes;
CREATE POLICY "Enable read access for all users on classes" ON public.classes FOR SELECT USING (true);
SELECT 'RLS policy for public.classes applied' as status;

-- ===========================================
-- 6. VERIFY THE MIGRATION
-- ===========================================
SELECT '--- VERIFICATION ---' as section;
SELECT 'States table content:' as info;
SELECT id, state_name, state_code, org_id FROM public.states;

SELECT 'Classes count per state:' as info;
SELECT 
  s.state_name,
  COUNT(c.id) as class_count,
  STRING_AGG(c.name, ', ' ORDER BY c.name) as classes
FROM public.states s
LEFT JOIN public.classes c ON s.id = c.state_id
GROUP BY s.id, s.state_name
ORDER BY s.state_name;

-- ===========================================
-- 7. TEST THE EXACT QUERY THE APP USES
-- ===========================================
SELECT 'APP QUERY TEST - States with Organization' as info;
SELECT 
  s.id, 
  s.state_name, 
  s.state_code, 
  s.org_id, 
  o.name as org_name
FROM public.states s 
LEFT JOIN public.organizations o ON s.org_id = o.id
ORDER BY s.state_name;

SELECT 'APP QUERY TEST - Classes for Tamil Nadu' as info;
SELECT c.id, c.name 
FROM public.classes c 
WHERE c.state_id = (SELECT id FROM public.states WHERE state_name = 'ILP-Tamil Nadu' LIMIT 1)
ORDER BY c.name;
