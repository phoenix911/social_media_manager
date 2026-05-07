# Instagram integration

**Heads-up: this is the hardest of the three platforms.** Instagram's
posting API is gated behind Meta's Graph API + Business / Creator
account requirement + app review. Plan accordingly.

## Capabilities by phase

| | P1 (drafts) | P2 (publish) |
|---|---|---|
| Local draft (in our DB) | ✅ | ✅ |
| Push to IG native draft | ❌ — only Reels via mobile app, not API | ❌ |
| Publish single image / video | preview only | ✅ (with Business account) |
| Publish carousel | preview only | ✅ |
| Publish Reel | preview only | ✅ — same Container API |
| Publish Story | ❌ — API does NOT support stories for most apps | ❌ |
| Personal account posting | ❌ — Graph API requires Business/Creator | ❌ |

## Hard prerequisites

1. The IG account must be a **Business or Creator account** (free
   to switch; one tap in IG settings).
2. The IG account must be **linked to a Facebook Page** (the FB
   page is the auth boundary; IG is connected to it).
3. The user must have admin access to that FB page.
4. We need a Meta app with:
   - **Instagram API with Instagram Login** product enabled
   - App Review approval for `instagram_business_basic`,
     `instagram_business_content_publish`, etc.

App review can take 1–4 weeks. Plan to start submission early in
Phase 2 work.

## OAuth setup

### Create the Meta app

1. https://developers.facebook.com/apps → Create app → "Other" →
   "Business".
2. Add product: **Instagram API with Instagram Login**.
3. Note the App ID + App Secret.
4. Add OAuth redirect URI:
   `https://api.smm.<domain>/api/oauth/instagram/callback`

### Scopes (after app review)

- `instagram_business_basic` — read profile / media
- `instagram_business_content_publish` — publish media
- `instagram_business_manage_messages` — only if we ever do DMs
- `pages_show_list` — list FB pages user manages
- `pages_read_engagement` — read insights on linked pages

### Authorize URL (Instagram Login flow)

```
https://api.instagram.com/oauth/authorize?
  client_id=<id>
  &redirect_uri=<our_callback>
  &response_type=code
  &scope=instagram_business_basic,instagram_business_content_publish
  &state=<nonce>
```

### Token exchange

```
POST https://api.instagram.com/oauth/access_token
Content-Type: application/x-www-form-urlencoded

client_id=<id>
&client_secret=<secret>
&grant_type=authorization_code
&redirect_uri=<our_callback>
&code=<code>
```

Returns a **short-lived** token (1h). Exchange it for a **long-lived**
token immediately:

```
GET https://graph.instagram.com/access_token?
  grant_type=ig_exchange_token
  &client_secret=<secret>
  &access_token=<short_token>
```

Returns a 60-day token. **No refresh token concept** — we re-exchange
the long-lived token for a new long-lived token before it expires:

```
GET https://graph.instagram.com/refresh_access_token?
  grant_type=ig_refresh_token
  &access_token=<long_token>
```

We schedule a daily check: if any IG token has < 7 days TTL,
refresh it.

## API endpoints we use

Base URL: `https://graph.instagram.com/v21.0/`. All requests carry
`access_token` query param.

### Get authenticated user

```
GET /me?fields=id,username,account_type
```

`account_type` must be `BUSINESS` or `CREATOR`. If `PERSONAL`,
reject the connection with a clear error: *"Switch your account
to Business or Creator in Instagram settings."*

### Publish flow (the IG quirk)

Publishing is a 2-step process: **create container → publish container**.

#### Single image

```
POST /<ig_user_id>/media
  ?image_url=<public_https_url>
  &caption=<encoded_caption>
  &access_token=...
```

The `image_url` MUST be publicly fetchable HTTPS — Instagram fetches
it from their servers. **Therefore we must serve our R2 media via a
public URL** (or a signed URL that lasts long enough for IG to
fetch). See "Public media URLs" below.

Returns `{ id: <container_id> }`.

Then:

```
POST /<ig_user_id>/media_publish
  ?creation_id=<container_id>
  &access_token=...
```

Returns `{ id: <ig_media_id> }`.

#### Carousel

For each image: create a container with `is_carousel_item=true`. Then
create a parent container with `media_type=CAROUSEL` and a
comma-joined `children` of the child container ids. Then publish.

#### Reels

```
POST /<ig_user_id>/media
  ?media_type=REELS
  &video_url=<public_https_url>
  &caption=<...>
  &cover_url=<optional thumbnail>
  &share_to_feed=true
```

Then publish as above.

## Public media URLs

IG's fetch requirement is awkward with R2's default private bucket.
Two options:

1. **Public R2 bucket**: enable public access on `smm-media-public`
   with a custom domain like `media.smm.<domain>`. All media
   accessible without auth. Trade-off: anyone with a guessed
   key can fetch the file.
2. **Signed URLs with a long TTL** (Recommended): keep bucket
   private; mint a signed GET URL with 24h TTL just before
   creating the IG container. IG's fetch typically completes in
   seconds; the URL becomes useless after.

We pick **option 2** — it preserves bucket-level privacy and limits
exposure to a 24h window per publish.

## Rate limits

- **200 calls per hour per token** (graph API combined)
- **25 IG posts per 24 hours per IG account** (publishing limit)

We're nowhere near these.

## Per-draft Instagram options

`drafts.platform_options` JSON for IG:

```json
{
  "ig_user_id": "<ig user id from /me>",
  "post_kind": "image|carousel|reel",
  "share_to_feed": true,
  "first_comment": null,
  "location_id": null,
  "hashtags_in_first_comment": false,    // common growth pattern
  "user_tags": [],                       // [{username, x, y}]
  "product_tags": []                     // shopping tags
}
```

## Quirks

- **No URLs in captions are clickable.** Standard. Our preview
  visualizes this so the author isn't surprised.
- **Caption limit: 2,200 chars; up to 30 hashtags.** Enforce in UI.
- **No native drafts via API.** `lifecycleState` doesn't exist for
  IG. "Save as IG draft" button is hidden in our UI; we show a
  tooltip explaining why.
- **App review is gnarly.** Reviewers will ask for a screencast of
  the connect + publish flow + privacy policy URL + business
  verification. Plan a full afternoon for the submission.
- **Token expiry is silent until publish.** No webhook fires. Our
  daily refresh job is critical.

## Phase 1 deliverable for Instagram

- Account connection (OAuth + 60-day token + refresh job).
- Caption editor with character counter + hashtag counter +
  preview that approximates the IG feed look.
- Media upload (image / video / multi-image carousel) to R2.
- "Copy caption to clipboard" + "Open Instagram" — same manual
  hand-off path as Reddit.

## Phase 2 deliverable for Instagram

- App review submitted and approved (multi-week).
- "Schedule" / "Publish now" → container → publish flow.
- Daily token refresh cron.
- Failure notifications (especially around image_url fetch
  failures from IG side).

## Phase 3 (further out)

- IG insights API: pull post performance back into our DB.
- Story API access (requires separate enterprise approval).
