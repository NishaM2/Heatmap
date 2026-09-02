# Loop In

Daily activity tracker with GitHub-style contribution heatmaps. Log effort per
category per day, keep streaks, compare progress with friends, and auto-fill
coding days from GitHub.

## Stack

| | |
|---|---|
| Client | React 19, Vite, TypeScript, Tailwind, shadcn/ui, TanStack Query, Zustand |
| Server | Express 5, TypeScript, Drizzle ORM, Postgres |
| Auth | Better Auth (email/password + GitHub OAuth) |
| Extras | Satori + resvg for share images, node-cron for GitHub sync, Resend for email |

## Layout

```
apps/
  client/    React SPA
  server/    Express API, Drizzle schema and migrations
```

## Setup

Requires Node 18+ and a Postgres database.

```bash
npm install
```

Copy the env templates and fill them in:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/client/.env.example apps/client/.env
```

At minimum set `DATABASE_URL` and `BETTER_AUTH_SECRET` (`openssl rand -base64 32`).
GitHub sync and email verification stay dormant until their keys are set — without
`RESEND_API_KEY`, verification links are logged to the server console instead.

Apply the schema:

```bash
npm run db:migrate --workspace=apps/server
```

## Running

```bash
npm run dev:server
```

```bash
npm run dev:client
```

The API listens on `:3000`, the client on `:5173`.

## Commands

| Command | What it does |
|---|---|
| `npm run dev:server` / `dev:client` | Start either side in watch mode |
| `npm run build:server` / `build:client` | Production build |
| `npm test --workspace=apps/server` | Run the server test suite |
| `npm run db:generate --workspace=apps/server` | Generate a migration from schema changes |
| `npm run db:migrate --workspace=apps/server` | Apply pending migrations |
| `npm run db:studio --workspace=apps/server` | Browse the database |

## Deployment notes

The client proxies the API rather than calling it cross-origin: `vercel.json`
rewrites `/api/*` to the API server, so the browser only ever talks to the client's
own origin and the API hostname never appears in a navigation. Set that destination
before the first deploy — it ships with a `REPLACE-WITH-BACKEND-HOST` placeholder.

- **Point `BETTER_AUTH_URL` and `CLIENT_URL` at the _client_ origin**, not the API
  host. Better Auth builds the OAuth `redirect_uri` from `BETTER_AUTH_URL`, and the
  callback has to land on the proxied origin. The GitHub OAuth app's callback URL
  has to match: `https://<client-origin>/api/auth/callback/github`.
- **Leave `VITE_API_URL` empty.** Empty means same-origin, which is what the proxy
  expects. It is baked in at build time, not read at runtime, so changing it needs a
  rebuild.
- **Set `NODE_ENV=production`.** It gates `trust proxy`, which Secure cookies and
  per-IP rate limiting both depend on.
- **`TRUST_PROXY_HOPS` defaults to 2** — the rewrite proxy plus the host's own load
  balancer. Set it to 1 only if you drop the proxy and serve the API directly;
  guessing low collapses every visitor onto one IP and the rate limits go global.
- Migrations are committed under `apps/server/src/db/migrations` and must be applied
  before the new server starts.
