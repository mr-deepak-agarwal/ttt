# Taught To Teach — ERP

Next.js 15 (App Router) + Supabase (Postgres, Auth, Storage) + Tailwind, deployed on Vercel.

Modules: Dashboard · Enquiries → Admission · Students · Batches · Attendance · Fees (invoices, payments, monthly billing) · Teachers · Payroll (admin only) · Library · Certificates.

## 1. Supabase
1. Create a project at supabase.com.
2. SQL Editor → run `supabase/migrations/0001_schema.sql`, then `0002_rls_seed.sql`.
3. Authentication → Users → **Add user** (email + password). **The first user created becomes `admin`**; later users are `staff`.
   Change roles with: `update profiles set role = 'teacher' where id = '<uuid>';`
4. Project Settings → API → copy the Project URL and the `anon` key.

## 2. Run locally
```bash
cp .env.example .env.local   # paste the two values
npm install
npm run dev                  # http://localhost:3000
```

## 3. Deploy on Vercel
Import the repo, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables, deploy.
In Supabase → Authentication → URL Configuration, add your Vercel URL as the Site URL.

## Notes
- Money is stored as integer paise; the UI shows rupees.
- Student numbers look like `26001` (year + running count) and are generated in the database, so they never collide.
- Row Level Security enforces roles: admin = everything, staff = front desk + fees, teacher = read students, mark attendance. Payroll is admin only.
- Photos and certificates go to private Storage buckets and are served via signed URLs.
