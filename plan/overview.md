# Overview

## Problem statement

I run multiple side-projects (paper_games, measure_app, others
incoming). Each ships independently and each needs distribution work
on Reddit / LinkedIn / Instagram. The current state across them:

- Drafts live in scattered Markdown files (per the paper_games
  `app_distribution/` setup) — fine for solo authoring, awkward for
  collaboration and review.
- Media (GIFs, screenshots, hero images) lives next to drafts in
  git. Fine, but no thumbnails, no quick previews, no version control
  of the asset itself separate from the draft.
- Posting is manual. No way to see at a glance "what's queued
  across all my projects this week."
- No scheduling. No analytics loop back to the project repos.

## What success looks like

A single web app where I can:

1. **Open project →** see all drafts across all platforms for that
   project, grouped by status (`draft`, `ready`, `scheduled`,
   `published`).
2. **Create a draft →** pick platform + account, write markdown,
   upload media, see a per-platform preview that approximates how
   the post will look, save.
3. **Mark ready →** lock the draft, optionally push to the
   platform's native draft system (LinkedIn supports this).
4. **(Phase 2) Schedule →** pick a future time, the system
   publishes automatically and records the post URL.
5. **(Phase 3) See results →** click a published post, see install
   counts (via `attrs.measures.fit` referrer slugs already wired
   in paper_games), upvotes, comments.

## Concrete success criteria

| | Metric | Target |
|---|---|---|
| **Phase 1** | Time from "I wrote a draft" to "saved with media" | ≤ 5 minutes |
| | Time to switch between projects | ≤ 1 second |
| | Drafts I can find later | 100% — no orphans |
| | Cost / month | ≤ $5 |
| **Phase 2** | Scheduled posts that publish on time | ≥ 99% |
| | Failed publish that I get notified about | 100% |
| | Reddit comment-on-thread (iosgaming) automation | ✅ |
| **Phase 3** | Published posts with install attribution linked | 100% |

## Goals (in priority order)

1. **Phase 1 ships fast.** Drafts + media + multi-project in 2
   weeks. No publishing logic in v1 — everything still copy-paste
   per platform after Phase 1.
2. **Multi-project from day 1.** I won't migrate later. Project as
   a first-class concept in the data model.
3. **Multi-platform from day 1.** Even if Phase 1 only deeply
   supports Reddit + LinkedIn drafting, the schema must accept
   Instagram (and future Twitter/X) without migrations.
4. **Markdown-first.** Drafts are Markdown. Server stores plain
   text. Platform-specific transforms happen at preview/publish
   time, not at storage time. This means I can dump drafts back to
   git as `.md` files anytime.
5. **Auth that doesn't suck.** Cloudflare Access + One-time PIN
   means I never write password code, never store password hashes,
   never build a forgot-password flow, and never depend on a 3rd-
   party IDP staying up.

## Non-goals (deliberate)

- **No Buffer/Hootsuite clone.** No bulk import, no "best time to
  post" recommendations, no analytics dashboards in v1.
- **No multi-tenant SaaS.** This is internal. Only emails on the
  CF Access allowlist can sign in (via One-time PIN); everyone
  else gets a 403.
- **No mobile app.** Web works on phone; native is a Phase 4
  question if at all.
- **No scheduling in Phase 1.** Phase 1 is *draft-only*.
- **No AI in v1.** No "write me a Reddit post about X." The tool
  is for human-authored content.
- **No platform we don't actually use.** Skip Twitter/X, TikTok,
  YouTube, Mastodon, Bluesky, Threads. Add only on real demand.

## Open architecture questions (resolved)

- **Local drafts vs platform-native drafts?** → **Hybrid.** Always
  store local; optionally push to platform draft (LinkedIn) when
  the author asks. (User decision, 2026-05-07.)
- **Auth?** → **Cloudflare Access with One-time PIN to email** (no
  Google / no GitHub IDP — zero external auth dependency). Small
  team with project ACLs in our own DB.
- **Media?** → **Upload to R2.** No git-path references, no
  external CDN. Self-contained.
