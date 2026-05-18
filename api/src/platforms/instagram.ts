// Instagram (Graph API via Instagram Login) OAuth + publisher.
// See plan/platforms/instagram.md.
//
// The publish path requires public HTTPS URLs for media — we mint
// short-lived HMAC-signed URLs via lib/media-signing.ts that point at
// /api/media/public/<id> on this Worker. No R2 access keys involved.

import type { PlatformAdapter, PublishInput, PublishResult } from "./types.ts";
import { redirectUri } from "./types.ts";
import type { Env } from "../env.ts";
import { HttpError } from "../lib/errors.ts";
import { signMediaUrl } from "../lib/media-signing.ts";

const AUTHORIZE = "https://api.instagram.com/oauth/authorize";
const TOKEN_SHORT = "https://api.instagram.com/oauth/access_token";
const GRAPH = "https://graph.instagram.com";
const GRAPH_VERSION = "v25.0";
const SCOPES = "instagram_business_basic,instagram_business_content_publish";

// Container status poll: how long to wait between checks, max checks.
// Images usually FINISH instantly; videos can take 30–120s.
const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 30;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

  async publish(env, input): Promise<PublishResult> {
    const igUserId = input.account.externalId;
    if (!igUserId) {
      throw new HttpError(400, "ig_missing_user_id", "account has no externalId (IG user id)");
    }
    const accessToken = input.account.accessToken;
    if (!accessToken) {
      throw new HttpError(400, "ig_missing_token", "account has no access_token");
    }

    const postKind = (input.draft.platformOptions?.postKind as string | undefined) ?? "image";
    const caption = input.draft.body || "";

    if (input.media.length === 0) {
      throw new HttpError(400, "ig_missing_media", "instagram requires at least one media item");
    }

    let creationId: string;
    if (postKind === "image") {
      if (input.media.length !== 1) {
        throw new HttpError(400, "ig_image_one_file", "image post requires exactly one media item");
      }
      const m = input.media[0]!;
      if (!m.mime.startsWith("image/")) {
        throw new HttpError(400, "ig_image_mime", `image post requires image/* mime, got ${m.mime}`);
      }
      const publicUrl = await signMediaUrl(env, m.id, 86400);
      creationId = await createContainer(igUserId, accessToken, {
        image_url: publicUrl,
        caption,
      });
    } else {
      // Reel + carousel branches land in a follow-up; image-only for v1.
      throw new HttpError(
        501,
        "ig_publish_kind_unsupported",
        `instagram publish for postKind="${postKind}" not implemented yet`,
      );
    }

    await pollContainerReady(creationId, accessToken);

    const platformPostId = await publishContainer(igUserId, creationId, accessToken);
    const handle = input.account.handle.replace(/^@/, "");
    return {
      platformPostId,
      platformUrl: `https://www.instagram.com/${handle}/p/${platformPostId}/`,
    };
  },
};

interface ContainerInput {
  image_url?: string;
  video_url?: string;
  media_type?: "IMAGE" | "REELS" | "CAROUSEL";
  caption?: string;
  is_carousel_item?: boolean;
  children?: string;
}

const createContainer = async (
  igUserId: string,
  accessToken: string,
  body: ContainerInput,
): Promise<string> => {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}/media`;
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) {
    if (v != null) form.set(k, String(v));
  }
  form.set("access_token", accessToken);
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const json = (await r.json()) as { id?: string; error?: { message: string } };
  if (!r.ok || !json.id) {
    throw new HttpError(
      502,
      "ig_container_failed",
      `container create failed: ${json.error?.message ?? r.statusText}`,
    );
  }
  return json.id;
};

const pollContainerReady = async (
  creationId: string,
  accessToken: string,
): Promise<void> => {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${creationId}`);
    url.searchParams.set("fields", "status_code");
    url.searchParams.set("access_token", accessToken);
    const r = await fetch(url.toString());
    const json = (await r.json()) as {
      status_code?: string;
      error?: { message: string };
    };
    if (!r.ok) {
      throw new HttpError(502, "ig_container_status_failed", json.error?.message ?? r.statusText);
    }
    if (json.status_code === "FINISHED") return;
    if (json.status_code === "ERROR" || json.status_code === "EXPIRED") {
      throw new HttpError(502, "ig_container_bad_status", `container status: ${json.status_code}`);
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw new HttpError(504, "ig_container_timeout", "container never reached FINISHED");
};

const publishContainer = async (
  igUserId: string,
  creationId: string,
  accessToken: string,
): Promise<string> => {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}/media_publish`;
  const form = new URLSearchParams({ creation_id: creationId, access_token: accessToken });
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const json = (await r.json()) as { id?: string; error?: { message: string } };
  if (!r.ok || !json.id) {
    throw new HttpError(
      502,
      "ig_publish_failed",
      `media_publish failed: ${json.error?.message ?? r.statusText}`,
    );
  }
  return json.id;
};

export default instagram;
