# Leave Tracker — Setup Guide
## Stack: Next.js · Supabase · Vercel · Resend

---

## 1. Supabase Setup

1. Go to https://supabase.com and create a new project
2. Once created, go to **SQL Editor** and paste the entire contents of `supabase-schema.sql` — click **Run**
3. Go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
4. Go to **Authentication → URL Configuration** and set:
   - Site URL: `https://leave-ot.vercel.app`
   - Redirect URLs: `https://leave-ot.vercel.app/**`

---

## 2. Resend Setup (email notifications)

1. Go to https://resend.com and sign up
2. Add and verify your domain (`oxfordtutors.com`)
3. Create an API key → `RESEND_API_KEY`

---

## 3. GitHub Setup

1. Create a new **private** repository on GitHub called `leave-tracker`
2. In your terminal:
   ```bash
   cd leave-tracker
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/leave-tracker.git
   git push -u origin main
   ```

---

## 4. Vercel Setup

1. Go to https://vercel.com → **Add New Project**
2. Import your `leave-tracker` GitHub repository
3. Add these **Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL        = https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY   = your-anon-key
   SUPABASE_SERVICE_ROLE_KEY       = your-service-role-key
   RESEND_API_KEY                  = re_your_key
   NEXT_PUBLIC_APP_URL             = https://leave-ot.vercel.app
   ```
4. Click **Deploy** — Vercel auto-detects Next.js

---

## 5. Create the first admin user

1. In Supabase → **Authentication → Users** → **Invite user**
2. Enter your email (e.g. `david.smith@oxfordtutors.com`)
3. Accept the invite email and set a password
4. In **SQL Editor**, run:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID';
   ```
   (Find your user ID in Authentication → Users)

---

## 6. Adding employees going forward

Once you're logged in as admin:
- Go to **Employees → Add Employee**
- Enter their name, `firstname.surname@oxfordtutors.com` email, and entitlement
- They'll receive an invite email from Supabase to set their password
- No manual spreadsheet setup needed!

---

## Deploying updates

Any time you push to the `main` branch on GitHub, Vercel automatically redeploys. No manual steps needed.
