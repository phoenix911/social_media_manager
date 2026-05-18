// Worker environment shape. Bound from wrangler.toml + secrets.

export interface Env {
  // Bindings
  DB: D1Database;
  MEDIA: R2Bucket;
  KV: KVNamespace;
  ASSETS: Fetcher;
  PUBLISH_QUEUE?: Queue;

  // Vars
  ENVIRONMENT: string;
  APP_HOSTNAME: string;
  API_HOSTNAME: string;
  DEFAULT_TZ?: string;
  CF_ACCESS_TEAM: string;
  CF_ACCESS_AUD_API: string;
  AUTH_MODE?: "cf_access" | "webauthn";
  WEBAUTHN_ALLOWED_EMAILS?: string;
  SESSION_COOKIE_NAME?: string;
  SESSION_TTL_SECONDS?: string;
  TELEGRAM_WEBHOOK_PATH?: string;

  // Secrets — never logged.
  SMM_TOKEN_KEY: string;
  SESSION_SIGNING_KEY?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  /** One-shot seed token for the dummy IG account. Self-disables once
   *  consumed; delete after first run. */
  INSTAGRAM_USER_ACCESS_TOKEN?: string;

  REDDIT_CLIENT_ID?: string;
  REDDIT_CLIENT_SECRET?: string;
  REDDIT_USER_AGENT?: string;
  REDDIT_USERNAME_FOR_UA?: string;

  LINKEDIN_CLIENT_ID?: string;
  LINKEDIN_CLIENT_SECRET?: string;

  TWITTER_OAUTH2_CLIENT_ID?: string;
  TWITTER_OAUTH2_CLIENT_SECRET?: string;
  TWITTER_OAUTH1_CONSUMER_KEY?: string;
  TWITTER_OAUTH1_CONSUMER_SECRET?: string;

  META_APP_ID?: string;
  META_APP_SECRET?: string;

  PRODUCTHUNT_CLIENT_ID?: string;
  PRODUCTHUNT_CLIENT_SECRET?: string;

  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  TELEGRAM_ALLOWED_CHAT_IDS?: string;
}
