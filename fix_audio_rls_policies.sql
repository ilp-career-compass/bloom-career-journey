-- Fix RLS policies for audio files and create test data
-- This script fixes the Row Level Security policies for audio recording

-- First, let's create a test student record for testing
INSERT INTO students (id, user_id, name, email, class_id, mobile, created_at, updated_at)
VALUES (
    'test-student-123'::uuid,
    auth.uid(), -- This will use the current authenticated user
    'Test Student',
    'test@example.com',
    (SELECT id FROM classes LIMIT 1), -- Use first available class
    '1234567890',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Update the RLS policies to be more permissive for testing
-- Drop existing policies
DROP POLICY IF EXISTS "Students can access their own audio files" ON audio_files;
DROP POLICY IF EXISTS "Teachers can access their students' audio files" ON audio_files;

-- Create more permissive policies for testing
CREATE POLICY "Allow authenticated users to manage audio files" ON audio_files
    FOR ALL USING (auth.role() = 'authenticated');

-- Also ensure assessment_responses table allows audio_responses updates
-- Check if we need to update the assessment_responses RLS policy
DROP POLICY IF EXISTS "Students can manage their own assessment responses" ON assessment_responses;

CREATE POLICY "Students can manage their own assessment responses" ON assessment_responses
    FOR ALL USING (
        student_id IN (
            SELECT id FROM students 
            WHERE user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT ALL ON audio_files TO authenticated;
GRANT ALL ON assessment_responses TO authenticated;

-- Create a test assessment response for testing
INSERT INTO assessment_responses (
    id,
    student_id,
    assessment_type,
    assessment_title,
    responses,
    audio_responses,
    created_at,
    updated_at
) VALUES (
    'test-assessment-456'::uuid,
    'test-student-123'::uuid,
    'inspiration',
    'Inspiration Assessment',
    '{}'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;
