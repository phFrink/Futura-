# OTP Email Setup Guide with Nodemailer

This guide will help you set up email OTP (One-Time Password) functionality for your Futura Homes application using Nodemailer.

---

## 📋 Prerequisites

- ✅ Nodemailer installed (already done)
- ✅ Gmail account or SMTP server credentials
- ✅ Supabase project

---

## 🔧 Step 1: Configure Email Credentials

### Option A: Using Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account:
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Futura Homes"
   - Copy the 16-character password

3. **Add to `.env` file**:
   ```env
   # Email Configuration (Add these lines)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   ```

### Option B: Using Other Email Services

#### Outlook/Hotmail:
```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```
Note: In `src/lib/email.js`, change `service: 'gmail'` to `service: 'outlook'`

#### Custom SMTP:
```env
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your-password
```

For custom SMTP, update `src/lib/email.js`:
```javascript
export const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};
```

---

## 🗄️ Step 2: Create Database Table

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS otp_verifications (
  otp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'verification',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_otp_email ON otp_verifications(email);
CREATE INDEX idx_otp_expires ON otp_verifications(expires_at);
```

---

## 📝 Step 3: Update Your `.env` File

Your `.env` file should now look like this:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wwupnerwfrecqqrdenxi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Email Configuration (ADD THESE)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

---

## 🧪 Step 4: Test the OTP System

### Test Sending OTP:

```javascript
// Example API call
const response = await fetch('/api/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    purpose: 'inquiry verification'
  })
});

const result = await response.json();
console.log(result); // { success: true, message: "OTP sent successfully" }
```

### Test Verifying OTP:

```javascript
const response = await fetch('/api/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    otp_code: '123456'
  })
});

const result = await response.json();
console.log(result); // { success: true, message: "OTP verified successfully" }
```

---

## 🎯 Step 5: Integration Example

Here's how to use OTP in your inquiry form:

```javascript
// 1. User enters email and clicks "Send OTP"
const handleSendOTP = async () => {
  const response = await fetch('/api/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: inquiryForm.email,
      purpose: 'inquiry verification'
    })
  });

  const result = await response.json();
  if (result.success) {
    toast.success('OTP sent to your email!');
    setShowOTPInput(true);
  }
};

// 2. User enters OTP and submits
const handleVerifyAndSubmit = async () => {
  // Verify OTP first
  const verifyResponse = await fetch('/api/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: inquiryForm.email,
      otp_code: otpCode
    })
  });

  const verifyResult = await verifyResponse.json();

  if (verifyResult.success) {
    // OTP verified, now submit inquiry
    await handleInquirySubmit();
  } else {
    toast.error('Invalid OTP code');
  }
};
```

---

## 🔒 Security Best Practices

1. **Never expose OTP in production** - Remove debug logs
2. **Use HTTPS only** - Ensure your site uses SSL
3. **Rate limiting** - Add rate limiting to prevent spam
4. **Expiration** - OTPs expire after 5 minutes
5. **One-time use** - OTPs are deleted after verification

---

## ⚠️ Troubleshooting

### Email not sending?

1. **Check Gmail credentials**:
   - Ensure 2FA is enabled
   - Use App Password, not regular password
   - Check EMAIL_USER and EMAIL_PASSWORD in `.env`

2. **Check console logs**:
   - Look for "✅ Email sent successfully" or "❌ Email sending failed"
   - Check for authentication errors

3. **Gmail security**:
   - Sometimes Gmail blocks first attempts
   - Check your Gmail security alerts
   - Allow "Less secure apps" if needed (not recommended for production)

4. **Port issues**:
   - Gmail uses port 587 or 465
   - Check your firewall settings

### OTP not verifying?

1. Check if OTP is expired (5 minutes)
2. Ensure email matches exactly
3. Check for typos in OTP code
4. Look at database to see if OTP was created

---

## 📊 Database Queries for Testing

```sql
-- View all OTPs
SELECT * FROM otp_verifications ORDER BY created_at DESC;

-- View active OTPs
SELECT * FROM otp_verifications
WHERE expires_at > NOW() AND verified = false;

-- Delete all OTPs (for testing)
DELETE FROM otp_verifications;

-- Delete expired OTPs
DELETE FROM otp_verifications WHERE expires_at < NOW();
```

---

## 🚀 Production Considerations

1. **Use a professional email service**:
   - Consider SendGrid, Mailgun, or AWS SES for production
   - Gmail has daily sending limits (500 emails/day)

2. **Add rate limiting**:
   - Limit OTP requests per email (e.g., 3 per hour)
   - Use libraries like `express-rate-limit`

3. **Monitor email delivery**:
   - Track email sending success/failure
   - Monitor bounce rates

4. **Customize email design**:
   - Match your brand colors
   - Add company logo
   - Improve mobile responsiveness

---

## 📚 Files Created

- ✅ `src/lib/email.js` - Email configuration and sending logic
- ✅ `src/app/api/send-otp/route.js` - API to send OTP
- ✅ `src/app/api/verify-otp/route.js` - API to verify OTP
- ✅ `otp_table.sql` - Database schema

---

## 🎉 You're All Set!

Your OTP system is ready to use. Don't forget to:
1. Add EMAIL_USER and EMAIL_PASSWORD to `.env`
2. Create the `otp_verifications` table in Supabase
3. Test sending and verifying OTPs
4. Integrate into your inquiry form

Need help? Check the troubleshooting section above!
