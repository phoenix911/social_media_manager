// Narrow self-disabling admin routes.
//
// Each route has *two* gates that both have to be true to do anything;
// once you run the route, one of the gates closes permanently. After
// the operator deletes the seeding secret, the second gate closes too
// and the endpoint serves 404 forever.
//
// Result: no session auth, no header secret, no admin-key — but the
// effective auth surface is "the operator who can push a Worker secret
// + the row being in placeholder state". Both are inside our trust
// boundary.

import { Hono } from "hono";
import type { Env } from "../env.ts";
import { encryptToken } from "../lib/crypto.ts";

const app = new Hono<{ Bindings: Env }>();

const DUMMY_IG_ACCOUNT_ID = "019e2f82-e8c7-7182-8f94-5bb148e9ad43";

// POST /api/_admin/seed-ig-from-secret
// Self-disabling: needs INSTAGRAM_USER_ACCESS_TOKEN env var AND the
// target account.meta.placeholder=true. After it runs, the row's
// placeholder flips to false → the endpoint 404s for anyone forever.
app.post("/seed-ig-from-secret", async (c) => {
  const token = c.env.INSTAGRAM_USER_ACCESS_TOKEN;
  if (!token) return c.text("not found", 404);

  const row = await c.env.DB
    .prepare("SELECT meta FROM accounts WHERE id = ?1")
    .bind(DUMMY_IG_ACCOUNT_ID)
    .first<{ meta: string | null }>();
  if (!row) return c.text("not found", 404);

  const meta = row.meta ? (JSON.parse(row.meta) as Record<string, unknown>) : {};
  if (meta.placeholder !== true) return c.text("not found", 404);

  const envelope = await encryptToken(token, c.env.SMM_TOKEN_KEY);
  const now = new Date().toISOString();
  const exp = new Date(Date.now() + 59 * 24 * 60 * 60 * 1000).toISOString();

  await c.env.DB
    .prepare(
      `UPDATE accounts
          SET access_token = ?1,
              scopes       = 'instagram_business_basic,instagram_business_content_publish',
              expires_at   = ?2,
              revoked_at   = NULL,
              meta         = json_set(COALESCE(meta, '{}'),
                                       '$.placeholder', json('false'),
                                       '$.tokenSeededAt', ?3,
                                       '$.tokenSeededVia', 'admin-secret-bootstrap')
        WHERE id = ?4`,
    )
    .bind(envelope, exp, now, DUMMY_IG_ACCOUNT_ID)
    .run();

  return c.json({ ok: true, expiresAt: exp });
});

export default app;
