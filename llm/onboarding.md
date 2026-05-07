# onboarding.md — adding a new user

The app uses **passkey auth** (WebAuthn) with a **static email allowlist**.
There is no self-signup, no invite flow, no admin UI. To onboard someone
you edit a var, redeploy, and tell them to visit `/login`.

## 1. Add the email to the allowlist

Edit `api/wrangler.local.toml`. The relevant line:

```toml
[vars]
WEBAUTHN_ALLOWED_EMAILS = "sangeet.verma91@gmail.com,tech@neuera.care,saurav@neuera.care"
```

Append the new email comma-separated. The match is case-insensitive
(both sides lowercased before comparison). Wildcard `"*"` allows any
email and effectively turns the app into open-signup — don't ship that.

## 2. Redeploy the Worker

`[vars]` are baked at deploy time, so a redeploy is required:

```bash
cd api
export CLOUDFLARE_API_TOKEN=...   # from what_i_need.md
export CLOUDFLARE_ACCOUNT_ID=...
bun x wrangler deploy -c wrangler.local.toml
```

Takes ~15 s. No DB migration, no secret change.

## 3. Tell the user what to do

> Go to <https://smm.table.pw/login>. Type your email, click
> **email me a code**, paste the 6-digit code from `auth@table.pw`,
> then add a passkey when prompted.

They'll receive an OTP from `auth@table.pw` (Resend, verified domain).
After OTP success the UI prompts to register a passkey on the device.
Subsequent logins use the passkey directly — no email needed.

## What gets created

- One row in `users` (id = UUIDv7, email = lowercased).
- One row in `user_credentials` per registered device. Multiple devices
  per user are fine — register a passkey on each. `transports` records
  whether it's a platform passkey (`internal`), a security key (`usb`/`nfc`/`ble`),
  or cross-device via QR (`hybrid`).

## Removing access

Two ways. Pick by urgency:

- **Soft remove (next sign-in).** Drop the email from
  `WEBAUTHN_ALLOWED_EMAILS` and redeploy. Their existing session cookie
  still works for up to `SESSION_TTL_SECONDS` (default 7 days), but they
  cannot start a new session.
- **Instant kill (all users).** Rotate `SESSION_SIGNING_KEY`. Every
  session worldwide becomes invalid:

  ```bash
  openssl rand -base64 32 | tr -d '\n' | \
    bun x wrangler secret put SESSION_SIGNING_KEY -c wrangler.local.toml
  cd api && bun x wrangler deploy -c wrangler.local.toml
  ```

  Heavy-handed (kicks out everyone), but instantaneous.
- **Per-user revoke (single device).** Mark `user_credentials.revoked_at`:

  ```sql
  UPDATE user_credentials SET revoked_at = datetime('now')
  WHERE user_id = (SELECT id FROM users WHERE email = '<email>');
  ```

  The session cookie still works until expiry; only future passkey logins
  are blocked.

## Visibility (separate from auth)

Passing the allowlist gets someone *into* the app. What they can *see*
inside it is governed separately:

- **Channels (accounts)** — visible only if their email is in
  `owner_emails` for an owner that's in `account_owners` for that channel.
- **Projects** — visible if they're in `project_members` for that project.

Onboarding a teammate to neura-care, for example, means: (1) allowlist
their email here, then (2) add their email to the **Founders** owner via
the `/p/neura-care/owners` page so they can see neura-care's channels.

## Why no invite flow

Decision recorded 2026-05-08. The team is tiny (~3 emails), and an
invite flow adds: an `invitations` table, a token-based magic-link
route, an email template, an admin UI to send invites, revoke logic.
None of that earns its keep yet. Revisit when the user count crosses
~10 or when a non-technical person needs to onboard others without
running `wrangler deploy`.
