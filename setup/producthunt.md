# setup/producthunt.md

Product Hunt OAuth + (limited) GraphQL access.

## Why we need it

PH is the *only* one of our five platforms where **automated launch
submission is gated behind partner approval**. So our Product Hunt
adapter ships with two distinct capabilities:

1. **OAuth + identity (works today, instant approval).** Connects a
   maker's PH account, stores the access token, lets us read the
   viewer's username + id via GraphQL. Useful so PH drafts in our
   system are tagged to the right account.
2. **Programmatic publishing (manual until approved).** The
   `publish` method returns 501 by default. Treat PH drafts as
   "copy-paste from SMM into PH's launch composer / first-comment
   box on launch day". This is the same pattern we use for Reddit
   weekly-thread comments today.

Adding the OAuth credentials below unlocks (1) immediately. If/when
you want (2) you'll need to apply via the PH developer support team
and add a real publish path — out of scope for the default install.

## Pre-reqs

- A Product Hunt account.
- That account has *some* karma — PH treats brand-new accounts as
  spam by default. If your account is < 1 month old, just use it to
  upvote a few products first; that's enough.

## Steps

1. Sign in to <https://www.producthunt.com>.
2. Go to <https://www.producthunt.com/v2/oauth/applications>.
3. Click **Add an application**.
4. Fill:
   - **Name:** `SMM`
   - **Redirect URI:** `https://smm.example.com/api/oauth/producthunt/callback`
5. Submit.
6. The application detail page now shows two values:
   - **API Key** (= Client ID for OAuth)
   - **API Secret** (= Client Secret for OAuth)

## Update what_i_need.md

```env
PRODUCTHUNT_CLIENT_ID=<API Key>
PRODUCTHUNT_CLIENT_SECRET=<API Secret>
```

## Push to Worker secrets

```sh
cd api
wrangler secret put PRODUCTHUNT_CLIENT_ID
wrangler secret put PRODUCTHUNT_CLIENT_SECRET
wrangler deploy
```

## Verify

1. `/p/<slug>/accounts` → click **+ connect** on Product Hunt.
2. You're bounced to `api.producthunt.com/v2/oauth/authorize`.
3. Authorize.
4. Bounced back; PH row shows `@your_ph_username`.
5. Open a PH draft (e.g. seq 11 in the tapeline project — the
   first-comment text). The preview pane will show the formatted
   text with a "paste this into PH's first-comment box" hint.

## Gotchas

- **No automated launch submission via API.** This isn't a SMM
  limitation — PH itself doesn't allow it without partner status.
  Our system stores the launch description and first-comment so you
  copy them into PH's UI on launch day.
- **GraphQL endpoint:** `https://api.producthunt.com/v2/api/graphql`.
  We use the `viewer { user { id, username, name } }` query to
  identify the connected account. Anything more (votes, comments,
  collections) needs the same Bearer token but a different query.
- **Tokens are long-lived; no refresh flow.** PH tokens last
  effectively forever unless the user revokes via PH settings →
  Applications. We treat them as non-expiring (column `expires_at`
  is set if the response includes `expires_in`, otherwise `NULL`).
- **Don't include emojis in the application Name.** PH's dev portal
  occasionally rejects them.
- **Redirect URI is exact-match** (same as Reddit). If you later
  move SMM to a different host, edit the application's redirect URI
  *before* the existing tokens stop working.
