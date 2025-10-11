-- CHECK CURRENT DATABASE STATE
-- Run this first to see what tables and data exist

-- ===========================================
-- 1. CHECK EXISTING TABLES
-- ===========================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('schools', 'states', 'classes', 'organizations', 'users', 'teachers')
ORDER BY table_name;

-- ===========================================
-- 2. CHECK SCHOOLS TABLE DATA
-- ===========================================
SELECT 'SCHOOLS TABLE DATA' as info;
SELECT id, name, org_id FROM public.schools ORDER BY name;

-- ===========================================
-- 3. CHECK IF STATES TABLE EXISTS AND HAS DATA
-- ===========================================
SELECT 'STATES TABLE CHECK' as info;
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'states')
    THEN 'EXISTS'
    ELSE 'DOES NOT EXIST'
  END as states_table_status;

-- If states table exists, show its data
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'states') THEN
    RAISE NOTICE 'States table exists, showing data:';
  ELSE
    RAISE NOTICE 'States table does not exist';
  END IF;
END $$;

-- ===========================================
-- 4. CHECK CLASSES TABLE STRUCTURE
-- ===========================================
SELECT 'CLASSES TABLE COLUMNS' as info;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'classes'
ORDER BY ordinal_position;

-- ===========================================
-- 5. CHECK ORGANIZATIONS TABLE
-- ===========================================
SELECT 'ORGANIZATIONS TABLE' as info;
SELECT id, name FROM public.organizations ORDER BY name;

-- ===========================================
-- 6. CHECK FOREIGN KEY RELATIONSHIPS
-- ===========================================
SELECT 'FOREIGN KEY RELATIONSHIPS' as info;
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('classes', 'states', 'users', 'teachers')
ORDER BY tc.table_name, kcu.column_name;
