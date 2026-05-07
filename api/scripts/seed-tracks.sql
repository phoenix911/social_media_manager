-- Seed tracks: populate sequence + offsets + start dates.
-- paper-games "Reddit launch"      → start 2026-05-11T13:00:00.000Z
-- tapeline    "Product Hunt launch" → start 2026-05-13T07:00:00.000Z

UPDATE drafts SET sequence_in_track = CAST(json_extract(platform_options, '$.seedSequence') AS REAL) WHERE json_extract(platform_options, '$.seedSequence') IS NOT NULL;

UPDATE tracks SET start_at = '2026-05-11T13:00:00.000Z', tz = 'Asia/Kolkata' WHERE name = 'Reddit launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'paper-games');
UPDATE tracks SET start_at = '2026-05-13T07:00:00.000Z', tz = 'Asia/Kolkata' WHERE name = 'Product Hunt launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'tapeline');

UPDATE drafts SET track_offset_minutes = 0 WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Reddit launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'paper-games'))   AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = 1;
UPDATE drafts SET track_offset_minutes = 1440 WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Reddit launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'paper-games'))   AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = 2;
UPDATE drafts SET track_offset_minutes = 2880 WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Reddit launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'paper-games'))   AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = 3;
UPDATE drafts SET track_offset_minutes = 4320 WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Reddit launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'paper-games'))   AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = 4;
UPDATE drafts SET track_offset_minutes = 5760 WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Reddit launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'paper-games'))   AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = 5;
UPDATE drafts SET track_offset_minutes = 7200 WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Reddit launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'paper-games'))   AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = 6;
UPDATE drafts SET track_offset_minutes = 8640 WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Reddit launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'paper-games'))   AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = 7;
UPDATE drafts SET track_offset_minutes = 10080 WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Reddit launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'paper-games'))   AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = 8;
UPDATE drafts SET track_offset_minutes = 11520 WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Reddit launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'paper-games'))   AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = 9;
UPDATE drafts SET track_offset_minutes = 12960 WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Reddit launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'paper-games'))   AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = 10;
UPDATE drafts SET track_offset_minutes = -3090 WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Product Hunt launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'tapeline'))   AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = 1;
UPDATE drafts SET track_offset_minutes = -2820 WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Product Hunt launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'tapeline'))   AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = 2;
UPDATE drafts SET track_offset_minutes = 0 WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Product Hunt launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'tapeline'))   AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = 3;
UPDATE drafts SET track_offset_minutes = 360 WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Product Hunt launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'tapeline'))   AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = 4;
UPDATE drafts SET track_offset_minutes = 720 WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Product Hunt launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'tapeline'))   AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = 5;
UPDATE drafts SET track_offset_minutes = 1020 WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Product Hunt launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'tapeline'))   AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = 6;
UPDATE drafts SET track_offset_minutes = 1440 WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Product Hunt launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'tapeline'))   AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = 7;
UPDATE drafts SET track_offset_minutes = 60 WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Product Hunt launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'tapeline'))   AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = 8;
UPDATE drafts SET track_offset_minutes = 30 WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Product Hunt launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'tapeline'))   AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = 9;
UPDATE drafts SET track_offset_minutes = 60 WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Product Hunt launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'tapeline'))   AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = 10;
UPDATE drafts SET track_offset_minutes = 0 WHERE track_id IN (SELECT id FROM tracks WHERE name = 'Product Hunt launch' AND project_id IN (SELECT id FROM projects WHERE slug = 'tapeline'))   AND CAST(json_extract(platform_options, '$.seedSequence') AS REAL) = 11;

-- recompute scheduled_for from track.start_at + offset (UTC math via SQLite datetime modifier)
UPDATE drafts SET scheduled_for = (SELECT datetime(t.start_at, (drafts.track_offset_minutes || ' minutes')) FROM tracks t WHERE t.id = drafts.track_id), scheduled_tz  = (SELECT t.tz FROM tracks t WHERE t.id = drafts.track_id) WHERE drafts.track_offset_minutes IS NOT NULL   AND EXISTS (SELECT 1 FROM tracks t WHERE t.id = drafts.track_id AND t.start_at IS NOT NULL);

