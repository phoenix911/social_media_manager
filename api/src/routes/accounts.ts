import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import type { Account, Platform } from "@smm/shared";
import { createAccountSchema, idSchema } from "@smm/shared";
import type { Env } from "../env.ts";
import { db, schema } from "../db/index.ts";
import { BadRequest, NotFound } from "../lib/errors.ts";
import { requireRole } from "../lib/projects.ts";
import { insertAccount, revokeAccount } from "../lib/account-tokens.ts";
import { ensureOwnerForUser } from "../lib/owners.ts";

const app = new Hono<{ Bindings: Env }>();

interface AccountWithOwners {
  id: string;
  project_id: string;
  platform: string;
  handle: string;
  external_id: string;
  scopes: string;
  expires_at: string | null;
  meta: string | null;
  added_by: string | null;
  created_at: string;
  revoked_at: string | null;
  owner_ids: string | null;
}

const toAccount = (r: AccountWithOwners): Account => ({
  id: r.id,
  projectId: r.project_id,
  ownerIds: r.owner_ids ? r.owner_ids.split(",") : [],
  platform: r.platform as Platform,
  handle: r.handle,
  externalId: r.external_id,
  scopes: r.scopes,
  expiresAt: r.expires_at,
  meta: r.meta ? (JSON.parse(r.meta) as Record<string, unknown>) : null,
  addedBy: r.added_by,
  createdAt: r.created_at,
  revokedAt: r.revoked_at,
});

// GET /api/accounts?projectId= — visible only to me (owners.emails ∋ my
// email AND that owner has this account in account_owners). One round-
// trip with a CTE for "my owner ids", then a single GROUP BY query.
//
// projectId is optional: if omitted, returns every channel visible to
// me across every project I'm a member of (used by the home page).
app.get("/", async (c) => {
  const projectIdRaw = c.req.query("projectId");

  if (!projectIdRaw) {
    // Channel-level (project-independent) view: any channel I share an
    // owner with, whether that owner is project-scoped (in a project
    // I'm a member of) or global (owner.project_id IS NULL).
    const sql = `
      WITH my_projects AS (
        SELECT project_id FROM project_members WHERE user_id = ?1
      ),
      my_owners AS (
        SELECT o.id FROM owners o
        JOIN owner_emails e ON e.owner_id = o.id
        WHERE e.email = ?2
          AND (o.project_id IS NULL OR o.project_id IN (SELECT project_id FROM my_projects))
      )
      SELECT DISTINCT
        a.id, a.project_id, a.platform, a.handle, a.external_id, a.scopes,
        a.expires_at, a.meta, a.added_by, a.created_at, a.revoked_at,
        (
          SELECT GROUP_CONCAT(ao2.owner_id)
          FROM account_owners ao2 WHERE ao2.account_id = a.id
        ) AS owner_ids
      FROM accounts a
      JOIN account_owners ao ON ao.account_id = a.id
      WHERE ao.owner_id IN (SELECT id FROM my_owners)
      ORDER BY a.created_at DESC
    `;
    const { results } = await c.env.DB.prepare(sql)
      .bind(c.var.user.id, c.var.user.email)
      .all<AccountWithOwners>();
    const accounts: Account[] = (results ?? []).map(toAccount);
    return c.json({ accounts });
  }

  const projectId = idSchema.safeParse(projectIdRaw);
  if (!projectId.success) throw BadRequest("invalid projectId");
  await requireRole(c.env.DB, projectId.data, c.var.user.id, "viewer");

  // Channels visible in this project = (linked via project_accounts)
  // ∩ (share at least one owner with my email scoped to this project).
  // One round-trip via two CTEs.
  const sql = `
    WITH my_owners AS (
      SELECT o.id FROM owners o
      JOIN owner_emails e ON e.owner_id = o.id
      WHERE o.project_id = ?1 AND e.email = ?2
    ),
    project_channels AS (
      SELECT account_id FROM project_accounts WHERE project_id = ?1
    )
    SELECT
      a.id, a.project_id, a.platform, a.handle, a.external_id, a.scopes,
      a.expires_at, a.meta, a.added_by, a.created_at, a.revoked_at,
      GROUP_CONCAT(ao.owner_id) AS owner_ids
    FROM accounts a
    JOIN account_owners ao ON ao.account_id = a.id
    WHERE a.id IN (SELECT account_id FROM project_channels)
      AND a.id IN (
        SELECT DISTINCT account_id FROM account_owners
        WHERE owner_id IN (SELECT id FROM my_owners)
      )
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `;
  const { results } = await c.env.DB.prepare(sql)
    .bind(projectId.data, c.var.user.email)
    .all<AccountWithOwners>();

  const accounts: Account[] = (results ?? []).map(toAccount);
  return c.json({ accounts });
});

// POST /api/accounts — manual channel creation. projectId optional;
// when given the channel is also linked to that project.
app.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createAccountSchema.safeParse(body);
  if (!parsed.success) throw BadRequest("invalid body", parsed.error.flatten());

  if (parsed.data.projectId) {
    await requireRole(c.env.DB, parsed.data.projectId, c.var.user.id, "editor");
  }

  const { id: accountId } = await insertAccount(c.env, {
    projectId: parsed.data.projectId ?? null,
    platform: parsed.data.platform,
    handle: parsed.data.handle,
    externalId: parsed.data.externalId,
    scopes: parsed.data.scopes,
    accessToken: parsed.data.accessToken,
    refreshToken: parsed.data.refreshToken ?? null,
    expiresAt: parsed.data.expiresAt ?? null,
    meta: parsed.data.meta ?? null,
    addedBy: c.var.user.id,
  });

  if (parsed.data.projectId) {
    await c.env.DB.prepare(
      "INSERT INTO project_accounts (project_id, account_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
    )
      .bind(parsed.data.projectId, accountId)
      .run();
  }

  const ownerId = await ensureOwnerForUser(
    c.env,
    parsed.data.projectId ?? null,
    c.var.user.id,
    c.var.user.email,
    c.var.user.name,
  );
  await c.env.DB.prepare(
    "INSERT INTO account_owners (account_id, owner_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
  )
    .bind(accountId, ownerId)
    .run();

  return c.json({ id: accountId }, 201);
});

// DELETE /api/accounts/:id — must be visible to caller. Single query
// using EXISTS to confirm I share an owner with this account.
app.delete("/:id", async (c) => {
  const id = idSchema.safeParse(c.req.param("id"));
  if (!id.success) throw BadRequest("invalid id");
  const row = await db(c.env.DB).select().from(schema.accounts).where(eq(schema.accounts.id, id.data)).get();
  if (!row) throw NotFound();
  if (row.projectId) await requireRole(c.env.DB, row.projectId, c.var.user.id, "editor");

  const sharedSql = `
    SELECT 1 FROM account_owners ao
    JOIN owner_emails oe ON oe.owner_id = ao.owner_id
    JOIN owners o ON o.id = ao.owner_id
    WHERE ao.account_id = ?1 AND oe.email = ?2 AND o.project_id = ?3
    LIMIT 1
  `;
  const shared = await c.env.DB.prepare(sharedSql)
    .bind(id.data, c.var.user.email, row.projectId)
    .first();
  if (!shared) throw NotFound();

  await revokeAccount(c.env, id.data);
  return c.json({ ok: true });
});

// POST /api/accounts/:id/projects/:projectId — link this channel into another project
app.post("/:id/projects/:projectId", async (c) => {
  const id = idSchema.safeParse(c.req.param("id"));
  const projectId = idSchema.safeParse(c.req.param("projectId"));
  if (!id.success || !projectId.success) throw BadRequest("invalid id");
  await requireRole(c.env.DB, projectId.data, c.var.user.id, "editor");
  // The caller must have visibility on the channel in some project (i.e. share an owner with it).
  const sharedSql = `
    SELECT 1 FROM account_owners ao
    JOIN owner_emails oe ON oe.owner_id = ao.owner_id
    WHERE ao.account_id = ?1 AND oe.email = ?2
    LIMIT 1
  `;
  const shared = await c.env.DB.prepare(sharedSql).bind(id.data, c.var.user.email).first();
  if (!shared) throw NotFound();

  await c.env.DB.prepare(
    "INSERT INTO project_accounts (project_id, account_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
  )
    .bind(projectId.data, id.data)
    .run();
  return c.json({ ok: true });
});

// DELETE /api/accounts/:id/projects/:projectId — unlink (the home project can't be unlinked)
app.delete("/:id/projects/:projectId", async (c) => {
  const id = idSchema.safeParse(c.req.param("id"));
  const projectId = idSchema.safeParse(c.req.param("projectId"));
  if (!id.success || !projectId.success) throw BadRequest("invalid id");
  await requireRole(c.env.DB, projectId.data, c.var.user.id, "editor");
  const acc = await db(c.env.DB).select().from(schema.accounts).where(eq(schema.accounts.id, id.data)).get();
  if (!acc) throw NotFound();
  if (acc.projectId === projectId.data) throw BadRequest("cannot unlink home project; revoke the channel instead");
  await c.env.DB.prepare("DELETE FROM project_accounts WHERE project_id = ? AND account_id = ?")
    .bind(projectId.data, id.data)
    .run();
  return c.json({ ok: true });
});

void and; // keep import linter happy if and is unused after refactor
export default app;
