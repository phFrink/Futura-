-- =====================================================
-- ALTER TABLE: buyer_home_owner_tbl
-- Purpose: Add user_id column to link homeowners with Supabase Auth users
-- =====================================================

-- Step 1: Add user_id column
ALTER TABLE buyer_home_owner_tbl
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_buyer_home_owner_user_id
ON buyer_home_owner_tbl(user_id);

-- Step 3: Add unique constraint (one homeowner per auth user)
-- Uncomment if you want to ensure one homeowner record per user
-- ALTER TABLE buyer_home_owner_tbl
-- ADD CONSTRAINT buyer_home_owner_user_id_unique UNIQUE (user_id);

-- Step 4: Add comment for documentation
COMMENT ON COLUMN buyer_home_owner_tbl.user_id IS 'References auth.users(id) - Links homeowner to Supabase Auth user';

-- =====================================================
-- Enable Row Level Security (RLS)
-- =====================================================

-- Enable RLS on the table
ALTER TABLE buyer_home_owner_tbl ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies
-- =====================================================

-- Policy 1: Allow users to view their own homeowner record
CREATE POLICY "Users can view their own homeowner record"
ON buyer_home_owner_tbl
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Allow users to insert their own homeowner record
CREATE POLICY "Users can insert their own homeowner record"
ON buyer_home_owner_tbl
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Allow users to update their own homeowner record
CREATE POLICY "Users can update their own homeowner record"
ON buyer_home_owner_tbl
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Allow users to delete their own homeowner record
CREATE POLICY "Users can delete their own homeowner record"
ON buyer_home_owner_tbl
FOR DELETE
USING (auth.uid() = user_id);

-- Policy 5: Allow admin users to view all homeowner records
-- You'll need a custom claim or separate admin table to implement this
-- Example using a service role or checking an admin flag:
CREATE POLICY "Admin can view all homeowner records"
ON buyer_home_owner_tbl
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id
    AND raw_app_meta_data->>'role' = 'admin'
  )
);

-- Policy 6: Allow admin users to manage all homeowner records
CREATE POLICY "Admin can manage all homeowner records"
ON buyer_home_owner_tbl
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id
    AND raw_app_meta_data->>'role' = 'admin'
  )
);

-- =====================================================
-- Alternative: Simpler RLS for admin panel (all authenticated users can manage)
-- Comment out the above policies and use these instead if you want simpler access
-- =====================================================

/*
-- Drop the restrictive policies
DROP POLICY IF EXISTS "Users can view their own homeowner record" ON buyer_home_owner_tbl;
DROP POLICY IF EXISTS "Users can insert their own homeowner record" ON buyer_home_owner_tbl;
DROP POLICY IF EXISTS "Users can update their own homeowner record" ON buyer_home_owner_tbl;
DROP POLICY IF EXISTS "Users can delete their own homeowner record" ON buyer_home_owner_tbl;
DROP POLICY IF EXISTS "Admin can view all homeowner records" ON buyer_home_owner_tbl;
DROP POLICY IF EXISTS "Admin can manage all homeowner records" ON buyer_home_owner_tbl;

-- Allow all authenticated users to view all homeowners
CREATE POLICY "Authenticated users can view all homeowners"
ON buyer_home_owner_tbl
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to insert homeowners
CREATE POLICY "Authenticated users can insert homeowners"
ON buyer_home_owner_tbl
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow all authenticated users to update homeowners
CREATE POLICY "Authenticated users can update homeowners"
ON buyer_home_owner_tbl
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow all authenticated users to delete homeowners
CREATE POLICY "Authenticated users can delete homeowners"
ON buyer_home_owner_tbl
FOR DELETE
TO authenticated
USING (true);
*/

-- =====================================================
-- Verify the changes
-- =====================================================

-- Check if column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'buyer_home_owner_tbl'
AND column_name = 'user_id';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'buyer_home_owner_tbl';

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

/*
-- Drop policies
DROP POLICY IF EXISTS "Users can view their own homeowner record" ON buyer_home_owner_tbl;
DROP POLICY IF EXISTS "Users can insert their own homeowner record" ON buyer_home_owner_tbl;
DROP POLICY IF EXISTS "Users can update their own homeowner record" ON buyer_home_owner_tbl;
DROP POLICY IF EXISTS "Users can delete their own homeowner record" ON buyer_home_owner_tbl;
DROP POLICY IF EXISTS "Admin can view all homeowner records" ON buyer_home_owner_tbl;
DROP POLICY IF EXISTS "Admin can manage all homeowner records" ON buyer_home_owner_tbl;

-- Disable RLS
ALTER TABLE buyer_home_owner_tbl DISABLE ROW LEVEL SECURITY;

-- Drop index
DROP INDEX IF EXISTS idx_buyer_home_owner_user_id;

-- Remove column
ALTER TABLE buyer_home_owner_tbl DROP COLUMN IF EXISTS user_id;
*/

-- =====================================================
-- NOTES
-- =====================================================
/*
1. The user_id column references auth.users(id) from Supabase Auth
2. ON DELETE CASCADE ensures homeowner records are deleted if auth user is deleted
3. RLS policies are enabled for security
4. Two RLS approaches provided:
   - Restrictive: Users can only manage their own records
   - Open: All authenticated users can manage all records (for admin panel)
5. Admin policies check for 'admin' role in user metadata
6. Choose the RLS approach that fits your application needs
*/
