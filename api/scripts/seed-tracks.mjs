// One-shot: populate sequence_in_track + track_offset_minutes for the
// existing seeded drafts, and set track.start_at on the named tracks
// to next week. Idempotent — re-running just updates the same rows.
//
// Usage:  bun api/scripts/seed-tracks.mjs > api/scripts/seed-tracks.sql
// Apply:  wrangler d1 execute smm --remote --file=api/scripts/seed-tracks.sql

const sqlStr = (s) => "'" + String(s).replace(/'/g, "''") + "'";

// ── compute next-week dates in IST, output as UTC ISO ───────────────
// Next Monday 18:30 IST  (paper-games Reddit launch)
// Next Wednesday 12:30 IST  (tapeline Product Hunt launch)
const nextDayAtTimeIST = (targetDow, hour, minute) => {
  // IST is UTC+5:30, no DST. Compute today's IST date, find the next
  // matching weekday (≥ 1 day in the future), then build an ISO.
  const ms = Date.now();
  const istNowMs = ms + (5 * 60 + 30) * 60_000;
  const istNow = new Date(istNowMs);
  const istDow = istNow.getUTCDay(); // 0 = Sun, 1 = Mon, ...
  let delta = (targetDow - istDow + 7) % 7;
  if (delta === 0) delta = 7; // strictly future, not today
  const istTarget = new Date(istNowMs);
  istTarget.setUTCDate(istNow.getUTCDate() + delta);
  istTarget.setUTCHours(hour, minute, 0, 0);
  // Convert IST → UTC: subtract 5:30
  return new Date(istTarget.getTime() - (5 * 60 + 30) * 60_000).toISOString();
};

const PAPER_START = nextDayAtTimeIST(1, 18, 30); // next Monday 18:30 IST
const TAPELINE_START = nextDayAtTimeIST(3, 12, 30); // next Wednesday 12:30 IST

// ── per-draft offsets ───────────────────────────────────────────────
// Paper-games (Reddit launch): one post per day from start, 18:30 IST.
//   sequence 1 → offset 0 days
//   sequence 2 → offset 1 day
//   ... per `paper_games/app_distribution/reddit/plan.md`
const paperOffset = (seq) => (seq - 1) * 24 * 60;

// Tapeline (Product Hunt launch): launch start = Wednesday 12:30 IST.
// Each draft's offset is *minutes* from that anchor, derived from its
// `seedIntendedTime` in seed-tapeline.mjs:
const tapelineOffset = (seq) =>
  ({
    1: -2 * 24 * 60 - 3 * 60 - 30, // T-2 days, 9:00 AM IST  → -2d, -3:30 from 12:30
    2: -2 * 24 * 60 + 60,          // T-2 days, 9:00 AM CET  → CET ≈ IST-4:30; 9 CET = 13:30 IST → -2d +1h
    3: 0,                          // T0, 12:01 AM PT (≈ launch moment)
    4: 6 * 60,                     // T0, 6:00 AM PT  → ~ +6h (IST-equivalent intent)
    5: 12 * 60,                    // T0, noon PT     → +12h
    6: 17 * 60,                    // T0, 5:00 PM PT  → +17h
    7: 24 * 60,                    // T+1, 9:00 AM IST → +1d (approx)
    8: 60,                         // T0, 9:00 AM CET (LinkedIn launch) → +1h
    9: 30,                         // T0, soon after launch (Reddit)
    10: 60,                        // T0, post launch (IG)
    11: 0,                         // T0, within 60s of going live (PH first comment)
  })[seq] ?? null;

// ── emit SQL ────────────────────────────────────────────────────────
const lines = [];
lines.push(`-- Seed tracks: populate sequence + offsets + start dates.`);
lines.push(`-- paper-games "Reddit launch"      → start ${PAPER_START}`);
lines.push(`-- tapeline    "Product Hunt launch" → start ${TAPELINE_START}`);
lines.push("");

// 1. populate sequence_in_track from json platformOptions.seedSequence
lines.push(
  `UPDATE drafts SET sequence_in_track = CAST(json_extract(platform_options, '$.seedSequence') AS REAL) WHERE json_extract(platform_options, '$.seedSequence') IS NOT NULL;`,
);
lines.push("");

// 2. set start_at on the two named tracks
lines.push(
  `UPDATE tracks SET start_at = ${sqlStr(PAPER_START)}, tz = 'Asia/Kolkata' WHERE name = 'Reddit launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'paper-games');`,
);
lines.push(
  `UPDATE tracks SET start_at = ${sqlStr(TAPELINE_START)}, tz = 'Asia/Kolkata' WHERE name = 'Product Hunt launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'tapeline');`,
);
lines.push("");

// 3. populate track_offset_minutes per draft, keyed on track name + seq.
// paper-games — sequential:
for (let seq = 1; seq <= 10; seq++) {
  lines.push(
    `UPDATE drafts SET track_offset_minutes = ${paperOffset(seq)} ` +
      `WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Reddit launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'paper-games')) ` +
      `  AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = ${seq};`,
  );
}
// tapeline — irregular:
for (let seq = 1; seq <= 11; seq++) {
  const off = tapelineOffset(seq);
  if (off == null) continue;
  lines.push(
    `UPDATE drafts SET track_offset_minutes = ${off} ` +
      `WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Product Hunt launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'tapeline')) ` +
      `  AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = ${seq};`,
  );
}
lines.push("");

// 4. recompute scheduled_for + scheduled_tz from track.start_at + offset
lines.push(`-- recompute scheduled_for from track.start_at + offset (UTC math via SQLite datetime modifier)`);
lines.push(
  `UPDATE drafts SET ` +
    `scheduled_for = (SELECT datetime(t.start_at, (drafts.track_offset_minutes || ' minutes')) FROM tracks t WHERE t.id = drafts.track_id), ` +
    `scheduled_tz  = (SELECT t.tz FROM tracks t WHERE t.id = drafts.track_id) ` +
    `WHERE drafts.track_offset_minutes IS NOT NULL ` +
    `  AND EXISTS (SELECT 1 FROM tracks t WHERE t.id = drafts.track_id AND t.start_at IS NOT NULL);`,
);
lines.push("");

console.log(lines.join("\n"));
