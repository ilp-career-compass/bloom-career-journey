-- Add has_selected_language to users to track if they've explicitly chosen a language
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS has_selected_language BOOLEAN NOT NULL DEFAULT false;

-- For existing users, we'll assume they've already "selected" it (or they'll be prompted once)
-- Actually, let's set it to true for all existing users so we don't annoy them
UPDATE public.users SET has_selected_language = true;
