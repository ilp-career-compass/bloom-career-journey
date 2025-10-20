-- Create missing student record for existing user
-- This fixes the "Loading..." issue where audio recorders don't appear

-- First, let's check what we have
SELECT 
  u.id as user_id,
  u.full_name,
  u.role,
  u.state_id,
  s.id as student_id
FROM users u
LEFT JOIN students s ON s.user_id = u.id
WHERE u.role = 'student'
ORDER BY u.created_at DESC
LIMIT 10;

-- Create missing student records for users who don't have them
-- This will create student records for all student users without one
INSERT INTO students (user_id, class_id, teacher_id, enrollment_date, enrollment_status)
SELECT 
  u.id as user_id,
  NULL as class_id,  -- Can be set later
  NULL as teacher_id, -- Can be assigned later
  COALESCE(u.created_at, NOW()) as enrollment_date,
  'active' as enrollment_status
FROM users u
LEFT JOIN students s ON s.user_id = u.id
WHERE u.role = 'student'
  AND s.id IS NULL;  -- Only create if student record doesn't exist

-- Verify the fix
SELECT 
  u.id as user_id,
  u.full_name,
  u.email,
  u.mobile,
  s.id as student_id,
  s.enrollment_status
FROM users u
JOIN students s ON s.user_id = u.id
WHERE u.role = 'student'
ORDER BY u.created_at DESC
LIMIT 10;

-- This should now show all student users with their student records

