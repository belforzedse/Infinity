const { fetchAll, getAttr } = require("./fetchAll");

class StoreIndex {
  /**
   * @param {import('../utils/ApiClient').WooCommerceClient} wooClient
   * @param {import('../utils/ApiClient').StrapiClient} strapiClient
   * @param {object} config
   * @param {{ logger: { info: Function; debug: Function; warn: Function } }} deps
   */
  constructor(wooClient, strapiClient, config, deps) {
    this.wooClient = wooClient;
    this.strapiClient = strapiClient;
    this.config = config;
    this.logger = deps.logger;
  }

  /**
   * @param {number} [limit]
   */
  async loadWooCommerceCategories(limit = 999999) {
    const categories = [];
    let page = 1;
    let totalPages = 1;
    const pageSize = this.config.import.batchSizes.categories || 100;

    while (page <= totalPages && categories.length < limit) {
      const perPage = Math.min(pageSize, limit - categories.length);
      const result = await this.wooClient.getCategories(page, perPage);
      const batch = Array.isArray(result.data) ? result.data : [];
      categories.push(...batch);
      totalPages = result.totalPages || 1;
      page += 1;
      if (batch.length === 0) {
        break;
      }
    }

    return categories.slice(0, limit);
  }

  /**
   * @param {number} [limit]
   */
  async loadWooCommerceProducts(limit = 999999) {
    const products = [];
    let page = 1;
    let totalPages = 1;
    const pageSize = this.config.import.batchSizes.products || 100;

    while (page <= totalPages && products.length < limit) {
      const perPage = Math.min(pageSize, limit - products.length);
      const result = await this.wooClient.getProducts(page, perPage, null, {
        inStockOnly: false,
      });
      const batch = Array.isArray(result.data) ? result.data : [];
      products.push(...batch);
      totalPages = result.totalPages || 1;
      page += 1;
      if (batch.length === 0) {
        break;
      }
    }

    return products.slice(0, limit);
  }

  /**
   * @param {Array<{ id: number; type?: string; variations?: number[] }>} products
   * @param {number} [limit]
   */
  async loadWooCommerceVariations(products, limit = 9999999) {
    const variations = [];
    const pageSize = this.config.import.batchSizes.variations || 100;

    for (const product of products) {
      if (variations.length >= limit) {
        break;
      }

      const isVariable =
        product.type === "variable" ||
        (Array.isArray(product.variations) && product.variations.length > 0);

      if (!isVariable) {
        continue;
      }

      let page = 1;
      let totalPages = 1;

      while (page <= totalPages && variations.length < limit) {
        const result = await this.wooClient.getProductVariations(product.id, page, pageSize);
        const batch = Array.isArray(result.data) ? result.data : [];
        for (const variation of batch) {
          variation._parentProduct = product;
          variations.push(variation);
          if (variations.length >= limit) {
            break;
          }
        }
        totalPages = result.totalPages || 1;
        page += 1;
        if (batch.length === 0) {
          break;
        }
      }
    }

    return variations.slice(0, limit);
  }

  async loadStrapiCategories() {
    return fetchAll(this.strapiClient, "/product-categories", {
      "filters[external_source][$eq]": "woocommerce",
      "populate[parent]": true,
    });
  }

  async loadStrapiProducts() {
    return fetchAll(this.strapiClient, "/products", {
      "filters[external_source][$eq]": "woocommerce",
      "populate[CoverImage]": true,
      "populate[Media]": true,
    });
  }

  async loadStrapiVariations() {
    return fetchAll(this.strapiClient, "/product-variations", {
      "filters[external_source][$eq]": "woocommerce",
      "populate[product_stock]": true,
    });
  }

  /**
   * @param {Array<{ id: number | string }>} items
   */
  indexByExternalId(items) {
    /** @type {Map<string, object>} */
    const map = new Map();

    for (const item of items) {
      const externalId = getAttr(item, "external_id");
      if (!externalId || externalId.toString().trim() === "") {
        continue;
      }
      map.set(externalId.toString(), item);
    }

    return map;
  }

  /**
   * @param {Array<{ id: number | string }>} items
   */
  indexStrapiOnly(items) {
    return items.filter((item) => {
      const externalId = getAttr(item, "external_id");
      return !externalId || externalId.toString().trim() === "";
    });
  }
}

module.exports = StoreIndex;
