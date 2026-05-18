# insta_need.md — what's needed to automate Instagram posting

Companion to `what_i_need.md`. Treat each line that's still `<TODO>` as a
blocker. Anything you can paste here → I can wire up.

This file is for the **neuera.care** project's "Instagram 45-day launch"
track specifically, but every requirement listed here applies to any IG
channel in this app.

---

## A. Meta / Instagram side (you do)

Owner of @neueracare needs to:

### 1. Account type

- [x] Convert `@neuera.care` IG account to **Business** or **Creator**.
      Personal accounts cannot publish via the Graph API.
      _IG app → Settings → Account → Switch to Professional._

### 2. Meta Developer app (no Facebook Page needed)

We're using the **Instagram Login API** (released late 2024). IG
Business/Creator account logs in directly; no FB Page involved.

- [x] Create a Meta Developer app at <https://developers.facebook.com>.
      Type: **Business**.
- [x] Add products:
  - **Instagram** → "Instagram API setup with Instagram login"
  - **Instagram Graph API** (for the publishing endpoints)
- [ ] In the Instagram product settings, set the OAuth redirect URI:
      `https://smm.table.pw/api/oauth/instagram/callback`
- [ ] Under "Instagram business login" → add `@neuera.care` as a
      tester (so dev mode publishing works pre-review).

### 3. App Review submission

- [ ] Submit for review for these **mandatory** scopes:
  - `instagram_business_basic`
  - `instagram_business_content_publish`
  - `instagram_business_manage_comments` *(optional — needed only if we ever auto-reply or moderate)*
- [ ] Provide screencast of the OAuth → publish flow running in dev.
- [ ] Use-case writeup: "Internal scheduling tool for a single
      women's-health brand to publish educational content to its own
      verified Business account."
- [ ] Expect **3–14 business days** for review.

> **Critical path.** Start this on day 1 — every other step can run in
> parallel, but you can't publish without this approved.

### 4. Credentials (paste here when ready)

```
META_APP_ID=<TODO>
META_APP_SECRET=<TODO>
INSTAGRAM_BUSINESS_ACCOUNT_ID=<TODO>     # the ig-user-id from Graph API Explorer once @neuera.care is added as a tester
```

No `FACEBOOK_PAGE_ID` — Instagram Login API publishes directly to the
IG Business account.

---

## B. Cloudflare / repo side (I do, once A is unblocked)

### 5. Worker secrets

```bash
cd api
export CLOUDFLARE_API_TOKEN=$(grep '^CLOUDFLARE_API_TOKEN=' ../what_i_need.md | cut -d= -f2)
export CLOUDFLARE_ACCOUNT_ID=$(grep '^CLOUDFLARE_ACCOUNT_ID=' ../what_i_need.md | cut -d= -f2)
bun x wrangler secret put META_APP_ID     -c wrangler.local.toml
bun x wrangler secret put META_APP_SECRET -c wrangler.local.toml
```

### 6. Connect the IG account in-app

- [ ] Go to <https://smm.table.pw/channels> → "+ Connect Instagram".
- [ ] OAuth flow: redirects to Meta → user authorises → returns to
      `/api/oauth/instagram/callback` → creates a row in `accounts` with
      `platform='instagram'`, encrypted tokens, IG handle as `handle`.
- [ ] Link the new channel to the neuera-care project from
      `/p/neuera-care/channels`.

### 7. Bind the launch track + drafts to the channel

Once the account row exists, capture its id, then:

```sql
-- Replace <new-ig-acct-id> with the accounts.id from step 6.
UPDATE tracks
   SET account_id = '<new-ig-acct-id>'
 WHERE id = '019e2f74-7b75-7f03-b6eb-0491e7cb5e81';   -- Instagram 45-day launch

UPDATE drafts
   SET account_id = '<new-ig-acct-id>'
 WHERE track_id = '019e2f74-7b75-7f03-b6eb-0491e7cb5e81';
```

### 8. Implement `instagram.ts publish()` (currently stubbed)

`api/src/platforms/instagram.ts` has the OAuth flow but `publish()`
returns "not implemented". The publish path needs:

1. **Mint a signed R2 GET URL** for every media file attached to the
   draft (24h TTL — see `llm/gotchas.md` #11).
2. **Create the container** — `POST https://graph.facebook.com/v20.0/{ig-user-id}/media`
   with `image_url` (single), `video_url` + `media_type=REELS` (reel),
   or `is_carousel_item=true` per child + parent with `children=<ids>`
   (carousel).
3. **Poll container status** until `status_code=FINISHED` (videos can
   take 30–120 s to encode server-side).
4. **Publish** — `POST /{ig-user-id}/media_publish` with `creation_id`.
5. **Capture the returned IG media id** into `publishes.platform_post_id`.

### 9. R2 signed URL helper (missing)

Currently there's no helper for signed R2 GETs. Needs:

- A `signedR2GetUrl(env, r2Key, ttlSeconds)` in `api/src/lib/r2.ts`.
- AWS-style SigV4 since R2 is S3-compatible (or use Cloudflare's `presign` helper).
- Used by `instagram.publish()` immediately before each container create.

**Do NOT make the R2 bucket public** — that exposes every project's media.

### 10. platform_options on each draft

The seed already writes these per draft:

```json
{
  "postKind": "reel" | "carousel" | "image",
  "shareToFeed": true,
  "seedSequence": <n>,
  "seedPillar": "...",
  "seedProgram": "...",
  "seedVisualBrief": "..."
}
```

`instagram.publish()` should branch on `postKind`.

### 11. Telegram bot wiring

Notifications already fire on `publish.success` / `publish.failed` if
`TELEGRAM_BOT_TOKEN` is set. No additional work — confirm
`TELEGRAM_ALLOWED_CHAT_IDS` includes whoever should get the alerts.

---

## C. Content / production side (your team, in parallel)

### 12. Media production (60 assets — this is the biggest team lift)

**Every one of the 60 posts needs a media asset attached before it can publish.**
Captions are already locked in D1; what's missing is the _visual_. Without
media, IG's Graph API will reject the publish call.

Breakdown:

| Format       |        Count | Per-item asset(s)                                             |               Total assets |
| ------------ | -----------: | ------------------------------------------------------------- | -------------------------: |
| Reel         |       **27** | 1 vertical MP4 (1080×1920, 7–60s) + 1 cover image (1080×1920) |        27 × ~2 = ~54 files |
| Carousel     |       **24** | 6–10 slides per post, each 1080×1350 PNG/JPG                  |        avg 8 → ~192 slides |
| Single image |        **9** | 1 image, 1080×1350 PNG/JPG                                    |                   9 images |
| **Total**    | **60 posts** |                                                               | **≈ 255 individual files** |

**Spec for each post lives in its `.md` file** under the `## Visual brief`
heading at `track/neuera_insta/launch/posts/NNN-*.md`. The visual brief
contains:

- For reels: voiceover script + b-roll list + on-screen text overlays + cover frame description.
- For carousels: slide-by-slide blueprint (1 line per slide, including cover hook slide and CTA slide).
- For images: composition + on-image copy.

Production guidance:

- **Carousels + images** — designer batches in Figma. One template per
  week's color palette (week 1 = terracotta, week 3 = maroon, week 5–6 =
  navy + gold, etc. — see `style-guide.md`). Exports as 1080×1350 PNGs.
- **Reels** — video editor batches in CapCut / Adobe Premiere. Voiceover
  scripts are already written in each `.md` (record once with a voice
  artist, or use AI voice). B-roll: stock (Pexels / Storyblocks) + minimal
  brand footage. **No on-camera doctor needed for v1** — every reel was
  written to work voiceover-only. Doctor-explainer reels are a v2 unlock.
- **Cover frames for reels** — IG uses these as the Reel tile in your
  grid. Keep them on-brand; the visual brief specifies the cover text.

**Realistic timeline at neuera.care's team size:**

- 1 designer × full-time × 1 week → all 24 carousels + 9 images.
- 1 video editor × full-time × 2 weeks → all 27 reels (~10/week).
- Or batch 1 week at a time (9 posts ≈ 4 reels + 4 carousels + 1 image)
  → 2–3 working days per weekly batch, kept ~1 week ahead of publish.

**The track-detail UI now shows a red circle for any post whose media is
missing.** That's your team's worklist: red → green via the upload flow
in step 13.

### 13. Upload to R2 + attach to drafts

For each draft:

1. `POST /api/media/upload-url` → returns a signed PUT URL.
2. `PUT` the media file to that URL (R2).
3. The API returns a `media` row id.
4. Attach via `draft_media` (one row per piece of media per draft;
   carousels have N rows, ordered).

Can be scripted (`api/scripts/upload-neuera-media.mjs`) or done from
the draft editor UI at `/p/neuera-care/draft/<id>`.

### 14. Caption review

- [ ] A clinician at neuera.care reviews each of the 60 captions for
      medical accuracy.
- [ ] Add doctor names if appropriate (currently all copy says "our
      OBGYN specialists" because no individual practitioners are named
      on the public program pages).
- [ ] Adjust the disclaimer line if legal counsel wants a different
      phrasing.

---

## D. Flip the switch (per-post, not all-at-once)

For each post once **its** media is attached + caption reviewed:

1. Either UI: open the draft, hit "Schedule" → status flips to `scheduled`.
2. Or SQL (bulk after review):
   ```sql
   UPDATE drafts SET status = 'scheduled'
    WHERE id IN ('<draft-id-1>', '<draft-id-2>', ...);
   ```
3. The minute cron picks it up at `scheduled_for`, calls
   `instagram.publish()`, Telegram notifies on result.

Don't flip all 60 at once until the first 3–5 have published cleanly.

---

## Status indicators in the UI

On the track detail page (`/p/neuera-care/t/019e2f74-7b75-7f03-b6eb-0491e7cb5e81`)
each draft now shows a coloured circle:

| Circle   | Meaning                              | Underlying draft.status            |
| -------- | ------------------------------------ | ---------------------------------- |
| 🔴 red   | missing — content/media not complete | `draft`, `archived`                |
| 🟢 green | ready to be posted                   | `ready`, `scheduled`, `publishing` |
| 🔵 blue  | posted                               | `published`                        |
| 🟠 amber | failed (needs attention)             | `failed`                           |

This indicator is scoped to the "Instagram 45-day launch" track only;
other tracks keep the existing emoji ladder.

---

## Timeline summary

| Gate                                            | Calendar time                        | Owner            |
| ----------------------------------------------- | ------------------------------------ | ---------------- |
| Meta App Review                                 | 3–14 days                            | neuera.care      |
| IG Business account ready (already done)        | —                                    | neuera.care      |
| Send `META_APP_ID` + `META_APP_SECRET`          | After Meta app created               | neuera.care → me |
| `instagram.ts publish()` + R2 signed URL helper | 1–2 dev days                         | me               |
| First 7 days of media produced                  | 3–5 days                             | neuera.care team |
| Caption clinician review                        | 2–3 days                             | neuera.care      |
| First automated publish                         | **~2 weeks if review approves fast** | both             |

**Today's immediate ask:** start Meta App Review and send credentials.
Everything else can run in parallel.

---

## Live D1 references

| Thing                | Value                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Project              | `neuera-care` (`978f15b0-368e-7316-8faa-72c4ef6a9f6b`)                                          |
| Track                | `Instagram 45-day launch` (`019e2f74-7b75-7f03-b6eb-0491e7cb5e81`)                              |
| Drafts               | 60 rows, `status='draft'`, `account_id` now bound to dummy IG account                           |
| **Dummy IG account** | `@neuera.care` (`019e2f82-e8c7-7182-8f94-5bb148e9ad43`) — placeholder, no real OAuth tokens yet |
| IG page URL          | <https://www.instagram.com/neuera.care/>                                                        |
| Campaign window      | 2026-05-20 → 2026-07-03                                                                         |
| Daily slot           | 10:30 IST                                                                                       |
| Extras slot          | 20:00–21:30 IST (randomised, deterministic per post #)                                          |
| Format mix           | 27 reel / 24 carousel / 9 image                                                                 |

## Dummy account → real account swap (when OAuth lands)

The dummy IG account row exists so the track is bindable and the UI shows
"missing: media" instead of "missing: channel" — but it has a placeholder
`access_token` and `external_id`. Cron will refuse to publish from it
(the publisher will reject the placeholder token).

**When real OAuth completes** (step 6 above), either:

- A. Update the dummy row in place — preserves all draft bindings:
  ```sql
  UPDATE accounts
     SET external_id  = '<real-ig-business-id>',
         access_token = '<aes-gcm-encrypted-real-token>',
         refresh_token = NULL,
         expires_at   = NULL,
         scopes       = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management',
         meta         = json_set(meta, '$.placeholder', json('false'))
   WHERE id = '019e2f82-e8c7-7182-8f94-5bb148e9ad43';
  ```
  _Make sure the encrypted token uses the AES-GCM envelope from `api/src/lib/crypto.ts`._
- B. Delete the dummy + re-run the OAuth connect, then rebind drafts via the
  `UPDATE drafts SET account_id = ...` block in section B.7.

A is simpler. B is cleaner if you want OAuth's audit trail.

## What the UI shows now

Visible on **both** the track-list page (`/p/neuera-care/t/<track-id>`)
and the per-draft editor (`/p/neuera-care/draft/<id>`):

| UI element | What it shows | Source |
|---|---|---|
| 🔴 / 🟢 / 🔵 / 🟠 circle | draft status (missing / ready / posted / failed) | `drafts.status` |
| Post-kind badge | `REEL` / `CAROUSEL` / `PHOTO` / `STORY` (hover = full spec) | `platform_options.postKind` |
| `missing: …` chip(s) | what's blocking publish: `media`, `caption`, `channel`, `schedule` | computed |
| `spec: …` line | the media spec required for this post-kind | derived from `(platform, postKind)` |

Right now all 60 drafts show `missing: media` (and only media — channel
is bound, caption + schedule were seeded). The `spec:` line tells the
producer exactly what to make for each post:

| postKind | spec |
|---|---|
| reel | MP4/MOV · 9:16 · ≤100 MB · 3–90s |
| carousel | JPG/PNG (≤8 MB) or MP4 (≤100 MB) · 4:5 to 1.91:1 · 2–10 slides |
| image (photo) | JPG/PNG · 4:5 to 1.91:1 · ≤8 MB |
| story | 9:16 · JPG/PNG (≤8 MB) or MP4 (≤100 MB, ≤60s) |

These constraints mirror Meta Graph API publishing limits 1:1 — if a
file passes our validator, it should pass IG's container endpoint.

## Client-side media validator

Every file the team picks (drag-drop or file picker) is validated
**before** an R2 upload is initiated. The check runs in the browser
(`web/src/lib/mediaValidate.ts`) and probes:

- **MIME / file extension** — JPG/PNG for images, MP4/MOV for video.
- **File size** — per-postKind cap (8 MB images, 100 MB video).
- **Dimensions** — probed via `Image` / `<video preload=metadata>`, no
  full buffer load (works on mobile + iOS PWA).
- **Aspect ratio** — 4:5 to 1.91:1 for feed; ~9:16 for reels/stories.
- **Duration** — 3–90s for reels, ≤60s for carousel video / stories.

Failures: a red panel under the dropzone lists every error per file
(e.g. `reel: 12.3s — minimum 3s`, `reel: aspect 1.78 too wide — max
0.6 (9:16 expected)`). Files that pass continue to upload; failures
don't block the rest of the batch.

This is a client-side guard — there's no server-side enforcement yet.
A determined upload can still post a malformed file to R2. But IG's
container creation will reject anything wrong, so the worst case is a
late publish failure rather than a corrupted feed. Server-side
validation lands with the publisher (step 8 above).
