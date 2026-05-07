# Twitter / X integration

## Capabilities by phase

| | P1 (drafts) | P2 (publish) |
|---|---|---|
| Local draft (in our DB) | ✅ | ✅ |
| Push to X native draft | ❌ — no draft API | ❌ |
| Post a tweet | preview only | ✅ |
| Post a thread | preview only | ✅ — sequential POST + reply |
| Post media (image / video / GIF) | preview only | ✅ |
| Schedule via X's own scheduler | ❌ — paid Premium feature, not API-exposed | ❌ |

## Hard prerequisites

- Twitter requires API access tiers as of 2023:
  - **Free tier** — 1,500 posts/month *write*, 100 reads/month.
    Enough for our scale.
  - **Basic** — $100/month. 50,000 writes/month, more reads.
  - **Pro / Enterprise** — for serious volume.
- App registration via https://developer.twitter.com is free but
  requires a phone-verified Twitter account.
- API v2 only (v1.1 is deprecated for most endpoints).

We assume free tier is enough. If a project starts hitting the
limit, we can upgrade just that project's app.

## OAuth setup

### Create the app

1. https://developer.twitter.com/en/portal/dashboard → New Project
   → New App.
2. Set OAuth 2.0:
   - Type: **Web App, Automated App or Bot**
   - Callback URL: `https://api.smm.<domain>/api/oauth/twitter/callback`
   - Website URL: anything
3. App permissions: **Read and write** (and **Direct message** if
   we ever do DMs, which we don't plan to).
4. Note OAuth 2.0 `client_id` + `client_secret`.

### Scopes (OAuth 2.0)

- `tweet.read` — read tweets (needed to fetch own posts back)
- `tweet.write` — post tweets
- `users.read` — basic profile
- `offline.access` — get a refresh token (otherwise tokens expire
  at 2h with no refresh)

Combined: `tweet.read tweet.write users.read offline.access`.

### Authorize URL (OAuth 2.0 with PKCE — required by Twitter)

```
https://twitter.com/i/oauth2/authorize?
  response_type=code
  &client_id=<id>
  &redirect_uri=<our_callback>
  &scope=tweet.read%20tweet.write%20users.read%20offline.access
  &state=<nonce>
  &code_challenge=<pkce_challenge>
  &code_challenge_method=S256
```

PKCE is **required** — Twitter rejects OAuth 2.0 without it.
Worker generates a `code_verifier` (random 64 bytes), stores it in
KV under the nonce, sends `code_challenge = sha256(verifier)` in
the URL.

### Token exchange

```
POST https://api.twitter.com/2/oauth2/token
Authorization: Basic <base64(client_id:client_secret)>
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=<code>
&redirect_uri=<our_callback>
&code_verifier=<verifier from KV>
```

Returns:
- `access_token` — 2h TTL
- `refresh_token` — only if `offline.access` scope was granted
- `expires_in`

### Refresh

```
POST https://api.twitter.com/2/oauth2/token
Authorization: Basic ...
grant_type=refresh_token
&refresh_token=<rt>
```

Refresh tokens **rotate** on every use — store the new one each
refresh. Old refresh token becomes invalid immediately.

## API endpoints we use

Base URL: `https://api.twitter.com/2/`. All requests need
`Authorization: Bearer <access_token>`.

### Get authenticated user

```
GET /users/me
```

Returns `{ data: { id, name, username } }`. Use `id` as
`external_id`.

### Post a tweet (text only)

```
POST /tweets
Content-Type: application/json

{ "text": "<body, max 280 chars>" }
```

### Post a tweet with media

Twitter still uses v1.1 for media upload (a known wart):

```
POST https://upload.twitter.com/1.1/media/upload.json
Content-Type: multipart/form-data

(media file, OAuth 1.0a auth signing required for v1.1 — annoying)
```

Then in the v2 tweet POST:

```json
{
  "text": "<body>",
  "media": { "media_ids": ["<media_id>"] }
}
```

**v1.1 media upload requires OAuth 1.0a auth, NOT OAuth 2.0.** This
is a long-standing inconsistency. Two options:

1. Force users to ALSO connect via OAuth 1.0a flow (separate
   tokens stored alongside the OAuth 2.0 tokens).
2. Skip media via API; post text + show user a "drag this image
   to the Twitter compose window" affordance.

For Phase 2, we go with option 1 — connect both flows in one user
flow ("Connect Twitter" runs both OAuth 1.0a and OAuth 2.0
sequentially). It's a known annoyance and Twitter has talked about
fixing it for years; not holding our breath.

### Post a thread

A thread is a sequence of tweets where each replies to the
previous. We POST the first tweet, capture its id, then POST each
subsequent with:

```json
{
  "text": "<reply body>",
  "reply": { "in_reply_to_tweet_id": "<previous_id>" }
}
```

## Rate limits

- 200 tweets per 15 minutes per user (v2 free).
- 1,500 tweets per month total per app on free tier.
- 300 media uploads per 15 minutes.

Our scale is far below all of these.

## Per-draft Twitter options

`drafts.platform_options` JSON for Twitter:

```json
{
  "post_kind": "tweet|thread",
  "thread_segments": [],          // when post_kind=thread, array of {text, media_ids}
  "reply_settings": "everyone|mentioned_users|following",
  "for_super_followers_only": false,
  "geo_place_id": null,
  "quote_tweet_id": null
}
```

## Quirks

- **280-char limit per tweet.** UI shows live counter. For threads,
  we count per segment.
- **Media: max 4 images, OR 1 video, OR 1 GIF per tweet.**
- **Animated GIFs are videos** under the hood — same upload path.
- **No edit (free tier).** Once posted, deletion is the only undo.
- **Link cards take 5–10 minutes to populate.** Newly-posted links
  may appear unfurled in our preview but plain-text in feed for
  a few minutes.
- **No native drafts via API.** Twitter's web app has drafts but
  they're local-only — not exposed via API.

## Phase 1 deliverable for Twitter

- Account connection (OAuth 2.0 PKCE flow).
- 280-char editor with live counter (thread mode: per segment).
- Media upload to R2 (no v1.1 media upload yet).
- "Copy tweet to clipboard" + open compose URL — manual hand-off.

## Phase 2 deliverable for Twitter

- "Publish now" / "Schedule" → POST `/tweets`.
- Media: add OAuth 1.0a flow + v1.1 upload.
- Threads: sequential post with reply chaining.
- Optional: pin / unpin own tweets.
