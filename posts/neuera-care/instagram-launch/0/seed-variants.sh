#!/usr/bin/env bash
# Seed the three brand-intro variants — all use image-A; only the captions
# differ. Each lands as a draft at a distinct sequence position so they sort
# together at the top of the track for review.
#
#   0.5 → caption E ("Women's health. Considered.")  ← UPDATED in place
#   0.6 → caption B ("For the woman who's been told it's normal.")
#   0.7 → caption D ("We started neuera because women's health deserved…")
#
# All scheduled for 2026-05-19 10:30 IST (one day before campaign opens).
# All status='draft' — review on the track page, pick one, archive the others.
#
# Run from repo root.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"

export CLOUDFLARE_API_TOKEN=$(grep '^CLOUDFLARE_API_TOKEN=' what_i_need.md | cut -d= -f2)
export CLOUDFLARE_ACCOUNT_ID=$(grep '^CLOUDFLARE_ACCOUNT_ID=' what_i_need.md | cut -d= -f2)

PROJECT_ID="978f15b0-368e-7316-8faa-72c4ef6a9f6b"
TRACK_ID="019e2f74-7b75-7f03-b6eb-0491e7cb5e81"
ACCOUNT_ID="019e2f82-e8c7-7182-8f94-5bb148e9ad43"
CREATED_BY="019e02b3-ec81-7bd2-abfd-19c2f5bc6973"

EXISTING_05_DRAFT="019e30f3-4245-7cbf-a754-dcd98a0f44d1"
EXISTING_05_MEDIA="019e30f3-4245-7409-a3fe-c5f1224f96f6"
EXISTING_05_R2_KEY="media/${PROJECT_ID}/${EXISTING_05_MEDIA}.jpg"

IMAGE_PATH="posts/neuera-care/instagram-launch/0/image-a.jpg"
IMAGE_BYTES=$(wc -c <"$IMAGE_PATH" | tr -d ' ')

# Generate 3 UUIDv7s for media (0.5 gets a new media row too — the old
# one is detached + soft-deleted) + 2 UUIDv7s for the 0.6/0.7 drafts.
read -r M05 M06 M07 D06 D07 < <(python3 -c '
import secrets, time
def uuidv7():
    ms = int(time.time()*1000)
    rnd = secrets.token_bytes(10)
    b = bytearray(16)
    b[0]=(ms>>40)&0xff; b[1]=(ms>>32)&0xff; b[2]=(ms>>24)&0xff
    b[3]=(ms>>16)&0xff; b[4]=(ms>>8)&0xff; b[5]=ms&0xff
    b[6:]=rnd; b[6]=(b[6]&0x0f)|0x70; b[8]=(b[8]&0x3f)|0x80
    h=b.hex(); return f"{h[0:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:]}"
print(uuidv7(), uuidv7(), uuidv7(), uuidv7(), uuidv7())
')

echo "media_05  = $M05"
echo "media_06  = $M06"
echo "media_07  = $M07"
echo "draft_06  = $D06"
echo "draft_07  = $D07"

# ----- 1. Upload image-A to R2 three times (one per draft) -----------------
upload_one() {
  local mid="$1"
  local key="media/${PROJECT_ID}/${mid}.jpg"
  ( cd api && bun x wrangler r2 object put "smm-media/$key" \
      --file "../$IMAGE_PATH" \
      --content-type "image/jpeg" \
      -c wrangler.local.toml ) | tail -2
  echo "uploaded · $key"
}
upload_one "$M05"
upload_one "$M06"
upload_one "$M07"

# Also delete the old 0.5 R2 object (cream-warm-with-badge image) — best-effort.
( cd api && bun x wrangler r2 object delete "smm-media/$EXISTING_05_R2_KEY" \
    -c wrangler.local.toml 2>&1 ) | tail -1 || true

# ----- 2. Extract caption bodies from the .md files ------------------------
# Strip the YAML frontmatter and the "## Caption" header line.
strip_caption() {
  awk 'p && /./ {print} /^## Caption$/ {p=1; next}' "$1" | sed '/^$/N;/^\n$/D'
}
CAPTION_E=$(strip_caption posts/neuera-care/instagram-launch/0/caption-e.md)
CAPTION_B=$(strip_caption posts/neuera-care/instagram-launch/0/caption-b.md)
CAPTION_D=$(strip_caption posts/neuera-care/instagram-launch/0/caption-d.md)

# ----- 3. Build a single SQL file that does everything ---------------------
TMPSQL=$(mktemp)
sqlesc() { printf "%s" "$1" | sed "s/'/''/g"; }

cat >"$TMPSQL" <<SQL
-- 3a. Detach + soft-delete the old 0.5 media (with the campaign badge)
DELETE FROM draft_media WHERE draft_id = '$EXISTING_05_DRAFT';
UPDATE media SET deleted_at = datetime('now') WHERE id = '$EXISTING_05_MEDIA';

-- 3b. Insert three fresh media rows pointing at image-A
INSERT INTO media (id, project_id, r2_key, filename, mime, bytes, width, height, uploaded_by)
VALUES
  ('$M05', '$PROJECT_ID', 'media/${PROJECT_ID}/${M05}.jpg', 'neuera-brand-intro.jpg', 'image/jpeg', $IMAGE_BYTES, 1080, 1350, '$CREATED_BY'),
  ('$M06', '$PROJECT_ID', 'media/${PROJECT_ID}/${M06}.jpg', 'neuera-brand-intro.jpg', 'image/jpeg', $IMAGE_BYTES, 1080, 1350, '$CREATED_BY'),
  ('$M07', '$PROJECT_ID', 'media/${PROJECT_ID}/${M07}.jpg', 'neuera-brand-intro.jpg', 'image/jpeg', $IMAGE_BYTES, 1080, 1350, '$CREATED_BY');

-- 3c. Update post 0.5 in place (caption E, image A)
UPDATE drafts
   SET title = 'Women''s health. Considered.',
       body  = '$(sqlesc "$CAPTION_E")',
       platform_options = json_set(COALESCE(platform_options, '{}'),
                                    '\$.seedNote', 'brand-intro variant E',
                                    '\$.captionVariant', 'E'),
       updated_at = datetime('now')
 WHERE id = '$EXISTING_05_DRAFT';
INSERT INTO draft_media (draft_id, media_id, position)
VALUES ('$EXISTING_05_DRAFT', '$M05', 0);

-- 3d. New draft at 0.6 (caption B)
INSERT INTO drafts (id, project_id, track_id, account_id, status,
                    title, body, body_format, platform_options,
                    track_offset_minutes, sequence_in_track,
                    scheduled_for, scheduled_tz, created_by)
VALUES (
  '$D06', '$PROJECT_ID', '$TRACK_ID', '$ACCOUNT_ID', 'draft',
  'For the woman who''s been told it''s normal.',
  '$(sqlesc "$CAPTION_B")',
  'markdown',
  '{"postKind":"image","shareToFeed":true,"seedSequence":0.6,"seedPillar":"brand","seedProgram":"brand","captionVariant":"B","seedNote":"brand-intro variant B"}',
  -1440, 0.6,
  '2026-05-19T05:00:00.000Z',
  'Asia/Kolkata',
  '$CREATED_BY'
);
INSERT INTO draft_media (draft_id, media_id, position)
VALUES ('$D06', '$M06', 0);

-- 3e. New draft at 0.7 (caption D)
INSERT INTO drafts (id, project_id, track_id, account_id, status,
                    title, body, body_format, platform_options,
                    track_offset_minutes, sequence_in_track,
                    scheduled_for, scheduled_tz, created_by)
VALUES (
  '$D07', '$PROJECT_ID', '$TRACK_ID', '$ACCOUNT_ID', 'draft',
  'We started neuera because women''s health deserved a different kind of room.',
  '$(sqlesc "$CAPTION_D")',
  'markdown',
  '{"postKind":"image","shareToFeed":true,"seedSequence":0.7,"seedPillar":"brand","seedProgram":"brand","captionVariant":"D","seedNote":"brand-intro variant D"}',
  -1440, 0.7,
  '2026-05-19T05:00:00.000Z',
  'Asia/Kolkata',
  '$CREATED_BY'
);
INSERT INTO draft_media (draft_id, media_id, position)
VALUES ('$D07', '$M07', 0);
SQL

# ----- 4. Apply ------------------------------------------------------------
( cd api && bun x wrangler d1 execute smm --remote -c wrangler.local.toml --file "$TMPSQL" ) | tail -6
rm -f "$TMPSQL"

echo ""
echo "✅ Brand-intro variants seeded."
echo "   0.5 (E) draft : $EXISTING_05_DRAFT  · media $M05"
echo "   0.6 (B) draft : $D06               · media $M06"
echo "   0.7 (D) draft : $D07               · media $M07"
echo "   visit https://smm.table.pw/p/neuera-care/t/$TRACK_ID"
