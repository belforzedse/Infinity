#!/bin/bash
set -e

# Create database specified in POSTGRES_DB env var if it doesn't exist
# This is idempotent - safe to run multiple times
psql -v ON_ERROR_STOP=1 --username="$POSTGRES_USER" --dbname="postgres" <<-EOSQL
    CREATE DATABASE IF NOT EXISTS "$POSTGRES_DB";
EOSQL

echo "Database '$POSTGRES_DB' is ready."
