"use strict";

/**
 * Strapi target repository. All writes are idempotent: entities are matched by the
 * unique `external_id` field. Existing WooCommerce-sourced entities are loaded once
 * into an in-memory index per run, so upserts don't issue a lookup per item (the
 * legacy importer did an N+1 GET per variation/SKU/attribute).
 */
class StrapiRepo {
  /**
   * @param {import('./httpClient').HttpClient} http
   * @param {{ info: Function, debug: Function, warn: Function, error: Function }} logger
   */
  constructor(http, logger) {
    this.http = http;
    this.logger = logger;
    // attribute caches: key = `${type}:${title.toLowerCase()}` → strapi id
    this.attrCache = { color: new Map(), size: new Map(), model: new Map() };
  }

  /** Fetch every entity on an endpoint (Strapi pagination), filtered to WC source. */
  async fetchAllWooEntities(endpoint, params = {}) {
    const out = [];
    let page = 1;
    let pageCount = 1;
    do {
      const response = await this.http.get(endpoint, {
        params: {
          "filters[external_source][$eq]": "woocommerce",
          "pagination[page]": page,
          "pagination[pageSize]": 100,
          ...params,
        },
      });
      const body = response.data;
      const data = Array.isArray(body?.data) ? body.data : [];
      out.push(...data);
      pageCount = body?.meta?.pagination?.pageCount || 1;
      page += 1;
    } while (page <= pageCount);
    return out;
  }

  /**
   * Build an index of external_id → { id } for an endpoint.
   * @returns {Promise<Map<string, { id:number, attributes?:object }>>}
   */
  async buildExternalIndex(endpoint, params = {}) {
    const entities = await this.fetchAllWooEntities(endpoint, params);
    const index = new Map();
    for (const entity of entities) {
      const externalId = entity.attributes?.external_id ?? entity.external_id;
      if (externalId !== undefined && externalId !== null && externalId !== "") {
        index.set(externalId.toString(), entity);
      }
    }
    return index;
  }

  /**
   * Idempotent upsert keyed on external_id. Uses the preloaded index first; on a
   * create that hits a unique-constraint race, falls back to a live lookup + update.
   *
   * @param {object} args
   * @param {string} args.endpoint e.g. "/products"
   * @param {string} args.externalId
   * @param {object} args.payload
   * @param {Map<string, {id:number}>} args.index
   * @returns {Promise<{ id:number, mode:"created"|"updated" }>}
   */
  async upsert({ endpoint, externalId, payload, index }) {
    const existing = index.get(externalId.toString());
    if (existing) {
      await this.http.put(`${endpoint}/${existing.id}`, { data: payload });
      return { id: existing.id, mode: "updated" };
    }

    try {
      const response = await this.http.post(endpoint, { data: payload });
      const id = response.data?.data?.id;
      index.set(externalId.toString(), { id });
      return { id, mode: "created" };
    } catch (error) {
      // Possible unique-constraint race: another path already created it. Recover.
      if (error.response?.status === 400 || error.response?.status === 409) {
        const found = await this.findByExternalId(endpoint, externalId);
        if (found) {
          await this.http.put(`${endpoint}/${found.id}`, { data: payload });
          index.set(externalId.toString(), { id: found.id });
          return { id: found.id, mode: "updated" };
        }
      }
      throw error;
    }
  }

  async findByExternalId(endpoint, externalId) {
    const response = await this.http.get(endpoint, {
      params: { "filters[external_id][$eq]": externalId.toString(), "pagination[pageSize]": 1 },
    });
    const data = response.data?.data;
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  }

  /**
   * Preload color/size/model attribute caches so attribute resolution is local.
   */
  async preloadAttributes() {
    const load = async (type, endpoint) => {
      const entities = await this.fetchAllAttributeEntities(endpoint);
      for (const e of entities) {
        const title = (e.attributes?.Title ?? e.Title ?? "").toString().toLowerCase();
        if (title) {
          this.attrCache[type].set(title, e.id);
        }
      }
    };
    await Promise.all([
      load("color", "/product-variation-colors"),
      load("size", "/product-variation-sizes"),
      load("model", "/product-variation-models"),
    ]);
  }

  async fetchAllAttributeEntities(endpoint) {
    const out = [];
    let page = 1;
    let pageCount = 1;
    do {
      const response = await this.http.get(endpoint, {
        params: { "pagination[page]": page, "pagination[pageSize]": 100 },
      });
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      out.push(...data);
      pageCount = response.data?.meta?.pagination?.pageCount || 1;
      page += 1;
    } while (page <= pageCount);
    return out;
  }

  /**
   * Find-or-create an attribute (color/size/model) and return its Strapi id.
   * @param {{ type:"color"|"size"|"model", title:string, colorCode?:string, externalId?:string }} attr
   */
  async resolveAttributeId(attr) {
    const key = attr.title.toLowerCase();
    const cache = this.attrCache[attr.type];
    if (cache.has(key)) {
      return cache.get(key);
    }

    const endpoint =
      attr.type === "color"
        ? "/product-variation-colors"
        : attr.type === "size"
          ? "/product-variation-sizes"
          : "/product-variation-models";

    const payload = {
      Title: attr.title,
      external_source: "woocommerce",
    };
    if (attr.externalId) {
      payload.external_id = attr.externalId;
    }
    if (attr.type === "color") {
      payload.ColorCode = attr.colorCode || "#FFFFFF";
    }

    try {
      const response = await this.http.post(endpoint, { data: payload });
      const id = response.data?.data?.id;
      cache.set(key, id);
      return id;
    } catch (error) {
      // Likely a duplicate (unique Title) — fetch the existing one.
      const found = await this.findAttributeByTitle(endpoint, attr.title);
      if (found) {
        cache.set(key, found.id);
        return found.id;
      }
      throw error;
    }
  }

  async findAttributeByTitle(endpoint, title) {
    const response = await this.http.get(endpoint, {
      params: { "filters[Title][$eq]": title, "pagination[pageSize]": 1 },
    });
    const data = response.data?.data;
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  }

  /**
   * Upsert a product-stock record for a variation by external_id (`stock_<vid>`).
   * @returns {Promise<"created"|"updated">}
   */
  async upsertStock({ externalId, count, variationId, stockIndex }) {
    const payload = {
      Count: count,
      product_variation: variationId,
      external_id: externalId,
      external_source: "woocommerce",
    };
    const result = await this.upsert({
      endpoint: "/product-stocks",
      externalId,
      payload,
      index: stockIndex,
    });
    return result.mode;
  }
}

module.exports = StrapiRepo;
