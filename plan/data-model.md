# Data model

D1 is SQLite. Schema below is the v1 target. Migrations live in
`api/migrations/00xx_*.sql` and are applied via
`wrangler d1 execute --file=...`.

## Tables

### `users`

```sql
CREATE TABLE users (
  id          INTEGER PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  name        TEXT,
  picture_url TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen   TEXT
);
```

- One row per email that has ever logged in via CF Access.
- Created on first login (worker reads JWT, inserts if missing).
- We never store passwords. Access handles the One-time PIN flow;
  the worker just trusts the signed JWT and records the email.

### `projects`

```sql
CREATE TABLE projects (
  id          INTEGER PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,    -- url path: /p/<slug>
  name        TEXT NOT NULL,
  description TEXT,
  owner_id    INTEGER NOT NULL REFERENCES users(id),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  archived_at TEXT
);
```

- Slug is URL-safe, lowercase, kebab-case. Examples:
  `paper-games`, `tapeline`, `weekendapp`.
- Owner gets implicit owner role; explicit row also added to
  `project_members` for uniform access checks.

### `project_members`

```sql
CREATE TABLE project_members (
  project_id INTEGER NOT NULL REFERENCES projects(id),
  user_id    INTEGER NOT NULL REFERENCES users(id),
  role       TEXT NOT NULL CHECK (role IN ('owner','editor','viewer')),
  added_at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (project_id, user_id)
);
```

- Roles:
  - `owner` — manage members, delete project, all editor rights
  - `editor` — create / edit / delete drafts, accounts, media
  - `viewer` — read-only

### `accounts`

```sql
CREATE TABLE accounts (
  id              INTEGER PRIMARY KEY,
  project_id      INTEGER NOT NULL REFERENCES projects(id),
  platform        TEXT NOT NULL CHECK (platform IN ('reddit','linkedin','instagram')),
  handle          TEXT NOT NULL,           -- username/page name as displayed
  external_id     TEXT NOT NULL,           -- platform user/page id
  scopes          TEXT NOT NULL,           -- space-separated OAuth scopes granted
  access_token    TEXT NOT NULL,           -- encrypted at rest, see "Crypto" below
  refresh_token   TEXT,                    -- encrypted; nullable for IG long-lived
  expires_at      TEXT,
  meta            TEXT,                    -- JSON: subreddit defaults, IG biz id, etc.
  added_by        INTEGER REFERENCES users(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at      TEXT,
  UNIQUE (project_id, platform, external_id)
);
```

- One project can have multiple accounts on the same platform
  (e.g. personal + brand LinkedIn).
- Tokens encrypted with AES-GCM using a key bound to the Worker
  (stored in `secrets`); see [auth.md](auth.md) §"Token storage."
- `revoked_at` set when user disconnects or platform returns 401.

### `drafts`

```sql
CREATE TABLE drafts (
  id                   INTEGER PRIMARY KEY,
  project_id           INTEGER NOT NULL REFERENCES projects(id),
  account_id           INTEGER REFERENCES accounts(id),
  status               TEXT NOT NULL CHECK (status IN
                         ('draft','ready','scheduled','publishing','published','failed','archived')),
  title                TEXT,
  body                 TEXT NOT NULL DEFAULT '',
  body_format          TEXT NOT NULL DEFAULT 'markdown',
  platform_options     TEXT,           -- JSON: per-platform fields
  platform_draft_id    TEXT,           -- if pushed to LinkedIn drafts etc.
  scheduled_for        TEXT,           -- ISO timestamp, NULL unless scheduled
  scheduled_tz         TEXT,           -- e.g. 'Asia/Kolkata'
  created_by           INTEGER NOT NULL REFERENCES users(id),
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now')),
  archived_at          TEXT
);

CREATE INDEX idx_drafts_project_status ON drafts(project_id, status);
CREATE INDEX idx_drafts_scheduled ON drafts(status, scheduled_for) WHERE status = 'scheduled';
```

- `platform_options` examples:
  - Reddit: `{ "subreddit": "sideproject", "flair_id": "...", "is_self_post": true }`
  - LinkedIn: `{ "visibility": "PUBLIC", "audience": "MEMBER" }`
  - Instagram: `{ "post_type": "image" | "reel" | "carousel", "caption_hashtags": [...] }`
- `account_id` nullable so user can sketch a draft before deciding
  on the target account.

### `draft_media`

```sql
CREATE TABLE draft_media (
  draft_id INTEGER NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
  media_id INTEGER NOT NULL REFERENCES media(id),
  position INTEGER NOT NULL DEFAULT 0,    -- ordering for carousels
  caption  TEXT,                          -- per-media caption (IG carousel)
  PRIMARY KEY (draft_id, media_id)
);
```

### `media`

```sql
CREATE TABLE media (
  id            INTEGER PRIMARY KEY,
  project_id    INTEGER NOT NULL REFERENCES projects(id),
  r2_key        TEXT NOT NULL UNIQUE,     -- e.g. projects/12/abc123.gif
  filename      TEXT NOT NULL,            -- original filename (display only)
  mime          TEXT NOT NULL,
  bytes         INTEGER NOT NULL,
  width         INTEGER,
  height        INTEGER,
  duration_ms   INTEGER,                  -- for video/gif
  uploaded_by   INTEGER REFERENCES users(id),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at    TEXT
);

CREATE INDEX idx_media_project ON media(project_id);
```

- Soft delete: `deleted_at` set; R2 object purged by a daily cron.
- Width/height/duration extracted server-side after upload.

### `publishes`

```sql
CREATE TABLE publishes (
  id                 INTEGER PRIMARY KEY,
  draft_id           INTEGER NOT NULL REFERENCES drafts(id),
  account_id         INTEGER NOT NULL REFERENCES accounts(id),
  platform_post_id   TEXT,                 -- id returned by platform API
  platform_url       TEXT,                 -- shareable URL
  attempted_at       TEXT NOT NULL DEFAULT (datetime('now')),
  succeeded_at       TEXT,
  error_message      TEXT,
  retry_count        INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_publishes_draft ON publishes(draft_id);
```

- One row per publish attempt. The latest success row tells us where
  it lives; failures stay for forensic / retry logic.

### `audit_log`

```sql
CREATE TABLE audit_log (
  id          INTEGER PRIMARY KEY,
  actor_id    INTEGER REFERENCES users(id),
  project_id  INTEGER REFERENCES projects(id),
  action      TEXT NOT NULL,        -- 'draft.create','draft.update','draft.publish',etc
  target_type TEXT NOT NULL,        -- 'draft','account','media','project'
  target_id   INTEGER,
  payload     TEXT,                 -- JSON snapshot of the change
  at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_audit_project ON audit_log(project_id, at);
```

Every mutation writes a row. Cheap insurance, auditable, easy to
replay if a draft gets corrupted.

## ER summary

```
users ─< project_members >─ projects ─< accounts
                                │
                                └─< drafts >─ accounts
                                       │
                                       └─< draft_media >─ media
                                       │
                                       └─< publishes
projects ─< media
projects ─< audit_log
users    ─< audit_log
```

## Sizing / capacity

For 5 projects × ~20 drafts/month × 12 months = 1,200 drafts/year.
Even with 10× growth this is comfortably inside D1 free tier limits
(5 GB storage, 25M reads/day on paid plan).

R2: average 1 MB/media × 5 media/draft × 1,200 drafts = 6 GB/year.
First 10 GB free; thereafter $0.015/GB/month.

## Crypto / token-at-rest encryption

OAuth tokens are sensitive. We do NOT store them in plaintext.

- Use AES-GCM via the Web Crypto API (built into Workers).
- Master key: stored as a Worker secret (`SMM_TOKEN_KEY`) — 256-bit
  key generated once, set via `wrangler secret put`.
- Encrypted blob format: `<12-byte IV>:<ciphertext+16-byte tag>`,
  base64-encoded, stored in `accounts.access_token` /
  `accounts.refresh_token`.
- On read: decrypt just-in-time inside the Worker. Never log.

## Migration discipline

- Every schema change is an additive migration file.
- No `DROP COLUMN` (D1 supports it but locally only via rebuild —
  rename + leave column instead).
- File name: `00<n>_<short-description>.sql`, applied in order.
- `db:apply:remote` script runs them sequentially.
