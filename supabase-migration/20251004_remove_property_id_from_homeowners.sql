-- =====================================================
-- MIGRATION: Remove property_id from buyer_home_owner_tbl
-- Date: 2025-10-04
-- Purpose: Remove the foreign key relationship and property_id column
-- =====================================================

-- Step 1: Drop indexes that reference property_id
DROP INDEX IF EXISTS idx_homeowner_property_id;
DROP INDEX IF EXISTS idx_homeowner_status_property;

-- Step 2: Drop the foreign key constraint (if it exists)
-- Note: The constraint name may vary, check your database
ALTER TABLE buyer_home_owner_tbl
DROP CONSTRAINT IF EXISTS buyer_home_owner_tbl_property_id_fkey;

ALTER TABLE buyer_home_owner_tbl
DROP CONSTRAINT IF EXISTS homeowner_tbl_property_id_fkey;

-- Step 3: Drop the property_id column
ALTER TABLE buyer_home_owner_tbl
DROP COLUMN IF EXISTS property_id;

-- =====================================================
-- NOTES
-- =====================================================
/*
This migration removes:
1. Indexes: idx_homeowner_property_id and idx_homeowner_status_property
2. Foreign key constraint to property_info_tbl
3. The property_id column itself

WARNING: This is a destructive operation. Make sure to:
- Backup your data before running this migration
- Verify that no critical functionality depends on property_id
- Update all frontend code that references property_id
*/
