// Phase 2 notifications dispatcher. Routes to Telegram if a bot token
// + allowlist are configured; otherwise no-ops.

import type { Env } from "../env.ts";
import { sendTelegramMessage } from "./telegram.ts";

export type NotifyEvent = "publish.success" | "publish.failed" | "schedule.created" | "schedule.cancelled";

export interface NotifyPayload {
  draftId?: string;
  url?: string;
  error?: string;
  message?: string;
}

const formatTelegram = (event: NotifyEvent, p: NotifyPayload): string => {
  switch (event) {
    case "publish.success":
      return `✅ <b>Published</b>\nDraft #${p.draftId}\n${p.url ?? ""}`;
    case "publish.failed":
      return `🚨 <b>Publish failed</b>\nDraft #${p.draftId}\n<code>${(p.error ?? "").slice(0, 500)}</code>`;
    case "schedule.created":
      return `🗓 <b>Scheduled</b>\nDraft #${p.draftId}\n${p.message ?? ""}`;
    case "schedule.cancelled":
      return `⏸ <b>Cancelled</b>\nDraft #${p.draftId}`;
  }
};

export const notify = async (env: Env, event: NotifyEvent, payload: NotifyPayload): Promise<void> => {
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_ALLOWED_CHAT_IDS) {
    const ids = env.TELEGRAM_ALLOWED_CHAT_IDS.split(",").map((s) => s.trim()).filter(Boolean);
    const msg = formatTelegram(event, payload);
    await Promise.all(ids.map((id) => sendTelegramMessage(env, id, msg).catch(() => {})));
  }
};
