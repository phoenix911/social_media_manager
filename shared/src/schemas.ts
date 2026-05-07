// Zod schemas used by api for request validation.

import { z } from "zod";
import { PLATFORMS } from "./types.ts";

export const platformSchema = z.enum(PLATFORMS);

export const idSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "must be a UUID",
  );

export const slugSchema = z
  .string()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "lowercase letters, digits, hyphens; no leading/trailing hyphen");

export const createProjectSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullish(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullish(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const draftStatusSchema = z.enum([
  "draft",
  "ready",
  "scheduled",
  "publishing",
  "published",
  "failed",
  "archived",
]);

export const createOwnerSchema = z.object({
  projectId: idSchema,
  name: z.string().min(1).max(120),
  emails: z.array(z.string().email()).default([]),
});
export type CreateOwnerInput = z.infer<typeof createOwnerSchema>;

export const updateOwnerSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  emails: z.array(z.string().email()).optional(),
});
export type UpdateOwnerInput = z.infer<typeof updateOwnerSchema>;

export const createTrackSchema = z.object({
  projectId: idSchema,
  name: z.string().min(1).max(120),
  description: z.string().max(500).nullable().optional(),
  ownerId: idSchema.nullable().optional(),
  accountId: idSchema.nullable().optional(),
  startAt: z.string().datetime().nullable().optional(),
  tz: z.string().max(60).nullable().optional(),
});
export type CreateTrackInput = z.infer<typeof createTrackSchema>;

export const updateTrackSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  ownerId: idSchema.nullable().optional(),
  accountId: idSchema.nullable().optional(),
  startAt: z.string().datetime().nullable().optional(),
  tz: z.string().max(60).nullable().optional(),
});
export type UpdateTrackInput = z.infer<typeof updateTrackSchema>;

export const createDraftSchema = z.object({
  projectId: idSchema,
  trackId: idSchema,
  accountId: idSchema.nullable().optional(),
  title: z.string().max(300).nullable().optional(),
  body: z.string().max(40_000).default(""),
  platformOptions: z.record(z.unknown()).nullable().optional(),
  trackOffsetMinutes: z.number().int().nullable().optional(),
  sequenceInTrack: z.number().nullable().optional(),
});
export type CreateDraftInput = z.infer<typeof createDraftSchema>;

export const updateDraftSchema = z.object({
  trackId: idSchema.optional(),
  accountId: idSchema.nullable().optional(),
  status: draftStatusSchema.optional(),
  title: z.string().max(300).nullable().optional(),
  body: z.string().max(40_000).optional(),
  platformOptions: z.record(z.unknown()).nullable().optional(),
  trackOffsetMinutes: z.number().int().nullable().optional(),
  sequenceInTrack: z.number().nullable().optional(),
  scheduledFor: z.string().datetime().nullable().optional(),
  scheduledTz: z.string().max(60).nullable().optional(),
});
export type UpdateDraftInput = z.infer<typeof updateDraftSchema>;

export const addProjectMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["editor", "viewer"]),
});
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;

// Manual channel creation — when OAuth isn't desired (pre-issued
// tokens, or platforms we don't support OAuth for, like WhatsApp).
// Token + refresh-token are encrypted at rest server-side via the
// same AES-GCM helper used by OAuth.
export const createAccountSchema = z.object({
  // Optional: omit to create a project-independent channel.
  projectId: idSchema.nullable().optional(),
  platform: platformSchema,
  handle: z.string().min(1).max(120),
  externalId: z.string().min(1).max(200),
  scopes: z.string().max(500).default(""),
  accessToken: z.string().min(1).max(8000),
  refreshToken: z.string().max(8000).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  meta: z.record(z.unknown()).nullable().optional(),
});
export type CreateAccountInput = z.infer<typeof createAccountSchema>;

// Reminders
export const createReminderSchema = z.object({
  telegramTarget: z
    .string()
    .min(1)
    .max(120)
    .regex(/^(@[a-zA-Z0-9_]{1,64}|-?\d{1,20})$/, "@username or numeric chat id"),
  label: z.string().max(120).nullable().optional(),
  enabled: z.boolean().default(true),
});
export type CreateReminderInput = z.infer<typeof createReminderSchema>;

export const updateReminderSchema = z.object({
  telegramTarget: z
    .string()
    .min(1)
    .max(120)
    .regex(/^(@[a-zA-Z0-9_]{1,64}|-?\d{1,20})$/)
    .optional(),
  label: z.string().max(120).nullable().optional(),
  enabled: z.boolean().optional(),
});
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;

export const oauthStartSchema = z.object({
  projectId: idSchema,
  platform: platformSchema,
  returnTo: z.string().url().optional(),
});
export type OauthStartInput = z.infer<typeof oauthStartSchema>;
