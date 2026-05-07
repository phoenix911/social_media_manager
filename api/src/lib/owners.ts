// Owner helpers — used by OAuth callback to auto-assign creator as
// owner, and by the accounts list endpoint to filter by viewer email.

import { and, eq, inArray, sql } from "drizzle-orm";
import type { Env } from "../env.ts";
import { db, schema } from "../db/index.ts";

/**
 * Find or create an owner that holds `email`, scoped to `projectId`
 * (or scoped to `null` = global, when channel is created without a
 * project). Auto-create on miss with a sensible name.
 */
export const ensureOwnerForUser = async (
  env: Env,
  projectId: string | null,
  userId: string,
  email: string,
  displayName?: string | null,
): Promise<string> => {
  const d = db(env.DB);

  // Already-mapped? Match the owner's project_id (NULL or specific).
  const projFilter =
    projectId == null
      ? sql`${schema.owners.projectId} IS NULL`
      : eq(schema.owners.projectId, projectId);
  const existing = await d
    .select({ ownerId: schema.ownerEmails.ownerId })
    .from(schema.ownerEmails)
    .innerJoin(schema.owners, eq(schema.owners.id, schema.ownerEmails.ownerId))
    .where(and(eq(schema.ownerEmails.email, email), projFilter))
    .get();
  if (existing) return existing.ownerId;

  const name = displayName?.trim() || email.split("@")[0]!;
  const owner = await d
    .insert(schema.owners)
    .values({ projectId: projectId ?? null, name, createdBy: userId })
    .returning({ id: schema.owners.id })
    .get();
  await d.insert(schema.ownerEmails).values({ ownerId: owner.id, email }).run();
  return owner.id;
};

/** Owners that include `email` AND belong to `projectId`. */
export const ownerIdsForEmailInProject = async (
  env: Env,
  projectId: string,
  email: string,
): Promise<string[]> => {
  const rows = await db(env.DB)
    .select({ id: schema.owners.id })
    .from(schema.owners)
    .innerJoin(schema.ownerEmails, eq(schema.ownerEmails.ownerId, schema.owners.id))
    .where(and(eq(schema.owners.projectId, projectId), eq(schema.ownerEmails.email, email)))
    .all();
  return rows.map((r) => r.id);
};

/** Account ids visible to `email` in `projectId` (i.e. accounts that
 * have at least one owner whose emails include `email`). */
export const visibleAccountIdsForEmail = async (
  env: Env,
  projectId: string,
  email: string,
): Promise<string[] | null> => {
  const ownerIds = await ownerIdsForEmailInProject(env, projectId, email);
  if (!ownerIds.length) return [];
  const rows = await db(env.DB)
    .select({ id: schema.accountOwners.accountId })
    .from(schema.accountOwners)
    .where(inArray(schema.accountOwners.ownerId, ownerIds))
    .all();
  return rows.map((r) => r.id);
};
