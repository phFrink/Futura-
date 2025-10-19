-- =====================================================
-- FIX: Remove Email Unique Constraint
-- Purpose: Allow duplicate emails for different properties
-- =====================================================

-- Step 1: Check if the constraint exists
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'buyer_home_owner_tbl'::regclass
AND conname LIKE '%email%';

-- Step 2: Drop the existing unique constraint on email
-- Try all possible constraint names
ALTER TABLE buyer_home_owner_tbl
DROP CONSTRAINT IF EXISTS buyer_home_owner_tbl_email_key CASCADE;

ALTER TABLE buyer_home_owner_tbl
DROP CONSTRAINT IF EXISTS homeowner_tbl_email_key CASCADE;

ALTER TABLE buyer_home_owner_tbl
DROP CONSTRAINT IF EXISTS unique_email CASCADE;

-- Step 3: Drop any unique index on email column
DROP INDEX IF EXISTS buyer_home_owner_tbl_email_key CASCADE;
DROP INDEX IF EXISTS homeowner_tbl_email_key CASCADE;
DROP INDEX IF EXISTS idx_homeowner_email CASCADE;

-- Step 4: Verify the constraint is removed
SELECT
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'buyer_home_owner_tbl'::regclass;

-- Step 5: Create a unique index on (email, property_id) combination
-- This allows same email but different properties
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_email_property
ON buyer_home_owner_tbl (email, property_id)
WHERE property_id IS NOT NULL;

-- Step 6: Verify the new index is created
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'buyer_home_owner_tbl'
AND indexname = 'idx_unique_email_property';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Email unique constraint removed successfully!';
    RAISE NOTICE '✅ New composite unique index created on (email, property_id)';
    RAISE NOTICE '✅ You can now create multiple records with same email but different properties';
END $$;

-- =====================================================
-- TEST QUERY - Check if duplicate emails are now allowed
-- =====================================================
/*
-- This should now work without errors:
INSERT INTO buyer_home_owner_tbl (
    full_name,
    email,
    phone,
    unit_number,
    property_id,
    status
) VALUES
(
    'Test User',
    'test@example.com',
    '09123456789',
    'A101',
    'your-property-id-uuid-here',
    'active'
),
(
    'Test User',
    'test@example.com',
    '09123456789',
    'B205',
    'another-property-id-uuid-here',
    'active'
);
*/

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
/*
-- To rollback and restore unique email constraint:
DROP INDEX IF EXISTS idx_unique_email_property;

-- Note: This will fail if duplicate emails exist
ALTER TABLE buyer_home_owner_tbl
ADD CONSTRAINT buyer_home_owner_tbl_email_key UNIQUE (email);
*/
