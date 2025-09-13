-- Test password update for students
-- Run this in your Supabase SQL Editor

-- 1. Check if the student exists and has auth credentials
SELECT 'Checking student auth credentials:' as info;
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.mobile,
    sac.password_hash,
    sac.is_active,
    sac.created_at,
    sac.updated_at
FROM public.users u
LEFT JOIN public.student_auth_credentials sac ON u.id = sac.user_id
WHERE u.email = 'alwin@gmail.com' OR u.mobile = 'alwin@gmail.com'
ORDER BY u.full_name;

-- 2. Test updating the password
SELECT 'Testing password update:' as info;
UPDATE public.student_auth_credentials 
SET 
    password_hash = 'newpassword123',
    updated_at = now()
WHERE user_id = (
    SELECT id FROM public.users 
    WHERE email = 'alwin@gmail.com' OR mobile = 'alwin@gmail.com'
    LIMIT 1
);

-- 3. Check if the update worked
SELECT 'After password update:' as info;
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.mobile,
    sac.password_hash,
    sac.is_active,
    sac.updated_at
FROM public.users u
LEFT JOIN public.student_auth_credentials sac ON u.id = sac.user_id
WHERE u.email = 'alwin@gmail.com' OR u.mobile = 'alwin@gmail.com'
ORDER BY u.full_name;

-- 4. Test the authentication function with new password
SELECT 'Testing authentication with new password:' as info;
SELECT * FROM public.authenticate_student('alwin@gmail.com', 'newpassword123');

-- 5. Reset password back to original for testing
UPDATE public.student_auth_credentials 
SET 
    password_hash = 'temporary123',
    updated_at = now()
WHERE user_id = (
    SELECT id FROM public.users 
    WHERE email = 'alwin@gmail.com' OR mobile = 'alwin@gmail.com'
    LIMIT 1
);

SELECT 'Password reset to original for testing' as info;
