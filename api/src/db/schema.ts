// Drizzle schema — source of truth for the D1 schema.
// All PKs are UUIDv7 strings. See lib/ids.ts for the generator.
//
// Run `bun run db:generate` (in api/) after edits.

import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { uuidv7 } from "../lib/ids.ts";

const now = sql`(datetime('now'))`;
const id = () => text("id").primaryKey().$defaultFn(uuidv7);

export const users = sqliteTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name"),
  pictureUrl: text("picture_url"),
  createdAt: text("created_at").notNull().default(now),
  lastSeen: text("last_seen"),
});

export const projects = sqliteTable("projects", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull().default(now),
  archivedAt: text("archived_at"),
});

export const projectMembers = sqliteTable(
  "project_members",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    role: text("role").notNull(),
    addedAt: text("added_at").notNull().default(now),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.projectId, t.userId] }),
    roleCheck: check("role_check", sql`${t.role} IN ('owner','editor','viewer')`),
  }),
);

// "Owner" = a person/persona who can be assigned to channels/tracks.
// Each owner has one or more email addresses. A logged-in user is
// matched to an owner by email. Resources without an owner are
// visible to all project members (default).
export const owners = sqliteTable(
  "owners",
  {
    id: id(),
    // null = "global" owner, used for project-independent channels.
    projectId: text("project_id").references(() => projects.id),
    name: text("name").notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: text("created_at").notNull().default(now),
    archivedAt: text("archived_at"),
  },
  (t) => ({
    projectIdx: index("idx_owners_project").on(t.projectId),
  }),
);

export const ownerEmails = sqliteTable(
  "owner_emails",
  {
    ownerId: text("owner_id")
      .notNull()
      .references(() => owners.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    addedAt: text("added_at").notNull().default(now),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.ownerId, t.email] }),
    emailIdx: index("idx_owner_emails_email").on(t.email),
  }),
);

// OAuth app credentials per platform, encrypted at rest. Lets you
// register multiple Reddit apps / LinkedIn apps / etc. without
// redeploying the Worker. The whole `config` blob (client_id +
// client_secret + any platform extras) is encrypted with the same
// AES-GCM key used for OAuth tokens (SMM_TOKEN_KEY).
export const platformApps = sqliteTable(
  "platform_apps",
  {
    id: id(),
    platform: text("platform").notNull(),
    label: text("label").notNull(),
    /** AES-GCM-encrypted JSON of the platform-specific config:
     *   { client_id, client_secret, user_agent?, oauth1_consumer_key?, ... }
     */
    configEncrypted: text("config_encrypted").notNull(),
    createdBy: text("created_by").references(() => users.id),
    createdAt: text("created_at").notNull().default(now),
    archivedAt: text("archived_at"),
  },
  (t) => ({
    platformIdx: index("idx_platform_apps_platform").on(t.platform),
    platformCheck: check(
      "platform_apps_platform_check",
      sql`${t.platform} IN ('reddit','linkedin','instagram','twitter','producthunt')`,
    ),
  }),
);

export const accounts = sqliteTable(
  "accounts",
  {
    id: id(),
    // Channels are project-independent: created at the user level,
    // then linked into projects via project_accounts. project_id
    // remains as the original "home" project for backward compat
    // (auto-created channels from per-project OAuth still set it).
    projectId: text("project_id").references(() => projects.id),
    /** Which platform_app's credentials were used for OAuth. Null for
     *  legacy / env-based connections. Refresh-on-use looks here. */
    platformAppId: text("platform_app_id").references(() => platformApps.id),
    platform: text("platform").notNull(),
    handle: text("handle").notNull(),
    externalId: text("external_id").notNull(),
    scopes: text("scopes").notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    expiresAt: text("expires_at"),
    meta: text("meta"),
    addedBy: text("added_by").references(() => users.id),
    createdAt: text("created_at").notNull().default(now),
    revokedAt: text("revoked_at"),
  },
  (t) => ({
    uniq: uniqueIndex("accounts_unique").on(t.projectId, t.platform, t.externalId),
    platformCheck: check(
      "accounts_platform_check",
      sql`${t.platform} IN ('reddit','linkedin','instagram','twitter','producthunt')`,
    ),
  }),
);

// Many-to-many: a channel (account) can be linked into multiple
// projects. The account's `project_id` column remains as the "home"
// project where it was first created. Channel visibility within each
// linked project is still owner-scoped per project.
export const projectAccounts = sqliteTable(
  "project_accounts",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    addedAt: text("added_at").notNull().default(now),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.projectId, t.accountId] }),
    accountIdx: index("idx_project_accounts_account").on(t.accountId),
  }),
);

// Many-to-many: an account/channel can have multiple owners; an owner
// can own multiple accounts. Whoever creates an account gets added
// here automatically (via the OAuth callback).
export const accountOwners = sqliteTable(
  "account_owners",
  {
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    ownerId: text("owner_id")
      .notNull()
      .references(() => owners.id, { onDelete: "cascade" }),
    addedAt: text("added_at").notNull().default(now),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.accountId, t.ownerId] }),
    ownerIdx: index("idx_account_owners_owner").on(t.ownerId),
  }),
);

// Tracks group drafts into a coordinated campaign on a single channel.
// A track has exactly one account (single-channel by design). Multi-
// channel campaigns become multiple parallel tracks. Each draft in a
// track has an offset (in minutes, can be negative) relative to the
// track's start_at — moving start_at recomputes every draft's
// scheduled_for. Adhoc tracks have NULL start_at and posts inside have
// NULL offset; their scheduled_for is set manually per-post.
export const tracks = sqliteTable(
  "tracks",
  {
    id: id(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),
    name: text("name").notNull(),
    description: text("description"),
    accountId: text("account_id").references(() => accounts.id),
    startAt: text("start_at"),       // ISO UTC; null for adhoc / not-yet-scheduled
    tz: text("tz"),                  // display tz (IANA), e.g. "Asia/Kolkata"
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: text("created_at").notNull().default(now),
    archivedAt: text("archived_at"),
  },
  (t) => ({
    projectIdx: index("idx_tracks_project").on(t.projectId),
  }),
);

export const drafts = sqliteTable(
  "drafts",
  {
    id: id(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),
    trackId: text("track_id")
      .notNull()
      .references(() => tracks.id),
    accountId: text("account_id").references(() => accounts.id),
    status: text("status").notNull().default("draft"),
    title: text("title"),
    body: text("body").notNull().default(""),
    bodyFormat: text("body_format").notNull().default("markdown"),
    platformOptions: text("platform_options"),
    platformDraftId: text("platform_draft_id"),
    // Minutes offset from track.start_at (negative = before, positive = after).
    // Null means "no auto-schedule from track" — scheduledFor is set manually.
    trackOffsetMinutes: integer("track_offset_minutes"),
    // Float so insertions between rows (1.5) don't require renumbering.
    sequenceInTrack: real("sequence_in_track"),
    scheduledFor: text("scheduled_for"),
    scheduledTz: text("scheduled_tz"),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
    archivedAt: text("archived_at"),
  },
  (t) => ({
    projectStatusIdx: index("idx_drafts_project_status").on(t.projectId, t.status),
    trackIdx: index("idx_drafts_track").on(t.trackId),
    scheduledIdx: index("idx_drafts_scheduled").on(t.status, t.scheduledFor),
    statusCheck: check(
      "drafts_status_check",
      sql`${t.status} IN ('draft','ready','scheduled','publishing','published','failed','archived')`,
    ),
  }),
);

export const media = sqliteTable(
  "media",
  {
    id: id(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),
    r2Key: text("r2_key").notNull().unique(),
    filename: text("filename").notNull(),
    mime: text("mime").notNull(),
    bytes: integer("bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    durationMs: integer("duration_ms"),
    uploadedBy: text("uploaded_by").references(() => users.id),
    createdAt: text("created_at").notNull().default(now),
    deletedAt: text("deleted_at"),
  },
  (t) => ({
    projectIdx: index("idx_media_project").on(t.projectId),
  }),
);

export const draftMedia = sqliteTable(
  "draft_media",
  {
    draftId: text("draft_id")
      .notNull()
      .references(() => drafts.id, { onDelete: "cascade" }),
    mediaId: text("media_id")
      .notNull()
      .references(() => media.id),
    position: integer("position").notNull().default(0),
    caption: text("caption"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.draftId, t.mediaId] }),
  }),
);

export const publishes = sqliteTable(
  "publishes",
  {
    id: id(),
    draftId: text("draft_id")
      .notNull()
      .references(() => drafts.id),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id),
    platformPostId: text("platform_post_id"),
    platformUrl: text("platform_url"),
    attemptedAt: text("attempted_at").notNull().default(now),
    succeededAt: text("succeeded_at"),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").notNull().default(0),
  },
  (t) => ({
    draftIdx: index("idx_publishes_draft").on(t.draftId),
  }),
);

// Reminders — fires daily at 9am IST. Target is either a numeric
// chat_id or "@username"; usernames are resolved to chat_ids via the
// KV map (tg:chat_by_username:<lowercase>) populated by the bot
// webhook on inbound messages.
export const reminders = sqliteTable(
  "reminders",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    telegramTarget: text("telegram_target").notNull(),
    label: text("label"),
    kind: text("kind").notNull().default("daily_pending"),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(now),
    archivedAt: text("archived_at"),
  },
  (t) => ({
    userIdx: index("idx_reminders_user").on(t.userId),
  }),
);

// WebAuthn (passkey) credentials. One user can register many devices.
// public_key is the COSE-encoded credential public key, base64url.
// sign_count is the device's monotonically-increasing counter — we
// reject auth attempts where the new count <= stored count (clone
// detection). transports is a comma-joined hint set ("usb,nfc,ble"
// /"internal"/"hybrid"); used only to populate the
// allowCredentials.transports field on subsequent ceremonies.
export const userCredentials = sqliteTable(
  "user_credentials",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    credentialId: text("credential_id").notNull().unique(),
    publicKey: text("public_key").notNull(),
    signCount: integer("sign_count").notNull().default(0),
    transports: text("transports"),
    label: text("label"),
    createdAt: text("created_at").notNull().default(now),
    lastUsedAt: text("last_used_at"),
    revokedAt: text("revoked_at"),
  },
  (t) => ({
    userIdx: index("idx_user_credentials_user").on(t.userId),
  }),
);

// Short-lived auth challenges. Stored in DB rather than KV so we can
// bind them to email + user agent and clean them up transactionally.
// kind = "register" | "login" | "email_otp".
export const authChallenges = sqliteTable(
  "auth_challenges",
  {
    id: id(),
    kind: text("kind").notNull(),
    email: text("email"),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    challenge: text("challenge").notNull(),
    expiresAt: text("expires_at").notNull(),
    consumedAt: text("consumed_at"),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => ({
    emailIdx: index("idx_auth_challenges_email").on(t.email),
    expIdx: index("idx_auth_challenges_exp").on(t.expiresAt),
    kindCheck: check("auth_challenges_kind_check", sql`${t.kind} IN ('register','login','email_otp')`),
  }),
);

export const auditLog = sqliteTable(
  "audit_log",
  {
    id: id(),
    actorId: text("actor_id").references(() => users.id),
    projectId: text("project_id").references(() => projects.id),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    payload: text("payload"),
    at: text("at").notNull().default(now),
  },
  (t) => ({
    projectIdx: index("idx_audit_project").on(t.projectId, t.at),
  }),
);
