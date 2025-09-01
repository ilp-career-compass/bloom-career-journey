-- EMERGENCY FIX: Infinite Recursion in RLS Policies
-- Run this in your Supabase SQL Editor to fix the database errors

-- The issue: "Teachers can insert new users" policy queries users table from within users table policy
-- This creates infinite recursion when any query tries to access the users table

-- 1. Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Teachers can insert new users" ON public.users;

-- 2. Create a safer policy that doesn't query the users table recursively
-- Instead, check if the current user is in the teachers table directly
CREATE POLICY "Teachers can insert new users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teachers t
            WHERE t.user_id = auth.uid()
        )
    );

-- 3. Fix the "Teachers can view school users" policy to avoid recursion
DROP POLICY IF EXISTS "Teachers can view school users" ON public.users;

CREATE POLICY "Teachers can view school users" ON public.users
    FOR SELECT USING (
        -- Allow users to see their own profile (no recursion)
        auth.uid()::text = id::text
        OR
        -- Allow teachers to see users in their school (check teachers table directly)
        EXISTS (
            SELECT 1 FROM public.teachers t
            WHERE t.user_id = auth.uid()
            AND t.school_id = users.school_id
        )
    );

-- 4. Fix the "Teachers can view their students' users" policy
DROP POLICY IF EXISTS "Teachers can view their students' users" ON public.users;

CREATE POLICY "Teachers can view their students' users" ON public.users
    FOR SELECT USING (
        -- Allow users to see their own profile (no recursion)
        auth.uid()::text = id::text
        OR
        -- Allow teachers to see their students' user profiles
        id IN (
            SELECT s.user_id FROM public.students s
            JOIN public.teachers t ON s.teacher_id = t.id
            WHERE t.user_id = auth.uid()
        )
    );

-- Verification: Check if policies exist without causing recursion
SELECT 
    schemaname, 
    tablename, 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('users', 'schools') 
ORDER BY tablename, policyname;

-- Test schools query to ensure it works after fixing recursion
SELECT id, name, school_code FROM public.schools ORDER BY name LIMIT 5;
