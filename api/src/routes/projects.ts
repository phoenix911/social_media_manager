import { Hono } from "hono";
import { and, eq, inArray } from "drizzle-orm";
import { createProjectSchema, slugSchema, type Project } from "@smm/shared";
import type { Env } from "../env.ts";
import { db, schema } from "../db/index.ts";
import { BadRequest, Conflict, NotFound } from "../lib/errors.ts";
import { requireRole } from "../lib/projects.ts";

const app = new Hono<{ Bindings: Env }>();

const rowToProject = (r: typeof schema.projects.$inferSelect): Project => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  description: r.description,
  ownerId: r.ownerId,
  createdAt: r.createdAt,
  archivedAt: r.archivedAt,
});

// GET /api/projects — list projects this user is a member of
app.get("/", async (c) => {
  const user = c.var.user;
  const d = db(c.env.DB);
  const memberOf = await d
    .select({ projectId: schema.projectMembers.projectId })
    .from(schema.projectMembers)
    .where(eq(schema.projectMembers.userId, user.id))
    .all();
  if (!memberOf.length) return c.json({ projects: [] });
  const ids = memberOf.map((m) => m.projectId);
  const rows = await d.select().from(schema.projects).where(inArray(schema.projects.id, ids)).all();
  return c.json({ projects: rows.map(rowToProject) });
});

// POST /api/projects — create a project; creator becomes owner
app.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) throw BadRequest("invalid body", parsed.error.flatten());

  const d = db(c.env.DB);
  const user = c.var.user;

  const exists = await d.select().from(schema.projects).where(eq(schema.projects.slug, parsed.data.slug)).get();
  if (exists) throw Conflict("slug already in use");

  const inserted = await d
    .insert(schema.projects)
    .values({
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      ownerId: user.id,
    })
    .returning()
    .get();

  await d.insert(schema.projectMembers).values({
    projectId: inserted.id,
    userId: user.id,
    role: "owner",
  }).run();

  return c.json({ project: rowToProject(inserted) }, 201);
});

// GET /api/projects/:slug
app.get("/:slug", async (c) => {
  const slug = slugSchema.safeParse(c.req.param("slug"));
  if (!slug.success) throw BadRequest("invalid slug");
  const d = db(c.env.DB);
  const row = await d.select().from(schema.projects).where(eq(schema.projects.slug, slug.data)).get();
  if (!row) throw NotFound();
  await requireRole(c.env.DB, row.id, c.var.user.id, "viewer");
  return c.json({ project: rowToProject(row) });
});

export default app;
