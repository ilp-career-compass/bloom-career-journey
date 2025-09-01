-- FIX FOR ASSESSMENT RLS POLICIES
-- This addresses the 401 Unauthorized errors when students try to submit assessments

-- ===========================================
-- 1. DROP EXISTING PROBLEMATIC POLICIES
-- ===========================================

-- Drop the existing policies that depend on auth.uid()
DROP POLICY IF EXISTS "Students can view their own assessment responses" ON assessment_responses;
DROP POLICY IF EXISTS "Students can insert their own assessment responses" ON assessment_responses;
DROP POLICY IF EXISTS "Students can update their own assessment responses" ON assessment_responses;

-- ===========================================
-- 2. CREATE NEW RLS POLICIES FOR CUSTOM AUTH
-- ===========================================

-- Policy for students to view their own assessment responses
CREATE POLICY "Students can view their own assessment responses" ON assessment_responses
    FOR SELECT USING (
        student_id IN (
            SELECT s.id FROM students s 
            JOIN users u ON s.user_id = u.id
            WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email'
            OR u.mobile = current_setting('request.jwt.claims', true)::json->>'mobile'
        )
    );

-- Policy for students to insert their own assessment responses
CREATE POLICY "Students can insert their own assessment responses" ON assessment_responses
    FOR INSERT WITH CHECK (
        student_id IN (
            SELECT s.id FROM students s 
            JOIN users u ON s.user_id = u.id
            WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email'
            OR u.mobile = current_setting('request.jwt.claims', true)::json->>'mobile'
        )
    );

-- Policy for students to update their own assessment responses
CREATE POLICY "Students can update their own assessment responses" ON assessment_responses
    FOR UPDATE USING (
        student_id IN (
            SELECT s.id FROM students s 
            JOIN users u ON s.user_id = u.id
            WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email'
            OR u.mobile = current_setting('request.jwt.claims', true)::json->>'mobile'
        )
    );

-- ===========================================
-- 3. ALTERNATIVE APPROACH: DISABLE RLS TEMPORARILY
-- ===========================================

-- If the above policies don't work, we can temporarily disable RLS
-- Uncomment the line below if you want to disable RLS temporarily:
-- ALTER TABLE assessment_responses DISABLE ROW LEVEL SECURITY;

-- ===========================================
-- 4. VERIFICATION
-- ===========================================

-- Check current policies
SELECT 'Current assessment_responses policies:' as info;
SELECT 
    schemaname, 
    tablename, 
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'assessment_responses'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 'RLS status for assessment_responses:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'assessment_responses';

SELECT 'Assessment RLS fix completed!' as result;
