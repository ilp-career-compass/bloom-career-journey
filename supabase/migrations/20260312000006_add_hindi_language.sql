-- Add Hindi ('hi') to the preferred_language CHECK constraint.
-- Pattern follows 20251122155556_add_tamil_to_preferred_language.sql

-- Drop the existing constraint
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_preferred_language_check;

-- Add new constraint that includes Hindi
ALTER TABLE public.users
ADD CONSTRAINT users_preferred_language_check
  CHECK (preferred_language IN ('en', 'kn', 'ta', 'hi'));
