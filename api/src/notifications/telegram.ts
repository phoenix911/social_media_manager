// Tiny Telegram Bot API helpers.

import type { Env } from "../env.ts";

const TG = "https://api.telegram.org";

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface ReplyMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

const tg = (env: Env, method: string, body: unknown): Promise<Response> =>
  fetch(`${TG}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const sendTelegramMessage = async (
  env: Env,
  chatId: string,
  text: string,
  replyMarkup?: ReplyMarkup,
): Promise<void> => {
  if (!env.TELEGRAM_BOT_TOKEN) return;
  await tg(env, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
};

export const editTelegramMessage = async (
  env: Env,
  chatId: string,
  messageId: number,
  text: string,
  replyMarkup?: ReplyMarkup,
): Promise<void> => {
  if (!env.TELEGRAM_BOT_TOKEN) return;
  await tg(env, "editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
};

export const answerCallbackQuery = async (
  env: Env,
  callbackQueryId: string,
  text?: string,
): Promise<void> => {
  if (!env.TELEGRAM_BOT_TOKEN) return;
  await tg(env, "answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {}),
  });
};
