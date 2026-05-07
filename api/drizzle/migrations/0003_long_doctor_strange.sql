CREATE TABLE `account_owners` (
	`account_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`added_at` text DEFAULT (datetime('now')) NOT NULL,
	PRIMARY KEY(`account_id`, `owner_id`),
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_account_owners_owner` ON `account_owners` (`owner_id`);--> statement-breakpoint
CREATE TABLE `owner_emails` (
	`owner_id` text NOT NULL,
	`email` text NOT NULL,
	`added_at` text DEFAULT (datetime('now')) NOT NULL,
	PRIMARY KEY(`owner_id`, `email`),
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_owner_emails_email` ON `owner_emails` (`email`);--> statement-breakpoint
CREATE TABLE `owners` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`archived_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_owners_project` ON `owners` (`project_id`);