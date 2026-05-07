// Worker entrypoint. Same Worker serves the SPA static assets and the
// /api/* routes — same hostname (smm.table.pw), same Access app, same
// JWT cookie. No CORS, one auth.

import { Hono } from "hono";
import { logger } from "hono/logger";
import type { Env } from "./env.ts";
import { HttpError } from "./lib/errors.ts";
import { requireUser } from "./middleware/auth.ts";
import meRoutes from "./routes/me.ts";
import projectRoutes from "./routes/projects.ts";
import trackRoutes from "./routes/tracks.ts";
import draftRoutes from "./routes/drafts.ts";
import mediaRoutes from "./routes/media.ts";
import oauthRoutes from "./routes/oauth.ts";
import accountsRoutes from "./routes/accounts.ts";
import scheduleRoutes from "./routes/schedule.ts";
import telegramRoutes from "./routes/telegram.ts";
import ownerRoutes from "./routes/owners.ts";
import reminderRoutes from "./routes/reminders.ts";
import authRoutes from "./routes/auth.ts";
import { runScheduler } from "./scheduler/cron.ts";
import { handlePublishBatch } from "./scheduler/queue.ts";
import { runReminders } from "./scheduler/reminders.ts";

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());

// Simple uptime check that doesn't require auth — exposed only for
// debugging via curl with a service token. CF Access still gates the
// hostname so this only succeeds inside our team.
app.get("/health", (c) => c.json({ ok: true, env: c.env.ENVIRONMENT }));

// Telegram webhook is gated by a shared-secret URL path component, NOT
// by CF Access (Telegram won't authenticate). Mounted before the auth
// middleware so it bypasses requireUser.
app.route("/api/telegram", telegramRoutes);

// Auth routes (passkey + email-OTP) live before requireUser; they
// either don't need a session yet (login/register start) or apply
// requireUser internally (register start/finish).
app.route("/api/auth", authRoutes);

// All other /api/* routes require a verified session (CF Access JWT
// or WebAuthn cookie depending on AUTH_MODE).
app.use("/api/*", requireUser);

app.route("/api/me", meRoutes);
app.route("/api/projects", projectRoutes);
app.route("/api/tracks", trackRoutes);
app.route("/api/drafts", draftRoutes);
app.route("/api/media", mediaRoutes);
app.route("/api/oauth", oauthRoutes);
app.route("/api/accounts", accountsRoutes);
app.route("/api/owners", ownerRoutes);
app.route("/api/reminders", reminderRoutes);
app.route("/api/schedule", scheduleRoutes);

app.notFound(async (c) => {
  // Fall through to static assets (SPA index.html fallback handled by
  // the [assets] binding's not_found_handling=single-page-application).
  if (c.env.ASSETS) return c.env.ASSETS.fetch(c.req.raw);
  return c.json({ error: { code: "not_found", message: "no such route" } }, 404);
});

app.onError((err, c) => {
  if (err instanceof HttpError) {
    return c.json(err.toJson(), err.status as 400 | 401 | 403 | 404 | 409 | 500 | 501 | 503);
  }
  console.error("unhandled error", err);
  return c.json({ error: { code: "server_error", message: "internal server error" } }, 500);
});

export default {
  fetch: app.fetch,

  // Cron trigger — dispatches by which cron pattern fired:
  //   "* * * * *"   → runScheduler (publish)
  //   "30 3 * * *"  → runReminders (9am IST daily standup)
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext) {
    if (event.cron === "30 3 * * *") {
      ctx.waitUntil(runReminders(env));
    } else {
      ctx.waitUntil(runScheduler(env));
    }
  },

  // Queue consumer — handles publish jobs.
  async queue(batch: MessageBatch<{ draftId: string }>, env: Env) {
    await handlePublishBatch(batch, env);
  },
};
