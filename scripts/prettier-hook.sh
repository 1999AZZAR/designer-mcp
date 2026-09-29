#!/usr/bin/env bash
# Pre-commit formatter entry point.
#
# Why a wrapper instead of the mirrors-prettier hook: pre-commit 4.6.x installs
# node-language hooks with `npm install --allow-git=root`, and npm 11 refuses
# git-sourced packages for non-root users, so that hook cannot install on this
# machine at all. Running prettier as a system command keeps the check working
# and removes the per-machine nodeenv install.
#
# Resolution order: project-local prettier (pinned in package-lock.json), then
# whichever prettier is on PATH. If neither exists the hook warns and passes —
# a missing formatter must never block a commit.

set -euo pipefail

resolve_prettier() {
  if [ -x "node_modules/.bin/prettier" ]; then
    printf '%s\n' "node_modules/.bin/prettier"
  elif command -v prettier >/dev/null 2>&1; then
    printf '%s\n' "$(command -v prettier)"
  else
    return 1
  fi
}

if ! PRETTIER="$(resolve_prettier)"; then
  echo "prettier not found (looked for node_modules/.bin/prettier and PATH)." >&2
  echo "Run 'npm install --save-dev prettier' to enable formatting in pre-commit." >&2
  exit 0
fi

if [ "$#" -eq 0 ]; then
  echo "prettier: no files passed" >&2
  exit 0
fi

# prettier exits 1 when it rewrites files, which is exactly what pre-commit
# wants: fail the commit so the fix gets staged.
exec "$PRETTIER" --write "$@"
