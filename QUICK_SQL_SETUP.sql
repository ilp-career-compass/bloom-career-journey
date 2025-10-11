-- QUICK STORAGE SETUP FOR SUPABASE
-- Copy and paste this entire script into Supabase SQL Editor

-- ===========================================
-- 1. CREATE AVATARS BUCKET
-- ===========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- 2. CREATE ASSESSMENT AUDIO BUCKET
-- ===========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assessment-audio',
  'assessment-audio',
  true,
  52428800, -- 50MB limit for audio files
  ARRAY['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav']
) ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- 3. CREATE STORAGE POLICIES FOR AVATARS
-- ===========================================

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view all avatars (public bucket)
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ===========================================
-- 4. CREATE STORAGE POLICIES FOR ASSESSMENT AUDIO
-- ===========================================

-- Allow students to upload their own audio files
CREATE POLICY "Students can upload audio files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'assessment-audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow students and teachers to view audio files
CREATE POLICY "Users can view audio files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'assessment-audio' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.user_id = auth.uid()
    )
  )
);

-- Allow students to update their own audio files
CREATE POLICY "Students can update their own audio files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'assessment-audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow students to delete their own audio files
CREATE POLICY "Students can delete their own audio files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'assessment-audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
