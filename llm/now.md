# now.md — current state

Updated: 2026-05-08. The big shape is now: **Project → Track → Draft**,
with **Channels** (= accounts, project-independent) gated by **Owners**
(multi-email ACL) and linked into projects via `project_accounts`.

Forward-looking roadmap lives in `../new_plan.md`.

## Live URL

`https://smm.example.com` — single Cloudflare Worker serving the SPA + API.
Whole hostname is gated by Cloudflare Access (One-time PIN); the
`/api/telegram/*` path has a separate Access app with a bypass policy
so Telegram's webhook can reach the Worker.

## Schema (high level)

```
users
  └─ project_members ─ projects
                           │
                           ├─ owners ─ owner_emails        ← visibility (multi-email per owner)
                           │     │
                           │     └─ account_owners ─ accounts (= channels in UI)
                           │                            │
                           │                            └─ tracks (one campaign, single channel)
                           │                                  │
                           │                                  └─ drafts (sequenceInTrack:REAL, trackOffsetMinutes:INT)
                           │                                       └─ draft_media ─ media (R2)
                           │                                       └─ publishes
                           └─ audit_log
```

### Time / scheduling

- All timestamps in DB = **UTC ISO 8601**.
- `track.startAt` is the campaign anchor.
- Each draft has `trackOffsetMinutes` (signed): `scheduledFor =
  startAt + offset`. Recomputes automatically when track start moves
  (`PATCH /api/tracks/:id`) or when the draft's offset changes.
- Display tz comes from `track.tz` (default user's tz,
  `Intl.DateTimeFormat().resolvedOptions().timeZone`).
- Helpers in `web/src/lib/time.ts`: `formatLocal`, `formatLocalShort`,
  `localInputToUtcIso`, `utcIsoToLocalInput`, `formatOffset`.

### IDs

UUIDv7 strings everywhere. Generator: `api/src/lib/ids.ts`. The seeds
emit them as literals so the SQL is referentially complete.

### Visibility (owners)

A **channel** (account) is visible to a logged-in user only if:
- the user's email is in `owner_emails` for an owner that is in
  `account_owners` for that channel (many-to-many).

The OAuth callback auto-creates an owner for the connecting user
(named after their display name or email local-part) and inserts the
`account_owners` row. Add more emails to that owner via the **Owners**
page to share visibility.

## Active projects

| Project | Track | Drafts | Start |
|---|---|---:|---|
| paper-games | Reddit launch | 10 | next Mon 18:30 IST |
| paper-games | Adhoc | 0 | — |
| tapeline | Product Hunt launch | 11 | next Wed 12:30 IST |
| tapeline | Launch in VFS WhatsApp group | 0 | — |
| tapeline | Adhoc | 0 | — |
| neura-care | gynaegoddess | 0 | — |
| neura-care | Instagram ads | 0 | — |
| neura-care | Adhoc | 0 | — |

Owners (visibility):
- `paper-games` / `tapeline` — owner from project creator's email
- `neura-care` / **Founders** — `you@example.com`, `tech@neuera.care`, `saurav@neuera.care`

## Auth

`AUTH_MODE = "webauthn"` is the live mode (Worker var). The whole
hostname is **no longer** behind Cloudflare Access — that app was
deleted when we flipped to passkey. The only CF Access app left is the
bypass policy on `/api/telegram/*` so Telegram can reach the webhook.

- Sign-in lives at `/login`. Two paths: passkey (existing device) or
  email-OTP via Resend (verified domain `auth@<your-domain>`) on a
  fresh device — OTP success prompts to register a passkey.
- Session = signed cookie (HMAC-SHA256, 7-day TTL via
  `SESSION_TTL_SECONDS`). Verified by `requireUser`.
- **`requireUser` also accepts `Authorization: Bearer smm_<hex>`**
  (programmatic / MCP). When the request authed via Bearer key, an
  index-level scope guard restricts it to `GET / POST / PATCH` on
  `/api/projects`, `/api/tracks`, `/api/drafts`. Anything else → 403.
- Allowlist for new-user signup is a static comma-list at
  `WEBAUTHN_ALLOWED_EMAILS`; case-insensitive. Today: `you@example.com`,
  `tech@neuera.care`, `saurav@neuera.care`.
- Hot-path optimisation: cookie → user lookup is cached in KV for 60s
  (key = first 80 chars of the signed cookie). Saves a D1 SELECT per
  authed request.

## Pages (web)

```
/                              project picker + channels + api keys card + reminders link
/login                         passkey + email-OTP (public, no session needed)
/mcp                           renders mcp.md as paste-into-LLM context (public)
/channels                      add a new channel (OAuth or manual paste)
/p/:slug                       tracks list (with "+ new track")
/p/:slug/t/:trackId            track detail — edit start_at + drafts ordered by sequence
/p/:slug/draft/:id             draft editor (track + channel selector, offset picker, preview)
/p/:slug/calendar              scheduled drafts grouped by day
/p/:slug/channels              link existing channels into this project (link-only)
/p/:slug/owners                manage owners + emails
/reminders                     telegram reminders CRUD
```

Mobile-friendly: header collapses to hamburger ≤640px; columns stack;
all actions are full-width on phone.

## Theme

`web/src/store/themeStore.ts`. Three modes: light / dark / system.
`bootTheme()` runs in `main.tsx` before React mounts, applying the
stored choice (no flash). `<html>` carries `.dark` when active.
Toggle button in the header cycles through modes.

## Telegram bot

`@smm_table_pw_bot`. Webhook at `/api/telegram/<TELEGRAM_WEBHOOK_SECRET>`.
Three layers of access control: URL secret + `X-Telegram-Bot-Api-
Secret-Token` header (Telegram-injected) + `TELEGRAM_ALLOWED_CHAT_IDS`
allowlist (accepts both numeric ids and `@usernames`).

Commands (all driven by inline-button menu):
- `/help`, `/start` — menu (📅 Today · 🗓 Scheduled · 📁 Projects · 👤 Who am I)
- `/projects` → tap project → tap draft → detail with cancel/retry
- `/today` — today's drafts (any status, IST date)
- `/scheduled` — next 10 cross-project
- `/cancel <id>`, `/retry <id>`, `/whoami`

## API surface

```
GET    /api/me

# auth (no session required for the public sub-routes)
POST   /api/auth/email-otp/start            { email }
POST   /api/auth/email-otp/finish           { email, code }   → sets cookie
POST   /api/auth/webauthn/register/start    (session required)
POST   /api/auth/webauthn/register/finish
POST   /api/auth/webauthn/login/start       { email }
POST   /api/auth/webauthn/login/finish      { email, response } → sets cookie
POST   /api/auth/logout

# programmatic access (passkey session required to mint a key)
GET    /api/api-keys
POST   /api/api-keys                        { name } → plaintext returned ONCE
DELETE /api/api-keys/:id

GET    /api/projects
POST   /api/projects
GET    /api/projects/:slug

GET    /api/owners?projectId=
POST   /api/owners
PATCH  /api/owners/:id
DELETE /api/owners/:id
POST   /api/owners/:id/accounts/:accountId      (assign owner to channel)
DELETE /api/owners/:id/accounts/:accountId      (unassign)

GET    /api/accounts?projectId=                 (visibility-filtered, single-query CTE)
DELETE /api/accounts/:id

GET    /api/tracks?projectId=
POST   /api/tracks
GET    /api/tracks/:id
PATCH  /api/tracks/:id                          (start_at change → bulk-recompute drafts)
DELETE /api/tracks/:id

GET    /api/drafts?projectId=&status=&trackId=
GET    /api/drafts/:id
POST   /api/drafts
PATCH  /api/drafts/:id

POST   /api/oauth/:platform/start
GET    /api/oauth/:platform/callback            (auto-creates owner mapping)

POST   /api/media/upload-url
PUT    /api/media/:id/blob

POST   /api/schedule/:draftId
POST   /api/schedule/:draftId/cancel
POST   /api/schedule/:draftId/publish-now

POST   /api/telegram/:secret                    (CF Access bypass)
```

## What still blocks "real" publishing

| Capability | Blocker |
|---|---|
| Reddit OAuth + publish | `REDDIT_CLIENT_ID/SECRET/USERNAME_FOR_UA` |
| LinkedIn OAuth (+ native draft push) | `LINKEDIN_CLIENT_ID/SECRET` |
| Twitter OAuth | `TWITTER_OAUTH2_CLIENT_ID/SECRET` (text only — media needs OAuth1.0a) |
| Instagram OAuth + publish | `META_APP_ID/SECRET` + Meta app review |
| Product Hunt OAuth | `PRODUCTHUNT_CLIENT_ID/SECRET` (programmatic launch still manual) |

## Migrations applied

- `0000_legal_human_torch` — initial UUIDv7 schema (9 tables)
- `0001_milky_spot` — tracks layer + draft.track_id (with backfill of "Adhoc" tracks)
- `0002_quick_raza` — drafts.sequence_in_track (REAL, supports halves)
- `0003_long_doctor_strange` — owners + owner_emails + account_owners
- `0004_*` / `0005_*` — project_accounts (channel ↔ project many-to-many) + reminders
- `0006_lazy_the_executioner` — `accounts.project_id` and `owners.project_id` made nullable (channels are user-level, link into projects)
- `0007_worthless_black_queen` — `platform_apps` table (encrypted OAuth client config) + `accounts.platform_app_id` FK
- `0008_passkeys` — `user_credentials` (WebAuthn devices) + `auth_challenges` (login / register / email-OTP)
- `0009_api_keys` — programmatic API keys (sha256-hashed at rest)

## Recent shape changes (2026-05-08)

- **Auth flipped to passkey** (`AUTH_MODE=webauthn`). CF Access app on the hostname deleted; only the `/api/telegram/*` bypass remains.
- **Programmatic / MCP API** — `Authorization: Bearer smm_<hex>` accepted on `requireUser`. Scope guard in `index.ts` restricts API-key requests to `GET / POST / PATCH` on `/api/projects`, `/api/tracks`, `/api/drafts`. DELETE blocked. New `mcp.md` (paste-into-LLM context) shipped as a static asset rendered at `/mcp`.
- **Performance pass**: session→user cached in KV 60s; raw D1 prepared statements on every hot read path; JOIN-fused role checks. **p99 14.05 ms → 7.43 ms (-47%)** on the 15-min post-deploy window.
- **Public-template scrub**: `api/wrangler.toml` ships with `example.com` placeholders + empty resource ids. Live values live in gitignored `api/wrangler.local.toml` and `DEPLOY_STATE.md`. `web/wrangler.toml` deleted (Pages no longer used).
- **Worker observability** enabled (`[observability.logs] enabled = true, invocation_logs = true`).
- **Channels are project-independent**: created at `/channels`, linked into projects at `/p/:slug/channels`. `accounts.project_id` and `owners.project_id` are nullable.
- **`platform_apps`**: OAuth client_id/secret moved from Worker secrets to encrypted DB rows. Helper at `api/src/lib/platform-apps.ts` (`getAppConfig` falls back to env vars if no DB row). UI to manage the rows is still pending (top of `new_plan.md`).
- **DateTime UI** wraps every timestamp render with a red-marker highlight (`web/src/components/DateTime.tsx` + `.dt` class).
- **CopyChip** click-to-copy chip used in setup steps (redirect URIs etc.).
- **Image upload fix (round 2)**: PUT body is the `File` itself (not `ArrayBuffer`) to dodge the iOS PWA RAM cap on fetch bodies; cache-bust on the URL. Service worker no longer intercepts `/api/*` at all (no Workbox route → browser handles natively).
- **ACL fix**: `you@example.com` removed from `neura-care.project_members` so neura-care visibility is owner-email-only.

## Deploy state

Live infra ids (account_id, zone_id, D1/KV/R2 ids, AUDs, Telegram bot id,
allowed chat ids) live in `../DEPLOY_STATE.md` and `api/wrangler.local.toml`
— both gitignored. See those files for the actual values.

Shape:
```
account            <CF account>
zone               <domain> → <zone_id>
worker             smm-api → <hostname> (custom domain)
D1                 smm
KV                 smm-kv
R2                 smm-media
queue              smm-publish (producer + consumer in same worker)
cron               * * * * *  (publish) + 30 3 * * * (reminders)

CF Access apps     smm-web              (gates the hostname)
                   smm-telegram-webhook (bypass /api/telegram/*)
IDP                One-time PIN
```

## Resuming cold

1. Read `pitch.md` (60s) → `now.md` (this file) → `glossary.md`.
2. `grep posted /Users/mac/workspace/personal/social_media_manager/CHECKLIST.md` for the next `[ ]`.
3. Code task → `file-map.md` to find the right module.
4. Deploy task → `../DEPLOY_STATE.md` + `gotchas.md`.
5. **Don't re-read `../plan/`** unless making an architecture-level
   decision — the plan is decision-time-historical, not current.
