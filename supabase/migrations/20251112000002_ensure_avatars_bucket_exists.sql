-- Migration: Ensure avatars bucket exists
-- This migration ensures the avatars bucket is created if it doesn't exist
-- Run this if you're getting "Bucket not found" errors

-- ===========================================
-- 1. CREATE AVATARS BUCKET (if it doesn't exist)
-- ===========================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- ===========================================
-- 2. ENSURE STORAGE POLICIES EXIST
-- ===========================================

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Allow authenticated users to upload their own avatars
-- Path structure: {user_id}/{timestamp}_{filename}
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
-- 3. VERIFY BUCKET CREATION
-- ===========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
  ) THEN
    RAISE NOTICE '✅ Avatars bucket exists';
  ELSE
    RAISE EXCEPTION '❌ Failed to create avatars bucket';
  END IF;
END $$;

