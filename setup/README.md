# setup/ — external integration recipes

Each file is a one-shot recipe for setting up an external service so
the Worker can talk to it. Order doesn't matter; do them as you need
each platform.

## Per-platform OAuth apps

| Platform | File | Approval pain | Free posts/mo |
|---|---|---|---|
| Reddit | [reddit.md](reddit.md) | None — instant | unlimited |
| LinkedIn | [linkedin.md](linkedin.md) | Light — instant for personal scopes | unlimited |
| Twitter / X | [twitter.md](twitter.md) | None | 1,500 (free tier) |
| Instagram | [instagram.md](instagram.md) | **Heavy — 1–4 wk Meta review + Business account** | 750 / IG account |
| Product Hunt | [producthunt.md](producthunt.md) | None for OAuth; partner approval needed for programmatic launch submission | n/a |

## Notifications + ops

| Service | File | Required for |
|---|---|---|
| Telegram bot | [telegram.md](telegram.md) | Phase-2 publish notifications + `/cancel`/`/retry` commands |

## How each recipe is structured

Every recipe follows the same shape:

1. **Why we need it** — what unlocks once it's done.
2. **Pre-reqs** — accounts you need to have first.
3. **Step-by-step** — exact clicks + URLs.
4. **What to copy where** — the env keys to update in `../what_i_need.md`.
5. **Verify** — a one-liner curl or app action that proves it works.
6. **Gotchas** — anything that bit us.

After running a recipe, the next step is always the same:

```sh
cd api
wrangler secret put <KEY_NAME>   # paste the value when prompted
wrangler deploy                  # picks up the new secret
```

## Suggested order

If you're starting from scratch and want maximum impact for minimum
setup time:

1. **Reddit** — instant approval, biggest value for paper-games.
2. **Telegram** — gets your phone notified the moment a publish lands.
3. **LinkedIn** — also instant for personal scopes; the only platform
   where we can push native drafts.
4. **Twitter** — instant approval, slightly more setup (PKCE +
   parallel OAuth1.0a flow for media).
5. **Product Hunt** — instant OAuth, but actual launch submission
   stays manual until partner approval.
6. **Instagram / Meta** — start the app review NOW because it takes
   1–4 weeks of back-and-forth.
