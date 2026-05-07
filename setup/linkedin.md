# setup/linkedin.md

LinkedIn OAuth app for posting + native-draft pushing.

## Why we need it

LinkedIn is the only platform whose API supports **native drafts**
(`lifecycleState: DRAFT` on the Posts API). With these credentials we
can save a draft from SMM directly into the user's LinkedIn drafts —
they can finalize either in our UI or in LinkedIn's own composer.

## Pre-reqs

- A LinkedIn account.
- A **Company Page** you administer. **Required** even if you only
  ever post as yourself — the dev portal won't let you create an app
  without one. Create a free one in 2 minutes: settings → Company
  Pages → Create Page (you can use your name; "Sangeet Verma /
  Personal" is a fine page name).

## Steps

1. Go to <https://www.linkedin.com/developers/apps>.
2. Click **Create app**.
3. Fill in:
   - **App name:** `SMM` (or whatever)
   - **LinkedIn Page:** the company page from pre-reqs
   - **Privacy policy URL:** `https://smm.example.com/privacy` (we don't
     have one yet — use any working URL; LinkedIn doesn't validate
     content for personal-scope apps)
   - **App logo:** any 100×100 image
   - Tick the legal agreement → **Create app**
4. In the new app page, go to the **Auth** tab.
5. Under **OAuth 2.0 settings → Authorized redirect URLs**, add:
   `https://smm.example.com/api/oauth/linkedin/callback`
   Save.
6. Go to the **Products** tab. Request these two — both are
   instant-approval:
   - **Sign In with LinkedIn using OpenID Connect**
   - **Share on LinkedIn**
   Wait ~30 seconds for both to flip to "Added".
7. Back in **Auth** tab → **Application credentials** section:
   - **Client ID** — copy
   - **Client Secret** — click "View" → copy

## Update what_i_need.md

```env
LINKEDIN_CLIENT_ID=<client id>
LINKEDIN_CLIENT_SECRET=<client secret>
```

## Push to Worker secrets

```sh
cd api
wrangler secret put LINKEDIN_CLIENT_ID
wrangler secret put LINKEDIN_CLIENT_SECRET
wrangler deploy
```

## Verify

1. `/p/<slug>/accounts` → click **+ connect** on LinkedIn.
2. Authorize on LinkedIn.
3. Back in SMM: row populates with `<your name>`.
4. Open or create a draft, pick the LinkedIn account, write a body.
5. Click "save". (We'll add a "save as LinkedIn draft" button as a
   separate UI step; for now the API endpoint is
   `POST /api/drafts/:id/push-to-linkedin-draft`.)

## Gotchas

- **Marketing Developer Platform** is a separate product needing
  manual review (1–2 weeks) — only required if you want to post from
  a *company page* (vs. a personal profile). Skip until needed.
- **Refresh tokens rotate.** Every refresh returns a new
  `refresh_token`; we store it in place. If you ever clear the DB,
  users have to re-OAuth.
- **The Posts API doesn't support markdown.** Our preview pane
  strips markdown markers (`*`, `_`, `#`, etc.) — what you see in
  the preview is approximately what shows up in feed.
- **2,200-char hard limit** on `commentary`. We don't enforce
  client-side yet — the publish call will return 400 if exceeded.
- **The Posts API is the newer one.** If you find LinkedIn docs
  about UGC API: same thing, older surface. We use `/v2/posts`.
- **Privacy policy URL** doesn't have to be reachable for personal
  scopes; LinkedIn checks it on Marketing Developer Platform review
  only.
