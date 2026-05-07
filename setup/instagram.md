# setup/instagram.md

Meta app for Instagram Graph API. **The longest, hardest setup of
the five.** Start it now and work the other platforms in parallel.

## Why we need it

Posting images, carousels, and Reels to an Instagram Business or
Creator account. **Personal accounts cannot use the API at all** —
this is Meta policy, not our limitation.

## Pre-reqs

1. A Facebook account.
2. A Facebook Page (free, takes 2 minutes — facebook.com/pages/create).
3. An Instagram Business or Creator account. Convert your personal
   IG to one of these in IG settings → Account → Switch to
   professional account → Business / Creator.
4. The IG account must be **linked to the FB Page** from step 2.
   Settings → Account → Linked accounts → Facebook → Connect.
5. You must be admin of the FB Page (you are by default if you
   created it).

## Steps

### Phase 1 — create the Meta app (today, ~10 min)

1. Go to <https://developers.facebook.com/apps>.
2. Click **Create app** → use case **Other** → app type **Business**.
3. **App name:** `SMM` · **App contact email:** your email · **Business
   Account:** pick yours (or skip if no business account).
4. After creation: **App settings → Basic**:
   - **App Domains:** `smm.table.pw`
   - **Privacy Policy URL:** `https://smm.table.pw/privacy` (placeholder)
   - **Terms of Service URL:** `https://smm.table.pw/terms` (placeholder)
   - **Category:** Productivity
   - **App Icon:** any 1024×1024
5. **Add product → Instagram API with Instagram Login → Set up.**
   (NOT the legacy "Instagram Basic Display" — that one's
   deprecated for posting.)
6. Under that product → **API setup with Instagram business
   login → Generate token** — this gets you to the OAuth config:
   - Add **OAuth Redirect URI:** `https://smm.table.pw/api/oauth/instagram/callback`
   - Add **Deauthorize Callback:** `https://smm.table.pw/api/oauth/instagram/deauthorize` (optional but Meta nags)
   - Add **Data Deletion Request URL:** `https://smm.table.pw/api/oauth/instagram/delete` (optional)
7. **Copy from App settings → Basic:**
   - **App ID** — use as `META_APP_ID`
   - **App Secret** — use as `META_APP_SECRET`

### Phase 2 — submit for app review (this is the slow bit)

App review only matters when you want users *other than yourself*
(the "developer") to OAuth in. Until review passes, the app is in
**development mode** and only the developer's IG account works.

For Phase 2 of SMM (publishing), we need:
- `instagram_business_basic`
- `instagram_business_content_publish`

In the dev portal: **App Review → Permissions and Features** →
request both. Meta will ask for:

- A **screencast** of your app showing the connect + publish flow.
- The privacy policy URL must actually serve a privacy policy
  (placeholder won't pass).
- A short description of what your app does and why it needs each
  permission.
- Sometimes they ask for a "test user" account so reviewers can sign
  in themselves.

Expect 1–4 weeks of back-and-forth. Don't block other work on it.

## Update what_i_need.md

```env
META_APP_ID=<App ID>
META_APP_SECRET=<App Secret>
```

## Push to Worker secrets

```sh
cd api
wrangler secret put META_APP_ID
wrangler secret put META_APP_SECRET
wrangler deploy
```

## Verify (development mode only — pre-review)

1. `/p/<slug>/accounts` → click **+ connect** on Instagram.
2. You're bounced to `api.instagram.com/oauth/authorize`.
3. Sign in / authorize.
4. Bounced back; row shows `@your_ig_handle`.
5. The publish path returns 501 by design until we wire signed-R2-URL
   helpers — see `../plan/platforms/instagram.md` for the publish
   flow we'll implement once approved.

## Gotchas

- **PERSONAL IG accounts simply can't use this API.** The connect
  flow will fail with a clear "account_type=PERSONAL" error from
  our adapter. Instruct users to switch to Business / Creator first.
- **Long-lived tokens, no refresh token.** IG tokens last 60 days;
  refresh by re-exchanging the existing token. We have a daily
  refresh job in `api/src/scheduler/cron.ts` (Phase 2 cron) that
  keeps them fresh.
- **Public media URLs needed at publish time.** IG fetches the
  image / video from a URL we provide — must be HTTPS, must be
  publicly accessible at fetch time. Our R2 bucket is private; we
  mint short-lived signed GET URLs (planned, not yet implemented).
- **No drafts API.** IG mobile app has drafts (Reels only) but
  they're not exposed. SMM stores drafts locally; publishing
  bypasses the IG-side draft.
- **Stories are NOT supported by the Graph API.** IG Stories
  posting requires Enterprise approval — out of scope for us.
- **Carousel = parent + child containers.** Each child media gets
  its own create-container call with `is_carousel_item=true`, then
  the parent is created with `media_type=CAROUSEL` and a comma list
  of child container ids. Then publish the parent.
- **App review can fail because of the privacy policy.** Real-text
  privacy policy hosted at the URL. Don't use a 404 URL.
- **Two-factor on the Meta dev account is wise.** App review
  reviewers send messages via the dev portal — losing access mid-
  review is recoverable but annoying.
