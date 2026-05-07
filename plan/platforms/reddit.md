# Reddit integration

## Capabilities by phase

| | P1 (drafts) | P2 (publish) |
|---|---|---|
| Local draft (in our DB) | ✅ | ✅ |
| Push to Reddit native draft | ❌ — Reddit has no draft API | ❌ |
| Submit top-level post | preview only | ✅ |
| Comment in existing thread | preview only | ✅ (key: weekly self-promo threads) |
| Find weekly thread automatically | n/a | ✅ — search by sticky + title pattern |
| Read sub rules | metadata fetch only | ✅ |

## OAuth setup

### Create the app

1. Go to https://www.reddit.com/prefs/apps → "create another app"
2. Type: **web app** (not script — script is single-user only).
3. Redirect URI: `https://api.smm.<domain>/api/oauth/reddit/callback`
4. Note the `client_id` and `client_secret`.

### Scopes we need

- `identity` — read account name + id
- `submit` — submit posts
- `edit` — edit our own posts (Phase 2 needed for retraction)
- `history` — read our own post performance (Phase 3)
- Conditional: `modposts` — only if posting in subs we mod

Combined scope string: `identity submit edit history`.

### Authorize URL

```
https://www.reddit.com/api/v1/authorize?
  client_id=<id>
  &response_type=code
  &state=<nonce>
  &redirect_uri=<our_callback>
  &duration=permanent           ← critical: get refresh token
  &scope=identity+submit+edit+history
```

### Token exchange

```
POST https://www.reddit.com/api/v1/access_token
Authorization: Basic <base64(client_id:client_secret)>
User-Agent: smm/0.1 by <my-reddit-username>     ← MUST be unique + identifiable
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=<code>&redirect_uri=<our_callback>
```

Returns `access_token` (1h TTL) + `refresh_token` (permanent unless
revoked).

### Refresh

```
POST https://www.reddit.com/api/v1/access_token
grant_type=refresh_token&refresh_token=<rt>
```

Reddit doesn't rotate refresh tokens — we keep the same one until
the user revokes via Reddit settings.

## API endpoints we use

All requests go to `https://oauth.reddit.com` with
`Authorization: bearer <access_token>` and a custom User-Agent.

### Get authenticated user

```
GET /api/v1/me
```

Returns `{ name, id, ... }` — store `id` as `external_id`,
`name` as `handle`.

### Submit a self-post (text)

```
POST /api/submit
sr=<subreddit>
title=<title>
kind=self
text=<body>
```

### Submit a link post (image/video)

For images/GIFs, we upload via Reddit's media API:

1. `POST /api/media/asset.json` → returns a presigned S3 form
   payload.
2. POST the binary to the S3 URL with the form fields.
3. Poll `https://oauth.reddit.com/api/media/asset_status?asset_id=<id>`
   until `processing_state === 'complete'`.
4. `POST /api/submit` with `kind=image` and `url=<asset_url>`.

For r/iosgaming we usually want a **GIF in a comment**, not a
top-level image post — see "Comment in thread" below.

### Comment in a thread (the iosgaming use case)

```
POST /api/comment
api_type=json
thing_id=t3_<post_id>      ← parent post id, with t3_ prefix
text=<markdown>
```

For embedded GIFs in comments: Reddit doesn't allow inline images
in comments on most subs, but does allow markdown links to media.
Strategy: upload GIF to imgur (or our own R2 with public bucket
policy) and link it in the comment body.

### Find this week's self-promo thread

We need a helper because the thread's `post_id` changes weekly.

```
GET /r/iosgaming/about/sticky/1?raw_json=1
```

Returns the first stickied post. We check the title against a
configured regex per sub:

```json
{
  "iosgaming": {
    "thread_pattern": "^Weekly self[- ]?promotion thread"
  }
}
```

Stored in `accounts.meta` as JSON.

### Read sub rules (sanity-check before submit)

```
GET /r/<sub>/about/rules
```

Returns the rules array. We cache this in KV for 6h. UI shows
rules next to the draft as a checklist before publishing.

## Rate limits

Reddit allows **60 requests per 60 seconds** per OAuth token. Headers
to watch:

- `X-Ratelimit-Used`
- `X-Ratelimit-Remaining`
- `X-Ratelimit-Reset`

We persist these in KV and pre-emptively delay if `Remaining < 5`.

## Posting safety

Reddit shadow-bans accounts that post mechanically. Our defaults:

- **Never auto-submit without an explicit user action.** Even in
  Phase 2, "scheduled" means *queued for the user's chosen time* —
  it's not a recurring autoresponder.
- **Never post to two subs within 60 seconds.** The scheduler
  spaces queued jobs by sub.
- **Insert a 1–3 second jitter** before each submit so timing
  doesn't look bot-perfect.
- **User-agent must be unique** — Reddit's TOS requires it. We
  bake the user's Reddit username into the UA string.
- **Account warm-up reminder.** If an account has < 30 days of
  read-only activity, the UI shows a warning before connecting it
  to publish flows.

## Per-draft Reddit options

`drafts.platform_options` JSON for Reddit:

```json
{
  "subreddit": "sideproject",
  "post_kind": "self|link|image|video|comment",
  "flair_id": "abc-123",
  "flair_text": "Show & Tell",
  "send_replies": true,
  "spoiler": false,
  "nsfw": false,

  "_comment_only": {
    "thread_resolver": "sticky:1",
    "thread_pattern": "^Weekly self-promotion thread",
    "fallback_thread_id": null
  }
}
```

The `_comment_only` block is used when `post_kind === 'comment'`.

## Phase 1 deliverable for Reddit

- Account connection (OAuth flow end to end).
- Read sub rules + flair list when picking subreddit.
- Markdown editor with Reddit-flavor preview.
- Media upload (kept in our R2; not pushed to Reddit yet).
- "Copy post body to clipboard" + open the sub's submit page in a
  new tab — the manual hand-off path while we don't yet auto-publish.

## Phase 2 deliverable for Reddit

- "Schedule" or "Publish now" buttons → queue → publishes.
- Special handling for `post_kind === 'comment'`: resolve the
  current weekly thread first, then post.
- Retry policy: 3 attempts, 30s / 2min / 10min backoff.
- Failure notifications.
