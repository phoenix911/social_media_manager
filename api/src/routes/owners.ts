// Owners CRUD. An owner is a person (or persona) with one or more
// emails. Channels are visible to a logged-in user only if their email
// is one of an owner's emails AND that owner is in `account_owners`
// for that channel.

import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { createOwnerSchema, idSchema, updateOwnerSchema, type Owner } from "@smm/shared";
import type { Env } from "../env.ts";
import { db, schema } from "../db/index.ts";
import { BadRequest, NotFound } from "../lib/errors.ts";
import { requireRole } from "../lib/projects.ts";

const app = new Hono<{ Bindings: Env }>();

const loadOwners = async (env: Env, projectId: string): Promise<Owner[]> => {
  const d = db(env.DB);
  const rows = await d
    .select()
    .from(schema.owners)
    .where(eq(schema.owners.projectId, projectId))
    .orderBy(desc(schema.owners.createdAt))
    .all();
  if (!rows.length) return [];
  const emails = await d
    .select()
    .from(schema.ownerEmails)
    .all();
  const map = new Map<string, string[]>();
  for (const e of emails) {
    const arr = map.get(e.ownerId) ?? [];
    arr.push(e.email);
    map.set(e.ownerId, arr);
  }
  return rows.map((r) => ({
    id: r.id,
    projectId: r.projectId,
    name: r.name,
    emails: map.get(r.id) ?? [],
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    archivedAt: r.archivedAt,
  }));
};

// GET /api/owners?projectId=
app.get("/", async (c) => {
  const projectId = idSchema.safeParse(c.req.query("projectId"));
  if (!projectId.success) throw BadRequest("projectId required");
  await requireRole(c.env.DB, projectId.data, c.var.user.id, "viewer");
  const owners = await loadOwners(c.env, projectId.data);
  return c.json({ owners });
});

// POST /api/owners — create an owner with optional emails
app.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createOwnerSchema.safeParse(body);
  if (!parsed.success) throw BadRequest("invalid body", parsed.error.flatten());
  await requireRole(c.env.DB, parsed.data.projectId, c.var.user.id, "editor");

  const d = db(c.env.DB);
  const inserted = await d
    .insert(schema.owners)
    .values({
      projectId: parsed.data.projectId,
      name: parsed.data.name,
      createdBy: c.var.user.id,
    })
    .returning()
    .get();
  for (const email of parsed.data.emails ?? []) {
    await d.insert(schema.ownerEmails).values({ ownerId: inserted.id, email }).onConflictDoNothing().run();
  }
  return c.json({
    owner: {
      id: inserted.id,
      projectId: inserted.projectId,
      name: inserted.name,
      emails: parsed.data.emails ?? [],
      createdBy: inserted.createdBy,
      createdAt: inserted.createdAt,
      archivedAt: inserted.archivedAt,
    } satisfies Owner,
  }, 201);
});

// PATCH /api/owners/:id — rename and/or replace email set
app.patch("/:id", async (c) => {
  const id = idSchema.safeParse(c.req.param("id"));
  if (!id.success) throw BadRequest("invalid id");
  const body = await c.req.json().catch(() => null);
  const parsed = updateOwnerSchema.safeParse(body);
  if (!parsed.success) throw BadRequest("invalid body", parsed.error.flatten());

  const d = db(c.env.DB);
  const existing = await d.select().from(schema.owners).where(eq(schema.owners.id, id.data)).get();
  if (!existing) throw NotFound();
  if (existing.projectId) {
    await requireRole(c.env.DB, existing.projectId, c.var.user.id, "editor");
  }

  if (parsed.data.name !== undefined) {
    await d.update(schema.owners).set({ name: parsed.data.name }).where(eq(schema.owners.id, id.data)).run();
  }
  if (parsed.data.emails !== undefined) {
    await d.delete(schema.ownerEmails).where(eq(schema.ownerEmails.ownerId, id.data)).run();
    for (const email of parsed.data.emails) {
      await d.insert(schema.ownerEmails).values({ ownerId: id.data, email }).onConflictDoNothing().run();
    }
  }
  const owners = existing.projectId ? await loadOwners(c.env, existing.projectId) : [];
  const owner = owners.find((o) => o.id === id.data);
  return c.json({ owner });
});

// DELETE /api/owners/:id — archive (cascades remove email + account-owner mappings via FK ON DELETE)
app.delete("/:id", async (c) => {
  const id = idSchema.safeParse(c.req.param("id"));
  if (!id.success) throw BadRequest("invalid id");
  const d = db(c.env.DB);
  const existing = await d.select().from(schema.owners).where(eq(schema.owners.id, id.data)).get();
  if (!existing) throw NotFound();
  if (existing.projectId) {
    await requireRole(c.env.DB, existing.projectId, c.var.user.id, "editor");
  }
  await d.update(schema.owners).set({ archivedAt: new Date().toISOString() }).where(eq(schema.owners.id, id.data)).run();
  return c.json({ ok: true });
});

// POST /api/owners/:id/accounts/:accountId  — assign an owner to an account
app.post("/:id/accounts/:accountId", async (c) => {
  const id = idSchema.safeParse(c.req.param("id"));
  const accountId = idSchema.safeParse(c.req.param("accountId"));
  if (!id.success || !accountId.success) throw BadRequest("invalid id");
  const d = db(c.env.DB);
  const acc = await d.select().from(schema.accounts).where(eq(schema.accounts.id, accountId.data)).get();
  const owner = await d.select().from(schema.owners).where(eq(schema.owners.id, id.data)).get();
  if (!acc || !owner) throw NotFound();
  // Only enforce same-project when both have a project (global owners
  // can attach to any channel).
  if (acc.projectId && owner.projectId && acc.projectId !== owner.projectId) {
    throw NotFound();
  }
  if (acc.projectId) await requireRole(c.env.DB, acc.projectId, c.var.user.id, "editor");
  await d
    .insert(schema.accountOwners)
    .values({ accountId: accountId.data, ownerId: id.data })
    .onConflictDoNothing()
    .run();
  return c.json({ ok: true });
});

// DELETE /api/owners/:id/accounts/:accountId — unassign
app.delete("/:id/accounts/:accountId", async (c) => {
  const id = idSchema.safeParse(c.req.param("id"));
  const accountId = idSchema.safeParse(c.req.param("accountId"));
  if (!id.success || !accountId.success) throw BadRequest("invalid id");
  const d = db(c.env.DB);
  const acc = await d.select().from(schema.accounts).where(eq(schema.accounts.id, accountId.data)).get();
  if (!acc) throw NotFound();
  if (acc.projectId) await requireRole(c.env.DB, acc.projectId, c.var.user.id, "editor");
  await d
    .delete(schema.accountOwners)
    .where(and(eq(schema.accountOwners.accountId, accountId.data), eq(schema.accountOwners.ownerId, id.data)))
    .run();
  return c.json({ ok: true });
});

export default app;
