#!/usr/bin/env bash
# Roda as assercoes versionadas do motor de Pesquisa de Clima num Postgres 16 efemero.
# Uso: bash scripts/climate-sql-check/run.sh
# As fixtures SQL ficam em supabase/tests/climate/ (junto dos testes).
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$DIR/../.." && pwd)"
FIXTURES="$REPO/supabase/tests/climate"
MIGRATION="supabase/migrations/20261123180000_climate_survey_engine.sql"

# O nome do container e' gerado pelo Docker: o runner nunca remove um container
# que nao criou (uma execucao paralela nao derruba a outra).
CONTAINER_ID="$(docker run -d -e POSTGRES_PASSWORD=pw postgres:16)"
trap 'docker rm -f "$CONTAINER_ID" >/dev/null 2>&1 || true' EXIT

for _ in $(seq 1 45); do
  docker exec "$CONTAINER_ID" pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 1
done

docker cp "$FIXTURES/stubs.sql" "$CONTAINER_ID":/tmp/stubs.sql >/dev/null
docker cp "$FIXTURES/assertions.sql" "$CONTAINER_ID":/tmp/assertions.sql >/dev/null
docker cp "$REPO/$MIGRATION" "$CONTAINER_ID":/tmp/mig.sql >/dev/null

psql_run() { docker exec "$CONTAINER_ID" psql -U postgres -v ON_ERROR_STOP=1 "$@"; }

echo "== stubs =="
psql_run -q -f /tmp/stubs.sql
echo "== migration (aplicacao) =="
psql_run -q -f /tmp/mig.sql
echo "== migration (replay idempotente) =="
psql_run -q -f /tmp/mig.sql
echo "== assercoes =="
psql_run -f /tmp/assertions.sql
echo "OK: assercoes do clima passaram"