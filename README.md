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

MTN and Airtel giving options can show a merchant/MoMo code, mobile number, and registered name. Add only the exact payment details approved by the church. The owner can separately enable a one-time first-visit fundraiser popup in **Giving & Fundraising**, and an upcoming-event popup in **Events**. Each published upcoming event and fundraiser awareness message appears at most once per browser; the regular Give button/modal remains available when enabled.

`npm run admin:create` reads `.env` and writes to the database selected by `SUPABASE_DB_URL`. Check that URL before running the command, especially if you intend to create a production account. Never point it at a production database by accident.

Admin sessions use signed, `HttpOnly`, `SameSite=Strict` cookies (`Secure` in production). Password reset sends a one-use code that expires after 15 minutes. Configure `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL` to deliver reset codes and admin replies; see [Email delivery and admin responses](#email-delivery-and-admin-responses). Login and reset endpoints have per-process request limits; deployments with multiple server instances should add a shared rate-limit store at the edge or use Redis so the limits apply across instances.

Admins and editors can review and respond to contact and prayer requests in **Requests**. Contact responses and prayer email replies are sent through Resend; prayer status and internal notes can also be updated. Only Super Admins can move requests to **Trash**. This is a soft-delete, so test submissions can be removed from the inbox and restored from the Super Admin Trash view.

The upload API requires an authorized admin session and checks declared file type and size before issuing a short-lived signed upload URL. Keep Supabase Storage policies restrictive; a signed upload URL is a bearer credential and should not be logged or shared.

## Email delivery and admin responses

1. Create a Resend account and verify the sending domain used by the church. Complete the DNS records Resend requires before sending from that domain.
2. Create an API key in Resend and set `RESEND_API_KEY` in the hosting project's server-side environment settings. Set `RESEND_FROM_EMAIL` to a sender address on the verified domain, such as `Church Website <website@example.org>`.
3. Configure these values for each Vercel environment that needs email (Production, Preview, and Development), or in the matching environment manager on another host. Keep both values server-only; neither should have a `VITE_` prefix.
4. Submit a test contact or prayer request using an address you control. Sign in at `/admin`, open **Requests**, write a reply, and choose **Send reply** or **Send email reply**. Check the recipient inbox and Resend delivery logs.

If Resend is unset or rejects the email, the admin UI reports that the reply could not be sent; it does not mark the request as replied. Contact-form notification recipients can be set by the Super Admin in **Site Info → Contact notification email**. Password reset uses the same Resend configuration. Reset codes are one-use and valid for 15 minutes; the request endpoint is limited to 3 attempts per 15 minutes per server process. Sign-in is limited to 5 attempts per 15 minutes per server process. These in-memory limits are not shared across multiple instances.

## Privacy and analytics

The `/privacy` page describes the website's contact forms and cookies. Google Analytics is loaded only after a visitor chooses **Accept cookies**. That choice enables analytics cookies; **Essential cookies only** leaves Google Analytics disabled. Set `VITE_GOOGLE_ANALYTICS_ID` in the hosting provider's environment settings to enable analytics; leave it unset to keep analytics disabled.

### Google Analytics 4 setup

1. In Google Analytics, create or select a GA4 property and add a **Web** data stream for the production website.
2. Copy the measurement ID (`G-...`) into `VITE_GOOGLE_ANALYTICS_ID` for the Vercel **Production** environment (and Preview only if you intend to track preview traffic).
3. Redeploy after changing the variable because `VITE_` values are compiled into the browser bundle.
4. On the site, choose **Accept cookies** to enable Google Analytics, then confirm visits in the GA4 Realtime report. Choosing **Essential cookies only** keeps Google Analytics disabled.

Vercel Web Analytics is an additional, separate service from Google Analytics. This is a Vite/React application, not Next.js, so use the React entry point rather than the `/next` import:

```bash
npm i @vercel/analytics
```

```tsx
import { Analytics } from '@vercel/analytics/react';
```

Render `<Analytics />` once in the application root (as in `src/App.tsx`) and enable Web Analytics in the Vercel project dashboard. The Next.js-specific `@vercel/analytics/next` entry point is not appropriate for this app. Vercel Analytics does not replace the consent-controlled GA4 integration; disclose the analytics services in the privacy notice and check current provider requirements for your jurisdiction.

## Search indexing

The server generates host-specific `/robots.txt` and `/sitemap.xml` responses. Admin routes are excluded from the sitemap. Set `VITE_PUBLIC_URL` to the canonical production origin and redeploy after changing it. Give every public page a distinct, descriptive title, meta description, one clear main heading, useful image alt text, and accurate internal links. Keep structured data consistent with visible page content; do not add private, draft, or admin URLs to the sitemap.

### Submit the sitemap to Google Search Console

1. Deploy the site on its final HTTPS domain and set `VITE_PUBLIC_URL` to that exact canonical origin, for example `https://example.org` (no trailing slash).
2. Open `https://example.org/robots.txt` and verify it responds successfully and lists the sitemap. Open `https://example.org/sitemap.xml` and verify it returns valid XML with only public canonical pages.
3. In [Google Search Console](https://search.google.com/search-console), add a **Domain** property for the domain (recommended) or a URL-prefix property for the exact HTTPS origin.
4. For a Domain property, copy the TXT verification record Google gives you into the domain's DNS provider. Wait for DNS propagation, then click **Verify** in Search Console. Do not remove the TXT record after verification.
5. In the verified property, open **Sitemaps**, enter `sitemap.xml`, and submit it. The sitemap URL should be under the verified canonical host.
6. Check the sitemap submission status and the **Pages** report for fetch or indexing issues. Use **URL Inspection** on important public pages and request indexing after checking their canonical URL and rendered content.

Sitemap submission helps Google discover URLs but does not guarantee that they will be indexed or rank at a particular position. Keep the sitemap current by publishing accurate content, fixing broken links, and avoiding duplicate or thin pages.

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
