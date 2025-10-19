-- =====================================================
-- ALLOW DUPLICATE EMAILS FOR DIFFERENT PROPERTIES
-- Purpose: Enable same homeowner (email) to own multiple properties
-- =====================================================

-- Step 1: Drop the UNIQUE constraint on email
ALTER TABLE buyer_home_owner_tbl
DROP CONSTRAINT IF EXISTS buyer_home_owner_tbl_email_key;

-- Step 2: Create a unique constraint on (email, property_id) combination
-- This allows same email but different properties
ALTER TABLE buyer_home_owner_tbl
ADD CONSTRAINT unique_email_property UNIQUE (email, property_id);

-- Step 3: Update the check constraint to allow NULL property_id
-- (in case you want to create homeowner first, then assign property later)
ALTER TABLE buyer_home_owner_tbl
DROP CONSTRAINT IF EXISTS unique_email_property;

-- Create a partial unique index instead (more flexible)
-- This allows multiple rows with same email but different property_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_email_property
ON buyer_home_owner_tbl (email, property_id);

-- =====================================================
-- NOTES
-- =====================================================
/*
After running this migration:

1. Same email can exist multiple times in buyer_home_owner_tbl
2. Each row must have a unique combination of (email, property_id)
3. Example valid data:
   - john@example.com, Property A
   - john@example.com, Property B
   - mary@example.com, Property A

4. This prevents:
   - john@example.com, Property A (duplicate)
   - john@example.com, Property A (duplicate)

5. You may want to update your application logic to:
   - Display all properties for an email
   - Group homeowners by email in the UI
   - Handle authentication properly if using email as login
*/

-- =====================================================
-- USEFUL QUERIES AFTER MIGRATION
-- =====================================================

-- Find homeowners with multiple properties
/*
SELECT
    email,
    full_name,
    COUNT(*) as property_count,
    STRING_AGG(unit_number, ', ') as units
FROM buyer_home_owner_tbl
GROUP BY email, full_name
HAVING COUNT(*) > 1;
*/

-- Get all properties for a specific email
/*
SELECT
    h.email,
    h.full_name,
    h.unit_number,
    h.property_id,
    pi.property_title,
    h.status,
    h.monthly_dues,
    h.remaining_balance
FROM buyer_home_owner_tbl h
LEFT JOIN property_info_tbl pi ON h.property_id = pi.property_id
WHERE h.email = 'john@example.com'
ORDER BY h.unit_number;
*/
