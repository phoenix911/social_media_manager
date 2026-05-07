# Stack

Every dep, why we picked it, and what the alternative was.

## Cloud

| Layer | Choice | Why |
|---|---|---|
| Compute | Cloudflare Workers | $5/mo, no cold starts, edge runtime. Same code for HTTP + cron + queue consumer. |
| DB | Cloudflare D1 (SQLite) | Free tier covers us; transactional; no vendor migration. |
| Object storage | Cloudflare R2 | Free egress (huge for IG fetches); S3-compatible. |
| KV | Cloudflare Workers KV | OAuth state nonces, rate-limit counters, JWKS cache. |
| Queue | Cloudflare Queues | Built-in retries + DLQ; same Worker as producer + consumer. |
| Static hosting | Static Assets in Workers | Same Worker serves SPA + API. No Pages, no CORS. |
| Auth | Cloudflare Access (One-time PIN) | Zero 3rd-party IDP; emails get a 6-digit code. |
| Scheduler | Cloudflare Cron Triggers | `* * * * *`. Lives in same Worker. |

**One vendor by design.** When you only have $5 to spend, vendor
sprawl is the enemy.

## TypeScript

- **Bun workspaces** (`api`, `web`, `shared`) with `bun.lockb`.
- TS `strict` everywhere. `verbatimModuleSyntax`. `.ts` extensions
  required in imports (matches Workers + Bun conventions).
- `@smm/shared` exports types + zod schemas reused on both sides.

## API (`api/`)

| Dep | Why |
|---|---|
| `hono` | Tiny, type-safe router built for Workers. Replaces Express/itty-router. |
| `drizzle-orm` + `drizzle-kit` | Schema-as-code, generates SQL migrations, typed queries on D1. |
| `jose` | JWT verification for CF Access. |
| `zod` | Request validation. |
| `@cloudflare/workers-types` | Env / D1 / R2 / KV / Queue type defs. |
| `wrangler` | Build + deploy CLI. |

Notable choices we did NOT make:
- **No Postgres / Neon.** D1 is enough at our scale. SQLite-compat
  is a feature, not a bug — push some tests local-first.
- **No background daemons.** Everything is request-driven or cron.
- **No ORMs other than Drizzle.** Prisma needs a separate engine
  binary; doesn't fit Workers.

## Web (`web/`)

| Dep | Why |
|---|---|
| `react` v18 | Mature; we don't need RSC. |
| `vite` | Fast HMR, simple config, builds to plain dist/. |
| `tailwindcss` v4 + `@tailwindcss/vite` | Modern utility CSS, no PostCSS config. |
| `react-router` v7 | Standard SPA routing. |
| `swr` | Server state. We don't need React Query's full feature set. |
| `zustand` + `persist` | Tiny client-state for "current project". |
| `@radix-ui/*` | Accessible primitives under shadcn/ui. |
| `class-variance-authority` + `clsx` + `tailwind-merge` | shadcn convention. |
| `lucide-react` | Icons. Tree-shakeable. |
| shadcn/ui (vendored, not a package) | Components live in `web/src/components/ui/*`. We own them; add more via `bunx shadcn@latest add <name>`. |

## OAuth flows (per platform)

| Platform | Flavor | Notes |
|---|---|---|
| Reddit | OAuth 2.0 (web app) | `duration=permanent` for refresh token; UA must be unique. |
| LinkedIn | OAuth 2.0 + OIDC | UGC posts API supports `lifecycleState=DRAFT` (the only platform with native drafts). |
| Twitter / X | OAuth 2.0 with **PKCE** | PKCE required. Refresh tokens **rotate** — store new one each time. Media upload still requires OAuth 1.0a (not yet implemented). |
| Instagram | Meta Graph API | Requires Business / Creator account + Meta app review. Long-lived tokens, no refresh token concept; refresh by re-exchange. |

## Phase 2 scheduling

- Cron tick: `* * * * *` (every minute) → `runScheduler(env)`.
- Atomic claim via `UPDATE … WHERE status='scheduled'` — only one
  cron run can transition a row to `publishing`.
- Producer: same Worker enqueues `{ draftId }` to `smm-publish`.
- Consumer: same Worker handles `queue(batch, env)` → publishes.
- Retry: 30s → 2m → 10m, then `failed`. CF Queues handles delivery
  semantics; we control backoff via `msg.retry({ delaySeconds })`.

## Telegram bot

- Webhook at `/api/telegram/<TELEGRAM_WEBHOOK_SECRET>` (path-shared-
  secret because Telegram doesn't sign webhooks).
- Outbound notifications fire on `publish.success`, `publish.failed`,
  `schedule.created`, `schedule.cancelled`.
- Inbound commands: `/list`, `/cancel <id>`, `/retry <id>`,
  `/whoami`, `/help`. All gated by `TELEGRAM_ALLOWED_CHAT_IDS`.
