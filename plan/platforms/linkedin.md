# LinkedIn integration

## Capabilities by phase

| | P1 (drafts) | P2 (publish) |
|---|---|---|
| Local draft (in our DB) | ✅ | ✅ |
| **Push to LinkedIn native draft** | ✅ — UGC API supports `lifecycleState=DRAFT` | ✅ |
| Submit personal post | preview only | ✅ |
| Submit company-page post | requires partner program approval | ✅ if approved |
| Carousel / document post | preview only | ✅ |

## OAuth setup

### Create the app

1. Go to https://www.linkedin.com/developers/apps → Create app.
2. Associate it with a company page (required even if posting as a
   person — quirk of the LinkedIn dev portal).
3. Verify the app via the company page (toggle in Settings).
4. Add OAuth redirect URL:
   `https://api.smm.<domain>/api/oauth/linkedin/callback`
5. Note the `client_id` and `client_secret`.

### Products to enable

In the app's **Products** tab:

- **Sign In with LinkedIn using OpenID Connect** — instant approval
- **Share on LinkedIn** — instant approval, gives `w_member_social`

For company-page posting, also request:
- **Marketing Developer Platform** — manual review, can take weeks

In v1 we ship personal-only and add company pages once approved.

### Scopes

- `openid` — required by Sign In with LinkedIn
- `profile` — name + picture
- `email` — email (also already in the JWT from CF Access, but
  required by Sign In with LinkedIn)
- `w_member_social` — post / read / delete on member's behalf

Combined: `openid profile email w_member_social`.

### Authorize URL

```
https://www.linkedin.com/oauth/v2/authorization?
  response_type=code
  &client_id=<id>
  &redirect_uri=<our_callback>
  &state=<nonce>
  &scope=openid%20profile%20email%20w_member_social
```

### Token exchange

```
POST https://www.linkedin.com/oauth/v2/accessToken
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=<code>
&client_id=<id>
&client_secret=<secret>
&redirect_uri=<our_callback>
```

Returns:
- `access_token` — 60 days TTL
- `refresh_token` — 365 days TTL (only if "Refresh tokens" enabled)
- `expires_in` — seconds

### Refresh

```
POST https://www.linkedin.com/oauth/v2/accessToken
grant_type=refresh_token
&refresh_token=<rt>
&client_id=<id>
&client_secret=<secret>
```

Same response shape. LinkedIn rotates refresh tokens — store the
new one each time.

## API endpoints we use

Base URL: `https://api.linkedin.com/v2/`. All requests need:
- `Authorization: Bearer <access_token>`
- `X-Restli-Protocol-Version: 2.0.0`
- `LinkedIn-Version: 202405` (or current)

### Get authenticated user

```
GET /userinfo
```

OIDC endpoint, returns `{ sub, name, email, picture }`. Use `sub`
as `external_id` (URN format: `urn:li:person:<sub>` for the API
calls below).

### Create a post (UGC API)

The right API depends on what you're posting:

| Content | API |
|---|---|
| Text-only or text+single-image | `/ugcPosts` |
| Carousel / document | `/posts` (newer Posts API) |
| Article with thumbnail | `/posts` |

For v1 we use **`/posts`** (the newer one) for everything; it
supersedes UGC.

#### Text + image example

```json
POST /posts
Authorization: Bearer ...
LinkedIn-Version: 202405
Content-Type: application/json

{
  "author": "urn:li:person:<sub>",
  "commentary": "<post body>",
  "visibility": "PUBLIC",
  "distribution": {
    "feedDistribution": "MAIN_FEED",
    "targetEntities": [],
    "thirdPartyDistributionChannels": []
  },
  "lifecycleState": "PUBLISHED",   ← or "DRAFT" for native drafts
  "isReshareDisabledByAuthor": false,
  "content": {
    "media": {
      "title": "demo",
      "id": "urn:li:image:<asset_id>"
    }
  }
}
```

### Native drafts (the differentiator)

Same endpoint, just `lifecycleState: "DRAFT"`. LinkedIn returns the
created post URN. We store this URN in `drafts.platform_draft_id`.

To **update** a native draft, PATCH the URN:

```
POST /posts/<encoded_urn>
X-RestLi-Method: PARTIAL_UPDATE
Content-Type: application/json

{ "patch": { "$set": { "commentary": "<new body>" } } }
```

To **publish** a native draft:

```
{ "patch": { "$set": { "lifecycleState": "PUBLISHED" } } }
```

This is huge — the user can promote-to-published from inside
LinkedIn's own UI if they want, or via our app.

### Image upload

```
POST /images?action=initializeUpload
Body: { "initializeUploadRequest": { "owner": "urn:li:person:<sub>" } }
```

Returns `uploadUrl` + `image` (URN). PUT the binary to `uploadUrl`.
Then reference the URN in the post body.

## Rate limits

- 100 calls per day per token for free tier (Sign In + Share).
- 500/day with Marketing Developer Platform.

We won't hit this for hand-authored posting. The free quota is
plenty for our scale.

## Per-draft LinkedIn options

`drafts.platform_options` JSON for LinkedIn:

```json
{
  "author_type": "person|company",
  "author_urn": "urn:li:person:<sub>",
  "visibility": "PUBLIC|CONNECTIONS",
  "feed_distribution": "MAIN_FEED|NONE",
  "reshare_disabled": false,
  "post_kind": "text|image|carousel|article",
  "article_url": null,                     // when post_kind=article
  "first_comment": null                    // optional auto-comment after post
}
```

## Quirks

- **No emoji-only posts.** Linkedin will reject posts that are only
  emojis.
- **Hashtag limit ~30.** Above that, post may silently drop them.
- **Newlines render differently in the feed vs. compose.** Our
  preview uses LinkedIn's display rules: collapses 3+ newlines to
  2, treats `#hashtag` as link.
- **No Markdown.** Body is plain text with LinkedIn's own
  conventions (URLs auto-linked, hashtags auto-linked, mentions via
  `@firstname-lastname-id`). Our preview converts our internal
  Markdown to LinkedIn-compatible plain text.

## Phase 1 deliverable for LinkedIn

- Account connection (OAuth + refresh).
- "Save as LinkedIn draft" button → POST with
  `lifecycleState: DRAFT`, store URN.
- Editing a draft in our app pushes a partial update to LinkedIn.
- Disconnect → revoke + null out tokens.

## Phase 2 deliverable for LinkedIn

- "Schedule" → at scheduled_for time, PATCH the existing draft to
  `lifecycleState: PUBLISHED` (preferred), or POST a new published
  post if the draft was deleted on LinkedIn's side.
- "Publish now" → same.
- Optional: post first-comment immediately after main post (a
  common LinkedIn growth tactic — first comment with the link).
