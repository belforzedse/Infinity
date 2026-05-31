#!/usr/bin/env sh
# Install pnpm deps with registry fallback (Abrha → Liara → Runflare → npmjs.org).
# Usage:
#   .cursor/scripts/pnpm-install-with-fallback.sh [@repo/frontend...]
#   .cursor/scripts/pnpm-install-with-fallback.sh @repo/social... --frozen-lockfile
set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"
FALLBACK="$ROOT/.cursor/docker/fallback-registry.sh"

PRIMARY="https://mirror.abrha.net/repository/npm/"
SECOND="https://package-mirror.liara.ir/repository/npm/"
THIRD="https://mirror-npm.runflare.com/"
FINAL="https://registry.npmjs.org/"

if [ ! -x "$FALLBACK" ]; then
  chmod +x "$FALLBACK"
fi

cd "$ROOT"
exec "$FALLBACK" "$PRIMARY" "$SECOND" "$THIRD" "$FINAL" pnpm install "$@"
