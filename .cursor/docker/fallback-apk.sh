#!/bin/sh
set -eu

fallback_repositories="$(mktemp)"
cp /etc/apk/repositories "$fallback_repositories"

sed -i 's|https://dl-cdn.alpinelinux.org/alpine|https://mirror.arvancloud.ir/alpine|g' /etc/apk/repositories

if apk add --no-cache "$@"; then
  rm -f "$fallback_repositories"
  exit 0
fi

echo "Arvan Alpine mirror failed; retrying with default Alpine repositories."
cp "$fallback_repositories" /etc/apk/repositories
rm -f "$fallback_repositories"
apk add --no-cache "$@"
