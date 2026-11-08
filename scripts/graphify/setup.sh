#!/usr/bin/env bash
# Instala o graphify e gera o grafo de código em graphify-out/ (uso local; na nuvem quem faz isso é
# .claude/hooks/session-start.sh). Veja scripts/graphify/README.md.
set -euo pipefail

GRAPHIFY_VERSION="${GRAPHIFY_VERSION:-0.9.68}"

cd "$(git rev-parse --show-toplevel)"
export PATH="$HOME/.local/bin:$PATH"

if ! graphify --version 2>/dev/null | grep -qx "graphify ${GRAPHIFY_VERSION}"; then
  if command -v uv >/dev/null 2>&1; then
    uv tool install --force "graphifyy[sql]==${GRAPHIFY_VERSION}"
  elif command -v pipx >/dev/null 2>&1; then
    pipx install --force "graphifyy[sql]==${GRAPHIFY_VERSION}"
  else
    python3 -m pip install --user --quiet "graphifyy[sql]==${GRAPHIFY_VERSION}"
  fi
fi

graphify --version
mkdir -p graphify-out
PYTHONHASHSEED=0 graphify update .
echo "grafo em graphify-out/ (graph.json, graph.html, GRAPH_REPORT.md)"
