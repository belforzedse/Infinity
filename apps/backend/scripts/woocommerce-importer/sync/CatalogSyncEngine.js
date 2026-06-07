const path = require("path");
const { execSync } = require("child_process");

const CategoryImporter = require("../importers/CategoryImporter");
const ProductImporter = require("../importers/ProductImporter");
const VariationImporter = require("../importers/VariationImporter");
const DuplicateTracker = require("../utils/DuplicateTracker");
const { WooCommerceClient, StrapiClient } = require("../utils/ApiClient");
const MappingRepair = require("./MappingRepair");
const StoreIndex = require("./StoreIndex");
const SyncReport = require("./SyncReport");
const VerifyEngine = require("./VerifyEngine");

class CatalogSyncEngine {
  /**
   * @param {object} config
   * @param {import('../utils/Logger')} logger
   * @param {object} options
   */
  constructor(config, logger, options = {}) {
    this.config = config;
    this.logger = logger;
    this.options = options;

    this.wooClient = new WooCommerceClient(config, logger);
    this.strapiClient = new StrapiClient(config, logger);
    this.duplicateTracker = new DuplicateTracker(config, logger);
    this.storeIndex = new StoreIndex(this.wooClient, this.strapiClient, config, { logger });

    this.categoryImporter = new CategoryImporter(config, logger);
    this.productImporter = new ProductImporter(config, logger);
    this.variationImporter = new VariationImporter(config, logger);

    this.mappingRepair = new MappingRepair(this.duplicateTracker, this.strapiClient, { logger });
  }

  createReport(command) {
    return new SyncReport({
      command,
      environment: this.options.environment || "production",
      trackingDir: path.resolve(process.cwd(), this.config.duplicateTracking.storageDir),
      logger: this.logger,
    });
  }

  async preflight() {
    this.logger.info("Checking API connectivity...");
    await this.wooClient.getCategories(1, 1);
    await this.strapiClient.getCategories({ "pagination[pageSize]": 1 });
    this.logger.success("WooCommerce and Strapi APIs are reachable");
  }

  runDedupIfRequested() {
    if (!this.options.repairDuplicates) {
      return;
    }

    this.logger.info("Running duplicate repair (dedup-variations-by-external-id --full)...");
    const scriptPath = path.join(__dirname, "..", "dedup-variations-by-external-id.js");
    execSync(`node "${scriptPath}" --full`, {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
      env: process.env,
    });
  }

  applyMediaConfig(skipMedia) {
    if (skipMedia) {
      this.config.import.images.enableUpload = false;
      this.config.import.videos.enableUpload = false;
    } else {
      this.config.import.images.enableUpload =
        process.env.IMPORT_IMAGES_ENABLE_UPLOAD !== "false";
      this.config.import.videos.enableUpload =
        process.env.IMPORT_VIDEOS_ENABLE_UPLOAD !== "false";
    }
  }

  /**
   * @param {boolean} dryRun
   */
  async runSync(dryRun = false) {
    const report = this.createReport(dryRun ? "dry-run" : "sync");
    const {
      limit = 999999,
      page = 1,
      skipCategories = false,
      skipMedia = false,
      deactivateStrapiOnly = false,
    } = this.options;

    await this.preflight();
    this.runDedupIfRequested();

    this.logger.info("Phase 1: Repairing mappings from Strapi external_id fields...");
    await this.mappingRepair.repairAll();

    if (!skipCategories) {
      this.logger.info("Phase 2: Syncing categories (WooCommerce → Strapi)...");
      const categoryStats = await this.categoryImporter.import({
        limit,
        page,
        dryRun,
      });
      report.mergeImporterStats("categories", categoryStats);
    }

    this.applyMediaConfig(skipMedia);

    this.logger.info("Phase 3: Syncing products (WooCommerce → Strapi)...");
    const productStats = await this.productImporter.import({
      limit,
      page,
      dryRun,
      categoryIds: [],
      nameFilter: null,
      onlyInStock: false,
      inStockOnly: false,
      syncMode: true,
    });
    report.mergeImporterStats("products", productStats);

    this.logger.info("Phase 4: Syncing variations, stock, and attributes...");
    const variationStats = await this.variationImporter.import({
      limit: this.options.variationLimit || 9999999,
      page: 1,
      dryRun,
      onlyImported: true,
      force: true,
      nameFilter: null,
      logParentNames: true,
      scanImportedProducts: true,
      missingOnly: false,
    });
    report.mergeImporterStats("variations", variationStats);

    if (!dryRun) {
      this.duplicateTracker.flushMappings();
      this.productImporter.duplicateTracker.flushMappings();
      this.categoryImporter.duplicateTracker.flushMappings();
      this.variationImporter.duplicateTracker.flushMappings();
    }

    if (deactivateStrapiOnly && !dryRun) {
      await this.deactivateStrapiOnlyItems(report);
    } else if (!dryRun) {
      await this.detectStrapiOnly(report);
    }

    report.printSummary();
    report.save();
    return report;
  }

  async detectStrapiOnly(report) {
    this.logger.info("Detecting Strapi-only catalog items...");
    const wcProducts = await this.storeIndex.loadWooCommerceProducts(this.options.limit);
    const wcCategories = await this.storeIndex.loadWooCommerceCategories(this.options.limit);
    const wcVariations = await this.storeIndex.loadWooCommerceVariations(
      wcProducts,
      this.options.variationLimit,
    );

    const strapiProducts = await this.storeIndex.loadStrapiProducts();
    const strapiCategories = await this.storeIndex.loadStrapiCategories();
    const strapiVariations = await this.storeIndex.loadStrapiVariations();

    const verifyEngine = new VerifyEngine(this.storeIndex, this.config, report, {
      logger: this.logger,
    });
    verifyEngine.reportStrapiOnly("categories", strapiCategories, wcCategories);
    verifyEngine.reportStrapiOnly("products", strapiProducts, wcProducts);
    verifyEngine.reportStrapiOnly("variations", strapiVariations, wcVariations);
  }

  async deactivateStrapiOnlyItems(report) {
    this.logger.warn("Deactivating Strapi-only products (--deactivate-strapi-only)...");
    await this.detectStrapiOnly(report);

    for (const item of report.strapiOnly) {
      if (item.type !== "products") {
        continue;
      }

      try {
        await this.strapiClient.updateProduct(item.strapiId, { Status: "InActive" });
        this.logger.info(`Deactivated Strapi-only product ID ${item.strapiId}`);
      } catch (error) {
        report.record("products", "failed", {
          strapiId: item.strapiId,
          error: error.message,
        });
      }
    }
  }

  /**
   * @param {{ limit?: number; strictMedia?: boolean; allowStrapiOnly?: boolean }} options
   */
  async runVerify(options = {}) {
    const report = this.createReport("verify");
    await this.preflight();

    const verifyEngine = new VerifyEngine(this.storeIndex, this.config, report, {
      logger: this.logger,
    });

    await verifyEngine.verify({
      limit: options.limit || this.options.limit,
      strictMedia: options.strictMedia || false,
      allowStrapiOnly: options.allowStrapiOnly || false,
    });

    report.printSummary();
    const reportPath = report.save();
    return { report, reportPath, exitCode: report.hasBlockingIssues(options) ? 1 : 0 };
  }
}

module.exports = CatalogSyncEngine;
