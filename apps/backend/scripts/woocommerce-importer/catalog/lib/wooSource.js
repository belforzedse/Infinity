"use strict";

/**
 * WooCommerce read-only source. WooCommerce is the source of truth; this module
 * never writes. Pagination is driven by the `X-WP-TotalPages` response header
 * (the canonical WooCommerce/WP REST mechanism) so we never stop early on a short
 * page and never miss the last partial page.
 */
class WooSource {
  /**
   * @param {import('./httpClient').HttpClient} http
   * @param {object} [opts]
   * @param {number} [opts.defaultPerPage=100]
   * @param {{ info: Function, debug: Function }} [opts.logger]
   */
  constructor(http, opts = {}) {
    this.http = http;
    this.defaultPerPage = opts.defaultPerPage || 100;
    this.logger = opts.logger || { info() {}, debug() {} };
  }

  static totalPages(response) {
    const raw = response?.headers?.["x-wp-totalpages"];
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }

  /**
   * Async-iterate every product, page by page. Honours `X-WP-TotalPages`.
   * @param {object} [opts]
   * @param {number} [opts.perPage]
   * @param {Record<string, unknown>} [opts.params] extra WC query params (filters)
   * @yields {object} a WooCommerce product
   */
  async *iterateProducts(opts = {}) {
    const perPage = opts.perPage || this.defaultPerPage;
    let page = 1;
    let totalPages = 1;

    do {
      const response = await this.http.get("/products", {
        params: { page, per_page: perPage, orderby: "id", order: "asc", ...(opts.params || {}) },
      });
      totalPages = WooSource.totalPages(response);
      const data = Array.isArray(response.data) ? response.data : [];
      this.logger.debug(`📄 WC products page ${page}/${totalPages}: ${data.length} items`);
      for (const product of data) {
        yield product;
      }
      // Stop only when the API reports we've reached the last page. A short/empty
      // page before totalPages would otherwise silently truncate the catalog.
      if (data.length === 0 && page >= totalPages) {
        break;
      }
      page += 1;
    } while (page <= totalPages);
  }

  /**
   * Async-iterate every variation of a product.
   * @param {number} productId
   * @param {object} [opts]
   * @yields {object} a WooCommerce variation
   */
  async *iterateVariations(productId, opts = {}) {
    const perPage = opts.perPage || this.defaultPerPage;
    let page = 1;
    let totalPages = 1;

    do {
      const response = await this.http.get(`/products/${productId}/variations`, {
        params: { page, per_page: perPage, orderby: "id", order: "asc" },
      });
      totalPages = WooSource.totalPages(response);
      const data = Array.isArray(response.data) ? response.data : [];
      for (const variation of data) {
        yield variation;
      }
      if (data.length === 0 && page >= totalPages) {
        break;
      }
      page += 1;
    } while (page <= totalPages);
  }

  /** Fetch all categories (collected — category counts are small). */
  async fetchAllCategories(opts = {}) {
    const perPage = opts.perPage || this.defaultPerPage;
    const out = [];
    let page = 1;
    let totalPages = 1;

    do {
      const response = await this.http.get("/products/categories", {
        params: { page, per_page: perPage, orderby: "id", order: "asc" },
      });
      totalPages = WooSource.totalPages(response);
      const data = Array.isArray(response.data) ? response.data : [];
      out.push(...data);
      if (data.length === 0 && page >= totalPages) {
        break;
      }
      page += 1;
    } while (page <= totalPages);

    return out;
  }

  /** Fetch a single product (used to refresh variation parents). */
  async fetchProductById(productId) {
    try {
      const response = await this.http.get(`/products/${productId}`);
      return response.data || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
}

module.exports = WooSource;
