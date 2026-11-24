#!/usr/bin/env bash
# Roda as assercoes versionadas do motor de Pesquisa de Clima num Postgres 16 efemero.
# Uso: bash supabase/tests/climate/run.sh
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$DIR/../../.." && pwd)"
CONTAINER="${CLIMATE_PG_CONTAINER:-climate_sql_check}"
MIGRATION="supabase/migrations/20261123180000_climate_survey_engine.sql"

docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" -e POSTGRES_PASSWORD=pw postgres:16 >/dev/null
trap 'docker rm -f "$CONTAINER" >/dev/null 2>&1 || true' EXIT

for _ in $(seq 1 45); do
  docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 1
done

docker cp "$DIR/stubs.sql" "$CONTAINER":/tmp/stubs.sql >/dev/null
docker cp "$DIR/assertions.sql" "$CONTAINER":/tmp/assertions.sql >/dev/null
docker cp "$REPO/$MIGRATION" "$CONTAINER":/tmp/mig.sql >/dev/null

psql_run() { docker exec "$CONTAINER" psql -U postgres -v ON_ERROR_STOP=1 "$@"; }

echo "== stubs =="
psql_run -q -f /tmp/stubs.sql
echo "== migration (aplicacao) =="
psql_run -q -f /tmp/mig.sql
echo "== migration (replay idempotente) =="
psql_run -q -f /tmp/mig.sql
echo "== assercoes =="
psql_run -f /tmp/assertions.sql
echo "OK: assercoes do clima passaram"