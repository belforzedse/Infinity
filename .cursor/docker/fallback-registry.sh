#!/bin/sh
set -eu

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

if [ "$#" -lt 2 ]; then
  echo "usage: fallback-registry.sh <registry> [registry...] <command...>" >&2
  exit 1
fi

registries=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    http://*|https://*)
      registries="$registries $1"
      shift
      ;;
    *)
      break
      ;;
  esac
done

if [ -z "$registries" ] || [ "$#" -eq 0 ]; then
  echo "usage: fallback-registry.sh <registry> [registry...] <command...>" >&2
  exit 1
fi

attempt=0
for registry in $registries; do
  attempt=$((attempt + 1))
  if [ "$attempt" -eq 1 ]; then
    if run_with_registry "$registry" "$@"; then
      exit 0
    fi
    echo "Primary npm registry failed: $registry"
  else
    echo "Retrying with fallback npm registry: $registry"
    if run_with_registry "$registry" "$@"; then
      exit 0
    fi
    echo "Fallback npm registry failed: $registry"
  fi
done

echo "All npm registries failed"
exit 1
