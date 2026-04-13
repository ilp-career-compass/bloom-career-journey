-- Update is_valid_mobile to accept both 10-digit bare numbers and E.164 format (+91XXXXXXXXXX)
-- Previous constraint only accepted 10-digit bare numbers, rejecting E.164 format used by phone auth
CREATE OR REPLACE FUNCTION public.is_valid_mobile(mobile_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN mobile_number ~ '^\+[0-9]{10,15}$' OR mobile_number ~ '^[0-9]{10}$';
END;
$$ LANGUAGE plpgsql;
