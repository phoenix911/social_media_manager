-- 0001_milky_spot — introduce tracks layer and bind drafts to a track.
-- Backfill: one "Adhoc" track per existing project; existing drafts
-- get assigned to their project's adhoc track. Then drafts is rebuilt
-- with track_id NOT NULL.

CREATE TABLE `tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`account_id` text,
	`start_at` text,
	`tz` text,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`archived_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_tracks_project` ON `tracks` (`project_id`);
--> statement-breakpoint

-- 1) Add columns to drafts as nullable so we can backfill.
ALTER TABLE `drafts` ADD `track_id` text;
--> statement-breakpoint
ALTER TABLE `drafts` ADD `track_offset_minutes` integer;
--> statement-breakpoint

-- 2) Create one Adhoc track per existing project (UUID-shaped id).
INSERT INTO `tracks` (id, project_id, name, description, created_by, created_at)
SELECT
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-7' ||
    substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(2))) ||
    '-' || lower(hex(randomblob(6))),
  p.id,
  'Adhoc',
  'Default track holding drafts without a campaign',
  p.owner_id,
  datetime('now')
FROM `projects` p;
--> statement-breakpoint

-- 3) Backfill drafts.track_id to their project's adhoc track.
UPDATE `drafts`
SET `track_id` = (
  SELECT t.id FROM `tracks` t
  WHERE t.project_id = `drafts`.project_id AND t.name = 'Adhoc'
  LIMIT 1
)
WHERE `track_id` IS NULL;
--> statement-breakpoint

-- 4) Rebuild drafts with NOT NULL on track_id (SQLite has no ALTER COLUMN).
CREATE TABLE `__new_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`track_id` text NOT NULL,
	`account_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`title` text,
	`body` text DEFAULT '' NOT NULL,
	`body_format` text DEFAULT 'markdown' NOT NULL,
	`platform_options` text,
	`platform_draft_id` text,
	`track_offset_minutes` integer,
	`scheduled_for` text,
	`scheduled_tz` text,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`archived_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "drafts_status_check" CHECK("__new_drafts"."status" IN ('draft','ready','scheduled','publishing','published','failed','archived'))
);
--> statement-breakpoint
INSERT INTO `__new_drafts` (
  id, project_id, track_id, account_id, status, title, body, body_format,
  platform_options, platform_draft_id, track_offset_minutes, scheduled_for,
  scheduled_tz, created_by, created_at, updated_at, archived_at
) SELECT
  id, project_id, track_id, account_id, status, title, body, body_format,
  platform_options, platform_draft_id, track_offset_minutes, scheduled_for,
  scheduled_tz, created_by, created_at, updated_at, archived_at
FROM `drafts`;
--> statement-breakpoint
DROP TABLE `drafts`;
--> statement-breakpoint
ALTER TABLE `__new_drafts` RENAME TO `drafts`;
--> statement-breakpoint
CREATE INDEX `idx_drafts_project_status` ON `drafts` (`project_id`,`status`);
--> statement-breakpoint
CREATE INDEX `idx_drafts_track` ON `drafts` (`track_id`);
--> statement-breakpoint
CREATE INDEX `idx_drafts_scheduled` ON `drafts` (`status`,`scheduled_for`);
