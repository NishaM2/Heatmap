# HeatTrack

Daily activity tracker with GitHub-style contribution heatmaps. Log effort per
category per day, keep streaks, compare progress with friends, and auto-fill
coding days from GitHub.

## Stack

| | |
|---|---|
| Client | React 19, Vite, TypeScript, Tailwind, shadcn/ui, TanStack Query, Zustand |
| Server | Express 5, TypeScript, Drizzle ORM, Postgres, Socket.IO |
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

- **Set `NODE_ENV=production`.** It gates `trust proxy`, which Secure cookies and
  per-IP rate limiting both depend on behind a host like Render or Railway.
- **`VITE_API_URL` is baked in at build time**, not read at runtime.
- **Same-origin is simplest.** If the client and API end up on different hosts,
  session cookies switch to `SameSite=None; Secure` automatically — that requires
  HTTPS on both.
- Migrations are committed under `apps/server/src/db/migrations` and must be
  applied before the new server starts.
