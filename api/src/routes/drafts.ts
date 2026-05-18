import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { createDraftSchema, idSchema, updateDraftSchema, type Draft, type DraftSummary } from "@smm/shared";
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

interface DraftRow {
  id: string; project_id: string; track_id: string; account_id: string | null;
  status: string; title: string | null; body: string;
  platform_options: string | null; platform_draft_id: string | null;
  track_offset_minutes: number | null; sequence_in_track: number | null;
  scheduled_for: string | null; scheduled_tz: string | null;
  created_by: string; created_at: string; updated_at: string; archived_at: string | null;
  media_count?: number;
}
const rawToDraft = (r: DraftRow): Draft => ({
  id: r.id,
  projectId: r.project_id,
  trackId: r.track_id,
  accountId: r.account_id,
  status: r.status as Draft["status"],
  title: r.title,
  body: r.body,
  bodyFormat: "markdown",
  platformOptions: r.platform_options ? JSON.parse(r.platform_options) : null,
  platformDraftId: r.platform_draft_id,
  trackOffsetMinutes: r.track_offset_minutes,
  sequenceInTrack: r.sequence_in_track,
  scheduledFor: r.scheduled_for,
  scheduledTz: r.scheduled_tz,
  createdBy: r.created_by,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  archivedAt: r.archived_at,
});

// GET /api/drafts?projectId=&status=&trackId= — JOIN role-check in.
app.get("/", async (c) => {
  const projectId = idSchema.safeParse(c.req.query("projectId"));
  if (!projectId.success) throw BadRequest("projectId required");
  const status = c.req.query("status");
  const trackId = c.req.query("trackId");

  const conds = ["d.project_id = ?1"];
  const binds: (string | number)[] = [projectId.data, c.var.user.id];
  if (status) { conds.push(`d.status = ?${binds.length + 1}`); binds.push(status); }
  if (trackId) { conds.push(`d.track_id = ?${binds.length + 1}`); binds.push(trackId); }

  const sql = `
    SELECT d.id, d.project_id, d.track_id, d.account_id, d.status,
           d.title, d.body, d.platform_options, d.platform_draft_id,
           d.track_offset_minutes, d.sequence_in_track,
           d.scheduled_for, d.scheduled_tz,
           d.created_by, d.created_at, d.updated_at, d.archived_at,
           (SELECT COUNT(*) FROM draft_media dm WHERE dm.draft_id = d.id) AS media_count
    FROM drafts d
    JOIN project_members pm
      ON pm.project_id = d.project_id AND pm.user_id = ?2
    WHERE ${conds.join(" AND ")}
    ORDER BY d.updated_at DESC
  `;
  const { results } = await c.env.DB.prepare(sql).bind(...binds).all<DraftRow>();
  if (!results || results.length === 0) {
    const probe = await c.env.DB
      .prepare("SELECT 1 AS ok FROM project_members WHERE project_id = ?1 AND user_id = ?2 LIMIT 1")
      .bind(projectId.data, c.var.user.id)
      .first();
    if (!probe) throw NotFound("project not found or no access");
    return c.json({ drafts: [] as DraftSummary[] });
  }
  const drafts: DraftSummary[] = results.map((r) => ({
    ...rawToDraft(r),
    mediaCount: r.media_count ?? 0,
  }));
  return c.json({ drafts });
});

// GET /api/drafts/:id — JOIN role-check.
app.get("/:id", async (c) => {
  const id = idSchema.safeParse(c.req.param("id"));
  if (!id.success) throw BadRequest("invalid id");
  const row = await c.env.DB
    .prepare(
      `SELECT d.id, d.project_id, d.track_id, d.account_id, d.status,
              d.title, d.body, d.platform_options, d.platform_draft_id,
              d.track_offset_minutes, d.sequence_in_track,
              d.scheduled_for, d.scheduled_tz,
              d.created_by, d.created_at, d.updated_at, d.archived_at,
              (SELECT COUNT(*) FROM draft_media dm WHERE dm.draft_id = d.id) AS media_count,
              pm.role AS my_role
       FROM drafts d
       LEFT JOIN project_members pm
         ON pm.project_id = d.project_id AND pm.user_id = ?2
       WHERE d.id = ?1`,
    )
    .bind(id.data, c.var.user.id)
    .first<DraftRow & { my_role: string | null }>();
  if (!row || !row.my_role) throw NotFound();
  const summary: DraftSummary = { ...rawToDraft(row), mediaCount: row.media_count ?? 0 };
  return c.json({ draft: summary });
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
