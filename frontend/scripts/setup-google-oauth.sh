#!/usr/bin/env bash
# Configure Google OAuth on hosted Supabase (NexoLeal project).
#
# Prerequisites:
# 1. Create a Google OAuth "Web application" client at:
#    https://console.cloud.google.com/apis/credentials
#    - Authorized redirect URI (required):
#      https://lajrjnjyvbpaaspzgpvh.supabase.co/auth/v1/callback
#    - Authorized JavaScript origins (optional for dev):
#      http://localhost:5173
#
# 2. Create a Supabase access token:
#    https://supabase.com/dashboard/account/tokens
#
# Usage:
#   export SUPABASE_ACCESS_TOKEN="sbp_..."
#   export GOOGLE_CLIENT_ID="123....apps.googleusercontent.com"
#   export GOOGLE_CLIENT_SECRET="GOCSPX-..."
#   ./scripts/setup-google-oauth.sh

set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-lajrjnjyvbpaaspzgpvh}"
SITE_URL="${SITE_URL:-http://localhost:5173}"
REDIRECT_URL="${REDIRECT_URL:-http://localhost:5173/auth/callback}"
PRODUCTION_SITE_URL="${PRODUCTION_SITE_URL:-https://tanstack-start-app.nexoleal.workers.dev}"
PRODUCTION_REDIRECT_URL="${PRODUCTION_REDIRECT_URL:-https://tanstack-start-app.nexoleal.workers.dev/auth/callback}"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Missing SUPABASE_ACCESS_TOKEN. Create one at https://supabase.com/dashboard/account/tokens"
  exit 1
fi

if [[ -z "${GOOGLE_CLIENT_ID:-}" || -z "${GOOGLE_CLIENT_SECRET:-}" ]]; then
  echo "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET."
  echo "Create a Web OAuth client in Google Cloud Console first."
  exit 1
fi

URI_ALLOW_LIST="${SITE_URL},${REDIRECT_URL},${PRODUCTION_SITE_URL},${PRODUCTION_REDIRECT_URL}"

echo "Configuring Google OAuth for project ${PROJECT_REF}..."

curl -sS -X PATCH "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(cat <<EOF
{
  "site_url": "${SITE_URL}",
  "uri_allow_list": "${URI_ALLOW_LIST}",
  "external_google_enabled": true,
  "external_google_client_id": "${GOOGLE_CLIENT_ID}",
  "external_google_secret": "${GOOGLE_CLIENT_SECRET}",
  "external_google_skip_nonce_check": false
}
EOF
)" | python3 -m json.tool 2>/dev/null || true

echo ""
echo "Done. Verify in Dashboard → Authentication → Providers → Google"
echo "Test locally: click Negocios on http://localhost:5173"
