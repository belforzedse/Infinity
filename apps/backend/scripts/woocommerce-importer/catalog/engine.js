"use strict";

const { HttpClient, createWooAxios, createStrapiAxios } = require("./lib/httpClient");
const WooSource = require("./lib/wooSource");
const StrapiRepo = require("./lib/strapiRepo");
const MappingStore = require("./lib/mapping");
const MediaSync = require("./lib/media");
const { ImportReport } = require("./lib/report");
const { resolveScope, needsProductLoop } = require("./lib/presets");
const T = require("./lib/transforms");

/**
 * Sort WooCommerce categories parents-first, including orphans (parent missing in
 * the set is treated as root). Cycle-safe. Ported from the legacy CategoryImporter.
 */
function sortCategoriesByHierarchy(categories) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const roots = categories.filter((c) => !c.parent || c.parent === 0 || !byId.has(c.parent));
  const sorted = [];
  const visited = new Set();

  const visit = (cat, ancestors) => {
    if (ancestors.includes(cat.id) || visited.has(cat.id)) return;
    visited.add(cat.id);
    sorted.push(cat);
    const next = [...ancestors, cat.id];
    categories.filter((c) => c.parent === cat.id).forEach((child) => visit(child, next));
  };
  roots.forEach((r) => visit(r, []));
  return sorted;
}

class CatalogEngine {
  /**
   * @param {object} config
   * @param {object} logger
   * @param {object} [options]
   */
  constructor(config, logger, options = {}) {
    this.config = config;
    this.logger = logger;
    this.options = options;

    const wooHttp = new HttpClient(createWooAxios(config), {
      logger,
      maxRetries: config.catalog.maxRetries,
      baseDelay: config.catalog.baseRetryDelay,
    });
    const strapiHttp = new HttpClient(createStrapiAxios(config), {
      logger,
      maxRetries: config.catalog.maxRetries,
      baseDelay: config.catalog.baseRetryDelay,
    });

    this.woo = new WooSource(wooHttp, { defaultPerPage: config.catalog.perPage, logger });
    this.repo = new StrapiRepo(strapiHttp, logger);
    this.mapping = new MappingStore(config.duplicateTracking.storageDir, { logger });
    this.mediaStore = new MappingStore(config.duplicateTracking.storageDir, {
      logger,
      fileName: "catalog-media-mappings.json",
    });
    this.media = new MediaSync(config, logger, this.mediaStore, {
      allowHttp: config.catalog.allowHttpMedia,
    });

    this.multiplier = config.import.currency.multiplier || 1;
    this.statusMappings = config.import.statusMappings.product || {};
    this.defaultInStockCount = config.catalog.defaultInStockCount;
  }

  async preflight() {
    this.logger.info("Checking API connectivity…");
    await this.woo.http.get("/products", { params: { per_page: 1 } });
    await this.repo.http.get("/product-categories", { params: { "pagination[pageSize]": 1 } });
    this.logger.success("WooCommerce and Strapi reachable");
  }

  /**
   * @param {object} opts
   * @param {boolean} [opts.dryRun=false]
   * @param {string}  [opts.scope="full"]   full | no-media | categories | stock | price | media
   * @param {boolean} [opts.skipMedia=false]
   * @param {number}  [opts.limit=Infinity]
   */
  async runSync(opts = {}) {
    const dryRun = Boolean(opts.dryRun);
    const limit = opts.limit ?? Infinity;
    const scope = opts.scope || "full";
    const flags = resolveScope(scope, { skipMedia: opts.skipMedia });

    const report = new ImportReport({
      command: dryRun ? `dry-run:${scope}` : `sync:${scope}`,
      environment: this.options.environment || "production",
      trackingDir: this.config.catalog.trackingDirAbs,
      logger: this.logger,
    });

    this.logger.info(`Scope: ${scope} → ${JSON.stringify(flags)}`);
    await this.preflight();

    // Attribute cache only matters when we write variations with attributes.
    if (flags.variations && flags.variationFields === "all") {
      await this.repo.preloadAttributes();
    }

    if (flags.categories) {
      await this.syncCategories(report, dryRun);
    }
    if (needsProductLoop(flags)) {
      await this.syncProducts(report, dryRun, flags, limit);
    }

    if (!dryRun) {
      this.mapping.flush();
      this.mediaStore.flush();
    }

    report.printSummary();
    report.save();
    return report;
  }

  async syncCategories(report, dryRun) {
    this.logger.info("Phase: categories");
    const wcCategories = await this.woo.fetchAllCategories();
    const sorted = sortCategoriesByHierarchy(wcCategories);
    const index = await this.repo.buildExternalIndex("/product-categories");

    for (const wc of sorted) {
      try {
        const resolveParentId = (wooParentId) => this.mapping.getStrapiId("categories", wooParentId);
        const { data } = T.mapCategory(wc, resolveParentId);
        const existing = index.get(wc.id.toString());

        if (dryRun) {
          report.count("categories", existing ? "updated" : "created");
          continue;
        }

        const { id, mode } = await this.repo.upsert({
          endpoint: "/product-categories",
          externalId: wc.id.toString(),
          payload: data,
          index,
        });
        this.mapping.set("categories", wc.id, id, { name: wc.name, slug: data.Slug });
        report.count("categories", mode);
      } catch (error) {
        report.fail("categories", { wcId: wc.id, stage: "upsert-category", error });
        this.logger.error(`❌ category ${wc.id} (${wc.name}): ${error.message}`);
      }
    }
    if (!dryRun) this.mapping.flush();
  }

  async syncProducts(report, dryRun, flags, limit = Infinity) {
    this.logger.info("Phase: products + variations");
    const ctx = {
      report,
      dryRun,
      flags,
      productIndex: await this.repo.buildExternalIndex("/products"),
      variationIndex: await this.repo.buildExternalIndex("/product-variations"),
      stockIndex: await this.repo.buildExternalIndex("/product-stocks"),
    };

    let processed = 0;
    for await (const wcProduct of this.woo.iterateProducts()) {
      if (processed >= limit) break;
      processed += 1;
      try {
        await this.syncOneProduct(wcProduct, ctx);
      } catch (error) {
        report.fail("products", { wcId: wcProduct.id, stage: "sync-product", error });
        this.logger.error(`❌ product ${wcProduct.id} (${wcProduct.name}): ${error.message}`);
      }
    }
  }

  async syncOneProduct(wcProduct, ctx) {
    const { report, dryRun, flags, productIndex } = ctx;

    if (!wcProduct.name || wcProduct.name.trim() === "") {
      report.fail("products", { wcId: wcProduct.id, stage: "validate", error: "missing name" });
      return;
    }

    const existing = productIndex.get(wcProduct.id.toString());
    let productStrapiId = existing?.id || this.mapping.getStrapiId("products", wcProduct.id);

    // Product record write (only in scopes that touch products).
    if (flags.products) {
      const resolveCategoryId = (wooId) => this.mapping.getStrapiId("categories", wooId);
      const { data, sizeGuideMatrix } = T.mapProduct(wcProduct, {
        resolveCategoryId,
        statusMappings: this.statusMappings,
      });

      if (dryRun) {
        report.count("products", existing ? "updated" : "created");
        report.count("sizeHelpers", sizeGuideMatrix ? "skipped" : "unchanged");
        productStrapiId = existing?.id || -1;
      } else {
        const { id, mode } = await this.repo.upsert({
          endpoint: "/products",
          externalId: wcProduct.id.toString(),
          payload: data,
          index: productIndex,
        });
        this.mapping.set("products", wcProduct.id, id, { name: wcProduct.name, slug: data.Slug });
        report.count("products", mode);
        productStrapiId = id;

        try {
          const helperMode = await this.repo.syncProductSizeHelper(id, sizeGuideMatrix);
          report.count("sizeHelpers", helperMode);
        } catch (error) {
          report.fail("sizeHelpers", { wcId: wcProduct.id, stage: "sync-size-guide", error });
          this.logger.warn(`⚠️ size guide ${wcProduct.id} (${wcProduct.name}): ${error.message}`);
        }
      }
    } else if (flags.onlyExisting && !productStrapiId) {
      // stock/price/media scopes: skip products that were never imported.
      report.count("products", "skipped");
      return;
    }

    // Media — attach only when ids are present (never null existing media on failure).
    if (flags.media && !dryRun && productStrapiId && productStrapiId > 0) {
      const { coverId, galleryIds, counts } = await this.media.syncProductMedia(wcProduct);
      report.mediaUploaded(counts.uploaded);
      report.mediaReused(counts.reused);
      report.mediaFailed(counts.failed);
      const update = {};
      if (coverId) update.CoverImage = coverId;
      if (galleryIds.length > 0) update.Media = galleryIds;
      if (Object.keys(update).length > 0) {
        await this.repo.http.put(`/products/${productStrapiId}`, { data: update });
      }
    }

    if (flags.variations || flags.stock) {
      await this.syncVariations(wcProduct, productStrapiId, ctx);
    }
  }

  async syncVariations(wcProduct, parentStrapiId, ctx) {
    const isSimple =
      wcProduct.type === "simple" ||
      !Array.isArray(wcProduct.variations) ||
      wcProduct.variations.length === 0;

    if (isSimple) {
      const synthetic = T.synthesizeSimpleVariation(wcProduct);
      await this.syncOneVariation(synthetic, wcProduct, parentStrapiId, ctx);
      return;
    }

    for await (const wcVariation of this.woo.iterateVariations(wcProduct.id)) {
      try {
        await this.syncOneVariation(wcVariation, wcProduct, parentStrapiId, ctx);
      } catch (error) {
        ctx.report.fail("variations", { wcId: wcVariation.id, stage: "sync-variation", error });
        this.logger.error(`❌ variation ${wcVariation.id} (parent ${wcProduct.id}): ${error.message}`);
      }
    }
  }

  async syncOneVariation(wcVariation, parentProduct, parentStrapiId, ctx) {
    const { report, dryRun, flags, variationIndex, stockIndex } = ctx;
    const externalId = wcVariation.id.toString();
    const existing = variationIndex.get(externalId);

    // onlyExisting scopes (stock/price/media) never create new variations.
    if (flags.onlyExisting && !existing) {
      report.count("variations", "skipped");
      return;
    }

    let variationStrapiId = existing?.id || this.mapping.getStrapiId("variations", wcVariation.id);

    if (dryRun) {
      if (flags.variations) {
        const pricing = T.computeVariationPricing(wcVariation, parentProduct, this.multiplier);
        if (pricing.priceMissing && !existing) {
          report.fail("variations", { wcId: wcVariation.id, stage: "price", error: "no price in WooCommerce" });
          return;
        }
        report.count("variations", existing ? "updated" : "created");
      }
      if (flags.stock && (existing || !flags.onlyExisting)) {
        report.count("stocks", existing ? "updated" : "created");
      }
      return;
    }

    // --- Variation record write ---
    if (flags.variations) {
      if (flags.variationFields === "price-only") {
        // Update only Price/DiscountPrice on an existing variation; never create.
        if (variationStrapiId) {
          const pricing = T.computeVariationPricing(wcVariation, parentProduct, this.multiplier);
          if (!pricing.priceMissing) {
            const payload = { Price: pricing.price };
            payload.DiscountPrice = pricing.discountPrice ?? null;
            await this.repo.http.put(`/product-variations/${variationStrapiId}`, { data: payload });
            report.count("variations", "updated");
          } else {
            report.count("variations", "skipped");
          }
        }
      } else {
        const { data, priceMissing } = T.mapVariation(wcVariation, {
          parentStrapiId,
          parentProduct,
          multiplier: this.multiplier,
          preserveMissingPrice: Boolean(existing),
        });
        if (priceMissing && !existing) {
          report.fail("variations", { wcId: wcVariation.id, stage: "price", error: "no price in WooCommerce" });
          return;
        }
        await this.attachAttributes(wcVariation, data, report);
        const { id, mode } = await this.repo.upsert({
          endpoint: "/product-variations",
          externalId,
          payload: data,
          index: variationIndex,
        });
        this.mapping.set("variations", wcVariation.id, id, { productId: parentProduct.id, sku: data.SKU });
        report.count("variations", mode);
        variationStrapiId = id;
      }
    }

    // --- Stock write ---
    if (flags.stock && variationStrapiId) {
      const stock = T.mapStock(wcVariation, { defaultInStockCount: this.defaultInStockCount });
      const stockMode = await this.repo.upsertStock({
        externalId: stock.externalId,
        count: stock.count,
        variationId: variationStrapiId,
        stockIndex,
      });
      report.count("stocks", stockMode);
    }
  }

  /**
   * Compare WooCommerce and Strapi catalogs (read-only). Reports products present
   * in one store but not the other (by external_id). Returns `{ ok, wcOnly, strapiOnly }`.
   */
  async runVerify({ limit = Infinity } = {}) {
    await this.preflight();
    this.logger.info("Verify: comparing WooCommerce ↔ Strapi products by external_id");

    const wcIds = new Set();
    let processed = 0;
    for await (const wcProduct of this.woo.iterateProducts()) {
      if (processed >= limit) break;
      processed += 1;
      wcIds.add(wcProduct.id.toString());
    }

    const strapiIndex = await this.repo.buildExternalIndex("/products");
    const strapiIds = new Set(strapiIndex.keys());

    const wcOnly = [...wcIds].filter((id) => !strapiIds.has(id));
    const strapiOnly = [...strapiIds].filter((id) => !wcIds.has(id));

    this.logger.info(`WooCommerce products: ${wcIds.size}`);
    this.logger.info(`Strapi (woo-sourced) products: ${strapiIds.size}`);
    if (wcOnly.length > 0) {
      this.logger.warn(`Missing in Strapi (wcOnly): ${wcOnly.length} → e.g. ${wcOnly.slice(0, 10).join(", ")}`);
    }
    if (strapiOnly.length > 0) {
      this.logger.info(`Strapi-only (not in WC sample): ${strapiOnly.length}`);
    }

    return { ok: wcOnly.length === 0, wcOnly, strapiOnly };
  }

  async attachAttributes(wcVariation, data, report) {
    let hasWooColorAttribute = false;
    const wcAttrs = Array.isArray(wcVariation.attributes) ? wcVariation.attributes : [];
    for (const attr of wcAttrs) {
      const type = T.identifyAttributeType(attr.name || "");
      const resolved = T.resolveAttribute(type, attr.option);
      if (!resolved) continue;
      if (type === "color") {
        hasWooColorAttribute = true;
      }
      try {
        const id = await this.repo.resolveAttributeId({ type, ...resolved });
        if (id) {
          data[`product_variation_${type}`] = id;
        }
      } catch (error) {
        report.fail("attributes", { wcId: wcVariation.id, stage: `attr-${type}`, error });
      }
    }

    // WooCommerce is the source of truth. If it has no color, clear any
    // previously imported default color relation in Strapi.
    if (!hasWooColorAttribute) {
      data.product_variation_color = null;
    }
  }
}

module.exports = { CatalogEngine, sortCategoriesByHierarchy };
