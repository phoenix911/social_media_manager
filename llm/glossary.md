# Glossary

Terms that show up in code/docs and aren't obvious.

| Term | Meaning |
|---|---|
| **AUD** | Audience tag for a CF Access application. The Worker uses it to verify the JWT was issued for *this* Access app (not some other app on the same team). |
| **CF Access** | Cloudflare's Zero Trust gateway. Sits in front of any hostname, validates the user's identity, sets `CF_Authorization` cookie + injects `Cf-Access-Jwt-Assertion` header on every request. |
| **One-time PIN (OTP)** | The IDP we use. User types email → CF emails a 6-digit code → user enters it → session cookie is set. No 3rd-party IDP. |
| **Worker** | Single-script edge runtime. Our `smm-api` Worker handles HTTP (Hono app), cron (`scheduled` handler), and queue consumer (`queue` handler) all in one. |
| **D1** | Cloudflare's SQLite-on-the-edge. Same SQL dialect as SQLite. We use Drizzle ORM on top. |
| **R2** | Cloudflare's S3-compatible blob storage. Free egress is the killer feature. |
| **KV** | Cloudflare Workers KV. Eventually-consistent key-value store. We use it for OAuth state nonces, JWKS cache, rate limits. |
| **Queue** | Cloudflare Queues. We have one queue (`smm-publish`) carrying `{ draftId }` jobs. The same Worker is producer + consumer. |
| **`[assets]`** | New-ish Workers feature: the Worker can serve a static-asset directory directly via the `ASSETS` binding. We use it to ship the React SPA from the same Worker as the API. |
| **`run_worker_first`** | A wrangler config option that makes the Worker handle a path *instead of* the asset handler. We set it for `/api/*` so API routes don't 404 by hitting the static handler first. |
| **Project (in code)** | Top-level tenant unit. Every other row carries `project_id`. A project has members with roles. Examples: `paper-games`, `tapeline`. NOT to be confused with a Cloudflare Pages "project". |
| **Account (in code)** | A connected platform account inside a project. E.g. "the paper-games project's `@papergames` Twitter account". Stores OAuth tokens (encrypted). |
| **Adapter** | Per-platform module implementing `PlatformAdapter` (`api/src/platforms/types.ts`). Handles OAuth + publish for one platform. |
| **Publisher** | Subset of an adapter — the `publish()` method specifically. Called by the queue consumer at publish time. |
| **Native draft** | A draft stored on the platform itself (not just in our DB). LinkedIn supports this via `lifecycleState=DRAFT`. Reddit / Twitter / IG don't. |
| **Lazy refresh** | Token refresh strategy: refresh on read, just before use, if the token expires within 60 s. Implemented in `getDecryptedAccount`. We don't run a background refresh cron (except for IG, future). |
| **AES-GCM envelope** | Format we encrypt OAuth tokens with: `base64(<12-byte IV> || ciphertext || 16-byte tag)`. Decrypt is the inverse. Master key is `SMM_TOKEN_KEY` Worker secret. |
| **Atomic claim** | Cron's pattern: `UPDATE drafts SET status='publishing' WHERE id=? AND status='scheduled'`. Only the cron run that wins the race transitions the row; others see `changes !== 1` and skip. Replaces a SELECT-then-UPDATE that would race. |
| **Weekly thread resolver** | Reddit-specific helper: given a sub + regex, finds the current weekly self-promo thread by reading `/r/<sub>/about/sticky/{1,2}`. We need this because the iosgaming use case is "comment in this week's thread", and the thread URL changes each Saturday. |
| **Man-in-the-middle (Telegram)** | Our nickname for the Telegram bot's role: it sits between you and the publishing system, both notifying you of events and accepting commands (`/cancel`, `/retry`, …) so you never need to open the web UI for routine ops. |
| **`smm`** | Short for social_media_manager. The repo name, the bun-workspace root name, and the prefix for all Cloudflare resources (`smm-api` Worker, `smm-publish` Queue, `smm-media` R2 bucket, etc.). |
| **`tablepw`** | Our CF Access team domain. Reads as `tablepw.cloudflareaccess.com` in browser redirects. |
