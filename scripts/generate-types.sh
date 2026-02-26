#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INPUT="$ROOT_DIR/shared/contracts/openapi.yaml"
OUTPUT="$ROOT_DIR/shared/types/api.ts"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required to generate types."
  exit 1
fi

npx --yes openapi-typescript "$INPUT" --output "$OUTPUT"
echo "Generated $OUTPUT"
