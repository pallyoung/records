#!/usr/bin/env sh
set -eu

staged_files="$(git diff --cached --name-only --diff-filter=ACMR)"

if [ -z "$staged_files" ]; then
  exit 0
fi

while IFS= read -r file; do
  case "$file" in
    src/shared/icons/*)
      continue
      ;;
    *.ts|*.tsx|*.js|*.jsx)
      if git show ":$file" | grep -q "@phosphor-icons/react"; then
        echo "Error: forbidden direct icon import in $file"
        echo "Use src/shared/icons as the only icon import gateway."
        exit 1
      fi
      ;;
  esac
done <<EOF
$staged_files
EOF
