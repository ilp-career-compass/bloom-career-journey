-- Test if the authenticate_student function exists and works
-- Run this in your Supabase SQL Editor

-- Check if function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'authenticate_student';

-- Test the function with Sam's credentials
SELECT 'Testing authentication function:' as info;
SELECT * FROM public.authenticate_student('sam@gmail.com', 'temporary123');

-- Check if student_auth_credentials table exists and has data
SELECT 'Checking auth credentials table:' as info;
SELECT 
    COUNT(*) as total_credentials,
    COUNT(CASE WHEN email = 'sam@gmail.com' THEN 1 END) as sam_credentials
FROM public.student_auth_credentials;

-- Check Sam's user record
SELECT 'Checking Sam\'s user record:' as info;
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.mobile,
    u.role,
    s.id as student_id,
    s.class_id
FROM public.users u
LEFT JOIN public.students s ON u.id = s.user_id
WHERE u.email = 'sam@gmail.com' OR u.full_name = 'sam';
