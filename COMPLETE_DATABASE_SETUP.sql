-- COMPLETE DATABASE SETUP FOR STATES AND CLASSES
-- Run this in Supabase SQL Editor to fix the 404 error

-- ===========================================
-- 1. CHECK IF SCHOOLS TABLE EXISTS
-- ===========================================
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'schools'
) as schools_exists;

SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'states'
) as states_exists;

-- ===========================================
-- 2. CREATE ORGANIZATIONS TABLE IF NOT EXISTS
-- ===========================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 3. CREATE STATES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state_name TEXT NOT NULL,
  state_code TEXT,
  org_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 4. MIGRATE DATA FROM SCHOOLS TO STATES (IF SCHOOLS EXISTS)
-- ===========================================
DO $$
BEGIN
  -- Check if schools table exists and has data
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schools') THEN
    -- Create default organization if none exists
    INSERT INTO public.organizations (id, name) 
    VALUES (gen_random_uuid(), 'ILP Foundation')
    ON CONFLICT (name) DO NOTHING;
    
    -- Migrate schools to states
    INSERT INTO public.states (id, state_name, state_code, org_id)
    SELECT 
      s.id,
      COALESCE(s.name, 'Unknown State') as state_name,
      COALESCE(s.school_code, '') as state_code,
      (SELECT id FROM public.organizations WHERE name = 'ILP Foundation' LIMIT 1) as org_id
    FROM public.schools s
    WHERE NOT EXISTS (SELECT 1 FROM public.states WHERE id = s.id);
    
    RAISE NOTICE 'Migrated data from schools to states';
  ELSE
    RAISE NOTICE 'Schools table does not exist, creating sample data';
  END IF;
END $$;

-- ===========================================
-- 5. CREATE SAMPLE DATA IF NO STATES EXIST
-- ===========================================
INSERT INTO public.organizations (id, name) 
VALUES 
  (gen_random_uuid(), 'ILP Foundation'),
  (gen_random_uuid(), 'State Education Board')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.states (id, state_name, state_code, org_id)
SELECT 
  gen_random_uuid(),
  'ILP-Tamil Nadu',
  'ILP-TN',
  (SELECT id FROM public.organizations WHERE name = 'ILP Foundation' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.states WHERE state_name = 'ILP-Tamil Nadu');

INSERT INTO public.states (id, state_name, state_code, org_id)
SELECT 
  gen_random_uuid(),
  'ILP-Telangana', 
  'ILP-TG',
  (SELECT id FROM public.organizations WHERE name = 'ILP Foundation' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.states WHERE state_name = 'ILP-Telangana');

INSERT INTO public.states (id, state_name, state_code, org_id)
SELECT 
  gen_random_uuid(),
  'ILP-Karnataka',
  'ILP-KA', 
  (SELECT id FROM public.organizations WHERE name = 'ILP Foundation' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.states WHERE state_name = 'ILP-Karnataka');

INSERT INTO public.states (id, state_name, state_code, org_id)
SELECT 
  gen_random_uuid(),
  'ILP-Maharashtra',
  'ILP-MH', 
  (SELECT id FROM public.organizations WHERE name = 'ILP Foundation' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.states WHERE state_name = 'ILP-Maharashtra');

-- ===========================================
-- 6. UPDATE CLASSES TABLE TO USE STATE_ID
-- ===========================================
-- Check if classes table has school_id column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'classes' 
    AND column_name = 'school_id'
  ) THEN
    -- Add state_id column if it doesn't exist
    ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS state_id UUID;
    
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
-- 7. CREATE SAMPLE CLASSES FOR EACH STATE
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
-- 8. VERIFY FINAL SETUP
-- ===========================================
SELECT 'FINAL VERIFICATION' as step;

-- Check organizations
SELECT 'ORGANIZATIONS' as table_name, COUNT(*) as count FROM public.organizations;
SELECT id, name FROM public.organizations ORDER BY name;

-- Check states
SELECT 'STATES' as table_name, COUNT(*) as count FROM public.states;
SELECT id, state_name, state_code, org_id FROM public.states ORDER BY state_name;

-- Check classes
SELECT 'CLASSES' as table_name, COUNT(*) as count FROM public.classes;
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
