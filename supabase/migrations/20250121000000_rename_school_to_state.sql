-- RENAME SCHOOL TO STATE - COMPREHENSIVE MIGRATION
-- This migration renames all school-related objects to state while preserving data

-- ===========================================
-- 1. RENAME TABLES
-- ===========================================

-- Rename schools table to states
ALTER TABLE public.schools RENAME TO states;

-- ===========================================
-- 2. RENAME COLUMNS IN STATES TABLE
-- ===========================================

-- Rename columns in the states table (formerly schools)
ALTER TABLE public.states RENAME COLUMN name TO state_name;
ALTER TABLE public.states RENAME COLUMN school_code TO state_code;

-- ===========================================
-- 3. RENAME COLUMNS IN OTHER TABLES
-- ===========================================

-- Rename school_id columns to state_id
ALTER TABLE public.classes RENAME COLUMN school_id TO state_id;
ALTER TABLE public.teachers RENAME COLUMN school_id TO state_id;
ALTER TABLE public.users RENAME COLUMN school_id TO state_id;

-- ===========================================
-- 4. UPDATE FOREIGN KEY CONSTRAINTS
-- ===========================================

-- Drop existing foreign key constraints
ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_school_id_fkey;
ALTER TABLE public.teachers DROP CONSTRAINT IF EXISTS teachers_school_id_fkey;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_school_id_fkey;

-- Add new foreign key constraints with state_id
ALTER TABLE public.classes ADD CONSTRAINT classes_state_id_fkey 
    FOREIGN KEY (state_id) REFERENCES public.states(id) ON DELETE CASCADE;

ALTER TABLE public.teachers ADD CONSTRAINT teachers_state_id_fkey 
    FOREIGN KEY (state_id) REFERENCES public.states(id) ON DELETE CASCADE;

ALTER TABLE public.users ADD CONSTRAINT users_state_id_fkey 
    FOREIGN KEY (state_id) REFERENCES public.states(id) ON DELETE CASCADE;

-- ===========================================
-- 5. UPDATE RLS POLICIES
-- ===========================================

-- Drop old RLS policies
DROP POLICY IF EXISTS "Teachers can view schools" ON public.states;
DROP POLICY IF EXISTS "Teachers can view school users" ON public.users;
DROP POLICY IF EXISTS "Teachers can insert new users" ON public.users;
DROP POLICY IF EXISTS "Teachers can view their students' users" ON public.users;

-- Create new RLS policies with state references
CREATE POLICY "Teachers can view states" ON public.states
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers can view state users" ON public.users
    FOR SELECT USING (
        -- Allow users to see their own profile
        auth.uid()::text = id::text
        OR
        -- Allow teachers to see users in their state
        EXISTS (
            SELECT 1 FROM public.teachers t
            WHERE t.user_id = auth.uid()
            AND t.state_id = users.state_id
        )
    );

CREATE POLICY "Teachers can insert new users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teachers t
            WHERE t.user_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can view their students' users" ON public.users
    FOR SELECT USING (
        -- Allow users to see their own profile
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
-- 6. UPDATE FUNCTIONS AND TRIGGERS
-- ===========================================

-- Update any functions that reference school_id
-- (Add specific function updates here if any exist)

-- ===========================================
-- 7. UPDATE INDEXES
-- ===========================================

-- Drop old indexes
DROP INDEX IF EXISTS idx_classes_school_id;
DROP INDEX IF EXISTS idx_teachers_school_id;
DROP INDEX IF EXISTS idx_users_school_id;

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_classes_state_id ON public.classes(state_id);
CREATE INDEX IF NOT EXISTS idx_teachers_state_id ON public.teachers(state_id);
CREATE INDEX IF NOT EXISTS idx_users_state_id ON public.users(state_id);

-- ===========================================
-- 8. UPDATE COMMENTS
-- ===========================================

COMMENT ON TABLE public.states IS 'States table (formerly schools)';
COMMENT ON COLUMN public.states.state_name IS 'Name of the state (formerly school name)';
COMMENT ON COLUMN public.states.state_code IS 'Code for the state (formerly school code)';
COMMENT ON COLUMN public.classes.state_id IS 'Reference to state (formerly school_id)';
COMMENT ON COLUMN public.teachers.state_id IS 'Reference to state (formerly school_id)';
COMMENT ON COLUMN public.users.state_id IS 'Reference to state (formerly school_id)';
