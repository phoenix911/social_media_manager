PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text,
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
	CONSTRAINT "accounts_platform_check" CHECK("__new_accounts"."platform" IN ('reddit','linkedin','instagram','twitter','producthunt'))
);
--> statement-breakpoint
INSERT INTO `__new_accounts`("id", "project_id", "platform", "handle", "external_id", "scopes", "access_token", "refresh_token", "expires_at", "meta", "added_by", "created_at", "revoked_at") SELECT "id", "project_id", "platform", "handle", "external_id", "scopes", "access_token", "refresh_token", "expires_at", "meta", "added_by", "created_at", "revoked_at" FROM `accounts`;--> statement-breakpoint
DROP TABLE `accounts`;--> statement-breakpoint
ALTER TABLE `__new_accounts` RENAME TO `accounts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_unique` ON `accounts` (`project_id`,`platform`,`external_id`);--> statement-breakpoint
CREATE TABLE `__new_owners` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text,
	`name` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`archived_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_owners`("id", "project_id", "name", "created_by", "created_at", "archived_at") SELECT "id", "project_id", "name", "created_by", "created_at", "archived_at" FROM `owners`;--> statement-breakpoint
DROP TABLE `owners`;--> statement-breakpoint
ALTER TABLE `__new_owners` RENAME TO `owners`;--> statement-breakpoint
CREATE INDEX `idx_owners_project` ON `owners` (`project_id`);