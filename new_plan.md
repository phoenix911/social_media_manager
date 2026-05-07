# new_plan — forward roadmap

Functionality first, UI/UX last. "Now" is what blocks a real publish or
onboarding flow today. UI polish and integrations beyond the existing
five platforms wait. Items move to `CHECKLIST.md` once they ship.

## Now — functional unblockers

The publishing pipeline is wired but has gaps that surface only when
you actually try to post. These remove those gaps.

### 1. Token refresh on use
Every adapter currently posts with whatever access token is on the
account row. After ~8 hours / 60 days (varies by platform) those
silently 401 mid-publish.
- Adapter checks `account.expiresAt`; if `< now + 5m`, calls `refresh()`
  and writes the new tokens back via `insertAccount`/AES-GCM encrypt
  before posting.
- Centralise in a wrapper `withFreshTokens(adapter, account, fn)` so
  every publisher path goes through it.
- Reddit, LinkedIn, Twitter, Instagram all need this. Product Hunt has
  no refresh.

### 2. Platform-apps UI
Schema (`platform_apps`) and `getAppConfig()` exist, no UI to manage
them, and adapters still read `env.X_CLIENT_ID` directly.
- `GET /api/platform-apps`, `POST` (encrypts via existing AES-GCM key),
  `PATCH` (relabel/archive). No plaintext returned after create.
- Page at `/admin/oauth-apps` — one card per platform, "+ add app",
  reveal-only redirect URI.
- Migrate every adapter to `getAppConfig(env, platform, account.platformAppId)`
  with env fallback.
- OAuth start picks the app: `?appId=` or auto-pick when only one exists
  for that platform.

### 3. Per-account daily token refresh cron
Belt-and-braces against the on-use refresh missing edge cases.
- New cron `0 4 * * *` walks active accounts; refreshes any token whose
  `expires_at` < 48h.
- On refresh failure marks the account `revoked_at` and Telegram-pings
  the owner.

### 4. Twitter media upload
Adapter currently text-only (`twitter.ts` header explicitly says so).
- v1.1 chunked upload: `INIT` / `APPEND` / `FINALIZE` against
  `upload.twitter.com`.
- New HMAC-SHA1 signing helper in `lib/crypto.ts` (existing file is
  AES-only).
- Wire `media[]` from drafts into the publish flow; attach
  `media_ids` to v2 tweet create.

### 5. Instagram publish flow
Today `instagram.ts` `publish()` is a 501 stub.
- R2 public-URL helper (or CF Access-bypassed signed URLs for
  `/api/media/:id/raw`).
- Container POST → status-poll → publish POST sequence.
- Branch on `platformOptions.kind`: feed image / reel / carousel.

### 6. LinkedIn save-as-draft
Adapter has `pushDraft()` (lifecycleState=DRAFT). No route, no button.
- `POST /api/drafts/:id/push-to-linkedin-draft` — calls adapter, stores
  returned URN as `platformDraftId`.
- Status flag or `meta` field on the draft so UI can show "drafted on
  LinkedIn".

### 7. Per-account publish serialisation
Two queue jobs targeting the same channel can fire in parallel and
trip platform rate limits. Take a per-account lock in the queue
consumer.
- Use D1 conditional update on `accounts.publishing_until` (new column,
  stamps `now + 60s` if null/past). Job retries with backoff if locked.

## Soon — depth-of-publish + automation

### 8. Failed-publish retry endpoint + UI
Backoff exists but on exhaustion the only recovery is `/retry <id>`
in Telegram.
- `POST /api/publishes/:id/retry` — re-enqueues if status=`failed`.
- "Failed" filter chip on draft list and a one-click retry button.

### 9. Audit-log writer middleware
`audit_log` table exists, nothing writes to it (except a single
`scheduler.tick` row), nothing reads. Without this, multi-user
collab is opaque.
- Hono middleware on every mutating route: capture
  `actorId / projectId / action / targetType / targetId / payload`.
- `GET /api/projects/:id/audit?since=` for read.

### 10. Draft duplication
`POST /api/drafts/:id/duplicate` — copies body, platformOptions,
media attachments; sets `status=draft`, `scheduledFor=null`,
`sequenceInTrack` = existing max + 1.

### 11. Search / filter on drafts
Endpoint already supports `status` + `trackId`; add `q` (LIKE on
title/body, SQLite `LIKE` is fine at our scale) and a project-scoped
filter UI on the drafts list.

### 12. Auto-save drafts
Debounced PATCH every 1.5s while editing; conflict via `updatedAt`
ETag (409 → reload + warn).

### 13. Per-platform validation hints in editor
Soft-warning chips below the body field:
- Reddit: 40 000 char self-post / 300 char title.
- Instagram: ≤ 30 hashtags, 2 200 char caption.
- Twitter: 280 chars per tweet (per node when threading).
- LinkedIn: 3 000 char post.

### 14. Reorder media in carousel
`dnd-kit`, persists `position` on `draft_media` rows.

### 15. Recurring tracks
`tracks.recurrence` column (`weekly | monthly | null`); cron clones
the next occurrence's drafts at the boundary (offset minutes carried).

### 16. Cross-project calendar
Today `/p/:slug/calendar` is per-project. Add `/calendar` (no slug)
that aggregates scheduled drafts across every project the user
sees.

## Later — analytics, inbound, AI

### 17. Analytics phase 3
- Daily cron pulls reach / engagement per platform where API allows.
- New `metrics` table (time-series).
- Sparkline + best-time-to-post hint on project dashboard.

### 18. Comment / reply ingest (read-only)
Reddit + Twitter first; surface as a "replies" tab on draft detail.
No interactive replies — just visibility.

### 19. AI rewrite per platform
Wire to an LLM endpoint with the `mcp.md` behavioural rules baked in.
"Rewrite for Reddit voice", "tighten this for Twitter thread".

### 20. Bulk import drafts
From a markdown directory or Notion export. Each `.md` becomes a
draft; YAML front-matter maps to track + scheduledFor + platform
options.

### 21. Multi-actor publish
When a channel has multiple owners, pick which owner's token to
publish with at schedule time (some platforms key rate-limits per
authenticated user).

## UX polish — after functional work

### 22. Toasts
Replace every `alert()` / `confirm()` with a toast layer + a
shadcn-style `<ConfirmDialog>`.

### 23. Loading skeletons
Home / project dashboard / channels / draft list / calendar.

### 24. Mobile quick-compose
Tap an FAB on home → editor pre-filled with default project + last-used
track.

### 25. Slack notifications
Mirror the Telegram bot's notify events.

### 26. New platform integrations
Threads, Mastodon, Bluesky, TikTok. Each ~1 day.

### 27. In-browser image editing
Crop / brightness / aspect-ratio before upload.

## Backlog — revisit before starting

- **Project owner-based visibility (option B)** — resolve project
  visibility through `owners + owner_emails` so adding a teammate by
  email doesn't require a separate `project_members` row. Today the
  two ACLs (project membership for project visibility, owner-email for
  channel visibility) feel duplicative when a "founders" owner already
  exists.
- **Per-user notification preferences** — which events route to
  Telegram (publish.success vs only publish.failed; daily vs none).
- **Collab surface — full** (draft-lock with revision number, in-app
  `@-mentions`, review queue with approve/reject). Defer until the
  team is > 5.
- **Operator/admin dashboard** — list all users / sessions / failed
  publishes / token health / API keys account-wide. Useful but not
  blocking until we have multiple operators.
- **Open-sourcing the schema** — release the `plan/` original docs
  separately for anyone forking the deploy template.
