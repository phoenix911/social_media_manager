// Unauthenticated public media route — gated by HMAC signature in the
// query string. Mounted BEFORE requireUser so external services can
// fetch the bytes (e.g. Instagram's container API pulls the image URL
// at publish time).
//
// Sister helper: lib/media-signing.ts → signMediaUrl().

import { Hono } from "hono";
import type { Env } from "../env.ts";
import { verifyMediaSig } from "../lib/media-signing.ts";

const app = new Hono<{ Bindings: Env }>();

interface MediaRow {
  r2_key: string;
  mime: string;
  filename: string;
}

app.get("/:mediaId", async (c) => {
  const mediaId = c.req.param("mediaId");
  const expStr = c.req.query("exp");
  const sig = c.req.query("sig");
  if (!expStr || !sig) return c.text("missing exp or sig", 400);
  const exp = Number(expStr);
  const ok = await verifyMediaSig(c.env, mediaId, exp, sig);
  if (!ok) return c.text("forbidden", 403);

  const row = await c.env.DB
    .prepare("SELECT r2_key, mime, filename FROM media WHERE id = ? AND deleted_at IS NULL")
    .bind(mediaId)
    .first<MediaRow>();
  if (!row) return c.text("not found", 404);

  const obj = await c.env.MEDIA.get(row.r2_key);
  if (!obj) return c.text("gone", 410);

  return new Response(obj.body, {
    headers: {
      "Content-Type": row.mime || "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename="${row.filename}"`,
    },
  });
});

export default app;
