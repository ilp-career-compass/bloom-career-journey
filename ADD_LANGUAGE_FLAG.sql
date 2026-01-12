-- Add has_selected_language column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'has_selected_language') THEN
        ALTER TABLE users ADD COLUMN has_selected_language BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
