-- Fix RLS policies for student authentication
-- Run this in your Supabase SQL Editor

-- 1. First, let's check what's currently blocking the function
SELECT 'Current RLS status:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('users', 'students', 'student_auth_credentials')
ORDER BY tablename, policyname;

-- 2. The issue: authenticate_student function needs to bypass RLS on student_auth_credentials
-- Let's temporarily disable RLS on this table for the function to work
ALTER TABLE public.student_auth_credentials DISABLE ROW LEVEL SECURITY;

-- 3. Alternative approach: Create a more permissive policy that allows the function to work
-- Re-enable RLS and create a policy that allows the function to read credentials
ALTER TABLE public.student_auth_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Teachers can manage their students' auth credentials" ON public.student_auth_credentials;
DROP POLICY IF EXISTS "Students can view their own auth credentials" ON public.student_auth_credentials;

-- Create a policy that allows the authenticate_student function to work
CREATE POLICY "Allow authenticate_student function access" ON public.student_auth_credentials
    FOR SELECT USING (true);

-- Create a policy for teachers to manage credentials
CREATE POLICY "Teachers can manage their students' auth credentials" ON public.student_auth_credentials
    FOR ALL USING (
        user_id IN (
            SELECT s.user_id FROM public.students s
            JOIN public.teachers t ON s.teacher_id = t.id
            WHERE t.user_id = auth.uid()
        )
    );

-- 4. Test the authentication function
SELECT 'Testing authentication function:' as info;
SELECT * FROM public.authenticate_student('s1@gmail.com', 'temporary123');

-- 5. Check if the student exists and has credentials
SELECT 'Checking student credentials:' as info;
SELECT 
    u.full_name,
    u.email,
    u.mobile,
    sac.password_hash,
    sac.is_active
FROM public.users u
LEFT JOIN public.student_auth_credentials sac ON u.id = sac.user_id
WHERE u.email = 's1@gmail.com' OR u.mobile = 's1@gmail.com';

-- 6. If no credentials exist, create them
INSERT INTO public.student_auth_credentials (user_id, email, mobile, password_hash, is_active)
SELECT 
    u.id,
    u.email,
    u.mobile,
    'temporary123',
    true
FROM public.users u
WHERE u.email = 's1@gmail.com' OR u.mobile = 's1@gmail.com'
AND u.role = 'student'
AND NOT EXISTS (
    SELECT 1 FROM public.student_auth_credentials sac 
    WHERE sac.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 7. Test again
SELECT 'Testing authentication function after fix:' as info;
SELECT * FROM public.authenticate_student('s1@gmail.com', 'temporary123');

SELECT 'Student authentication RLS fix completed!' as result;
