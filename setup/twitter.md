# setup/twitter.md

Twitter / X OAuth 2.0 app (+ OAuth 1.0a for media uploads).

## Why we need it

Posting tweets and threads from SMM. We use OAuth 2.0 with PKCE for
text; media upload (when we add it) needs the legacy v1.1 endpoint
which still requires OAuth 1.0a. Both flows share one app
registration.

## Pre-reqs

- A Twitter / X account that's **phone-verified** (the dev portal
  refuses unverified accounts).
- That account ideally isn't a freshly-created burner — Twitter
  treats new dev accounts skeptically.

## Steps

1. Go to <https://developer.twitter.com/en/portal/dashboard>.
2. If first time: complete the dev signup flow (free tier, "Build
   tools and bots for personal use" is the right prompt).
3. **Create Project + App:**
   - Project name: `smm`
   - Use case: pick anything reasonable (e.g. "Making a bot"). This
     is for Twitter's records; doesn't affect API access.
   - App name: `smm-app` (must be globally unique; if taken, suffix
     a number)
4. After creation, you land on **App settings** with auto-generated
   "API Key + Secret" (these are OAuth 1.0a creds — save them).
5. Click **User authentication settings → Set up**:
   - **App permissions:** **Read and write** (NOT just Read).
     Direct Message off unless you actually need it.
   - **Type of App:** **Web App, Automated App or Bot**
   - **Callback URI:** `https://smm.example.com/api/oauth/twitter/callback`
   - **Website URL:** `https://smm.example.com`
   - Save.
6. After saving, the page reveals **OAuth 2.0 Client ID + Client
   Secret** — save these too.

## Update what_i_need.md

```env
# OAuth 2.0 — for tweets / threads
TWITTER_OAUTH2_CLIENT_ID=<oauth 2.0 client id>
TWITTER_OAUTH2_CLIENT_SECRET=<oauth 2.0 client secret>

# OAuth 1.0a — for v1.1 media upload (when we ship media)
TWITTER_OAUTH1_CONSUMER_KEY=<API Key>
TWITTER_OAUTH1_CONSUMER_SECRET=<API Key Secret>
```

## Push to Worker secrets

```sh
cd api
wrangler secret put TWITTER_OAUTH2_CLIENT_ID
wrangler secret put TWITTER_OAUTH2_CLIENT_SECRET
wrangler secret put TWITTER_OAUTH1_CONSUMER_KEY
wrangler secret put TWITTER_OAUTH1_CONSUMER_SECRET
wrangler deploy
```

## Verify

1. `/p/<slug>/accounts` → click **+ connect** on Twitter / X.
2. You're bounced to `twitter.com/i/oauth2/authorize` with PKCE
   challenge in the URL.
3. Authorize.
4. Bounced back; row shows `@yourhandle`.
5. Save a Twitter draft, pick the account, hit publish-now → tweet
   appears on your timeline.

## Gotchas

- **PKCE is mandatory.** Plain OAuth 2.0 (no PKCE) returns 400.
  Our adapter generates the verifier + S256 challenge automatically.
- **Refresh tokens rotate every use.** We store the new one each
  time. If multiple publishes race for the same account at once, one
  will fail with `invalid_grant`. The queue serialises per-account
  internally.
- **Free tier writes/month: 1,500.** Crossing that needs the **Basic**
  tier ($100/mo, 50k writes). See `../scale.md` row 5.
- **Media upload needs OAuth 1.0a.** Not yet implemented in code;
  the v1.0a creds above are for that future work.
- **App-level rate limit: 300 / 15min.** We don't approach this.
- **The dev portal occasionally drops your callback URL** when
  saving other settings. Re-check it after every settings change.
- **No native drafts API.** Twitter has drafts in the web UI but
  doesn't expose them via API. Our system stores drafts locally and
  publishes when scheduled.
