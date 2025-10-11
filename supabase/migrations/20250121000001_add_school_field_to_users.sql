-- ADD SCHOOL FIELD TO USERS TABLE
-- This migration adds a school field to the users table for both students and teachers

-- ===========================================
-- 1. ADD SCHOOL COLUMN TO USERS TABLE
-- ===========================================

-- Add school column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS school TEXT;

-- ===========================================
-- 2. ADD COMMENT
-- ===========================================

COMMENT ON COLUMN public.users.school IS 'School name entered by user (free text input)';
