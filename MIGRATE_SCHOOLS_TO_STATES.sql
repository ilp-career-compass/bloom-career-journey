-- MIGRATE SCHOOLS TO STATES TABLE
-- This script migrates all data from the schools table to the states table

-- ===========================================
-- 1. CREATE STATES TABLE IF NOT EXISTS
-- ===========================================
CREATE TABLE IF NOT EXISTS public.states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state_name TEXT NOT NULL,
  state_code TEXT,
  org_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 2. MIGRATE ALL SCHOOLS DATA TO STATES
-- ===========================================
INSERT INTO public.states (id, state_name, state_code, org_id)
SELECT 
  s.id,                    -- Keep the same ID
  s.name as state_name,    -- School name becomes state name
  CASE 
    WHEN s.name = 'ILP-Karnataka' THEN 'ILP-KA'
    WHEN s.name = 'ILP-Andhra Pradesh' THEN 'ILP-AP'
    WHEN s.name = 'ILP-Jharkhand' THEN 'ILP-JH'
    WHEN s.name = 'ILP-Bihar' THEN 'ILP-BR'
    WHEN s.name = 'ILP-Odisha' THEN 'ILP-OR'
    WHEN s.name = 'ILP-Tamil Nadu' THEN 'ILP-TN'
    WHEN s.name = 'ILP-Telangana' THEN 'ILP-TG'
    ELSE 'ILP-' || SUBSTRING(s.name FROM 5)  -- Extract state name after ILP-
  END as state_code,
  s.org_id                 -- Keep the same organization ID
FROM public.schools s
WHERE NOT EXISTS (
  SELECT 1 FROM public.states st WHERE st.id = s.id
);

-- ===========================================
-- 3. UPDATE CLASSES TABLE TO USE STATE_ID
-- ===========================================
-- Check if classes table has school_id column and update it
DO $$
BEGIN
  -- Add state_id column if it doesn't exist
  ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS state_id UUID;
  
  -- Update state_id from school_id if school_id exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'classes' 
    AND column_name = 'school_id'
  ) THEN
    -- Update state_id from school_id
    UPDATE public.classes 
    SET state_id = school_id 
    WHERE state_id IS NULL AND school_id IS NOT NULL;
    
    -- Drop school_id column
    ALTER TABLE public.classes DROP COLUMN IF EXISTS school_id;
    
    RAISE NOTICE 'Updated classes table from school_id to state_id';
  END IF;
END $$;

-- ===========================================
-- 4. UPDATE OTHER TABLES THAT REFERENCE SCHOOLS
-- ===========================================

-- Update users table if it has school_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'school_id'
  ) THEN
    -- Add state_id column if it doesn't exist
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS state_id UUID;
    
    -- Update state_id from school_id
    UPDATE public.users 
    SET state_id = school_id 
    WHERE state_id IS NULL AND school_id IS NOT NULL;
    
    -- Drop school_id column
    ALTER TABLE public.users DROP COLUMN IF EXISTS school_id;
    
    RAISE NOTICE 'Updated users table from school_id to state_id';
  END IF;
END $$;

-- Update teachers table if it has school_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'teachers' 
    AND column_name = 'school_id'
  ) THEN
    -- Add state_id column if it doesn't exist
    ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS state_id UUID;
    
    -- Update state_id from school_id
    UPDATE public.teachers 
    SET state_id = school_id 
    WHERE state_id IS NULL AND school_id IS NOT NULL;
    
    -- Drop school_id column
    ALTER TABLE public.teachers DROP COLUMN IF EXISTS school_id;
    
    RAISE NOTICE 'Updated teachers table from school_id to state_id';
  END IF;
END $$;

-- ===========================================
-- 5. CREATE SAMPLE CLASSES FOR EACH STATE
-- ===========================================
INSERT INTO public.classes (id, name, state_id)
SELECT 
  gen_random_uuid(),
  'Class 8',
  s.id
FROM public.states s
WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE name = 'Class 8' AND state_id = s.id);

INSERT INTO public.classes (id, name, state_id)
SELECT 
  gen_random_uuid(),
  'Class 9',
  s.id
FROM public.states s
WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE name = 'Class 9' AND state_id = s.id);

INSERT INTO public.classes (id, name, state_id)
SELECT 
  gen_random_uuid(),
  'Class 10',
  s.id
FROM public.states s
WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE name = 'Class 10' AND state_id = s.id);

INSERT INTO public.classes (id, name, state_id)
SELECT 
  gen_random_uuid(),
  'Class 11',
  s.id
FROM public.states s
WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE name = 'Class 11' AND state_id = s.id);

INSERT INTO public.classes (id, name, state_id)
SELECT 
  gen_random_uuid(),
  'Class 12',
  s.id
FROM public.states s
WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE name = 'Class 12' AND state_id = s.id);

-- ===========================================
-- 6. VERIFY MIGRATION RESULTS
-- ===========================================

-- Check states table
SELECT 'STATES TABLE' as table_name, COUNT(*) as count FROM public.states;
SELECT id, state_name, state_code, org_id FROM public.states ORDER BY state_name;

-- Check classes table
SELECT 'CLASSES TABLE' as table_name, COUNT(*) as count FROM public.classes;
SELECT id, name, state_id FROM public.classes ORDER BY name;

-- Show states with their classes
SELECT 
  s.state_name,
  s.state_code,
  o.name as org_name,
  COUNT(c.id) as class_count
FROM public.states s
LEFT JOIN public.organizations o ON s.org_id = o.id
LEFT JOIN public.classes c ON s.id = c.state_id
GROUP BY s.id, s.state_name, s.state_code, o.name
ORDER BY s.state_name;

-- ===========================================
-- 7. DROP SCHOOLS TABLE (OPTIONAL - UNCOMMENT TO REMOVE)
-- ===========================================

-- Uncomment the following lines to remove the schools table after migration
-- DROP TABLE IF EXISTS public.schools;
-- RAISE NOTICE 'Schools table dropped after successful migration';
