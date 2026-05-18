#!/usr/bin/env bash
# Seed "post 0" (the intro/welcome image) into D1 + R2.
# Run from repo root.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"

export CLOUDFLARE_API_TOKEN=$(grep '^CLOUDFLARE_API_TOKEN=' what_i_need.md | cut -d= -f2)
export CLOUDFLARE_ACCOUNT_ID=$(grep '^CLOUDFLARE_ACCOUNT_ID=' what_i_need.md | cut -d= -f2)

PROJECT_ID="978f15b0-368e-7316-8faa-72c4ef6a9f6b"          # neuera-care
TRACK_ID="019e2f74-7b75-7f03-b6eb-0491e7cb5e81"            # Neuera Instagram Page 45-day launch Track
ACCOUNT_ID="019e2f82-e8c7-7182-8f94-5bb148e9ad43"          # dummy IG @neuera.care
CREATED_BY="019e02b3-ec81-7bd2-abfd-19c2f5bc6973"          # sangeet user
IMAGE_PATH="/tmp/neuera-post0.jpg"

# Generate UUIDv7s in Python (matches the build.py helper).
read -r MEDIA_ID DRAFT_ID < <(python3 -c '
import secrets, time
def uuidv7():
    ms = int(time.time()*1000)
    rnd = secrets.token_bytes(10)
    b = bytearray(16)
    b[0]=(ms>>40)&0xff; b[1]=(ms>>32)&0xff; b[2]=(ms>>24)&0xff
    b[3]=(ms>>16)&0xff; b[4]=(ms>>8)&0xff; b[5]=ms&0xff
    b[6:]=rnd; b[6]=(b[6]&0x0f)|0x70; b[8]=(b[8]&0x3f)|0x80
    h=b.hex()
    return f"{h[0:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:]}"
print(uuidv7(), uuidv7())
')
R2_KEY="media/${PROJECT_ID}/${MEDIA_ID}.jpg"
BYTES=$(wc -c <"$IMAGE_PATH" | tr -d ' ')

echo "media_id  = $MEDIA_ID"
echo "draft_id  = $DRAFT_ID"
echo "r2_key    = $R2_KEY"
echo "bytes     = $BYTES"

# 1. Upload image to R2 (no --remote flag for r2; that's d1-only).
( cd api && bun x wrangler r2 object put "smm-media/$R2_KEY" \
    --file "$IMAGE_PATH" \
    --content-type "image/jpeg" \
    -c wrangler.local.toml ) | tail -3

# 2. Insert media row.
( cd api && bun x wrangler d1 execute smm --remote -c wrangler.local.toml --command "
INSERT INTO media (id, project_id, r2_key, filename, mime, bytes, width, height, uploaded_by)
VALUES ('$MEDIA_ID', '$PROJECT_ID', '$R2_KEY', 'neuera-post0.jpg', 'image/jpeg', $BYTES, 1080, 1350, '$CREATED_BY');
" ) | tail -3

# 3. Insert draft row.
CAPTION=$'Welcome to neuera.\n\nFor the next 45 days we are going to walk through everything we treat — PCOS, irregular periods, perimenopause, menopause, fertility, the labs that matter, and the things every woman should know but rarely gets told.\n\nClinician-led. Warm. Judgement-free.\n\nFollow along.'
TITLE="Welcome — meet neuera"
OPTIONS='{"postKind":"image","shareToFeed":true,"seedSequence":0,"seedPillar":"brand","seedProgram":"brand","seedNote":"Auto-generated intro card for post 0"}'

# Use a HEREDOC + --file because the caption has newlines + quotes.
TMPSQL=$(mktemp)
cat >"$TMPSQL" <<SQL
INSERT INTO drafts (id, project_id, track_id, account_id, status,
                    title, body, body_format, platform_options,
                    track_offset_minutes, sequence_in_track,
                    scheduled_for, scheduled_tz, created_by)
VALUES (
  '$DRAFT_ID',
  '$PROJECT_ID',
  '$TRACK_ID',
  '$ACCOUNT_ID',
  'draft',
  '$(printf "%s" "$TITLE" | sed "s/'/''/g")',
  '$(printf "%s" "$CAPTION" | sed "s/'/''/g")',
  'markdown',
  '$(printf "%s" "$OPTIONS" | sed "s/'/''/g")',
  -1440, 0.5,
  '2026-05-19T05:00:00.000Z',
  'Asia/Kolkata',
  '$CREATED_BY'
);

INSERT INTO draft_media (draft_id, media_id, position) VALUES ('$DRAFT_ID', '$MEDIA_ID', 0);
SQL

( cd api && bun x wrangler d1 execute smm --remote -c wrangler.local.toml --file "$TMPSQL" ) | tail -5
rm -f "$TMPSQL"

echo ""
echo "✅ Post 0 seeded."
echo "   draft id : $DRAFT_ID"
echo "   media id : $MEDIA_ID"
echo "   r2 key   : $R2_KEY"
echo "   visit    : https://smm.table.pw/p/neuera-care/draft/$DRAFT_ID"
