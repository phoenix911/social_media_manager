import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { createDraftSchema, idSchema, updateDraftSchema, type Draft } from "@smm/shared";
import type { Env } from "../env.ts";
import { db, schema } from "../db/index.ts";
import { BadRequest, NotFound } from "../lib/errors.ts";
import { requireRole } from "../lib/projects.ts";
import { computeScheduledFor } from "../lib/tracks.ts";

const app = new Hono<{ Bindings: Env }>();

const rowToDraft = (r: typeof schema.drafts.$inferSelect): Draft => ({
  id: r.id,
  projectId: r.projectId,
  trackId: r.trackId,
  accountId: r.accountId,
  status: r.status as Draft["status"],
  title: r.title,
  body: r.body,
  bodyFormat: "markdown",
  platformOptions: r.platformOptions ? JSON.parse(r.platformOptions) : null,
  platformDraftId: r.platformDraftId,
  trackOffsetMinutes: r.trackOffsetMinutes,
  sequenceInTrack: r.sequenceInTrack,
  scheduledFor: r.scheduledFor,
  scheduledTz: r.scheduledTz,
  createdBy: r.createdBy,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  archivedAt: r.archivedAt,
});

// GET /api/drafts?projectId=&status=&trackId=
app.get("/", async (c) => {
  const projectId = idSchema.safeParse(c.req.query("projectId"));
  if (!projectId.success) throw BadRequest("projectId required");
  await requireRole(c.env.DB, projectId.data, c.var.user.id, "viewer");

  const status = c.req.query("status");
  const trackId = c.req.query("trackId");
  const d = db(c.env.DB);
  const filters = [eq(schema.drafts.projectId, projectId.data)];
  if (status) filters.push(eq(schema.drafts.status, status));
  if (trackId) filters.push(eq(schema.drafts.trackId, trackId));
  const rows = await d
    .select()
    .from(schema.drafts)
    .where(and(...filters))
    .orderBy(desc(schema.drafts.updatedAt))
    .all();
  return c.json({ drafts: rows.map(rowToDraft) });
});

// GET /api/drafts/:id
app.get("/:id", async (c) => {
  const id = idSchema.safeParse(c.req.param("id"));
  if (!id.success) throw BadRequest("invalid id");
  const d = db(c.env.DB);
  const row = await d.select().from(schema.drafts).where(eq(schema.drafts.id, id.data)).get();
  if (!row) throw NotFound();
  await requireRole(c.env.DB, row.projectId, c.var.user.id, "viewer");
  return c.json({ draft: rowToDraft(row) });
});

// POST /api/drafts
app.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createDraftSchema.safeParse(body);
  if (!parsed.success) throw BadRequest("invalid body", parsed.error.flatten());
  await requireRole(c.env.DB, parsed.data.projectId, c.var.user.id, "editor");

  const d = db(c.env.DB);
  // Validate the track belongs to the project.
  const track = await d.select().from(schema.tracks).where(eq(schema.tracks.id, parsed.data.trackId)).get();
  if (!track || track.projectId !== parsed.data.projectId) throw BadRequest("track not in project");

  // If account not explicitly given, inherit the track's account.
  const accountId = parsed.data.accountId ?? track.accountId ?? null;

  // Compute scheduled_for if track has a start_at + offset is given.
  const scheduledFor = computeScheduledFor(track.startAt, parsed.data.trackOffsetMinutes ?? null);

  const inserted = await d
    .insert(schema.drafts)
    .values({
      projectId: parsed.data.projectId,
      trackId: parsed.data.trackId,
      accountId,
      title: parsed.data.title ?? null,
      body: parsed.data.body,
      platformOptions: parsed.data.platformOptions ? JSON.stringify(parsed.data.platformOptions) : null,
      trackOffsetMinutes: parsed.data.trackOffsetMinutes ?? null,
      sequenceInTrack: parsed.data.sequenceInTrack ?? null,
      scheduledFor,
      scheduledTz: track.tz ?? null,
      createdBy: c.var.user.id,
    })
    .returning()
    .get();

  return c.json({ draft: rowToDraft(inserted) }, 201);
});

// PATCH /api/drafts/:id
app.patch("/:id", async (c) => {
  const id = idSchema.safeParse(c.req.param("id"));
  if (!id.success) throw BadRequest("invalid id");
  const body = await c.req.json().catch(() => null);
  const parsed = updateDraftSchema.safeParse(body);
  if (!parsed.success) throw BadRequest("invalid body", parsed.error.flatten());

  const d = db(c.env.DB);
  const existing = await d.select().from(schema.drafts).where(eq(schema.drafts.id, id.data)).get();
  if (!existing) throw NotFound();
  await requireRole(c.env.DB, existing.projectId, c.var.user.id, "editor");

  // Optional track move (only within the same project).
  let nextTrackId = existing.trackId;
  if (parsed.data.trackId && parsed.data.trackId !== existing.trackId) {
    const t = await d.select().from(schema.tracks).where(eq(schema.tracks.id, parsed.data.trackId)).get();
    if (!t || t.projectId !== existing.projectId) throw BadRequest("track not in project");
    nextTrackId = parsed.data.trackId;
  }

  // If track or offset changed, recompute scheduledFor from the (new) track.
  const offsetChanging = parsed.data.trackOffsetMinutes !== undefined;
  const trackChanging = parsed.data.trackId !== undefined && parsed.data.trackId !== existing.trackId;
  let nextScheduledFor: string | null | undefined = parsed.data.scheduledFor;
  let nextTz: string | null | undefined = parsed.data.scheduledTz;
  if (offsetChanging || trackChanging) {
    const t = await d.select().from(schema.tracks).where(eq(schema.tracks.id, nextTrackId)).get();
    const off = parsed.data.trackOffsetMinutes ?? existing.trackOffsetMinutes;
    nextScheduledFor = computeScheduledFor(t?.startAt ?? null, off);
    nextTz = t?.tz ?? null;
  }

  const updated = await d
    .update(schema.drafts)
    .set({
      ...(trackChanging ? { trackId: nextTrackId } : {}),
      ...(parsed.data.accountId !== undefined ? { accountId: parsed.data.accountId } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.body !== undefined ? { body: parsed.data.body } : {}),
      ...(parsed.data.trackOffsetMinutes !== undefined
        ? { trackOffsetMinutes: parsed.data.trackOffsetMinutes }
        : {}),
      ...(parsed.data.sequenceInTrack !== undefined
        ? { sequenceInTrack: parsed.data.sequenceInTrack }
        : {}),
      ...(nextScheduledFor !== undefined ? { scheduledFor: nextScheduledFor } : {}),
      ...(nextTz !== undefined ? { scheduledTz: nextTz } : {}),
      ...(parsed.data.platformOptions !== undefined
        ? { platformOptions: parsed.data.platformOptions ? JSON.stringify(parsed.data.platformOptions) : null }
        : {}),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.drafts.id, id.data))
    .returning()
    .get();

  return c.json({ draft: rowToDraft(updated) });
});

export default app;
