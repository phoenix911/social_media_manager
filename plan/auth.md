# Auth

Two distinct auth concerns:

1. **App access** — who can sign into the social_media_manager web
   app at all. Solved by **Cloudflare Access (Zero Trust)**.
2. **Platform OAuth** — connecting a Reddit / LinkedIn / Instagram
   / Twitter account so we can post on its behalf. Solved by
   **per-platform OAuth 2.0 flows** stored in `accounts` table.

These are unrelated and use different libraries.

---

## 1. App access — Cloudflare Access (Zero Trust)

CF Access is the auth gateway. It doesn't *require* a 3rd-party IDP
— it can authenticate users on its own via one-time email codes.
Decision: **start with One-time PIN; add other IDPs later if and
only if the friction matters.**

### Login-method options (pick at least one)

**Decision: One-time PIN to email is the only IDP.** Google /
GitHub / SAML were considered and dropped during planning — we want
zero 3rd-party auth dependency.

| Option | Why not |
|---|---|
| **One-time PIN (chosen)** | Zero external setup, works for any email, same security level |
| Google OAuth | Adds a Google Cloud project to maintain; not needed |
| GitHub OAuth | Same — extra dependency for no real win |
| SAML / OIDC | Overkill for our team size |

### Why One-time PIN

- Zero external setup. No third-party OAuth app to maintain.
- Works for collaborators with any email — no Workspace requirement.
- Same security level — CF Access still enforces allowlist + session
  length.
- Trivial to add Google or another IDP later if email-code friction
  becomes annoying (5 minutes of CF dashboard config; no data-model
  change).

### Setup (one-time)

1. **Cloudflare Zero Trust dashboard** → Settings → Authentication.
   Confirm **One-time PIN** is enabled (it is, by default).
2. **Add an Access Application** for `smm.<domain>` and
   `api.smm.<domain>`:
   - Application type: Self-hosted
   - Session duration: 24h
   - Identity providers: One-time PIN
   - Policies:
     - Allow: explicit list of emails (you, teammates,
       collaborators)
     - Block: everything else (default)
3. **Service tokens** (optional, for CI/internal scripts) — issue
   one and store in 1Password. Useful for the cron Worker if it
   ever needs to call its own API.

### How it works in practice

- Browser hits `smm.<domain>` → Access intercepts → shows the chosen
  IDP (One-time PIN by default: enter email, get 6-digit code,
  enter code) → Access sets `CF_Authorization` cookie on the apex.
- Every request to the Worker (`api.smm.<domain>`) carries the
  cookie + a `Cf-Access-Jwt-Assertion` header that Cloudflare
  inserts. Worker reads it.
- The JWT payload contains the verified `email`, `iat`, and `exp`.
  With One-time PIN, no `name` or `picture` is provided — we ask
  for display name on first login and store it ourselves.

### Worker-side JWT verification

```ts
// pseudocode — we'll use jose or hand-rolled JWK verify
const jwt = req.headers.get('Cf-Access-Jwt-Assertion');
const jwks = await getCachedJwks(env);   // from team cert URL
const { payload } = await jwtVerify(jwt, jwks, {
  audience: env.CF_ACCESS_AUD,           // app AUD tag, set in CF dash
  issuer: `https://<team>.cloudflareaccess.com`,
});
const email = payload.email;
const user = await upsertUser(db, { email, name: payload.name });
return user;
```

Reject any request without a valid JWT with 401. CF Access *should*
make this impossible to reach, but defence in depth.

JWK keys cached in KV with a 1-hour TTL.

### First-time login flow

- User in our allowlist hits the app for the first time.
- CF Access lets them through.
- API receives request, decodes JWT, sees no row in `users` for
  that email.
- Auto-creates `users` row.
- Auto-adds them to a "default" project? **No.** They land on an
  empty dashboard with a "Create your first project" button. The
  *creator* of a project gets the owner role; existing project
  owners explicitly invite collaborators.

### Inviting a teammate

- Owner goes to `/p/<slug>/settings/members`.
- Adds an email + role.
- Adds a row to `project_members` with status `pending`.
- Email is also added to the CF Access allowlist (manual step in
  v1; could be automated via CF API in v2).
- When the invitee logs in, their `users` row is auto-created and
  the pending `project_members` row is matched on email and
  promoted to active.

### Why CF Access (over rolling our own)

- Free up to 50 users.
- Zero password code, zero MFA code, zero OAuth code.
- Audit log of every login already in CF dashboard.
- Easy to revoke access — remove from allowlist; user is signed
  out within 24h (session cap).
- No "forgot password" flow to maintain.

---

## 2. Platform OAuth (Reddit / LinkedIn / Instagram)

Each platform has its own OAuth 2.0 dance. Common pattern:

### Connect flow

1. User clicks "Connect Reddit" on `/p/<slug>/accounts`.
2. Frontend hits `POST /api/oauth/reddit/start?project_id=...`.
   Worker:
   - Generates a CSRF nonce, stores `{ project_id, user_id, return_to }`
     in KV under that nonce, 10min TTL.
   - Redirects to platform's authorize URL with our `client_id`,
     `redirect_uri = https://api.smm.<domain>/api/oauth/reddit/callback`,
     scopes, and nonce as `state`.
3. User authorizes on platform.
4. Platform redirects to our callback with `?code=...&state=<nonce>`.
5. Worker:
   - Validates nonce → KV; if missing or expired, 400.
   - Exchanges `code` for tokens (POST to platform's token endpoint).
   - Calls platform's "me" endpoint to get external_id + handle.
   - Encrypts tokens (AES-GCM, see [data-model.md](data-model.md)
     §"Crypto").
   - Inserts row in `accounts`.
   - Redirects browser back to `/p/<slug>/accounts`.

### Refresh

- Workers have no background threads, so we refresh **lazily** —
  the moment we need a token:

```ts
async function getAccessToken(account, env) {
  if (Date.now() < account.expires_at - 60_000) {
    return decrypt(account.access_token);
  }
  // refresh
  const tokens = await refreshOnPlatform(account.platform, decrypt(account.refresh_token));
  await db.update(...);
  return tokens.access_token;
}
```

Token rotation handled per-platform — see platform docs in
[platforms/](platforms/).

### Revocation

- User clicks "Disconnect" on the account.
- Worker calls platform's revoke endpoint (best-effort), sets
  `revoked_at`, zeroes out token columns.
- Drafts that referenced this account become un-publishable; UI
  shows a warning and offers to re-link.

### Token storage

| Concern | Mitigation |
|---|---|
| Tokens in DB → DB compromise | AES-GCM at rest, key in Worker secret |
| Tokens in logs | Strict log redaction; never `console.log(account)` |
| Token in browser | NEVER. The browser never sees platform tokens. |
| Token in env | Master AES key in `wrangler secret`, not in `.dev.vars` checked to git |

### CSRF / XSS surface

- All API calls require the CF Access cookie. Cross-origin POSTs
  fail at the Access layer.
- We still add CSRF tokens for state-changing requests (defence
  in depth; Hono has middleware).
- Output sanitization: drafts are markdown stored as plain text;
  rendered with `marked` + DOMPurify on the client. Never
  `dangerouslySetInnerHTML` of unsanitized server data.

---

## Threat model summary

| Threat | Mitigation |
|---|---|
| Random internet stumbling onto the app | CF Access policy → 403 before request hits us |
| Compromised email inbox | One-time PIN delivery → if the email is compromised, attacker gets in. Mitigation: 24h CF Access session cap forces re-auth; remove the email from allowlist immediately on suspicion |
| DB leaked | OAuth tokens encrypted, no plaintext credentials |
| Malicious draft body (XSS) | Markdown stored raw; rendered through DOMPurify |
| Compromised platform token | Per-platform revoke endpoint on disconnect; least-privileged scopes |
| Mistakenly published draft | Phase 1 has no auto-publish; Phase 2 has a 30s "undo" window before queue picks it up |
