// Track schedule recompute. When a track's start_at moves, every draft
// in the track whose status is still mutable (draft/ready/scheduled)
// AND has a non-null trackOffsetMinutes gets its scheduled_for shifted.

import { and, eq, inArray } from "drizzle-orm";
import type { Env } from "../env.ts";
import { db, schema } from "../db/index.ts";

const MUTABLE_STATUSES = ["draft", "ready", "scheduled"] as const;

export const recomputeTrackSchedules = async (
  env: Env,
  track: { id: string; startAt: string | null; tz: string | null },
): Promise<{ updated: number }> => {
  const d = db(env.DB);
  const drafts = await d
    .select({
      id: schema.drafts.id,
      status: schema.drafts.status,
      offset: schema.drafts.trackOffsetMinutes,
    })
    .from(schema.drafts)
    .where(
      and(
        eq(schema.drafts.trackId, track.id),
        inArray(schema.drafts.status, [...MUTABLE_STATUSES]),
      ),
    )
    .all();

  let updated = 0;
  for (const r of drafts) {
    if (r.offset == null) continue;
    const newSched = computeScheduledFor(track.startAt, r.offset);
    await d
      .update(schema.drafts)
      .set({
        scheduledFor: newSched,
        scheduledTz: track.tz ?? null,
        updatedAt: new Date().toISOString(),
        // If start_at was unset, drop the post out of "scheduled".
        ...(newSched == null && r.status === "scheduled" ? { status: "draft" } : {}),
      })
      .where(eq(schema.drafts.id, r.id))
      .run();
    updated++;
  }
  return { updated };
};

export const computeScheduledFor = (
  trackStartAt: string | null,
  offsetMinutes: number | null,
): string | null => {
  if (!trackStartAt || offsetMinutes == null) return null;
  const start = Date.parse(trackStartAt);
  if (Number.isNaN(start)) return null;
  return new Date(start + offsetMinutes * 60_000).toISOString();
};
