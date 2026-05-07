// Seed: tapeline (measure_app) project + Product Hunt launch draft set.
// Source: ../measure_app/producthunt/{pre_launch_post,social_copy,first_comment}.md
//
// Unlike the paper-games seed, the source files mix multiple platforms in
// one document, so this script encodes each draft inline rather than
// parsing markdown.
//
// Usage:  bun api/scripts/seed-tapeline.mjs > api/scripts/seed-tapeline.sql
// Apply:  wrangler d1 execute smm --remote --file=api/scripts/seed-tapeline.sql

const SEED_EMAIL = "sangeet.verma91@gmail.com";
const SEED_SLUG = "tapeline";
const SEED_NAME = "Tapeline";
const SEED_DESC =
  "Tapeline — body measurement journal. iOS + Android. Product Hunt launch kit drafts.";

const sqlStr = (s) => "'" + String(s).replace(/'/g, "''") + "'";

const uuidv7 = () => {
  const ms = Date.now();
  const rnd = new Uint8Array(10);
  crypto.getRandomValues(rnd);
  const b = new Uint8Array(16);
  b[0] = (ms / 2 ** 40) & 0xff;
  b[1] = (ms / 2 ** 32) & 0xff;
  b[2] = (ms / 2 ** 24) & 0xff;
  b[3] = (ms / 2 ** 16) & 0xff;
  b[4] = (ms / 2 ** 8) & 0xff;
  b[5] = ms & 0xff;
  for (let i = 0; i < 10; i++) b[6 + i] = rnd[i];
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

const drafts = [
  {
    seq: 1,
    platform: "twitter",
    title: "T-2 — pre-launch X thread (5 tweets)",
    postKind: "thread",
    threadSegments: [
      `1/ I'm launching the thing I've been building for 3 years on Product Hunt this Wednesday.\n\nQuick recap of why, what, how — for the people who've followed along.\n\n🧵`,
      `2/ The why:\n\nStarted lifting weights 3 years ago. Stepped on the scale every morning. Useless number. Lost 4kg one month, gained 3kg the next, body looked the same in both. The scale was lying to me.\n\nStarted using a measuring tape. The numbers told the truth.`,
      `3/ Tried 5 apps to log the measurements. Hated all of them.\n\nOne demanded my email before showing me anything. One sold the data. One had a UI from 2014. None of them compared progress photos in any usable way.\n\nSo I started building.`,
      `4/ Tapeline is the result.\n\n30 seconds a day. Log weight + 10 body dimensions + wellness + (Pro) photos. Compare any two days side-by-side. Daily reminders that respect your timezone.\n\nNo social feed. No calorie tracker. No "share your transformation" wall.`,
      `5/ Launching Wednesday at 12:30 PM IST on @ProductHunt.\n\nIf you've been on this side of the timeline watching the build-in-public, the favor is small: drop a comment with your honest take. The harshest specific feedback wins a year of Pro.\n\nLink drops Wednesday.`,
    ],
    intendedTime: "T-2 days, 9:00 AM IST",
  },
  {
    seq: 2,
    platform: "linkedin",
    title: "T-2 — pre-launch LinkedIn post",
    body: `Three years of side-project work, one day of launch.\n\nWednesday I'm putting Tapeline on Product Hunt. It's a body measurement journal — log weight + body dimensions + photos in 30 seconds a day, see what's actually changing.\n\nThe honest reason it took 3 years: I shipped 4 versions, threw away 3, and the one I'm launching is the only one I'd want to use myself.\n\nIf you've been part of the journey — the testers, the brutal feedback, the "what if you tried X" — Wednesday is the day. I'll post the link Wednesday morning IST.\n\nCoffee shots welcome.`,
    intendedTime: "T-2 days, 9:00 AM CET",
  },
  {
    seq: 3,
    platform: "twitter",
    title: "Launch — X post 1 (the moment)",
    postKind: "tweet",
    body: `The thing I've been building for 3 years just went live on @ProductHunt 🥹\n\nTapeline: a 30-second-a-day body measurement journal. The bathroom scale doesn't tell you if you lost fat or muscle — Tapeline does.\n\nFirst comment is on PH 👇\n[PH link]`,
    intendedTime: "T0, 12:01 AM PT",
    referrerSlug: "ph_x",
  },
  {
    seq: 4,
    platform: "twitter",
    title: "Launch — X post 2 (Europe wakes up)",
    postKind: "tweet",
    body: `Tapeline is on Product Hunt today.\n\nThe pitch: stop trusting the scale. Log 10 body measurements + photos in 30s/day, see what's actually changing.\n\n7 hours in, [N] installs from PH, conversion looking decent.\n\n[PH link]`,
    intendedTime: "T0, 6:00 AM PT",
    referrerSlug: "ph_x",
  },
  {
    seq: 5,
    platform: "twitter",
    title: "Launch — X post 3 (US wakes up)",
    postKind: "tweet",
    body: `[N] hours into the @ProductHunt launch and Tapeline is at #[X] for the day. Comment thread has been gold — feature requests, bug reports, one user already at a 12-day streak.\n\nFree to try, $5/mo for photo tracking. iOS + Android.\n\n[PH link]`,
    intendedTime: "T0, 12:00 PM PT",
    referrerSlug: "ph_x",
  },
  {
    seq: 6,
    platform: "twitter",
    title: "Launch — X post 4 (closing out)",
    postKind: "tweet",
    body: `Closing out an exhausting day on PH. Whatever the rank turns out to be, the comments alone made it worth it.\n\nIf you tried Tapeline today — drop your honest take. Best feedback wins a free year of Pro.\n\n[PH link]`,
    intendedTime: "T0, 5:00 PM PT",
    referrerSlug: "ph_x",
  },
  {
    seq: 7,
    platform: "twitter",
    title: "Launch +1 — X results post",
    postKind: "tweet",
    body: `Day after PH:\n- #[X] product of the day\n- [N] installs, [M] paying\n- The "harshest feedback wins Pro" thing surfaced 3 features I'm building this week\n\nBig thanks to everyone who showed up. Onward.`,
    intendedTime: "T+1, 9:00 AM IST",
    referrerSlug: "ph_x",
  },
  {
    seq: 8,
    platform: "linkedin",
    title: "Launch — LinkedIn post",
    body: `3 years ago I started lifting weights and got annoyed that no app would track the *actual* changes — chest, waist, arms, hips. Just weight.\n\nSo I built one.\n\nTapeline launched on Product Hunt today. It's a 30-second-a-day body journal: log 10 measurements + photos, then compare any two days side-by-side. iOS + Android, free to use, $5/mo for photo tracking.\n\nThe hardest part wasn't the engineering — it was deciding what NOT to put in. No calorie tracking. No social feed. No "share your transformation". Just a quiet, private record of your body, week by week.\n\nIf that sounds like something you'd use, feedback is what makes a launch. Comment, install, gripe — all of it helps.\n\n[PH link]`,
    intendedTime: "T0, 9:00 AM CET",
    referrerSlug: "ph_linkedin",
  },
  {
    seq: 9,
    platform: "reddit",
    title: "I launched my body measurement app on Product Hunt today after 3 years of building",
    postKind: "self",
    subreddit: "SideProject",
    body: `Hey r/SideProject 👋 — long-time lurker, finally shipping something I've been on for years.\n\nTapeline is a 30-second-a-day body measurement journal. I built it because I tried five fitness apps when I started lifting and hated all of them — they wanted my email before I could see anything, the UI felt like 2014, and none compared photos side-by-side.\n\nToday's the Product Hunt launch. Sharing here because /r/SideProject was huge in my early validation — half my first 100 users came from a single post here a year ago.\n\n[PH link]\n\nFree to try, $5/mo for photo + comparison features. iOS + Android.\n\nWould love your honest take in the comments — that's what moves PH and what helps me decide what to build next.`,
    intendedTime: "T0, soon after launch",
    referrerSlug: "ph_reddit",
  },
  {
    seq: 10,
    platform: "instagram",
    title: "Launch — Instagram caption",
    postKind: "image",
    body: `3 years of building, 1 day to launch.\n\nTapeline is now on @producthunt 🚀\n\nThe honest body tracker — measurements + photos, daily.\nLink in bio.`,
    intendedTime: "T0, post launch",
    referrerSlug: "ph_ig",
  },
  {
    seq: 11,
    platform: "producthunt",
    title: "Launch — PH first comment (post within 60s of going live)",
    postKind: "first_comment",
    body: `Hey Product Hunt 👋\n\nI'm Sangeet, the maker of Tapeline.\n\nThree years ago I started lifting weights and using a tape to measure my arms, chest, waist — the stuff a scale never tells you. I tried five tracking apps and hated all of them. They wanted my email before they'd let me see anything, they sold the data, the UX was a 2014 fitness-tracker time capsule, and none of them actually compared photos side-by-side.\n\nSo I built Tapeline. **It's a 30-second-a-day body journal.** Log weight, 10 body dimensions, wellness scores, and (Pro) up to 3 progress photos. Then on any future date, you can compare any two days side-by-side — numbers + photos.\n\nWhat's different:\n- **Your photos stay yours.** Private by default. Only you can see them. Delete your account → they're gone within seconds.\n- **Built for the daily 30 seconds, not the once-a-month splurge.** Onboarding is two taps. Logging is the dashboard, not a 6-step form.\n- **Streaks + smart reminders.** Pick daily / weekly / biweekly, your timezone, your quiet hours. The app shuts up when you're asleep.\n\nWhat's free: daily logging, calendar view, weight + 10 measurements, wellness scores, streaks, dashboard charts.\nWhat's Pro ($5/mo): photo upload, photo compare, CSV export.\n\nI'd love feedback on **two specific things:**\n1. Does the comparison view feel like the most honest mirror you've had, or just another chart?\n2. The "30-second daily check-in" claim — does the onboarding actually deliver that on day one, or am I lying to myself?\n\n📱 iOS: https://apps.apple.com/in/app/tapeline-body-tracker/id6762095383\n📱 Android: https://play.google.com/store/apps/details?id=fit.measures.tapeline\n🌐 Web: https://measures.fit\n\nI'll be in this thread all day — drop questions, gripes, feature requests. The harshest feedback wins a free year of Pro 🎯\n\n— Sangeet`,
    intendedTime: "T0, within 60 seconds of going live",
  },
];

// ── build SQL ────────────────────────────────────────────────────────
const userId = uuidv7();
const projectId = uuidv7();

const lines = [];
lines.push("-- Seed: tapeline (measure_app) project + Product Hunt launch drafts");
lines.push("-- Generated by api/scripts/seed-tapeline.mjs");
lines.push("");
lines.push("-- 1. user");
lines.push(
  `INSERT OR IGNORE INTO users (id, email) VALUES (${sqlStr(userId)}, ${sqlStr(SEED_EMAIL)});`,
);
lines.push("");
lines.push("-- 2. project");
lines.push(
  `INSERT OR IGNORE INTO projects (id, slug, name, description, owner_id) ` +
    `SELECT ${sqlStr(projectId)}, ${sqlStr(SEED_SLUG)}, ${sqlStr(SEED_NAME)}, ${sqlStr(SEED_DESC)}, id ` +
    `FROM users WHERE email = ${sqlStr(SEED_EMAIL)};`,
);
lines.push("");
lines.push("-- 3. owner membership");
lines.push(
  `INSERT OR REPLACE INTO project_members (project_id, user_id, role) ` +
    `SELECT p.id, u.id, 'owner' FROM projects p JOIN users u ON u.email = ${sqlStr(SEED_EMAIL)} ` +
    `WHERE p.slug = ${sqlStr(SEED_SLUG)};`,
);
lines.push("");
lines.push("-- 4. drafts (idempotent on title)");

for (const d of drafts) {
  const platformOpts = buildPlatformOptions(d);
  const body = d.body ?? (d.threadSegments ? d.threadSegments.join("\n\n") : "");
  const draftId = uuidv7();
  lines.push(
    `INSERT INTO drafts (id, project_id, account_id, status, title, body, body_format, platform_options, created_by) ` +
      `SELECT ${sqlStr(draftId)}, p.id, NULL, 'draft', ${sqlStr(d.title)}, ${sqlStr(body)}, 'markdown', ${sqlStr(JSON.stringify(platformOpts))}, u.id ` +
      `FROM projects p JOIN users u ON u.email = ${sqlStr(SEED_EMAIL)} ` +
      `WHERE p.slug = ${sqlStr(SEED_SLUG)} ` +
      `  AND NOT EXISTS (SELECT 1 FROM drafts d WHERE d.project_id = p.id AND d.title = ${sqlStr(d.title)});`,
  );
}
lines.push("");

console.log(lines.join("\n"));

function buildPlatformOptions(d) {
  const base = {
    seedSequence: d.seq,
    seedIntendedTime: d.intendedTime,
    ...(d.referrerSlug ? { seedReferrerSlug: d.referrerSlug } : {}),
  };
  switch (d.platform) {
    case "twitter":
      return {
        ...base,
        postKind: d.postKind,
        ...(d.threadSegments
          ? { threadSegments: d.threadSegments.map((t) => ({ text: t, mediaIds: [] })) }
          : {}),
      };
    case "linkedin":
      return { ...base, authorType: "person", visibility: "PUBLIC", postKind: "text" };
    case "reddit":
      return { ...base, postKind: d.postKind, subreddit: d.subreddit };
    case "instagram":
      return { ...base, postKind: d.postKind, shareToFeed: true };
    default:
      return base;
  }
}
