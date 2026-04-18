# Gaming Cafe

A Next.js app for a gaming cafe customer site and protected staff dashboard.

## What changed

- Added protected admin login with email/password auth.
- Locked `/dashboard` behind middleware and server-side role checks.
- Removed the admin dependency on Supabase magic links for local login.
- Cleaned customer/admin UI issues so lint passes.
- Hardened the Prisma schema for money fields and linked auth users to customers.

## Required environment variables

Copy `.env.example` to `.env` and fill in:

```bash
DATABASE_URL=
SHADOW_DATABASE_URL=
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
```

Admin sign-in uses the email and password from `.env`. The session is stored in a signed, HTTP-only cookie using `ADMIN_SESSION_SECRET`.

For production, change `ADMIN_PASSWORD` and set `ADMIN_SESSION_SECRET` to a long random value before deploying.

## Local development

```bash
npx prisma dev -d -n gaming-cafe
npm run db:setup
npm install
npm run lint
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the customer site and [http://localhost:3000/login](http://localhost:3000/login) for admin sign-in.

## Database notes

For local development, this project uses a Prisma dev Postgres server plus `npm run db:setup` to provision the schema.

For production, do not use the local Prisma dev database. Point `DATABASE_URL` to a real managed Postgres instance such as Supabase Postgres, Neon, Railway, or Render Postgres, then apply proper Prisma migrations in CI/CD.

## Production checklist

- Change the default admin password and use a strong `ADMIN_SESSION_SECRET`.
- Replace the local `DATABASE_URL` with a managed Postgres database.
- Create and run Prisma migrations against production instead of using `db:setup`.
- Add payment provider integration before enabling checkout.
