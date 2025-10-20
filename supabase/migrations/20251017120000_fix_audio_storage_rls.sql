-- Fix storage RLS policies for assessment-audio bucket
-- The current policies expect auth.uid() in the first folder, 
-- but the actual path is: audio-responses/{studentId}/{assessmentId}/filename.webm

-- Drop existing policies for assessment-audio
DROP POLICY IF EXISTS "Students can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view audio files" ON storage.objects;
DROP POLICY IF EXISTS "Students can update their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Students can delete their own audio files" ON storage.objects;

-- ===========================================
-- 1. INSERT POLICY - Students upload their audio
-- ===========================================
-- Path structure: audio-responses/{studentId}/{assessmentId}/filename.webm
-- We need to verify that the studentId (2nd folder) belongs to the authenticated user

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

-- ===========================================
-- 2. SELECT POLICY - View audio files
-- ===========================================
-- Students can view their own audio files
-- Teachers can view their students' audio files

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

-- ===========================================
-- 3. UPDATE POLICY - Update own audio files
-- ===========================================

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

-- ===========================================
-- 4. DELETE POLICY - Delete own audio files
-- ===========================================

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

-- Add helpful comments
COMMENT ON POLICY "Students can upload their own audio responses" ON storage.objects IS 
'Allows students to upload audio files to their own folder. Path: audio-responses/{studentId}/{assessmentId}/filename';

COMMENT ON POLICY "Users can view assessment audio files" ON storage.objects IS 
'Students view own files, teachers view their students files, admins view all';

COMMENT ON POLICY "Students can update their own audio files" ON storage.objects IS 
'Allows students to update/replace their own audio files';

COMMENT ON POLICY "Students can delete their own audio files" ON storage.objects IS 
'Allows students to delete their own audio files';

