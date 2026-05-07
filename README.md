# social_media_manager (smm)

A small, multi-project, multi-channel social-posting tool. One Cloudflare
Worker hosts the SPA + API. Drafts are written in Markdown, organised by
**Project → Track → Draft**, scheduled in UTC, published via platform APIs,
and gated by Cloudflare Access (One-time PIN to email).

Live: <https://smm.example.com> (private; gated by CF Access).

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/phoenix911/social_media_manager)

> The deploy button creates the Worker + D1 + KV + R2 bindings on your
> account, then prompts for the env vars listed in
> [`what_i_need.example`](./what_i_need.example).

## What it does

- **Draft once, post many.** A single Markdown body, with platform-specific
  overrides (Reddit subreddit + flair, LinkedIn visibility, Twitter thread
  splits, IG carousel order, PH topic).
- **Tracks group drafts into a coordinated campaign** on a single channel.
  Move the track's `start_at` and every draft inside reschedules
  automatically (`scheduled_for = start_at + offset_minutes`).
- **Channels are project-independent.** Connect a Reddit / LinkedIn /
  Twitter / Instagram / Product Hunt account once at `/channels`, then link
  it into any project at `/p/<slug>/channels`.
- **Visibility via owners.** Each channel has one or more *owners*; an owner
  has one or more email addresses; you see a channel only if your CF Access
  email matches one of those owner emails.
- **Schedule + publish via Cron Trigger + Queue.** A 1-minute cron picks up
  due drafts and dispatches them to platform-specific publishers.
- **Telegram bot for ops.** Notifications + inline-button menu for
  approve / cancel / retry without opening the web UI.

## Stack

| Layer | Choice |
|---|---|
| Runtime | Cloudflare Workers (Hono, TypeScript, single Worker for SPA + API) |
| DB | Cloudflare D1 (SQLite-compatible), Drizzle ORM, UUIDv7 IDs |
| Media | Cloudflare R2 |
| Queue | Cloudflare Queues |
| Schedule | Cloudflare Cron Triggers (`* * * * *` publish, `30 3 * * *` reminders) |
| Frontend | React + Vite + Tailwind v4 + shadcn/ui-style components, vite-plugin-pwa |
| Auth | Cloudflare Access (One-time PIN) — single cookie, no CORS, no IDP |
| Encryption | AES-GCM at rest for OAuth tokens and platform-app credentials |

Total infra cost: **$5/mo** (Workers Paid; everything else fits free tier).

## One-shot deploy

1. Click **Deploy to Cloudflare** above (creates Worker + bindings on your
   account, forks the repo into your GitHub).
2. Copy `what_i_need.example` to `what_i_need.md` and fill in the values.
3. Push platform secrets:
   ```bash
   make secrets   # wraps `wrangler secret put` for every var in what_i_need.md
   ```
4. Apply migrations:
   ```bash
   cd api && bun run db:migrate
   ```
5. Add your CF Access email to the allowlist, and visit
   `https://smm.<your-domain>`.

Manual / from-scratch steps live in [`setup/README.md`](./setup/README.md).
Per-platform OAuth setup (redirect URIs, scopes, app review notes) lives
in `setup/<platform>.md`.

## Repo layout

```
api/         Cloudflare Worker — Hono routes, D1 schema (Drizzle), publishers
web/         React SPA (served by the Worker; same origin, no CORS)
shared/      Types + zod schemas used by both api/ and web/
setup/       Per-platform OAuth setup notes
plan/        Original design docs (historical; do not re-read by default)
llm/         AI-assistant context — pitch / now / glossary / file-map / gotchas
CHECKLIST.md Done-vs-pending list, single source of truth for status
new_plan.md  Forward-looking feature roadmap
```

## Pages

```
/                              project picker + channel pills
/channels                      add a new channel (OAuth or manual paste)
/p/:slug                       project dashboard — tracks list
/p/:slug/t/:trackId            track detail — drafts ordered by sequence
/p/:slug/draft/:id             draft editor (preview, offset, channel, media)
/p/:slug/calendar              scheduled drafts grouped by day
/p/:slug/channels              link existing channels into this project
/p/:slug/owners                manage owners + emails (visibility ACL)
```

## Schema (high level)

```
users
  └─ project_members ─ projects
                           ├─ tracks ─ drafts ─ draft_media ─ media (R2)
                           │             └─ publishes
                           ├─ project_accounts ─ accounts ────┐
                           └─ owners (project_id NULL = global)│
                                  └─ owner_emails              │
                                  └─ account_owners ───────────┘
                           platform_apps  (encrypted OAuth client config)
```

All timestamps stored as **UTC ISO 8601**. Display uses
`Intl.DateTimeFormat` with the user's tz or `track.tz`.

## Time / scheduling model

`track.startAt` is the campaign anchor. Each draft has
`trackOffsetMinutes` (signed integer): `scheduledFor = startAt + offset`.
Recompute happens automatically on `PATCH /api/tracks/:id` and on draft
offset edits. Adhoc tracks have `startAt = NULL` and per-draft manual
schedules.

## Telegram bot

`@<your-bot>`. Webhook at `/api/telegram/<TELEGRAM_WEBHOOK_SECRET>`.
Three layers of access control: URL secret + `X-Telegram-Bot-Api-Secret-Token`
header + `TELEGRAM_ALLOWED_CHAT_IDS` allowlist (numeric ids or `@usernames`).

Commands: `/help`, `/start`, `/today`, `/scheduled`, `/projects`,
`/cancel <id>`, `/retry <id>`, `/whoami`. All hand-driven via inline buttons.

## Security notes

- **Auth.** Whole hostname is gated by Cloudflare Access. The Worker only
  trusts the `Cf-Access-Jwt-Assertion` header (verified against the AUD).
- **Tokens.** OAuth access/refresh tokens are AES-GCM encrypted before
  insert into D1; key is `SMM_TOKEN_KEY` (32 random bytes, base64).
- **Platform-app secrets.** Live in the `platform_apps` table, encrypted
  with the same key. Add new apps without redeploying.
- **Telegram webhook bypass.** A second CF Access app applies a bypass
  policy to `/api/telegram/*` so Telegram can reach the Worker; the route
  itself revalidates the URL secret and Telegram's secret-token header.
- `what_i_need.md` and `DEPLOY_STATE.md` are gitignored — only their
  `.example` siblings are committed.

## Local dev

```bash
bun install
bun run dev       # api + web concurrently
```

The dev Worker runs at `localhost:8787`; Vite at `localhost:5173`. Vite
proxies `/api/*` to the Worker. CF Access is bypassed locally; OAuth
callbacks need `https://` so use `wrangler dev --remote` when testing
real OAuth.

## Status

Active build. See [`CHECKLIST.md`](./CHECKLIST.md) for the full
done-vs-pending list and [`new_plan.md`](./new_plan.md) for the next
features.

## License

MIT. Internal-use tool, but the code is fine to copy.
