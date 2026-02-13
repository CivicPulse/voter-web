#!/usr/bin/env bash
set -euo pipefail

BUCKET="voteweb"
DIST_DIR="dist"
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-6d837580a4d0641139ecada9e74076b8}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

get_content_type() {
  case "${1##*.}" in
    html) echo "text/html; charset=utf-8" ;;
    js)   echo "application/javascript; charset=utf-8" ;;
    css)  echo "text/css; charset=utf-8" ;;
    json) echo "application/json; charset=utf-8" ;;
    svg)  echo "image/svg+xml" ;;
    png)  echo "image/png" ;;
    jpg|jpeg) echo "image/jpeg" ;;
    gif)  echo "image/gif" ;;
    ico)  echo "image/x-icon" ;;
    webp) echo "image/webp" ;;
    woff) echo "font/woff" ;;
    woff2) echo "font/woff2" ;;
    ttf)  echo "font/ttf" ;;
    map)  echo "application/json" ;;
    txt)  echo "text/plain; charset=utf-8" ;;
    xml)  echo "application/xml" ;;
    webmanifest) echo "application/manifest+json" ;;
    *)    echo "application/octet-stream" ;;
  esac
}

get_cache_control() {
  if [[ "$1" == assets/* ]]; then
    echo "public, max-age=31536000, immutable"
  else
    echo "public, no-cache"
  fi
}

cd "$PROJECT_DIR"

echo "=== Building for production ==="
npm run build

echo ""
echo "=== Deploying to R2 bucket: $BUCKET ==="

FILE_COUNT=0
FAIL_COUNT=0

while IFS= read -r -d '' file; do
  key="${file#${DIST_DIR}/}"
  content_type=$(get_content_type "$file")
  cache_control=$(get_cache_control "$key")

  echo "  Uploading: $key ($content_type)"

  if npx wrangler r2 object put "${BUCKET}/${key}" \
    --file "$file" \
    --content-type "$content_type" \
    --cache-control "$cache_control" \
    --remote 2>&1; then
    FILE_COUNT=$((FILE_COUNT + 1))
  else
    echo "  ERROR: Failed to upload $key"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
done < <(find "$DIST_DIR" -type f -print0)

echo ""
echo "=== Deployment complete ==="
echo "  Files uploaded: $FILE_COUNT"
if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "  Files FAILED:   $FAIL_COUNT"
  exit 1
fi
echo "  Bucket: $BUCKET"
echo "  URL: https://vote.kerryhatcher.com/"
echo ""
echo "  ** Remember to purge the Cloudflare cache after deploying **"
echo "  Dashboard: kerryhatcher.com > Caching > Configuration > Purge Everything"
