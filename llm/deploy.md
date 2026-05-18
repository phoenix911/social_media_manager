# deploy.md — how to ship

Single Worker deploys both API and web. `web/dist` is bundled as
the Worker's `[assets]` (see `api/wrangler.toml` / `wrangler.local.toml`).
**There is no separate web deploy** — Pages is no longer used, and
`web/wrangler.toml` was deleted.

## TL;DR

```sh
make deploy
```

Reads `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` from
`what_i_need.md`, builds `web/dist`, then runs
`wrangler deploy -c wrangler.local.toml` from `api/`.

## Manual deploy (api + web)

```sh
# 0. auth — wrangler must talk to the appstudios.co[table.pw] account
#    (NOT measures.fit / Sangeet). The scoped API token lives in the
#    gitignored ../what_i_need.md as CLOUDFLARE_API_TOKEN. Export it
#    instead of `wrangler login` so deploys are non-interactive and
#    target the right account:
export CLOUDFLARE_API_TOKEN=$(grep '^CLOUDFLARE_API_TOKEN=' ../what_i_need.md | cut -d= -f2)
export CLOUDFLARE_ACCOUNT_ID=7985cc182a46036d07878d908c688cfe

# 1. build the SPA so wrangler can pick up web/dist as ASSETS
bun --filter ./web build

# 2. deploy the Worker against the live account
cd api && bun x wrangler deploy -c wrangler.local.toml
```

If you see `account_id ... does not match any of your authenticated
accounts`, the token isn't loaded — re-run the export. `wrangler login`
will land you on the wrong account (measures.fit / Sangeet).

`wrangler.local.toml` is gitignored and carries the real `account_id`,
D1/KV ids, and `smm.table.pw` route. The committed `wrangler.toml` is
a public template with `example.com` placeholders — do **not** deploy
with it.

## Why the package scripts don't work

- `web/package.json` has no `deploy` script (Pages was removed).
- `api/package.json`'s `deploy` runs `wrangler deploy` against the
  public-template `wrangler.toml`, which has empty resource ids.
- The `Makefile` `deploy-web` / `deploy-api` targets are stale for
  the same reasons. Use the two commands above instead.

## Verifying

After deploy, hit:

- `https://smm.table.pw/` — SPA loads from ASSETS.
- `https://smm.table.pw/api/healthz` (or any known route) — Worker.
- `wrangler tail -c wrangler.local.toml` — live logs.

## Other deploy actions

| Task | Command |
| --- | --- |
| Apply D1 migrations | `bun --filter ./api db:apply:remote` |
| Rotate token key | `cd api && openssl rand -hex 32 \| bun x wrangler secret put SMM_TOKEN_KEY -c wrangler.local.toml` |
| Add allowed passkey email | edit `[vars] WEBAUTHN_ALLOWED_EMAILS` in `wrangler.local.toml` and redeploy |

See `../DEPLOY_STATE.md` for live infra ids.
