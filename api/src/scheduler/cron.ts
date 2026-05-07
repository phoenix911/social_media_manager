// Cron handler: runs every minute. Atomically claims due drafts
// (status='scheduled' AND scheduled_for<=now) by transitioning them to
// 'publishing' and pushing a job onto PUBLISH_QUEUE.

import { and, eq, lte, sql } from "drizzle-orm";
import type { Env } from "../env.ts";
import { db, schema } from "../db/index.ts";

export const runScheduler = async (env: Env): Promise<void> => {
  if (!env.PUBLISH_QUEUE) {
    console.warn("scheduler: PUBLISH_QUEUE not bound; skipping");
    return;
  }
  const d = db(env.DB);
  const now = new Date().toISOString();

  const due = await d
    .select({ id: schema.drafts.id })
    .from(schema.drafts)
    .where(
      and(
        eq(schema.drafts.status, "scheduled"),
        lte(schema.drafts.scheduledFor, now),
      ),
    )
    .limit(50)
    .all();

  for (const { id } of due) {
    // Atomic claim: only transition if still 'scheduled'.
    const r = await env.DB.prepare(
      "UPDATE drafts SET status='publishing', updated_at=datetime('now') WHERE id=? AND status='scheduled'",
    )
      .bind(id)
      .run();
    if (r.meta?.changes !== 1) continue; // someone else claimed it
    await env.PUBLISH_QUEUE.send({ draftId: id });
  }

  // Audit-log a single row per cron tick if we actioned anything.
  if (due.length) {
    await d.insert(schema.auditLog).values({
      action: "scheduler.tick",
      targetType: "draft",
      payload: JSON.stringify({ enqueued: due.length, at: now }),
    } as typeof schema.auditLog.$inferInsert).run();
  }

  void sql; // re-export keeper
};
