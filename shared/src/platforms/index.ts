// Per-platform option JSON shapes. These are the typed views of the
// `drafts.platform_options` JSON column for each platform. Keep
// aligned with plan/platforms/<platform>.md "Per-draft options".

import { z } from "zod";

// ── Reddit ──────────────────────────────────────────────────────────
export const redditOptionsSchema = z.object({
  subreddit: z.string().min(1).max(50),
  postKind: z.enum(["self", "link", "image", "video", "comment"]).default("self"),
  flairId: z.string().nullable().optional(),
  flairText: z.string().nullable().optional(),
  sendReplies: z.boolean().default(true),
  spoiler: z.boolean().default(false),
  nsfw: z.boolean().default(false),
  commentTarget: z
    .object({
      threadResolver: z.string().default("sticky:1"),
      threadPattern: z.string().optional(),
      fallbackThreadId: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});
export type RedditOptions = z.infer<typeof redditOptionsSchema>;

// ── LinkedIn ────────────────────────────────────────────────────────
export const linkedinOptionsSchema = z.object({
  authorType: z.enum(["person", "company"]).default("person"),
  authorUrn: z.string().min(1),
  visibility: z.enum(["PUBLIC", "CONNECTIONS"]).default("PUBLIC"),
  feedDistribution: z.enum(["MAIN_FEED", "NONE"]).default("MAIN_FEED"),
  reshareDisabled: z.boolean().default(false),
  postKind: z.enum(["text", "image", "carousel", "article"]).default("text"),
  articleUrl: z.string().url().nullable().optional(),
  firstComment: z.string().max(1300).nullable().optional(),
});
export type LinkedinOptions = z.infer<typeof linkedinOptionsSchema>;

// ── Instagram ───────────────────────────────────────────────────────
export const instagramOptionsSchema = z.object({
  igUserId: z.string().min(1),
  postKind: z.enum(["image", "carousel", "reel"]).default("image"),
  shareToFeed: z.boolean().default(true),
  firstComment: z.string().max(2200).nullable().optional(),
  locationId: z.string().nullable().optional(),
  hashtagsInFirstComment: z.boolean().default(false),
});
export type InstagramOptions = z.infer<typeof instagramOptionsSchema>;

// ── Product Hunt ────────────────────────────────────────────────────
// PH "publish" is generally manual (launch submission needs partner
// approval). We use this for storing launch first-comments + maker
// responses next to the rest of a launch's collateral.
export const producthuntOptionsSchema = z.object({
  postKind: z.enum(["first_comment", "comment", "maker_response", "launch_copy"]).default("first_comment"),
  postId: z.string().nullable().optional(), // existing PH post id when commenting on a launch
  intendedTime: z.string().nullable().optional(),
});
export type ProducthuntOptions = z.infer<typeof producthuntOptionsSchema>;

// ── Twitter / X ─────────────────────────────────────────────────────
export const twitterOptionsSchema = z.object({
  postKind: z.enum(["tweet", "thread"]).default("tweet"),
  threadSegments: z.array(z.object({ text: z.string().max(280), mediaIds: z.array(z.string()).default([]) })).default([]),
  replySettings: z.enum(["everyone", "mentioned_users", "following"]).default("everyone"),
  forSuperFollowersOnly: z.boolean().default(false),
  geoPlaceId: z.string().nullable().optional(),
  quoteTweetId: z.string().nullable().optional(),
});
export type TwitterOptions = z.infer<typeof twitterOptionsSchema>;
