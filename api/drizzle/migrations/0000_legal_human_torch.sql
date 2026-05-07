CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`platform` text NOT NULL,
	`handle` text NOT NULL,
	`external_id` text NOT NULL,
	`scopes` text NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text,
	`expires_at` text,
	`meta` text,
	`added_by` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`revoked_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`added_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "accounts_platform_check" CHECK("accounts"."platform" IN ('reddit','linkedin','instagram','twitter','producthunt'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_unique` ON `accounts` (`project_id`,`platform`,`external_id`);--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`project_id` text,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text,
	`payload` text,
	`at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audit_project` ON `audit_log` (`project_id`,`at`);--> statement-breakpoint
CREATE TABLE `draft_media` (
	`draft_id` text NOT NULL,
	`media_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`caption` text,
	PRIMARY KEY(`draft_id`, `media_id`),
	FOREIGN KEY (`draft_id`) REFERENCES `drafts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`account_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`title` text,
	`body` text DEFAULT '' NOT NULL,
	`body_format` text DEFAULT 'markdown' NOT NULL,
	`platform_options` text,
	`platform_draft_id` text,
	`scheduled_for` text,
	`scheduled_tz` text,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`archived_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "drafts_status_check" CHECK("drafts"."status" IN ('draft','ready','scheduled','publishing','published','failed','archived'))
);
--> statement-breakpoint
CREATE INDEX `idx_drafts_project_status` ON `drafts` (`project_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_drafts_scheduled` ON `drafts` (`status`,`scheduled_for`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`r2_key` text NOT NULL,
	`filename` text NOT NULL,
	`mime` text NOT NULL,
	`bytes` integer NOT NULL,
	`width` integer,
	`height` integer,
	`duration_ms` integer,
	`uploaded_by` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_r2_key_unique` ON `media` (`r2_key`);--> statement-breakpoint
CREATE INDEX `idx_media_project` ON `media` (`project_id`);--> statement-breakpoint
CREATE TABLE `project_members` (
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`added_at` text DEFAULT (datetime('now')) NOT NULL,
	PRIMARY KEY(`project_id`, `user_id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "role_check" CHECK("project_members"."role" IN ('owner','editor','viewer'))
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`owner_id` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`archived_at` text,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);--> statement-breakpoint
CREATE TABLE `publishes` (
	`id` text PRIMARY KEY NOT NULL,
	`draft_id` text NOT NULL,
	`account_id` text NOT NULL,
	`platform_post_id` text,
	`platform_url` text,
	`attempted_at` text DEFAULT (datetime('now')) NOT NULL,
	`succeeded_at` text,
	`error_message` text,
	`retry_count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`draft_id`) REFERENCES `drafts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_publishes_draft` ON `publishes` (`draft_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`picture_url` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`last_seen` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);