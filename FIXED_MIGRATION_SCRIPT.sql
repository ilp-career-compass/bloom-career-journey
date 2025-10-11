-- FIXED MIGRATION SCRIPT
-- This script will work with the actual column names in your database

-- ===========================================
-- 1. FIRST, LET'S SEE WHAT WE HAVE
-- ===========================================
SELECT 'CHECKING STATES TABLE STRUCTURE' as info;
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'states' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'CHECKING CLASSES TABLE STRUCTURE' as info;
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'classes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===========================================
-- 2. ADD state_id COLUMN TO CLASSES TABLE
-- ===========================================
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS state_id uuid;

-- ===========================================
-- 3. UPDATE CLASSES TO LINK TO STATES
-- ===========================================
-- First, let's see what we have without the problematic JOIN
SELECT 'BEFORE UPDATE - Classes with school_id' as info;
SELECT c.id, c.name, c.school_id 
FROM public.classes c;

-- Update classes to link to states based on school_id
-- We'll use a different approach that doesn't rely on column names
UPDATE public.classes 
SET state_id = (
    SELECT s.id 
    FROM public.states s 
    WHERE s.id = public.classes.school_id
);

-- ===========================================
-- 4. ADD MISSING CLASSES FOR EACH STATE
-- ===========================================
-- Insert classes 8, 9, 10, 11, 12 for each state if they don't exist
DO $$
DECLARE
    state_record RECORD;
    class_name TEXT;
BEGIN
    -- Loop through each state
    FOR state_record IN SELECT id FROM public.states LOOP
        -- Insert classes 8, 9, 10, 11, 12 for this state
        FOR class_name IN SELECT unnest(ARRAY['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']) LOOP
            INSERT INTO public.classes (name, state_id)
            VALUES (class_name, state_record.id)
            ON CONFLICT (name, state_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- ===========================================
-- 5. REMOVE OLD school_id COLUMN
-- ===========================================
-- Drop the old school_id column and constraint
ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_school_id_fkey;
ALTER TABLE public.classes DROP COLUMN IF EXISTS school_id;

-- Make state_id NOT NULL and add foreign key constraint
ALTER TABLE public.classes ALTER COLUMN state_id SET NOT NULL;
ALTER TABLE public.classes ADD CONSTRAINT classes_state_id_fkey 
FOREIGN KEY (state_id) REFERENCES public.states(id) ON DELETE CASCADE;

-- ===========================================
-- 6. VERIFY THE RESULTS
-- ===========================================
SELECT 'AFTER UPDATE - Classes with state_id' as info;
SELECT c.id, c.name, c.state_id 
FROM public.classes c 
ORDER BY c.state_id, c.name;

-- Count classes per state
SELECT 'CLASSES PER STATE' as info;
SELECT 
  COUNT(c.id) as total_classes,
  STRING_AGG(c.name, ', ' ORDER BY c.name) as all_classes
FROM public.classes c;

-- ===========================================
-- 7. TEST THE EXACT QUERY THE APP USES
-- ===========================================
SELECT 'APP QUERY TEST - States' as info;
SELECT id, name, org_id 
FROM public.states 
ORDER BY name;
