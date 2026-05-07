CREATE TABLE `project_accounts` (
	`project_id` text NOT NULL,
	`account_id` text NOT NULL,
	`added_at` text DEFAULT (datetime('now')) NOT NULL,
	PRIMARY KEY(`project_id`, `account_id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_project_accounts_account` ON `project_accounts` (`account_id`);
--> statement-breakpoint
-- backfill: link every existing account to its home project
INSERT INTO `project_accounts` (project_id, account_id, added_at)
SELECT a.project_id, a.id, datetime('now')
FROM `accounts` a
WHERE NOT EXISTS (SELECT 1 FROM `project_accounts` pa WHERE pa.project_id = a.project_id AND pa.account_id = a.id);