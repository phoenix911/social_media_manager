# CHECKLIST.md

Single source of truth for what's done and what's next. Pair with
`DEPLOY_STATE.md` (live IDs), `setup/` (per-platform recipes),
`llm/now.md` (current architecture), `new_plan.md` (forward-looking
roadmap), and `plan/` (original design).

Conventions:
- `[x]` = done
- `[ ]` = todo
- `[~]` = scaffolded but not fully wired
- ⏳ marker = waiting on the user (credentials, decisions)

---

## Phase 0 — foundations

### Planning
- [x] Brand, scope, non-goals (`plan/overview.md`)
- [x] Stack picked (`plan/architecture.md`)
- [x] Data model (`plan/data-model.md`) — superseded by current schema with **tracks + owners + project_accounts** layers
- [x] Auth model (`plan/auth.md`)
- [x] Per-platform docs incl. Product Hunt (`plan/platforms/*`)
- [x] Phase 1 + Phase 2 specs
- [x] Roadmap (`plan/roadmap.md`)
- [x] Capacity / scale ladder (`scale.md`)
- [x] `llm/` onboarding pack (kept current via `llm/now.md`)
- [x] `setup/` external integration recipes

### Cloudflare
- [x] Project account `7985cc18…` + API token with all required scopes
- [x] `example.com` zone Active
- [x] R2 enabled, Zero Trust enabled (team `tablepw`)
- [x] D1 `smm`, KV `smm-kv`, R2 `smm-media`
- [x] Queue `smm-publish`
- [x] Cron triggers — `* * * * *` (publish) + `30 3 * * *` (reminders 9am IST)
- [x] CF Access app `smm-web` covering `smm.example.com`
- [x] CF Access app `smm-telegram-webhook` (bypass for `/api/telegram/*`)

### Code scaffold
- [x] Bun workspaces monorepo (`api/`, `web/`, `shared/`)
- [x] `Makefile` + `tsconfig.base.json` + `.gitignore`
- [x] `@smm/shared` — types, zod schemas, per-platform option shapes
- [x] `api/` — Hono + Drizzle + wrangler config, AES-GCM crypto, JWT verifier
- [x] `web/` — Vite + React + Tailwind v4 + shadcn-style primitives
- [x] **All IDs are UUIDv7** (`api/src/lib/ids.ts`)
- [x] **Single Worker** at `smm.example.com` serving SPA + API (`[assets]` binding)
- [x] CF Access gates the whole hostname (One-time PIN)

---

## Phase 1 — drafts (mostly done)

### Auth + users
- [x] CF Access JWT verifier in `requireUser` (kept; `AUTH_MODE=cf_access` switch)
- [x] **Passkey / WebAuthn login** as the live mode (`AUTH_MODE=webauthn`)
- [x] Email-OTP bootstrap via Resend on a verified domain
- [x] Signed-cookie session (HMAC-SHA256, 7-day TTL)
- [x] `/login` page (passkey + email-OTP) and `/api/auth/*` route surface
- [x] Static allowlist via `WEBAUTHN_ALLOWED_EMAILS` (3 emails today)
- [x] Bearer-API-key auth path on `requireUser` (sets `viaApiKey` flag)
- [x] User row auto-upserted on first login (passkey OTP path)
- [x] Dev-mode bypass via `Cf-Access-Jwt-Assertion: dev` + `X-Dev-Email`
- [x] **Session→user KV cache (60s TTL)** on the cookie path — saves a D1 SELECT per authed request
- [ ] First-login UX: prompt for display name (OTP gives no `name`)
- [ ] Sign-out helper (button + `POST /api/auth/logout`)
- [ ] Per-device passkey label prompt at registration

### Projects
- [x] `POST /api/projects` (creator becomes owner)
- [x] `GET /api/projects` (list user's projects)
- [x] `GET /api/projects/:slug`
- [x] **Project icons** on Home (`/projects/<slug>.svg` with letter-avatar fallback)
- [ ] `PATCH /api/projects/:id` (rename / archive)
- [ ] Members management UI

### Tracks (campaign layer)
- [x] `tracks` table (single-channel campaign, `start_at` + `tz`)
- [x] `drafts.track_id` NOT NULL with backfill ("Adhoc" track per project)
- [x] `drafts.track_offset_minutes` (signed int) + `drafts.sequence_in_track` (REAL)
- [x] `GET / POST / PATCH / DELETE /api/tracks`
- [x] PATCH start_at recomputes every draft's `scheduledFor`
- [x] Track detail page `/p/:slug/t/:trackId`
- [x] Sequence + offset displayed on each draft row
- [x] Auto-scheduling: `scheduledFor = startAt + offset_minutes`

### Channels (project-independent)
- [x] `accounts.project_id` is **nullable** — channels live at user level
- [x] `project_accounts` junction — link a channel to many projects
- [x] `account_owners` junction — many-to-many channel ↔ owners
- [x] `owners.project_id` nullable — supports global owners
- [x] `owner_emails` table — multi-email per owner
- [x] **Global Channels page** at `/channels` (create — OAuth or manual paste)
- [x] **Per-project Channels page** at `/p/:slug/channels` (link-only)
- [x] Auto-owner-create on channel creation
- [x] `GET /api/accounts` (no projectId) — single round-trip CTE, cross-project view
- [x] `GET /api/accounts?projectId=` — visibility-filtered, single CTE
- [x] `POST /api/accounts/:id/projects/:projectId` (link) + DELETE (unlink)
- [x] Channels section on Home with platform pills + "+ add channel" → `/channels`
- [x] Manual token entry encrypted via existing AES-GCM helper
- [x] Manual channel creation no longer requires `projectId` (project-independent)
- [x] Setup steps include **click-to-copy chips** for redirect URIs and other constants (`CopyChip` component)
- [x] **`platform_apps` table** added — encrypted OAuth client_id/secret in DB instead of Worker secrets (so we can have multiple apps per platform without a redeploy)
- [x] `accounts.platform_app_id` FK so refresh-on-use knows which app's secrets to use
- [x] `lib/platform-apps.ts` with `getAppConfig(env, platform, appId?)` — falls back to env vars when no DB row exists
- [ ] Adapter migration: read `client_id` / `client_secret` from `getAppConfig` instead of `env.*` directly
- [ ] UI to manage `platform_apps` (`/admin/oauth-apps` or similar)
- [ ] OAuth start: pick which app to use when more than one exists per platform
- [ ] ⏳ Reddit OAuth credentials (`REDDIT_*` env, or via UI once shipped)
- [ ] ⏳ LinkedIn OAuth (`LINKEDIN_*`)
- [ ] ⏳ Twitter OAuth (`TWITTER_*`)
- [ ] ⏳ Meta app + IG Business approval (`META_*`)
- [ ] ⏳ Product Hunt OAuth (`PRODUCTHUNT_*`)

### Owners (visibility ACL)
- [x] `GET / POST / PATCH / DELETE /api/owners`
- [x] `POST/DELETE /api/owners/:id/accounts/:accountId`
- [x] Owners UI at `/p/:slug/owners`
- [x] Visibility filter: channel visible iff user's email is in an owner mapped via `account_owners`

### Drafts
- [x] CRUD: `GET /api/drafts?…`, `GET /api/drafts/:id`, `POST`, `PATCH`
- [x] **Markdown preview** — `react-markdown` + `remark-gfm`; per-platform shells (Reddit md, LinkedIn plain, Twitter thread, IG caption, PH md)
- [x] Track + account selectors with sensible defaults
- [x] Track-relative offset picker (signed days/hours/minutes)
- [x] Time display in user's local tz; storage in UTC
- [x] Editor breadcrumb back to project + track
- [x] Platform inferred from `platformOptions` shape (so seeded drafts preview)
- [x] **Datetime highlight** — `<DateTime>` component wraps every timestamp render with a soft red-marker background (`.dt` class, dark-mode aware)
- [ ] `DELETE /api/drafts/:id` (archive)
- [ ] `POST /api/drafts/:id/duplicate`
- [ ] Search drafts by title/body
- [ ] Auto-save (debounced)
- [ ] Per-platform validation hints (char/hashtag count)

### Media
- [x] `POST /api/media/upload-url` → reserve row + blob endpoint
- [x] `PUT /api/media/:id/blob` → streams to R2
- [x] `GET /api/media/:id/blob` → R2 byte-stream proxy (Access-gated)
- [x] `GET /api/media/:id` (metadata)
- [x] `DELETE /api/media/:id` (soft delete + R2 purge)
- [x] `POST/DELETE /api/media/draft/:draftId/:mediaId` (attach/detach)
- [x] `GET /api/media/draft/:draftId` (list attached, ordered)
- [x] **MediaUploader UI** in DraftEditor — drag-drop + file picker; `<img>` thumbs / `<video preload="metadata">`; hover-x to detach
- [x] **Upload "load failed" fix**: SW NetworkOnly's `/api/*` for all methods; body sent as `ArrayBuffer` (not Blob) to dodge browser/SW quirks; detailed error messages on failure
- [ ] Image dimensions / duration extracted server-side
- [ ] Server-side thumbnail generation
- [ ] Reorder media in carousel (drag-to-reorder)

### LinkedIn native draft (the differentiator)
- [x] Adapter implements `pushDraft()` and `publish()` via Posts API
- [ ] `POST /api/drafts/:id/push-to-linkedin-draft` route
- [ ] UI button + status badge

### UI / PWA / theme
- [x] Home — projects + channels + reminders shortcut + version stamp
- [x] Project dashboard — tracks list with create form
- [x] Track detail — drafts ordered by sequence
- [x] Calendar — scheduled posts grouped by day
- [x] Owners page (per project)
- [x] Reminders page (global)
- [x] Channels page (global, top-level — `/channels`)
- [x] Per-project channels page (link-only)
- [x] **Mobile-friendly** — hamburger nav < 640px, columns stack, full-width buttons
- [x] **Safe-area** support — `viewport-fit=cover` + `env(safe-area-inset-*)` on header (top), root (bottom), body (left/right). Sticky header survives notch + landscape
- [x] **Dark / light / system** theme toggle (`useThemeStore`, `bootTheme()` runs pre-render → no flash)
- [x] **Install button** in header — `beforeinstallprompt` for Chromium, hint for iOS, "installed" badge when standalone
- [x] **PWA**: `vite-plugin-pwa`, manifest "Social Media Manager" / "Social", precache (~308 KiB / 17 files), `StaleWhileRevalidate` static, never caches `/api/*`. Apple meta tags. Update notifier
- [x] **Version tag** on home (`vYYYY.MMDD.HHMM`); 5-tap → clear caches + unregister SW + cache-busted reload
- [x] **Rebrand** to "Social Media Manager" (header on desktop, "SMM" on mobile; manifest, page title)
- [ ] Toast notifications (replacing `confirm()` / `alert()`)
- [ ] Loading skeletons

### Programmatic / MCP API
- [x] `api_keys` table — sha256-hashed at rest; plaintext shown once on create
- [x] `lib/api-keys.ts` — generate / hash / constant-time compare
- [x] `routes/api-keys.ts` — list / create / revoke (creating a key needs a passkey session)
- [x] `requireUser` accepts `Authorization: Bearer smm_<hex>` (Bearer wins so scope guard applies)
- [x] **Scope guard**: API-key auth permits only `GET / POST / PATCH` on `/api/projects`, `/api/tracks`, `/api/drafts`. Everything else → 403. DELETE blocked.
- [x] Home "api keys" card (list / `+ new key` with one-shot reveal + copy chip / revoke)
- [x] `mcp.md` — paste-into-LLM context document (auth header, base URL, schemas, behavioural rules)
- [x] **`/mcp` in-app page** — renders `mcp.md` (static asset, no auth) with "copy all" button. Build script copies `mcp.md` → `web/public/mcp.md`.

### Performance
- [x] **Session→user KV cache** (60s TTL) — first hit grabs from cache, skips D1 SELECT and HMAC verify
- [x] Raw D1 prepared statements on hot read paths: `requireRole`, `GET /api/projects`, `/api/projects/:slug`, `/api/tracks`, `/api/tracks/:id`, `/api/drafts`, `/api/drafts/:id`. Dropped Drizzle's query-builder overhead on the boring reads.
- [x] JOIN-fused role check on per-resource gets (`/api/projects/:slug` etc.) — one D1 round-trip instead of two.
- [x] **p99 14.05 ms → 7.43 ms (-47%)** measured against the 15 min after deploy. p50 2.16 → 0.53 ms.

### Observability + repo hygiene
- [x] `[observability.logs] enabled = true, invocation_logs = true` on the Worker (no more `wrangler tail` dependency)
- [x] **Public-template scrub** — `api/wrangler.toml` ships with empty resource ids and `example.com` placeholders; live values live in gitignored `api/wrangler.local.toml`
- [x] `what_i_need.md`, `DEPLOY_STATE.md`, `api/wrangler.local.toml` all gitignored — only their `.example` siblings committed
- [x] Hostname / personal-email scrub across docs and seed scripts; verified via `git ls-files | xargs grep`
- [x] `web/wrangler.toml` + the `wrangler` devDep dropped from web (Pages project removed)

### Audit log
- [ ] Audit-log writer middleware
- [ ] `GET /api/projects/:id/audit`
- [ ] Activity timeline view

---

## Phase 2 — scheduling + publishing (scaffolded; runtime pending creds)

### Scheduler + queue
- [x] Cron handler `runScheduler` (atomic claim + enqueue)
- [x] `* * * * *` cron registered
- [x] `POST /api/schedule/:draftId` (with timezone), `/cancel`, `/publish-now`
- [x] Calendar view of scheduled posts
- [x] `wrangler queues create smm-publish`; producer + consumer in same Worker
- [x] Backoff: 30s → 2m → 10m, then `failed`
- [ ] Per-account serialisation guard

### Publishers
- [x] `Publisher` interface (`api/src/platforms/types.ts`)
- [x] Reddit (text post + comment-on-thread + weekly-thread resolver)
- [x] LinkedIn (publish + native-draft push + first-comment slot)
- [x] Twitter (single tweet + thread)
- [x] Instagram (OAuth + 501 publish placeholder; needs R2 signed URLs)
- [x] Product Hunt (OAuth + 501 publish placeholder; manual until partner approval)

### Telegram bot
- [x] Webhook with three security layers (URL secret + Telegram secret-token header + chat-id allowlist)
- [x] CF Access bypass policy on `/api/telegram/*`
- [x] Username → chat_id mapping captured in KV on every inbound message
- [x] Outbound notifications: `publish.success`, `publish.failed`, `schedule.created`, `schedule.cancelled`
- [x] **Inline-button menu** on `/help`: 📅 Today · 🗓 Scheduled · 📁 Projects · 👤 Who am I
- [x] Drill-down: project → drafts → draft detail (cancel/retry buttons)
- [x] `/today`, `/scheduled`, `/cancel <id>`, `/retry <id>`, `/whoami`, `/start`, `/help`

### Reminders
- [x] `reminders` table + CRUD API
- [x] Cron `30 3 * * *` (9am IST) — `runReminders()`
- [x] Per-reminder Telegram target (numeric or `@username`)
- [x] Message: today's pending + last-7-days still-pending across user's projects
- [x] Reminders UI at `/reminders` — add/edit/disable/delete + "test" button
- [x] Pre-seeded reminder targeting `@your-telegram-handle`

### Token health
- [x] Lazy refresh on use (Reddit / LinkedIn / Twitter)
- [ ] Daily refresh cron for IG long-lived tokens
- [ ] UI banner when account token expiring soon

### Phase 2 exit criteria
- [x] Scaffold complete: cron, queue, publishers, Telegram bot, reminders
- [ ] Live-test Reddit comment publish (blocked on creds)
- [ ] Live-test LinkedIn schedule (blocked on creds)
- [ ] Live-test Telegram failure → retry button (needs a real publish to fail)

---

## Migrations applied

- `0000_legal_human_torch` — initial UUIDv7 schema
- `0001_milky_spot` — tracks layer + draft.track_id (with Adhoc backfill)
- `0002_quick_raza` — drafts.sequence_in_track REAL
- `0003_long_doctor_strange` — owners + owner_emails + account_owners
- `0004_organic_strong_guy` — project_accounts junction (channel ↔ many projects)
- `0005_spicy_sprite` — reminders table
- `0006_lazy_the_executioner` — `accounts.project_id` and `owners.project_id` nullable
- `0007_worthless_black_queen` — `platform_apps` table + `accounts.platform_app_id`
- `0008_passkeys` — `user_credentials` (WebAuthn devices) + `auth_challenges` (login/register/email-OTP)
- `0009_api_keys` — programmatic access keys (sha256-hashed at rest)

---

## Seed data

- [x] **Paper Games** project — 10-draft "Reddit launch" track from `paper_games/app_distribution/reddit/*.md`. Track start = next Mon 18:30 IST.
- [x] **Tapeline** project — 11-draft "Product Hunt launch" track from `measure_app/producthunt/*`. Track start = next Wed 12:30 IST.
- [x] Tapeline + "Launch in YVS WhatsApp group" track with 2 drafts (today 1pm IST + Sat 1pm IST).
- [x] **neuera.care** project (slug `neuera-care`) — three tracks (Adhoc, gynaegoddess, Instagram ads); **Founders** owner with `tech@neuera.care` + `saurav@neuera.care`.
- [x] Daily reminder seeded for `@your-telegram-handle`.

---

## Phase 3 — analytics + iteration (not started)

- [ ] Daily cron pulls post metrics from each platform
- [ ] `post_stats` table — daily snapshot per published post
- [ ] Cross-link to `attrs.measures.fit` referrer slugs
- [ ] Per-channel dashboards (charts)
- [ ] Auto-suggest "best time to post"
- [ ] Reusable draft templates
- [ ] Bulk import from markdown
- [ ] Cross-project content calendar
- [ ] (Optional) AI-assisted drafting

---

## Future / nice-to-have (unprioritised)

- [x] **passkey login** (live as `AUTH_MODE=webauthn`)
- [x] **Open-source the repo** (`phoenix911/social_media_manager`, MIT, Deploy-to-CF button)
- [ ] Per-user notification preferences
- [ ] Threads / Mastodon / Bluesky / TikTok integrations
- [ ] In-browser image editing (crop, annotate)
- [ ] Operator dashboard (failed publishes / sessions / api keys account-wide)

---

## Always-on hygiene

- [ ] Re-check Cloudflare token scopes quarterly
- [ ] Rotate `SMM_TOKEN_KEY` every 6 mo (or on suspected compromise)
- [ ] D1 audit_log purge > 90 days
- [ ] R2 prune deleted media weekly
- [ ] Wrangler version bump every couple of months
- [ ] Drizzle / Hono security advisories
- [ ] Keep `DEPLOY_STATE.md` honest after every infra change
- [ ] Keep `llm/now.md` synced with current state
