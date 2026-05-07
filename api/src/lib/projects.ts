// Project membership / role checks.

import { and, eq } from "drizzle-orm";
import type { ProjectRole } from "@smm/shared";
import { db, schema } from "../db/index.ts";
import { Forbidden, NotFound } from "./errors.ts";

const ROLE_RANK: Record<ProjectRole, number> = { viewer: 1, editor: 2, owner: 3 };

export const getRole = async (
  d1: D1Database,
  projectId: string,
  userId: string,
): Promise<ProjectRole | null> => {
  const row = await db(d1)
    .select({ role: schema.projectMembers.role })
    .from(schema.projectMembers)
    .where(and(eq(schema.projectMembers.projectId, projectId), eq(schema.projectMembers.userId, userId)))
    .get();
  return (row?.role as ProjectRole | undefined) ?? null;
};

export const requireRole = async (
  d1: D1Database,
  projectId: string,
  userId: string,
  min: ProjectRole,
): Promise<ProjectRole> => {
  const role = await getRole(d1, projectId, userId);
  if (!role) throw NotFound("project not found or no access");
  if (ROLE_RANK[role] < ROLE_RANK[min]) {
    throw Forbidden(`role '${role}' is below required '${min}'`);
  }
  return role;
};
