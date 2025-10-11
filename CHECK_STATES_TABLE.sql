-- CHECK_STATES_TABLE.sql
-- This script will show us the exact structure of the states table

-- Check what columns exist in states table
SELECT 'STATES TABLE COLUMNS' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'states' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what data exists in states table
SELECT 'STATES TABLE DATA' as info;
SELECT * FROM public.states LIMIT 10;

-- Check what columns exist in classes table
SELECT 'CLASSES TABLE COLUMNS' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'classes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what data exists in classes table
SELECT 'CLASSES TABLE DATA' as info;
SELECT * FROM public.classes LIMIT 10;
