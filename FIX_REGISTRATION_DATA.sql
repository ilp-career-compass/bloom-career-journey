-- FIX REGISTRATION DATA ISSUES
-- Run this in Supabase SQL Editor to fix states and classes

-- ===========================================
-- 1. CHECK CURRENT DATA
-- ===========================================

-- Check states
SELECT 'STATES' as table_name, COUNT(*) as count FROM public.states;
SELECT id, state_name, state_code, org_id FROM public.states ORDER BY state_name;

-- Check classes  
SELECT 'CLASSES' as table_name, COUNT(*) as count FROM public.classes;
SELECT id, name, state_id FROM public.classes ORDER BY name;

-- Check organizations
SELECT 'ORGANIZATIONS' as table_name, COUNT(*) as count FROM public.organizations;
SELECT id, name FROM public.organizations ORDER BY name;

-- ===========================================
-- 2. ADD SAMPLE DATA IF MISSING
-- ===========================================

-- Add sample organizations if none exist
INSERT INTO public.organizations (id, name) 
VALUES 
  (gen_random_uuid(), 'ILP Foundation'),
  (gen_random_uuid(), 'State Education Board')
ON CONFLICT (name) DO NOTHING;

-- Add sample states if none exist
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

-- Add sample classes for each state
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

-- ===========================================
-- 3. VERIFY DATA AFTER INSERT
-- ===========================================

-- Check final counts
SELECT 'FINAL STATES' as table_name, COUNT(*) as count FROM public.states;
SELECT 'FINAL CLASSES' as table_name, COUNT(*) as count FROM public.classes;
SELECT 'FINAL ORGANIZATIONS' as table_name, COUNT(*) as count FROM public.organizations;

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
