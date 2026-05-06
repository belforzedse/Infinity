#!/bin/sh
set -e
# Ensure uploads dir exists and is writable. The volume mounts over /app/public.
mkdir -p /app/public/uploads
# Fix ownership for entire /app so Strapi (node) can write e.g. documentation JSON.
chown -R node:node /app
exec su-exec node "$@"
