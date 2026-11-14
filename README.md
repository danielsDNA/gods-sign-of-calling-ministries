# God's Sign of Calling Revival Ministries

Production website and content-management portal for God's Sign of Calling Revival Ministries. The application uses React, Vite, Express/TypeScript, and Supabase Postgres and Storage.

## Get the production project

The production source repository is `https://github.com/danielsDNA/gods-sign-of-calling-ministries`. Clone it and install dependencies:

```powershell
git clone https://github.com/danielsDNA/gods-sign-of-calling-ministries.git
Set-Location gods-sign-of-calling-ministries
npm install
```

## Local development

Requirements: Node.js 22.22 or later and npm.

```powershell
Copy-Item env.example .env
notepad .env
npm run dev
```

Fill in the required server-side values in `.env` before running database-backed features. This file contains private credentials: never commit it, paste it into a ticket/chat, or add its values to a `VITE_` variable. The `.env*` patterns are ignored by Git; `env.example` contains names and examples only.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the browser application and SSR server bundle |
| `npm run preview` | Preview the production browser build |
| `npm run test` | Run Vitest |
| `npm run type-check` | Run TypeScript checks |
| `npm run lint` | Run ESLint |
| `npm run audit` | Check dependencies for high-severity advisories |
| `npm run admin:create` | Create the first admin account |

## Environment variables

Configure these values in local `.env` and in the hosting provider's environment settings:

| Variable | Exposure | Purpose |
|---|---|---|
| `SUPABASE_DB_URL` | Server only | Postgres connection string |
| `SUPABASE_URL` | Server only | Supabase project URL for server operations |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Privileged Storage operations; never use a `VITE_` prefix |
| `ADMIN_SESSION_SECRET` | Server only | Random secret of at least 32 characters for signing admin sessions |
| `RESEND_API_KEY` | Server only | Sends contact notifications and password-reset codes |
| `RESEND_FROM_EMAIL` | Server only | Verified sender address for outgoing email |
| `VITE_SUPABASE_URL` | Browser-visible | Supabase URL used for signed media uploads |
| `VITE_SUPABASE_ANON_KEY` | Browser-visible | Public Supabase key; configure strict database and Storage policies |
| `VITE_GOOGLE_ANALYTICS_ID` | Browser-visible | Optional Google Analytics measurement ID; analytics loads only after consent |

The Supabase anon key and Google Analytics ID are public identifiers, not secrets. Never expose the service-role key, database password, email API key, or session secret in client code or browser environment variables.

## Database setup and creating the Super Admin

1. Create a Supabase project and keep its database password, service-role key, and connection string private.
2. In the Supabase Dashboard, open **SQL Editor** and apply every `supabase/migrations/*.sql` file in filename order. This includes the initial schema migration. Do this before creating the first admin account.
3. Configure the required environment variables from the table above in your local `.env`. `SUPABASE_DB_URL` must be a PostgreSQL connection string with permission to create an admin record. `ADMIN_SESSION_SECRET` must be a random value of at least 32 characters. Generate one in PowerShell with:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
   ```

   Copy the output directly into `.env`; do not share or commit it.
4. From the repository directory, run the interactive command in the terminal:

   ```powershell
   npm run admin:create
   ```

   Enter the Super Admin email when prompted, then enter and confirm a password of at least 8 characters. Password input is hidden while typing. The command hashes the password and creates the first account with the `owner` (Super Admin) role. Do not put the password on the command line.
5. Start the website with `npm run dev`, then sign in at `http://localhost:5173/admin`. After signing in, use **Editor Accounts** to add other admins and set their permissions.

The **Giving & Fundraising** section is separate from **Site Info**. The Super Admin controls whether the Give button appears, which payment methods are shown, and whether admins with Site Info permission may edit the fundraising purpose, optional picture, and payment details.

`npm run admin:create` reads `.env` and writes to the database selected by `SUPABASE_DB_URL`. Check that URL before running the command, especially if you intend to create a production account. Never point it at a production database by accident.

Admin sessions use signed, `HttpOnly`, `SameSite=Strict` cookies (`Secure` in production). Password-reset codes are one-use and expire after 15 minutes. Login and reset endpoints have per-process request limits; deployments with multiple server instances should add a shared rate-limit store at the edge or use Redis so the limits apply across instances.

The upload API requires an authorized admin session and checks declared file type and size before issuing a short-lived signed upload URL. Keep Supabase Storage policies restrictive; a signed upload URL is a bearer credential and should not be logged or shared.

## Privacy and analytics

The `/privacy` page describes the website's contact forms and cookies. Google Analytics is loaded only after a visitor chooses **Accept cookies**. That choice enables analytics cookies; **Essential cookies only** leaves Google Analytics disabled. Set `VITE_GOOGLE_ANALYTICS_ID` in the hosting provider's environment settings to enable analytics; leave it unset to keep analytics disabled.

## Search indexing

The server generates host-specific `/robots.txt` and `/sitemap.xml` responses. Admin routes are excluded from the sitemap. Public pages should keep their page title, description, canonical URL, and structured data aligned with the actual content.

## Deployment and rollback

The repository includes Vercel configuration. Use preview deployments as a blue/green validation stage:

1. Apply backward-compatible, additive database migrations.
2. Deploy the candidate to a Vercel preview and verify public pages, admin login, contact forms, uploads, and SEO endpoints.
3. Promote the verified deployment to production.
4. If validation fails, restore the previous deployment and then address the issue before promoting another candidate.

Database changes should remain compatible with both the current and previous application deployment during a rollback window. No deployment is fully tested until its production environment variables, Supabase policies, and DNS configuration have been verified.

## Project layout

- `src/pages/` — public pages and admin portal
- `src/components/` — shared UI and editor components
- `src/server/api/` — HTTP API handlers
- `src/server/lib/` — server authentication and utility code
- `src/server/db/` — database schema and connection
- `src/content/` — authored fallback content
- `supabase/migrations/` — database migrations
- `public/` — static browser assets
