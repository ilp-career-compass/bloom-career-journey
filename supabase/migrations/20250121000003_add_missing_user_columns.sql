-- ADD MISSING USER COLUMNS
-- This migration adds the missing columns to the users table

-- ===========================================
-- 1. ADD GENDER COLUMN TO USERS TABLE
-- ===========================================

-- Add gender column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS gender TEXT;

-- ===========================================
-- 2. ADD SCHOOL COLUMN TO USERS TABLE
-- ===========================================

-- Add school column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS school TEXT;

-- ===========================================
-- 3. ADD PROFILE_PICTURE_URL COLUMN TO USERS TABLE
-- ===========================================

-- Add profile_picture_url column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- ===========================================
-- 4. ADD COMMENTS
-- ===========================================

COMMENT ON COLUMN public.users.gender IS 'User gender (male, female, other, prefer_not_to_say)';
COMMENT ON COLUMN public.users.school IS 'School name entered by user (free text input)';
COMMENT ON COLUMN public.users.profile_picture_url IS 'URL of user profile picture stored in Supabase Storage';
