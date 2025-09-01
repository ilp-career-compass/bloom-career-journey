-- COMPREHENSIVE FIX FOR STUDENT AUTHENTICATION (FINAL VERSION)
-- This addresses the "User not allowed" error when teachers try to create students

-- ===========================================
-- 1. CREATE STUDENT AUTH CREDENTIALS TABLE
-- ===========================================

-- Create a table to store student authentication credentials
CREATE TABLE IF NOT EXISTS public.student_auth_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    mobile VARCHAR(15),
    password_hash TEXT NOT NULL DEFAULT 'temporary123',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id),
    UNIQUE(email),
    UNIQUE(mobile)
);

-- Enable RLS on the new table
ALTER TABLE public.student_auth_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Teachers can manage their students' auth credentials" ON public.student_auth_credentials;
DROP POLICY IF EXISTS "Students can view their own auth credentials" ON public.student_auth_credentials;

-- Create policies for student auth credentials
CREATE POLICY "Teachers can manage their students' auth credentials" ON public.student_auth_credentials
    FOR ALL USING (
        user_id IN (
            SELECT s.user_id FROM public.students s
            JOIN public.teachers t ON s.teacher_id = t.id
            WHERE t.user_id = auth.uid()
        )
    );

CREATE POLICY "Students can view their own auth credentials" ON public.student_auth_credentials
    FOR SELECT USING (user_id = auth.uid());

-- ===========================================
-- 2. FIX EXISTING STUDENTS WITHOUT AUTH
-- ===========================================

-- Insert auth credentials for existing students (ignore conflicts)
INSERT INTO public.student_auth_credentials (user_id, email, mobile, password_hash)
SELECT 
    u.id,
    u.email,
    u.mobile,
    'temporary123'
FROM public.users u
JOIN public.students s ON u.id = s.user_id
WHERE u.role = 'student'
AND NOT EXISTS (
    SELECT 1 FROM public.student_auth_credentials sac 
    WHERE sac.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- ===========================================
-- 3. CREATE AUTHENTICATION FUNCTION (FIXED)
-- ===========================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.authenticate_student(TEXT, TEXT);

-- Create a function to authenticate students using our custom table
CREATE OR REPLACE FUNCTION public.authenticate_student(
    identifier TEXT,
    password TEXT
)
RETURNS TABLE(
    user_id UUID,
    full_name TEXT,
    email TEXT,
    mobile TEXT,
    role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.full_name::TEXT,
        u.email::TEXT,
        u.mobile::TEXT,
        u.role::TEXT
    FROM public.users u
    JOIN public.student_auth_credentials sac ON u.id = sac.user_id
    WHERE sac.is_active = true
    AND sac.password_hash = password
    AND (sac.email = identifier OR sac.mobile = identifier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.authenticate_student(TEXT, TEXT) TO authenticated;

-- ===========================================
-- 4. UPDATE RLS POLICIES FOR USERS TABLE
-- ===========================================

-- Ensure teachers can create users for their students
DROP POLICY IF EXISTS "Teachers can insert new users" ON public.users;
CREATE POLICY "Teachers can insert new users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teachers t
            WHERE t.user_id = auth.uid()
        )
    );

-- Ensure teachers can view users they created
DROP POLICY IF EXISTS "Teachers can view school users" ON public.users;
CREATE POLICY "Teachers can view school users" ON public.users
    FOR SELECT USING (
        auth.uid()::text = id::text
        OR
        EXISTS (
            SELECT 1 FROM public.teachers t
            WHERE t.user_id = auth.uid()
            AND t.school_id = users.school_id
        )
    );

-- ===========================================
-- 5. VERIFICATION AND TESTING
-- ===========================================

-- Check existing students and their auth status
SELECT 'Student authentication status:' as info;
SELECT 
    u.full_name,
    u.email,
    u.mobile,
    CASE 
        WHEN sac.id IS NOT NULL THEN 'Has auth credentials'
        ELSE 'Missing auth credentials'
    END as auth_status
FROM public.users u
LEFT JOIN public.students s ON u.id = s.user_id
LEFT JOIN public.student_auth_credentials sac ON u.id = sac.user_id
WHERE u.role = 'student'
ORDER BY u.full_name;

-- Test the authentication function
SELECT 'Testing authentication function:' as info;
SELECT * FROM public.authenticate_student('sam@gmail.com', 'temporary123');

-- Show all policies
SELECT 'Current policies:' as info;
SELECT 
    schemaname, 
    tablename, 
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('users', 'students', 'student_auth_credentials')
ORDER BY tablename, policyname;

SELECT 'Student authentication fix completed successfully!' as result;
