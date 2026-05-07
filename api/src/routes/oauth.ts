// OAuth start + callback wired to the platform adapter registry.
// /start  → returns { authorize_url } (web opens it in a new tab)
// /callback → exchanges code, stores account, redirects back to UI
//
// State is a KV-backed nonce: { project_id, user_id, return_to }.

import { Hono } from "hono";
import { idSchema, platformSchema } from "@smm/shared";
import type { Env } from "../env.ts";
import { BadRequest, Forbidden, HttpError } from "../lib/errors.ts";
import { getAdapter } from "../platforms/index.ts";
import { insertAccount } from "../lib/account-tokens.ts";
import { requireRole } from "../lib/projects.ts";
import { ensureOwnerForUser } from "../lib/owners.ts";
import { db, schema } from "../db/index.ts";
import { and, eq } from "drizzle-orm";

const app = new Hono<{ Bindings: Env }>();

interface PendingState {
  projectId: string | null;
  userId: string;
  returnTo: string;
}

app.post("/:platform/start", async (c) => {
  const p = platformSchema.safeParse(c.req.param("platform"));
  if (!p.success) throw BadRequest("unknown platform");
  const adapter = getAdapter(p.data);
  if (!adapter.isConfigured(c.env)) {
    throw new HttpError(503, "platform_not_configured", `${p.data} OAuth credentials not set on the worker`);
  }

  const body = (await c.req.json().catch(() => ({}))) as { projectId?: string | null; returnTo?: string };
  // projectId is optional — channels can be created project-independent.
  // When provided, the caller must be an editor on that project.
  let projectId: string | null = null;
  if (body.projectId) {
    const p = idSchema.safeParse(body.projectId);
    if (!p.success) throw BadRequest("invalid projectId");
    await requireRole(c.env.DB, p.data, c.var.user.id, "editor");
    projectId = p.data;
  }

  const nonce = crypto.randomUUID();
  const state: PendingState = {
    projectId,
    userId: c.var.user.id,
    returnTo: body.returnTo || "/channels",
  };
  await c.env.KV.put(`oauth:state:${nonce}`, JSON.stringify(state), { expirationTtl: 600 });

  const r = await adapter.startOauth(c.env, nonce);
  return c.json({ authorize_url: r.authorizeUrl, state: nonce });
});

app.get("/:platform/callback", async (c) => {
  const p = platformSchema.safeParse(c.req.param("platform"));
  if (!p.success) return c.html(htmlError("unknown platform"), 400);

  const code = c.req.query("code");
  const stateNonce = c.req.query("state");
  const error = c.req.query("error");
  if (error) return c.html(htmlError(`oauth error: ${error}`), 400);
  if (!code || !stateNonce) return c.html(htmlError("missing code or state"), 400);

  const stateRaw = await c.env.KV.get(`oauth:state:${stateNonce}`);
  if (!stateRaw) return c.html(htmlError("oauth state expired"), 400);
  await c.env.KV.delete(`oauth:state:${stateNonce}`);
  const state = JSON.parse(stateRaw) as PendingState;

  const adapter = getAdapter(p.data);
  const result = await adapter.exchangeCode(c.env, code, stateNonce).catch((e: Error) => {
    return { __error: e.message };
  });
  if ((result as { __error?: string }).__error) {
    return c.html(htmlError("oauth exchange failed: " + (result as { __error: string }).__error), 502);
  }
  const ok = result as Awaited<ReturnType<typeof adapter.exchangeCode>>;
  const { id: accountId } = await insertAccount(c.env, {
    projectId: state.projectId, // may be null
    platform: p.data,
    handle: ok.handle,
    externalId: ok.externalId,
    scopes: ok.scopes,
    accessToken: ok.accessToken,
    refreshToken: ok.refreshToken,
    expiresAt: ok.expiresAt,
    meta: ok.meta,
    addedBy: state.userId,
  });

  // If a project was specified, link channel into it.
  if (state.projectId) {
    await c.env.DB.prepare(
      "INSERT INTO project_accounts (project_id, account_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
    )
      .bind(state.projectId, accountId)
      .run();
  }

  // Auto-assign the connecting user as owner. If a project was
  // specified, scope the owner to that project; otherwise create a
  // global (project_id NULL) owner. Either way the channel is
  // visible to the user immediately.
  const user = await db(c.env.DB).select().from(schema.users).where(eq(schema.users.id, state.userId)).get();
  if (user?.email) {
    const ownerId = await ensureOwnerForUser(
      c.env,
      state.projectId,
      state.userId,
      user.email,
      user.name,
    );
    // Idempotent: skip if mapping already exists.
    const existing = await db(c.env.DB)
      .select()
      .from(schema.accountOwners)
      .where(and(eq(schema.accountOwners.accountId, accountId), eq(schema.accountOwners.ownerId, ownerId)))
      .get();
    if (!existing) {
      await db(c.env.DB).insert(schema.accountOwners).values({ accountId, ownerId }).run();
    }
  }

  const dest = state.returnTo || "/";
  return c.redirect(dest, 302);
});

const htmlError = (msg: string): string =>
  `<!doctype html><meta charset="utf-8"><title>oauth error</title><body style="font:14px system-ui;padding:24px;color:#900"><h1>OAuth error</h1><p>${msg.replace(/[<&]/g, (m) => (m === "<" ? "&lt;" : "&amp;"))}</p><p><a href="/">return to app</a></p>`;

void Forbidden; // placate unused-import linters in strict mode

export default app;
