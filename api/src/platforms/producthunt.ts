// Product Hunt adapter.
//
// PH has OAuth 2.0 + a GraphQL API. Programmatic *launch submission*
// is gated behind partner approval, so by default we treat PH as a
// "draft + copy-paste" platform — same as how Reddit native drafts
// don't exist. The OAuth flow + `viewer { user { id, username } }`
// query work today; the publish path is intentionally 501 until we
// either have partner approval OR add a "post comment to existing
// launch" flow.

import type { PlatformAdapter, PublishResult } from "./types.ts";
import { redirectUri } from "./types.ts";
import type { Env } from "../env.ts";
import { HttpError } from "../lib/errors.ts";

const AUTHORIZE = "https://api.producthunt.com/v2/oauth/authorize";
const TOKEN = "https://api.producthunt.com/v2/oauth/token";
const GQL = "https://api.producthunt.com/v2/api/graphql";

const SCOPES = "public private";

const producthunt: PlatformAdapter = {
  platform: "producthunt",

  isConfigured: (env) => Boolean(env.PRODUCTHUNT_CLIENT_ID && env.PRODUCTHUNT_CLIENT_SECRET),

  startOauth: (env, nonce) => {
    const url = new URL(AUTHORIZE);
    url.searchParams.set("client_id", env.PRODUCTHUNT_CLIENT_ID!);
    url.searchParams.set("redirect_uri", redirectUri(env, "producthunt"));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", SCOPES);
    url.searchParams.set("state", nonce);
    return { authorizeUrl: url.toString(), nonce };
  },

  async exchangeCode(env, code) {
    const r = await fetch(TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: env.PRODUCTHUNT_CLIENT_ID,
        client_secret: env.PRODUCTHUNT_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri(env, "producthunt"),
        grant_type: "authorization_code",
      }),
    });
    if (!r.ok) throw new HttpError(502, "oauth_exchange_failed", `producthunt token ${r.status}`);
    const t = (await r.json()) as { access_token: string; expires_in?: number; scope?: string };

    // GraphQL viewer query for username + id
    const meRes = await fetch(GQL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t.access_token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query: "{ viewer { user { id username name } } }" }),
    });
    if (!meRes.ok) throw new HttpError(502, "oauth_me_failed", `producthunt viewer ${meRes.status}`);
    const me = (await meRes.json()) as { data?: { viewer?: { user?: { id: string; username: string; name: string } } } };
    const u = me.data?.viewer?.user;
    if (!u) throw new HttpError(502, "oauth_me_failed", "producthunt viewer missing user");
    return {
      accessToken: t.access_token,
      refreshToken: null, // PH issues long-lived tokens; no refresh flow exposed
      expiresAt: t.expires_in ? new Date(Date.now() + t.expires_in * 1000).toISOString() : null,
      scopes: t.scope ?? SCOPES,
      externalId: u.id,
      handle: `@${u.username}`,
      meta: { displayName: u.name },
    };
  },

  async publish(_env, _input): Promise<PublishResult> {
    // Programmatic posting requires PH partner approval. Until we
    // have that, the user copies the draft body into the PH UI
    // (first-comment box on a launch, or the launch description).
    throw new HttpError(
      501,
      "producthunt_publish_manual",
      "Product Hunt publishing is manual — copy the draft body and paste into PH",
    );
  },
};

export default producthunt;
