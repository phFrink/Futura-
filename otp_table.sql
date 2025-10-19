-- Create OTP Verifications Table
CREATE TABLE IF NOT EXISTS otp_verifications (
  otp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'verification',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_otp_email ON otp_verifications(email);
CREATE INDEX idx_otp_expires ON otp_verifications(expires_at);

-- Optional: Create a function to automatically delete expired OTPs
CREATE OR REPLACE FUNCTION delete_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_verifications
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Schedule automatic cleanup (run daily)
-- You can set this up in Supabase Dashboard -> Database -> Extensions -> pg_cron
-- SELECT cron.schedule('delete-expired-otps', '0 0 * * *', 'SELECT delete_expired_otps();');
