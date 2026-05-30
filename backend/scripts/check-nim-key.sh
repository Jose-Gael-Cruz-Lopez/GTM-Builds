#!/usr/bin/env bash
# check-nim-key.sh — diagnose a NVIDIA NIM API key.
#
# Distinguishes the three states that all otherwise look like "AI is broken"
# and silently fall back to canned campaign text in src/lib/nim.ts:
#
#   200  key works for inference          → good
#   401  key missing / wrong              → set NIM_API_KEY
#   403  key valid but NO inference quota → account out of credits / not entitled
#
# THE TRAP: GET /v1/models returns 200 even for a key that cannot run any model.
# That is why this script tests an actual chat completion, not just the catalog.
#
# Usage:
#   backend/scripts/check-nim-key.sh                 # reads NIM_API_KEY from backend/.dev.vars
#   NIM_API_KEY=nvapi-... backend/scripts/check-nim-key.sh
#   backend/scripts/check-nim-key.sh nvapi-...       # key as first arg
set -euo pipefail

command -v curl >/dev/null || { echo "ERROR: curl is required but not installed" >&2; exit 3; }

NIM_URL="https://integrate.api.nvidia.com/v1"
# Model used for campaigns in src/lib/nim.ts (NIM_CAMPAIGNS_MODEL).
TEST_MODEL="meta/llama-3.3-70b-instruct"

load_key() {
  # Precedence: CLI arg > env var > backend/.dev.vars
  if [ "${1:-}" != "" ]; then
    KEY="$1"
    return
  fi
  if [ "${NIM_API_KEY:-}" != "" ]; then
    KEY="$NIM_API_KEY"
    return
  fi
  local dotvars
  dotvars="$(dirname "$0")/../.dev.vars"
  if [ -f "$dotvars" ]; then
    # Take the value after '=', drop an inline '# comment', then strip
    # surrounding quotes/whitespace/CR so a quoted or commented line still works.
    KEY="$(grep '^NIM_API_KEY=' "$dotvars" | head -1 | cut -d= -f2- | cut -d'#' -f1 | tr -d '"'"'"' \r\n')"
    # grep failure under set -e doesn't abort an assignment, so an absent or
    # blank NIM_API_KEY line leaves KEY empty — fail loudly instead of testing "".
    if [ -z "$KEY" ]; then
      echo "ERROR: NIM_API_KEY is missing or blank in $dotvars" >&2
      exit 2
    fi
    return
  fi
  echo "ERROR: no key found (arg, NIM_API_KEY env, or backend/.dev.vars)" >&2
  exit 2
}

http_status() {
  # $1 = full URL, remaining args appended to curl.
  # --max-time guards against a hung endpoint; curl emits 000 on timeout.
  curl -s --max-time 15 -o /dev/null -w '%{http_code}' "$@"
}

check_catalog() {
  echo -n "1/2  GET /v1/models (auth only) ... "
  CATALOG_CODE="$(http_status "$NIM_URL/models" -H "Authorization: Bearer $KEY")"
  echo "HTTP $CATALOG_CODE"
}

check_inference() {
  echo -n "2/2  POST /v1/chat/completions ($TEST_MODEL) ... "
  INFERENCE_CODE="$(http_status "$NIM_URL/chat/completions" \
    -H "Authorization: Bearer $KEY" \
    -H 'Content-Type: application/json' \
    -d "{\"model\":\"$TEST_MODEL\",\"max_tokens\":5,\"messages\":[{\"role\":\"user\",\"content\":\"hi\"}]}")"
  echo "HTTP $INFERENCE_CODE"
}

verdict() {
  echo
  case "$INFERENCE_CODE" in
    200)
      echo "✅ OK — key works for inference. Set it in prod with:"
      echo "     echo \"\$NIM_API_KEY\" | npx wrangler secret put NIM_API_KEY" ;;
    000)
      echo "❌ 000 — no HTTP response (timeout or no network). Check connectivity." ;;
    401)
      echo "❌ 401 — key missing or wrong. Check NIM_API_KEY." ;;
    403)
      echo "❌ 403 — key authenticates but has NO inference quota."
      echo "   The NVIDIA account is out of credits or the key is not entitled."
      echo "   Catalog returned $CATALOG_CODE — that 200 does NOT mean the key works."
      echo "   Fix: use a key from a build.nvidia.com account WITH credits." ;;
    *)
      echo "⚠️  Unexpected HTTP $INFERENCE_CODE — inspect manually." ;;
  esac
  [ "$INFERENCE_CODE" = "200" ]
}

main() {
  load_key "${1:-}"
  echo "Testing NIM key (length ${#KEY})"
  check_catalog
  check_inference
  verdict
}

main "$@"
