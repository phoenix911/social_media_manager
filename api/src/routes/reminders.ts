// Reminders CRUD. Reminders are user-scoped (a user gets THEIR
// pending list across all projects they're a member of).

import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { createReminderSchema, idSchema, updateReminderSchema, type Reminder } from "@smm/shared";
import type { Env } from "../env.ts";
import { db, schema } from "../db/index.ts";
import { BadRequest, NotFound, Forbidden } from "../lib/errors.ts";

const app = new Hono<{ Bindings: Env }>();

const rowToReminder = (r: typeof schema.reminders.$inferSelect): Reminder => ({
  id: r.id,
  userId: r.userId,
  telegramTarget: r.telegramTarget,
  label: r.label,
  kind: r.kind as Reminder["kind"],
  enabled: !!r.enabled,
  createdAt: r.createdAt,
  archivedAt: r.archivedAt,
});

// GET /api/reminders — only mine
app.get("/", async (c) => {
  const rows = await db(c.env.DB)
    .select()
    .from(schema.reminders)
    .where(eq(schema.reminders.userId, c.var.user.id))
    .all();
  return c.json({ reminders: rows.filter((r) => !r.archivedAt).map(rowToReminder) });
});

// POST /api/reminders
app.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createReminderSchema.safeParse(body);
  if (!parsed.success) throw BadRequest("invalid body", parsed.error.flatten());
  const inserted = await db(c.env.DB)
    .insert(schema.reminders)
    .values({
      userId: c.var.user.id,
      telegramTarget: parsed.data.telegramTarget,
      label: parsed.data.label ?? null,
      enabled: parsed.data.enabled,
    })
    .returning()
    .get();
  return c.json({ reminder: rowToReminder(inserted) }, 201);
});

// PATCH /api/reminders/:id
app.patch("/:id", async (c) => {
  const id = idSchema.safeParse(c.req.param("id"));
  if (!id.success) throw BadRequest("invalid id");
  const body = await c.req.json().catch(() => null);
  const parsed = updateReminderSchema.safeParse(body);
  if (!parsed.success) throw BadRequest("invalid body", parsed.error.flatten());
  const d = db(c.env.DB);
  const existing = await d.select().from(schema.reminders).where(eq(schema.reminders.id, id.data)).get();
  if (!existing) throw NotFound();
  if (existing.userId !== c.var.user.id) throw Forbidden();
  const updated = await d
    .update(schema.reminders)
    .set({
      ...(parsed.data.telegramTarget !== undefined ? { telegramTarget: parsed.data.telegramTarget } : {}),
      ...(parsed.data.label !== undefined ? { label: parsed.data.label } : {}),
      ...(parsed.data.enabled !== undefined ? { enabled: parsed.data.enabled } : {}),
    })
    .where(eq(schema.reminders.id, id.data))
    .returning()
    .get();
  return c.json({ reminder: rowToReminder(updated) });
});

// DELETE /api/reminders/:id — soft delete (archive)
app.delete("/:id", async (c) => {
  const id = idSchema.safeParse(c.req.param("id"));
  if (!id.success) throw BadRequest("invalid id");
  const d = db(c.env.DB);
  const existing = await d.select().from(schema.reminders).where(eq(schema.reminders.id, id.data)).get();
  if (!existing) throw NotFound();
  if (existing.userId !== c.var.user.id) throw Forbidden();
  await d
    .update(schema.reminders)
    .set({ archivedAt: new Date().toISOString() })
    .where(eq(schema.reminders.id, id.data))
    .run();
  return c.json({ ok: true });
});

// POST /api/reminders/:id/test — trigger this reminder right now (for testing)
app.post("/:id/test", async (c) => {
  const id = idSchema.safeParse(c.req.param("id"));
  if (!id.success) throw BadRequest("invalid id");
  const d = db(c.env.DB);
  const existing = await d.select().from(schema.reminders).where(eq(schema.reminders.id, id.data)).get();
  if (!existing) throw NotFound();
  if (existing.userId !== c.var.user.id) throw Forbidden();
  // Run only this one reminder via a quick local fetch.
  const { runReminders } = await import("../scheduler/reminders.ts");
  await runReminders(c.env);
  return c.json({ ok: true });
});

export default app;
