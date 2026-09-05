# Loop In

Daily habit tracker with GitHub-style contribution heatmaps. Log effort per habit
per day, keep streaks, compare progress with friends, and auto-fill coding days
straight from GitHub.

**Live:** https://loopinn.vercel.app

## About

Most habit trackers ask for a checkbox. Loop In asks how hard the day actually was,
on a four-level scale, and paints a year of that effort as a contribution heatmap —
so a light week and a brutal one don't look identical in hindsight.

Habits are capped at five on purpose. The grid is only readable when it's tracking
a handful of things you genuinely care about.

## Features

- **Year heatmaps** — a 365-day grid per habit, on a four-level intensity scale
  (Light, Moderate, Hard, Intense), plus a combined overall view.
- **Quick log** — type "ran 5k this morning, absolutely brutal" and an LLM maps it
  to the right habit, effort level, and a tidied note. The model's answer is
  re-validated server-side against your own habit list, so it can't invent one.
- **Streaks** — current and longest run per habit.
- **Friends** — search users, send and accept requests, and compare heatmaps
  side by side.
- **Shared goals** — invite a friend to a joint habit and track both grids together.
- **GitHub sync** — a nightly job imports a full year of commits through the GitHub
  GraphQL API and maps daily commit volume onto the same four-level scale.
- **Share cards** — server-rendered 800×340 PNG of any habit's year, generated with
  Satori and Resvg.
- **Auth** — email/password, GitHub OAuth, and Google OAuth, with encrypted OAuth
  token storage and account linking.

## Stack

| | |
|---|---|
| Client | React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui, Radix, TanStack Query, Zustand, React Router |
| Server | Express 5, TypeScript, Drizzle ORM, PostgreSQL, Zod |
| Auth | Better Auth — email/password, GitHub OAuth, Google OAuth |
| AI | Google Gen AI SDK (`@google/genai`), Gemini Flash-Lite |
| Integrations | Octokit + GitHub GraphQL API, node-cron |
| Images | Satori + Resvg |

## Architecture

The client never calls the API cross-origin. `apps/client/vercel.json` rewrites
`/api/*` to the API server, so the browser only ever talks to the client's own
origin and the API hostname stays server-side.

```
browser ──► loopinn.vercel.app ──► (rewrite, server-side) ──► API host
```

This is deliberate, not incidental. An API host that receives OAuth callbacks as
top-level browser navigations — a bare hostname redirecting users to a GitHub
login page — pattern-matches phishing to Google Safe Browsing, and a previous
deployment was flagged for exactly that. Keeping the API off the address bar also
makes everything same-origin, so session cookies stay `SameSite=Lax`.

## Layout

```
apps/
  client/    React SPA (Vite)
  server/    Express API, Drizzle schema and migrations
```

## Setup

Requires **Node 18+** and a PostgreSQL database.

```bash
npm install
```

There are no `.env.example` files — create the two below by hand.

**`apps/server/.env`**

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | yes | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | yes | The **client** origin, e.g. `http://localhost:5173` |
| `CLIENT_URL` | yes | Same as above |
| `PORT` | no | Defaults to 3000 |
| `NODE_ENV` | no | Set to `production` when deploying |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | no | Enables GitHub sign-in and commit sync |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no | Enables Google sign-in; leave blank to hide the button |
| `GEMINI_API_KEY` | no | Enables quick log; without it the feature is disabled |
| `GEMINI_MODEL` | no | Defaults to `gemini-3.5-flash-lite`. No quotes, no trailing space |
| `TRUST_PROXY_HOPS` | no | Defaults to 2. See Deployment |

**`apps/client/.env`**

| Variable | Notes |
|---|---|
| `VITE_API_URL` | Leave **empty**. Empty means same-origin, which is what the proxy expects |

Apply the schema:

```bash
npm run db:migrate --workspace=apps/server
```

## Running

Two terminals:

```bash
npm run dev:server
```

```bash
npm run dev:client
```

The API listens on `:3000`, the client on `:5173`. Vite proxies `/api` to the API
in development, mirroring the production rewrite.

## Commands

| Command | What it does |
|---|---|
| `npm run dev:server` / `dev:client` | Start either side in watch mode |
| `npm run build:server` / `build:client` | Production build |
| `npm run db:generate --workspace=apps/server` | Generate a migration from schema changes |
| `npm run db:migrate --workspace=apps/server` | Apply pending migrations |
| `npm run db:studio --workspace=apps/server` | Browse the database |

## API

30 REST endpoints across 8 route groups, all under `/api`:

| Group | Purpose |
|---|---|
| `/auth/*` | Better Auth (sessions, OAuth, password) |
| `/categories` | Habit CRUD, capped at 5 per user |
| `/logs` | Daily logs, year and day views, natural-language parse |
| `/stats` | Streaks and per-habit totals |
| `/friends` | Search, requests, accept/decline, unfriend |
| `/shared-goals` | Joint habits and comparison |
| `/github` | Manual sync, connection status, disconnect |
| `/share` | PNG heatmap generation |

Rate limiting runs in four tiers:

| Scope | Limit |
|---|---|
| Global | 100 requests / minute |
| Sign-in and password | 5 attempts / 15 minutes |
| Quick log (LLM) | 12 / minute |
| Share image render | 10 / minute |

## Deployment

The client and API deploy separately, with the client proxying to the API.

- **Set the rewrite destination** in `apps/client/vercel.json` to the API host
  before the first deploy.
- **Point `BETTER_AUTH_URL` and `CLIENT_URL` at the client origin**, not the API
  host. Better Auth builds the OAuth `redirect_uri` from `BETTER_AUTH_URL`, and the
  callback must land on the proxied origin. OAuth app callback URLs must match:
  `https://<client-origin>/api/auth/callback/github`.
- **Leave `VITE_API_URL` unset in the client's build environment.** It is baked in
  at build time, not read at runtime — a stale value there sends the browser
  straight to the API host and breaks OAuth, because the session cookie ends up on
  the wrong origin.
- **Set `NODE_ENV=production`.** It gates `trust proxy`, which Secure cookies and
  per-IP rate limiting both depend on.
- **`TRUST_PROXY_HOPS` defaults to 2** — the rewrite proxy plus the host's own load
  balancer. Set it to 1 only if you drop the proxy and serve the API directly;
  guessing low collapses every visitor onto one IP and the rate limits go global.
- Migrations live in `apps/server/src/db/migrations` and must be applied before the
  new server starts.
