# setup/reddit.md

Reddit OAuth app for posting + commenting from SMM.

## Why we need it

Without these credentials, the "Connect Reddit" button on
`/p/<slug>/accounts` returns 503 (`platform_not_configured`) and we
can't run the OAuth flow. With them, any project member can connect
*their* Reddit account to *their* project with a single click.

## Pre-reqs

- A Reddit account that's been around > 30 days (newer accounts get
  shadow-filtered posting).
- That account ideally has some karma (≥ 50) so its posts aren't
  auto-removed from larger subs.
- **Read Reddit's [Responsible Builder Policy](https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy).**
  As of 2025 Reddit requires acceptance of this policy when you
  create an app. The TL;DR is: identify your app + contact
  correctly, respect rate limits, don't ship spam-by-default UX,
  take down content on user request. SMM's per-tenant OAuth +
  per-account rate handling + identifiable User-Agent already align
  with what the policy demands.

## Steps

1. Sign in to Reddit with the account you want to act as the **app
   owner**. (This is the developer account; per-project accounts will
   OAuth in separately later.)
2. Go to <https://www.reddit.com/prefs/apps>.
3. Scroll to bottom → click **create another app** (or **create an
   app** if it's your first).
4. Fill in:
   - **name:** `smm` (or whatever you like — only you see this)
   - **type:** select **web app** (not script, not installed)
   - **description:** optional
   - **about url:** `https://smm.table.pw`
   - **redirect uri:** `https://smm.table.pw/api/oauth/reddit/callback`
5. Click **create app**.
6. The new card shows two values:
   - **client id** — short string under the app name (looks like `j3K…`)
   - **secret** — labeled `secret`, long string

## Update what_i_need.md

```env
REDDIT_CLIENT_ID=<the short string under the app name>
REDDIT_CLIENT_SECRET=<the secret value>
REDDIT_USERNAME_FOR_UA=<your reddit username, no /u/ prefix>
```

## Push to Worker secrets

```sh
cd api
wrangler secret put REDDIT_CLIENT_ID
wrangler secret put REDDIT_CLIENT_SECRET
wrangler secret put REDDIT_USERNAME_FOR_UA
wrangler deploy
```

## Verify

1. Open `https://smm.table.pw` in browser.
2. Pick or create a project.
3. Go to `/p/<slug>/accounts`.
4. Click **+ connect** next to Reddit.
5. You should be bounced to `reddit.com/api/v1/authorize` with our
   client id in the URL.
6. Click **Allow**.
7. Bounced back to the project's accounts page; the Reddit row now
   shows your handle instead of "not connected".

If you see 503 instead, the secret didn't propagate — re-run
`wrangler deploy` and retry.

## Gotchas

- **Type must be "web app"** — "script" type has no callback URL,
  used for personal scripts only.
- **Redirect URI is exact-match.** `https://smm.table.pw/...` won't
  match `https://www.smm.table.pw/...`. The trailing path also has
  to match exactly: `/api/oauth/reddit/callback`.
- **Reddit User-Agent must be unique + identifiable.** We auto-build
  it as `web:smm:0.1 (by /u/<REDDIT_USERNAME_FOR_UA>)`. Generic UAs
  get rate-limited within a few minutes. If you don't set
  `REDDIT_USERNAME_FOR_UA` it falls back to "unknown" — works but
  Reddit may de-prioritise.
- **Account warm-up.** A brand-new Reddit account that immediately
  starts posting via API gets shadow-banned. If your dev account is
  fresh, comment in target subs for ~2 weeks before posting.
- **One web app per organisation.** You can have multiple apps on
  one Reddit account (one for SMM, one for some other tool) — just
  give each a unique name.
