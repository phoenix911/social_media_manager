// Per-platform adapter contract. Each platform's module exports a
// PlatformAdapter that the OAuth + Publisher code dispatches to.

import type { Env } from "../env.ts";
import type { Platform } from "@smm/shared";

export interface OauthStartResult {
  authorizeUrl: string;
  // Opaque state stored in KV under a nonce; we round-trip it through
  // the platform's `state=` param. KV TTL = 10 min.
  nonce: string;
}

export interface OauthExchangeResult {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  scopes: string;
  externalId: string;
  handle: string;
  meta: Record<string, unknown> | null;
}

export interface PublishInput {
  draft: {
    id: string;
    title: string | null;
    body: string;
    platformOptions: Record<string, unknown> | null;
  };
  account: {
    id: string;
    accessToken: string; // already decrypted
    refreshToken: string | null;
    handle: string;
    externalId: string;
    meta: Record<string, unknown> | null;
  };
  media: Array<{ id: string; r2Key: string; mime: string; filename: string }>;
}

export interface PublishResult {
  platformPostId: string;
  platformUrl: string;
}

export interface PlatformAdapter {
  platform: Platform;
  // OAuth
  isConfigured: (env: Env) => boolean;
  startOauth: (env: Env, nonce: string) => Promise<OauthStartResult> | OauthStartResult;
  exchangeCode: (env: Env, code: string, nonce: string) => Promise<OauthExchangeResult>;
  refresh?: (env: Env, refreshToken: string) => Promise<Pick<OauthExchangeResult, "accessToken" | "refreshToken" | "expiresAt">>;
  revoke?: (env: Env, token: string) => Promise<void>;
  // Publishing
  publish: (env: Env, input: PublishInput) => Promise<PublishResult>;
  // Optional: push as platform-native draft (LinkedIn only).
  pushDraft?: (env: Env, input: PublishInput) => Promise<{ platformDraftId: string }>;
}

export const REDIRECT_PATH = "/api/oauth";
export const redirectUri = (env: Env, platform: Platform): string =>
  `https://${env.APP_HOSTNAME}${REDIRECT_PATH}/${platform}/callback`;
