-- Add Tamil (ta) language support to content_translations table
-- This migration updates the check constraint to allow 'ta' as a valid language code

-- Drop the existing check constraint
ALTER TABLE public.content_translations 
DROP CONSTRAINT IF EXISTS content_translations_lang_check;

-- Add new check constraint that includes Tamil
ALTER TABLE public.content_translations 
ADD CONSTRAINT content_translations_lang_check 
CHECK (lang IN ('en', 'kn', 'ta'));

-- Verify the constraint was added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'content_translations_lang_check'
    AND contype = 'c'
  ) THEN
    RAISE NOTICE '✅ Tamil language support added to content_translations table';
  ELSE
    RAISE WARNING '⚠️ Constraint may not have been created correctly';
  END IF;
END $$;

