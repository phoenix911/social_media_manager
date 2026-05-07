# @smm/web

React + Vite frontend, deployed to Cloudflare Pages at
`smm.table.pw`.

## Stack

- React 18 + TypeScript + Vite 5
- Tailwind CSS v4 (`@tailwindcss/vite`)
- shadcn/ui conventions (`components/ui/*` is owned by us; add more
  via `bunx shadcn@latest add <component>`)
- React Router v7
- SWR for server state
- Zustand for client-only persisted state (currently just
  "current project")

## Layout

```
src/
├── main.tsx              router + SWR config
├── App.tsx               layout shell (header, outlet)
├── index.css             tailwind + theme tokens
├── lib/
│   ├── api.ts            fetch wrapper, dev-mode headers, ApiCallError
│   └── utils.ts          cn() classnames helper
├── store/
│   └── projectStore.ts   persisted "current project slug"
├── components/ui/        shadcn-style primitives (button, input, textarea, …)
└── pages/
    ├── Home.tsx          project picker + create
    ├── ProjectDashboard  list of drafts in a project
    ├── DraftEditor       new + edit draft
    └── Accounts          per-project platform connections (oauth wiring TBD)
```

## Local dev

```sh
# in another terminal — start the API worker
cd ../api && bun run dev

# this app — vite proxies /api → :8787
bun run dev
```

When running locally, set your dev email so the API can mint a
user row for you:

```js
// in the browser console
localStorage.setItem("smm.devEmail", "you@example.com")
```

## Deploy

```sh
bun run build
bun run deploy           # → wrangler pages deploy dist --project-name=smm-web
```

Pages will be served from `https://smm-web.pages.dev` until we bind
a custom domain (`smm.table.pw`) in the dash.

## What's NOT in here yet

- Real per-platform draft preview (Reddit-/LinkedIn-/Twitter-/IG-flavor render)
- Media upload UI (the api endpoint is in place; the client component
  is next)
- OAuth connect buttons (api stubs return 501)
- Calendar / scheduling UI (Phase 2)
- Telegram link UI (Phase 2)
