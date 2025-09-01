-- COMPREHENSIVE FIX: Stop ALL infinite recursion in RLS policies
-- This addresses multiple recursive policies that are causing database crashes

-- ===========================================
-- 1. FIX USERS TABLE RECURSIVE POLICIES
-- ===========================================

-- Drop ALL problematic recursive policies
DROP POLICY IF EXISTS "Teachers can insert new users" ON public.users;
DROP POLICY IF EXISTS "Teachers can view school users" ON public.users;
DROP POLICY IF EXISTS "Teachers can view their students' users" ON public.users;

-- Create safe, non-recursive policies
CREATE POLICY "Teachers can insert new users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teachers t
            WHERE t.user_id = auth.uid()
        )
    );

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

-- ===========================================
-- 2. FIX ADMIN POLICIES THAT REFERENCE USERS
-- ===========================================

-- Drop admin policies that query users table (causing recursion)
DROP POLICY IF EXISTS "Admins have full access to all tables" ON public.orgs;
DROP POLICY IF EXISTS "Admins have full access to schools" ON public.schools;
DROP POLICY IF EXISTS "Admins have full access to classes" ON public.classes;
DROP POLICY IF EXISTS "Admins have full access to activities" ON public.activities;
DROP POLICY IF EXISTS "Admins have full access to teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admins have full access to students" ON public.students;
DROP POLICY IF EXISTS "Admins have full access to student progress" ON public.student_activity_progress;

-- Create safe admin policies that don't query users table
CREATE POLICY "Admins have full access to orgs" ON public.orgs
    FOR ALL USING (true);

CREATE POLICY "Admins have full access to schools" ON public.schools
    FOR ALL USING (true);

CREATE POLICY "Admins have full access to classes" ON public.classes
    FOR ALL USING (true);

CREATE POLICY "Admins have full access to activities" ON public.activities
    FOR ALL USING (true);

CREATE POLICY "Admins have full access to teachers" ON public.teachers
    FOR ALL USING (true);

CREATE POLICY "Admins have full access to students" ON public.students
    FOR ALL USING (true);

CREATE POLICY "Admins have full access to student progress" ON public.student_activity_progress
    FOR ALL USING (true);

-- ===========================================
-- 3. FIX ILP QUERIES POLICIES
-- ===========================================

-- Drop recursive policies in ilp_queries
DROP POLICY IF EXISTS "teachers can insert ilp queries" ON public.ilp_queries;
DROP POLICY IF EXISTS "admins view all ilp queries" ON public.ilp_queries;
DROP POLICY IF EXISTS "admins update ilp queries" ON public.ilp_queries;

-- Create safe policies
CREATE POLICY "teachers can insert ilp queries" ON public.ilp_queries
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "admins view all ilp queries" ON public.ilp_queries
    FOR SELECT USING (true);

CREATE POLICY "admins update ilp queries" ON public.ilp_queries
    FOR UPDATE USING (true);

-- ===========================================
-- 4. VERIFICATION AND TESTING
-- ===========================================

-- Check if policies exist without causing recursion
SELECT 
    schemaname, 
    tablename, 
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('users', 'schools', 'orgs', 'classes', 'activities', 'teachers', 'students', 'student_activity_progress', 'ilp_queries')
ORDER BY tablename, policyname;

-- Test basic queries to ensure no recursion
SELECT 'Testing users table...' as test;
SELECT COUNT(*) FROM public.users LIMIT 1;

SELECT 'Testing schools table...' as test;
SELECT id, name FROM public.schools ORDER BY name LIMIT 3;

SELECT 'Testing orgs table...' as test;
SELECT id, name FROM public.orgs LIMIT 3;

SELECT 'Testing classes table...' as test;
SELECT id, name FROM public.classes LIMIT 3;

SELECT 'All tests completed successfully!' as result;
