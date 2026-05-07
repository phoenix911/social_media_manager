// Helpers for storing + retrieving OAuth tokens with at-rest
// encryption, lazy-refresh on use, and revocation.

import { eq } from "drizzle-orm";
import type { Env } from "../env.ts";
import { db, schema } from "../db/index.ts";
import { encryptToken, decryptToken } from "./crypto.ts";
import { getAdapter } from "../platforms/index.ts";
import type { Platform } from "@smm/shared";
import { HttpError } from "./errors.ts";

export interface DecryptedAccount {
  id: string;
  projectId: string | null;
  platform: Platform;
  handle: string;
  externalId: string;
  scopes: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  meta: Record<string, unknown> | null;
}

const SKEW_MS = 60_000; // refresh if token expires within 60s

export const insertAccount = async (
  env: Env,
  values: {
    projectId: string | null;
    platform: Platform;
    handle: string;
    externalId: string;
    scopes: string;
    accessToken: string;
    refreshToken: string | null;
    expiresAt: string | null;
    meta: Record<string, unknown> | null;
    addedBy: string;
  },
): Promise<{ id: string }> => {
  const enc = await encryptToken(values.accessToken, env.SMM_TOKEN_KEY);
  const encRefresh = values.refreshToken ? await encryptToken(values.refreshToken, env.SMM_TOKEN_KEY) : null;
  const row = await db(env.DB)
    .insert(schema.accounts)
    .values({
      projectId: values.projectId,
      platform: values.platform,
      handle: values.handle,
      externalId: values.externalId,
      scopes: values.scopes,
      accessToken: enc,
      refreshToken: encRefresh,
      expiresAt: values.expiresAt,
      meta: values.meta ? JSON.stringify(values.meta) : null,
      addedBy: values.addedBy,
    })
    .onConflictDoUpdate({
      target: [schema.accounts.projectId, schema.accounts.platform, schema.accounts.externalId],
      set: {
        handle: values.handle,
        scopes: values.scopes,
        accessToken: enc,
        refreshToken: encRefresh,
        expiresAt: values.expiresAt,
        meta: values.meta ? JSON.stringify(values.meta) : null,
        revokedAt: null,
      },
    })
    .returning({ id: schema.accounts.id })
    .get();
  return row;
};

export const getDecryptedAccount = async (env: Env, accountId: string): Promise<DecryptedAccount> => {
  const row = await db(env.DB).select().from(schema.accounts).where(eq(schema.accounts.id, accountId)).get();
  if (!row) throw new HttpError(404, "account_not_found", "account missing");
  if (row.revokedAt) throw new HttpError(409, "account_revoked", "account has been disconnected");

  let access = await decryptToken(row.accessToken, env.SMM_TOKEN_KEY);
  let refresh = row.refreshToken ? await decryptToken(row.refreshToken, env.SMM_TOKEN_KEY) : null;
  let expiresAt = row.expiresAt;

  // Lazy refresh if token is near expiry and we have a refresh capability.
  const expMs = expiresAt ? Date.parse(expiresAt) : 0;
  if (expMs && expMs - Date.now() < SKEW_MS) {
    const adapter = getAdapter(row.platform as Platform);
    if (adapter.refresh && refresh) {
      const t = await adapter.refresh(env, refresh);
      access = t.accessToken;
      refresh = t.refreshToken;
      expiresAt = t.expiresAt;
      const enc = await encryptToken(access, env.SMM_TOKEN_KEY);
      const encRefresh = refresh ? await encryptToken(refresh, env.SMM_TOKEN_KEY) : null;
      await db(env.DB)
        .update(schema.accounts)
        .set({ accessToken: enc, refreshToken: encRefresh, expiresAt })
        .where(eq(schema.accounts.id, accountId))
        .run();
    }
  }

  return {
    id: row.id,
    projectId: row.projectId,
    platform: row.platform as Platform,
    handle: row.handle,
    externalId: row.externalId,
    scopes: row.scopes,
    accessToken: access,
    refreshToken: refresh,
    expiresAt,
    meta: row.meta ? (JSON.parse(row.meta) as Record<string, unknown>) : null,
  };
};

export const revokeAccount = async (env: Env, accountId: string): Promise<void> => {
  await db(env.DB)
    .update(schema.accounts)
    .set({ revokedAt: new Date().toISOString(), accessToken: "", refreshToken: null })
    .where(eq(schema.accounts.id, accountId))
    .run();
};
