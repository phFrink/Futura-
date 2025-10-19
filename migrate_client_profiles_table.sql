-- DEPRECATED: This file is no longer used
-- ==========================================
-- User data is now stored in Supabase Auth's user_metadata instead of a separate table
-- The client_profiles table is no longer needed
--
-- This file is kept for reference only and should NOT be executed
-- ==========================================
--
-- OLD APPROACH (DEPRECATED):
-- Migration script to update existing client_profiles table
-- Run this if you already have the client_profiles table created

-- Step 1: Add new columns if they don't exist
ALTER TABLE client_profiles
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- Step 2: Populate first_name and last_name from existing full_name
-- This splits the full_name by space and assigns first word to first_name, rest to last_name
UPDATE client_profiles
SET
    first_name = SPLIT_PART(full_name, ' ', 1),
    last_name = CASE
        WHEN full_name LIKE '% %' THEN SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
        ELSE ''
    END
WHERE first_name IS NULL OR last_name IS NULL;

-- Step 3: Make first_name and last_name NOT NULL after populating
ALTER TABLE client_profiles
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

-- Step 4: Drop the old full_name column if it exists
ALTER TABLE client_profiles
DROP COLUMN IF EXISTS full_name;

-- Step 5: Add full_name as a generated column
ALTER TABLE client_profiles
ADD COLUMN full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED;

-- Step 6: Verify the changes
-- SELECT * FROM client_profiles LIMIT 5;

COMMENT ON COLUMN client_profiles.first_name IS 'User first name';
COMMENT ON COLUMN client_profiles.last_name IS 'User last name';
COMMENT ON COLUMN client_profiles.full_name IS 'Auto-generated from first_name + last_name';
COMMENT ON COLUMN client_profiles.address IS 'User full address';
