# TODO — Instagram OAuth flow (Path B, deferred)

Saved for future reference. For now we're using the **manual token injection** path
(plaintext IG long-lived token pasted into `what_i_need.md`, encrypted server-side
via a session-auth-guarded endpoint). This file is the plan for when we want to
replace that with a real in-app OAuth flow so re-tokenisation is hands-off.

## Why we'd switch later

- IG long-lived tokens expire in **~60 days**. Manual injection means a calendar
  reminder + redo every two months. The OAuth flow + a refresh cron makes that
  automatic.
- Lets non-engineers connect their own IG channels via `/channels` (currently the
  endpoint exists but the IG `exchangeCode` happy-path hasn't been exercised
  end-to-end in production).
- Symmetrical with the other platforms (Reddit, LinkedIn, Twitter) which all use
  the OAuth callback flow.

## Where things stand

- `api/src/platforms/instagram.ts` already has:
  - `startOauth(env, nonce)` — builds the `api.instagram.com/oauth/authorize` URL
  - `exchangeCode(env, code)` — three-step exchange (short → long → /me) returning
    `{ accessToken, expiresAt, scopes, externalId, handle, meta }`
  - `refresh(env, refreshToken)` — re-exchanges the long-lived token via
    `graph.instagram.com/refresh_access_token`
  - `publish(env, input)` — **stubbed**, returns `501 ig_publish_not_implemented`
- `api/src/routes/oauth.ts` already wires `/api/oauth/:platform/start` +
  `/callback` to the adapter registry. IG should "just work" once `META_APP_ID`
  + `META_APP_SECRET` are present (✅ they are).

## To actually finish Path B

### 1. Add `instagram` redirect URI in the Meta app dashboard

The redirect URI in the Meta dashboard must match exactly:
`https://smm.table.pw/api/oauth/instagram/callback`

(Step 2 in `insta_need.md` flags this as a pending checkbox.)

### 2. Test the existing OAuth scaffolding end-to-end

1. Log into <https://smm.table.pw> as a project owner.
2. Go to `/channels` → "+ Connect Instagram".
3. The web triggers `POST /api/oauth/instagram/start` → opens Meta's
   consent screen → returns to `/api/oauth/instagram/callback?code=…`.
4. Callback exchanges the code, builds the long-lived token, runs `/me`,
   inserts an `accounts` row via `insertAccount` (which AES-GCM
   encrypts the token).
5. The web redirects to `/channels` showing the new connected account.

If this works first-try the only "feature" missing is automated refresh.

### 3. Replace the dummy account row OR keep it

Two options once the real OAuth-flow account exists:

- **A. Migrate.** Update the launch track + 60 drafts to point at the
  new account_id; delete the dummy row.
  ```sql
  UPDATE tracks SET account_id = '<new-real-acct-id>'
   WHERE id = '019e2f74-7b75-7f03-b6eb-0491e7cb5e81';
  UPDATE drafts SET account_id = '<new-real-acct-id>'
   WHERE track_id = '019e2f74-7b75-7f03-b6eb-0491e7cb5e81';
  DELETE FROM accounts WHERE id = '019e2f82-e8c7-7182-8f94-5bb148e9ad43';
  ```
- **B. Overwrite.** Update the dummy row in place with the real token +
  external_id (no FK churn).
  ```sql
  UPDATE accounts SET
    access_token = '<encrypted-by-OAuth-callback>',
    external_id  = '<real-ig-user-id>',
    expires_at   = '<60-days-out>',
    scopes       = 'instagram_business_basic,instagram_business_content_publish',
    meta         = json_set(meta, '$.placeholder', json('false'))
   WHERE id = '019e2f82-e8c7-7182-8f94-5bb148e9ad43';
  ```

Option B preserves the dummy row's id, so the 60 draft bindings stay
identical. Probably what we want.

### 4. Token refresh cron

IG long-lived tokens expire after ~60 days. The adapter exposes
`refresh(env, accessToken)` but no scheduler calls it yet.

- Add a daily cron handler (`scheduler/token-refresh.ts`) that queries
  `accounts WHERE platform='instagram' AND expires_at < datetime('now', '+7 days') AND revoked_at IS NULL`
  → calls `adapter.refresh(env, plaintextToken)` → writes the new
  envelope + `expires_at`.
- Hook it into `api/wrangler.toml` cron triggers (next to the existing
  `30 3 * * *` reminders cron).
- Or do the refresh lazily inside `getDecryptedAccount` — already
  partially in place, just needs to honour the refreshed envelope being
  written back to the row.

### 5. Publish path — separate work

The OAuth flow getting a working token doesn't get us posting yet —
`instagram.publish()` is still stubbed. Needs:

- R2 signed-URL helper (`api/src/lib/r2.ts` → `signedR2GetUrl(env, key, ttl)`)
  — see `llm/gotchas.md` #11.
- Container-then-publish loop (image / reel / carousel branches).
- Polling on container status until `FINISHED`.
- Capturing the returned IG media id into `publishes.platform_post_id`.

These are tracked in `insta_need.md` steps 8 + 9.

## Switch-over signal

Switch from manual injection to Path B **when** any of:

- The current token approaches its 60-day expiry (set a reminder ~Day 50).
- A second IG account needs onboarding (the manual path scales to 1, OAuth scales to N).
- The launch track wraps and we want to keep posting beyond Jul 3 without manual ops.

Until then, the manual `POST /api/accounts/:id/inject-token` endpoint is
enough.
