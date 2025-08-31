#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-http://localhost:8080}"

has_jq() { command -v jq >/dev/null 2>&1; }
pp()     { if has_jq; then jq; else cat; fi; }

echo "== /health =="
curl -s "$BASE/health" | pp

echo "== /api/inventory =="
curl -s "$BASE/api/inventory" | pp

echo "== /api/savings =="
curl -s "$BASE/api/savings" | pp

echo "== /api/fixplan =="
curl -s "$BASE/api/fixplan" | pp

# Costs (opcional): mes anterior completo
if [ "${INCLUDE_COSTS:-1}" = "1" ]; then
  # rango del mes anterior (UTC)
  START=$(date -u -d "$(date +%Y-%m-01) -1 month" +%Y-%m-01)
  END=$(date -u -d "$(date +%Y-%m-01) -1 day" +%Y-%m-%d)
  echo "== /api/costs?from=$START&to=$END =="
  curl -s "$BASE/api/costs?from=$START&to=$END" | pp
fi