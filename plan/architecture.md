# Architecture

## High-level diagram

```
                ┌──────────────────────────┐
                │  smm.<domain>            │  Cloudflare Pages
                │  React + Vite + Tailwind │  (static, edge-cached)
                └────────────┬─────────────┘
                             │  fetch /api/*
                             ▼
   ┌──────────────────────────────────────────────────┐
   │  Cloudflare Access (One-time PIN to email)       │
   │  • blocks any non-authorized email               │
   │  • injects CF-Access-Jwt-Assertion header        │
   └──────────────────────────┬───────────────────────┘
                              ▼
                ┌──────────────────────────┐
                │  api.smm.<domain>        │  Cloudflare Worker
                │  Hono + TypeScript       │  (api routes)
                └─┬──────┬──────┬──────┬──┘
                  │      │      │      │
       ┌──────────┘      │      │      └──────────────┐
       ▼                 ▼      ▼                     ▼
   ┌─────────┐    ┌─────────┐   ┌──────────────┐   ┌──────────────┐
   │   D1    │    │   R2    │   │ Queues (P2)  │   │  KV (cache)  │
   │ schema  │    │  media  │   │ publish jobs │   │ rate limits  │
   └─────────┘    └─────────┘   └──────────────┘   └──────────────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │ scheduler    │
                                │ (cron 1/min) │
                                │ Worker       │
                                └──────┬───────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
     ┌───────────┐             ┌───────────────┐         ┌──────────────┐
     │ Reddit    │             │ LinkedIn      │         │ Instagram    │
     │ OAuth API │             │ OAuth API     │         │ Graph API    │
     └───────────┘             └───────────────┘         └──────────────┘
```

## Components

### 1. Frontend — Cloudflare Pages

- React 18, Vite, Tailwind v4 (same stack as paper_games web)
- Routes:
  - `/` — project picker
  - `/p/:projectSlug` — project dashboard (drafts list)
  - `/p/:projectSlug/draft/new` — new draft form
  - `/p/:projectSlug/draft/:id` — edit draft
  - `/p/:projectSlug/accounts` — manage platform accounts
  - `/p/:projectSlug/media` — media library
  - `/admin` — projects + members (owner only)
- State: Zustand for client state; SWR for server state.
- Auth: relies on Cloudflare Access redirect — frontend never sees
  raw IDP tokens — only the CF Access JWT.

### 2. API — Cloudflare Worker

- Framework: **Hono**. Lightweight, type-safe, designed for Workers.
- Routes:
  - `GET  /api/me` — current user (decoded from CF Access JWT)
  - `GET  /api/projects`
  - `POST /api/projects`
  - `GET  /api/projects/:id/drafts?status=...`
  - `POST /api/projects/:id/drafts`
  - `PATCH /api/drafts/:id`
  - `POST /api/drafts/:id/push-to-platform-draft` — phase 1, LinkedIn-only
  - `POST /api/drafts/:id/schedule` — phase 2
  - `POST /api/drafts/:id/publish-now` — phase 2
  - `POST /api/media/upload` — multipart → R2
  - `GET  /api/media/:id` — signed URL or proxied stream
  - `POST /api/oauth/:platform/start`
  - `GET  /api/oauth/:platform/callback`
- Reads CF Access JWT via `CF-Access-Jwt-Assertion` header. Verifies
  signature against the team's JWKS. Extracts email → looks up our
  Users row. Auto-creates on first login if email is in the allowlist.

### 3. D1 — metadata DB

See [data-model.md](data-model.md).

Single database, tables for users / projects / accounts / drafts /
media / publishes / audit_log. ~50–500 rows expected over a year.
Free tier covers it 100×.

### 4. R2 — media storage

Bucket: `smm-media`. Object key format:
`projects/<project_id>/<media_id>.<ext>`

Two access patterns:
- **Upload**: client requests presigned PUT URL from API, uploads
  directly to R2. API records the row in `media` after R2 confirms.
- **Read**: API returns short-lived signed GET URLs (5 min). For
  public draft preview, we can also expose a `/r/:media_id` route
  on the API that streams from R2 with caching headers.

### 5. Queues + Cron — scheduler (Phase 2)

- Cron Worker: runs every minute. Queries D1:
  ```sql
  SELECT id FROM drafts
   WHERE status = 'scheduled'
     AND scheduled_for <= now()
   LIMIT 100
  ```
- For each due draft: enqueue a publish job to `publish-queue`.
- Queue consumer: a separate Worker that handles each job — calls
  the platform API, retries on transient failure, records the
  result in `publishes`.

This lets the scheduler stay fast (just a SELECT + enqueue) while
the actual posting is decoupled and retryable.

### 6. KV — rate limiting + cache

- Per-platform rate limit counters (e.g. Reddit allows 60 req/min).
- OAuth state nonces for the CF Worker side of the OAuth dance.
- Cached subreddit metadata (rules, posting requirements).

## Request flows

### Login (first time)

1. User visits `https://smm.<domain>/` in browser.
2. Cloudflare Access intercepts → shows the One-time PIN form.
3. User enters their email. Access checks against the allowlist
   policy. If not allowed → 403.
4. If allowed → Access emails a 6-digit code. User enters it.
   Access sets `CF_Authorization` cookie + redirects back to app.
5. App calls `GET /api/me`. Worker reads `CF-Access-Jwt-Assertion`
   header (Access auto-injects), verifies, looks up user by email,
   creates row if first login.

### Create a draft

1. User clicks "New draft" in project dashboard.
2. Frontend posts `{ project_id, account_id, title, body }` to
   `POST /api/drafts`.
3. Worker validates: user has editor+ role on project, account
   belongs to project, body length within limits.
4. Insert row into `drafts` with `status = 'draft'`. Return id.
5. User adds media via `POST /api/media/upload`:
   - Client requests presigned PUT URL → uploads file to R2 → tells
     API the upload succeeded → API inserts into `media`.
6. User attaches media to draft via PATCH.
7. Audit log row written for every insert/update.

### Push to platform draft (Phase 1, LinkedIn only)

1. User clicks "Save to LinkedIn drafts" on a draft.
2. Worker fetches draft + account.
3. If LinkedIn token expired → refresh via stored refresh_token.
4. Call LinkedIn UGC API with `lifecycleState=DRAFT`.
5. Store the platform-side draft id in our `drafts` row (column
   `platform_draft_id`).
6. Subsequent edits push updates to the same LinkedIn draft.

### Scheduled publish (Phase 2)

1. User clicks "Schedule" → picks a future time → frontend PATCHes
   `status='scheduled'`, `scheduled_for=<ts>`.
2. Cron Worker fires every minute. Queries due drafts. For each,
   pushes a job to `publish-queue` and updates draft to
   `status='publishing'` (so the same row isn't picked up twice).
3. Consumer Worker pulls the job. Looks up draft + account. Calls
   platform API. On success: insert `publishes` row, update draft
   to `status='published'`. On failure: increment retry count,
   re-enqueue with backoff up to 3 times. After that → status
   `'failed'`, send notification.
4. Notifications: Telegram bot (also handles approval/reschedule
   commands).

## Multi-project boundary

A `Project` is the top-level tenant unit. Every other row carries a
`project_id`. Membership table grants access. The Worker rejects any
request where the JWT user has no row in `project_members` for the
referenced project.

```sql
-- pseudocode for every project-scoped endpoint
const role = await db.first(
  `SELECT role FROM project_members WHERE project_id = ? AND user_id = ?`,
  [projectId, userId]
);
if (!role) return 403;
if (mutating && role.role === 'viewer') return 403;
```

## Why Cloudflare for everything

- **One vendor, one bill.** Workers Paid is $5/mo and includes
  generous quotas for D1, R2, KV, Queues, Pages.
- **Edge auth via Access** — no IDP code to write.
- **No cold starts.** Workers boot in <5ms. The tool feels native.
- **One language, end to end.** TypeScript everywhere.
- **Easy to add a second app.** When we ship the next side-project,
  it gets its own subdomain + Worker but reuses the auth + R2
  bucket boundary by project.

## Things we're explicitly NOT doing

- **No Postgres.** D1 is enough at this scale. We can switch later
  if some integration forces Postgres-only features (none in sight).
- **No Redis.** Workers KV does the same job for rate limits.
- **No background daemons.** Everything is request-driven or cron.
- **No Docker.** Wrangler dev → wrangler deploy. That's it.
