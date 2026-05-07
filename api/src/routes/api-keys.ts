// CRUD for programmatic / MCP API keys. All routes require a passkey
// session (creating an API key via another API key would let any
// stolen key escalate itself indefinitely).

import { Hono } from "hono";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Env } from "../env.ts";
import { db, schema } from "../db/index.ts";
import { uuidv7 } from "../lib/ids.ts";
import { generateApiKey, hashApiKey } from "../lib/api-keys.ts";
import { BadRequest, Forbidden, NotFound } from "../lib/errors.ts";

const app = new Hono<{ Bindings: Env }>();

const createSchema = z.object({ name: z.string().min(1).max(80) });

const requireSession = (c: any) => {
  if (c.var.viaApiKey) throw Forbidden("API keys cannot manage other API keys");
};

// GET /api/api-keys — list this user's keys (no plaintext, ever).
app.get("/", async (c) => {
  requireSession(c);
  const user = c.var.user;
  const rows = await db(c.env.DB)
    .select()
    .from(schema.apiKeys)
    .where(and(eq(schema.apiKeys.userId, user.id), isNull(schema.apiKeys.revokedAt)))
    .orderBy(desc(schema.apiKeys.createdAt))
    .all();
  return c.json({
    keys: rows.map((k) => ({
      id: k.id,
      name: k.name,
      prefix: k.prefix,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
    })),
  });
});

// POST /api/api-keys — mint a new key. Plaintext returned exactly once.
app.post("/", async (c) => {
  requireSession(c);
  const body = await c.req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) throw BadRequest("invalid body", parsed.error.flatten());

  const { plaintext, prefix } = generateApiKey();
  const hash = await hashApiKey(plaintext);

  await db(c.env.DB).insert(schema.apiKeys).values({
    id: uuidv7(),
    userId: c.var.user.id,
    name: parsed.data.name,
    prefix,
    hash,
  });

  return c.json({
    plaintext,
    prefix,
    name: parsed.data.name,
    warning: "This is the only time the full key is shown. Copy it now.",
  });
});

// DELETE /api/api-keys/:id — soft-revoke. Hash stays so we can show
// audit info but the lookup in middleware filters revokedAt IS NULL.
app.delete("/:id", async (c) => {
  requireSession(c);
  const id = c.req.param("id");
  const d = db(c.env.DB);
  const row = await d.select().from(schema.apiKeys).where(eq(schema.apiKeys.id, id)).get();
  if (!row || row.userId !== c.var.user.id) throw NotFound();
  await d
    .update(schema.apiKeys)
    .set({ revokedAt: new Date().toISOString() })
    .where(eq(schema.apiKeys.id, id))
    .run();
  return c.json({ ok: true });
});

export default app;
