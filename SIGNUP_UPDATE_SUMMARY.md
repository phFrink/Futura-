# Signup Form Update Summary

## Current Architecture

User authentication uses **Supabase Auth** with all profile data stored in **user_metadata** (no separate database table needed).

## Changes Made

The signup form has been updated to collect more detailed user information:

### Before:
- Full Name (single field)
- Email
- Password
- Phone (optional)

### After:
- **First Name** (required)
- **Last Name** (required)
- Email (required)
- Phone (optional)
- **Address** (optional - new field)
- Password (required)
- Confirm Password (required)

### Data Storage:
- All user data is stored in `auth.users` table with `user_metadata`
- **No separate `client_profiles` table is used**
- User metadata contains: `first_name`, `last_name`, `full_name`, `phone`, `address`, `role`

## Updated Files

### 1. API Route (`src/app/api/auth/signup/route.js`)
- Now accepts `firstName`, `lastName`, and `address`
- Constructs `full_name` from first + last name
- Uses Supabase Admin API to create user
- Stores all fields in `user_metadata` (no separate table)
- Auto-confirms email for better UX

### 2. Signup Page (`src/app/client-signup/page.js`)
- Split full name into two separate fields
- Added address textarea field
- Updated form validation
- Better UX with grid layout for name fields

### 3. Auth Context (`src/contexts/ClientAuthContext.js`)
- Updated signup function signature:
  ```javascript
  signup(firstName, lastName, email, password, phone, address)
  ```
- Profile data accessed via `user.user_metadata`
- No separate profile loading or database queries needed
- Update profile uses `supabase.auth.updateUser()` to update metadata

### 4. Database Schema
- **No separate `client_profiles` table needed**
- All user data stored in Supabase Auth's built-in `user_metadata`
- Appointments table has `user_id` column that references `auth.users(id)`

## Database Setup

### For New Projects
Run only the appointments table SQL file:
```sql
-- File: create_appointments_table.sql
-- This creates the appointments table with user_id reference
```

**No other database tables needed!** User data is stored in Supabase Auth.

### For Existing Projects
If you have an existing `client_profiles` table:
- You can drop it: `DROP TABLE client_profiles;`
- User data will be in `user_metadata` going forward
- The `create_client_profiles_table.sql` and `migrate_client_profiles_table.sql` files are deprecated

## New Form Layout

```
┌─────────────────────────────────────────┐
│           Create Account                │
├─────────────────────────────────────────┤
│  First Name *      Last Name *          │
│  [John      ]      [Doe       ]         │
│                                         │
│  Email Address *                        │
│  [john@example.com              ]       │
│                                         │
│  Phone Number (Optional)                │
│  [+63 XXX XXX XXXX             ]       │
│                                         │
│  Address (Optional)                     │
│  [                              ]       │
│  [  Enter your full address    ]       │
│  [                              ]       │
│                                         │
│  Password *                             │
│  [••••••••                      ]       │
│                                         │
│  Confirm Password *                     │
│  [••••••••                      ]       │
│                                         │
│  [     Create Account     ]             │
└─────────────────────────────────────────┘
```

## Benefits

✅ **Simplified Architecture**: No separate profile table needed - everything in user_metadata
✅ **Better Data Structure**: Separate first/last names for better data management
✅ **Professional Forms**: Industry standard to have separate name fields
✅ **Address Collection**: Can be used for property recommendations
✅ **Secure User Creation**: Server-side Admin API for user creation
✅ **Easy Sorting**: Can sort by last name easily
✅ **Personalization**: Better greeting options ("Hi, John" vs "Hi, John Doe")
✅ **Less Database Queries**: User data loaded with auth session automatically

## User Profile Display

Access user data from `user.user_metadata`:

```javascript
// Get user from context
const { user, profile } = useClientAuth();

// profile is user.user_metadata
console.log(profile.first_name);  // "John"
console.log(profile.last_name);   // "Doe"
console.log(profile.full_name);   // "John Doe"
console.log(profile.phone);       // "+63 912 345 6789"
console.log(profile.address);     // "123 Main St, Manila"

// Informal greeting
`Hi, ${profile.first_name}!`  // "Hi, John!"

// Formal greeting
`Welcome, ${profile.full_name}`  // "Welcome, John Doe"
```

## Testing

Test the new signup flow:

1. **Visit signup page**:
   ```
   http://localhost:3000/client-signup
   ```

2. **Fill in the form**:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john.doe@example.com`
   - Phone: `+63 912 345 6789` (optional)
   - Address: `123 Main St, Manila` (optional)
   - Password: `test123`
   - Confirm Password: `test123`

3. **Submit and verify**:
   - Account should be created
   - Auto-login should work
   - Check Supabase → Authentication → Users
   - Click on the user to view details
   - Check "User Metadata" section:
     - `first_name` = "John"
     - `last_name` = "Doe"
     - `full_name` = "John Doe"
     - `phone` = "+63 912 345 6789"
     - `address` = "123 Main St, Manila"
     - `role` = "home-owner"

## API Request Format

The signup API now expects:

```json
POST /api/auth/signup
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "test123",
  "phone": "+63 912 345 6789",
  "address": "123 Main St, Manila"
}
```

## Database Schema

### Supabase Auth (user_metadata)
User data is stored in Supabase Auth's built-in `user_metadata`:

```javascript
// Created via Admin API in /api/auth/signup
user_metadata: {
  first_name: "John",
  last_name: "Doe",
  full_name: "John Doe",
  phone: "+63 912 345 6789",
  address: "123 Main St, Manila",
  role: "home-owner"
}
```

### Appointments Table
Only table needed in your database:

```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY,
    property_id UUID REFERENCES property_info_tbl(property_id),
    user_id UUID REFERENCES auth.users(id),  -- Links to Supabase Auth
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Notes

- All user data stored in `user_metadata` - no separate table needed
- `full_name` is constructed on signup from `first_name` + `last_name`
- `address` is **optional** - can be empty string
- `first_name` and `last_name` are **required**
- Form validation ensures both names are provided
- User creation happens server-side using Admin API for security
- Email is auto-confirmed for better UX

## Files to Run in Order

### New Installation:
1. `create_appointments_table.sql` - Creates appointments table only
2. Configure `.env` with Supabase credentials including `SUPABASE_SERVICE_ROLE_KEY`

### Existing Installation:
If you have a `client_profiles` table:
1. Optional: `DROP TABLE client_profiles;` - No longer needed
2. Update `create_appointments_table.sql` if you need the `user_id` column

## Deprecated Files

The following files are no longer used:
- `create_client_profiles_table.sql` - Marked as deprecated
- `migrate_client_profiles_table.sql` - Marked as deprecated

These files are kept for reference only.

---

**Last Updated**: 2025-01-14
**Version**: 3.0 - Simplified to use user_metadata only
