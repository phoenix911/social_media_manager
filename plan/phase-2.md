# Phase 2 — scheduling + publishing

**Goal:** turn drafts into scheduled / on-demand publishes, on every
platform, with retry + notification. Adds the autonomous publishing
brain on top of Phase 1's authoring environment.

## Scope

### In

- Schedule a draft for a future timestamp (with timezone support).
- Publish a draft now.
- Cron Worker that picks up due drafts every minute.
- Queue Worker that handles publishes with retries.
- Reddit weekly-thread comment automation (resolve sticky → reply).
- Per-platform publishers that translate our internal draft format
  to platform API calls.
- Notifications: **Telegram bot (man-in-the-middle)**.
- "Undo" window: 30s after schedule fires before queue picks up.
- Failure handling: retry 3× with backoff, then mark `failed` and
  notify.

### Out (Phase 3+)

- Analytics pull-back (post performance over time).
- Auto-suggesting "best time to post."
- Recurring posts.
- AI-assisted drafting.

## User stories

### As an editor, I want to schedule a draft

- On a draft, click "Schedule".
- Pick date + time + timezone (defaults to user's local TZ).
- Confirm.
- Draft moves to `scheduled` status; the schedule appears in a
  per-project calendar view.
- Until 30s before the scheduled time, I can edit or cancel.

### As an editor, I want a Reddit comment to go on this Saturday's iosgaming thread

- New draft → Reddit account → post kind: `comment-on-thread`.
- Configure thread resolver: `sub: iosgaming`,
  `match: "^Weekly self-promotion thread"`, `from: stickies[0,1]`.
- Schedule for next Saturday 7pm IST.
- At publish time the worker:
  1. Fetches `/r/iosgaming/about/sticky/1`.
  2. If title matches the regex → use that thread id.
  3. Else fall back to sticky/2.
  4. Else mark publish as `failed` with reason
     "no matching weekly thread found".
  5. POST `/api/comment` with the resolved `thing_id`.

### As an owner, I want to be notified — and act — when something needs me

- Project settings → notifications → connect a Telegram bot (paste
  bot token + my chat id).
- On `draft.scheduled`: bot sends a card with title, target sub /
  account, scheduled time, and a `/cancel <id>` hint.
- 30s before publish: bot sends "publishing in 30s — reply /hold to
  delay 10 min, /cancel to abort."
- On `publish.success`: bot posts the platform URL.
- On `publish.failed` (final): bot posts the error and a `/retry
  <id>` button.
- The bot also accepts incoming commands the same way:
  - `/list` — show next 5 scheduled posts
  - `/approve <id>` — promote a `ready` draft into `scheduled` for
    the next default time-slot
  - `/reject <id>` — archive a draft
  - `/reschedule <id> <time>` — push a scheduled post out
- This lets me run the whole publishing loop from Telegram without
  opening the web app — useful when I'm out and a draft needs a
  green-light.

### As an editor, I want to publish a LinkedIn draft NOW

- On a LinkedIn draft (already saved to LinkedIn drafts), click
  "Publish now".
- Backend PATCHes the existing LinkedIn draft to
  `lifecycleState=PUBLISHED`.
- Records the platform URL in `publishes`.

## System design

### Scheduler Worker (cron, every minute)

```ts
// pseudo
const due = await db.query(
  `SELECT id FROM drafts WHERE status='scheduled' AND scheduled_for <= datetime('now') LIMIT 100`
);
for (const { id } of due) {
  // Atomic state transition so two cron runs don't double-pick.
  const ok = await db.run(
    `UPDATE drafts SET status='publishing' WHERE id=? AND status='scheduled'`,
    [id]
  );
  if (ok.meta.changes !== 1) continue;
  await env.PUBLISH_QUEUE.send({ draft_id: id, scheduled_for: now });
}
```

### Queue consumer Worker

```ts
async queue(batch, env) {
  for (const msg of batch.messages) {
    try {
      await publishDraft(msg.body.draft_id, env);
      msg.ack();
    } catch (e) {
      const tries = (msg.attempts || 0) + 1;
      if (tries >= 3) {
        await markFailed(msg.body.draft_id, e.message, env);
        await notify(env, 'publish.failed', ...);
        msg.ack();
      } else {
        msg.retry({ delaySeconds: backoff(tries) });
      }
    }
  }
}
```

`backoff(1)` = 30s, `backoff(2)` = 120s, `backoff(3)` = 600s.

### Per-platform publishers

```ts
interface Publisher {
  publish(draft: Draft, account: Account): Promise<{ url: string; platform_post_id: string }>;
  pushDraft?(draft: Draft, account: Account): Promise<{ platform_draft_id: string }>;
  updateDraft?(draft: Draft, account: Account): Promise<void>;
  deleteDraft?(draft: Draft, account: Account): Promise<void>;
}

class RedditPublisher implements Publisher { ... }
class LinkedInPublisher implements Publisher { ... }
class InstagramPublisher implements Publisher { ... }
class TwitterPublisher implements Publisher { ... }
```

Selected at runtime from `account.platform`.

### Reddit weekly-thread resolver

Lives in `RedditPublisher`. Helper:

```ts
async function resolveWeeklyThread(account, options) {
  const stickies = await ensure([
    redditFetch('/r/' + options.subreddit + '/about/sticky/1', account),
    redditFetch('/r/' + options.subreddit + '/about/sticky/2', account),
  ]);
  const re = new RegExp(options.thread_pattern);
  for (const s of stickies) {
    if (s && re.test(s.title)) return s.id;
  }
  if (options.fallback_thread_id) return options.fallback_thread_id;
  throw new Error('no matching weekly thread for r/' + options.subreddit);
}
```

Called by `publish()` when `post_kind === 'comment'`.

### Undo window

When user clicks "Schedule for X", we set `scheduled_for = X`. The
cron worker's query `scheduled_for <= datetime('now')` means it
picks up exactly at X. The "30s undo" is enforced UI-side: the
scheduled-list view shows a "Cancel" button that's disabled when
`X - now < 30s`.

In the worker we also re-check the draft status before publishing:

```ts
const draft = await db.first(`SELECT * FROM drafts WHERE id=?`, [id]);
if (draft.status !== 'publishing') return;     // user cancelled
```

This is a belt-and-braces guard against races.

### Notifications

`notification_targets` table per project:

```sql
CREATE TABLE notification_targets (
  id          INTEGER PRIMARY KEY,
  project_id  INTEGER NOT NULL REFERENCES projects(id),
  kind        TEXT NOT NULL CHECK (kind IN ('telegram','webhook')),
  config      TEXT NOT NULL,   -- JSON: { bot_chat_id, webhook_url, ... }
  events      TEXT NOT NULL,   -- comma-separated: 'publish.success,publish.failed,...'
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

On each event, look up matching targets, fire them async (don't
block the publish flow).

## Tech tasks

| Task | Days |
|---|---:|
| Cron Worker (scheduler) + atomic claim | 1.0 |
| Queue + consumer Worker | 1.0 |
| Publisher interface + Reddit publisher | 1.5 |
| LinkedIn publisher (push + publish) | 1.0 |
| Twitter publisher (text + thread + media) | 1.5 |
| Instagram publisher (container + publish) | 1.5 |
| Reddit weekly-thread resolver | 0.5 |
| Telegram bot (notifications + inbound /commands + per-chat allowlist) | 1.5 |
| Undo window UI + race-safe worker check | 0.5 |
| Calendar view of scheduled posts | 1.0 |
| Failure UI + manual retry button | 0.5 |
| Polish + load test + flake hunting | 2.0 |
| **Total** | **~13 days** |

## Success criteria

- Schedule a Reddit comment for next Saturday 7pm IST → it lands
  in the iosgaming weekly thread within 60 seconds of the target.
- Schedule a LinkedIn post 7 days out → it publishes; the URL
  appears in `publishes`.
- Pull the network for 2 hours during a scheduled publish → the
  draft eventually publishes (Cloudflare retries on the queue).
- A draft scheduled for 5 minutes ago that we manually delete the
  account for → fails cleanly, notifies, doesn't loop.
- 99%+ of scheduled posts publish within 60s of their target time.

## Risks

- **Reddit shadow-bans automated posting.** Mitigation: jitter,
  rate caps, never auto-post without an explicit human "Schedule"
  click.
- **LinkedIn token rotation race** between two scheduled publishes
  for the same account. Mitigation: serialise publishes per
  account via the queue's same-key ordering.
- **Instagram app review delay.** Mitigation: keep IG behind a
  feature flag; ship Phase 2 for the other three platforms first.
- **Time-zone bugs.** Mitigation: store `scheduled_for` in UTC,
  always; render in the user's TZ; comprehensive TZ test suite
  (DST transitions, IST/EST/UTC).
