"use strict";

/**
 * Slug handling for the catalog importer.
 *
 * Design decision: the WooCommerce slug is the source of truth and is imported
 * **verbatim** (URL-decoded only). WooCommerce slugs are already URL-safe, stable
 * across runs, and preserve existing SEO URLs — so we do NOT regenerate them from
 * the title. The legacy importer regenerated Persian slugs with a `Date.now()`
 * fallback, which produced a different slug on every run and broke idempotent
 * matching. We only fall back when the WooCommerce slug is genuinely empty.
 */

/**
 * URL-decode a value without throwing. WooCommerce percent-encodes Persian slugs
 * (e.g. "%da%a9%db%8c%d9%81" → "کیف").
 * @param {string|undefined|null} value
 * @returns {string}
 */
function safeDecode(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const str = value.toString();
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

/**
 * Minimal slugify used ONLY for the title fallback (when WooCommerce has no slug).
 * Preserves Persian/Arabic letters, lowercases ASCII, collapses whitespace/ZWNJ to
 * hyphens. Deterministic — no time-based fallback.
 * @param {string|undefined|null} text
 * @returns {string}
 */
function slugifyTitle(text) {
  if (text === null || text === undefined) {
    return "";
  }
  return text
    .toString()
    .trim()
    .replace(/[\s‌]+/g, "-") // whitespace + ZWNJ → hyphen
    .replace(/[A-Z]/g, (c) => c.toLowerCase())
    .replace(/[^0-9a-z؀-ۿ-]/g, "") // keep ASCII alnum, Persian/Arabic, hyphen
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Resolve the Strapi slug for a WooCommerce entity.
 *  1. WooCommerce slug, verbatim (URL-decoded, trimmed)  ← source of truth
 *  2. slugified title (deterministic fallback)
 *  3. `<prefix>-<wooId>` (last resort, stable)
 *
 * @param {{ slug?: string, name?: string, id?: number|string }} entity
 * @param {string} prefix e.g. "product" or "category"
 * @returns {string}
 */
function resolveSlug(entity, prefix) {
  const wooSlug = safeDecode(entity?.slug).trim();
  if (wooSlug) {
    return wooSlug;
  }

  const fromTitle = slugifyTitle(entity?.name);
  if (fromTitle) {
    return fromTitle;
  }

  return `${prefix}-${entity?.id ?? "unknown"}`;
}

module.exports = { resolveSlug, slugifyTitle, safeDecode };
