-- CHECK DATABASE STATES AND CLASSES
-- Run this in Supabase SQL Editor to check the current state of data

-- ===========================================
-- 1. CHECK STATES TABLE
-- ===========================================
SELECT 
  id, 
  state_name, 
  state_code, 
  org_id,
  created_at
FROM public.states 
ORDER BY state_name;

-- ===========================================
-- 2. CHECK CLASSES TABLE
-- ===========================================
SELECT 
  id, 
  name, 
  state_id,
  created_at
FROM public.classes 
ORDER BY name;

-- ===========================================
-- 3. CHECK ORGANIZATIONS TABLE
-- ===========================================
SELECT 
  id, 
  name,
  created_at
FROM public.organizations 
ORDER BY name;

-- ===========================================
-- 4. CHECK IF STATES HAVE ORGANIZATIONS
-- ===========================================
SELECT 
  s.id,
  s.state_name,
  s.state_code,
  o.name as org_name
FROM public.states s
LEFT JOIN public.organizations o ON s.org_id = o.id
ORDER BY s.state_name;
