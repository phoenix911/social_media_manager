# Plan — neuera.care Instagram 45-day launch track

## Context

neuera.care is launching a 45-day Instagram content track to drive
awareness, app installs (Play + App Store), and program enquiries.
Goal: produce **60 publish-ready Instagram posts** spanning all 9
programs/evaluations, the brand site, and the Neuera journaling app,
output as **markdown files in `track/neuera_insta/launch/`** for review
**before** anything is seeded into D1.

Sources covered:

- `https://www.neuera.care/` — brand + value props
- `https://www.neuera.care/programs/` — all 9 program pages individually fetched
- Play Store + App Store — Neuera (journal/mood/period/voice-note app)

Brand voice: **clinician-led, warm, judgement-free, India-specific,
evidence-based.** Examples on-site: "Never Walk Alone", "Pain is not
normal — let's find out why", "Know your numbers. Protect your future."

## Decisions (resolved with user)

| Q             | Decision                                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cadence       | 1/day + extra every 3rd day → **60 posts over 45 days** (May 20 – Jul 3)                                                                                                        |
| Format mix    | **45% reel / 40% carousel / 15% image** — reel-led for reach, carousels for save-worthy program deep-dives. **No trend-bait reels** (voiceover + b-roll + on-screen text only). |
| Caption depth | Full publish-ready: hook + body + CTA + disclaimer + hashtags                                                                                                                   |
| Start date    | **Wed 2026-05-20**, 10:30 IST (05:00 UTC) for daily posts.                                                                                                                      |
| Extras time   | **Randomised within 20:00–21:30 IST** (evening prime; deterministic per post_number so re-runs are stable). Indian women's-health niche peaks 20:00–22:00 IST.                  |
| Doctor copy   | **"Our OBGYN specialists"** — multiple practitioners, brand-neutral. No named individuals.                                                                                      |
| Hashtag count | **~30 / post (IG max)** — reach prioritised over saves.                                                                                                                         |
| Status        | **Seed to D1 as `status='draft'`.** Track row + 60 draft rows. Team flips to `scheduled` after review.                                                                          |
| Channel       | **No IG account in DB.** Track + drafts seed with `account_id = NULL`; bind when channel connects.                                                                              |

## Channel state (as of planning)

```
SELECT … FROM accounts WHERE platform='instagram' OR
    project_id='978f15b0-368e-7316-8faa-72c4ef6a9f6b'  → 0 rows
```

No Instagram account is connected for `neuera-care` (or for any
project). Action this plan does NOT need: connecting the channel.
The markdown files are channel-agnostic — they reference platform
`instagram` but don't bind to an `account_id`. A later "seed to DB"
step will fill `account_id` from the linked channel.

## What gets produced

A new directory:

```
track/neuera_insta/launch/
├── README.md                 ← campaign index + calendar table
├── style-guide.md            ← brand voice, reel rules, hashtag bank, disclaimers
└── posts/
    ├── 001-2026-05-20-reel-pcos-myth-vs-fact.md
    ├── 002-2026-05-21-carousel-perimenopause-symptoms.md
    ├── …
    └── 060-2026-07-03-image-thanks-cta.md
```

**60 post files**, naming: `{NNN}-{YYYY-MM-DD}-{format}-{slug}.md`.

### Per-post markdown shape

```markdown
---
post_number: 001
date_ist: 2026-05-20
time_ist: "10:30"
scheduled_for_utc: "2026-05-20T05:00:00.000Z"
format: reel # reel | carousel | image
post_kind: reel # matches IG platform_options.postKind
pillar: education # education | program-spotlight | app | testimonial | founder | UGC | promo
program: pcos-management # one of 9 slugs, or "brand" / "app"
hook: "Your period is your fifth vital sign — but who told you that?"
cta: "Comment WAIT for the PCOS guide"
hashtags_count: 18
sources:
  - https://www.neuera.care/programs/pcos-management/
---

## Caption

{hook line — first line must hook in <125 chars, IG cuts off after this on feed}

{2-4 short paragraphs, each 1-3 sentences. India-specific, no jargon
without unpacking. Empathy first, then evidence.}

**{single CTA}** — e.g. "Comment WAIT for the PCOS guide", "Tap the
link in bio to book", "Save this for your next cycle".

_Disclaimer: This is educational content, not medical advice. For
personalised care, book a consultation at neuera.care._

#womenshealthindia #pcosindia #pcosawareness … (15-20 tags, mix of
broad + niche; see style-guide.md hashtag bank)

## Visual brief

{For reel: voiceover script + b-roll list (stock or original) + 3-4
on-screen text overlays + cover frame description}

{For carousel: 1-line description of each of 5-10 slides, including
the cover hook slide and the final CTA slide}

{For image: a single composition + on-image copy}

## Production notes

- Disclaimer placement (caption + last-frame text)
- Any claim that needs citation (link or footnote)
- Compliance flags (e.g. "do not name medications", "no before/after
  body shots")
```

### style-guide.md

- Voice rules (warm, clinical, judgement-free; no fear-mongering, no
  "miracle" claims, no before/after body photography)
- Reel rules (no trend audio, no dance, no point-at-text; voiceover +
  b-roll + bold captions only; doctor explainer when available; cover
  frame must have a text hook)
- Hashtag bank (3 buckets):
  - Brand/owned: `#neueracare #neueraapp #neueraprograms`
  - Condition: `#pcosindia #perimenopauseindia #menopauseindia
#irregularperiods #ttcindia #endometriosis …`
  - Community: `#womenshealthindia #womenshealthawareness
#periodpositive #cycleawareness …`
- Disclaimer pattern:
  - Caption: `_Disclaimer: This is educational content, not medical
advice. For personalised care, book a consultation at neuera.care._`
  - On-screen last frame: `Not medical advice • neuera.care`
- CTA bank (rotation):
  - "Book a consultation — link in bio"
  - "Download Neuera — Play Store / App Store"
  - "Comment {KEYWORD} for the {guide}"
  - "Save this for your next cycle"
  - "Send to a friend who needs to hear this"
- App-vs-clinic positioning: the app (journal/mood/period log) is the
  **daily companion**; the programs are the **clinical care**. Posts
  must not blur the line (the Apple page itself states "wellness tool,
  not a medical device").

### README.md (campaign index)

- Campaign summary, start/end dates, total posts, mix
- A 60-row table: `# | Date | Time | Format | Pillar | Program | Hook`
- A second table: weekly themes (below)

## 45-day calendar — week-by-week themes

|        Week | Dates (IST)     | Theme                                                                                                                                                  | Programs spotlighted               | Posts |
| ----------: | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- | ----: |
|           1 | May 20 – May 26 | **"Your body is talking — are you listening?"** Brand intro, app intro, "period is your 5th vital sign", common myths.                                 | brand + app + irregular-periods    |     9 |
|           2 | May 27 – Jun 02 | **PCOS week.** Symptoms, diagnosis, "is this PCOS or just stress?", Indian-specific factors (insulin + diet), 12-week journey carousel, TTC-with-PCOS. | pcos-management, ttc-pcos          |     9 |
|           3 | Jun 03 – Jun 09 | **Pain is not normal.** Period pain, pelvic pain, endometriosis red flags, when to seek help, evaluation deep-dive.                                    | period-pain                        |     9 |
|           4 | Jun 10 – Jun 16 | **Planning a baby.** Preconception, fertile window, lab panel basics, partner involvement, supplement myths.                                           | preconception-ttc, early-pregnancy |     9 |
|           5 | Jun 17 – Jun 23 | **Perimenopause is real.** "Am I in peri?" symptom checker, HRT 101, sleep/mood/cycle, the "underdiagnosed" angle.                                     | perimenopause                      |     9 |
|           6 | Jun 24 – Jun 30 | **Menopause & beyond.** DEXA + bone health, vaginal estrogen, heart, sexual wellness, long-term routines.                                              | menopause-care                     |     9 |
| 7 (partial) | Jul 01 – Jul 03 | **Know your numbers.** Women's health check, baseline panel, "what your labs actually mean", campaign close + CTA push.                                | womens-health-check + recap        |     6 |

Each week ≈ 7 daily posts + 2 extras (the every-3rd-day boost). Day 1
of each week opens with a reel; mid-week a carousel deep-dive; week
close with a testimonial-style image or founder voice. App posts (3
total) seeded across weeks 1, 4, 6.

### Format-mix audit (target = 60 posts)

|   Format | Share | Count |
| -------: | ----: | ----: |
|     Reel |   45% |    27 |
| Carousel |   40% |    24 |
|    Image |   15% |     9 |

### Pillar mix (across 60)

| Pillar                              | Count |
| ----------------------------------- | ----: |
| Education (symptom/myth/concept)    |    24 |
| Program spotlight (one of 9)        |    18 |
| App (Neuera journaling app)         |     6 |
| Testimonial / quote                 |     6 |
| Founder / behind-the-scenes / brand |     4 |
| Promo / CTA / availability          |     2 |

## How the work gets done (when approved)

Execution will:

1. Create dirs: `track/neuera_insta/launch/{,posts/}` at repo root.
2. Write `track/neuera_insta/launch/style-guide.md` (≈ 200 lines).
3. Write `track/neuera_insta/launch/README.md` (campaign index + 60-row table).
4. Write **60 markdown files** in `posts/` following the frontmatter
   - caption + visual brief + production notes shape above. Each
     caption is fully written (hook → body → CTA → disclaimer → tags).
5. **No D1 writes.** No config changes. No deploys.

After review, a separate follow-up turn would:

- Connect a real `instagram` account for `neuera-care` (`/channels` UI
  or manual). Currently no IG account exists in DB.
- Author a seed script in `api/scripts/seed-neuera-insta.mjs` modelled
  on `api/scripts/seed-tapeline.mjs` — uses UUIDv7, computes
  `track_offset_minutes` from start_at, sets
  `platform_options = { postKind, shareToFeed: true, seedSequence,
seedIntendedTime }` per `shared/src/platforms/index.ts`. Emit SQL,
  apply via `wrangler d1 execute … --remote --file`.
- Drafts seeded as `status='draft'` for team review before flipping
  to `'scheduled'`.

## Critical files this plan references

- `track/neuera_insta/launch/**` — net-new, the only writes in this turn
- `api/scripts/seed-tapeline.mjs` — pattern to mirror for the later seed step
- `api/src/db/schema.ts` — `tracks` + `drafts` columns
- `shared/src/platforms/index.ts` — Instagram option zod shape

## Verification

After the markdown files exist:

1. `ls track/neuera_insta/launch/posts | wc -l` → should print `60`.
2. Open 5 random posts; each should have a complete frontmatter block,
   a publish-ready caption (hook + body + CTA + disclaimer + tags),
   and a visual brief whose length matches the format.
3. `grep -L "Disclaimer" track/neuera_insta/launch/posts/*.md` should
   print nothing (every post has the disclaimer line).
4. `awk -F: '/^format:/ {print $2}' track/neuera_insta/launch/posts/*.md
| sort | uniq -c` should show counts ≈ 27 reel / 24 carousel /
   9 image.
5. Cross-check `README.md` 60-row table matches filenames 1:1.

## Open items the user may want to weigh in on

- **Time of day for "extra" posts**: defaulted to 19:00 IST. Switch? figure out what time works best based on market research and randomize between the time frame 
- **Doctor names**: program pages don't surface practitioners by name;
  founder/doctor pillar posts will be written brand-neutral ("our
  OBGYN specialists") unless names are provided. multiple doctors so go with our OBGYN specialists 
- **Hashtag count**: defaulted to ~18 per post. IG allows 30; some
  brands use 5. Lower count if "saves over reach" is the priority. reach is prioriy
