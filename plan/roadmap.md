# Roadmap

Concrete week-by-week plan. Adjust as we go; revisit at the end of
each milestone.

## Pre-work (before week 1)

- Decide the production domain (e.g. `smm.<your-cf-account>.co`,
  `social.z6o.cc`, etc.). ⚠ **Need user input.**
- Buy the domain or point an existing zone at Cloudflare.
- Open the platform dev portals and start the slow ones:
  - **Meta (Instagram)** — start app review submission. This will
    take 1–4 weeks, so kick it off NOW so it overlaps Phase 1.
  - **LinkedIn** — Marketing Developer Platform request *if* we
    want company-page posting. Otherwise skip.
  - Reddit, Twitter — instant approval, can be done in the week
    they're needed.

## Week 1 — foundations

| Day | Work |
|---|---|
| Mon | Repo bootstrap: `api/`, `web/`, `shared/`, root `Makefile`, wrangler config |
| Tue | D1: schema migrations, `db:apply:remote`, seed script |
| Wed | Cloudflare Access: One-time PIN, app policy, Worker JWT verify |
| Thu | OAuth scaffolding: per-platform adapter pattern, KV state nonces |
| Fri | Reddit OAuth end-to-end + sub rules + flair fetch |

End-of-week milestone: I can log in via One-time PIN, create a
project, connect a Reddit account.

## Week 2 — drafts + media + remaining auth

| Day | Work |
|---|---|
| Mon | LinkedIn OAuth + push-as-draft + update |
| Tue | Twitter OAuth (2.0 PKCE + 1.0a parallel) |
| Wed | Instagram OAuth + token refresh job |
| Thu | R2 media upload (presigned PUT + thumbnail extraction) |
| Fri | Draft CRUD API + audit log + token-at-rest encryption helper |

## Week 3 — UI

| Day | Work |
|---|---|
| Mon | Project picker + project dashboard |
| Tue | Markdown editor + per-platform preview (Reddit / LinkedIn) |
| Wed | Per-platform preview (Instagram + Twitter) + media drag-drop |
| Thu | Account management UI + project members UI |
| Fri | Polish + manual QA pass on full draft → save → review flow |

End-of-week milestone: **Phase 1 done.** Real draft lifecycle
working in browser for all 4 platforms.

## Week 4 — Phase 2 part 1: scheduler

| Day | Work |
|---|---|
| Mon | Cron Worker + atomic claim + scheduled_for timezone handling |
| Tue | Queue + consumer Worker + retry/backoff |
| Wed | Publisher interface; Reddit publisher (text + image) |
| Thu | Reddit weekly-thread resolver + comment publish path |
| Fri | LinkedIn publisher (push → publish, publish-now) |

## Week 5 — Phase 2 part 2: rest of platforms + notifications

| Day | Work |
|---|---|
| Mon | Twitter publisher (text + thread) |
| Tue | Twitter media (1.1 upload) |
| Wed | Instagram publisher (container + publish), assuming app review approved by now |
| Thu | Telegram bot (notifications + /approve /reject /reschedule) |
| Fri | Calendar view of scheduled posts + cancel/reschedule UI |

## Week 6 — polish + dogfood

| Day | Work |
|---|---|
| Mon | Load test: 100 scheduled posts, verify all publish within 60s |
| Tue | Flake hunt: pull network mid-publish, verify retries clean |
| Wed | Migrate paper_games' `app_distribution/reddit/*.md` into the system |
| Thu | Use it for a real weekly post round (paper_games launch posts) |
| Fri | Bug fixes from real-use feedback |

End-of-week milestone: **Phase 2 done.** Tool is in real-world use
for paper_games, ready to extend to other projects.

## Stretch goals (Phase 3, beyond week 6)

| | Phase 3 work |
|---|---|
| Analytics | Pull post performance back from each platform daily |
| Attribution link | Wire `attrs.measures.fit` referrer slugs into per-post stats |
| Content calendar | Full month view across projects |
| Templates | Reusable draft templates ("Show HN format", "Reddit format A") |
| Bulk import | Paste a Markdown file of posts → 10 drafts created |
| AI assist | Optional: take a project description + a target sub, suggest a title |

## How we know we should pause and reassess

- **End of week 1:** if CF Access + JWT verify isn't done by Friday,
  the rest is at risk. Reassess auth approach (CF Access misconfig
  vs. hand-rolled session cookies).
- **End of week 3:** if Phase 1 isn't usable end-to-end on at least
  Reddit + LinkedIn, push Phase 2 by a week and harden.
- **End of week 5:** if Instagram app review is still pending, ship
  Phase 2 without IG; add it later when approval lands.

## Decision log

Cross-cutting decisions made during planning, captured here so we
remember the *why* later.

| Date | Decision | Why |
|---|---|---|
| 2026-05-07 | Hybrid local + native drafts | LinkedIn supports drafts, Reddit/IG/X don't — split the diff |
| 2026-05-07 | CF Access with One-time PIN (no Google/GitHub IDP) | Zero 3rd-party auth dependency; works for any email; same security as SSO |
| 2026-05-07 | Drop Slack notifications; add Telegram bot as man-in-the-middle | Telegram doubles as notifier + control surface (/approve, /reject, /reschedule) |
| 2026-05-07 | R2 for media (private bucket + signed URLs) | Self-contained, IG fetch needs short-lived public URLs only |
| 2026-05-07 | Defer Twitter from initial platform list | Added on user request — supported via OAuth 2.0 PKCE |
