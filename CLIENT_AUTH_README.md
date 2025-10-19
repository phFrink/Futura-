# Client Authentication System - Complete Guide

This document provides a complete overview of the client authentication system for the Futura Homes property listing platform.

## 🎯 Overview

The authentication system allows clients to:
- Browse properties without authentication
- Create an account to book property tours
- Login and manage their bookings
- View their profile information

## 🔐 Authentication Method

**Supabase Authentication** with Admin API for secure user creation:
- Server-side user creation using Supabase Admin API
- Client-side login/logout using Supabase Auth
- Row Level Security (RLS) for data protection
- Automatic email confirmation (no verification needed)

## 📁 File Structure

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── signup/
│   │           └── route.js              # Server-side signup API
│   ├── client-home/
│   │   └── page.js                       # Main landing page (protected booking)
│   ├── client-login/
│   │   └── page.js                       # Login page
│   ├── client-signup/
│   │   └── page.js                       # Signup page
│   └── page.js                           # Root page (wrapped with auth provider)
│
├── contexts/
│   └── ClientAuthContext.js              # Authentication context & logic
│
└── Database/
    ├── create_client_profiles_table.sql  # SQL for profiles table
    └── create_appointments_table.sql     # SQL for appointments (updated)
```

## 🗄️ Database Setup

### 1. Run SQL Migrations

Execute these SQL files in your Supabase SQL Editor:

#### A. Client Profiles Table
```bash
File: create_client_profiles_table.sql
```

This creates:
- `client_profiles` table (user profiles)
- RLS policies for secure access
- Triggers for updated_at timestamp
- Indexes for performance

#### B. Update Appointments Table
The appointments table is updated to include `user_id` field linking to authenticated users.

### 2. Verify Tables

After running migrations, verify in Supabase Dashboard:
- Go to **Table Editor**
- Check for:
  - `client_profiles` table
  - `appointments` table with `user_id` column

## 🚀 How to Use

### For Clients (End Users)

#### 1. Browse Properties (No Auth Required)
```
Visit: http://localhost:3000/
- View all available properties
- Search and filter
- View property details
```

#### 2. Create Account
```
Click: "Login" → "Sign Up"
Or visit: http://localhost:3000/client-signup

Fill in:
- Full Name
- Email Address
- Password (min 6 characters)
- Phone Number (optional)

Result: Account created + Auto-login
```

#### 3. Login
```
Visit: http://localhost:3000/client-login

Enter:
- Email
- Password

Result: Logged in + Redirected to properties
```

#### 4. Book a Property Tour
```
Requirement: Must be logged in

Steps:
1. Find a property you like
2. Click "Book Tour" button
3. If not logged in → Redirected to login
4. After login → Automatically opens booking form
5. Your info is pre-filled (from profile)
6. Select date & time
7. Add optional message
8. Submit booking
```

### For Developers

#### Authentication Context Usage

```javascript
import { useClientAuth } from '@/contexts/ClientAuthContext';

function MyComponent() {
  const {
    user,              // Current user object
    profile,           // User profile data
    isAuthenticated,   // Boolean: is user logged in?
    loading,           // Boolean: is auth loading?
    login,             // Function: login(email, password)
    logout,            // Function: logout()
    signup             // Function: signup(name, email, password, phone)
  } = useClientAuth();

  // Use authentication data
  if (isAuthenticated) {
    return <div>Welcome, {profile?.full_name}!</div>;
  }

  return <div>Please log in</div>;
}
```

## 🔒 Security Features

### 1. Row Level Security (RLS)
```sql
-- Users can only view their own profile
CREATE POLICY "Users can view own profile" ON client_profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Users can only view their own appointments
CREATE POLICY "Users can view own appointments" ON appointments
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
```

### 2. Server-Side User Creation
- Uses Supabase Admin API (service role key)
- Validation happens on server
- Credentials never exposed to client
- Auto email confirmation

### 3. Password Security
- Passwords hashed by Supabase Auth
- Never stored in plain text
- Secure password reset flow (can be added)

## 📊 User Flow Diagrams

### Signup Flow
```
Client → /client-signup
   ↓
Fill form (name, email, password, phone)
   ↓
Submit → API Route (/api/auth/signup)
   ↓
Server: Validate input
   ↓
Server: Create user (Admin API)
   ↓
Server: Create profile
   ↓
Client: Auto-login
   ↓
Redirect to properties
```

### Booking Flow
```
Browse Properties (No auth required)
   ↓
Click "Book Tour"
   ↓
Is Authenticated?
   ├─ NO  → Redirect to /client-login
   │          ↓
   │       Login/Signup
   │          ↓
   │       Save property in session
   │          ↓
   │       Redirect back
   │
   └─ YES → Open booking modal
              ↓
           Pre-fill user info
              ↓
           Select date/time
              ↓
           Submit appointment
              ↓
           Save to database
              ↓
           Show success message
```

## 🎨 UI Components

### Navigation Bar
- **Not Logged In**: Shows "Login" button
- **Logged In**: Shows username + "Logout" button

### Property Cards
- "View Details" - Always available
- "Book Tour" - Requires authentication

### Appointment Modal
- Only opens if authenticated
- Pre-fills user information
- Date picker (only future dates)
- Time picker
- Optional message field

## 🧪 Testing

### Test Signup
```bash
1. Visit http://localhost:3000/client-signup
2. Fill in:
   - Name: John Doe
   - Email: john@example.com
   - Password: test123
   - Phone: +63 XXX XXX XXXX
3. Click "Create Account"
4. Should auto-login and redirect
```

### Test Login
```bash
1. Visit http://localhost:3000/client-login
2. Enter credentials
3. Click "Log In"
4. Should redirect to properties
```

### Test Booking
```bash
1. Browse properties (logged out)
2. Click "Book Tour"
3. Should redirect to login
4. Login with credentials
5. Should redirect back
6. Click "Book Tour" again
7. Modal should open
8. Info should be pre-filled
9. Select date/time
10. Submit
11. Should show success message
```

### Verify in Supabase
```bash
Dashboard → Authentication → Users
- Should see new user

Dashboard → Table Editor → client_profiles
- Should see user profile

Dashboard → Table Editor → appointments
- Should see booking with user_id
```

## ⚠️ Important Notes

### Environment Variables
```env
# Required in .env file
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For Admin API
```

### Service Role Key
- ✅ Already configured in your .env
- ⚠️ Keep it secret (never commit to Git)
- 🔒 Only used in server-side code

### Email Configuration
- Users are auto-confirmed (no email verification needed)
- To enable email verification:
  1. Go to Supabase Dashboard
  2. Authentication → Settings
  3. Enable email confirmation
  4. Update API route to remove `email_confirm: true`

## 🐛 Troubleshooting

### "Missing service role key"
- Check `.env` has `SUPABASE_SERVICE_ROLE_KEY`
- Restart dev server

### "Email already registered"
- Email is in use
- Try different email or login

### "Unauthorized" error
- Check service role key is correct
- Verify it's the `service_role` key, not `anon` key

### User can't login after signup
- Check Supabase Dashboard → Users
- Verify user exists
- Check email is confirmed

### Appointments not saving
- Check user is authenticated
- Verify `user_id` column exists in appointments table
- Check RLS policies allow insert

## 📝 API Endpoints

### POST /api/auth/signup
Creates a new user account

**Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "test123",
  "phone": "+63 XXX XXX XXXX"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "john@example.com"
  }
}
```

**Response (Error):**
```json
{
  "error": "Email already registered"
}
```

## 🔄 Future Enhancements

Consider adding:
- [ ] Email verification flow
- [ ] Password reset functionality
- [ ] Social login (Google, Facebook)
- [ ] User profile editing
- [ ] Appointment history page
- [ ] Email notifications for bookings
- [ ] SMS notifications
- [ ] Profile picture upload
- [ ] Save favorite properties

## 📞 Support

If you encounter issues:
1. Check this README
2. Check SUPABASE_ADMIN_SETUP.md
3. Review browser console for errors
4. Check server logs
5. Verify Supabase Dashboard → Logs

## ✅ Checklist

Before going live:
- [ ] Run all SQL migrations
- [ ] Verify service role key in .env
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test booking flow
- [ ] Verify RLS policies
- [ ] Test on different devices
- [ ] Set up email templates (if using email verification)
- [ ] Configure auth settings in Supabase
- [ ] Set up monitoring/logging

---

**Last Updated**: 2025-01-14
**Version**: 1.0
