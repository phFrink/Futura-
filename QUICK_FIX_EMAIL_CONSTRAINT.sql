-- =====================================================
-- QUICK FIX: Remove Email Unique Constraint
-- =====================================================
-- Run this in Supabase SQL Editor to allow duplicate emails

-- Remove the unique constraint on email
ALTER TABLE buyer_home_owner_tbl DROP CONSTRAINT IF EXISTS buyer_home_owner_tbl_email_key;

-- Create unique constraint on (email + property_id) combination
-- This allows same email but different properties
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_email_property
ON buyer_home_owner_tbl (email, property_id);

-- Done! You can now create multiple records with same email.
