-- Fix RLS policies for audio_files table
-- The existing policies are too restrictive for INSERT operations

-- Drop existing policies
DROP POLICY IF EXISTS "Students can access their own audio files" ON audio_files;
DROP POLICY IF EXISTS "Teachers can access their students' audio files" ON audio_files;

-- Create separate policies for better control and clarity

-- Policy 1: Students can INSERT their own audio files
CREATE POLICY "Students can insert their own audio files" ON audio_files
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        student_id IN (
            SELECT id FROM students 
            WHERE user_id = auth.uid()
        )
    );

-- Policy 2: Students can SELECT their own audio files
CREATE POLICY "Students can select their own audio files" ON audio_files
    FOR SELECT
    TO authenticated
    USING (
        student_id IN (
            SELECT id FROM students 
            WHERE user_id = auth.uid()
        )
    );

-- Policy 3: Students can UPDATE their own audio files
CREATE POLICY "Students can update their own audio files" ON audio_files
    FOR UPDATE
    TO authenticated
    USING (
        student_id IN (
            SELECT id FROM students 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        student_id IN (
            SELECT id FROM students 
            WHERE user_id = auth.uid()
        )
    );

-- Policy 4: Students can DELETE their own audio files
CREATE POLICY "Students can delete their own audio files" ON audio_files
    FOR DELETE
    TO authenticated
    USING (
        student_id IN (
            SELECT id FROM students 
            WHERE user_id = auth.uid()
        )
    );

-- Policy 5: Teachers can SELECT their students' audio files
CREATE POLICY "Teachers can select their students audio files" ON audio_files
    FOR SELECT
    TO authenticated
    USING (
        student_id IN (
            SELECT s.id FROM students s
            JOIN teachers t ON s.teacher_id = t.id
            WHERE t.user_id = auth.uid()
        )
    );

-- Policy 6: Admins can do everything
CREATE POLICY "Admins can manage all audio files" ON audio_files
    FOR ALL
    TO authenticated
    USING (
        public.is_admin(auth.uid())
    )
    WITH CHECK (
        public.is_admin(auth.uid())
    );

-- Add comment
COMMENT ON TABLE audio_files IS 'Audio response files with separate RLS policies for students, teachers, and admins';

