// Project membership / role checks. Hot path on nearly every authed
// request — uses raw D1 prepared statements (no Drizzle round-trip)
// and reads a single column.

import type { ProjectRole } from "@smm/shared";
import { Forbidden, NotFound } from "./errors.ts";

const ROLE_RANK: Record<ProjectRole, number> = { viewer: 1, editor: 2, owner: 3 };

export const getRole = async (
  d1: D1Database,
  projectId: string,
  userId: string,
): Promise<ProjectRole | null> => {
  const row = await d1
    .prepare("SELECT role FROM project_members WHERE project_id = ?1 AND user_id = ?2")
    .bind(projectId, userId)
    .first<{ role: string }>();
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
