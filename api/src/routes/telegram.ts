// Telegram inbound webhook. Path:
//   POST /api/telegram/<TELEGRAM_WEBHOOK_SECRET>
//
// CF Access has a bypass policy for /api/telegram/* (Telegram can't
// authenticate with Access). The path-secret + chat-id allowlist do
// the auth here.
//
// Commands:
//   /start, /help, /whoami     — onboarding
//   /projects                  — list projects with inline buttons
//   /scheduled                 — list next 10 scheduled drafts (cross-project)
//   /cancel <draft_id>         — cancel a scheduled draft
//   /retry <draft_id>          — re-enqueue a failed draft
//
// Inline-button callbacks (callback_data formats):
//   p:<slug>                   — show drafts in a project
//   d:<draft_id>               — show a draft's details
//   d:<id>:cancel              — cancel a scheduled draft
//   d:<id>:retry               — retry a failed draft
//   back                       — back to project list

import { Hono } from "hono";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import type { Env } from "../env.ts";
import { db, schema } from "../db/index.ts";
import {
  sendTelegramMessage,
  editTelegramMessage,
  answerCallbackQuery,
  type ReplyMarkup,
} from "../notifications/telegram.ts";

const app = new Hono<{ Bindings: Env }>();

interface TgUpdate {
  message?: {
    chat: { id: number };
    from: { id: number; username?: string };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number; username?: string };
    message?: { chat: { id: number }; message_id: number };
    data?: string;
  };
}

const HELP_TEXT = "<b>SMM bot</b> — pick one:";

const HELP_KEYBOARD: ReplyMarkup = {
  inline_keyboard: [
    [{ text: "📅 Today", callback_data: "menu:today" }],
    [{ text: "🗓 Scheduled", callback_data: "menu:scheduled" }],
    [{ text: "📁 Projects", callback_data: "menu:projects" }],
    [{ text: "👤 Who am I", callback_data: "menu:whoami" }],
  ],
};

// Allowlist accepts both numeric chat ids ("6566454636") and Telegram
// usernames prefixed with "@" ("@sangeetverma"). Matching is exact for
// chat ids and case-insensitive for usernames. Empty allowlist means
// "deny everyone" — explicit safer default than "allow everyone".
const isAllowed = (env: Env, chatId: string, username?: string | null): boolean => {
  const raw = env.TELEGRAM_ALLOWED_CHAT_IDS || "";
  const tokens = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (!tokens.length) return false;
  const u = (username || "").toLowerCase();
  for (const t of tokens) {
    if (t.startsWith("@")) {
      if (u && u === t.slice(1).toLowerCase()) return true;
    } else if (t === chatId) {
      return true;
    }
  }
  return false;
};

app.post("/:secret", async (c) => {
  const secret = c.req.param("secret");
  if (!c.env.TELEGRAM_BOT_TOKEN || !c.env.TELEGRAM_WEBHOOK_SECRET) {
    return c.json({ ok: false, reason: "not configured" }, 503);
  }
  // Layer 1: path secret (always required — the URL itself is auth).
  if (secret !== c.env.TELEGRAM_WEBHOOK_SECRET) return c.json({ ok: false }, 401);
  // Layer 2: Telegram-injected header. Telegram sends
  // `X-Telegram-Bot-Api-Secret-Token` on every webhook delivery if a
  // secret_token was set during setWebhook. We register the same value
  // as the URL secret, so a forged direct-POST (someone who learned
  // the URL) will still fail this check.
  const headerSecret = c.req.header("X-Telegram-Bot-Api-Secret-Token");
  if (headerSecret && headerSecret !== c.env.TELEGRAM_WEBHOOK_SECRET) {
    return c.json({ ok: false }, 401);
  }

  const update = (await c.req.json().catch(() => null)) as TgUpdate | null;
  if (!update) return c.json({ ok: true });

  // ── inline-button callback ─────────────────────────────────────────
  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = String(cb.message?.chat.id ?? cb.from.id);
    if (!isAllowed(c.env, chatId, cb.from.username)) {
      await answerCallbackQuery(c.env, cb.id, "Unauthorized");
      return c.json({ ok: true });
    }
    const data = cb.data ?? "";
    const messageId = cb.message?.message_id ?? 0;
    await handleCallback(c.env, chatId, messageId, data, cb.id);
    return c.json({ ok: true });
  }

  // ── message / command ──────────────────────────────────────────────
  const msg = update.message;
  if (!msg?.text) return c.json({ ok: true });
  const chatId = String(msg.chat.id);
  if (!isAllowed(c.env, chatId, msg.from.username)) {
    const handle = msg.from.username ? `@${msg.from.username}` : "(no username set)";
    await sendTelegramMessage(
      c.env,
      chatId,
      `Sorry, this bot is private.\nYour chat id: <code>${chatId}</code>\nYour username: <code>${esc(handle)}</code>`,
    );
    return c.json({ ok: true });
  }

  // Capture chat_id ↔ username so reminders can target @usernames.
  if (msg.from.username) {
    await c.env.KV.put(
      `tg:chat_by_username:${msg.from.username.toLowerCase()}`,
      chatId,
      // 1 year — refreshed on every message
      { expirationTtl: 60 * 60 * 24 * 365 },
    ).catch(() => {});
  }

  const text = msg.text.trim();
  const [cmd, ...args] = text.split(/\s+/);
  await handleCommand(c.env, chatId, cmd ?? "", args);
  return c.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────

const handleCommand = async (env: Env, chatId: string, cmd: string, args: string[]): Promise<void> => {
  switch (cmd) {
    case "/start":
    case "/help":
      await sendTelegramMessage(env, chatId, HELP_TEXT, HELP_KEYBOARD);
      return;
    case "/whoami":
      await sendTelegramMessage(env, chatId, `Your chat id: <code>${chatId}</code>`);
      return;
    case "/projects":
      await showProjects(env, chatId);
      return;
    case "/scheduled":
      await showScheduled(env, chatId);
      return;
    case "/today":
      await showToday(env, chatId);
      return;
    case "/cancel":
      await runCancel(env, chatId, args[0]);
      return;
    case "/retry":
      await runRetry(env, chatId, args[0]);
      return;
    default:
      await sendTelegramMessage(env, chatId, `Unknown command — pick one:`, HELP_KEYBOARD);
  }
};

const handleCallback = async (
  env: Env,
  chatId: string,
  messageId: number,
  data: string,
  cbId: string,
): Promise<void> => {
  // p:<slug>             — show drafts in project
  // d:<id>               — show draft detail
  // d:<id>:cancel|retry  — action on draft
  // back                 — back to projects
  await answerCallbackQuery(env, cbId);
  if (data === "back" || data === "menu:projects") {
    await showProjects(env, chatId, messageId);
    return;
  }
  if (data === "menu:scheduled") {
    await showScheduled(env, chatId, messageId);
    return;
  }
  if (data === "menu:today") {
    await showToday(env, chatId, messageId);
    return;
  }
  if (data === "menu:whoami") {
    await editTelegramMessage(env, chatId, messageId, `Your chat id: <code>${chatId}</code>`, HELP_KEYBOARD);
    return;
  }
  if (data === "menu:help") {
    await editTelegramMessage(env, chatId, messageId, HELP_TEXT, HELP_KEYBOARD);
    return;
  }
  if (data.startsWith("p:")) {
    const slug = data.slice(2);
    await showProjectDrafts(env, chatId, slug, messageId);
    return;
  }
  if (data.startsWith("d:")) {
    const parts = data.slice(2).split(":");
    const id = parts[0]!;
    const action = parts[1];
    if (action === "cancel") {
      await runCancel(env, chatId, id, messageId);
      return;
    }
    if (action === "retry") {
      await runRetry(env, chatId, id, messageId);
      return;
    }
    await showDraftDetail(env, chatId, id, messageId);
    return;
  }
};

// ── project list ─────────────────────────────────────────────────────
const showProjects = async (env: Env, chatId: string, messageId?: number): Promise<void> => {
  const rows = await db(env.DB).select().from(schema.projects).orderBy(schema.projects.name).all();
  if (!rows.length) {
    await sendTelegramMessage(env, chatId, "No projects yet. Create one in the web app.");
    return;
  }
  const text = `<b>Projects</b>\n${rows.length} project${rows.length === 1 ? "" : "s"}.`;
  const buttons: ReplyMarkup["inline_keyboard"] = rows.map((p) => [
    { text: p.name, callback_data: `p:${p.slug}` },
  ]);
  buttons.push([{ text: "← menu", callback_data: "menu:help" }]);
  const kb: ReplyMarkup = { inline_keyboard: buttons };
  if (messageId) await editTelegramMessage(env, chatId, messageId, text, kb);
  else await sendTelegramMessage(env, chatId, text, kb);
};

// ── drafts in one project ────────────────────────────────────────────
const showProjectDrafts = async (env: Env, chatId: string, slug: string, messageId?: number): Promise<void> => {
  const project = await db(env.DB).select().from(schema.projects).where(eq(schema.projects.slug, slug)).get();
  if (!project) {
    await sendTelegramMessage(env, chatId, `Project not found: ${slug}`);
    return;
  }
  const drafts = await db(env.DB)
    .select()
    .from(schema.drafts)
    .where(eq(schema.drafts.projectId, project.id))
    .orderBy(desc(schema.drafts.updatedAt))
    .limit(20)
    .all();

  const text =
    `<b>${esc(project.name)}</b>\n` +
    (drafts.length === 0 ? "No drafts." : `${drafts.length} draft${drafts.length === 1 ? "" : "s"}.`);
  const buttons = drafts.map((d) => [
    {
      text: `${statusEmoji(d.status)} ${(d.title || "(untitled)").slice(0, 50)}`,
      callback_data: `d:${d.id}`,
    },
  ]);
  buttons.push([{ text: "← back to projects", callback_data: "back" }]);
  const kb: ReplyMarkup = { inline_keyboard: buttons };

  if (messageId) await editTelegramMessage(env, chatId, messageId, text, kb);
  else await sendTelegramMessage(env, chatId, text, kb);
};

// ── one draft detail ─────────────────────────────────────────────────
const showDraftDetail = async (env: Env, chatId: string, id: string, messageId?: number): Promise<void> => {
  const d = await db(env.DB).select().from(schema.drafts).where(eq(schema.drafts.id, id)).get();
  if (!d) {
    await sendTelegramMessage(env, chatId, `Draft not found.`);
    return;
  }
  const project = await db(env.DB).select().from(schema.projects).where(eq(schema.projects.id, d.projectId)).get();
  const opts = d.platformOptions ? (JSON.parse(d.platformOptions) as Record<string, unknown>) : null;
  const platform = inferPlatform(opts);
  const title = d.title || "(untitled)";
  const bodyPreview = (d.body || "").slice(0, 600);

  const lines = [
    `<b>${esc(title)}</b>`,
    `<i>${project?.name ?? "?"}</i> · ${platform ?? "no platform"} · ${statusEmoji(d.status)} ${d.status}`,
  ];
  if (d.scheduledFor) lines.push(`scheduled for: <code>${esc(d.scheduledFor)}</code>`);
  lines.push("", `<pre>${esc(bodyPreview)}</pre>`);
  if (d.body && d.body.length > 600) lines.push("…");

  const actions: ReplyMarkup["inline_keyboard"] = [];
  if (d.status === "scheduled") actions.push([{ text: "✗ cancel", callback_data: `d:${d.id}:cancel` }]);
  if (d.status === "failed") actions.push([{ text: "↻ retry", callback_data: `d:${d.id}:retry` }]);
  if (project) {
    actions.push([
      { text: "open in web", url: `https://${env.APP_HOSTNAME}/p/${project.slug}/draft/${d.id}` },
    ]);
    actions.push([{ text: "← back to drafts", callback_data: `p:${project.slug}` }]);
  }

  const kb: ReplyMarkup = { inline_keyboard: actions };
  if (messageId) await editTelegramMessage(env, chatId, messageId, lines.join("\n"), kb);
  else await sendTelegramMessage(env, chatId, lines.join("\n"), kb);
};

// ── /today: anything scheduled for today (any status) ───────────────
// "Today" = the calendar day in env.DEFAULT_TZ (defaults to IST). We
// compute the day window in UTC by anchoring to the IST offset; SQLite
// `date(scheduled_for, '+05:30')` keeps it correct without server-side
// JS arithmetic. If we ever support per-user timezones, switch this.
const showToday = async (env: Env, chatId: string, messageId?: number): Promise<void> => {
  const tzOffset = "+05:30"; // IST
  const rows = await db(env.DB)
    .select()
    .from(schema.drafts)
    .where(
      and(
        // any status — show what's happening today, not just upcoming
        sql`${schema.drafts.scheduledFor} IS NOT NULL`,
        sql`date(${schema.drafts.scheduledFor}, ${tzOffset}) = date('now', ${tzOffset})`,
      ),
    )
    .orderBy(schema.drafts.scheduledFor)
    .all();

  const text =
    `<b>📅 Today (IST)</b>\n` +
    (rows.length === 0
      ? "Nothing scheduled for today."
      : `${rows.length} item${rows.length === 1 ? "" : "s"}.`);

  const buttons: ReplyMarkup["inline_keyboard"] = rows.map((d) => {
    const time = (d.scheduledFor ?? "").slice(11, 16); // HH:MM in UTC
    return [
      {
        text: `${statusEmoji(d.status)} ${time}Z · ${(d.title || "(untitled)").slice(0, 40)}`,
        callback_data: `d:${d.id}`,
      },
    ];
  });
  buttons.push([{ text: "← menu", callback_data: "menu:help" }]);

  const kb: ReplyMarkup = { inline_keyboard: buttons };
  if (messageId) await editTelegramMessage(env, chatId, messageId, text, kb);
  else await sendTelegramMessage(env, chatId, text, kb);
};

// ── /scheduled cross-project ─────────────────────────────────────────
const showScheduled = async (env: Env, chatId: string, messageId?: number): Promise<void> => {
  const rows = await db(env.DB)
    .select()
    .from(schema.drafts)
    .where(and(eq(schema.drafts.status, "scheduled"), gte(schema.drafts.scheduledFor, new Date().toISOString())))
    .orderBy(schema.drafts.scheduledFor)
    .limit(10)
    .all();
  const text = rows.length ? "<b>Scheduled</b>" : "<b>Scheduled</b>\nNo scheduled posts.";
  const buttons: ReplyMarkup["inline_keyboard"] = rows.map((d) => [
    {
      text: `${(d.title || "(untitled)").slice(0, 40)} — ${(d.scheduledFor ?? "").slice(0, 16)}`,
      callback_data: `d:${d.id}`,
    },
  ]);
  buttons.push([{ text: "← menu", callback_data: "menu:help" }]);
  const kb: ReplyMarkup = { inline_keyboard: buttons };
  if (messageId) await editTelegramMessage(env, chatId, messageId, text, kb);
  else await sendTelegramMessage(env, chatId, text, kb);
};

// ── actions ─────────────────────────────────────────────────────────
const runCancel = async (env: Env, chatId: string, id: string | undefined, messageId?: number): Promise<void> => {
  if (!id) {
    await sendTelegramMessage(env, chatId, "Usage: <code>/cancel &lt;draft_id&gt;</code>");
    return;
  }
  const r = await env.DB.prepare(
    "UPDATE drafts SET status='draft', scheduled_for=NULL, scheduled_tz=NULL, updated_at=datetime('now') WHERE id=? AND status IN ('scheduled','publishing')",
  )
    .bind(id)
    .run();
  const ok = r.meta?.changes === 1;
  const text = ok ? `Cancelled <code>${esc(id)}</code>.` : `Could not cancel <code>${esc(id)}</code>.`;
  if (messageId) await editTelegramMessage(env, chatId, messageId, text);
  else await sendTelegramMessage(env, chatId, text);
};

const runRetry = async (env: Env, chatId: string, id: string | undefined, messageId?: number): Promise<void> => {
  if (!id) {
    await sendTelegramMessage(env, chatId, "Usage: <code>/retry &lt;draft_id&gt;</code>");
    return;
  }
  if (!env.PUBLISH_QUEUE) {
    await sendTelegramMessage(env, chatId, "Publish queue not configured.");
    return;
  }
  const r = await env.DB.prepare(
    "UPDATE drafts SET status='publishing', updated_at=datetime('now') WHERE id=? AND status='failed'",
  )
    .bind(id)
    .run();
  if (r.meta?.changes === 1) {
    await env.PUBLISH_QUEUE.send({ draftId: id });
    const text = `Retrying <code>${esc(id)}</code>.`;
    if (messageId) await editTelegramMessage(env, chatId, messageId, text);
    else await sendTelegramMessage(env, chatId, text);
  } else {
    await sendTelegramMessage(env, chatId, `<code>${esc(id)}</code> is not in failed state.`);
  }
};

// ── helpers ──────────────────────────────────────────────────────────
const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const statusEmoji = (s: string): string =>
  ({
    draft: "✏️",
    ready: "📋",
    scheduled: "🗓",
    publishing: "⏳",
    published: "✅",
    failed: "🚨",
    archived: "🗄",
  } as Record<string, string>)[s] ?? "•";

const inferPlatform = (opts: Record<string, unknown> | null): string | null => {
  if (!opts) return null;
  if (typeof opts.subreddit === "string") return "reddit";
  if (typeof opts.authorUrn === "string") return "linkedin";
  if (typeof opts.igUserId === "string") return "instagram";
  if ("threadSegments" in opts || opts.postKind === "tweet" || opts.postKind === "thread") return "twitter";
  if (opts.postKind === "first_comment" || opts.postKind === "maker_response" || opts.postKind === "launch_copy")
    return "producthunt";
  return null;
};

export default app;
