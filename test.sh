#!/usr/bin/env bash
set -euo pipefail

FLOWS_DIR=".maestro/flows"
PASS=0
FAIL=0
FAILED_FLOWS=()

run_flow() {
  local flow="$1"
  local name
  name=$(basename "$flow")
  echo ""
  echo "▶ $name"
  if maestro test "$flow"; then
    echo "✓ $name"
    PASS=$((PASS + 1))
  else
    echo "✗ $name"
    FAIL=$((FAIL + 1))
    FAILED_FLOWS+=("$name")
  fi
}

for flow in "$FLOWS_DIR"/*.yaml; do
  run_flow "$flow"
done

echo ""
echo "─────────────────────────────────"
echo "Resultado: $PASS passou, $FAIL falhou"

if [ ${#FAILED_FLOWS[@]} -gt 0 ]; then
  echo ""
  echo "Flows com falha:"
  for f in "${FAILED_FLOWS[@]}"; do
    echo "  • $f"
  done
  exit 1
fi
