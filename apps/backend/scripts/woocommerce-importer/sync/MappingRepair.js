const { fetchAll, getAttr } = require("./fetchAll");

class MappingRepair {
  /**
   * @param {import('../utils/DuplicateTracker')} duplicateTracker
   * @param {import('../utils/ApiClient').StrapiClient} strapiClient
   * @param {{ logger: { info: Function; debug: Function } }} deps
   */
  constructor(duplicateTracker, strapiClient, deps) {
    this.duplicateTracker = duplicateTracker;
    this.strapiClient = strapiClient;
    this.logger = deps.logger;
  }

  /**
   * Rebuild in-memory and on-disk mappings from Strapi external_id fields.
   */
  async repairAll() {
    const stats = {
      categories: 0,
      products: 0,
      variations: 0,
    };

    stats.categories = await this.repairType("categories", "/product-categories", (entity) => ({
      name: getAttr(entity, "Title"),
      slug: getAttr(entity, "Slug"),
      importedSlug: getAttr(entity, "Slug"),
    }));

    stats.products = await this.repairType("products", "/products", (entity) => ({
      name: getAttr(entity, "Title"),
      slug: getAttr(entity, "Slug"),
      importedSlug: getAttr(entity, "Slug"),
      status: getAttr(entity, "Status"),
    }));

    stats.variations = await this.repairType("variations", "/product-variations", (entity) => ({
      sku: getAttr(entity, "SKU"),
      price: getAttr(entity, "Price"),
    }));

    this.duplicateTracker.flushMappings();
    this.logger.info(
      `Mapping repair complete: categories=${stats.categories}, products=${stats.products}, variations=${stats.variations}`,
    );

    return stats;
  }

  /**
   * @param {'categories'|'products'|'variations'} type
   * @param {string} endpoint
   * @param {(entity: object) => Record<string, unknown>} metadataFn
   */
  async repairType(type, endpoint, metadataFn) {
    const items = await fetchAll(this.strapiClient, endpoint, {
      "filters[external_source][$eq]": "woocommerce",
      "fields[0]": "external_id",
      "fields[1]": type === "variations" ? "SKU" : "Title",
      "fields[2]": type === "variations" ? "Price" : "Slug",
      ...(type === "products" ? { "fields[3]": "Status" } : {}),
    });

    let repaired = 0;

    for (const entity of items) {
      const externalId = getAttr(entity, "external_id");
      if (!externalId || externalId.toString().trim() === "") {
        continue;
      }

      const wcKey = externalId.toString();
      const existing = this.duplicateTracker.getStrapiId(type, wcKey);
      if (existing?.strapiId === entity.id) {
        continue;
      }

      this.duplicateTracker.recordMapping(type, wcKey, entity.id, {
        ...metadataFn(entity),
        repairedAt: new Date().toISOString(),
      });
      repaired += 1;
    }

    this.logger.info(`Repaired ${repaired} ${type} mappings from Strapi (${items.length} total with external_source)`);
    return repaired;
  }
}

module.exports = MappingRepair;
