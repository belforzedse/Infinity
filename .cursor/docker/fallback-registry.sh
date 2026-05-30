#!/bin/sh
set -eu

primary_registry="${1:?primary registry is required}"
fallback_registry="${2:?fallback registry is required}"
shift 2

run_with_registry() {
  registry="$1"
  shift

  export COREPACK_NPM_REGISTRY="$registry"
  export npm_config_registry="$registry"
  export NPM_CONFIG_REGISTRY="$registry"

  corepack enable \
    && corepack prepare pnpm@10.28.2 --activate \
    && pnpm config set registry "$registry" \
    && "$@"
}

if run_with_registry "$primary_registry" "$@"; then
  exit 0
fi

echo "Primary npm registry failed: $primary_registry"
echo "Retrying with fallback npm registry: $fallback_registry"
run_with_registry "$fallback_registry" "$@"
