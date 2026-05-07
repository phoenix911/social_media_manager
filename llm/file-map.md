# File map — where everything lives

```
social_media_manager/
├── README.md
├── CHECKLIST.md             ← phase-by-phase TODO. Authoritative.
├── DEPLOY_STATE.md          ← live infra IDs (D1 ID, KV ID, AUDs, …)
├── what_i_need.md           ← env-style: what user must paste in
├── scale.md                 ← cost ladder 100→100k posts/mo
├── package.json             ← bun workspaces root
├── tsconfig.base.json       ← shared TS config
├── Makefile                 ← dev / build / deploy targets
├── .gitignore
├── llm/                     ← (you are here) onboarding for future-me
│   ├── README.md
│   ├── pitch.md
│   ├── stack.md
│   ├── file-map.md          ← (this file)
│   ├── conventions.md
│   ├── gotchas.md
│   ├── glossary.md
│   └── now.md
├── plan/                    ← original design docs
│   ├── overview.md
│   ├── architecture.md
│   ├── data-model.md
│   ├── auth.md
│   ├── phase-1.md
│   ├── phase-2.md
│   ├── roadmap.md
│   └── platforms/
│       ├── README.md
│       ├── reddit.md
│       ├── linkedin.md
│       ├── twitter.md
│       └── instagram.md
├── shared/                  ← @smm/shared workspace
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts         ← barrel
│       ├── types.ts         ← User, Project, Account, Draft, Media, Publish, ApiError
│       ├── schemas.ts       ← zod schemas for API requests
│       └── platforms/
│           └── index.ts     ← per-platform option zod shapes
├── api/                     ← @smm/api workspace (Cloudflare Worker)
│   ├── package.json
│   ├── tsconfig.json
│   ├── wrangler.toml        ← bindings + routes + cron + queues
│   ├── drizzle.config.ts    ← drizzle-kit config
│   ├── README.md
│   ├── drizzle/
│   │   └── migrations/
│   │       ├── 0000_rich_penance.sql
│   │       └── meta/
│   └── src/
│       ├── index.ts         ← Hono app + cron handler + queue handler
│       ├── env.ts           ← Env binding shape
│       ├── db/
│       │   ├── schema.ts    ← Drizzle schema (source of truth)
│       │   └── index.ts     ← db() helper
│       ├── lib/
│       │   ├── access.ts    ← CF Access JWT verifier (jose, JWKS cache)
│       │   ├── crypto.ts    ← AES-GCM token encrypt / decrypt
│       │   ├── errors.ts    ← HttpError + helpers (Unauthorized, NotFound, etc.)
│       │   ├── projects.ts  ← role checks
│       │   └── account-tokens.ts ← insert + decrypt + lazy-refresh + revoke
│       ├── middleware/
│       │   └── auth.ts      ← requireUser middleware
│       ├── platforms/       ← OAuth + publisher per platform
│       │   ├── types.ts     ← PlatformAdapter interface
│       │   ├── index.ts     ← registry (getAdapter)
│       │   ├── reddit.ts
│       │   ├── linkedin.ts
│       │   ├── twitter.ts
│       │   └── instagram.ts
│       ├── routes/
│       │   ├── me.ts        ← GET /api/me
│       │   ├── projects.ts  ← projects CRUD
│       │   ├── drafts.ts    ← drafts CRUD
│       │   ├── accounts.ts  ← list + revoke
│       │   ├── oauth.ts     ← /start + /callback dispatcher
│       │   ├── media.ts     ← upload-url + R2 stream
│       │   ├── schedule.ts  ← schedule / cancel / publish-now
│       │   └── telegram.ts  ← webhook + commands
│       ├── scheduler/
│       │   ├── cron.ts      ← runScheduler (atomic claim + enqueue)
│       │   └── queue.ts     ← handlePublishBatch (consumer)
│       └── notifications/
│           ├── index.ts     ← notify(env, event, payload)
│           └── telegram.ts  ← sendTelegramMessage
└── web/                     ← @smm/web workspace (built into api/[assets])
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── components.json      ← shadcn/ui config
    ├── index.html
    ├── README.md
    └── src/
        ├── main.tsx         ← router + SWR config
        ├── App.tsx          ← layout shell
        ├── index.css        ← tailwind + theme tokens
        ├── lib/
        │   ├── api.ts       ← fetch wrapper, ApiCallError
        │   ├── utils.ts     ← cn() classnames helper
        │   └── preview.ts   ← per-platform draft preview rendering
        ├── store/
        │   └── projectStore.ts ← persisted "current project slug"
        ├── components/ui/   ← shadcn primitives (button, input, textarea, …)
        └── pages/
            ├── Home.tsx     ← project picker + create
            ├── ProjectDashboard.tsx
            ├── DraftEditor.tsx ← new + edit; account picker, scheduling
            ├── Accounts.tsx ← OAuth connect / disconnect
            └── Calendar.tsx ← scheduled posts grouped by day
```

## Quick "where would I edit X?"

| Want to … | Edit |
|---|---|
| Add a new platform | `shared/src/platforms/index.ts` (option schema), `api/src/platforms/<name>.ts`, register in `api/src/platforms/index.ts`, update `accounts.platform` CHECK in a migration |
| Add a new API route | `api/src/routes/<name>.ts`, mount in `api/src/index.ts` |
| Change DB schema | `api/src/db/schema.ts`, then `bun run db:generate` (in api/) |
| Add a UI component | `bunx shadcn@latest add <component>` from `web/` |
| Tweak Reddit publishing | `api/src/platforms/reddit.ts` |
| Change Telegram bot commands | `api/src/routes/telegram.ts` |
| Adjust scheduler logic | `api/src/scheduler/cron.ts` (claim) + `queue.ts` (publish) |
| Change auth model | `api/src/lib/access.ts` + `api/src/middleware/auth.ts` |
| Change deployed routes / triggers | `api/wrangler.toml` |
