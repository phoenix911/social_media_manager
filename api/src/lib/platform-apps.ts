// Platform-app credentials live encrypted in the `platform_apps`
// table. Each row holds the `config` for one OAuth app
// registration on a given platform (client_id, client_secret, plus
// any platform-specific extras). The whole config blob is stored
// AES-GCM encrypted; the master key is SMM_TOKEN_KEY.
//
// Adapters call `getAppConfig(env, platform, appId?)` instead of
// reading env vars. If no DB row exists (and no appId passed), we
// fall back to env vars so existing wrangler-secret-based deploys
// keep working during the transition.

import { and, desc, eq, isNull } from "drizzle-orm";
import type { Platform } from "@smm/shared";
import type { Env } from "../env.ts";
import { db, schema } from "../db/index.ts";
import { decryptToken, encryptToken } from "./crypto.ts";

export interface AppConfig {
  /** Stable id for refresh-on-use; null when falling back to env. */
  id: string | null;
  clientId: string;
  clientSecret: string;
  // Reddit
  redditUserAgent?: string;
  redditUsernameForUa?: string;
  // Twitter — separate OAuth1.0a creds for v1.1 media upload.
  twitterOauth1ConsumerKey?: string;
  twitterOauth1ConsumerSecret?: string;
}

/** Fall-back to Worker secret env vars when no DB row exists. */
const envFallback = (env: Env, platform: Platform): AppConfig | null => {
  switch (platform) {
    case "reddit":
      if (!env.REDDIT_CLIENT_ID || !env.REDDIT_CLIENT_SECRET) return null;
      return {
        id: null,
        clientId: env.REDDIT_CLIENT_ID,
        clientSecret: env.REDDIT_CLIENT_SECRET,
        redditUserAgent: env.REDDIT_USER_AGENT,
        redditUsernameForUa: env.REDDIT_USERNAME_FOR_UA,
      };
    case "linkedin":
      if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET) return null;
      return { id: null, clientId: env.LINKEDIN_CLIENT_ID, clientSecret: env.LINKEDIN_CLIENT_SECRET };
    case "twitter":
      if (!env.TWITTER_OAUTH2_CLIENT_ID || !env.TWITTER_OAUTH2_CLIENT_SECRET) return null;
      return {
        id: null,
        clientId: env.TWITTER_OAUTH2_CLIENT_ID,
        clientSecret: env.TWITTER_OAUTH2_CLIENT_SECRET,
        twitterOauth1ConsumerKey: env.TWITTER_OAUTH1_CONSUMER_KEY,
        twitterOauth1ConsumerSecret: env.TWITTER_OAUTH1_CONSUMER_SECRET,
      };
    case "instagram":
      if (!env.META_APP_ID || !env.META_APP_SECRET) return null;
      return { id: null, clientId: env.META_APP_ID, clientSecret: env.META_APP_SECRET };
    case "producthunt":
      if (!env.PRODUCTHUNT_CLIENT_ID || !env.PRODUCTHUNT_CLIENT_SECRET) return null;
      return { id: null, clientId: env.PRODUCTHUNT_CLIENT_ID, clientSecret: env.PRODUCTHUNT_CLIENT_SECRET };
    default:
      return null;
  }
};

/** Pull an app's config. If `appId` is given, use that exact row; else
 *  pick the most-recently-created non-archived row for the platform.
 *  Falls back to env vars if no DB rows exist. */
export const getAppConfig = async (
  env: Env,
  platform: Platform,
  appId?: string | null,
): Promise<AppConfig | null> => {
  const d = db(env.DB);
  const row = appId
    ? await d.select().from(schema.platformApps).where(eq(schema.platformApps.id, appId)).get()
    : await d
        .select()
        .from(schema.platformApps)
        .where(and(eq(schema.platformApps.platform, platform), isNull(schema.platformApps.archivedAt)))
        .orderBy(desc(schema.platformApps.createdAt))
        .get();
  if (!row) return envFallback(env, platform);
  if (row.platform !== platform) return envFallback(env, platform);

  const decrypted = await decryptToken(row.configEncrypted, env.SMM_TOKEN_KEY);
  const parsed = JSON.parse(decrypted) as Omit<AppConfig, "id">;
  return { id: row.id, ...parsed };
};

export const writeAppConfig = async (
  env: Env,
  platform: Platform,
  label: string,
  config: Omit<AppConfig, "id">,
  createdBy: string,
): Promise<{ id: string }> => {
  const enc = await encryptToken(JSON.stringify(config), env.SMM_TOKEN_KEY);
  const row = await db(env.DB)
    .insert(schema.platformApps)
    .values({ platform, label, configEncrypted: enc, createdBy })
    .returning({ id: schema.platformApps.id })
    .get();
  return row;
};
