-- COMPLETE MIGRATION FIX
-- This script will fix the classes table and add the missing classes

-- ===========================================
-- 1. ADD state_id COLUMN TO CLASSES TABLE
-- ===========================================
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS state_id uuid;

-- ===========================================
-- 2. UPDATE CLASSES TO LINK TO STATES
-- ===========================================
-- First, let's see what we have
SELECT 'BEFORE UPDATE - Classes with school_id' as info;
SELECT c.id, c.name, c.school_id, s.state_name 
FROM public.classes c 
LEFT JOIN public.schools s ON c.school_id = s.id;

-- Update classes to link to states based on school_id
UPDATE public.classes 
SET state_id = s.id
FROM public.schools s
WHERE public.classes.school_id = s.id;

-- ===========================================
-- 3. ADD MISSING CLASSES FOR EACH STATE
-- ===========================================
-- Insert classes 8, 9, 10, 11, 12 for each state if they don't exist
DO $$
DECLARE
    state_record RECORD;
    class_name TEXT;
BEGIN
    -- Loop through each state
    FOR state_record IN SELECT id, state_name FROM public.states LOOP
        -- Insert classes 8, 9, 10, 11, 12 for this state
        FOR class_name IN SELECT unnest(ARRAY['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']) LOOP
            INSERT INTO public.classes (name, state_id)
            VALUES (class_name, state_record.id)
            ON CONFLICT (name, state_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- ===========================================
-- 4. REMOVE OLD school_id COLUMN
-- ===========================================
-- Drop the old school_id column and constraint
ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_school_id_fkey;
ALTER TABLE public.classes DROP COLUMN IF EXISTS school_id;

-- Make state_id NOT NULL and add foreign key constraint
ALTER TABLE public.classes ALTER COLUMN state_id SET NOT NULL;
ALTER TABLE public.classes ADD CONSTRAINT classes_state_id_fkey 
FOREIGN KEY (state_id) REFERENCES public.states(id) ON DELETE CASCADE;

-- ===========================================
-- 5. VERIFY THE RESULTS
-- ===========================================
SELECT 'AFTER UPDATE - Classes with state_id' as info;
SELECT c.id, c.name, s.state_name 
FROM public.classes c 
JOIN public.states s ON c.state_id = s.id
ORDER BY s.state_name, c.name;

-- Count classes per state
SELECT 'CLASSES PER STATE' as info;
SELECT 
  s.state_name,
  COUNT(c.id) as class_count,
  STRING_AGG(c.name, ', ' ORDER BY c.name) as classes
FROM public.states s
LEFT JOIN public.classes c ON s.id = c.state_id
GROUP BY s.id, s.state_name
ORDER BY s.state_name;

-- ===========================================
-- 6. TEST THE EXACT QUERY THE APP USES
-- ===========================================
SELECT 'APP QUERY TEST - States with Classes' as info;
SELECT 
  s.id, 
  s.state_name, 
  s.state_code, 
  s.org_id, 
  o.name as org_name
FROM public.states s 
LEFT JOIN public.organizations o ON s.org_id = o.id
ORDER BY s.state_name;

SELECT 'APP QUERY TEST - Classes for a specific state' as info;
SELECT c.id, c.name 
FROM public.classes c 
WHERE c.state_id = (SELECT id FROM public.states WHERE state_name = 'ILP-Tamil Nadu' LIMIT 1)
ORDER BY c.name;
