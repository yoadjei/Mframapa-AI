#!/usr/bin/env bash
# fail if a tracked .env*.example holds anything that looks like a real secret.
# run manually or wire as a pre-commit hook:  ./scripts/check-example-env.sh
set -euo pipefail

bad=0
while IFS= read -r file; do
  # jwts, long tokens, api-key prefixes on the right of an '='
  if grep -nEi '=(eyJ[A-Za-z0-9_-]{20,}|AQ\.[A-Za-z0-9._-]{20,}|sk-[A-Za-z0-9]{20,}|[A-Za-z0-9_-]{40,})' "$file" >/dev/null 2>&1; then
    echo "SECRET-LOOKING VALUE in tracked template: $file"
    grep -nEi '=(eyJ[A-Za-z0-9_-]{20,}|AQ\.[A-Za-z0-9._-]{20,}|sk-[A-Za-z0-9]{20,}|[A-Za-z0-9_-]{40,})' "$file" | sed 's/=.*/=<REDACTED>/'
    bad=1
  fi
done < <(git ls-files '*.env.example' '*.env*.example' 2>/dev/null)

if [ "$bad" -ne 0 ]; then
  echo
  echo "example env files must contain empty placeholders, not real values."
  echo "put the real value in .env (gitignored), not .env.example (tracked)."
  exit 1
fi
echo "example env files are clean."
