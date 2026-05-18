-- Dummy Instagram account for neuera.care — placeholder until real OAuth tokens arrive.
-- Page: https://www.instagram.com/neuera.care/
-- Apply via:
--   bun x wrangler d1 execute smm --remote -c api/wrangler.local.toml \
--     --file track/neuera_insta/launch/seed-account.sql

-- 1. The dummy IG account row.
INSERT INTO accounts (
  id, project_id, platform, handle, external_id, scopes, access_token, refresh_token,
  expires_at, meta, added_by
) VALUES (
  '019e2f82-e8c7-7182-8f94-5bb148e9ad43',
  '978f15b0-368e-7316-8faa-72c4ef6a9f6b',
  'instagram',
  'neuera.care',
  'placeholder-ig-business-id',
  '',
  'PLACEHOLDER_NOT_A_REAL_TOKEN',
  NULL,
  NULL,
  '{"profileUrl":"https://www.instagram.com/neuera.care/","placeholder":true,"note":"Dummy row — replace via OAuth connect once Meta App Review approves."}',
  '019e02b3-ec81-7bd2-abfd-19c2f5bc6973'
);

-- 2. Link the account into the neuera-care project.
INSERT INTO project_accounts (project_id, account_id) VALUES (
  '978f15b0-368e-7316-8faa-72c4ef6a9f6b',
  '019e2f82-e8c7-7182-8f94-5bb148e9ad43'
);

-- 3. Assign the Founders owner to this account so it's visible.
INSERT INTO account_owners (account_id, owner_id) VALUES (
  '019e2f82-e8c7-7182-8f94-5bb148e9ad43',
  '254b4b78-4e47-7319-bb25-1c5528d6914c'
);

-- 4. Bind the launch track to the account.
UPDATE tracks SET account_id = '019e2f82-e8c7-7182-8f94-5bb148e9ad43'
 WHERE id = '019e2f74-7b75-7f03-b6eb-0491e7cb5e81';

-- 5. Bind every draft in the track to the same account.
UPDATE drafts SET account_id = '019e2f82-e8c7-7182-8f94-5bb148e9ad43'
 WHERE track_id = '019e2f74-7b75-7f03-b6eb-0491e7cb5e81';
