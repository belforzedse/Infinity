"use strict";

/**
 * Pure preset / scope resolution for the catalog importer.
 *
 * A "scope" controls which phases run and how variations are written. The TUI and
 * CLI map a user-facing preset to a scope + run options. Kept pure so every preset
 * is unit-tested (no surprise side effects when someone picks "Stock Sync").
 *
 * WooCommerce is always the read-only source of truth; no scope ever writes to WC.
 */

const SCOPES = ["full", "no-media", "categories", "stock", "price", "media"];

/**
 * Resolve a scope to concrete phase flags.
 * @param {string} scope
 * @param {{ skipMedia?: boolean }} [opts]
 * @returns {{ categories:boolean, products:boolean, variations:boolean, stock:boolean,
 *   media:boolean, onlyExisting:boolean, variationFields:"all"|"price-only"|"none" }}
 */
function resolveScope(scope, opts = {}) {
  const skipMedia = Boolean(opts.skipMedia);
  switch (scope) {
    case "full":
      return f({ categories: true, products: true, variations: true, stock: true, media: !skipMedia, variationFields: "all" });
    case "no-media":
      return f({ categories: true, products: true, variations: true, stock: true, media: false, variationFields: "all" });
    case "categories":
      return f({ categories: true });
    case "stock":
      return f({ stock: true, onlyExisting: true });
    case "price":
      return f({ variations: true, onlyExisting: true, variationFields: "price-only" });
    case "media":
      return f({ media: true, onlyExisting: true });
    default:
      throw new Error(`Unknown scope: ${scope}. Use one of: ${SCOPES.join(", ")}`);
  }
}

/** Fill defaults for a flags object. */
function f(partial) {
  return {
    categories: false,
    products: false,
    variations: false,
    stock: false,
    media: false,
    onlyExisting: false,
    variationFields: "none",
    ...partial,
  };
}

/** True when the product loop needs to run at all for these flags. */
function needsProductLoop(flags) {
  return flags.products || flags.variations || flags.stock || flags.media;
}

/**
 * The user-facing preset catalogue (rendered by the TUI). Each entry maps to
 * `runSync`/`runVerify` options. `confirm: true` means a live (non-dry) run must be
 * typed-confirmed.
 */
const PRESETS = [
  { id: "full", label: "Full Sync", description: "Categories + products + variations + stock + media", run: { scope: "full" }, confirm: true },
  { id: "no-media", label: "Full Sync — No Media", description: "Everything except image/video upload (fast)", run: { scope: "no-media" }, confirm: true },
  { id: "dry-run", label: "Catalog Dry-Run", description: "Preview a full sync — no writes", run: { scope: "full", dryRun: true }, confirm: false },
  { id: "stock", label: "Stock Sync", description: "Refresh stock Count for existing variations only", run: { scope: "stock" }, confirm: true },
  { id: "price", label: "Price Sync", description: "Update Price/DiscountPrice on existing variations only", run: { scope: "price" }, confirm: true },
  { id: "media", label: "Media Sync", description: "Upload & attach missing media for existing products only", run: { scope: "media" }, confirm: true },
  { id: "categories", label: "Categories Only", description: "Sync categories only", run: { scope: "categories" }, confirm: true },
  { id: "verify", label: "Verify", description: "Compare WooCommerce ↔ Strapi by external_id (read-only)", verify: true, confirm: false },
];

/**
 * Resolve a preset id to its run descriptor.
 * @param {string} id
 * @returns {{ id:string, label:string, verify?:boolean, run?:object, confirm:boolean }}
 */
function resolvePreset(id) {
  const preset = PRESETS.find((p) => p.id === id);
  if (!preset) {
    throw new Error(`Unknown preset: ${id}`);
  }
  return preset;
}

module.exports = { SCOPES, PRESETS, resolveScope, resolvePreset, needsProductLoop };
