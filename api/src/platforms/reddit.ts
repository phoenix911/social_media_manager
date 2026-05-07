// Reddit OAuth + publisher.
// See plan/platforms/reddit.md.

import type { PlatformAdapter, PublishInput, PublishResult } from "./types.ts";
import { redirectUri } from "./types.ts";
import type { Env } from "../env.ts";
import { HttpError } from "../lib/errors.ts";

const REDDIT_AUTHORIZE = "https://www.reddit.com/api/v1/authorize";
const REDDIT_TOKEN = "https://www.reddit.com/api/v1/access_token";
const REDDIT_API = "https://oauth.reddit.com";

const SCOPES = "identity submit edit history";

const ua = (env: Env) =>
  env.REDDIT_USER_AGENT || `web:smm:0.1 (by /u/${env.REDDIT_USERNAME_FOR_UA || "unknown"})`;

const basicAuth = (env: Env): string =>
  "Basic " + btoa(`${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`);

const reddit: PlatformAdapter = {
  platform: "reddit",

  isConfigured: (env) => Boolean(env.REDDIT_CLIENT_ID && env.REDDIT_CLIENT_SECRET),

  startOauth: (env, nonce) => {
    const url = new URL(REDDIT_AUTHORIZE);
    url.searchParams.set("client_id", env.REDDIT_CLIENT_ID!);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", nonce);
    url.searchParams.set("redirect_uri", redirectUri(env, "reddit"));
    url.searchParams.set("duration", "permanent");
    url.searchParams.set("scope", SCOPES);
    return { authorizeUrl: url.toString(), nonce };
  },

  async exchangeCode(env, code) {
    const r = await fetch(REDDIT_TOKEN, {
      method: "POST",
      headers: {
        Authorization: basicAuth(env),
        "User-Agent": ua(env),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri(env, "reddit"),
      }),
    });
    if (!r.ok) throw new HttpError(502, "oauth_exchange_failed", `reddit token exchange ${r.status}`);
    const t = (await r.json()) as { access_token: string; refresh_token: string; expires_in: number; scope: string };
    const meRes = await fetch(REDDIT_API + "/api/v1/me", {
      headers: { Authorization: `bearer ${t.access_token}`, "User-Agent": ua(env) },
    });
    if (!meRes.ok) throw new HttpError(502, "oauth_me_failed", `reddit /me ${meRes.status}`);
    const me = (await meRes.json()) as { id: string; name: string };
    return {
      accessToken: t.access_token,
      refreshToken: t.refresh_token,
      expiresAt: new Date(Date.now() + t.expires_in * 1000).toISOString(),
      scopes: t.scope,
      externalId: me.id,
      handle: me.name,
      meta: null,
    };
  },

  async refresh(env, refreshToken) {
    const r = await fetch(REDDIT_TOKEN, {
      method: "POST",
      headers: {
        Authorization: basicAuth(env),
        "User-Agent": ua(env),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
    });
    if (!r.ok) throw new HttpError(502, "oauth_refresh_failed", `reddit refresh ${r.status}`);
    const t = (await r.json()) as { access_token: string; expires_in: number };
    return {
      accessToken: t.access_token,
      refreshToken,
      expiresAt: new Date(Date.now() + t.expires_in * 1000).toISOString(),
    };
  },

  async publish(env, input): Promise<PublishResult> {
    const opts = (input.draft.platformOptions ?? {}) as {
      subreddit?: string;
      postKind?: "self" | "link" | "image" | "comment";
      flairId?: string | null;
      commentTarget?: { threadResolver?: string; threadPattern?: string; fallbackThreadId?: string | null };
    };
    if (!opts.subreddit && opts.postKind !== "comment") {
      throw new HttpError(400, "missing_subreddit", "reddit: platformOptions.subreddit required");
    }
    const headers = {
      Authorization: `bearer ${input.account.accessToken}`,
      "User-Agent": ua(env),
      "Content-Type": "application/x-www-form-urlencoded",
    };

    if (opts.postKind === "comment") {
      const threadId = await resolveWeeklyThread(env, input.account.accessToken, opts.commentTarget, opts.subreddit);
      const r = await fetch(REDDIT_API + "/api/comment", {
        method: "POST",
        headers,
        body: new URLSearchParams({
          api_type: "json",
          thing_id: `t3_${threadId}`,
          text: input.draft.body,
        }),
      });
      const j = (await r.json()) as { json?: { data?: { things?: Array<{ data: { id: string; permalink: string } }> }; errors?: unknown[] } };
      const comment = j?.json?.data?.things?.[0]?.data;
      if (!comment) throw new HttpError(502, "publish_failed", `reddit comment failed: ${JSON.stringify(j?.json?.errors ?? j)}`);
      return {
        platformPostId: `t1_${comment.id}`,
        platformUrl: `https://www.reddit.com${comment.permalink}`,
      };
    }

    // Self / link post
    const body = new URLSearchParams({
      sr: opts.subreddit!,
      title: input.draft.title ?? "",
      kind: opts.postKind ?? "self",
      text: input.draft.body,
      ...(opts.flairId ? { flair_id: opts.flairId } : {}),
    });
    const r = await fetch(REDDIT_API + "/api/submit", { method: "POST", headers, body });
    const j = (await r.json()) as { json?: { data?: { url?: string; id?: string }; errors?: unknown[] } };
    const data = j?.json?.data;
    if (!data?.url) throw new HttpError(502, "publish_failed", `reddit submit failed: ${JSON.stringify(j?.json?.errors ?? j)}`);
    return {
      platformPostId: `t3_${data.id}`,
      platformUrl: data.url,
    };
  },
};

async function resolveWeeklyThread(
  env: Env,
  accessToken: string,
  target: { threadResolver?: string; threadPattern?: string; fallbackThreadId?: string | null } | undefined,
  subreddit: string | undefined,
): Promise<string> {
  if (!subreddit) throw new HttpError(400, "missing_subreddit", "weekly-thread comment requires subreddit");
  const re = target?.threadPattern ? new RegExp(target.threadPattern) : null;
  const headers = { Authorization: `bearer ${accessToken}`, "User-Agent": ua(env) };
  for (const num of [1, 2]) {
    const r = await fetch(`${REDDIT_API}/r/${subreddit}/about/sticky/${num}`, { headers });
    if (!r.ok) continue;
    const j = (await r.json()) as { data?: { children?: Array<{ data: { id: string; title: string } }> } };
    const post = j?.data?.children?.[0]?.data;
    if (!post) continue;
    if (!re || re.test(post.title)) return post.id;
  }
  if (target?.fallbackThreadId) return target.fallbackThreadId;
  throw new HttpError(502, "thread_not_found", `no matching weekly thread in r/${subreddit}`);
}

export default reddit;
