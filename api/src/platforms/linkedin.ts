// LinkedIn OAuth + publisher.
// See plan/platforms/linkedin.md.

import type { PlatformAdapter, PublishInput, PublishResult } from "./types.ts";
import { redirectUri } from "./types.ts";
import type { Env } from "../env.ts";
import { HttpError } from "../lib/errors.ts";

const AUTHORIZE = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN = "https://www.linkedin.com/oauth/v2/accessToken";
const API = "https://api.linkedin.com";
const VERSION = "202405";
const SCOPES = "openid profile email w_member_social";

const linkedin: PlatformAdapter = {
  platform: "linkedin",

  isConfigured: (env) => Boolean(env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET),

  startOauth: (env, nonce) => {
    const url = new URL(AUTHORIZE);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", env.LINKEDIN_CLIENT_ID!);
    url.searchParams.set("redirect_uri", redirectUri(env, "linkedin"));
    url.searchParams.set("state", nonce);
    url.searchParams.set("scope", SCOPES);
    return { authorizeUrl: url.toString(), nonce };
  },

  async exchangeCode(env, code) {
    const r = await fetch(TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri(env, "linkedin"),
        client_id: env.LINKEDIN_CLIENT_ID!,
        client_secret: env.LINKEDIN_CLIENT_SECRET!,
      }),
    });
    if (!r.ok) throw new HttpError(502, "oauth_exchange_failed", `linkedin token ${r.status}`);
    const t = (await r.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
    };
    const meRes = await fetch(API + "/v2/userinfo", { headers: { Authorization: `Bearer ${t.access_token}` } });
    if (!meRes.ok) throw new HttpError(502, "oauth_me_failed", `linkedin /userinfo ${meRes.status}`);
    const me = (await meRes.json()) as { sub: string; name: string; email?: string };
    return {
      accessToken: t.access_token,
      refreshToken: t.refresh_token ?? null,
      expiresAt: new Date(Date.now() + t.expires_in * 1000).toISOString(),
      scopes: t.scope,
      externalId: me.sub,
      handle: me.name,
      meta: { authorUrn: `urn:li:person:${me.sub}`, email: me.email ?? null },
    };
  },

  async refresh(env, refreshToken) {
    const r = await fetch(TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: env.LINKEDIN_CLIENT_ID!,
        client_secret: env.LINKEDIN_CLIENT_SECRET!,
      }),
    });
    if (!r.ok) throw new HttpError(502, "oauth_refresh_failed", `linkedin refresh ${r.status}`);
    const t = (await r.json()) as { access_token: string; refresh_token?: string; expires_in: number };
    return {
      accessToken: t.access_token,
      refreshToken: t.refresh_token ?? refreshToken,
      expiresAt: new Date(Date.now() + t.expires_in * 1000).toISOString(),
    };
  },

  async publish(_env, input): Promise<PublishResult> {
    return doPost(input, "PUBLISHED");
  },

  async pushDraft(_env, input) {
    const res = await doPost(input, "DRAFT");
    return { platformDraftId: res.platformPostId };
  },
};

async function doPost(input: PublishInput, lifecycle: "PUBLISHED" | "DRAFT"): Promise<PublishResult> {
  const meta = (input.account.meta ?? {}) as { authorUrn?: string };
  const opts = (input.draft.platformOptions ?? {}) as {
    visibility?: "PUBLIC" | "CONNECTIONS";
    feedDistribution?: "MAIN_FEED" | "NONE";
    reshareDisabled?: boolean;
  };
  const author = meta.authorUrn || `urn:li:person:${input.account.externalId}`;
  const body = {
    author,
    commentary: input.draft.body,
    visibility: opts.visibility ?? "PUBLIC",
    distribution: {
      feedDistribution: opts.feedDistribution ?? "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: lifecycle,
    isReshareDisabledByAuthor: opts.reshareDisabled ?? false,
  };
  const r = await fetch(API + "/v2/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.account.accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!(r.status === 201 || r.status === 200)) {
    const text = await r.text();
    throw new HttpError(502, "publish_failed", `linkedin posts ${r.status}: ${text.slice(0, 300)}`);
  }
  const urn = r.headers.get("x-restli-id") || r.headers.get("X-RestLi-Id") || "";
  return {
    platformPostId: urn,
    platformUrl: urn ? `https://www.linkedin.com/feed/update/${encodeURIComponent(urn)}/` : "",
  };
}

export default linkedin;
