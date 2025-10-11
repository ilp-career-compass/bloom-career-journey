-- COMPLETE USER TABLE FIX
-- Run this in Supabase SQL Editor to fix all missing columns

-- ===========================================
-- 1. ADD ALL MISSING COLUMNS
-- ===========================================

-- Add gender column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS gender TEXT;

-- Add school column  
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS school TEXT;

-- Add profile_picture_url column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add career_goals column (if not exists)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS career_goals TEXT;

-- ===========================================
-- 2. ADD COMMENTS FOR DOCUMENTATION
-- ===========================================

COMMENT ON COLUMN public.users.gender IS 'User gender (male, female, other, prefer_not_to_say)';
COMMENT ON COLUMN public.users.school IS 'School name entered by user (free text input)';
COMMENT ON COLUMN public.users.profile_picture_url IS 'URL of user profile picture stored in Supabase Storage';
COMMENT ON COLUMN public.users.career_goals IS 'User career goals and aspirations';

-- ===========================================
-- 3. VERIFY ALL COLUMNS EXIST
-- ===========================================

-- Check if all required columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('gender', 'school', 'profile_picture_url', 'career_goals', 'full_name')
ORDER BY column_name;
