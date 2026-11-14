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
| `VITE_PUBLIC_URL` | Browser-visible | Canonical public website origin, for example `https://example.org` |
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

## Deploying to Vercel

The repository includes a Vercel Express function configuration (`vercel.json`). In the Vercel project:

1. Set the **Root Directory** to the repository root, where `package.json` and `vercel.json` live. Use `npm run build` as the build command; the repository config includes the generated client and SSR bundle in the function.
2. Set the Node.js version to **22.x**. The `package.json` engine range starts at Node 22.22 and currently permits future major versions; pinning the deployed major avoids an untested automatic upgrade.
3. Add environment variables in **Project Settings → Environment Variables** for each target you deploy to (Production, Preview, and Development as needed). Variables are project-specific; another Vercel project using the same Supabase database does not share its settings.
4. Apply all SQL migrations to the Supabase project referenced by `SUPABASE_DB_URL`, then deploy. Changes to Vercel environment variables take effect only in a new deployment. Redeploy after changing them; `VITE_` variables are embedded in the browser build.
5. Test the deployment's public pages, `/api/health`, `/admin`, admin login, contact forms, uploads, `/robots.txt`, and `/sitemap.xml`. Promote a validated Preview deployment rather than testing only on Production.

### Supabase and admin-login timeouts

The admin login and session APIs query Postgres directly through **`SUPABASE_DB_URL`**. Setting only `SUPABASE_URL`, `VITE_SUPABASE_URL`, or Supabase API keys is not enough to connect the admin portal to its database. Confirm that the `SUPABASE_DB_URL` value in the *specific Vercel project and deployment environment* points to the intended Supabase project.

For Vercel, use the PostgreSQL connection-pooler URI copied from the Supabase dashboard's **Connect** panel (transaction pooler is suitable here). Do not construct the host or username by hand. Keep the port, username, database, and SSL-compatible URI as Supabase provides them; URL-encode special characters in the database password. The code requires SSL and uses a 20-second database connect timeout on Vercel.

Use this sequence to diagnose a timeout:

1. Open `/api/health` on the deployed host. A `200` means the app function responds; this endpoint does **not** check database connectivity.
2. In browser developer tools, inspect the `/api/admin/me` and `/api/admin/login` requests for their status and elapsed time. The admin browser waits up to 25 seconds for a database-backed request; a timeout there is not proof that the password is wrong.
3. In **Vercel → Project → Deployments → Function Logs**, inspect the request at the same timestamp. Look for a missing `SUPABASE_DB_URL`, database DNS/connect timeout, password authentication failure, or a missing-table/migration error. Never paste connection strings, passwords, service-role keys, or session secrets into logs, tickets, or chat.
4. Verify the deployment has the needed variables in the correct Vercel environment, the database is active, the pooler URI belongs to the intended Supabase project, and all migrations have been applied to that database. After correcting a variable, redeploy and test that deployment again.

The install output can contain warnings that are unrelated to Supabase: the broad Node engine range, deprecated-package notices, or unknown npm configuration keys do not by themselves indicate a failed build or database connection. The `install-scripts` warning does require checking the remainder of the build log: if a later error says an install script was skipped or an esbuild binary is unavailable, address that specific build error. The log excerpt ending during dependency installation is not enough to determine whether the build succeeded; check for Vercel's final build/deployment status.

### Deploying on other Node.js platforms

This application needs a **Node.js server** for its Express APIs and SSR; a static-only host is not sufficient. For a platform that supports a persistent Node web service (for example, Render, Railway, or a VPS), configure:

| Setting | Value |
|---|---|
| Node.js | 22.x (22.22 or later) |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Start command | `node dist/server.bundle.mjs` |
| Health check | `/api/health` |

Set the same server-side and browser build variables described above in that platform's environment settings. Let the host provide `PORT` (the server also defaults to `3000`) and set `NODE_ENV=production`. Ensure the built `dist/client` directory is retained alongside `dist/server.bundle.mjs`. Do not set Vercel-specific variables on another host. Before switching platforms, confirm it supports the app's required Node version, outbound TLS Postgres connections to the Supabase pooler, long-running Node processes, and your desired deployment region.

### Rollback

1. Apply backward-compatible, additive database migrations before deploying code that uses them.
2. Validate the candidate deployment, including admin login, contact forms, uploads, and SEO endpoints.
3. Promote the verified deployment to production.
4. If validation fails, restore the previous deployment and investigate the function logs before promoting another candidate.

Keep database changes compatible with both the current and previous application deployment during a rollback window. No deployment is fully tested until its environment variables, Supabase policies, and DNS configuration have been verified.

## Project layout

- `src/pages/` — public pages and admin portal
- `src/components/` — shared UI and editor components
- `src/server/api/` — HTTP API handlers
- `src/server/lib/` — server authentication and utility code
- `src/server/db/` — database schema and connection
- `src/content/` — authored fallback content
- `supabase/migrations/` — database migrations
- `public/` — static browser assets
