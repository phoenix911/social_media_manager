# tracks.md — adding tracks (and drafts) from the CLI

The web UI is fine for one-off tracks. For anything bigger — a launch
campaign, a 10-tweet thread schedule, a recurring weekly slot — generate
SQL or hit the API from a script. This doc covers both.

> Recap of the model: a **track** belongs to a project and is bound to
> exactly one **account** (channel). Each draft inside has a
> `sequence_in_track` (REAL, sortable, supports halves) and a
> `track_offset_minutes` (signed INT) which means "this many minutes
> from `track.start_at`". `scheduled_for` is computed as
> `start_at + offset_minutes` and recomputed automatically when start
> moves. Adhoc tracks have `start_at = NULL`; their drafts schedule
> themselves manually via `scheduled_for`.

There are two ways in. Pick by need:

| Approach | Use when | Trade-offs |
|---|---|---|
| **SQL via `wrangler d1`** | Bulk-loading 10+ drafts at once, seeding a project, copying a campaign across projects | No validation; you must look up FKs by hand; bypasses the audit log |
| **HTTP via `curl` + session cookie** | One-off track with 1–3 drafts, when you want validation + recompute logic to fire | Needs a live passkey session (cookie from devtools) |

## Approach A — SQL (the seed-script pattern)

This is exactly how `api/scripts/seed-tapeline.mjs` and `seed-paper-games.mjs`
work today. They emit a `.sql` file you apply with `wrangler d1 execute`.

### 1. Find the FKs you need

```bash
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ACCOUNT_ID=...

# Project id (by slug)
bun x wrangler d1 execute smm --remote -c wrangler.local.toml --json \
  --command "SELECT id, name FROM projects WHERE slug = 'neura-care';"

# Account id (= channel) — pick by platform + handle
bun x wrangler d1 execute smm --remote -c wrangler.local.toml --json \
  --command "SELECT id, platform, handle FROM accounts WHERE handle = '@neuera_care';"

# Your user id (= track.created_by, draft.created_by)
bun x wrangler d1 execute smm --remote -c wrangler.local.toml --json \
  --command "SELECT id FROM users WHERE email = 'sangeet.verma91@gmail.com';"
```

### 2. Generate UUIDv7s

The schema requires UUIDv7 strings, not autoincrement. Easiest:

```bash
bun -e 'console.log(crypto.randomUUID())'   # fine in a pinch (UUIDv4)
```

The seed scripts have a proper `uuidv7()` helper — copy from
`api/scripts/seed-tapeline.mjs:12-30` if monotonic ordering matters
(it does for `id` columns to keep `ORDER BY id` chronological).

### 3. Write the SQL

A track + 3 drafts on a single channel, anchored to a future start:

```sql
-- track: 3-post launch sequence on @neuera_care, starts 2026-05-12 at 09:00 IST
INSERT INTO tracks (id, project_id, name, description, account_id, start_at, tz, created_by)
VALUES (
  '019716e0-0000-7000-8000-000000000001',           -- track id (UUIDv7)
  '019716c0-...neura-care project id...',
  'gynaegoddess waitlist push',
  'three-post sequence kicking off the GG waitlist',
  '019716d0-...neuera_care IG account id...',
  '2026-05-12T03:30:00.000Z',                       -- 09:00 IST = 03:30 UTC
  'Asia/Kolkata',
  '019716b0-...your user id...'
);

-- draft 1: T-0 (offset 0) — caption-only
INSERT INTO drafts (id, project_id, track_id, account_id, status,
                    title, body, body_format,
                    track_offset_minutes, sequence_in_track,
                    scheduled_for, scheduled_tz, created_by)
VALUES (
  '019716e0-0000-7000-8000-000000000002',
  '019716c0-...project id...',
  '019716e0-0000-7000-8000-000000000001',           -- track id from above
  '019716d0-...account id...',
  'ready',
  'GG launch — post 1',
  '## launch day post body in markdown\n\nlorem ipsum',
  'markdown',
  0,                                                 -- T-0
  1.0,
  '2026-05-12T03:30:00.000Z',
  'Asia/Kolkata',
  '019716b0-...your user id...'
);

-- draft 2: +24h follow-up
INSERT INTO drafts (..., track_offset_minutes, sequence_in_track, scheduled_for, ...)
VALUES (..., 1440, 2.0, '2026-05-13T03:30:00.000Z', ...);

-- draft 3: +72h reminder
INSERT INTO drafts (..., track_offset_minutes, sequence_in_track, scheduled_for, ...)
VALUES (..., 4320, 3.0, '2026-05-15T03:30:00.000Z', ...);
```

### 4. Apply

```bash
bun x wrangler d1 execute smm --remote -c wrangler.local.toml \
  --file ./my-track.sql
```

Round-trip: ~2 seconds.

### 5. Verify

```bash
bun x wrangler d1 execute smm --remote -c wrangler.local.toml --json \
  --command "
    SELECT t.name AS track, d.title, d.scheduled_for, d.status
    FROM tracks t JOIN drafts d ON d.track_id = t.id
    WHERE t.id = '019716e0-0000-7000-8000-000000000001'
    ORDER BY d.sequence_in_track;
  "
```

### Field reference (the ones that bite)

| Column | Notes |
|---|---|
| `tracks.start_at` | ISO 8601 UTC. Use `Z` suffix. **Null** = adhoc. |
| `tracks.tz` | IANA only (`"Asia/Kolkata"`, not `"+05:30"`). Used for display, not storage. |
| `drafts.track_offset_minutes` | Signed integer, minutes. **Null** = "no auto-schedule from this track" — `scheduled_for` is then standalone. |
| `drafts.sequence_in_track` | `REAL`. Insert between row 2 and 3 with `2.5`. Sortable, no renumbering. |
| `drafts.status` | One of `draft / ready / scheduled / publishing / published / failed / archived`. The cron only picks up rows with `status = 'scheduled'`. |
| `drafts.body_format` | `'markdown'` for everything. Per-platform shells render it differently. |
| `drafts.platform_options` | TEXT (JSON). Platform-specific bits — Reddit subreddit + flair, LinkedIn visibility, Twitter thread split, IG carousel order, PH topic. Null is fine. |
| `drafts.scheduled_for` | ISO 8601 UTC. The cron looks at this. **Set it even if `track_offset_minutes` is set** — the API patch route recomputes, the seed script must precompute. |

### Promoting drafts to "scheduled"

Created drafts default to `status = 'draft'`. The publisher only fires
on `'scheduled'`. To bulk-schedule a track's drafts:

```sql
UPDATE drafts SET status = 'scheduled'
WHERE track_id = '019716e0-...' AND status IN ('draft', 'ready');
```

## Approach B — HTTP API

Use this for one-offs or when you want the offset-recompute logic on
`PATCH /api/tracks/:id` to fire (moving `start_at` will rewrite every
draft's `scheduled_for`).

### 1. Grab a session cookie

You need a passkey login first. Open <https://smm.table.pw> in a
browser, sign in, then open devtools → Application → Cookies →
copy the value of `smm_sess`.

```bash
export SMM_COOKIE="smm_sess=<paste-here>"
```

### 2. Find the project + account ids (no SQL needed)

```bash
curl -sS https://smm.table.pw/api/projects -H "Cookie: $SMM_COOKIE" | jq '.projects[] | {id, slug, name}'
curl -sS https://smm.table.pw/api/accounts -H "Cookie: $SMM_COOKIE" | jq '.accounts[] | {id, platform, handle}'
```

### 3. Create the track

```bash
TRACK_ID=$(curl -sS -X POST https://smm.table.pw/api/tracks \
  -H "Cookie: $SMM_COOKIE" -H "Content-Type: application/json" \
  -d '{
    "projectId":   "019716c0-...",
    "accountId":   "019716d0-...",
    "name":        "gynaegoddess waitlist push",
    "description": "three-post sequence kicking off the GG waitlist",
    "startAt":     "2026-05-12T03:30:00.000Z",
    "tz":          "Asia/Kolkata"
  }' | jq -r '.track.id')
echo "track: $TRACK_ID"
```

### 4. Create drafts

```bash
curl -sS -X POST https://smm.table.pw/api/drafts \
  -H "Cookie: $SMM_COOKIE" -H "Content-Type: application/json" \
  -d @- <<JSON
{
  "projectId":           "019716c0-...",
  "trackId":             "$TRACK_ID",
  "accountId":           "019716d0-...",
  "title":               "GG launch — post 1",
  "body":                "## launch day post body in markdown\n\nlorem ipsum",
  "bodyFormat":          "markdown",
  "trackOffsetMinutes":  0,
  "sequenceInTrack":     1.0,
  "scheduledFor":        "2026-05-12T03:30:00.000Z",
  "scheduledTz":         "Asia/Kolkata",
  "status":              "ready"
}
JSON
```

Repeat for each draft. `scheduledFor` is recomputed if you later
`PATCH /api/tracks/$TRACK_ID` with a new `startAt`.

### 5. Schedule the whole track (flip status)

There's no bulk-schedule route; do it per-draft via PATCH, or hop to SQL:

```bash
bun x wrangler d1 execute smm --remote -c wrangler.local.toml \
  --command "UPDATE drafts SET status='scheduled' WHERE track_id='$TRACK_ID' AND status IN ('draft','ready');"
```

## Patterns the seed scripts use

`api/scripts/seed-tapeline.mjs` is the canonical example for a
multi-platform track. It:

1. Defines drafts as JS objects with `intendedTime` strings and
   `platform` + `body` + per-platform option fields.
2. Computes UUIDv7s deterministically.
3. Emits idempotent SQL: `INSERT OR IGNORE` on stable IDs so a re-run
   is a no-op.
4. Wraps everything in a single transaction.

Copy that file when adding a new campaign.

## When to NOT use the CLI

- **Scheduling immediate posts** (within the next minute) — the cron
  picks up at minute boundary; faster to use the web "publish now"
  button at `/p/<slug>/draft/<id>`.
- **Adding media** — media upload requires R2 signed URLs; do it from
  the web upload widget or the API (`POST /api/media/upload-url`),
  not raw SQL.
- **Cross-channel coordinated posts** — one track = one channel by
  design. Use multiple parallel tracks with the same `start_at`.
