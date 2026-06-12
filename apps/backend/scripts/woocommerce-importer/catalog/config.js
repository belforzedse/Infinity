"use strict";

/**
 * Build the catalog importer config for a target environment.
 *
 * Reuses the existing `../config.js` (same env-var names and structure that the
 * shared utilities — ImageUploader, color mappings, etc. — already expect) and
 * layers the new catalog-specific options on top. No new required env vars.
 */

const path = require("path");

const ENV_CONFIG = {
  production: {
    strapiUrl: process.env.STRAPI_IMPORT_PRODUCTION_URL || "https://api.infinitycolor.co/api",
    trackingDir: "./import-tracking/production",
    tokenEnv: "STRAPI_API_TOKEN_PRODUCTION",
  },
  staging: {
    strapiUrl: process.env.STRAPI_IMPORT_STAGING_URL || "https://api.staging.infinitycolor.co/api",
    trackingDir: "./import-tracking/staging",
    tokenEnv: "STRAPI_API_TOKEN_STAGING",
  },
  local: {
    strapiUrl: process.env.STRAPI_IMPORT_LOCAL_URL || "http://localhost:1337/api",
    trackingDir: "./import-tracking/local",
    tokenEnv: "STRAPI_API_TOKEN_LOCAL",
  },
};

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

/**
 * @param {"production"|"staging"|"local"} envName
 * @returns {{ config: object, envConfig: object }}
 */
function buildConfig(envName) {
  const envConfig = ENV_CONFIG[envName];
  if (!envConfig) {
    throw new Error(`Unknown environment: ${envName}. Use production, staging, or local.`);
  }

  // Ensure ../config reads the right Strapi target/tracking dir.
  process.env.STRAPI_IMPORT_PRODUCTION_URL = envConfig.strapiUrl;
  process.env.IMPORT_TRACKING_DIR = envConfig.trackingDir;
  process.env.IMPORT_FILTER_IN_STOCK_ONLY = "false";

  const token = requireEnv(envConfig.tokenEnv);

  // Load base config AFTER env is set.
  const config = require("../config");
  config.strapi.baseUrl = envConfig.strapiUrl;
  config.strapi.usePublicAccess = false;
  config.strapi.auth.token = token;
  config.duplicateTracking.storageDir = envConfig.trackingDir;
  config.import.filters.inStockOnly = false;

  // New catalog-specific knobs (with safe defaults).
  config.catalog = {
    defaultInStockCount: Number.parseInt(process.env.IMPORT_STOCK_DEFAULT_INSTOCK_COUNT || "9999", 10),
    allowHttpMedia: envName === "local" || process.env.IMPORT_MEDIA_ALLOW_HTTP === "true",
    perPage: Number.parseInt(process.env.IMPORT_BATCH_PRODUCTS || "100", 10),
    maxRetries: Number.parseInt(process.env.IMPORT_ERROR_MAX_RETRIES || "4", 10),
    baseRetryDelay: Number.parseInt(process.env.IMPORT_ERROR_RETRY_DELAY || "1000", 10),
    trackingDirAbs: path.resolve(process.cwd(), envConfig.trackingDir),
  };

  return { config, envConfig };
}

module.exports = { buildConfig, ENV_CONFIG };
