-- FIXED DATABASE ANALYSIS
-- This script will analyze the current database structure without assuming column names

-- ===========================================
-- 1. CHECK CURRENT TABLE STRUCTURE
-- ===========================================
SELECT 'CURRENT TABLE STRUCTURE' as section;

-- Check if schools table exists
SELECT 'SCHOOLS TABLE EXISTS' as check_type,
       CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schools') 
            THEN 'YES' ELSE 'NO' END as result;

-- Check if states table exists  
SELECT 'STATES TABLE EXISTS' as check_type,
       CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'states') 
            THEN 'YES' ELSE 'NO' END as result;

-- ===========================================
-- 2. ANALYZE SCHOOLS TABLE STRUCTURE
-- ===========================================
SELECT 'SCHOOLS TABLE COLUMNS' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'schools' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show schools data
SELECT 'SCHOOLS DATA' as info;
SELECT id, name, org_id, created_at FROM public.schools ORDER BY name;

-- ===========================================
-- 3. ANALYZE CLASSES TABLE STRUCTURE
-- ===========================================
SELECT 'CLASSES TABLE COLUMNS' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'classes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show classes data
SELECT 'CLASSES DATA' as info;
SELECT c.id, c.name, c.school_id, s.name as school_name 
FROM public.classes c 
LEFT JOIN public.schools s ON c.school_id = s.id
ORDER BY s.name, c.name;

-- ===========================================
-- 4. ANALYZE TEACHERS TABLE STRUCTURE
-- ===========================================
SELECT 'TEACHERS TABLE COLUMNS' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'teachers' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show teachers data (only existing columns)
SELECT 'TEACHERS DATA' as info;
SELECT t.id, t.user_id, t.school_id, s.name as school_name
FROM public.teachers t
LEFT JOIN public.schools s ON t.school_id = s.id;

-- ===========================================
-- 5. ANALYZE USERS TABLE STRUCTURE
-- ===========================================
SELECT 'USERS TABLE COLUMNS' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show users data (first 10)
SELECT 'USERS DATA (first 10)' as info;
SELECT id, full_name, email, mobile, role, school_id FROM public.users LIMIT 10;

-- ===========================================
-- 6. ANALYZE RLS POLICIES
-- ===========================================
SELECT 'RLS POLICIES ON CLASSES TABLE' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'classes' AND schemaname = 'public';

SELECT 'RLS POLICIES ON STUDENTS TABLE' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'students' AND schemaname = 'public';

SELECT 'RLS POLICIES ON STUDENT_ACTIVITY_PROGRESS TABLE' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'student_activity_progress' AND schemaname = 'public';

-- ===========================================
-- 7. ANALYZE FOREIGN KEY CONSTRAINTS
-- ===========================================
SELECT 'FOREIGN KEY CONSTRAINTS' as info;
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
    AND (tc.table_name IN ('classes', 'teachers', 'users', 'students', 'student_activity_progress'))
ORDER BY tc.table_name, kcu.column_name;

-- ===========================================
-- 8. CHECK FOR DEPENDENCIES ON SCHOOL_ID
-- ===========================================
SELECT 'DEPENDENCIES ON SCHOOL_ID' as info;
SELECT 
    schemaname,
    tablename,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND column_name = 'school_id'
ORDER BY tablename;

-- ===========================================
-- 9. CHECK FOR DEPENDENCIES ON CLASS_ID
-- ===========================================
SELECT 'DEPENDENCIES ON CLASS_ID' as info;
SELECT 
    schemaname,
    tablename,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND column_name = 'class_id'
ORDER BY tablename;

-- ===========================================
-- 10. CHECK STUDENTS TABLE STRUCTURE
-- ===========================================
SELECT 'STUDENTS TABLE COLUMNS' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'students' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show students data
SELECT 'STUDENTS DATA' as info;
SELECT s.id, s.user_id, s.class_id, s.teacher_id, c.name as class_name
FROM public.students s
LEFT JOIN public.classes c ON s.class_id = c.id
LIMIT 10;
