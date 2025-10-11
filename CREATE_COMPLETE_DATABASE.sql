-- CREATE_COMPLETE_DATABASE.sql
-- This script will create the entire database structure from scratch

-- ===========================================
-- 1. CREATE ORGANIZATIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 2. CREATE STATES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  state_code TEXT UNIQUE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 3. CREATE CLASSES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state_id uuid REFERENCES public.states(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (name, state_id)
);

-- ===========================================
-- 4. ADD STATE_ID TO USERS TABLE
-- ===========================================
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS state_id uuid REFERENCES public.states(id) ON DELETE SET NULL;

-- ===========================================
-- 5. ADD STATE_ID TO TEACHERS TABLE
-- ===========================================
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS state_id uuid REFERENCES public.states(id) ON DELETE SET NULL;

-- ===========================================
-- 6. INSERT SAMPLE DATA
-- ===========================================
-- Insert ILP Foundation organization
INSERT INTO public.organizations (name)
VALUES ('ILP Foundation')
ON CONFLICT (name) DO NOTHING;

-- Get ILP Foundation ID and insert states
DO $$
DECLARE
  ilp_org_id uuid;
BEGIN
  SELECT id INTO ilp_org_id FROM public.organizations WHERE name = 'ILP Foundation';

  -- Insert states
  INSERT INTO public.states (name, state_code, org_id)
  VALUES
    ('ILP-Tamil Nadu', 'ILP-TN', ilp_org_id),
    ('ILP-Telangana', 'ILP-TG', ilp_org_id),
    ('ILP-Karnataka', 'ILP-KA', ilp_org_id),
    ('ILP-Maharashtra', 'ILP-MH', ilp_org_id),
    ('ILP-Andhra Pradesh', 'ILP-AP', ilp_org_id),
    ('ILP-Bihar', 'ILP-BR', ilp_org_id),
    ('ILP-Jharkhand', 'ILP-JH', ilp_org_id),
    ('ILP-Odisha', 'ILP-OR', ilp_org_id)
  ON CONFLICT (name) DO NOTHING;

  -- Insert classes for each state
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

-- ===========================================
-- 7. ENABLE RLS AND CREATE POLICIES
-- ===========================================
-- RLS for organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.organizations;
CREATE POLICY "Enable read access for all users" ON public.organizations FOR SELECT USING (true);

-- RLS for states
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.states;
CREATE POLICY "Enable read access for all users" ON public.states FOR SELECT USING (true);

-- RLS for classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.classes;
CREATE POLICY "Enable read access for all users" ON public.classes FOR SELECT USING (true);

-- ===========================================
-- 8. VERIFY THE SETUP
-- ===========================================
SELECT 'ORGANIZATIONS' as table_name;
SELECT * FROM public.organizations;

SELECT 'STATES' as table_name;
SELECT id, name, state_code, org_id FROM public.states ORDER BY name;

SELECT 'CLASSES COUNT' as info;
SELECT COUNT(*) as total_classes FROM public.classes;

SELECT 'CLASSES PER STATE' as info;
SELECT 
  s.name as state_name,
  COUNT(c.id) as class_count,
  STRING_AGG(c.name, ', ' ORDER BY c.name) as classes
FROM public.states s
LEFT JOIN public.classes c ON s.id = c.state_id
GROUP BY s.id, s.name
ORDER BY s.name;

-- ===========================================
-- 9. TEST THE EXACT QUERY THE APP USES
-- ===========================================
SELECT 'APP QUERY TEST - States with Organization' as info;
SELECT 
  s.id, 
  s.name, 
  s.state_code, 
  s.org_id, 
  o.name as org_name
FROM public.states s 
LEFT JOIN public.organizations o ON s.org_id = o.id
ORDER BY s.name;

SELECT 'APP QUERY TEST - Classes for Tamil Nadu' as info;
SELECT c.id, c.name 
FROM public.classes c 
WHERE c.state_id = (SELECT id FROM public.states WHERE name = 'ILP-Tamil Nadu' LIMIT 1)
ORDER BY c.name;
