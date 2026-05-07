// Twitter / X OAuth 2.0 (PKCE) + publisher.
// See plan/platforms/twitter.md.
//
// Note: media upload requires OAuth 1.0a (v1.1 endpoint). For now we
// publish text-only / threads. Media upload is a follow-up.

import type { PlatformAdapter, PublishInput, PublishResult } from "./types.ts";
import { redirectUri } from "./types.ts";
import type { Env } from "../env.ts";
import { HttpError } from "../lib/errors.ts";

const AUTHORIZE = "https://twitter.com/i/oauth2/authorize";
const TOKEN = "https://api.twitter.com/2/oauth2/token";
const API = "https://api.twitter.com/2";
const SCOPES = "tweet.read tweet.write users.read offline.access";

const b64url = (buf: ArrayBuffer): string => {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]!);
  return btoa(s).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
};

const sha256 = async (s: string): Promise<ArrayBuffer> =>
  crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));

const basicAuth = (env: Env): string =>
  "Basic " + btoa(`${env.TWITTER_OAUTH2_CLIENT_ID}:${env.TWITTER_OAUTH2_CLIENT_SECRET}`);

const twitter: PlatformAdapter = {
  platform: "twitter",

  isConfigured: (env) => Boolean(env.TWITTER_OAUTH2_CLIENT_ID && env.TWITTER_OAUTH2_CLIENT_SECRET),

  async startOauth(env, nonce) {
    // PKCE — generate verifier; store under nonce alongside the state.
    // Twitter's authorize URL needs the challenge.
    const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)).buffer);
    const challenge = b64url(await sha256(verifier));
    // Stash verifier so /callback can read it on token exchange.
    await env.KV.put(`twitter:pkce:${nonce}`, verifier, { expirationTtl: 600 });
    const url = new URL(AUTHORIZE);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", env.TWITTER_OAUTH2_CLIENT_ID!);
    url.searchParams.set("redirect_uri", redirectUri(env, "twitter"));
    url.searchParams.set("scope", SCOPES);
    url.searchParams.set("state", nonce);
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
    return { authorizeUrl: url.toString(), nonce };
  },

  async exchangeCode(env, code, nonce) {
    const verifier = await env.KV.get(`twitter:pkce:${nonce}`);
    if (!verifier) throw new HttpError(400, "oauth_state_invalid", "pkce verifier expired");
    await env.KV.delete(`twitter:pkce:${nonce}`);
    const r = await fetch(TOKEN, {
      method: "POST",
      headers: { Authorization: basicAuth(env), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri(env, "twitter"),
        code_verifier: verifier,
      }),
    });
    if (!r.ok) throw new HttpError(502, "oauth_exchange_failed", `twitter token ${r.status}`);
    const t = (await r.json()) as { access_token: string; refresh_token?: string; expires_in: number; scope: string };
    const meRes = await fetch(API + "/users/me", { headers: { Authorization: `Bearer ${t.access_token}` } });
    if (!meRes.ok) throw new HttpError(502, "oauth_me_failed", `twitter /users/me ${meRes.status}`);
    const me = (await meRes.json()) as { data: { id: string; username: string; name: string } };
    return {
      accessToken: t.access_token,
      refreshToken: t.refresh_token ?? null,
      expiresAt: new Date(Date.now() + t.expires_in * 1000).toISOString(),
      scopes: t.scope,
      externalId: me.data.id,
      handle: `@${me.data.username}`,
      meta: { displayName: me.data.name },
    };
  },

  async refresh(env, refreshToken) {
    const r = await fetch(TOKEN, {
      method: "POST",
      headers: { Authorization: basicAuth(env), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
    });
    if (!r.ok) throw new HttpError(502, "oauth_refresh_failed", `twitter refresh ${r.status}`);
    const t = (await r.json()) as { access_token: string; refresh_token?: string; expires_in: number };
    return {
      accessToken: t.access_token,
      refreshToken: t.refresh_token ?? refreshToken,
      expiresAt: new Date(Date.now() + t.expires_in * 1000).toISOString(),
    };
  },

  async publish(_env, input): Promise<PublishResult> {
    const opts = (input.draft.platformOptions ?? {}) as {
      postKind?: "tweet" | "thread";
      threadSegments?: Array<{ text: string }>;
    };
    const segments = opts.postKind === "thread" && opts.threadSegments?.length
      ? opts.threadSegments.map((s) => s.text)
      : [input.draft.body];

    let inReplyTo: string | undefined;
    let firstId = "";
    for (const text of segments) {
      const body: Record<string, unknown> = { text };
      if (inReplyTo) body.reply = { in_reply_to_tweet_id: inReplyTo };
      const r = await fetch(API + "/tweets", {
        method: "POST",
        headers: { Authorization: `Bearer ${input.account.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await r.json()) as { data?: { id: string }; errors?: unknown };
      if (!r.ok || !j.data) {
        throw new HttpError(502, "publish_failed", `twitter post ${r.status}: ${JSON.stringify(j.errors ?? j)}`);
      }
      if (!firstId) firstId = j.data.id;
      inReplyTo = j.data.id;
    }
    const handle = (input.account.handle || "").replace(/^@/, "");
    return {
      platformPostId: firstId,
      platformUrl: handle ? `https://twitter.com/${handle}/status/${firstId}` : `https://twitter.com/i/web/status/${firstId}`,
    };
  },
};

export default twitter;
