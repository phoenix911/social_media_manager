# Conventions

Patterns to follow when adding code here. These weren't written
arbitrarily — most exist because of a real bug or trade-off.

## TypeScript

- **Always use `.ts` extensions in import paths.** Workers + Bun
  both honour them; helps IDE jump-to-definition.
- **No default-anywhere.** Default exports are fine for route
  modules and platform adapters; everything else is named.
- **`strict` is non-negotiable.** `noUncheckedIndexedAccess` is on,
  so guard array accesses.
- **Avoid `any`.** Use `unknown` and narrow.

## Errors

- **Throw `HttpError` from `api/src/lib/errors.ts` for any 4xx/5xx
  surface.** Helpers: `Unauthorized()`, `Forbidden()`, `NotFound()`,
  `BadRequest(msg, details?)`, `Conflict(msg)`, `ServerError(msg)`.
- **Global handler in `api/src/index.ts`** converts to JSON
  `{ error: { code, message, details? } }`.
- **Never log tokens.** Don't `console.log(account)`. Treat the
  whole `accounts` row as sensitive.

## Auth

- **Every `/api/*` route requires a verified CF Access JWT.** The
  `requireUser` middleware in `api/src/middleware/auth.ts` runs
  before all routes except `/api/telegram/*` (uses path-secret).
- **Project authorization** uses `requireRole(env.DB, projectId,
  userId, 'editor' | 'viewer')`. Throws `NotFound` if the user
  isn't a member, `Forbidden` if their role is too low.
- **In dev (`wrangler dev`):** send `Cf-Access-Jwt-Assertion: dev`
  + `X-Dev-Email: you@example.com` headers to bypass CF Access. The
  web's `lib/api.ts` does this automatically based on
  `localStorage.smm.devEmail`.

## DB

- **Drizzle is the source of truth.** Don't write SQL ad-hoc.
- **`schema.ts` → `bun run db:generate` → SQL migration → review →
  `db:apply:remote`.** Never edit a generated migration file by
  hand once committed.
- **Use `eq()`, `and()`, `or()` from `drizzle-orm`** for predicates;
  do NOT use string interpolation.
- **`.returning().get()`** for inserts where you need the row back.
  D1 supports it.

## OAuth + tokens

- **Tokens are encrypted at rest** (`lib/crypto.ts`, AES-GCM).
- **Always go through `account-tokens.ts`:**
  - `insertAccount(env, …)` to write
  - `getDecryptedAccount(env, id)` to read (handles lazy-refresh)
  - `revokeAccount(env, id)` to disconnect
- **Never store a token in plaintext in the DB or in KV.**
- **Never send a token to the browser.** The web only ever sees
  account *metadata* (handle, scopes, expiresAt) — never the token.

## Adding a platform

1. Add to `Platform` enum in `shared/src/types.ts` + `PLATFORMS`
   tuple.
2. Add to `accounts.platform` CHECK constraint in a new Drizzle
   migration.
3. Add to per-platform option schemas in
   `shared/src/platforms/index.ts`.
4. Implement `PlatformAdapter` in `api/src/platforms/<name>.ts`:
   `isConfigured`, `startOauth`, `exchangeCode`, `refresh?`,
   `revoke?`, `publish`, `pushDraft?`.
5. Register in `api/src/platforms/index.ts`.
6. Add a connect tile in `web/src/pages/Accounts.tsx`.
7. Update the per-platform preview renderer in
   `web/src/lib/preview.ts`.

## Routing (Hono)

- **One route file per resource** in `api/src/routes/<name>.ts`.
- **Mounted in `api/src/index.ts`** with `app.route('/api/<name>',
  routerModule)`.
- **Validate body with zod** schemas from `@smm/shared`. If invalid:
  `throw BadRequest('msg', parsed.error.flatten())`.

## Frontend

- **Server state via SWR.** `useSWR<{ thing: Thing }>('/api/…')`.
  `mutate('/api/…')` after a write to revalidate.
- **Client state via Zustand persist.** Only for UI state that
  outlives a page (e.g. current project slug).
- **Forms are uncontrolled-ish** — local `useState` per field.
  No form library yet.
- **All API calls go through `lib/api.ts`** — wraps fetch, adds
  dev headers, throws `ApiCallError`.
- **Follow shadcn/ui conventions.** `cn(...)` for classnames.
  Variants via `cva`.

## Naming

- Files: kebab-case for libs (`account-tokens.ts`), camelCase for
  React components (`DraftEditor.tsx`).
- Tables (D1): snake_case (`project_members`, `audit_log`).
- TS types over the wire: camelCase (`projectId`, `accessToken`).
- The boundary translation lives in each route's `rowToX` helper.

## Comments

- **Default to none.** If a function name reads clearly, no
  comment needed.
- **When you do comment, explain WHY.** Not what — the code says
  that.
- **One short sentence at file top is fine** to set context.
- Don't reference the current task / PR / issue in comments —
  it'll rot.

## Testing

- **No test infra yet.** When we add it: prefer integration tests
  that hit `wrangler dev` over unit tests of route handlers in
  isolation. The Worker runtime quirks matter.
- **`api/src/lib/crypto.ts`** is a future unit-test target.
