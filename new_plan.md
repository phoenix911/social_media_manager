# new_plan — forward-looking features

A living list of features we want next. Roughly ordered by priority. Each
entry has a one-line *why* so the order can be re-litigated. Items move to
`CHECKLIST.md` once they ship.

## Now (next 1–2 sessions)

### Platform-apps UI (`/admin/oauth-apps`)
Manage OAuth client credentials from the web instead of via Worker secrets.
Schema and `getAppConfig()` already exist (`platform_apps` table, migration
0007); this is the wiring + the UI.
- `GET /api/platform-apps` — list (label + platform; never decrypt to client)
- `POST /api/platform-apps` — write encrypted config
- `PATCH /api/platform-apps/:id` — relabel / archive
- Web page with one card per platform, "+ add app", reveal-only redirect URI
- OAuth start picks the app: `?appId=` or auto-pick when only one exists
- Migrate every adapter (Reddit / LinkedIn / Twitter / IG / PH) to read from
  `getAppConfig(env, platform, account.platformAppId)` instead of `env.*`

### Per-account daily token refresh cron
Right now we refresh on use; long-idle channels expire silently.
- New cron (`0 4 * * *`) iterates active accounts, refreshes any token whose
  `expires_at` is within 48 h
- Per-platform refresh strategies live in the existing adapter
- Failed refresh → mark account `revoked_at` and audit-log it

### Toasts replacing `alert()` / `confirm()`
Half a dozen `alert()`s in the codebase look ugly on mobile and block other UI.
- Add a tiny toast layer (sonner is the default; or a 30-line homegrown one)
- Replace `alert(msg)` with `toast.error(msg)` everywhere
- Replace `confirm(msg)` with a `<ConfirmDialog>` shadcn pattern

## Soon

### Auto-save drafts (debounced)
Editor currently relies on explicit save. Lose-tab = lose-work.
- 1.5 s debounce on body / title / platformOptions changes
- Visible "saving…" / "saved 12s ago" indicator using `<DateTime>`
- Conflict detection via `updatedAt` ETag (409 → reload + warn)

### LinkedIn save-as-draft
LinkedIn's API supports posts in `DRAFT` lifecycle; we publish straight to
`PUBLISHED` today. A "save as LinkedIn draft" button lets the user finalise
inside LinkedIn before pressing publish there.
- New action button in `DraftEditor` for LinkedIn drafts
- New status `linkedin_drafted` (or reuse `published` with a meta flag —
  decide before implementing)

### Twitter media upload (OAuth1.0a)
Twitter v2 still requires v1.1 chunked upload for media; our adapter today
only handles text threads.
- Implement `INIT` / `APPEND` / `FINALIZE` against `upload.twitter.com`
- HMAC-SHA1 signing helper (existing `crypto.ts` is AES-only — add lib)
- Wire `media[]` from drafts into the publish flow

### Instagram publish via R2 signed URLs
IG Graph API needs a public URL, not a Blob. R2 doesn't sign by default.
- Public R2 bucket *or* CF Access-bypassed signed URLs for `/api/media/:id/raw`
- Container POST → status poll → publish POST sequence in adapter
- Reels vs Image vs Carousel branch in `platformOptions`

## Later

### Loading skeletons everywhere
Current loading state is `loading…` text. Shadcn-style skeleton cards on:
home, project dashboard, channels list, draft list, calendar.

### Per-platform validation hints in editor
Reddit char limits, IG hashtag count, Twitter thread tweet length per node.
Show a soft warning chip below the body field.

### Audit-log writer middleware
`audit_log` table exists but nothing writes to it. Hono middleware that
captures actor + projectId + action for every mutating route.

### Analytics phase 3
- Per-platform reach / engagement pull (where API allows)
- Stored as time-series in a new `metrics` table
- Sparklines on the project dashboard

### Search drafts by title / body
Full-text on a small dataset is fine via SQLite `LIKE`; revisit if it grows.

### Draft duplication
`POST /api/drafts/:id/duplicate` — common when reposting a winner.

### Reorder media in carousel
Drag-to-reorder using `dnd-kit` (avoid bringing in the full `react-beautiful-dnd`).

### Project owner-based visibility (option B)
Today projects are visible via `project_members`. Extend to also resolve via
project owner-emails so adding a teammate by email doesn't require a separate
membership row.

## Backlog (sketches only — revisit before starting)

- Mobile-only quick-compose entry on home (1 tap → editor pre-filled)
- Recurring tracks ("weekly recap on Friday 5pm")
- Comment / reply ingest (read-only) per platform
- Multi-actor publish: pick which channel-owner's token to publish with when
  multiple owners exist
- Slack notifications mirroring the Telegram bot
- AI-assisted rewrite per platform (Reddit voice / LinkedIn voice / etc.)
- Bulk import drafts from a markdown file or Notion export
