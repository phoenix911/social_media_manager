# Platform integrations

| Platform | OAuth | Native drafts via API | Phase 1 connect | Phase 2 publish | App-review pain |
|---|:-:|:-:|:-:|:-:|---|
| [Reddit](reddit.md) | ✅ OAuth 2.0 | ❌ | ✅ | ✅ | None — instant approval |
| [LinkedIn](linkedin.md) | ✅ OAuth 2.0 | ✅ (UGC + Posts API) | ✅ | ✅ | Light — instant for personal scopes; weeks for company-page |
| [Instagram](instagram.md) | ✅ OAuth 2.0 (Meta) | ❌ | ✅ | ⚠ Phase 2 only after app review | Heavy — 1–4 wk Meta review + Business account required |
| [Twitter / X](twitter.md) | ✅ OAuth 2.0 (PKCE) + OAuth 1.0a for media | ❌ | ✅ | ✅ | None — but free tier caps writes at 1.5k/month |

## Auth model — answer to "OAuth or API keys?"

**Every platform uses OAuth.** End users (the people whose social
accounts we're posting from) **never paste API keys.** They click
"Connect <Platform>", get bounced to that platform's authorize
page, click Allow, and come back to the app authenticated.

What we (the developer) need is a *one-time-per-platform* setup
where we register an "app" and get a `client_id` + `client_secret`.
That credential pair is shared across all our users; per-user
authorization happens via OAuth at runtime and produces per-user
tokens that we store encrypted in `accounts.access_token`.

```
┌─────────────────────────────────────────────────────────────┐
│  ONE-TIME (us)                                              │
│  Reddit/LinkedIn/Meta/X dashboards                          │
│  → register app → get client_id + client_secret             │
│  → store as Worker secrets                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  RECURRING (per user, per account)                          │
│  user clicks "Connect Reddit"                               │
│  → redirect to reddit.com/api/v1/authorize?client_id=...    │
│  → user clicks Allow                                        │
│  → reddit.com bounces back to api.smm.<domain>/callback     │
│  → we exchange code for access_token + refresh_token        │
│  → encrypt and store in `accounts` table                    │
└─────────────────────────────────────────────────────────────┘
```

So the answer is: **OAuth login, no per-user API keys to share.**
The only API keys are the *app-level* ones we configure once and
keep in Worker secrets — see `what_i_need.md` at the repo root.

## When OAuth isn't enough

A handful of legacy or niche operations on each platform still
require older auth:

- **Twitter v1.1 media upload** needs OAuth 1.0a, not 2.0. We
  add a parallel OAuth 1.0a connect flow during the Twitter
  account hookup. Same end-user UX (click "Connect"), one extra
  redirect under the hood.
- **Reddit `script` apps** (single-user, no callback) are *not*
  what we use. We use the `web app` type which supports OAuth
  redirects properly.
- **LinkedIn company-page posting** requires Marketing Developer
  Platform approval — handled outside the OAuth flow, on the
  Meta dev portal.

In every case, the *user* doesn't paste keys. The platform-level
config we do once, in `what_i_need.md`.

## Adding a new platform later

The data model already accommodates new platforms via the
`accounts.platform` enum. The minimum work to add e.g. Mastodon,
Bluesky, TikTok, or Threads:

1. Write a `platforms/<name>.md` planning doc (this directory).
2. Implement an `OAuthAdapter<Platform>` and a `Publisher<Platform>`
   in `api/src/platforms/<name>/`.
3. Register the platform in the `accounts.platform` CHECK
   constraint via a migration.
4. Add an icon + form fields in the frontend.

No schema migration beyond the CHECK enum.
