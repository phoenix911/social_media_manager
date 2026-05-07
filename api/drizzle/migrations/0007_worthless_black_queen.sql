CREATE TABLE `platform_apps` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`label` text NOT NULL,
	`config_encrypted` text NOT NULL,
	`created_by` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`archived_at` text,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "platform_apps_platform_check" CHECK("platform_apps"."platform" IN ('reddit','linkedin','instagram','twitter','producthunt'))
);
--> statement-breakpoint
CREATE INDEX `idx_platform_apps_platform` ON `platform_apps` (`platform`);--> statement-breakpoint
ALTER TABLE `accounts` ADD `platform_app_id` text REFERENCES platform_apps(id);