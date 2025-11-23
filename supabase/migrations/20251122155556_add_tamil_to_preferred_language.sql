-- Update preferred_language constraint to include Tamil ('ta')
-- First, drop the existing constraint
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_preferred_language_check;

-- Add new constraint that includes Tamil
ALTER TABLE public.users
ADD CONSTRAINT users_preferred_language_check 
  CHECK (preferred_language IN ('en', 'kn', 'ta'));

