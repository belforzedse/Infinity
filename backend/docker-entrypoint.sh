#!/bin/sh
set -e
# Ensure uploads dir exists and is writable by Strapi (node user). The volume
# mounts over /app/public, so we must create uploads at runtime.
mkdir -p /app/public/uploads
chown -R node:node /app/public
exec su-exec node "$@"
