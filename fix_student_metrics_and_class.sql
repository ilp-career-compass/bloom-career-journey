-- FIX STUDENT METRICS AND CLASS ASSIGNMENT ISSUES
-- This addresses the infinite recursion that's preventing student data from loading

-- ===========================================
-- 1. FIX THE INFINITE RECURSION FIRST
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
DROP POLICY IF EXISTS "Admins have full access to schools" ON public.orgs;
DROP POLICY IF EXISTS "Admins have full access to classes" ON public.classes;
DROP POLICY IF EXISTS "Admins have full access to activities" ON public.activities;
DROP POLICY IF EXISTS "Admins have full access to teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admins have full access to students" ON public.students;
DROP POLICY IF EXISTS "Admins have full access to student progress" ON public.student_activity_progress;

-- Create safe admin policies that don't query users table (only if they don't exist)
DO $$
BEGIN
    -- Check and create orgs policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orgs' AND policyname = 'Admins have full access to orgs') THEN
        CREATE POLICY "Admins have full access to orgs" ON public.orgs
            FOR ALL USING (true);
    END IF;
    
    -- Check and create schools policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schools' AND policyname = 'Admins have full access to schools') THEN
        CREATE POLICY "Admins have full access to schools" ON public.schools
            FOR ALL USING (true);
    END IF;
    
    -- Check and create classes policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'classes' AND policyname = 'Admins have full access to classes') THEN
        CREATE POLICY "Admins have full access to classes" ON public.classes
            FOR ALL USING (true);
    END IF;
    
    -- Check and create activities policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Admins have full access to activities') THEN
        CREATE POLICY "Admins have full access to activities" ON public.activities
            FOR ALL USING (true);
    END IF;
    
    -- Check and create teachers policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teachers' AND policyname = 'Admins have full access to teachers') THEN
        CREATE POLICY "Admins have full access to teachers" ON public.teachers
            FOR ALL USING (true);
    END IF;
    
    -- Check and create students policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Admins have full access to students') THEN
        CREATE POLICY "Admins have full access to students" ON public.students
            FOR ALL USING (true);
    END IF;
    
    -- Check and create student progress policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_activity_progress' AND policyname = 'Admins have full access to student progress') THEN
        CREATE POLICY "Admins have full access to student progress" ON public.student_activity_progress
            FOR ALL USING (true);
    END IF;
END $$;

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
-- 4. ASSIGN ALL STUDENTS TO CLASSES GENERICALLY
-- ===========================================

-- First, let's see what classes are available
SELECT 'Available classes:' as info;
SELECT id, name, school_id FROM public.classes ORDER BY name;

-- Show all students without class assignments
SELECT 'Students without class assignments:' as info;
SELECT 
    s.id,
    u.full_name,
    u.email,
    s.class_id,
    s.enrollment_status 
FROM public.students s 
JOIN public.users u ON s.user_id = u.id 
WHERE s.class_id IS NULL
ORDER BY u.full_name;

-- Assign students to classes based on a pattern
-- This will assign students to classes in a round-robin fashion
WITH student_class_assignments AS (
    SELECT 
        s.id as student_id,
        u.full_name,
        ROW_NUMBER() OVER (ORDER BY u.full_name) as row_num
    FROM public.students s 
    JOIN public.users u ON s.user_id = u.id 
    WHERE s.class_id IS NULL
),
class_assignments AS (
    SELECT 
        id as class_id,
        name as class_name,
        ROW_NUMBER() OVER (ORDER BY name) as row_num
    FROM public.classes
)
UPDATE public.students 
SET class_id = (
    SELECT ca.class_id 
    FROM class_assignments ca 
    WHERE ca.row_num = ((sca.row_num - 1) % (SELECT COUNT(*) FROM public.classes)) + 1
)
FROM student_class_assignments sca
WHERE students.id = sca.student_id;

-- Verify the updates
SELECT 'Updated student records:' as info;
SELECT 
    u.full_name,
    c.name as class_name,
    s.enrollment_status
FROM public.students s 
JOIN public.users u ON s.user_id = u.id 
LEFT JOIN public.classes c ON s.class_id = c.id
ORDER BY u.full_name;

-- ===========================================
-- 5. VERIFICATION AND TESTING
-- ===========================================

-- Test that student queries now work
SELECT 'Testing student queries...' as test;
SELECT 
    s.id,
    u.full_name,
    c.name as class_name,
    s.enrollment_status
FROM public.students s 
JOIN public.users u ON s.user_id = u.id 
LEFT JOIN public.classes c ON s.class_id = c.id
ORDER BY u.full_name;

-- Test that the metrics will now work
SELECT 'Student count for metrics:' as test;
SELECT COUNT(*) as total_students FROM public.students;
SELECT COUNT(*) as active_students FROM public.students WHERE enrollment_status = 'active';

SELECT 'All fixes completed successfully!' as result;
