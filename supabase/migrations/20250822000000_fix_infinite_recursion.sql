-- Fix infinite recursion in RLS policies
-- The issue is in the "Teachers can insert new users" policy which queries users table from within a users table policy

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Teachers can insert new users" ON public.users;

-- Create a safer policy that doesn't query the users table recursively
-- Instead, check if the current user is in the teachers table directly
CREATE POLICY "Teachers can insert new users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teachers t
            WHERE t.user_id = auth.uid()
        )
    );

-- Also fix any other potentially recursive policies
-- Drop and recreate the "Teachers can view school users" policy to be safer
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

-- Drop and recreate the "Teachers can view their students' users" policy
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
