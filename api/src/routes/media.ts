// Media routes — upload + read + attach to drafts.

import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { idSchema, type Media } from "@smm/shared";
import type { Env } from "../env.ts";
import { db, schema } from "../db/index.ts";
import { BadRequest, NotFound } from "../lib/errors.ts";
import { requireRole } from "../lib/projects.ts";

const app = new Hono<{ Bindings: Env }>();

const uploadUrlSchema = z.object({
  projectId: idSchema,
  filename: z.string().min(1).max(200),
  mime: z.string().min(1).max(100),
  bytes: z.number().int().positive().max(200 * 1024 * 1024), // 200 MB cap
});

const rowToMedia = (r: typeof schema.media.$inferSelect): Media => ({
  id: r.id,
  projectId: r.projectId,
  r2Key: r.r2Key,
  filename: r.filename,
  mime: r.mime,
  bytes: r.bytes,
  width: r.width,
  height: r.height,
  durationMs: r.durationMs,
  uploadedBy: r.uploadedBy,
  createdAt: r.createdAt,
});

// Step 1: reserve a media row + return the upload endpoint.
app.post("/upload-url", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = uploadUrlSchema.safeParse(body);
  if (!parsed.success) throw BadRequest("invalid body", parsed.error.flatten());
  await requireRole(c.env.DB, parsed.data.projectId, c.var.user.id, "editor");

  const d = db(c.env.DB);
  const ext = parsed.data.filename.includes(".") ? parsed.data.filename.split(".").pop() : "";
  const inserted = await d
    .insert(schema.media)
    .values({
      projectId: parsed.data.projectId,
      r2Key: `media/${parsed.data.projectId}/${crypto.randomUUID()}${ext ? "." + ext : ""}`,
      filename: parsed.data.filename,
      mime: parsed.data.mime,
      bytes: parsed.data.bytes,
      uploadedBy: c.var.user.id,
    })
    .returning()
    .get();

  return c.json({
    mediaId: inserted.id,
    uploadUrl: `/api/media/${inserted.id}/blob`,
    method: "PUT",
  });
});

// Step 2: client streams the binary in via PUT.
app.put("/:id/blob", async (c) => {
  const id = idSchema.safeParse(c.req.param("id"));
  if (!id.success) throw BadRequest("invalid id");

  const d = db(c.env.DB);
  const row = await d.select().from(schema.media).where(eq(schema.media.id, id.data)).get();
  if (!row) throw NotFound();
  await requireRole(c.env.DB, row.projectId, c.var.user.id, "editor");

  const stream = c.req.raw.body;
  if (!stream) throw BadRequest("empty body");
  await c.env.MEDIA.put(row.r2Key, stream, {
    httpMetadata: { contentType: row.mime },
  });
  return c.json({ ok: true });
});

// GET /api/media/:id — metadata
app.get("/:id", async (c) => {
  const id = idSchema.safeParse(c.req.param("id"));
  if (!id.success) throw BadRequest("invalid id");
  const row = await db(c.env.DB).select().from(schema.media).where(eq(schema.media.id, id.data)).get();
  if (!row) throw NotFound();
  await requireRole(c.env.DB, row.projectId, c.var.user.id, "viewer");
  return c.json({ media: rowToMedia(row) });
});

// GET /api/media/:id/blob — proxy R2 byte stream so the browser can
// render <img>/<video>. CF Access already gates the origin, so the
// blob inherits the same auth.
app.get("/:id/blob", async (c) => {
  const id = idSchema.safeParse(c.req.param("id"));
  if (!id.success) throw BadRequest("invalid id");
  const row = await db(c.env.DB).select().from(schema.media).where(eq(schema.media.id, id.data)).get();
  if (!row) throw NotFound();
  await requireRole(c.env.DB, row.projectId, c.var.user.id, "viewer");

  const obj = await c.env.MEDIA.get(row.r2Key);
  if (!obj) throw NotFound();
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("Cache-Control", "private, max-age=300");
  if (!headers.has("Content-Type") && row.mime) headers.set("Content-Type", row.mime);
  return new Response(obj.body, { headers });
});

// DELETE /api/media/:id — soft-delete + remove from R2.
app.delete("/:id", async (c) => {
  const id = idSchema.safeParse(c.req.param("id"));
  if (!id.success) throw BadRequest("invalid id");
  const row = await db(c.env.DB).select().from(schema.media).where(eq(schema.media.id, id.data)).get();
  if (!row) throw NotFound();
  await requireRole(c.env.DB, row.projectId, c.var.user.id, "editor");

  await c.env.MEDIA.delete(row.r2Key).catch(() => {});
  await db(c.env.DB)
    .update(schema.media)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(schema.media.id, id.data))
    .run();
  return c.json({ ok: true });
});

// Attach + detach for a specific draft (the draft_media junction).
const attachSchema = z.object({ position: z.number().int().min(0).default(0), caption: z.string().max(2200).nullable().optional() });

app.post("/draft/:draftId/:mediaId", async (c) => {
  const draftId = idSchema.safeParse(c.req.param("draftId"));
  const mediaId = idSchema.safeParse(c.req.param("mediaId"));
  if (!draftId.success || !mediaId.success) throw BadRequest("invalid id");
  const body = await c.req.json().catch(() => ({}));
  const parsed = attachSchema.safeParse(body);
  if (!parsed.success) throw BadRequest("invalid body", parsed.error.flatten());

  const d = db(c.env.DB);
  const draft = await d.select().from(schema.drafts).where(eq(schema.drafts.id, draftId.data)).get();
  const media = await d.select().from(schema.media).where(eq(schema.media.id, mediaId.data)).get();
  if (!draft || !media) throw NotFound();
  if (draft.projectId !== media.projectId) throw BadRequest("draft and media in different projects");
  await requireRole(c.env.DB, draft.projectId, c.var.user.id, "editor");

  await d
    .insert(schema.draftMedia)
    .values({
      draftId: draftId.data,
      mediaId: mediaId.data,
      position: parsed.data.position,
      caption: parsed.data.caption ?? null,
    })
    .onConflictDoUpdate({
      target: [schema.draftMedia.draftId, schema.draftMedia.mediaId],
      set: { position: parsed.data.position, caption: parsed.data.caption ?? null },
    })
    .run();
  return c.json({ ok: true });
});

app.delete("/draft/:draftId/:mediaId", async (c) => {
  const draftId = idSchema.safeParse(c.req.param("draftId"));
  const mediaId = idSchema.safeParse(c.req.param("mediaId"));
  if (!draftId.success || !mediaId.success) throw BadRequest("invalid id");
  const d = db(c.env.DB);
  const draft = await d.select().from(schema.drafts).where(eq(schema.drafts.id, draftId.data)).get();
  if (!draft) throw NotFound();
  await requireRole(c.env.DB, draft.projectId, c.var.user.id, "editor");
  await d
    .delete(schema.draftMedia)
    .where(and(eq(schema.draftMedia.draftId, draftId.data), eq(schema.draftMedia.mediaId, mediaId.data)))
    .run();
  return c.json({ ok: true });
});

// GET /api/media/draft/:draftId — list media attached to a draft, ordered.
app.get("/draft/:draftId", async (c) => {
  const draftId = idSchema.safeParse(c.req.param("draftId"));
  if (!draftId.success) throw BadRequest("invalid id");
  const d = db(c.env.DB);
  const draft = await d.select().from(schema.drafts).where(eq(schema.drafts.id, draftId.data)).get();
  if (!draft) throw NotFound();
  await requireRole(c.env.DB, draft.projectId, c.var.user.id, "viewer");
  const rows = await d
    .select({
      media: schema.media,
      position: schema.draftMedia.position,
      caption: schema.draftMedia.caption,
    })
    .from(schema.draftMedia)
    .innerJoin(schema.media, eq(schema.media.id, schema.draftMedia.mediaId))
    .where(eq(schema.draftMedia.draftId, draftId.data))
    .orderBy(schema.draftMedia.position)
    .all();
  return c.json({
    items: rows.map((r) => ({ media: rowToMedia(r.media), position: r.position, caption: r.caption })),
  });
});

export default app;
