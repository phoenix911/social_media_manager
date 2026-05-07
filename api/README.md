# @smm/api

Cloudflare Worker on `api.smm.table.pw`. Hono + Drizzle on D1.

## Layout

```
src/
├── index.ts            entrypoint, wires routes + global middleware
├── env.ts              Env binding shape
├── db/
│   ├── schema.ts       Drizzle schema (source of truth)
│   └── index.ts        db() helper
├── lib/
│   ├── access.ts       CF Access JWT verifier
│   ├── crypto.ts       AES-GCM token encrypt/decrypt
│   ├── errors.ts       HttpError + helpers
│   └── projects.ts     role checks
├── middleware/
│   └── auth.ts         requireUser middleware (JWT → user upsert)
└── routes/
    ├── me.ts           GET /api/me
    ├── projects.ts     CRUD on projects
    ├── drafts.ts       CRUD on drafts
    ├── media.ts        upload + R2 stream
    └── oauth.ts        per-platform OAuth start/callback (skeletons)
drizzle/migrations/     generated SQL migrations
wrangler.toml
drizzle.config.ts
```

## First-time setup

Assumes `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` env vars are
set (or wrangler is logged in for the project account).

```sh
# 1. Install deps (from repo root)
bun install

# 2. Create infra resources
wrangler d1 create smm                       # → copy database_id into wrangler.toml
wrangler kv namespace create smm-kv          # → copy id into wrangler.toml
wrangler r2 bucket create smm-media

# 3. Generate + apply initial migration
cd api
bun run db:generate                          # produces drizzle/migrations/0000_*.sql
bun run db:apply:remote

# 4. Set the master encryption key
openssl rand -hex 32 | wrangler secret put SMM_TOKEN_KEY

# 5. (After CF Access app is created) set CF_ACCESS_AUD_API + CF_ACCESS_TEAM
#    in wrangler.toml [vars]; redeploy.

# 6. Deploy
wrangler deploy
```

## Local dev

```sh
bun run dev          # wrangler dev on http://localhost:8787
```

In dev mode, CF Access is bypassed: send `Cf-Access-Jwt-Assertion: dev`
+ `X-Dev-Email: you@example.com` headers to authenticate as that
email. The worker upserts a user row on first call.

```sh
curl -H "Cf-Access-Jwt-Assertion: dev" \
     -H "X-Dev-Email: you@example.com" \
     http://localhost:8787/api/me
```

## Migrations

Edit `src/db/schema.ts` → `bun run db:generate` → review the diff in
`drizzle/migrations/<n>_*.sql` → `bun run db:apply:local` (during
dev) or `db:apply:remote` (to deploy).

## What's NOT in here yet

- Per-platform OAuth implementations (`platforms/<name>/oauth.ts`)
- Per-platform publishers (Phase 2)
- Cron scheduler + queue consumer (Phase 2)
- Telegram bot webhook (Phase 2)

Each is its own follow-up — see `../plan/`.
