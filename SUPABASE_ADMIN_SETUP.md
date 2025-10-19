# Supabase Admin API Setup

This guide explains how to set up the Supabase Service Role Key for user creation via Admin API.

## Why Use Admin API?

Using Supabase Admin API for user creation is more secure because:
- User creation happens server-side (not exposed to client)
- Better error handling and validation
- Can auto-confirm email addresses
- More control over user creation process
- Prevents client-side manipulation

## Setup Instructions

### 1. Get Your Service Role Key

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** (gear icon in sidebar)
4. Click on **API**
5. Scroll down to **Project API keys**
6. Copy the **`service_role`** key (NOT the anon key)

⚠️ **Important**: The service role key has admin privileges. Never expose it in client-side code or commit it to version control!

### 2. Add to Your .env File

Open your `.env` file and add the service role key:

```env
# Existing variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Add this new line (Service Role Key - KEEP SECRET!)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Restart Your Development Server

After adding the environment variable, restart your dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## Security Best Practices

✅ **DO:**
- Keep the service role key in `.env` file only
- Add `.env` to `.gitignore` (should already be there)
- Use the service role key only in server-side code (API routes)
- Rotate the key if it's accidentally exposed

❌ **DON'T:**
- Never use service role key in client-side code
- Never commit it to Git
- Never share it publicly
- Never log it in console

## How It Works

### Signup Flow:

1. **Client** → Sends signup data to `/api/auth/signup`
2. **API Route** → Uses Admin API to create user
3. **API Route** → Creates client profile
4. **API Route** → Returns success
5. **Client** → Logs in the user automatically

### Benefits:

- **Auto Email Confirmation**: Users don't need to verify email
- **Better Validation**: Server-side validation before creating user
- **Error Handling**: Proper error messages (duplicate email, etc.)
- **Profile Creation**: Profile created in same transaction
- **Security**: Credentials never exposed to client

## Troubleshooting

### Error: "Missing service role key"
- Make sure you added `SUPABASE_SERVICE_ROLE_KEY` to `.env`
- Restart your development server

### Error: "Unauthorized"
- Check that you copied the correct service role key
- Make sure it's the `service_role` key, not the `anon` key

### Error: "Email already registered"
- The email is already in use
- User should try logging in instead

## Testing

To test the signup flow:

1. Visit `http://localhost:3000/client-signup`
2. Fill in the signup form
3. Click "Create Account"
4. You should be automatically logged in
5. Check Supabase Dashboard → Authentication → Users to see the new user

## Environment Variables Summary

```env
# Public variables (safe to expose in client)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key

# Private variable (NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
```

## Need Help?

If you encounter issues:
1. Check the browser console for errors
2. Check the terminal/server logs
3. Verify all environment variables are set correctly
4. Make sure you've run the SQL migrations
5. Check Supabase Dashboard → Logs for any errors
