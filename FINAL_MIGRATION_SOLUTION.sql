-- FINAL MIGRATION SOLUTION
-- This script handles the complete migration from schools to states with all dependencies

-- ===========================================
-- STEP 1: BACKUP AND PREPARATION
-- ===========================================
-- Create a backup of current data
CREATE TABLE IF NOT EXISTS public.schools_backup AS 
SELECT * FROM public.schools;

CREATE TABLE IF NOT EXISTS public.classes_backup AS 
SELECT * FROM public.classes;

CREATE TABLE IF NOT EXISTS public.teachers_backup AS 
SELECT * FROM public.teachers;

CREATE TABLE IF NOT EXISTS public.users_backup AS 
SELECT * FROM public.users;

SELECT 'Backup tables created' as status;

-- ===========================================
-- STEP 2: RENAME SCHOOLS TO STATES
-- ===========================================
-- Rename the schools table to states
ALTER TABLE public.schools RENAME TO states;

-- Rename columns in states table
ALTER TABLE public.states RENAME COLUMN name TO state_name;
ALTER TABLE public.states RENAME COLUMN school_code TO state_code;

SELECT 'Schools table renamed to states with column updates' as status;

-- ===========================================
-- STEP 3: UPDATE TEACHERS TABLE FIRST
-- ===========================================
-- Add state_id column to teachers
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS state_id uuid;

-- Copy data from school_id to state_id
UPDATE public.teachers 
SET state_id = school_id 
WHERE school_id IS NOT NULL AND state_id IS NULL;

-- Add foreign key constraint for state_id
ALTER TABLE public.teachers ADD CONSTRAINT teachers_state_id_fkey 
FOREIGN KEY (state_id) REFERENCES public.states(id) ON DELETE SET NULL;

-- Drop old school_id column and constraint
ALTER TABLE public.teachers DROP CONSTRAINT IF EXISTS teachers_school_id_fkey;
ALTER TABLE public.teachers DROP COLUMN IF EXISTS school_id;

SELECT 'Teachers table updated: school_id -> state_id' as status;

-- ===========================================
-- STEP 4: UPDATE CLASSES TABLE
-- ===========================================
-- Add state_id column to classes
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS state_id uuid;

-- Copy data from school_id to state_id
UPDATE public.classes 
SET state_id = school_id 
WHERE school_id IS NOT NULL AND state_id IS NULL;

-- Add foreign key constraint for state_id
ALTER TABLE public.classes ADD CONSTRAINT classes_state_id_fkey 
FOREIGN KEY (state_id) REFERENCES public.states(id) ON DELETE CASCADE;

-- Make state_id NOT NULL
ALTER TABLE public.classes ALTER COLUMN state_id SET NOT NULL;

-- Drop old school_id column and constraint
ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_school_id_fkey;
ALTER TABLE public.classes DROP COLUMN IF EXISTS school_id;

SELECT 'Classes table updated: school_id -> state_id' as status;

-- ===========================================
-- STEP 5: UPDATE USERS TABLE
-- ===========================================
-- Add state_id column to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS state_id uuid;

-- Copy data from school_id to state_id
UPDATE public.users 
SET state_id = school_id 
WHERE school_id IS NOT NULL AND state_id IS NULL;

-- Add foreign key constraint for state_id
ALTER TABLE public.users ADD CONSTRAINT users_state_id_fkey 
FOREIGN KEY (state_id) REFERENCES public.states(id) ON DELETE SET NULL;

-- Drop old school_id column and constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_school_id_fkey;
ALTER TABLE public.users DROP COLUMN IF EXISTS school_id;

SELECT 'Users table updated: school_id -> state_id' as status;

-- ===========================================
-- STEP 6: UPDATE RLS POLICIES
-- ===========================================
-- Drop old policies that reference school_id
DROP POLICY IF EXISTS "Teachers can view students from their school" ON public.students;
DROP POLICY IF EXISTS "Teachers can view student progress from their school" ON public.student_activity_progress;
DROP POLICY IF EXISTS "Teachers can insert students in their school" ON public.students;

-- Create new policies that reference state_id
CREATE POLICY "Teachers can view students from their state" ON public.students
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.classes c
    JOIN public.teachers t ON c.state_id = t.state_id
    WHERE c.id = public.students.class_id
    AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Teachers can view student progress from their state" ON public.student_activity_progress
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.classes c ON s.class_id = c.id
    JOIN public.teachers t ON c.state_id = t.state_id
    WHERE s.id = public.student_activity_progress.student_id
    AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Teachers can insert students in their state" ON public.students
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.classes c
    JOIN public.teachers t ON c.state_id = t.state_id
    WHERE c.id = public.students.class_id
    AND t.user_id = auth.uid()
  )
);

SELECT 'RLS policies updated to use state_id' as status;

-- ===========================================
-- STEP 7: ADD MISSING CLASSES
-- ===========================================
-- Add classes 8, 9, 10, 11, 12 for each state if they don't exist
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
-- STEP 8: UPDATE RLS POLICIES FOR STATES AND CLASSES
-- ===========================================
-- RLS for states
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users on states" ON public.states;
CREATE POLICY "Enable read access for all users on states" ON public.states FOR SELECT USING (true);

-- RLS for classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users on classes" ON public.classes;
CREATE POLICY "Enable read access for all users on classes" ON public.classes FOR SELECT USING (true);

SELECT 'RLS policies for states and classes applied' as status;

-- ===========================================
-- STEP 9: VERIFICATION
-- ===========================================
SELECT '=== MIGRATION VERIFICATION ===' as section;

-- Check states table
SELECT 'STATES TABLE' as info;
SELECT id, state_name, state_code, org_id FROM public.states ORDER BY state_name;

-- Check classes per state
SELECT 'CLASSES PER STATE' as info;
SELECT 
  s.state_name,
  COUNT(c.id) as class_count,
  STRING_AGG(c.name, ', ' ORDER BY c.name) as classes
FROM public.states s
LEFT JOIN public.classes c ON s.id = c.state_id
GROUP BY s.id, s.state_name
ORDER BY s.state_name;

-- Check teachers with state_id
SELECT 'TEACHERS WITH STATE_ID' as info;
SELECT COUNT(*) as teacher_count FROM public.teachers WHERE state_id IS NOT NULL;

-- Check users with state_id
SELECT 'USERS WITH STATE_ID' as info;
SELECT COUNT(*) as user_count FROM public.users WHERE state_id IS NOT NULL;

-- ===========================================
-- STEP 10: TEST APP QUERIES
-- ===========================================
SELECT 'APP QUERY TEST - States with Organization' as info;
SELECT 
  s.id, 
  s.state_name, 
  s.state_code, 
  s.org_id, 
  o.name as org_name
FROM public.states s 
LEFT JOIN public.orgs o ON s.org_id = o.id
ORDER BY s.state_name;

SELECT 'APP QUERY TEST - Classes for Tamil Nadu' as info;
SELECT c.id, c.name 
FROM public.classes c 
WHERE c.state_id = (SELECT id FROM public.states WHERE state_name = 'ILP-Tamil Nadu' LIMIT 1)
ORDER BY c.name;

SELECT '=== MIGRATION COMPLETE ===' as final_status;
