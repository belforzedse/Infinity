const StoreIndex = require("./StoreIndex");
const { getAttr } = require("./fetchAll");

class VerifyEngine {
  /**
   * @param {StoreIndex} storeIndex
   * @param {object} config
   * @param {import('./SyncReport')} report
   * @param {{ logger: { info: Function; warn: Function } }} deps
   */
  constructor(storeIndex, config, report, deps) {
    this.storeIndex = storeIndex;
    this.config = config;
    this.report = report;
    this.logger = deps.logger;
  }

  convertPrice(price) {
    const numPrice = parseFloat(price);
    if (!Number.isFinite(numPrice) || numPrice <= 0) {
      return 0;
    }
    const multiplier = this.config.import.currency.multiplier || 1;
    return Math.round(numPrice * multiplier);
  }

  normalizeWcStatus(status) {
    return (status || "").toLowerCase() === "publish" ? "Active" : "InActive";
  }

  normalizeStrapiStatus(status) {
    return status === "Active" ? "Active" : "InActive";
  }

  getWcVariationPrice(wcVariation) {
    const variationRegular = parseFloat(wcVariation.regular_price || wcVariation.price || 0);
    const parent = wcVariation._parentProduct || {};
    const parentRegular = parseFloat(parent.regular_price || parent.price || 0);
    const regular = variationRegular > 0 ? variationRegular : parentRegular;
    return this.convertPrice(regular);
  }

  getStrapiMediaCount(product) {
    const cover = getAttr(product, "CoverImage");
    const media = getAttr(product, "Media");
    let count = 0;
    if (cover?.data?.id || typeof cover === "number") {
      count += 1;
    }
    if (Array.isArray(media?.data)) {
      count += media.data.length;
    } else if (Array.isArray(media)) {
      count += media.length;
    }
    return count;
  }

  getWcMediaCount(wcProduct) {
    return Array.isArray(wcProduct.images) ? wcProduct.images.length : 0;
  }

  /**
   * @param {{ limit?: number; strictMedia?: boolean; allowStrapiOnly?: boolean }} options
   */
  async verify(options = {}) {
    const { limit, strictMedia = false } = options;

    this.logger.info("Loading WooCommerce catalog for verification...");
    const wcCategories = await this.storeIndex.loadWooCommerceCategories(limit);
    const wcProducts = await this.storeIndex.loadWooCommerceProducts(limit);
    const wcVariations = await this.storeIndex.loadWooCommerceVariations(wcProducts, limit);

    this.logger.info("Loading Strapi catalog for verification...");
    const strapiCategories = await this.storeIndex.loadStrapiCategories();
    const strapiProducts = await this.storeIndex.loadStrapiProducts();
    const strapiVariations = await this.storeIndex.loadStrapiVariations();

    const strapiCategoryByExternal = this.storeIndex.indexByExternalId(strapiCategories);
    const strapiProductByExternal = this.storeIndex.indexByExternalId(strapiProducts);
    const strapiVariationByExternal = this.storeIndex.indexByExternalId(strapiVariations);

    this.verifyCategories(wcCategories, strapiCategoryByExternal);
    this.verifyProducts(wcProducts, strapiProductByExternal, { strictMedia });
    this.verifyVariations(wcVariations, strapiVariationByExternal);

    this.reportStrapiOnly("categories", strapiCategories, wcCategories);
    this.reportStrapiOnly("products", strapiProducts, wcProducts);
    this.reportStrapiOnly("variations", strapiVariations, wcVariations);

    return this.report;
  }

  verifyCategories(wcCategories, strapiByExternal) {
    for (const wcCategory of wcCategories) {
      const key = wcCategory.id.toString();
      const strapiItem = strapiByExternal.get(key);

      if (!strapiItem) {
        this.report.record("categories", "wcOnly", {
          wcId: wcCategory.id,
          name: wcCategory.name,
        });
        continue;
      }

      const mismatches = [];
      if (getAttr(strapiItem, "Title") !== wcCategory.name) {
        mismatches.push("Title");
      }
      if (getAttr(strapiItem, "Slug") !== wcCategory.slug) {
        mismatches.push("Slug");
      }

      if (mismatches.length > 0) {
        this.report.record("categories", "mismatched", {
          wcId: wcCategory.id,
          strapiId: strapiItem.id,
          name: wcCategory.name,
          fields: mismatches,
        });
      } else {
        this.report.record("categories", "matched", {
          wcId: wcCategory.id,
          strapiId: strapiItem.id,
        });
      }
    }
  }

  verifyProducts(wcProducts, strapiByExternal, options) {
    for (const wcProduct of wcProducts) {
      const key = wcProduct.id.toString();
      const strapiItem = strapiByExternal.get(key);

      if (!strapiItem) {
        this.report.record("products", "wcOnly", {
          wcId: wcProduct.id,
          name: wcProduct.name,
        });
        continue;
      }

      const mismatches = [];
      if (getAttr(strapiItem, "Title") !== wcProduct.name) {
        mismatches.push("Title");
      }

      const expectedSlug = wcProduct.slug;
      if (expectedSlug && getAttr(strapiItem, "Slug") !== expectedSlug) {
        mismatches.push("Slug");
      }

      const expectedStatus = this.normalizeWcStatus(wcProduct.status);
      if (this.normalizeStrapiStatus(getAttr(strapiItem, "Status")) !== expectedStatus) {
        mismatches.push("Status");
      }

      if (options.strictMedia) {
        const wcMedia = this.getWcMediaCount(wcProduct);
        const strapiMedia = this.getStrapiMediaCount(strapiItem);
        if (wcMedia !== strapiMedia) {
          mismatches.push("MediaCount");
        }
      }

      if (mismatches.length > 0) {
        this.report.record("products", "mismatched", {
          wcId: wcProduct.id,
          strapiId: strapiItem.id,
          name: wcProduct.name,
          fields: mismatches,
        });
      } else {
        this.report.record("products", "matched", {
          wcId: wcProduct.id,
          strapiId: strapiItem.id,
        });
      }
    }
  }

  verifyVariations(wcVariations, strapiByExternal) {
    for (const wcVariation of wcVariations) {
      const key = wcVariation.id.toString();
      const strapiItem = strapiByExternal.get(key);

      if (!strapiItem) {
        this.report.record("variations", "wcOnly", {
          wcId: wcVariation.id,
          sku: wcVariation.sku,
          parentWcId: wcVariation._parentProduct?.id,
        });
        continue;
      }

      const mismatches = [];
      const expectedPrice = this.getWcVariationPrice(wcVariation);
      const strapiPrice = Number(getAttr(strapiItem, "Price") || 0);

      if (expectedPrice > 0 && strapiPrice !== expectedPrice) {
        mismatches.push("Price");
      }

      if (wcVariation.sku && getAttr(strapiItem, "SKU") !== wcVariation.sku) {
        mismatches.push("SKU");
      }

      const wcStock = Math.max(0, wcVariation.stock_quantity || 0);
      const stockRelation = getAttr(strapiItem, "product_stock");
      let strapiStock = 0;
      if (stockRelation?.data?.attributes?.Count !== undefined) {
        strapiStock = stockRelation.data.attributes.Count;
      } else if (stockRelation?.Count !== undefined) {
        strapiStock = stockRelation.Count;
      } else if (stockRelation?.data?.Count !== undefined) {
        strapiStock = stockRelation.data.Count;
      }

      if (strapiStock !== wcStock) {
        mismatches.push("Stock");
      }

      if (mismatches.length > 0) {
        this.report.record("variations", "mismatched", {
          wcId: wcVariation.id,
          strapiId: strapiItem.id,
          sku: wcVariation.sku,
          fields: mismatches,
        });
      } else {
        this.report.record("variations", "matched", {
          wcId: wcVariation.id,
          strapiId: strapiItem.id,
        });
      }
    }
  }

  /**
   * @param {'categories'|'products'|'variations'} entityType
   * @param {Array<object>} strapiItems
   * @param {Array<{ id: number | string }>} wcItems
   */
  reportStrapiOnly(entityType, strapiItems, wcItems) {
    const wcExternalIds = new Set(wcItems.map((item) => item.id.toString()));

    for (const strapiItem of strapiItems) {
      const externalId = getAttr(strapiItem, "external_id");
      if (!externalId) {
        this.report.record(entityType, "strapiOnly", {
          strapiId: strapiItem.id,
          external_id: null,
          title: getAttr(strapiItem, "Title") || getAttr(strapiItem, "SKU"),
        });
        continue;
      }

      if (!wcExternalIds.has(externalId.toString())) {
        this.report.record(entityType, "strapiOnly", {
          strapiId: strapiItem.id,
          external_id: externalId.toString(),
          title: getAttr(strapiItem, "Title") || getAttr(strapiItem, "SKU"),
        });
      }
    }
  }
}

module.exports = VerifyEngine;
