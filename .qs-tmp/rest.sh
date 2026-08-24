#!/bin/zsh
# Service-Role-REST-Helper: rest.sh 'projects?select=id&limit=1' [curl-args...]
cd "$(dirname "$0")/.."
URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d= -f2)
KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | cut -d= -f2)
Q="$1"; shift
curl -s --max-time 30 "$URL/rest/v1/$Q" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" "$@"
