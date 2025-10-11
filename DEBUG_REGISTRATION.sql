-- DEBUG REGISTRATION DATA
-- Run this to check what's happening with the states

-- ===========================================
-- 1. CHECK IF STATES TABLE EXISTS AND HAS DATA
-- ===========================================
SELECT 'STATES TABLE EXISTS' as check_type, 
       CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'states') 
            THEN 'YES' ELSE 'NO' END as result;

SELECT 'STATES TABLE COUNT' as check_type, COUNT(*) as result FROM public.states;

-- ===========================================
-- 2. SHOW ALL STATES DATA
-- ===========================================
SELECT 'STATES DATA' as info;
SELECT id, state_name, state_code, org_id FROM public.states ORDER BY state_name;

-- ===========================================
-- 3. CHECK CLASSES FOR EACH STATE
-- ===========================================
SELECT 'CLASSES PER STATE' as info;
SELECT 
  s.state_name,
  COUNT(c.id) as class_count
FROM public.states s
LEFT JOIN public.classes c ON s.id = c.state_id
GROUP BY s.id, s.state_name
ORDER BY s.state_name;

-- ===========================================
-- 4. CHECK IF SCHOOLS TABLE STILL EXISTS
-- ===========================================
SELECT 'SCHOOLS TABLE EXISTS' as check_type,
       CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schools') 
            THEN 'YES' ELSE 'NO' END as result;

-- ===========================================
-- 5. TEST THE EXACT QUERY THE APP USES
-- ===========================================
SELECT 'APP QUERY TEST' as info;
SELECT id, state_name, state_code, org_id, organizations(name) 
FROM public.states 
LEFT JOIN public.organizations ON public.states.org_id = public.organizations.id
ORDER BY state_name;
