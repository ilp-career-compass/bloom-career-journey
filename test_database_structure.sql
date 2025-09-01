-- TEST DATABASE STRUCTURE AND DATA RELATIONSHIPS
-- This will help us understand how the tables are connected

-- ===========================================
-- 1. CHECK CURRENT TABLE STRUCTURES
-- ===========================================

-- Show students table structure
SELECT 'Students table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- Show teachers table structure  
SELECT 'Teachers table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'teachers' 
ORDER BY ordinal_position;

-- Show users table structure
SELECT 'Users table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- ===========================================
-- 2. CHECK CURRENT DATA IN TABLES
-- ===========================================

-- Show all users
SELECT 'All users:' as info;
SELECT id, full_name, email, mobile, role FROM public.users ORDER BY full_name;

-- Show all teachers
SELECT 'All teachers:' as info;
SELECT id, user_id, school_id, class_id FROM public.teachers;

-- Show all students
SELECT 'All students:' as info;
SELECT id, user_id, class_id, teacher_id, enrollment_status FROM public.students;

-- Show all classes
SELECT 'All classes:' as info;
SELECT id, name, school_id FROM public.classes ORDER BY name;

-- ===========================================
-- 3. TEST THE JOIN QUERIES THAT SHOULD WORK
-- ===========================================

-- Test the exact query that TeacherDashboard uses
SELECT 'Testing TeacherDashboard query:' as info;
SELECT 
    s.id,
    s.enrollment_status,
    u.full_name as student_name,
    u.email as student_email,
    c.name as class_name
FROM public.students s
JOIN public.users u ON s.user_id = u.id
LEFT JOIN public.classes c ON s.class_id = c.id
ORDER BY u.full_name;

-- Test teacher information query
SELECT 'Testing teacher information query:' as info;
SELECT 
    t.id as teacher_id,
    u.full_name as teacher_name,
    u.email as teacher_email,
    s.name as school_name
FROM public.teachers t
JOIN public.users u ON t.user_id = u.id
LEFT JOIN public.schools s ON t.school_id = s.id;

-- ===========================================
-- 4. CHECK FOR MISSING RELATIONSHIPS
-- ===========================================

-- Find students without class assignments
SELECT 'Students without class assignments:' as info;
SELECT 
    u.full_name,
    u.email,
    s.enrollment_status
FROM public.students s
JOIN public.users u ON s.user_id = u.id
WHERE s.class_id IS NULL;

-- Find students without teacher assignments
SELECT 'Students without teacher assignments:' as info;
SELECT 
    u.full_name,
    u.email,
    s.enrollment_status
FROM public.students s
JOIN public.users u ON s.user_id = u.id
WHERE s.teacher_id IS NULL;

-- ===========================================
-- 5. SUMMARY
-- ===========================================

SELECT 'Database structure test completed!' as result;
SELECT 'If you see student names and class names above, the joins are working.' as note;
SELECT 'If you see errors, the infinite recursion is still blocking queries.' as note;
