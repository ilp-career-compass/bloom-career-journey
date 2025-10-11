-- FIX MISSING USER COLUMNS
-- Run this in Supabase SQL Editor to add missing columns

-- Add gender column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS gender TEXT;

-- Add school column  
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS school TEXT;

-- Add profile_picture_url column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.users.gender IS 'User gender (male, female, other, prefer_not_to_say)';
COMMENT ON COLUMN public.users.school IS 'School name entered by user (free text input)';
COMMENT ON COLUMN public.users.profile_picture_url IS 'URL of user profile picture stored in Supabase Storage';

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('gender', 'school', 'profile_picture_url');
