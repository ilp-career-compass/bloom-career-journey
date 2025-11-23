-- Fix storage RLS policies for avatars bucket
-- The current policies may fail if auth.uid() doesn't match the folder name
-- This migration creates more robust policies that handle edge cases

-- ===========================================
-- 1. DROP EXISTING AVATARS POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- ===========================================
-- 2. CREATE IMPROVED STORAGE POLICIES FOR AVATARS
-- ===========================================

-- Allow authenticated users to upload their own avatars
-- Path structure: {user_id}/{timestamp}_{filename}
-- Check that the first folder matches auth.uid()
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view all avatars (public bucket)
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ===========================================
-- 3. VERIFY POLICIES
-- ===========================================

-- Check that policies were created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload their own avatars'
  ) THEN
    RAISE NOTICE '✅ Avatars storage policies created successfully';
  ELSE
    RAISE WARNING '⚠️ Avatars storage policies may not have been created';
  END IF;
END $$;

