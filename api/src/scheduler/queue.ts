// Queue consumer: receives { draftId } messages from PUBLISH_QUEUE.
// Loads draft + account, dispatches to platform publisher, records
// the result in `publishes`, and notifies via Telegram if configured.

import { eq } from "drizzle-orm";
import type { Env } from "../env.ts";
import { db, schema } from "../db/index.ts";
import { getDecryptedAccount } from "../lib/account-tokens.ts";
import { getAdapter } from "../platforms/index.ts";
import type { Platform } from "@smm/shared";
import { notify } from "../notifications/index.ts";

export interface PublishMessage {
  draftId: string;
}

export const handlePublishBatch = async (
  batch: MessageBatch<PublishMessage>,
  env: Env,
): Promise<void> => {
  for (const msg of batch.messages) {
    try {
      await publishOne(env, msg.body.draftId);
      msg.ack();
    } catch (e) {
      const err = e as Error;
      console.error(`publish ${msg.body.draftId} failed:`, err.message);
      // Cloudflare Queue will retry per max_retries; on final attempt
      // it lands in DLQ if configured. We still record the failure row.
      await recordFailure(env, msg.body.draftId, err.message).catch(() => {});
      // Surface to telegram on every attempt? Phase-2 default: only on final.
      // Queues exposes attempts on the message metadata.
      const attempts = (msg as unknown as { attempts?: number }).attempts ?? 0;
      const final = attempts >= 2; // 0,1,2 with default max_retries=3
      if (final) {
        await markFailed(env, msg.body.draftId, err.message);
        await notify(env, "publish.failed", { draftId: msg.body.draftId, error: err.message });
        msg.ack(); // stop retrying
      } else {
        msg.retry({ delaySeconds: backoff(attempts) });
      }
    }
  }
};

const backoff = (attempt: number): number => {
  // 0 → 30s, 1 → 120s, 2 → 600s
  const ladder = [30, 120, 600];
  return ladder[Math.min(attempt, ladder.length - 1)]!;
};

const publishOne = async (env: Env, draftId: string): Promise<void> => {
  const d = db(env.DB);
  const draft = await d.select().from(schema.drafts).where(eq(schema.drafts.id, draftId)).get();
  if (!draft) throw new Error(`draft ${draftId} missing`);
  if (draft.status !== "publishing") throw new Error(`draft ${draftId} status ${draft.status}, not publishing`);
  if (!draft.accountId) throw new Error(`draft ${draftId} has no account`);

  const account = await getDecryptedAccount(env, draft.accountId);
  const adapter = getAdapter(account.platform as Platform);

  const dmRows = await d
    .select({ media: schema.media })
    .from(schema.draftMedia)
    .innerJoin(schema.media, eq(schema.media.id, schema.draftMedia.mediaId))
    .where(eq(schema.draftMedia.draftId, draft.id))
    .orderBy(schema.draftMedia.position)
    .all();

  const result = await adapter.publish(env, {
    draft: {
      id: draft.id,
      title: draft.title,
      body: draft.body,
      platformOptions: draft.platformOptions ? (JSON.parse(draft.platformOptions) as Record<string, unknown>) : null,
    },
    account: {
      id: account.id,
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      handle: account.handle,
      externalId: account.externalId,
      meta: account.meta,
    },
    media: dmRows.map((r) => ({ id: r.media.id, r2Key: r.media.r2Key, mime: r.media.mime, filename: r.media.filename })),
  });

  await d.insert(schema.publishes).values({
    draftId: draft.id,
    accountId: account.id,
    platformPostId: result.platformPostId,
    platformUrl: result.platformUrl,
    succeededAt: new Date().toISOString(),
  }).run();

  await d
    .update(schema.drafts)
    .set({ status: "published", updatedAt: new Date().toISOString() })
    .where(eq(schema.drafts.id, draft.id))
    .run();

  await notify(env, "publish.success", { draftId: draft.id, url: result.platformUrl });
};

const recordFailure = async (env: Env, draftId: string, message: string): Promise<void> => {
  const d = db(env.DB);
  const draft = await d.select().from(schema.drafts).where(eq(schema.drafts.id, draftId)).get();
  if (!draft?.accountId) return; // can't record without an FK target
  await d.insert(schema.publishes).values({
    draftId,
    accountId: draft.accountId,
    errorMessage: message,
  }).run();
};

const markFailed = async (env: Env, draftId: string, message: string): Promise<void> => {
  await db(env.DB)
    .update(schema.drafts)
    .set({ status: "failed", updatedAt: new Date().toISOString() })
    .where(eq(schema.drafts.id, draftId))
    .run();
  void message;
};
