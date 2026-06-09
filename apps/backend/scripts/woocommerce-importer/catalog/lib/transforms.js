"use strict";

/**
 * Pure transform functions: WooCommerce entities → Strapi payloads.
 *
 * Everything here is side-effect free and dependency-light so it can be unit-tested
 * exhaustively with fixtures. This is where the data-mapping bug fixes live:
 *  - prices: 0 is NOT treated as "missing"; only-sale-price products keep a price;
 *    a brand-new variation with no price is flagged, not silently set to 0.
 *  - SKU is stable (no per-run mutation).
 *  - Weight / ProductType / IsSimpleProduct are actually written.
 *  - Stock is derived from stock_status when stock isn't managed.
 */

const { resolveSlug } = require("./slug");
const { resolveColorMapping, DEFAULT_COLOR } = require("../../utils/colorMappings");

const EXTERNAL_SOURCE = "woocommerce";

/** Parse a WooCommerce numeric string. Returns NaN for blank/invalid. */
function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return NaN;
  }
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : NaN;
}

/** Convert a price using the configured multiplier and round to an integer. */
function convertPrice(value, multiplier = 1) {
  const n = toNumber(value);
  if (!Number.isFinite(n) || n <= 0) {
    return 0;
  }
  return Math.round(n * (Number.isFinite(multiplier) ? multiplier : 1));
}

/**
 * Normalize a product/title string: trim, collapse whitespace, insert a space at
 * letter↔digit boundaries (e.g. "bearB00130" → "bear B00130"). Matches legacy
 * behaviour so existing titles don't churn.
 */
function normalizeName(name) {
  if (!name || typeof name !== "string") {
    return "";
  }
  return name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/([a-zA-Z؀-ۿ])(\d)/g, "$1 $2")
    .replace(/(\d)([a-zA-Z؀-ۿ])/g, "$1 $2")
    .trim();
}

/** Light richtext cleanup (Strapi richtext accepts HTML; just normalize whitespace). */
function prepareRichtext(html) {
  if (!html || typeof html !== "string") {
    return "";
  }
  return html
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}

/**
 * Map WooCommerce product status → Strapi Status enum (Active | InActive).
 * Unknown statuses default to InActive (safer: never auto-publish a draft).
 */
function mapProductStatus(wcStatus, statusMappings = {}) {
  const mapped = statusMappings[wcStatus];
  return mapped || "InActive";
}

/**
 * Map a WooCommerce product to a Strapi product payload (excluding media, which is
 * attached separately so a failed re-download never nulls existing images).
 *
 * @param {object} wcProduct
 * @param {object} [opts]
 * @param {(wooCategoryId:number)=>(number|null)} [opts.resolveCategoryId]
 * @param {Record<string,string>} [opts.statusMappings]
 * @returns {{ data: object, mainCategoryMissing: boolean, otherCategoryMisses: number[] }}
 */
function mapProduct(wcProduct, opts = {}) {
  const { resolveCategoryId = () => null, statusMappings = {} } = opts;

  const data = {
    Title: normalizeName(wcProduct.name),
    Slug: resolveSlug(wcProduct, "product"),
    Description: prepareRichtext(wcProduct.description || wcProduct.short_description || ""),
    Status: mapProductStatus(wcProduct.status, statusMappings),
    ProductType: wcProduct.type === "simple" ? "Simple" : "Variable",
    IsSimpleProduct: wcProduct.type === "simple",
    AverageRating: toNumber(wcProduct.average_rating) || null,
    RatingCount: Number.parseInt(wcProduct.rating_count, 10) || 0,
    external_id: wcProduct.id.toString(),
    external_source: EXTERNAL_SOURCE,
  };

  // Weight is an integer in Strapi (default 100). Only override when WooCommerce
  // actually provides a numeric weight, otherwise leave the schema default intact.
  const weight = toNumber(wcProduct.weight);
  if (Number.isFinite(weight) && weight > 0) {
    data.Weight = Math.round(weight);
  }

  // Categories → Strapi relation ids
  const categories = Array.isArray(wcProduct.categories) ? wcProduct.categories : [];
  let mainCategoryMissing = false;
  const otherCategoryMisses = [];

  if (categories.length > 0) {
    const mainId = resolveCategoryId(categories[0].id);
    if (mainId) {
      data.product_main_category = mainId;
    } else {
      mainCategoryMissing = true;
    }

    const otherIds = [];
    for (const cat of categories.slice(1)) {
      const sid = resolveCategoryId(cat.id);
      if (sid) {
        otherIds.push(sid);
      } else {
        otherCategoryMisses.push(cat.id);
      }
    }
    data.product_other_categories = otherIds;
  }

  return {
    data,
    mainCategoryMissing,
    otherCategoryMisses,
    sizeGuideMatrix: extractSizeGuideMatrix(wcProduct),
  };
}

/**
 * Extract and sanitize the product size-guide matrix stored in WooCommerce meta.
 * Legacy importer supported both meta keys; keep the same source compatibility.
 *
 * @param {object} wcProduct
 * @returns {string[][] | null}
 */
function extractSizeGuideMatrix(wcProduct) {
  if (!wcProduct || !Array.isArray(wcProduct.meta_data)) {
    return null;
  }

  const sizeGuideKeys = ["product_size_guide", "product-custom-meta-inp"];
  const metaEntry = wcProduct.meta_data.find((meta) => meta && sizeGuideKeys.includes(meta.key));

  if (!metaEntry || metaEntry.value === undefined || metaEntry.value === null) {
    return null;
  }

  let rawValue = metaEntry.value;
  if (typeof rawValue === "string") {
    rawValue = rawValue.trim();
    if (rawValue === "") {
      return null;
    }
    try {
      rawValue = JSON.parse(rawValue);
    } catch {
      return null;
    }
  }

  if (!Array.isArray(rawValue)) {
    return null;
  }

  const sanitized = rawValue
    .filter((row) => Array.isArray(row))
    .map((row) =>
      row.map((cell) => {
        if (cell === null || cell === undefined) {
          return "";
        }
        return typeof cell === "string" ? cell : String(cell);
      }),
    );

  const hasContent = sanitized.some((row) =>
    row.some((cell) => typeof cell === "string" && cell.trim() !== ""),
  );

  return hasContent ? sanitized : null;
}

/**
 * Map a WooCommerce category to a Strapi category payload.
 * @param {object} wcCategory
 * @param {(wooParentId:number)=>(number|null)} [resolveParentId]
 */
function mapCategory(wcCategory, resolveParentId = () => null) {
  const data = {
    Title: wcCategory.name,
    Slug: resolveSlug(wcCategory, "category"),
    external_id: wcCategory.id.toString(),
    external_source: EXTERNAL_SOURCE,
  };

  let parentMissing = false;
  if (wcCategory.parent && wcCategory.parent !== 0) {
    const parentId = resolveParentId(wcCategory.parent);
    if (parentId) {
      data.parent = parentId;
    } else {
      parentMissing = true; // import as root for now; a later pass links it
    }
  }

  return { data, parentMissing };
}

/** Stable SKU for a variation. Never mutated on re-sync. */
function generateVariationSku(wcVariation, parentWooId) {
  if (wcVariation.sku && wcVariation.sku.toString().trim() !== "") {
    return wcVariation.sku.toString().trim();
  }
  const pid = wcVariation.parent_id || parentWooId || wcVariation._parentProduct?.id;
  return `WC-${pid}-${wcVariation.id}`;
}

/**
 * Compute Price / DiscountPrice for a variation, with parent-product fallback.
 *
 * Returns `{ price, discountPrice? }` or `{ priceMissing: true }` when WooCommerce
 * has no usable price anywhere. A `0` regular price with a positive sale price is
 * treated as "only sale price" → the sale price becomes Price (not a free product).
 *
 * @param {object} wcVariation
 * @param {object} [parentProduct]
 * @param {number} [multiplier=1]
 */
function computeVariationPricing(wcVariation, parentProduct = {}, multiplier = 1) {
  const pos = (n) => Number.isFinite(n) && n > 0;

  const varRegular = toNumber(wcVariation.regular_price ?? wcVariation.price);
  const varSale = toNumber(wcVariation.sale_price);
  const parentRegular = toNumber(parentProduct.regular_price ?? parentProduct.price);
  const parentSale = toNumber(parentProduct.sale_price);

  // Resolve regular and sale independently (variation level first, then parent),
  // so a variation that has *only* a sale price still gets a price.
  const regular = pos(varRegular) ? varRegular : pos(parentRegular) ? parentRegular : NaN;
  const sale = pos(varSale) ? varSale : pos(parentSale) ? parentSale : NaN;
  const onSale = wcVariation.on_sale;

  const regularValid = pos(regular);
  const saleValid = pos(sale);

  if (regularValid && saleValid && sale < regular && onSale !== false) {
    return {
      price: convertPrice(regular, multiplier),
      discountPrice: convertPrice(sale, multiplier),
    };
  }
  if (regularValid) {
    return { price: convertPrice(regular, multiplier) };
  }
  if (saleValid) {
    // Only a sale price exists anywhere — use it as the price rather than dropping it.
    return { price: convertPrice(sale, multiplier) };
  }
  return { priceMissing: true };
}

/**
 * Map a WooCommerce variation to a Strapi variation payload.
 *
 * @param {object} wcVariation
 * @param {object} opts
 * @param {number} opts.parentStrapiId
 * @param {object} [opts.parentProduct]
 * @param {number} [opts.multiplier=1]
 * @param {boolean} [opts.preserveMissingPrice=false] when updating, omit Price if WC price is blank
 * @returns {{ data: object, priceMissing: boolean }}
 */
function mapVariation(wcVariation, opts) {
  const { parentStrapiId, parentProduct = {}, multiplier = 1, preserveMissingPrice = false } = opts;

  if (!parentStrapiId || typeof parentStrapiId !== "number") {
    throw new Error(`Variation ${wcVariation.id}: invalid parent Strapi id: ${parentStrapiId}`);
  }

  const sku = generateVariationSku(wcVariation, parentProduct.id);
  const status = (wcVariation.status || "").toLowerCase();

  const data = {
    SKU: sku,
    // Default to published when WooCommerce omits a status, so imported variations
    // are actually visible (the legacy importer needed a publish-all band-aid).
    IsPublished: status ? status === "publish" : true,
    product: parentStrapiId,
    external_id: wcVariation.id.toString(),
    external_source: EXTERNAL_SOURCE,
  };

  const pricing = computeVariationPricing(wcVariation, parentProduct, multiplier);
  let priceMissing = false;
  if (pricing.priceMissing) {
    priceMissing = true;
    // Only set Price (to 0) when NOT preserving — but the engine flags create-with-missing-price
    // as a failure instead of writing a 0-price product. On update we omit Price entirely.
    if (!preserveMissingPrice) {
      data.Price = 0;
    }
  } else {
    data.Price = pricing.price;
    if (pricing.discountPrice !== undefined) {
      data.DiscountPrice = pricing.discountPrice;
    }
  }

  return { data, priceMissing };
}

/** Identify a WooCommerce attribute name as color | size | model. */
function identifyAttributeType(attributeName) {
  const name = (attributeName || "").toLowerCase();
  if (name.includes("رنگ") || name.includes("color") || name.includes("colour")) {
    return "color";
  }
  if (name.includes("سایز") || name.includes("اندازه") || name.includes("size")) {
    return "size";
  }
  return "model";
}

/** Hex code assigned to color values that aren't in the mapping table. */
const UNMAPPED_COLOR_CODE = "#FFFFFF";

/**
 * Resolve an attribute value to a Strapi-ready descriptor. Colors are normalized
 * through the shared color-mapping table (Persian name → Title + hex ColorCode).
 *
 * IMPORTANT: when a color value is NOT in the mapping table, the ORIGINAL value is
 * preserved as the Title (with a #FFFFFF swatch) rather than collapsed to the
 * default color. Stores often enter distinct color variants by code on the رنگ
 * attribute (e.g. "کد ۱", "کد ۲", …); collapsing every unmapped value to one
 * default color would merge all of them into a single variant. Each literal value
 * therefore becomes its own color record.
 *
 * @param {"color"|"size"|"model"} type
 * @param {string} value
 * @returns {{ title: string, colorCode?: string, matched: boolean, externalId: string } | null}
 */
function resolveAttribute(type, value) {
  if (!value || value.toString().trim() === "") {
    return null;
  }
  const raw = value.toString().trim();

  if (type === "color") {
    const mapping = resolveColorMapping(raw);
    const title = mapping.matched ? mapping.title : raw;
    const colorCode = mapping.matched
      ? mapping.colorCode || DEFAULT_COLOR.colorCode
      : UNMAPPED_COLOR_CODE;
    return {
      title,
      colorCode,
      matched: Boolean(mapping.matched),
      externalId: `color_${title.toLowerCase().replace(/\s+/g, "_")}`,
    };
  }

  return {
    title: raw,
    matched: true,
    externalId: `${type}_${raw.toLowerCase().replace(/\s+/g, "_")}`,
  };
}

/**
 * Determine the stock Count to write for a variation/simple product.
 *
 * - When stock is managed and a quantity is present → use that quantity.
 * - When stock is NOT managed → derive from stock_status so that `instock` items
 *   are purchasable (Count > 0) and `outofstock` items are 0. This fixes the
 *   legacy bug where unmanaged in-stock items were left with Count 0 (unavailable).
 *
 * @param {object} wcEntity variation or simple product
 * @param {object} [opts]
 * @param {number} [opts.defaultInStockCount=9999]
 * @returns {{ count: number, externalId: string }}
 */
function mapStock(wcEntity, opts = {}) {
  const { defaultInStockCount = 9999 } = opts;
  const externalId = `stock_${wcEntity.id}`;

  const managed = wcEntity.manage_stock === true;
  const qty = wcEntity.stock_quantity;

  if (managed && qty !== null && qty !== undefined) {
    return { count: Math.max(0, Number(qty) || 0), externalId };
  }

  const status = (wcEntity.stock_status || "").toLowerCase();
  if (status === "outofstock") {
    return { count: 0, externalId };
  }
  if (status === "onbackorder" || status === "instock") {
    return { count: defaultInStockCount, externalId };
  }

  // Unknown: if a positive quantity exists use it, else assume available.
  if (qty !== null && qty !== undefined && Number(qty) > 0) {
    return { count: Number(qty), externalId };
  }
  return { count: defaultInStockCount, externalId };
}

/**
 * Build a synthetic "variation" for a WooCommerce simple product so it has a
 * purchasable Strapi product-variation (Price/SKU/stock). Simple products have no
 * WooCommerce variations of their own.
 *
 * @param {object} wcProduct
 * @returns {object} a variation-shaped object consumable by mapVariation/mapStock
 */
function synthesizeSimpleVariation(wcProduct) {
  return {
    id: wcProduct.id,
    parent_id: wcProduct.id,
    sku: wcProduct.sku || `WC-${wcProduct.id}`,
    regular_price: wcProduct.regular_price,
    price: wcProduct.price,
    sale_price: wcProduct.sale_price,
    on_sale: wcProduct.on_sale,
    status: wcProduct.status,
    manage_stock: wcProduct.manage_stock,
    stock_quantity: wcProduct.stock_quantity,
    stock_status: wcProduct.stock_status,
    attributes: [],
    _synthetic: true,
    _parentProduct: wcProduct,
  };
}

module.exports = {
  EXTERNAL_SOURCE,
  toNumber,
  convertPrice,
  normalizeName,
  prepareRichtext,
  mapProductStatus,
  mapProduct,
  extractSizeGuideMatrix,
  mapCategory,
  generateVariationSku,
  computeVariationPricing,
  mapVariation,
  identifyAttributeType,
  resolveAttribute,
  mapStock,
  synthesizeSimpleVariation,
};
