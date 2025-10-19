-- Run this in Supabase SQL Editor to check your OTP table

-- 1. Check if table exists and view structure
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'otp_verifications'
ORDER BY ordinal_position;

-- 2. View all OTP records
SELECT
    otp_id,
    email,
    otp_code,
    purpose,
    verified,
    expires_at,
    created_at,
    CASE
        WHEN expires_at > NOW() THEN 'Active'
        ELSE 'Expired'
    END as status
FROM otp_verifications
ORDER BY created_at DESC;

-- 3. Check for the specific code (replace with your code)
-- SELECT * FROM otp_verifications WHERE otp_code = '223163';
