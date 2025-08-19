-- Migration to add email support for authentication
-- This allows users to login with either mobile or email

-- Add email column to users table
ALTER TABLE public.users ADD COLUMN email VARCHAR(255);

-- Create a unique constraint for email (allowing nulls)
CREATE UNIQUE INDEX users_email_unique ON public.users (email) WHERE email IS NOT NULL;

-- Update the mobile column to allow nulls (since users can now use either mobile or email)
ALTER TABLE public.users ALTER COLUMN mobile DROP NOT NULL;

-- Create a check constraint to ensure at least one of mobile or email is provided
ALTER TABLE public.users ADD CONSTRAINT users_mobile_or_email_check 
CHECK (mobile IS NOT NULL OR email IS NOT NULL);

-- Update existing users to have both mobile and email for backward compatibility
-- This assumes existing users have mobile numbers and we'll generate email addresses
UPDATE public.users 
SET email = CONCAT(mobile, '@internal.app') 
WHERE email IS NULL AND mobile IS NOT NULL;

-- Now make email required for existing users
ALTER TABLE public.users ALTER COLUMN email SET NOT NULL;

-- Create a function to validate email format
CREATE OR REPLACE FUNCTION public.is_valid_email(email_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Add check constraint for email format
ALTER TABLE public.users ADD CONSTRAINT users_email_format_check 
CHECK (public.is_valid_email(email));

-- Create a function to validate mobile format (10 digits)
CREATE OR REPLACE FUNCTION public.is_valid_mobile(mobile_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN mobile_number ~* '^[0-9]{10}$';
END;
$$ LANGUAGE plpgsql;

-- Add check constraint for mobile format (when not null)
ALTER TABLE public.users ADD CONSTRAINT users_mobile_format_check 
CHECK (mobile IS NULL OR public.is_valid_mobile(mobile));

-- Update the RLS policies to work with both mobile and email
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Recreate policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Create a function to find user by mobile or email
CREATE OR REPLACE FUNCTION public.find_user_by_identifier(identifier TEXT)
RETURNS TABLE(
    id UUID,
    mobile VARCHAR(15),
    email VARCHAR(255),
    role public.app_role,
    full_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.mobile, u.email, u.role, u.full_name
    FROM public.users u
    WHERE u.mobile = identifier OR u.email = identifier;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.find_user_by_identifier(TEXT) TO authenticated;

-- Create indexes for better performance
CREATE INDEX users_mobile_idx ON public.users (mobile);
CREATE INDEX users_email_idx ON public.users (email);
CREATE INDEX users_identifier_idx ON public.users (mobile, email);

-- Add comment to document the changes
COMMENT ON TABLE public.users IS 'Users table supporting both mobile and email authentication';
COMMENT ON COLUMN public.users.mobile IS 'Mobile number (10 digits) - optional if email is provided';
COMMENT ON COLUMN public.users.email IS 'Email address - required for authentication';
COMMENT ON COLUMN public.users.password_hash IS 'Password hash managed by Supabase Auth';
COMMENT ON COLUMN public.users.role IS 'User role: admin, teacher, or student';
