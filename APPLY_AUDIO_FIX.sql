-- ============================================
-- AUDIO RECORDING FIX - COMPLETE SOLUTION
-- ============================================
-- Run this entire script in your Supabase SQL Editor
-- This will fix storage RLS policies and MIME type support

-- ============================================
-- PART 1: Fix Storage RLS Policies
-- ============================================

-- Drop ALL existing audio-related policies (old and new names)
DROP POLICY IF EXISTS "Students can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view audio files" ON storage.objects;
DROP POLICY IF EXISTS "Students can update their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Students can delete their own audio files" ON storage.objects;

-- Drop new policy names (in case they were created)
DROP POLICY IF EXISTS "Students can upload their own audio responses" ON storage.objects;
DROP POLICY IF EXISTS "Users can view assessment audio files" ON storage.objects;

-- INSERT POLICY - Students upload their audio
CREATE POLICY "Students can upload their own audio responses" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'assessment-audio' 
  AND (storage.foldername(name))[1] = 'audio-responses'
  AND (
    -- Check if the studentId in path belongs to the authenticated user
    (storage.foldername(name))[2] IN (
      SELECT id::text FROM students 
      WHERE user_id = auth.uid()
    )
    OR
    -- Allow direct auth.uid() match (for backward compatibility)
    (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- SELECT POLICY - View audio files
CREATE POLICY "Users can view assessment audio files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'assessment-audio' 
  AND (
    -- Students can view their own audio files
    (storage.foldername(name))[2] IN (
      SELECT id::text FROM students 
      WHERE user_id = auth.uid()
    )
    OR
    -- Direct auth.uid() match
    (storage.foldername(name))[2] = auth.uid()::text
    OR
    -- Teachers can view their students' audio files
    (storage.foldername(name))[2] IN (
      SELECT s.id::text FROM students s
      JOIN teachers t ON s.teacher_id = t.id
      WHERE t.user_id = auth.uid()
    )
    OR
    -- Admins can view all audio files
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  )
);

-- UPDATE POLICY - Update own audio files
CREATE POLICY "Students can update their own audio files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'assessment-audio' 
  AND (storage.foldername(name))[1] = 'audio-responses'
  AND (
    (storage.foldername(name))[2] IN (
      SELECT id::text FROM students 
      WHERE user_id = auth.uid()
    )
    OR
    (storage.foldername(name))[2] = auth.uid()::text
  )
)
WITH CHECK (
  bucket_id = 'assessment-audio' 
  AND (storage.foldername(name))[1] = 'audio-responses'
  AND (
    (storage.foldername(name))[2] IN (
      SELECT id::text FROM students 
      WHERE user_id = auth.uid()
    )
    OR
    (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- DELETE POLICY - Delete own audio files
CREATE POLICY "Students can delete their own audio files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'assessment-audio' 
  AND (storage.foldername(name))[1] = 'audio-responses'
  AND (
    (storage.foldername(name))[2] IN (
      SELECT id::text FROM students 
      WHERE user_id = auth.uid()
    )
    OR
    (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- ============================================
-- PART 2: Update MIME Type Support
-- ============================================

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/ogg',
  'audio/ogg;codecs=opus', 
  'audio/wav',
  'audio/mpeg',
  'audio/mp3'
]
WHERE id = 'assessment-audio';

-- ============================================
-- VERIFICATION
-- ============================================

-- Check policies were created
SELECT 
  policyname, 
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%audio%'
ORDER BY policyname;

-- Check bucket configuration
SELECT 
  id,
  name,
  public,
  file_size_limit,
  array_length(allowed_mime_types, 1) as mime_types_count,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'assessment-audio';

-- ============================================
-- SUCCESS!
-- ============================================
-- If you see policies and the bucket with updated MIME types, you're all set!
-- Test by recording an audio response as a student.

