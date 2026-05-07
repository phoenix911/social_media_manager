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

// GET /api/projects — list projects this user is a member of.
// Single JOIN, raw prepared statement (was 2 queries via Drizzle).
app.get("/", async (c) => {
  const { results } = await c.env.DB
    .prepare(
      `SELECT p.id, p.slug, p.name, p.description, p.owner_id, p.created_at, p.archived_at
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id
       WHERE pm.user_id = ?1 AND p.archived_at IS NULL`,
    )
    .bind(c.var.user.id)
    .all<{ id: string; slug: string; name: string; description: string | null; owner_id: string; created_at: string; archived_at: string | null }>();
  const projects: Project[] = (results ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    ownerId: r.owner_id,
    createdAt: r.created_at,
    archivedAt: r.archived_at,
  }));
  return c.json({ projects });
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

// GET /api/projects/:slug — fetch + role-check in a single LEFT JOIN.
// Distinguishes "no project" (404) from "exists but no role" (404 too,
// to avoid leaking existence) without two round-trips.
app.get("/:slug", async (c) => {
  const slug = slugSchema.safeParse(c.req.param("slug"));
  if (!slug.success) throw BadRequest("invalid slug");
  const row = await c.env.DB
    .prepare(
      `SELECT p.id, p.slug, p.name, p.description, p.owner_id, p.created_at, p.archived_at, pm.role
       FROM projects p
       LEFT JOIN project_members pm
         ON pm.project_id = p.id AND pm.user_id = ?2
       WHERE p.slug = ?1`,
    )
    .bind(slug.data, c.var.user.id)
    .first<{ id: string; slug: string; name: string; description: string | null; owner_id: string; created_at: string; archived_at: string | null; role: string | null }>();
  if (!row || !row.role) throw NotFound();
  return c.json({
    project: {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      ownerId: row.owner_id,
      createdAt: row.created_at,
      archivedAt: row.archived_at,
    } as Project,
  });
});

export default app;
