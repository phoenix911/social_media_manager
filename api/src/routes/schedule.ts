// Schedule endpoints: schedule, cancel, publish-now.

import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { idSchema } from "@smm/shared";
import type { Env } from "../env.ts";
import { db, schema } from "../db/index.ts";
import { BadRequest, NotFound } from "../lib/errors.ts";
import { requireRole } from "../lib/projects.ts";
import { notify } from "../notifications/index.ts";

const app = new Hono<{ Bindings: Env }>();

// POST /api/schedule/:draftId
app.post("/:draftId", async (c) => {
  const id = idSchema.safeParse(c.req.param("draftId"));
  if (!id.success) throw BadRequest("invalid id");
  const body = (await c.req.json().catch(() => null)) as { scheduledFor?: string; tz?: string };
  if (!body?.scheduledFor) throw BadRequest("scheduledFor (ISO datetime) required");
  if (Number.isNaN(Date.parse(body.scheduledFor))) throw BadRequest("scheduledFor must be ISO-8601");

  const d = db(c.env.DB);
  const draft = await d.select().from(schema.drafts).where(eq(schema.drafts.id, id.data)).get();
  if (!draft) throw NotFound();
  await requireRole(c.env.DB, draft.projectId, c.var.user.id, "editor");

  if (!draft.accountId) throw BadRequest("draft has no account; pick one first");

  await d
    .update(schema.drafts)
    .set({
      status: "scheduled",
      scheduledFor: body.scheduledFor,
      scheduledTz: body.tz ?? null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.drafts.id, id.data))
    .run();

  await notify(c.env, "schedule.created", {
    draftId: id.data,
    message: `for ${body.scheduledFor}${body.tz ? ` (${body.tz})` : ""}`,
  });
  return c.json({ ok: true });
});

// POST /api/schedule/:draftId/cancel
app.post("/:draftId/cancel", async (c) => {
  const id = idSchema.safeParse(c.req.param("draftId"));
  if (!id.success) throw BadRequest("invalid id");
  const d = db(c.env.DB);
  const draft = await d.select().from(schema.drafts).where(eq(schema.drafts.id, id.data)).get();
  if (!draft) throw NotFound();
  await requireRole(c.env.DB, draft.projectId, c.var.user.id, "editor");
  if (draft.status !== "scheduled") throw BadRequest(`cannot cancel: status=${draft.status}`);

  await d
    .update(schema.drafts)
    .set({ status: "draft", scheduledFor: null, scheduledTz: null, updatedAt: new Date().toISOString() })
    .where(eq(schema.drafts.id, id.data))
    .run();

  await notify(c.env, "schedule.cancelled", { draftId: id.data });
  return c.json({ ok: true });
});

// POST /api/schedule/:draftId/publish-now
app.post("/:draftId/publish-now", async (c) => {
  if (!c.env.PUBLISH_QUEUE) throw BadRequest("publish queue not configured");
  const id = idSchema.safeParse(c.req.param("draftId"));
  if (!id.success) throw BadRequest("invalid id");
  const d = db(c.env.DB);
  const draft = await d.select().from(schema.drafts).where(eq(schema.drafts.id, id.data)).get();
  if (!draft) throw NotFound();
  await requireRole(c.env.DB, draft.projectId, c.var.user.id, "editor");
  if (!draft.accountId) throw BadRequest("draft has no account");

  await d
    .update(schema.drafts)
    .set({ status: "publishing", updatedAt: new Date().toISOString() })
    .where(eq(schema.drafts.id, id.data))
    .run();
  await c.env.PUBLISH_QUEUE.send({ draftId: id.data });
  return c.json({ ok: true });
});

export default app;
