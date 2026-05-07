// Instagram (Graph API via Instagram Login) OAuth + publisher.
// See plan/platforms/instagram.md.
//
// The publish path requires public HTTPS URLs for media — we mint
// short-lived signed R2 URLs via the lib/r2.ts helper.

import type { PlatformAdapter, PublishInput, PublishResult } from "./types.ts";
import { redirectUri } from "./types.ts";
import type { Env } from "../env.ts";
import { HttpError } from "../lib/errors.ts";

const AUTHORIZE = "https://api.instagram.com/oauth/authorize";
const TOKEN_SHORT = "https://api.instagram.com/oauth/access_token";
const GRAPH = "https://graph.instagram.com";
const SCOPES = "instagram_business_basic,instagram_business_content_publish";

const instagram: PlatformAdapter = {
  platform: "instagram",

  isConfigured: (env) => Boolean(env.META_APP_ID && env.META_APP_SECRET),

  startOauth: (env, nonce) => {
    const url = new URL(AUTHORIZE);
    url.searchParams.set("client_id", env.META_APP_ID!);
    url.searchParams.set("redirect_uri", redirectUri(env, "instagram"));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", SCOPES);
    url.searchParams.set("state", nonce);
    return { authorizeUrl: url.toString(), nonce };
  },

  async exchangeCode(env, code) {
    // Step 1: short-lived token.
    const r = await fetch(TOKEN_SHORT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.META_APP_ID!,
        client_secret: env.META_APP_SECRET!,
        grant_type: "authorization_code",
        redirect_uri: redirectUri(env, "instagram"),
        code,
      }),
    });
    if (!r.ok) throw new HttpError(502, "oauth_exchange_failed", `ig short token ${r.status}`);
    const sh = (await r.json()) as { access_token: string; user_id: string };

    // Step 2: exchange for long-lived token (60 days).
    const longUrl = new URL(GRAPH + "/access_token");
    longUrl.searchParams.set("grant_type", "ig_exchange_token");
    longUrl.searchParams.set("client_secret", env.META_APP_SECRET!);
    longUrl.searchParams.set("access_token", sh.access_token);
    const longRes = await fetch(longUrl.toString());
    if (!longRes.ok) throw new HttpError(502, "oauth_exchange_failed", `ig long token ${longRes.status}`);
    const long = (await longRes.json()) as { access_token: string; expires_in: number };

    // Step 3: /me to confirm account_type and capture username.
    const meUrl = new URL(GRAPH + "/me");
    meUrl.searchParams.set("fields", "id,username,account_type");
    meUrl.searchParams.set("access_token", long.access_token);
    const meRes = await fetch(meUrl.toString());
    if (!meRes.ok) throw new HttpError(502, "oauth_me_failed", `ig /me ${meRes.status}`);
    const me = (await meRes.json()) as { id: string; username: string; account_type: string };
    if (me.account_type !== "BUSINESS" && me.account_type !== "CREATOR") {
      throw new HttpError(400, "ig_account_type", `IG account must be Business or Creator (got ${me.account_type})`);
    }

    return {
      accessToken: long.access_token,
      refreshToken: null, // IG uses long-lived re-exchange instead
      expiresAt: new Date(Date.now() + long.expires_in * 1000).toISOString(),
      scopes: SCOPES,
      externalId: me.id,
      handle: `@${me.username}`,
      meta: { igUserId: me.id, accountType: me.account_type },
    };
  },

  async refresh(_env, refreshToken) {
    // IG: refresh by re-exchanging the long-lived token (no separate
    // refresh token concept). Caller passes the current access token
    // as `refreshToken` for compat with the adapter shape — we treat
    // it as an opportunistic helper.
    const url = new URL(GRAPH + "/refresh_access_token");
    url.searchParams.set("grant_type", "ig_refresh_token");
    url.searchParams.set("access_token", refreshToken);
    const r = await fetch(url.toString());
    if (!r.ok) throw new HttpError(502, "oauth_refresh_failed", `ig refresh ${r.status}`);
    const t = (await r.json()) as { access_token: string; expires_in: number };
    return {
      accessToken: t.access_token,
      refreshToken: t.access_token, // store the new long-lived as the "refresh"
      expiresAt: new Date(Date.now() + t.expires_in * 1000).toISOString(),
    };
  },

  async publish(_env, _input): Promise<PublishResult> {
    // TODO: container + publish flow. Requires public URLs for media —
    // implement once R2 signed-URL helper lands. For now, emit a clear
    // not-implemented to avoid silent half-publishes.
    throw new HttpError(501, "ig_publish_not_implemented", "instagram publish path is stubbed; needs R2 public URL helper");
  },
};

export default instagram;
