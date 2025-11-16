# Supabase Migration Setup Guide

This guide will help you set up Supabase for cross-device authentication and data sync.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A new Supabase project created

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase Dashboard
2. Select your project (or create a new one)
3. Navigate to **Settings** → **API**
4. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (long JWT token)

## Step 2: Create Database Tables

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy and paste the contents of `supabase-migration.sql`
4. Click **Run** (or press Ctrl/Cmd + Enter)
5. Verify tables were created by going to **Table Editor** → You should see `profiles` and `sessions` tables

## Step 3: Configure Environment Variables

### For Local Development:

1. Create a `.env.local` file in the `15nov` directory:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Restart your dev server (`npm run dev`)

### For Railway Deployment:

1. In Railway dashboard, go to your project
2. Navigate to **Variables** tab
3. Add these environment variables:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

4. Redeploy your service

## Step 4: Install Dependencies

Run this in the `15nov` directory:

```bash
npm install
```

This will install `@supabase/supabase-js` which was added to `package.json`.

## Step 5: Test the Setup

1. Start your dev server: `npm run dev`
2. Navigate to `/database` route
3. You should see a login page
4. Create an account with email/password
5. After signing in, you should see the database view (initially empty)

## Testing Cross-Device Sync

1. **On Device A:**
   - Sign in to `/database`
   - The database should show your profile

2. **On Device B:**
   - Open the app in a different browser or device
   - Sign in with the same email/password
   - You should see the same data!

## Important Notes

- **Email Confirmation**: By default, Supabase may require email confirmation for new sign-ups. You can disable this in Supabase Dashboard → Authentication → Settings → Email Auth

- **Row Level Security (RLS)**: The SQL migration includes RLS policies that allow any authenticated user to read/write. Adjust these policies in Supabase Dashboard → Authentication → Policies if you need more restrictive access.

- **Old Data**: Data stored in browser `localStorage` won't automatically migrate. You'll need to manually recreate users and sessions in Supabase, or we can create a migration script.

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure `.env.local` exists and has the correct variable names
- Variable names must start with `VITE_` for Vite projects
- Restart your dev server after adding env vars

### "relation does not exist" error
- Make sure you ran the SQL migration in Supabase SQL Editor
- Check that tables `profiles` and `sessions` exist in Table Editor

### Can't sign in / sign up
- Check Supabase Dashboard → Authentication → Settings
- Verify email confirmation is configured correctly
- Check browser console for detailed error messages

## Next Steps

After basic setup works:
1. Update your main app (`App.jsx`, `Login.jsx`, etc.) to use Supabase for session/user management
2. Replace `window.storage` calls with Supabase client calls
3. Test cross-device sync with real data

