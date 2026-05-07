# What this is — 60 seconds

**SMM (social_media_manager)** is an internal tool for drafting,
scheduling, and publishing posts to Reddit, LinkedIn, Twitter / X,
and Instagram across multiple side-projects. One web app. One small
team. Hosted entirely on Cloudflare for ~$5/month.

## The shape

- **One Worker** at `smm.table.pw` serves both the React SPA (static
  assets) and the `/api/*` routes. Same hostname, same auth, no CORS.
- **Cloudflare Access** with **One-time PIN** gates the whole
  hostname. Every request must carry a CF Access JWT cookie. Worker
  validates the JWT and looks up the user by email.
- **D1** holds metadata. **R2** holds media. **KV** holds OAuth
  state nonces and small caches. **Queues** drive Phase-2 publishes.
  **Cron** runs every minute to enqueue scheduled drafts.
- **Per-platform OAuth** — each user connects their Reddit /
  LinkedIn / Twitter / IG account from inside the app. Tokens are
  AES-GCM encrypted at rest in D1.

## Why it exists

I ship multiple projects. Distribution work — Reddit posts, LinkedIn updates, etc. — is
manual and scattered across platform UIs. This consolidates it.

## What it isn't

- **Not a SaaS.** Single team, gated by an email allowlist on
  Cloudflare Access. Not designed for sign-up flows.
- **Not Buffer.** No bulk-import, no AI auto-write (yet).
- **Not multi-platform-everywhere.** Only the four platforms above.
  No Mastodon, Bluesky, TikTok, YouTube — add only on real need.

## Phase boundary

- **Phase 0** — done. Foundations, Cloudflare resources, scaffolding.
- **Phase 1** — partly done. Drafts, accounts, multi-project, OAuth
  scaffolding. Per-platform draft preview is minimal. LinkedIn
  native-draft push is implemented; works once `LINKEDIN_*` creds
  arrive.
- **Phase 2** — partly done. Cron + Queue + Publishers (4 platforms)
  + Telegram bot (man-in-the-middle commands) all scaffolded.
  Real publishing requires platform OAuth credentials.
- **Phase 3** — not started. Analytics pull-back, attribution
  cross-link to `attrs.measures.fit`, content calendar, templates.

## What "works" right now without any platform credentials

- Login via OTP at `https://smm.table.pw`.
- Create projects, write drafts, save markdown, schedule for a
  future time, see them in a calendar view.
- The cron handler will pick them up at the right minute → fail
  gracefully ("not configured") → mark them as `failed` → notify
  via Telegram (if `TELEGRAM_BOT_TOKEN` is set).

## What unlocks each platform

Pasting credentials into `what_i_need.md` and running
`wrangler secret put` for each (or letting me do it). See
`stack.md` and `gotchas.md` for OAuth details per platform.
