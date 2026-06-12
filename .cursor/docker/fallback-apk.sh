#!/bin/sh
set -eu

original_repositories="$(mktemp)"
download_dir="$(mktemp -d)"
cp /etc/apk/repositories "$original_repositories"

cleanup() {
  rm -rf "$download_dir"
  rm -f "$original_repositories"
}

try_repositories() {
  if apk update >/dev/null 2>&1 && apk fetch --recursive --output "$download_dir" "$@" >/dev/null 2>&1; then
    apk add --no-cache "$@"
    cleanup
    exit 0
  fi
  rm -rf "$download_dir"
  download_dir="$(mktemp -d)"
}

sed -i 's|https://dl-cdn.alpinelinux.org/alpine|https://mirror.arvancloud.ir/alpine|g' /etc/apk/repositories
try_repositories "$@"

echo "Arvan Alpine mirror failed preflight; retrying with default Alpine repositories."
cp "$original_repositories" /etc/apk/repositories
try_repositories "$@"

echo "Default Alpine repositories failed preflight."
cleanup
exit 1
