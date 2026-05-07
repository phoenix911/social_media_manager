// Daily-reminder cron handler. Runs at 9am IST (cron `30 3 * * *` UTC).
// For each enabled reminder:
//   1. Computes "pending today" + "still pending in last 7 days" across
//      every project the reminder's user is a member of. "Pending" =
//      status in (draft, ready, scheduled).
//   2. Resolves @username → numeric chat_id via the KV map populated
//      by the bot webhook.
//   3. Sends a single Telegram message.

import { and, eq, gte, inArray, isNotNull, lte } from "drizzle-orm";
import type { Env } from "../env.ts";
import { db, schema } from "../db/index.ts";
import { sendTelegramMessage } from "../notifications/telegram.ts";

const istNowParts = (): { dateIso: string; rangeStart: string; rangeEnd: string; weekStart: string } => {
  const now = new Date();
  const istMs = now.getTime() + (5 * 60 + 30) * 60_000;
  const ist = new Date(istMs);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const d = String(ist.getUTCDate()).padStart(2, "0");
  const dateIso = `${y}-${m}-${d}`;
  // Today's IST window in UTC ISO
  const startIst = new Date(`${dateIso}T00:00:00.000+05:30`);
  const endIst = new Date(`${dateIso}T23:59:59.999+05:30`);
  const weekAgo = new Date(startIst.getTime() - 7 * 24 * 60 * 60_000);
  return {
    dateIso,
    rangeStart: startIst.toISOString(),
    rangeEnd: endIst.toISOString(),
    weekStart: weekAgo.toISOString(),
  };
};

const resolveTarget = async (env: Env, target: string): Promise<string | null> => {
  if (!target.startsWith("@")) return target; // numeric, use as-is
  const username = target.slice(1).toLowerCase();
  const chatId = await env.KV.get(`tg:chat_by_username:${username}`);
  return chatId; // null if the user hasn't messaged the bot yet
};

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const runReminders = async (env: Env): Promise<void> => {
  if (!env.TELEGRAM_BOT_TOKEN) return;

  const d = db(env.DB);
  const all = await d
    .select()
    .from(schema.reminders)
    .where(and(eq(schema.reminders.enabled, true), isNotNull(schema.reminders.userId)))
    .all();

  for (const r of all) {
    if (r.archivedAt) continue;
    const chatId = await resolveTarget(env, r.telegramTarget);
    if (!chatId) {
      console.warn(`reminder ${r.id}: cannot resolve target ${r.telegramTarget}`);
      continue;
    }

    // Projects this user is a member of
    const projects = await d
      .select({ id: schema.projects.id, name: schema.projects.name })
      .from(schema.projectMembers)
      .innerJoin(schema.projects, eq(schema.projects.id, schema.projectMembers.projectId))
      .where(eq(schema.projectMembers.userId, r.userId))
      .all();
    if (!projects.length) {
      await sendTelegramMessage(env, chatId, "Good morning ☀️ — no projects yet.");
      continue;
    }

    const projectIds = projects.map((p) => p.id);
    const { rangeStart, rangeEnd, weekStart, dateIso } = istNowParts();

    // Today: pending drafts scheduled for today (any pending status)
    const today = await d
      .select()
      .from(schema.drafts)
      .where(
        and(
          inArray(schema.drafts.projectId, projectIds),
          inArray(schema.drafts.status, ["draft", "ready", "scheduled"]),
          gte(schema.drafts.scheduledFor, rangeStart),
          lte(schema.drafts.scheduledFor, rangeEnd),
        ),
      )
      .orderBy(schema.drafts.scheduledFor)
      .all();

    // Pending from last 7 days: scheduled_for in last 7 days but still pending OR overdue.
    const overdue = await d
      .select()
      .from(schema.drafts)
      .where(
        and(
          inArray(schema.drafts.projectId, projectIds),
          inArray(schema.drafts.status, ["draft", "ready", "scheduled"]),
          gte(schema.drafts.scheduledFor, weekStart),
          lte(schema.drafts.scheduledFor, rangeStart),
        ),
      )
      .orderBy(schema.drafts.scheduledFor)
      .all();

    const projectName = new Map(projects.map((p) => [p.id, p.name]));
    const fmt = (rows: typeof today) =>
      rows
        .map((x) => {
          const time = (x.scheduledFor ?? "").slice(11, 16);
          return `· <b>${esc((x.title || "(untitled)").slice(0, 60))}</b> — ${time}Z · <i>${esc(
            projectName.get(x.projectId) ?? "?",
          )}</i>`;
        })
        .join("\n");

    const lines: string[] = [`☀️ <b>${dateIso} — daily standup</b>`, ""];
    if (today.length) {
      lines.push(`<b>📅 Today (${today.length})</b>`, fmt(today), "");
    } else {
      lines.push(`<b>📅 Today</b>`, "<i>nothing scheduled</i>", "");
    }
    if (overdue.length) {
      lines.push(`<b>🚨 Still pending (last 7 days, ${overdue.length})</b>`, fmt(overdue));
    } else {
      lines.push(`<b>🚨 Last 7 days</b>`, "<i>all clear</i>");
    }

    await sendTelegramMessage(env, chatId, lines.join("\n"));
  }
};
