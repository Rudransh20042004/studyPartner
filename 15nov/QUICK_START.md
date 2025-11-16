# Quick Start: Setting Up Supabase

## Step 1: Get Your Supabase Credentials

1. **Create a Supabase Account** (if you don't have one):
   - Go to https://supabase.com
   - Click "Start your project" or "Sign up"
   - Sign up with GitHub or email

2. **Create a New Project**:
   - Click "New Project"
   - Fill in:
     - **Name**: e.g., "studyPartner"
     - **Database Password**: (save this - you'll need it)
     - **Region**: Choose closest to you
   - Click "Create new project" (takes 1-2 minutes)

3. **Get Your API Keys**:
   - Wait for project to finish setting up
   - In your project dashboard, go to **Settings** (gear icon on left sidebar)
   - Click **API** under Project Settings
   - You'll see:
     - **Project URL** (e.g., `https://abcdefghijklmnop.supabase.co`)
     - **anon public** key (a long JWT token starting with `eyJ...`)

## Step 2: Add Credentials to .env.local

1. Open `.env.local` in the `15nov` directory
2. Replace the placeholders:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   ```
   With your actual Project URL:
   ```
   VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   ```

3. Replace:
   ```
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   With your actual anon key:
   ```
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Step 3: Create Database Tables

1. In Supabase Dashboard, click **SQL Editor** (left sidebar)
2. Click **New query**
3. Open `supabase-migration.sql` from this project
4. Copy ALL the SQL code from that file
5. Paste it into the Supabase SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

**Verify tables were created:**
- Click **Table Editor** (left sidebar)
- You should see two tables: `profiles` and `sessions`

## Step 4: Restart Dev Server

The dev server needs to be restarted to pick up the new environment variables.

**If the server is running:**
1. In the terminal where `npm run dev` is running, press **Ctrl+C** to stop it
2. Run `npm run dev` again

**Or start fresh:**
```bash
cd 15nov
npm run dev
```

## Step 5: Test It!

1. Open browser to http://localhost:5173
2. Navigate to `/database` (e.g., http://localhost:5173/database)
3. You should see a login page
4. Click "Need an account? Create one"
5. Enter:
   - Email: `test@example.com`
   - Password: (any password, 6+ characters)
6. Click "Create account"
7. After signup, you should see the Database View (empty at first)

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure `.env.local` exists in `15nov` directory
- Check that variable names are exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart the dev server after creating/editing `.env.local`

### "relation does not exist" or "table not found" error
- Make sure you ran the SQL migration in Supabase SQL Editor
- Check Table Editor to verify `profiles` and `sessions` tables exist

### Can't sign up / "Email confirmation required"
- Supabase may require email confirmation by default
- To disable: Supabase Dashboard → Authentication → Settings → Email Auth → Toggle off "Enable email confirmations"

### Still having issues?
- Check browser console (F12) for detailed error messages
- Check terminal where dev server is running for errors
- Verify your credentials are correct in `.env.local`

