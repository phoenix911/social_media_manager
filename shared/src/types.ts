// Domain types shared between api + web. All ids are UUIDv7 strings.

export type Platform = "reddit" | "linkedin" | "instagram" | "twitter" | "producthunt";
export const PLATFORMS = ["reddit", "linkedin", "instagram", "twitter", "producthunt"] as const;

export type ProjectRole = "owner" | "editor" | "viewer";

export type DraftStatus =
  | "draft"
  | "ready"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "archived";

export interface User {
  id: string;
  email: string;
  name: string | null;
  pictureUrl: string | null;
  createdAt: string;
  lastSeen: string | null;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  archivedAt: string | null;
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: ProjectRole;
  addedAt: string;
}

export interface Account {
  id: string;
  /** Original "home" project — null for project-independent channels. */
  projectId: string | null;
  /** All owners of this account; user sees the account only if their email is in one of these owners. */
  ownerIds: string[];
  platform: Platform;
  handle: string;
  externalId: string;
  scopes: string;
  expiresAt: string | null;
  meta: Record<string, unknown> | null;
  addedBy: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export interface Owner {
  id: string;
  /** Null = global owner (used for project-independent channels). */
  projectId: string | null;
  name: string;
  emails: string[];
  createdBy: string;
  createdAt: string;
  archivedAt: string | null;
}

export interface Track {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  accountId: string | null;
  /** ISO 8601 UTC. Null for adhoc / unscheduled. */
  startAt: string | null;
  /** IANA tz name (display only, e.g. "Asia/Kolkata"). */
  tz: string | null;
  createdBy: string;
  createdAt: string;
  archivedAt: string | null;
}

export interface Draft {
  id: string;
  projectId: string;
  trackId: string;
  accountId: string | null;
  status: DraftStatus;
  title: string | null;
  body: string;
  bodyFormat: "markdown";
  platformOptions: Record<string, unknown> | null;
  platformDraftId: string | null;
  /** Minutes from track.start_at; negative = before, positive = after. */
  trackOffsetMinutes: number | null;
  /** Float ordering within the track. Use halves (1.5) to insert. */
  sequenceInTrack: number | null;
  scheduledFor: string | null;
  scheduledTz: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface Media {
  id: string;
  projectId: string;
  r2Key: string;
  filename: string;
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  uploadedBy: string | null;
  createdAt: string;
}

export interface Publish {
  id: string;
  draftId: string;
  accountId: string;
  platformPostId: string | null;
  platformUrl: string | null;
  attemptedAt: string;
  succeededAt: string | null;
  errorMessage: string | null;
  retryCount: number;
}

export interface Reminder {
  id: string;
  userId: string;
  telegramTarget: string;       // "6566454636" or "@your-telegram-handle"
  label: string | null;
  kind: "daily_pending";
  enabled: boolean;
  createdAt: string;
  archivedAt: string | null;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
