// Track CRUD. A track is a single-channel campaign that owns a set
// of drafts. Each draft has an offset (minutes) from the track's
// start_at; moving start_at recomputes every draft's scheduled_for.

import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { createTrackSchema, idSchema, updateTrackSchema, type Track, type TrackSummary } from "@smm/shared";
import type { Env } from "../env.ts";
import { db, schema } from "../db/index.ts";
import { BadRequest, NotFound } from "../lib/errors.ts";
import { requireRole } from "../lib/projects.ts";
import { recomputeTrackSchedules } from "../lib/tracks.ts";

const app = new Hono<{ Bindings: Env }>();

const rowToTrack = (r: typeof schema.tracks.$inferSelect): Track => ({
  id: r.id,
  projectId: r.projectId,
  name: r.name,
  description: r.description,
  accountId: r.accountId,
  startAt: r.startAt,
  tz: r.tz,
  createdBy: r.createdBy,
  createdAt: r.createdAt,
  archivedAt: r.archivedAt,
});

interface TrackRow {
  id: string; project_id: string; name: string; description: string | null;
  account_id: string | null; start_at: string | null; tz: string | null;
  created_by: string; created_at: string; archived_at: string | null;
}
const rawToTrack = (r: TrackRow): Track => ({
  id: r.id,
  projectId: r.project_id,
  name: r.name,
  description: r.description,
  accountId: r.account_id,
  startAt: r.start_at,
  tz: r.tz,
  createdBy: r.created_by,
  createdAt: r.created_at,
  archivedAt: r.archived_at,
});

// GET /api/tracks?projectId= — JOIN role-check + list with per-track
// draft_count, single round-trip. The count is folded in so the
// dashboard doesn't need a parallel /api/drafts fetch just to display
// totals.
app.get("/", async (c) => {
  const projectId = idSchema.safeParse(c.req.query("projectId"));
  if (!projectId.success) throw BadRequest("projectId required");
  const { results } = await c.env.DB
    .prepare(
      `SELECT t.id, t.project_id, t.name, t.description, t.account_id,
              t.start_at, t.tz, t.created_by, t.created_at, t.archived_at,
              pm.role AS my_role,
              (SELECT COUNT(*) FROM drafts d
                WHERE d.track_id = t.id AND d.archived_at IS NULL) AS draft_count
       FROM tracks t
       JOIN project_members pm
         ON pm.project_id = t.project_id AND pm.user_id = ?2
       WHERE t.project_id = ?1
       ORDER BY t.created_at DESC`,
    )
    .bind(projectId.data, c.var.user.id)
    .all<TrackRow & { my_role: string | null; draft_count: number }>();
  if (!results || results.length === 0) {
    // Could be "no tracks" or "no role" — distinguish with one cheap probe.
    const probe = await c.env.DB
      .prepare("SELECT 1 AS ok FROM project_members WHERE project_id = ?1 AND user_id = ?2 LIMIT 1")
      .bind(projectId.data, c.var.user.id)
      .first();
    if (!probe) throw NotFound("project not found or no access");
    return c.json({ tracks: [] });
  }
  const tracks: TrackSummary[] = results.map((r) => ({
    ...rawToTrack(r),
    draftCount: r.draft_count ?? 0,
  }));
  return c.json({ tracks });
});

// GET /api/tracks/:id — single JOIN with role-check.
app.get("/:id", async (c) => {
  const id = idSchema.safeParse(c.req.param("id"));
  if (!id.success) throw BadRequest("invalid id");
  const row = await c.env.DB
    .prepare(
      `SELECT t.id, t.project_id, t.name, t.description, t.account_id,
              t.start_at, t.tz, t.created_by, t.created_at, t.archived_at,
              pm.role AS my_role
       FROM tracks t
       LEFT JOIN project_members pm
         ON pm.project_id = t.project_id AND pm.user_id = ?2
       WHERE t.id = ?1`,
    )
    .bind(id.data, c.var.user.id)
    .first<TrackRow & { my_role: string | null }>();
  if (!row || !row.my_role) throw NotFound();
  return c.json({ track: rawToTrack(row) });
});

// POST /api/tracks
app.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createTrackSchema.safeParse(body);
  if (!parsed.success) throw BadRequest("invalid body", parsed.error.flatten());
  await requireRole(c.env.DB, parsed.data.projectId, c.var.user.id, "editor");

  const inserted = await db(c.env.DB)
    .insert(schema.tracks)
    .values({
      projectId: parsed.data.projectId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      accountId: parsed.data.accountId ?? null,
      startAt: parsed.data.startAt ?? null,
      tz: parsed.data.tz ?? null,
      createdBy: c.var.user.id,
    })
    .returning()
    .get();
  return c.json({ track: rowToTrack(inserted) }, 201);
});

// PATCH /api/tracks/:id — when start_at or tz changes, bulk-recompute
// scheduled_for on all drafts in the track that have an offset set.
app.patch("/:id", async (c) => {
  const id = idSchema.safeParse(c.req.param("id"));
  if (!id.success) throw BadRequest("invalid id");
  const body = await c.req.json().catch(() => null);
  const parsed = updateTrackSchema.safeParse(body);
  if (!parsed.success) throw BadRequest("invalid body", parsed.error.flatten());

  const d = db(c.env.DB);
  const existing = await d.select().from(schema.tracks).where(eq(schema.tracks.id, id.data)).get();
  if (!existing) throw NotFound();
  await requireRole(c.env.DB, existing.projectId, c.var.user.id, "editor");

  const startAtChanged = parsed.data.startAt !== undefined && parsed.data.startAt !== existing.startAt;

  const updated = await d
    .update(schema.tracks)
    .set({
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.accountId !== undefined ? { accountId: parsed.data.accountId } : {}),
      ...(parsed.data.startAt !== undefined ? { startAt: parsed.data.startAt } : {}),
      ...(parsed.data.tz !== undefined ? { tz: parsed.data.tz } : {}),
    })
    .where(eq(schema.tracks.id, id.data))
    .returning()
    .get();

  if (startAtChanged) {
    await recomputeTrackSchedules(c.env, updated);
  }
  return c.json({ track: rowToTrack(updated) });
});

// DELETE /api/tracks/:id — soft delete (archive). Refuses if track is
// not "Adhoc" but contains scheduled drafts; user must cancel them
// first or move them to another track.
app.delete("/:id", async (c) => {
  const id = idSchema.safeParse(c.req.param("id"));
  if (!id.success) throw BadRequest("invalid id");
  const d = db(c.env.DB);
  const existing = await d.select().from(schema.tracks).where(eq(schema.tracks.id, id.data)).get();
  if (!existing) throw NotFound();
  await requireRole(c.env.DB, existing.projectId, c.var.user.id, "editor");
  if (existing.name === "Adhoc") throw BadRequest("cannot delete the Adhoc track");

  const live = await d
    .select({ count: schema.drafts.id })
    .from(schema.drafts)
    .where(and(eq(schema.drafts.trackId, id.data), eq(schema.drafts.status, "scheduled")))
    .all();
  if (live.length) throw BadRequest("cancel scheduled drafts in this track first");

  await d
    .update(schema.tracks)
    .set({ archivedAt: new Date().toISOString() })
    .where(eq(schema.tracks.id, id.data))
    .run();
  return c.json({ ok: true });
});

export default app;
