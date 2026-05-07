# setup/telegram.md

Telegram bot for Phase-2 publish notifications + remote control
(`/list`, `/cancel`, `/retry`).

## Why we need it

The bot is the **man-in-the-middle** between the publishing system
and you. When something happens (draft scheduled, 30s pre-publish,
publish success / failure), the bot pings you. When *you* want to do
something (cancel, retry, list scheduled), you type a command into
the bot and it does it server-side.

Without it, you only see publish results in the web UI. With it, you
manage everything from your phone.

## Pre-reqs

- Telegram account.
- The account is open in a browser tab (for `BotFather` chat) and
  on your phone (to receive messages).

## Steps

### 1. Create the bot via BotFather

1. In Telegram, open a chat with [@BotFather](https://t.me/BotFather).
2. Send `/newbot`.
3. **Bot name:** anything you want. Shown above the chat. e.g.
   `SMM ops`.
4. **Username:** must end in `bot`. Globally unique. e.g.
   `smm_table_pw_bot` (replace if taken).
5. BotFather replies with a token like
   `1234567890:AAExSomeLongRandomStringHere`. Save it.

<!--Done! Congratulations on your new bot. You will find it at t.me/smm_table_pw_bot. You can now add a description, about section and profile picture for your bot, see /help for a list of commands. By the way, when you've finished creating your cool bot, ping our Bot Support if you want a better username for it. Just make sure the bot is fully operational before you do this.

Use this token to access the HTTP API:

Keep your token secure and store it safely, it can be used by anyone to control your bot.

For a description of the Bot API, see this page: https://core.telegram.org/bots/api-->

### 2. Get your Telegram chat ID

The bot only obeys commands from chat IDs you've allowlisted.

1. Open a chat with your new bot. Send any message (e.g. `/start`).
   It won't reply yet (we haven't deployed the webhook), but Telegram
   has now logged the chat.
2. Visit `https://api.telegram.org/bot<TOKEN>/getUpdates` (paste the
   bot token in place of `<TOKEN>`).
3. In the JSON response, find `result[].message.chat.id`. That's
   your chat ID (a long number; can be negative for groups).

### 3. Pick a webhook secret

A long random string used in the webhook URL path. Telegram doesn't
sign webhooks, so we authenticate inbound webhooks by matching a
secret in the path.

```sh
openssl rand -hex 32
```

## Update what_i_need.md

```env
TELEGRAM_BOT_TOKEN=<token from BotFather>
TELEGRAM_WEBHOOK_SECRET=<the openssl-rand value>
TELEGRAM_ALLOWED_CHAT_IDS=<your chat id; comma-separated for multiple>
```

## Push to Worker secrets

```sh
cd api
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_WEBHOOK_SECRET
wrangler secret put TELEGRAM_ALLOWED_CHAT_IDS
wrangler deploy
```

### 4. Register the webhook with Telegram

Once the worker has the secrets, tell Telegram where to deliver
inbound messages:

```sh
TOKEN=<bot token>
SECRET=<your webhook secret>
curl -F "url=https://smm.table.pw/api/telegram/${SECRET}" \
     "https://api.telegram.org/bot${TOKEN}/setWebhook"
```

Expected response: `{"ok":true,"result":true,"description":"Webhook was set"}`.

## Verify

1. In Telegram, send your bot `/start`. It should reply with the
   help text (list of commands).
2. Send `/whoami`. It should echo your chat id.
3. Send `/list`. It should show next 10 scheduled drafts (or "No
   scheduled posts.").
4. Schedule a draft via SMM web UI for 1 minute from now → the bot
   should ping you on success/failure.

## Gotchas

- **Webhook URL is exact-match.** If you change
  `TELEGRAM_WEBHOOK_SECRET`, you must re-register the webhook (step
  4) — Telegram caches the URL.
- **Allowlist is mandatory.** If `TELEGRAM_ALLOWED_CHAT_IDS` is
  empty, the bot refuses every command and replies with the
  caller's chat id (handy for finding it). Don't deploy without
  filling this in.
- **One bot can serve multiple humans.** Add their chat ids
  comma-separated to `TELEGRAM_ALLOWED_CHAT_IDS`. The bot doesn't
  distinguish between team members today — every command runs
  with full project access. Future improvement: tie chat id ↔
  user row.
- **Revoke a compromised bot:** message BotFather → `/revoke` →
  pick the bot → it issues a new token. Update Worker secret +
  re-register webhook.
- **No outbound rate limit issues at our scale.** Telegram allows
  ~30 messages/sec per bot. We send a handful per day.
- **Long messages get chunked by Telegram at 4096 chars.** Our
  notification formatter trims errors to 500 chars, fine.
- **Don't expose the webhook URL anywhere public.** It's
  effectively the bot's password. If leaked: rotate both
  `TELEGRAM_WEBHOOK_SECRET` *and* the BotFather token.
