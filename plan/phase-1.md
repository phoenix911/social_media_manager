# Phase 1 — drafts only

**Goal:** ship a usable draft system in 2 weeks. No publishing
logic, no scheduling. Output is a draft that's either kept locally
in our DB or pushed to a platform's native draft (LinkedIn only).

## Scope

### In

- Multi-project (with members + roles).
- Multi-platform accounts: Reddit, LinkedIn, Instagram, Twitter.
- OAuth connect for all four.
- Markdown editor with per-platform preview.
- Media upload to R2.
- Draft CRUD.
- "Save to LinkedIn drafts" — the one platform-native draft.
- Audit log of all mutations.
- Cloudflare Access + One-time PIN to email.

### Out (deferred to Phase 2)

- Scheduled publishing.
- Direct "Publish now" button.
- Cron worker.
- Queues.
- Reddit weekly-thread comment automation.
- Notifications (Telegram bot).
- Analytics pull-back.

## Concrete user stories

### As a project owner, I want to create a project

- Click "New project" on the dashboard.
- Enter name + slug (auto-generated from name, editable).
- Land on the empty project dashboard.
- I'm automatically the owner.

### As an editor, I want to connect a platform account

- On `/p/<slug>/accounts`, click "Connect Reddit".
- Bounced to Reddit auth, click Allow, come back to our app.
- See the new account in the list with handle + connected-on date.
- See per-account status indicator (token healthy / expiring soon /
  revoked).

### As an editor, I want to write a Reddit draft

- Click "New draft" → select project → select Reddit account.
- Pick subreddit (autocomplete from a list of subs the user has
  used before, plus a search field).
- Pick post kind: self / link / image / comment-on-thread.
- Pick flair (loaded from sub's metadata).
- Write title + markdown body.
- See a Reddit-flavor preview side-by-side.
- Drag & drop a GIF — uploaded to R2, attached to draft.
- See the sub's rules listed below the editor as a checklist.
- Save.

### As an editor, I want to write a LinkedIn draft and push it

- Same flow as Reddit but the editor strips Markdown to LinkedIn-
  flavor plain text in preview.
- Click "Save to LinkedIn Drafts".
- Backend POSTs `lifecycleState=DRAFT`; stores returned URN.
- Visible in LinkedIn's own drafts list — user can finalize there
  OR keep editing in our app.

### As an editor, I want to organize drafts

- Filter drafts by status, platform, scheduled-by-date (for
  future).
- Tag drafts (free-text tags).
- Search drafts by title or body content.
- Archive drafts (soft delete).

### As an owner, I want to invite a teammate

- `/p/<slug>/settings/members` → enter email, pick role.
- Email is added to CF Access policy (manual via dash in v1).
- Pending row in `project_members`.
- When the invitee logs in (already in CF Access allowlist), their
  pending row is matched on email and they see the project in
  their list.

## Non-functional requirements

- **TTI (time to interactive)** for the dashboard < 1s on a fresh
  page load over 4G.
- **Edit-to-save round-trip** < 300ms.
- **Media upload** completes within a few seconds for files < 50MB.
- **No data loss** — every mutation auto-saves; no "save"
  button required for the editor.
- **Browser support:** modern Safari/Chrome/Firefox. No IE, no
  legacy Edge.

## Tech tasks (rough estimate)

| Task | Days |
|---|---:|
| Repo bootstrap (web + api + shared types + wrangler) | 0.5 |
| D1 schema + migrations + seed | 0.5 |
| CF Access wired up + JWT verify in Worker | 0.5 |
| OAuth scaffolding (per-platform adapter pattern) | 1.0 |
| Reddit OAuth + read sub rules + flairs | 0.5 |
| LinkedIn OAuth + push-as-draft + update | 1.0 |
| Instagram OAuth + token refresh | 1.0 |
| Twitter OAuth (2.0 + 1.0a parallel) | 1.0 |
| R2 media upload (presigned URLs) + thumbnail extraction | 1.0 |
| Draft CRUD (api + ui) | 1.5 |
| Markdown editor + per-platform preview | 1.5 |
| Project + member management | 1.0 |
| Audit log | 0.5 |
| Token-at-rest encryption helper | 0.5 |
| Polish + bugs | 1.5 |
| **Total** | **~13 days** |

## Success criteria for Phase 1

- I can write a Reddit post in our app, attach a GIF, see a
  Reddit-flavor preview, and save it as a draft.
- I can write a LinkedIn post, click "Save to LinkedIn drafts",
  and verify it appears in LinkedIn's drafts list.
- I can switch projects in < 1 second.
- A teammate can be invited and posts under their own One-time-PIN session.
- No platform tokens are ever logged or sent to the browser.

## Risks

- **App review for Instagram blocks Phase 2.** Mitigation: start
  app review during Phase 1 dev.
- **CF Access misconfig leaks the API.** Mitigation: write an
  integration test that hits the API without a JWT and asserts
  401.
- **Markdown→LinkedIn plaintext rendering edge cases.** Mitigation:
  manual side-by-side test on 10 representative drafts before
  declaring done.
