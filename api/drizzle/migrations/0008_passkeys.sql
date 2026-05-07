-- WebAuthn (passkey) auth: per-device credentials + short-lived challenges.

CREATE TABLE `user_credentials` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `credential_id` text NOT NULL,
  `public_key` text NOT NULL,
  `sign_count` integer NOT NULL DEFAULT 0,
  `transports` text,
  `label` text,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `last_used_at` text,
  `revoked_at` text,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX `user_credentials_credential_id_unique` ON `user_credentials` (`credential_id`);
CREATE INDEX `idx_user_credentials_user` ON `user_credentials` (`user_id`);

CREATE TABLE `auth_challenges` (
  `id` text PRIMARY KEY NOT NULL,
  `kind` text NOT NULL,
  `email` text,
  `user_id` text,
  `challenge` text NOT NULL,
  `expires_at` text NOT NULL,
  `consumed_at` text,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT `auth_challenges_kind_check` CHECK (`kind` IN ('register','login','email_otp'))
);
CREATE INDEX `idx_auth_challenges_email` ON `auth_challenges` (`email`);
CREATE INDEX `idx_auth_challenges_exp` ON `auth_challenges` (`expires_at`);
