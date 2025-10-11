-- BASIC MIGRATION SCRIPT
-- This script will do the minimal changes needed to rename schools to states

-- ===========================================
-- STEP 1: CHECK CURRENT STATE
-- ===========================================
SELECT 'CURRENT STATE CHECK' as info;

-- Check if schools table exists
SELECT 'SCHOOLS TABLE EXISTS' as check_type,
       CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schools') 
            THEN 'YES' ELSE 'NO' END as result;

-- Check if states table exists
SELECT 'STATES TABLE EXISTS' as check_type,
       CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'states') 
            THEN 'YES' ELSE 'NO' END as result;

-- ===========================================
-- STEP 2: RENAME SCHOOLS TO STATES (if schools exists)
-- ===========================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schools') THEN
        -- Rename the schools table to states
        ALTER TABLE public.schools RENAME TO states;
        RAISE NOTICE 'Schools table renamed to states';
        
        -- Rename columns in states table
        ALTER TABLE public.states RENAME COLUMN name TO state_name;
        RAISE NOTICE 'Column name renamed to state_name';
        
        -- Check if school_code column exists and rename it
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'states' AND column_name = 'school_code') THEN
            ALTER TABLE public.states RENAME COLUMN school_code TO state_code;
            RAISE NOTICE 'Column school_code renamed to state_code';
        END IF;
        
    ELSE
        RAISE NOTICE 'Schools table does not exist';
    END IF;
END $$;

-- ===========================================
-- STEP 3: UPDATE CLASSES TABLE
-- ===========================================
DO $$
BEGIN
    -- Check if classes table has school_id column
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'school_id') THEN
        -- Add state_id column
        ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS state_id uuid;
        
        -- Copy data from school_id to state_id
        UPDATE public.classes SET state_id = school_id WHERE school_id IS NOT NULL;
        
        -- Add foreign key constraint for state_id
        ALTER TABLE public.classes ADD CONSTRAINT classes_state_id_fkey 
        FOREIGN KEY (state_id) REFERENCES public.states(id) ON DELETE CASCADE;
        
        -- Make state_id NOT NULL
        ALTER TABLE public.classes ALTER COLUMN state_id SET NOT NULL;
        
        -- Drop old school_id column and constraint
        ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_school_id_fkey;
        ALTER TABLE public.classes DROP COLUMN IF EXISTS school_id;
        
        RAISE NOTICE 'Classes table updated: school_id -> state_id';
    ELSE
        RAISE NOTICE 'Classes table does not have school_id column';
    END IF;
END $$;

-- ===========================================
-- STEP 4: UPDATE TEACHERS TABLE
-- ===========================================
DO $$
BEGIN
    -- Check if teachers table has school_id column
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'school_id') THEN
        -- Add state_id column
        ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS state_id uuid;
        
        -- Copy data from school_id to state_id
        UPDATE public.teachers SET state_id = school_id WHERE school_id IS NOT NULL;
        
        -- Add foreign key constraint for state_id
        ALTER TABLE public.teachers ADD CONSTRAINT teachers_state_id_fkey 
        FOREIGN KEY (state_id) REFERENCES public.states(id) ON DELETE SET NULL;
        
        -- Drop old school_id column and constraint
        ALTER TABLE public.teachers DROP CONSTRAINT IF EXISTS teachers_school_id_fkey;
        ALTER TABLE public.teachers DROP COLUMN IF EXISTS school_id;
        
        RAISE NOTICE 'Teachers table updated: school_id -> state_id';
    ELSE
        RAISE NOTICE 'Teachers table does not have school_id column';
    END IF;
END $$;

-- ===========================================
-- STEP 5: UPDATE USERS TABLE
-- ===========================================
DO $$
BEGIN
    -- Check if users table has school_id column
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'school_id') THEN
        -- Add state_id column
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS state_id uuid;
        
        -- Copy data from school_id to state_id
        UPDATE public.users SET state_id = school_id WHERE school_id IS NOT NULL;
        
        -- Add foreign key constraint for state_id
        ALTER TABLE public.users ADD CONSTRAINT users_state_id_fkey 
        FOREIGN KEY (state_id) REFERENCES public.states(id) ON DELETE SET NULL;
        
        -- Drop old school_id column and constraint
        ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_school_id_fkey;
        ALTER TABLE public.users DROP COLUMN IF EXISTS school_id;
        
        RAISE NOTICE 'Users table updated: school_id -> state_id';
    ELSE
        RAISE NOTICE 'Users table does not have school_id column';
    END IF;
END $$;

-- ===========================================
-- STEP 6: ADD MISSING CLASSES
-- ===========================================
DO $$
BEGIN
    -- Add classes 8, 9, 10, 11, 12 for each state if they don't exist
    INSERT INTO public.classes (name, state_id)
    SELECT class_name, s.id
    FROM (
        SELECT 'Class 8' as class_name UNION ALL
        SELECT 'Class 9' UNION ALL
        SELECT 'Class 10' UNION ALL
        SELECT 'Class 11' UNION ALL
        SELECT 'Class 12'
    ) AS classes_to_insert
    CROSS JOIN public.states s
    WHERE NOT EXISTS (
        SELECT 1 FROM public.classes c WHERE c.name = classes_to_insert.class_name AND c.state_id = s.id
    );
    
    RAISE NOTICE 'Missing classes (8-12) added for each state';
END $$;

-- ===========================================
-- STEP 7: VERIFICATION
-- ===========================================
SELECT '=== MIGRATION VERIFICATION ===' as section;

-- Check states table
SELECT 'STATES TABLE' as info;
SELECT id, state_name, state_code, org_id FROM public.states ORDER BY state_name;

-- Check classes per state
SELECT 'CLASSES PER STATE' as info;
SELECT 
  s.state_name,
  COUNT(c.id) as class_count,
  STRING_AGG(c.name, ', ' ORDER BY c.name) as classes
FROM public.states s
LEFT JOIN public.classes c ON s.id = c.state_id
GROUP BY s.id, s.state_name
ORDER BY s.state_name;

SELECT '=== MIGRATION COMPLETE ===' as final_status;
