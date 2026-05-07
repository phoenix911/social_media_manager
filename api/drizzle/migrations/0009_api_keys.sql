-- Programmatic / MCP API keys. Plaintext shown once at creation;
-- DB stores sha256(key) so a read leak doesn't yield usable creds.

CREATE TABLE `api_keys` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `name` text NOT NULL,
  `prefix` text NOT NULL,
  `hash` text NOT NULL,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `last_used_at` text,
  `revoked_at` text,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX `api_keys_hash_unique` ON `api_keys` (`hash`);
CREATE INDEX `idx_api_keys_user` ON `api_keys` (`user_id`);
