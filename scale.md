# scale.md

How much we can do on the free tier vs the $5/month Workers Paid
plan vs spending more. Numbers from Cloudflare's published 2025
pricing pages — recheck before relying on them for anything load-
bearing.

## Scale ladder — what each step costs

The table below assumes a realistic platform mix per published post:
**~30 % Twitter / 30 % Reddit / 25 % LinkedIn / 15 % Instagram.** Total
posts is the sum across all four. "Connected accounts" is the *count
of platform accounts* connected across all projects, not posts.

Costs are sum of (Cloudflare infra) + (per-platform API tiers
required) at the published list prices for 2025. Per-platform API
costs only kick in when their free quotas are exhausted.

| # | Posts/mo | Users | IG accounts needed¹ | CF plan | Twitter API tier² | LinkedIn tier³ | Instagram | Reddit | CF infra cost | Platform API cost | **Total / mo** |
|--:|--:|--:|--:|---|---|---|---|---|--:|--:|--:|
| 1 | 100 | 1–2 | 1 | Free *or* Workers Paid | Free (≤1.5k writes) | Free (default) | Free + Meta app | Free | $0 / **$5** | $0 | **$0–$5** |
| 2 | 500 | 3 | 1 | Workers Paid | Free | Free | Free | Free | $5 | $0 | **$5** |
| 3 | 1,000 | 3–5 | 1 | Workers Paid | Free (≈300 tweets) | Free | Free | Free | $5 | $0 | **$5** |
| 4 | 5,000 | 5 | 1 | Workers Paid | Free at the limit (~1.5k tweets ≈ Twitter free cap) | Free | Free | Free | $5 | $0 | **$5** |
| 5 | 10,000 | 10 | 2 | Workers Paid | **Basic $100/mo** (3k tweets > 1.5k free) | Free | Free | Free | $5 | $100 | **$105** |
| 6 | 25,000 | 15 | 5 | Workers Paid (light overage) | Basic $100 | Free | Free | Free | ~$6 | $100 | **~$106** |
| 7 | 50,000 | 20 | 10 | Workers Paid (moderate overage) | Basic $100 (15k tweets ≤ 50k Basic cap) | Free | Free | Free | ~$10 | $100 | **~$110** |
| 8 | 100,000 | 25–30 | 20 | Workers Paid (R2 + queue overage) | Basic $100 (30k tweets) | Likely still free⁴ | Free | Free | ~$25 | $100 | **~$125** |

¹ Instagram allows **25 publishes per IG account per 24 h** — i.e.
~750/month/account. The "IG accounts needed" column = ⌈monthly IG
posts ÷ 750⌉ at the 15 % mix.

² Twitter free tier caps **1,500 writes/month**. **Basic ($100/mo)**
allows 50,000 writes/month. **Pro ($5,000/mo)** is far above
anything in this table.

³ LinkedIn free auth gives **100 calls/day per token**. With
multiple connected LinkedIn accounts the per-account limit is
basically irrelevant for hand-authored posting. Marketing Developer
Platform is required only if we post to **company pages** at scale —
free but reviewed.

⁴ At row 8 (100k/mo total, 25k LinkedIn), if those 25k posts are
spread across e.g. 5 LinkedIn accounts that's 5,000 posts/account/mo
≈ 167/day → exceeds 100/day free for any single account. Two
options: (a) connect more accounts, (b) apply for Marketing
Developer Platform (free but a multi-week review). Costs $0 either
way.

### How the CF infra cost grows past row 5

The dominant variables once you're well past row 5 are **R2
storage** and **R2 class-A ops** (writes). Everything else (D1,
Workers requests, Queues, KV) stays inside the $5/mo Workers Paid
quotas even at 100k posts.

| Row | Posts/mo | Media writes/mo | New media/mo (≈3 MB avg) | R2 storage above 10 GB | R2 class-A ops above 1 M | Approx CF cost |
|--:|--:|--:|--:|--:|--:|--:|
| 1 | 100 | ~500 | ~1.5 GB | $0 | $0 | $0–$5 |
| 5 | 10 k | ~50 k | ~150 GB | ~$2.10 | $0 (under 1 M) | ~$5 |
| 6 | 25 k | ~125 k | ~375 GB | ~$5.50 | ~$0 (under 1 M) | ~$11 |
| 7 | 50 k | ~250 k | ~750 GB | ~$11.10 | ~$0 (just under 1 M) | ~$16 |
| 8 | 100 k | ~500 k | ~1.5 TB | ~$22.40 | ~$2.30 (~1.5 M ops) | ~$30 |

(Storage cost = months of accumulated media × $0.015/GB-month; the
rows above show *steady-state* monthly costs assuming we keep
roughly 6 months of media before pruning.)

### Reading the table

- **Up to ~5,000 posts/mo:** $5/month total. The whole platform fits
  inside Cloudflare's $5 plan + every social platform's free API
  tier. This is "small team running it for several side-projects."
- **5,000 → 10,000 posts/mo:** the hard wall is Twitter's 1,500-
  free-writes/month cap. Crossing it forces either Basic ($100) or
  silently dropping Twitter from the rotation.
- **10,000 → 100,000 posts/mo:** linear scaling at $100 (Twitter
  Basic) + slowly creeping CF infra cost driven mostly by R2.
  $125/mo for 100,000 posts is the whole bill.
- **CF Access seats** stay free until 50 users — we don't approach
  this on the user axis even at row 8.

### When to revisit pricing

- **Twitter changes its tier pricing again** (it has 3× since 2023).
  If Pro drops from $5,000 or the Basic write cap moves, the table
  shifts.
- **Cloudflare announces new compute primitives** or repackages D1
  pricing.
- **You start posting media-heavy** content (long video, raw 4K
  images): R2 storage cost dominates and the per-row CF estimates
  rise quickly.

## TL;DR

- **Free tier:** comfortable for 1 user, ~5 projects, ~50
  drafts/month. Realistic for "just me using it."
- **Workers Paid ($5/month):** comfortable for our intended scale
  (small team, 10 projects, 500 drafts/month, all-platform
  publishing). Unlocks D1 1M-row tier, R2 sustained writes, Queues.
  **This is the recommended plan.**
- Beyond: linear scaling on usage, no per-seat fees. We won't
  hit it.

## Cost summary

| Resource | Free tier | Workers Paid ($5/mo) | Where the next $ comes from |
|---|---|---|---|
| Workers requests | 100,000/day | 10M/month | $0.30 per extra million |
| Workers CPU time | 10ms/req | 30s/req cap | included in the 10M |
| D1 reads | 5M/day | 25M/day | $0.001 per 1k reads |
| D1 writes | 100k/day | 50M/month | $1.00 per 1M writes |
| D1 storage | 5 GB total | 5 GB included | $0.75/GB/month after |
| R2 storage | 10 GB-month | 10 GB included | $0.015/GB-month after |
| R2 class A ops (writes) | 1M/month | 1M/month | $4.50/M after |
| R2 class B ops (reads) | 10M/month | 10M/month | $0.36/M after |
| R2 egress | unlimited free | unlimited free | always $0 |
| Queues operations | n/a (paid only) | 1M/month included | $0.40/M after |
| KV reads | 100k/day | 10M/month | $0.50/M after |
| KV writes | 1k/day | 1M/month | $5/M after |
| Cron triggers | 3 per Worker | 3 per Worker | unchanged |
| Pages requests | 100k/day | unlimited | always free |
| Pages builds | 500/month | 5,000/month | included |
| Cloudflare Access | Free for 50 users | Free for 50 users | $7/user/month after 50 |

## What our actual workload looks like

For sizing purposes I assume:

- 5 active projects, 3 users.
- ~20 drafts created per project per month → **300 drafts/month** total.
- ~5 media files per draft (avg 1 MB GIF, 500 KB image) → **1,500
  uploads/month**, ~1 GB new media per month.
- ~10 "publish now" + 50 scheduled publishes per month → **60
  publishes/month**.
- The 60 publishes each call ~3 platform endpoints, plus our own
  retry policy, plus the cron worker firing every minute.
- UI usage: ~50 dashboard loads per day, mostly cached.

Let's check this against each resource.

### Workers requests

- Cron: 60 invocations/hour × 24 × 30 = **43,200/month**.
- API hits per draft creation flow: ~25 calls (load, save, attach
  media, fetch sub rules, etc.). 300 drafts × 25 = **7,500/month**.
- Publish flows: 60 publishes × ~10 calls each = **600/month**.
- Page loads + ambient: ~50/day × 30 × 5 frontend-side calls = **7,500/month**.
- **Total: ~58,800 requests/month.**

→ Free tier limit: 100,000/**day** = 3,000,000/month. We use 2%.
→ Paid tier limit: 10,000,000/month. We use 0.6%.

**Verdict:** even free tier handles this 50× over.

### D1 reads

Most-read paths:
- `GET /api/projects` (every page load): ~150/day × 30 = 4,500/mo
- `GET /api/drafts` (every project page load): 4,500/mo
- Cron's "find due drafts" SELECT: 43,200/mo
- Per-draft fetches during edit: 300 × 10 = 3,000/mo

**Total: ~55,000 reads/month** — 0.001% of paid quota.

### D1 writes

- Draft mutations: 300 drafts × ~10 saves each = 3,000/mo
- Audit log: every mutation → another 3,000/mo
- Token refreshes: 4 platforms × 3 users × ~30/mo = 360/mo
- Publish records: 60/mo

**Total: ~6,500 writes/month** — well under free (100k/day) and
trivial vs paid (50M/month).

### D1 storage

After 1 year at this rate:
- ~3,600 drafts × ~5 KB body avg = 18 MB
- ~75,000 audit_log rows × ~1 KB = 75 MB
- ~18,000 publishes / media / ... rows × ~1 KB = 18 MB

**Total after 1 year: ~110 MB.** We're inside the 5 GB free quota
for 40+ years at this rate.

### R2 storage

- ~1 GB new media/month × 12 = **12 GB/year**.
- Free tier: 10 GB-month included. Year 1 average usage will straddle
  this — cost: roughly **$0.50–$1/year** in R2 storage above free.
- Negligible.

### R2 ops

- Writes: 1,500 uploads/month × ~3 ops each (multipart) = **4,500/mo**.
  Free quota: 1,000,000/mo. We use 0.45%.
- Reads: media views in our app + IG fetches. Estimate 30k/mo. Free
  quota: 10M/mo. We use 0.3%.

### Queues (Phase 2)

- 60 publishes/month → 60 Queue messages, plus retries (avg 1.1× =
  ~66 ops). Free Workers Paid: 1M/mo. We use 0.007%.

### KV

- OAuth state nonces: 1k/mo. Token refreshes / cache: ~10k/mo.
- Free: 100k reads + 1k writes per day. We're under.

### Cron triggers

- We need 1 cron trigger (the every-minute scheduler).
- Limit: 3 per Worker. Plenty.

### Cloudflare Access

- Free up to **50 users**. We're going to be 1–10 users.

## Free-tier reality check

Can we ship the WHOLE thing on the free tier indefinitely?

**Almost — except Queues are paid-only.**

If we drop Queues from Phase 2 (replace with cron polling D1
directly + retry-by-status), we *could* run on the free tier. But:

- Queues add reliability we want for publishes (retries, batching,
  ordering).
- $5/month is a rounding error against the value of automated
  publishing across multiple projects.

**Recommendation: pay $5/month from day 1.** Not because we need
the quotas — we don't — but because:

1. Queues unlock cleaner publish architecture in Phase 2.
2. D1 quotas jump (helps if we ever batch-import a lot of historical
   posts).
3. KV writes go from 1k/day → 1M/month — useful for tighter rate
   limiting.
4. Pages builds go from 500/mo → 5,000/mo — relevant during active
   dev.

## When would we need to pay more?

A back-of-envelope worst case:

| If… | …we'd hit | …costing |
|---|---|---|
| 50 projects, 50 drafts each, every day | ~150k drafts/year | nothing — D1 still under 5GB |
| 1,000 GB of media accumulated | R2 storage above 10 GB | $14.85/mo at 1 TB |
| 10× the publish volume (600/mo) | Queues + Workers requests | still free quota; ~$0.10/mo extra |
| 100+ users on CF Access | $7/user/mo over 50 | $7 per extra user |

We won't realistically hit any of these in year 1.

## Bandwidth + egress

R2's killer feature: **egress is always free.** Even if our media
serves 10 GB/day to Instagram's image fetcher, we pay $0 for
bandwidth. This alone makes Cloudflare cheaper than equivalent
S3-based setups.

## Comparison: if we weren't on Cloudflare

For perspective. Same workload, equivalent stack on AWS:

| | Cloudflare ($5) | AWS equivalent |
|---|---|---|
| Compute | Workers $5/mo | Lambda + API GW ~$3/mo |
| DB | D1 (free in $5) | RDS Postgres $15/mo (smallest tier) OR DynamoDB $1/mo |
| Storage | R2 (free 10GB + free egress) | S3 $0.30/mo + **$0.09/GB egress** = $20–100/mo realistic |
| Auth | CF Access (free 50 users) | Cognito $0.0055/MAU = ~$0/mo |
| Static hosting | Pages (free) | CloudFront + S3 ~$1/mo |
| **Total** | **$5/mo** | **$20–120/mo** |

The egress cost alone makes Cloudflare the right choice for any
media-heavy app.

## What we'd reassess at scale

If by month 6 we're hosting 50+ projects (we won't be):

- Move D1 → planet-scale Postgres (Neon) only if we hit a feature
  D1 doesn't have. So far D1 covers SQLite SQL, transactions, full
  text search.
- Add a second cron worker for analytics ingestion.
- Add a CDN cache layer for hot media (Cloudflare cache is
  automatic on R2 anyway).

None of this is on the radar today. The plan stays $5/month.
