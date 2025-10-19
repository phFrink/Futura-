-- DEPRECATED: This file is no longer used
-- ==========================================
-- User data is now stored in Supabase Auth's user_metadata instead of a separate table
-- See: /api/auth/signup for user creation with user_metadata
--
-- This file is kept for reference only and should NOT be executed
-- ==========================================
--
-- OLD APPROACH (DEPRECATED):
-- Create client profiles table to store additional client information
-- Uses Supabase Auth for authentication, this table stores profile data

CREATE TABLE IF NOT EXISTS client_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_profiles_user_id ON client_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_email ON client_profiles(email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_client_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_profiles_updated_at_trigger
    BEFORE UPDATE ON client_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_client_profiles_updated_at();

-- Update appointments table to use auth user_id
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for user appointments
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);

-- Enable RLS
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON client_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON client_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow anyone to insert their own profile (on signup)
CREATE POLICY "Users can insert own profile" ON client_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Update appointments RLS policies
DROP POLICY IF EXISTS "Clients can view own appointments" ON appointments;

CREATE POLICY "Users can view own appointments" ON appointments
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create appointments" ON appointments
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow admin users to view all (adjust based on your admin setup)
CREATE POLICY "Admins can view all appointments" ON appointments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.role = 'admin'
        )
    );

COMMENT ON TABLE client_profiles IS 'Extended profile information for authenticated clients using Supabase Auth';
COMMENT ON COLUMN client_profiles.user_id IS 'References auth.users(id) from Supabase Auth';
