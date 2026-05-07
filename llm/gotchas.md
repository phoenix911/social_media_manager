# Gotchas — non-obvious things that bit us

Read before debugging. Each entry has the symptom, the cause, and the fix.

---

### 1. `Cf-Access-Jwt-Assertion` header is missing in dev

**Symptom.** `wrangler dev` returns 401 from every endpoint.

**Cause.** CF Access only injects the header in production traffic.
`wrangler dev` is local — Access isn't in the loop.

**Fix.** Send `Cf-Access-Jwt-Assertion: dev` + `X-Dev-Email:
you@example.com`. The middleware bypasses verification when the JWT
is the literal string `"dev"` AND `env.ENVIRONMENT === 'dev'`. The
web's `lib/api.ts` does this automatically using
`localStorage.smm.devEmail`.

---

### 2. `tokens/verify` endpoint returns "Invalid API Token"

**Symptom.** Permission probe shows token verification failing even
though all other API calls succeed.

**Cause.** `/user/tokens/verify` requires `User Details:Read`
permission, which we deliberately don't grant.

**Fix.** Ignore that endpoint. Probe specific resources directly
(workers/scripts, d1/database, etc.).

---

### 3. Worker custom domain conflicts with Pages

**Symptom.** `wrangler deploy` fails because `smm.table.pw` is
"already in use."

**Cause.** Pages had bound the domain. Cloudflare doesn't allow
two services on the same hostname.

**Fix.** Remove the Pages domain binding via API, delete the
auto-created CNAME, then redeploy the Worker. (Done in this repo
when consolidating to single-Worker.)

---

### 4. Worker `[assets]` requires a `workers.dev` subdomain

**Symptom.** `wrangler deploy` succeeds for the Worker upload but
fails registering schedules / triggers with "You need a workers.dev
subdomain."

**Cause.** Some endpoints require the account to have visited the
Workers dashboard once (which auto-claims `<id>.workers.dev`).

**Fix.** Claim it via API:
```bash
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  https://api.cloudflare.com/client/v4/accounts/$ACCT/workers/subdomain \
  -d '{"subdomain":"<some-name>"}'
```

---

### 5. CF Access cookies don't cross subdomains

**Symptom.** When we ran `smm.table.pw` (web) and
`api.smm.table.pw` (api) as separate Access apps, the user had to
log in twice (once per hostname) on first visit.

**Cause.** Each Access app has its own per-hostname `CF_AppSession`
cookie. The team SSO cookie is shared, so the *second* login is
silent (no second OTP) — but it still happens, with a brief
redirect dance.

**Fix.** Consolidated to ONE hostname (`smm.table.pw`) serving both
SPA + API from the same Worker via `[assets]`. One Access app, one
cookie, one login. **Don't go back to the split-domain model
without a strong reason.**

---

### 6. Cron-trigger atomic claim

**Symptom.** Theoretical: two cron firings could pick the same
draft and double-publish it.

**Cause.** Cron handlers can overlap if a previous run is slow.

**Fix.** `runScheduler` does `UPDATE drafts SET status='publishing'
WHERE id=? AND status='scheduled'` and only enqueues if
`changes === 1`. The atomic transition is the lock. Don't replace
this with separate SELECT-then-UPDATE.

---

### 7. Twitter PKCE state lives in KV

**Symptom.** Twitter OAuth callback fails with
"oauth_state_invalid".

**Cause.** PKCE requires the verifier (random secret) generated at
authorize-time to be presented at token-exchange-time. We stash
it in KV under the OAuth nonce with a 10-minute TTL.

**Fix.** Don't expire faster than 10 min, and ensure
`twitter:pkce:<nonce>` is being written + deleted in lockstep.

---

### 8. Instagram has no refresh token

**Symptom.** Refreshing IG account 60 days in returns "no refresh
token".

**Cause.** IG long-lived tokens are refreshed by **re-exchanging the
existing token** for a new long-lived token (no separate refresh
token concept).

**Fix.** Our IG adapter's `refresh()` takes the existing access
token where the type expects "refreshToken" — semantic mismatch
intentional. Don't refactor unless you're updating the adapter
contract for all four platforms.

---

### 9. LinkedIn `posts` API returns the URN in a header, not body

**Symptom.** Post created but our `platformPostId` was empty.

**Cause.** LinkedIn's modern Posts API puts the new post URN in the
`x-restli-id` response header, not the JSON body.

**Fix.** `linkedin.ts publish()` reads the header. If you upgrade
the LinkedIn version (`LinkedIn-Version`), re-test this — it has
moved before.

---

### 10. Reddit User-Agent must be unique

**Symptom.** Reddit returns 429 / 403 for legitimate-looking
requests.

**Cause.** Reddit bans generic user agents. UA must look like
`web:smm:0.1 (by /u/<your-reddit-username>)`.

**Fix.** Set `REDDIT_USERNAME_FOR_UA` (or override
`REDDIT_USER_AGENT` directly). This is per-Worker, not per-user.

---

### 11. R2 + Instagram public URLs

**Symptom (future).** IG container creation fails because
`image_url` isn't reachable.

**Cause.** IG's servers fetch the URL from their network. R2 is
private by default.

**Fix (planned).** Mint short-lived signed R2 GET URLs (24h
TTL) just before creating the IG container. The
`InstagramPublisher` is currently stubbed for this reason. Don't
make the bucket public — exposes everyone's media.

---

### 12. Telegram webhook has no signature

**Symptom.** Anyone hitting `/api/telegram/<secret>` could pretend
to be Telegram.

**Cause.** Telegram doesn't sign webhooks (yet).

**Fix.** Use a long random string in the URL path
(`TELEGRAM_WEBHOOK_SECRET`). Compare in route handler. Treat the
secret like any other secret — never log it.

---

### 13. Drizzle `onConflictDoUpdate` requires composite-target

**Symptom.** Conflict-update on `accounts` doesn't trigger.

**Cause.** Need to specify the *unique index columns* as `target`,
not the table.

**Fix.** Done in `account-tokens.ts insertAccount`:
```ts
.onConflictDoUpdate({
  target: [schema.accounts.projectId, schema.accounts.platform, schema.accounts.externalId],
  set: { … },
})
```
The unique index `accounts_unique` is on those three columns.

---

### 14. Web app paths are relative

**Symptom.** API calls in production try to hit `https://smm.table.pw/api/…` from the SPA — works because we're now same-origin.

**Cause.** Single Worker serves both SPA + API at `smm.table.pw`. SPA uses relative `/api/...` paths. No CORS, no separate API base URL, no `VITE_API_BASE` env.

**Fix.** **Don't introduce a separate API hostname** without re-architecting auth. The whole point of consolidation was that everything is one origin.
