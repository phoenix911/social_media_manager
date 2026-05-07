// Middleware that:
//   1. extracts CF Access JWT from the Cf-Access-Jwt-Assertion header
//   2. verifies signature + audience + issuer
//   3. upserts the user row by email
//   4. attaches { user } to the Hono context
//
// Routes that need auth call this; the public health endpoint skips it.

import type { Context, MiddlewareHandler } from "hono";
import { and, eq, isNull, sql } from "drizzle-orm";
import type { Env } from "../env.ts";
import { db, schema } from "../db/index.ts";
import { verifyAccess } from "../lib/access.ts";
import { Unauthorized } from "../lib/errors.ts";
import { cookieName, readCookie, verifySession } from "../lib/session.ts";
import { hashApiKey } from "../lib/api-keys.ts";
import type { User } from "@smm/shared";

declare module "hono" {
  interface ContextVariableMap {
    user: User;
    /** True when this request authed via API key (Bearer token).
     *  Routes outside the MCP scope must throw 403 when this is set. */
    viaApiKey: boolean;
  }
}

const upsertUserByEmail = async (env: Env, email: string): Promise<User> => {
  const d = db(env.DB);
  const existing = await d.select().from(schema.users).where(eq(schema.users.email, email)).get();
  if (existing) {
    await d
      .update(schema.users)
      .set({ lastSeen: sql`(datetime('now'))` })
      .where(eq(schema.users.id, existing.id))
      .run();
    return rowToUser(existing);
  }
  const inserted = await d.insert(schema.users).values({ email }).returning().get();
  return rowToUser(inserted);
};

const rowToUser = (r: typeof schema.users.$inferSelect): User => ({
  id: r.id,
  email: r.email,
  name: r.name,
  pictureUrl: r.pictureUrl,
  createdAt: r.createdAt,
  lastSeen: r.lastSeen,
});

const authViaCfAccess = async (c: Context<{ Bindings: Env }>): Promise<User> => {
  const jwt = c.req.header("Cf-Access-Jwt-Assertion");
  if (!jwt) throw Unauthorized("missing CF Access JWT");
  const env = c.env;
  let email: string;
  if (env.ENVIRONMENT === "dev" && jwt === "dev") {
    const devEmail = c.req.header("X-Dev-Email");
    if (!devEmail) throw Unauthorized("set X-Dev-Email header in dev mode");
    email = devEmail;
  } else {
    const claims = await verifyAccess(jwt, env.CF_ACCESS_TEAM, env.CF_ACCESS_AUD_API).catch(() => {
      throw Unauthorized("invalid CF Access JWT");
    });
    email = claims.email!;
  }
  return upsertUserByEmail(env, email);
};

const authViaSessionCookie = async (c: Context<{ Bindings: Env }>): Promise<User> => {
  const env = c.env;
  const cookie = readCookie(c.req.header("Cookie"), cookieName(env));
  if (!cookie) throw Unauthorized("not signed in");
  const session = await verifySession(env, cookie);
  if (!session) throw Unauthorized("invalid or expired session");
  const row = await db(env.DB).select().from(schema.users).where(eq(schema.users.id, session.userId)).get();
  if (!row) throw Unauthorized("user not found");
  await db(env.DB)
    .update(schema.users)
    .set({ lastSeen: sql`(datetime('now'))` })
    .where(eq(schema.users.id, row.id))
    .run();
  return rowToUser(row);
};

const authViaApiKey = async (c: Context<{ Bindings: Env }>): Promise<User | null> => {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const plaintext = auth.slice(7).trim();
  if (!plaintext.startsWith("smm_")) return null;
  const hash = await hashApiKey(plaintext);
  const env = c.env;
  const row = await db(env.DB)
    .select()
    .from(schema.apiKeys)
    .where(and(eq(schema.apiKeys.hash, hash), isNull(schema.apiKeys.revokedAt)))
    .get();
  if (!row) throw Unauthorized("invalid api key");
  await db(env.DB)
    .update(schema.apiKeys)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(schema.apiKeys.id, row.id))
    .run();
  const userRow = await db(env.DB).select().from(schema.users).where(eq(schema.users.id, row.userId)).get();
  if (!userRow) throw Unauthorized("api key user gone");
  return rowToUser(userRow);
};

export const requireUser: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  // Bearer token wins if present — lets a paired session+key request
  // still resolve as the API-key principal so scope guards apply.
  const apiKeyUser = await authViaApiKey(c);
  if (apiKeyUser) {
    c.set("user", apiKeyUser);
    c.set("viaApiKey", true);
    await next();
    return;
  }
  c.set("viaApiKey", false);
  const mode = c.env.AUTH_MODE ?? "cf_access";
  const user = mode === "webauthn" ? await authViaSessionCookie(c) : await authViaCfAccess(c);
  c.set("user", user);
  await next();
};

// Used by routes outside the MCP-scoped subset to reject API-key auth.
export const requireSessionAuth: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  if (c.var.viaApiKey) throw new (await import("../lib/errors.ts")).HttpError(403, "forbidden", "api keys cannot access this route");
  await next();
};
