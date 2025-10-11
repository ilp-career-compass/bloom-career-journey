-- SIMPLE DATABASE CHECK
-- This script will simply check what tables and columns actually exist

-- ===========================================
-- 1. CHECK WHAT TABLES EXIST
-- ===========================================
SELECT 'EXISTING TABLES' as info;
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- ===========================================
-- 2. CHECK SCHOOLS TABLE (if it exists)
-- ===========================================
SELECT 'SCHOOLS TABLE COLUMNS' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'schools' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===========================================
-- 3. CHECK STATES TABLE (if it exists)
-- ===========================================
SELECT 'STATES TABLE COLUMNS' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'states' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===========================================
-- 4. CHECK CLASSES TABLE
-- ===========================================
SELECT 'CLASSES TABLE COLUMNS' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'classes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===========================================
-- 5. CHECK TEACHERS TABLE
-- ===========================================
SELECT 'TEACHERS TABLE COLUMNS' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'teachers' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===========================================
-- 6. CHECK USERS TABLE
-- ===========================================
SELECT 'USERS TABLE COLUMNS' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===========================================
-- 7. CHECK STUDENTS TABLE
-- ===========================================
SELECT 'STUDENTS TABLE COLUMNS' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'students' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===========================================
-- 8. CHECK ORGS TABLE
-- ===========================================
SELECT 'ORGS TABLE COLUMNS' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orgs' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===========================================
-- 9. CHECK ORGANIZATIONS TABLE
-- ===========================================
SELECT 'ORGANIZATIONS TABLE COLUMNS' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations' AND table_schema = 'public'
ORDER BY ordinal_position;
