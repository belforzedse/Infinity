const fs = require("fs");
const path = require("path");
const { WooCommerceClient, StrapiClient } = require("../utils/ApiClient");
const DuplicateTracker = require("../utils/DuplicateTracker");
const { resolveColorMapping } = require("../utils/colorMappings");

const DEFAULT_NAME_FILTER_KEYWORDS = ["اسلیپر", "ونس", "کیف", "کفش", "کتونی", "صندل"];

/**
 * Variation Importer - Handles importing WooCommerce product variations to Strapi
 *
 * Key responsibilities:
 *  - Transform variation payloads
 *  - Map color/size/model attributes
 *  - Sync stock records
 *  - Prevent duplicates via persistent mapping
 *  - Track progress across runs
 */
class VariationImporter {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.wooClient = new WooCommerceClient(config, logger);
    this.strapiClient = new StrapiClient(config, logger);
    this.duplicateTracker = new DuplicateTracker(config, logger);

    // Import statistics
    this.stats = {
      total: 0,
      success: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: 0,
      startTime: null,
      endTime: null,
      variationsCreated: 0,
      variationsUpdated: 0,
      stocksCreated: 0,
      stocksUpdated: 0,
      attributesCreated: 0,
    };

    // Caches for faster lookups
    this.productMappingCache = new Map();
    this.colorMappingCache = new Map();
    this.sizeMappingCache = new Map();
    this.modelMappingCache = new Map();

    // Track unmapped colors to help improve mappings
    this.unmappedColors = new Set();
  }

  shouldImportParentProduct(productName, nameFilter = DEFAULT_NAME_FILTER_KEYWORDS) {
    if (!nameFilter || nameFilter.length === 0) {
      return true;
    }

    const name = (productName || "").toLowerCase();
    return nameFilter.some((keyword) => name.includes((keyword || "").toLowerCase()));
  }

  /**
   * Determine if a WooCommerce variation is in stock.
   */
  isVariationInStock(wcVariation) {
    if (!wcVariation) {
      return false;
    }

    const stockStatus = (wcVariation.stock_status || "").toString().toLowerCase();
    if (stockStatus) {
      return stockStatus === "instock";
    }

    if (typeof wcVariation.in_stock === "boolean") {
      return wcVariation.in_stock;
    }

    if (typeof wcVariation.stock_quantity === "number") {
      return wcVariation.stock_quantity > 0;
    }

    if (wcVariation.manage_stock && wcVariation.stock_quantity !== null) {
      return Number(wcVariation.stock_quantity) > 0;
    }

    return true;
  }

  /**
   * Determine if a WooCommerce product is in stock.
   */
  isProductInStock(wcProduct) {
    if (!wcProduct) {
      return false;
    }

    const stockStatus = (wcProduct.stock_status || "").toString().toLowerCase();
    if (stockStatus) {
      return stockStatus === "instock";
    }

    if (typeof wcProduct.in_stock === "boolean") {
      return wcProduct.in_stock;
    }

    if (typeof wcProduct.stock_quantity === "number") {
      return wcProduct.stock_quantity > 0;
    }

    if (wcProduct.manage_stock && wcProduct.stock_quantity !== null) {
      return Number(wcProduct.stock_quantity) > 0;
    }

    return true;
  }

  /**
   * Check if a variable product has at least one in-stock variation.
   */
  async hasInStockVariations(wcProduct) {
    if (!wcProduct || !Array.isArray(wcProduct.variations) || wcProduct.variations.length === 0) {
      return false;
    }

    const perPage = this.config?.import?.batchSizes?.variations || 100;
    let page = 1;

    try {
      while (true) {
        const result = await this.wooClient.getProductVariations(wcProduct.id, page, perPage);
        const variations = Array.isArray(result.data) ? result.data : [];

        if (variations.length === 0) {
          return false;
        }

        if (variations.some((variation) => this.isVariationInStock(variation))) {
          return true;
        }

        const totalPages = Number.parseInt(result.totalPages || "1", 10);
        if (page >= totalPages) {
          return false;
        }

        page += 1;
      }
    } catch (error) {
      this.logger.warn(
        `⚠️ Failed to check variation stock for product ${wcProduct.id} (${wcProduct.name}): ${error.message}`,
      );
      return this.isProductInStock(wcProduct);
    }
  }

  /**
   * Main import method - Optimized for incremental processing
   */
  async import(options = {}) {
    const {
      limit = 100,
      page = 1,
      dryRun = false,
      onlyImported = false,
      force = false,
      nameFilter = DEFAULT_NAME_FILTER_KEYWORDS,
      logParentNames = true,
      scanImportedProducts = false,
      missingOnly = false,
    } = options;

    const inStockOnly = this.config?.import?.filters?.inStockOnly !== false;
    const effectiveOnlyImported = scanImportedProducts ? true : onlyImported;

    const effectiveNameFilter =
      nameFilter === null
        ? []
        : Array.isArray(nameFilter) && nameFilter.length === 0
        ? []
        : Array.isArray(nameFilter)
        ? nameFilter
        : DEFAULT_NAME_FILTER_KEYWORDS;

    this.stats.startTime = Date.now();
    this.logger.info(
      `🔄 Starting variation import (limit: ${limit}, page: ${page}, dryRun: ${dryRun}, onlyImported: ${effectiveOnlyImported}, force: ${force}, scanImportedProducts: ${scanImportedProducts}, missingOnly: ${missingOnly})`,
    );
    if (effectiveNameFilter.length > 0) {
      this.logger.info(
        `🎯 Filtering parent products by keywords: [${effectiveNameFilter.join(", ")}]`,
      );
    } else {
      this.logger.info(`🎯 Parent product name filter disabled (importing all variable products)`);
    }
    this.logger.warn(
      `⚠️  NOTE: Running concurrent import sessions may cause cache staleness. Run imports sequentially for best results.`,
    );

    try {
      await this.loadMappingCaches();
      this.lastCacheRefreshTime = Date.now();

      if (scanImportedProducts) {
        await this.importFromImportedProducts({
          limit,
          page,
          dryRun,
          force,
          nameFilter: effectiveNameFilter,
          logParentNames,
          inStockOnly,
          missingOnly,
        });
      } else {
        // If force flag is set, ignore progress state and start from page 1
        const progressState = force
          ? { lastCompletedPage: 0, totalProcessed: 0 }
          : this.loadProgressState();

        if (force && (progressState.lastCompletedPage > 0 || progressState.totalProcessed > 0)) {
          this.logger.warn(
            `⚠️ FORCE MODE: Ignoring previous progress state (was at page ${progressState.lastCompletedPage}, ${progressState.totalProcessed} processed)`,
          );
        }

        let currentPage = Math.max(page, (progressState.lastCompletedPage || 0) + 1);
        let totalProcessed = progressState.totalProcessed || 0;

        this.logger.info(
          `📊 Resuming from page ${currentPage} (${totalProcessed} variations already processed)`,
        );

        const productBatchSize = this.config.import.batchSizes.products || 50;
        const variationBatchSize =
          this.config.import.batchSizes.variations || productBatchSize || 100;

        let hasMorePages = true;
        let processedInThisSession = 0;

        while (hasMorePages && processedInThisSession < limit) {
          // Refresh cache every 5 minutes during long imports to avoid staleness
          const cacheAge = Date.now() - this.lastCacheRefreshTime;
          const CACHE_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
          if (cacheAge > CACHE_REFRESH_INTERVAL) {
            this.logger.info(
              `🔄 Refreshing mapping caches (last refresh: ${Math.round(cacheAge / 1000)}s ago)`,
            );
            await this.loadMappingCaches();
            this.lastCacheRefreshTime = Date.now();
          }

          const remainingLimit = limit - processedInThisSession;
          const perPage = Math.min(productBatchSize, remainingLimit);

          this.logger.info(`📂 Processing product page ${currentPage} (requesting ${perPage} items)`);

          const result = await this.wooClient.getProducts(currentPage, perPage);

        if (!Array.isArray(result.data) || result.data.length === 0) {
          this.logger.info(`📂 No more products found on page ${currentPage}`);
          hasMorePages = false;
          break;
        }

        let variableProducts = result.data.filter(
          (product) =>
            product.type === "variable" &&
            Array.isArray(product.variations) &&
            product.variations.length > 0,
        );

        if (effectiveNameFilter.length > 0) {
          const beforeFilterCount = variableProducts.length;
          variableProducts = variableProducts.filter((product) =>
            this.shouldImportParentProduct(product?.name, effectiveNameFilter),
          );
          if (beforeFilterCount !== variableProducts.length) {
            this.logger.debug(
              `🎯 Filtered ${
                beforeFilterCount - variableProducts.length
              } parent products that did not match the name keywords`,
            );
          }
        }

        if (onlyImported) {
          const originalCount = variableProducts.length;
          variableProducts = variableProducts.filter((product) =>
            this.productMappingCache.has(product.id),
          );

          if (originalCount !== variableProducts.length) {
            this.logger.debug(
              `🔍 Filtered ${
                originalCount - variableProducts.length
              } products without imported parents`,
            );
          }
        }

        if (inStockOnly) {
          const filteredProducts = [];
          for (const product of variableProducts) {
            const hasInStock = await this.hasInStockVariations(product);
            if (hasInStock) {
              filteredProducts.push(product);
            } else {
              const variationCount = Array.isArray(product.variations)
                ? product.variations.length
                : 0;
              this.logger.debug(
                `⏩ Skipping variations for product ${product.id} (${product.name}) - no variations in stock`,
              );
              if (variationCount > 0) {
                this.stats.skipped += variationCount;
              }
            }
          }
          variableProducts = filteredProducts;
        }

        if (variableProducts.length === 0) {
          this.logger.debug(
            `📂 No variable products with variations found on page ${currentPage}, skipping`,
          );
          currentPage += 1;
          continue;
        }

        for (const product of variableProducts) {
          if (logParentNames && !dryRun) {
            this.logger.info(
              `🧵 Importing variations for parent product: ${
                product.name || "Untitled Product"
              } (Woo ID: ${product.id})`,
            );
          }
          const parentStrapiId = this.productMappingCache.get(product.id);

          if (!parentStrapiId) {
            this.logger.warn(
              `⚠️ Skipping variations for product ${product.id} (${product.name}) - parent not imported yet`,
            );
            this.stats.skipped += product.variations.length;
            continue;
          }

          let variationPage = 1;
          let hasMoreVariations = true;

          while (hasMoreVariations && processedInThisSession < limit) {
            const variationRemainingLimit = limit - processedInThisSession;
            const perVariationPage = Math.min(variationBatchSize, variationRemainingLimit);

            const variationResult = await this.wooClient.getProductVariations(
              product.id,
              variationPage,
              perVariationPage,
            );

            if (!Array.isArray(variationResult.data) || variationResult.data.length === 0) {
              hasMoreVariations = false;
              break;
            }

            for (const variation of variationResult.data) {
              variation._parentProduct = product;

              try {
                await this.importSingleVariation(variation, parentStrapiId, dryRun);
                totalProcessed += 1;
                processedInThisSession += 1;
                this.stats.total = totalProcessed;

                // Save progress but DON'T mark page as complete yet (variations still processing)
                this.saveProgressState({
                  lastCompletedPage: currentPage - 1, // Mark previous page as complete, not current
                  totalProcessed,
                  lastProcessedAt: new Date().toISOString(),
                });

                if (totalProcessed % this.config.logging.progressInterval === 0) {
                  this.logger.info(
                    `📈 Progress: ${totalProcessed} variations processed, current page: ${currentPage}`,
                  );
                }
              } catch (error) {
                this.stats.errors += 1;
                this.logger.error(
                  `❌ Failed to import variation ${variation.id}:`,
                  error.message || error,
                );

                if (!this.config.errorHandling.continueOnError) {
                  throw error;
                }
              }

              if (processedInThisSession >= limit) {
                break;
              }
            }

            if (processedInThisSession >= limit) {
              break;
            }

            variationPage += 1;
            const totalVariationPages = Number.parseInt(variationResult.totalPages || "1", 10);
            if (variationPage > totalVariationPages) {
              hasMoreVariations = false;
            }
          }

          if (processedInThisSession >= limit) {
            break;
          }
        }

        this.logger.success(
          `✅ Completed product page ${currentPage}: processed variations from ${variableProducts.length} products`,
        );

        // NOW mark this page as fully complete (all products and variations processed)
        this.saveProgressState({
          lastCompletedPage: currentPage,
          totalProcessed,
          lastProcessedAt: new Date().toISOString(),
        });

        currentPage += 1;
        const totalProductPages = Number.parseInt(result.totalPages || "1", 10);
        if (currentPage > totalProductPages) {
          hasMorePages = false;
        }

        if (processedInThisSession >= limit) {
          this.logger.info(`📊 Reached session limit of ${limit} variations`);
          break;
        }
      }

      this.logger.success(
        `🎉 Import session completed: ${processedInThisSession} variations processed in this session`,
      );
      }
    } catch (error) {
      this.stats.errors += 1;
      this.logger.error("❌ Variation import failed:", error);
      throw error;
    } finally {
      this.stats.endTime = Date.now();
      this.stats.duration = this.stats.endTime - this.stats.startTime;
      this.logFinalStats();
    }

    return this.stats;
  }

  /**
   * Import variations by scanning imported product mappings
   * Useful for backfilling missing variations without paging all WooCommerce products
   */
  async importFromImportedProducts({
    limit,
    page,
    dryRun,
    force,
    nameFilter,
    logParentNames,
    inStockOnly,
    missingOnly,
  }) {
    const progressKey = missingOnly
      ? "variation-import-missing-progress.json"
      : "variation-import-imported-progress.json";
    const activeNameFilter = Array.isArray(nameFilter) ? nameFilter : [];

    let productIds = Array.from(this.productMappingCache.keys())
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => Number.isFinite(id));

    if (!missingOnly) {
      productIds = this.getProductIdsSortedByMinVariationId();
      this.logger.info(`📅 Update-all: processing from variation id 1 upward (products ordered by min variation id)`);
    } else {
      productIds.sort((a, b) => a - b);
    }

    if (productIds.length === 0) {
      this.logger.info(`📂 No imported products found in mapping cache`);
      return;
    }

    const progressState = force
      ? { lastCompletedIndex: -1, totalProcessed: 0 }
      : this.loadProgressState(progressKey);

    const hasProgress =
      (Number.isFinite(progressState.lastCompletedIndex) &&
        progressState.lastCompletedIndex >= 0) ||
      (progressState.lastCompletedProductId !== undefined &&
        progressState.lastCompletedProductId !== null) ||
      (progressState.totalProcessed || 0) > 0;

    if (force && hasProgress) {
      this.logger.warn(
        `⚠️ FORCE MODE: Ignoring previous progress state (${progressKey})`,
      );
    }

    const productBatchSize = this.config.import.batchSizes.products || 50;
    const variationBatchSize =
      this.config.import.batchSizes.variations || productBatchSize || 100;

    const pageStartIndex = Math.max(0, (page - 1) * productBatchSize);

    let progressIndex = -1;
    if (Number.isFinite(progressState.lastCompletedIndex)) {
      progressIndex = progressState.lastCompletedIndex;
    }

    if (
      progressState.lastCompletedProductId !== undefined &&
      progressState.lastCompletedProductId !== null
    ) {
      const lastProductId = Number.parseInt(progressState.lastCompletedProductId, 10);
      const foundIndex = productIds.indexOf(lastProductId);
      if (foundIndex >= 0) {
        progressIndex = Math.max(progressIndex, foundIndex);
      }
    }

    let currentIndex = Math.max(pageStartIndex, progressIndex + 1);
    let totalProcessed = progressState.totalProcessed || 0;

    if (currentIndex >= productIds.length) {
      this.logger.info(
        `📂 Start index ${currentIndex + 1} exceeds imported product count (${productIds.length}); nothing to process`,
      );
      return;
    }

    this.logger.info(
      `📊 Resuming imported-products scan from index ${currentIndex + 1}/${
        productIds.length
      } (${totalProcessed} variations already processed)`,
    );

    if (missingOnly) {
      this.logger.info(`🧩 Missing-only mode enabled (skipping already imported variations)`);
    } else {
      this.logger.info(`🔄 Update-all mode: processing every variation (create or update)`);
    }

    let processedInThisSession = 0;

    const markProductComplete = (index) => {
      this.saveProgressState(
        {
          lastCompletedIndex: index,
          lastCompletedProductId: productIds[index],
          totalProcessed,
          lastProcessedAt: new Date().toISOString(),
        },
        progressKey,
      );
    };

    const markProductInProgress = (index) => {
      const previousIndex = index - 1;
      this.saveProgressState(
        {
          lastCompletedIndex: previousIndex,
          lastCompletedProductId: previousIndex >= 0 ? productIds[previousIndex] : null,
          totalProcessed,
          lastProcessedAt: new Date().toISOString(),
        },
        progressKey,
      );
    };

    for (let index = currentIndex; index < productIds.length; index += 1) {
      if (processedInThisSession >= limit) {
        this.logger.info(`📊 Reached session limit of ${limit} variations`);
        break;
      }

      const productId = productIds[index];
      const parentStrapiId = this.productMappingCache.get(productId);

      if (!parentStrapiId) {
        this.logger.warn(`⚠️ Skipping product ${productId} - no Strapi mapping found`);
        markProductComplete(index);
        continue;
      }

      let product;
      try {
        product = await this.wooClient.getProductById(productId);
      } catch (error) {
        this.stats.errors += 1;
        this.logger.error(`❌ Failed to fetch product ${productId}:`, error.message || error);
        if (!this.config.errorHandling.continueOnError) {
          throw error;
        }
        markProductComplete(index);
        continue;
      }

      if (!product) {
        this.logger.warn(`⚠️ WooCommerce product ${productId} not found, skipping`);
        markProductComplete(index);
        continue;
      }

      const productName = product.name || "Untitled Product";

      if (
        activeNameFilter.length > 0 &&
        !this.shouldImportParentProduct(productName, activeNameFilter)
      ) {
        this.logger.debug(
          `🎯 Skipping product ${productId} (${productName}) - does not match name filter`,
        );
        markProductComplete(index);
        continue;
      }

      const hasVariations =
        product.type === "variable" &&
        Array.isArray(product.variations) &&
        product.variations.length > 0;

      if (!hasVariations) {
        this.logger.debug(
          `📂 Skipping product ${productId} (${productName}) - no variations found`,
        );
        markProductComplete(index);
        continue;
      }

      if (inStockOnly) {
        const hasInStock = await this.hasInStockVariations(product);
        if (!hasInStock) {
          this.logger.debug(
            `⏩ Skipping variations for product ${productId} (${productName}) - no variations in stock`,
          );
          this.stats.skipped += product.variations.length;
          markProductComplete(index);
          continue;
        }
      }

      if (missingOnly) {
        const missingIds = product.variations.filter(
          (variationId) => !this.duplicateTracker.isImported("variations", variationId),
        );

        if (missingIds.length === 0) {
          this.logger.debug(
            `✅ All variations already imported for product ${productId} (${productName})`,
          );
          this.stats.skipped += product.variations.length;
          markProductComplete(index);
          continue;
        }
      }

      if (logParentNames && !dryRun) {
        this.logger.info(
          `🧵 Importing variations for parent product: ${productName} (Woo ID: ${productId})`,
        );
      }

      let variationPage = 1;
      let hasMoreVariations = true;

      while (hasMoreVariations && processedInThisSession < limit) {
        const variationRemainingLimit = limit - processedInThisSession;
        const perVariationPage = Math.min(variationBatchSize, variationRemainingLimit);

        const variationResult = await this.wooClient.getProductVariations(
          productId,
          variationPage,
          perVariationPage,
        );

        let variations = Array.isArray(variationResult.data) ? variationResult.data : [];

        if (variations.length === 0) {
          hasMoreVariations = false;
          break;
        }

        if (!missingOnly) {
          variations = this.sortVariationsByIdAsc(variations);
        }

        for (const variation of variations) {
          if (missingOnly && this.duplicateTracker.isImported("variations", variation.id)) {
            this.stats.skipped += 1;
            continue;
          }

          variation._parentProduct = product;

          try {
            await this.importSingleVariation(variation, parentStrapiId, dryRun);
            totalProcessed += 1;
            processedInThisSession += 1;
            this.stats.total = totalProcessed;

            // Mark previous product as complete while current one is in progress
            markProductInProgress(index);

            if (totalProcessed % this.config.logging.progressInterval === 0) {
              this.logger.info(
                `📈 Progress: ${totalProcessed} variations processed, current index: ${
                  index + 1
                }/${productIds.length}`,
              );
            }
          } catch (error) {
            this.stats.errors += 1;
            this.logger.error(
              `❌ Failed to import variation ${variation.id}:`,
              error.message || error,
            );

            if (!this.config.errorHandling.continueOnError) {
              throw error;
            }
          }

          if (processedInThisSession >= limit) {
            break;
          }
        }

        if (processedInThisSession >= limit) {
          break;
        }

        variationPage += 1;
        const totalVariationPages = Number.parseInt(variationResult.totalPages || "1", 10);
        if (variationPage > totalVariationPages) {
          hasMoreVariations = false;
        }
      }

      if (processedInThisSession >= limit) {
        this.logger.info(`📊 Reached session limit of ${limit} variations`);
        break;
      }

      markProductComplete(index);
    }

    this.logger.success(
      `🎉 Imported-products scan completed: ${processedInThisSession} variations processed in this session`,
    );
  }

  /**
   * Load all mapping caches
   */
  async loadMappingCaches() {
    this.logger.debug("📂 Loading mapping caches...");

    const productMappings = this.duplicateTracker.getAllMappings("products");
    for (const [wcId, mapping] of Object.entries(productMappings)) {
      this.productMappingCache.set(parseInt(wcId, 10), mapping.strapiId);
    }

    this.logger.info(`📂 Loaded ${this.productMappingCache.size} product mappings`);
  }

  /**
   * Get product IDs sorted by minimum variation ID (so we process variation id 1, 2, 3... first).
   * Used in update-all mode so variations are updated from lowest ID to highest.
   * Products with no variation mappings are placed at the end.
   */
  getProductIdsSortedByMinVariationId() {
    const productIds = Array.from(this.productMappingCache.keys())
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => Number.isFinite(id));

    const variationMappings = this.duplicateTracker.getAllMappings("variations");

    const productMinVariationId = new Map();
    for (const productId of productIds) {
      let minId = Infinity;
      for (const [wcVariationId, mapping] of Object.entries(variationMappings)) {
        const mappingProductId =
          typeof mapping.productId === "number"
            ? mapping.productId
            : Number.parseInt(mapping.productId, 10);
        if (mappingProductId === productId) {
          const vid = Number.parseInt(wcVariationId, 10);
          if (Number.isFinite(vid) && vid < minId) minId = vid;
        }
      }
      productMinVariationId.set(productId, minId === Infinity ? Number.MAX_SAFE_INTEGER : minId);
    }

    return productIds.slice().sort((a, b) => {
      const idA = productMinVariationId.get(a) ?? Number.MAX_SAFE_INTEGER;
      const idB = productMinVariationId.get(b) ?? Number.MAX_SAFE_INTEGER;
      return idA - idB;
    });
  }

  /**
   * Sort variations by WooCommerce variation ID ascending (id 1, 2, 3...).
   */
  sortVariationsByIdAsc(variations) {
    return variations.slice().sort((a, b) => {
      const idA = Number.parseInt(a.id, 10) || 0;
      const idB = Number.parseInt(b.id, 10) || 0;
      return idA - idB;
    });
  }

  /**
   * Load progress state from file
   */
  loadProgressState(progressKey = "variation-import-progress.json") {
    const progressFile = path.join(this.config.duplicateTracking.storageDir, progressKey);

    try {
      if (fs.existsSync(progressFile)) {
        const data = JSON.parse(fs.readFileSync(progressFile, "utf8"));
        const locationLabel =
          data.lastCompletedPage !== undefined
            ? `page ${data.lastCompletedPage}`
            : data.lastCompletedIndex !== undefined
            ? `index ${data.lastCompletedIndex}`
            : "unknown position";
        this.logger.debug(
          `📂 Loaded progress state (${progressKey}): ${locationLabel}, ${data.totalProcessed} processed`,
        );
        return data;
      }
    } catch (error) {
      this.logger.warn(`⚠️ Failed to load progress state: ${error.message}`);
    }

    return {
      lastCompletedPage: 0,
      totalProcessed: 0,
      lastProcessedAt: null,
      lastCompletedIndex: -1,
      lastCompletedProductId: null,
    };
  }

  /**
   * Save progress state to file
   */
  saveProgressState(state, progressKey = "variation-import-progress.json") {
    const progressFile = path.join(this.config.duplicateTracking.storageDir, progressKey);

    try {
      fs.writeFileSync(progressFile, JSON.stringify(state, null, 2));
    } catch (error) {
      this.logger.error(`❌ Failed to save progress state: ${error.message}`);
    }
  }

  /**
   * Reset progress state (useful for starting fresh)
   */
  resetProgressState(progressKey = null) {
    const progressKeys = progressKey
      ? [progressKey]
      : [
          "variation-import-progress.json",
          "variation-import-imported-progress.json",
          "variation-import-missing-progress.json",
        ];

    let removedAny = false;

    for (const key of progressKeys) {
      const progressFile = path.join(this.config.duplicateTracking.storageDir, key);

      try {
        if (fs.existsSync(progressFile)) {
          fs.unlinkSync(progressFile);
          removedAny = true;
        }
      } catch (error) {
        this.logger.error(`❌ Failed to reset progress state (${key}): ${error.message}`);
      }
    }

    if (removedAny) {
      this.logger.info(`🧹 Reset variation progress state`);
    } else {
      this.logger.info(`📂 No existing variation progress state to reset`);
    }
  }

  /**
   * Import a single variation
   */
  async importSingleVariation(wcVariation, parentProductStrapiId, dryRun = false) {
    this.logger.debug(
      `🔄 Processing variation: ${wcVariation.id} - ${wcVariation._parentProduct.name}`,
    );

    let existingMapping = this.duplicateTracker.getStrapiId("variations", wcVariation.id);
    let existingStrapiId = existingMapping?.strapiId;

    try {
      if (!existingStrapiId) {
        try {
          const existingByExternal = await this.strapiClient.findByExternalId(
            "/product-variations",
            wcVariation.id.toString(),
          );
          const existingItems = Array.isArray(existingByExternal?.data)
            ? existingByExternal.data
            : [];

          if (existingItems.length > 0) {
            existingStrapiId = existingItems[0].id;
            existingMapping = { strapiId: existingStrapiId };
            this.duplicateTracker.recordMapping("variations", wcVariation.id, existingStrapiId, {
              recovered: true,
            });
            this.logger.warn(
              `⚠️ Recovered missing variation mapping for WC ${wcVariation.id} → Strapi ${existingStrapiId}`,
            );
          }
        } catch (lookupError) {
          this.logger.warn(
            `⚠️ Failed to lookup existing variation ${wcVariation.id} by external_id: ${lookupError.message}`,
          );
        }
      }

      // Validate parent product exists
      if (!parentProductStrapiId || typeof parentProductStrapiId !== "number") {
        const errorMsg = `Variation ${wcVariation.id}: Invalid parent product ID: ${parentProductStrapiId}`;
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      const strapiVariation = await this.transformVariation(wcVariation, parentProductStrapiId, {
        preserveMissingPrice: Boolean(existingStrapiId),
      });

      // Final validation of variation data
      if (!strapiVariation.SKU || (!existingStrapiId && strapiVariation.Price === undefined)) {
        const errorMsg = `Variation ${wcVariation.id}: Missing required fields - SKU: ${strapiVariation.SKU}, Price: ${strapiVariation.Price}`;
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      if (dryRun) {
        const mode = existingStrapiId ? "update" : "create";
        this.logger.info(`🔍 [DRY RUN] Would ${mode} variation: ${wcVariation.id}`);
        this.stats.success += 1;
        if (existingStrapiId) {
          this.stats.updated += 1;
        }
        return { isDryRun: true, mode, data: strapiVariation };
      }

      const skipDefaultAttributes = Boolean(existingStrapiId);
      await this.createVariationAttributes(wcVariation, strapiVariation, {
        skipDefaultAttributes,
      });

      let variationId = existingStrapiId;
      let mode = "create";

      if (existingStrapiId) {
        // Full payload: Price, DiscountPrice, SKU, IsPublished, product, attributes (color/size/model)
        await this.strapiClient.updateProductVariation(existingStrapiId, strapiVariation);
        variationId = existingStrapiId;
        mode = "update";
        this.stats.variationsUpdated += 1;
        this.logger.success(`🔄 Updated variation: ${wcVariation.id} → ID: ${existingStrapiId}`);
      } else {
        const result = await this.strapiClient.createProductVariation(strapiVariation);
        variationId = result.data.id;
        this.stats.variationsCreated += 1;
        this.logger.success(`✅ Created variation: ${wcVariation.id} → ID: ${variationId}`);
      }

      if (wcVariation.manage_stock && wcVariation.stock_quantity !== null) {
        const stockResult = await this.createProductStock(variationId, wcVariation);
        if (stockResult?.created) {
          this.stats.stocksCreated += 1;
        } else if (stockResult?.updated) {
          this.stats.stocksUpdated += 1;
        }
      }

      this.duplicateTracker.recordMapping("variations", wcVariation.id, variationId, {
        productId: wcVariation._parentProduct.id,
        sku: wcVariation.sku,
        price: wcVariation.price,
        stockQuantity: wcVariation.stock_quantity,
      });

      this.stats.success += 1;
      if (mode === "update") {
        this.stats.updated += 1;
      }

      return { mode, strapiId: variationId };
    } catch (error) {
      this.stats.failed += 1;
      this.logger.error(`❌ Failed to upsert variation ${wcVariation.id}:`, error.message);
      throw error;
    }
  }

  /**
   * Transform WooCommerce variation to Strapi format
   */
  async transformVariation(wcVariation, parentProductStrapiId, options = {}) {
    // Validate parent product is set
    if (!parentProductStrapiId) {
      throw new Error(`Variation ${wcVariation.id}: Parent product ID is missing or invalid`);
    }

    let sku = wcVariation.sku || this.generateSKU(wcVariation);
    sku = await this.ensureUniqueSKU(sku);

    // Validate SKU is not empty
    if (!sku || sku.trim() === "") {
      throw new Error(`Variation ${wcVariation.id}: Could not generate a valid SKU`);
    }

    const variationStatus = (wcVariation.status || "").toLowerCase();
    const isPublished = variationStatus === "publish";

    const strapiVariation = {
      SKU: sku,
      IsPublished: isPublished,
      external_id: wcVariation.id.toString(),
      external_source: "woocommerce",
      product: parentProductStrapiId,
    };

    const variationRegularPrice = parseFloat(wcVariation.regular_price || wcVariation.price || 0);
    const variationSalePrice = parseFloat(wcVariation.sale_price || 0);
    const parentProduct = wcVariation._parentProduct || {};
    const parentRegularPrice = parseFloat(parentProduct.regular_price || parentProduct.price || 0);
    const parentSalePrice = parseFloat(parentProduct.sale_price || 0);
    const hasVariationPrice = Number.isFinite(variationRegularPrice) && variationRegularPrice > 0;
    const hasParentPrice = Number.isFinite(parentRegularPrice) && parentRegularPrice > 0;
    const regularPrice = hasVariationPrice ? variationRegularPrice : parentRegularPrice;
    const salePrice = hasVariationPrice ? variationSalePrice : parentSalePrice;

    // Validate price is set
    if (!regularPrice || regularPrice <= 0) {
      this.logger.warn(
        `⚠️ Variation ${wcVariation.id}: No valid price found (regular: ${wcVariation.regular_price}, price: ${wcVariation.price})`,
      );
      if (options.preserveMissingPrice) {
        this.logger.warn(
          `⚠️ Variation ${wcVariation.id}: Keeping existing Strapi price unchanged because WooCommerce price is blank`,
        );
      } else {
        // New Strapi variations require Price, so create missing-price variations with 0.
        strapiVariation.Price = 0;
      }
    } else if (salePrice > 0 && salePrice < regularPrice) {
      strapiVariation.Price = this.convertPrice(regularPrice);
      strapiVariation.DiscountPrice = this.convertPrice(salePrice);
      this.logger.debug(
        `💰 Variation ${wcVariation.id}: Regular price ${regularPrice}, Discount price ${salePrice}`,
      );
    } else {
      if (!hasVariationPrice && hasParentPrice) {
        this.logger.warn(
          `⚠️ Variation ${wcVariation.id}: WooCommerce variation price is blank; using parent product ${parentProduct.id || "unknown"} price ${parentRegularPrice}`,
        );
      }
      strapiVariation.Price = this.convertPrice(regularPrice);
    }

    this.logger.debug(
      `📂 Transformed variation: ${wcVariation.id} → SKU: ${sku}, Price: ${strapiVariation.Price}`,
    );
    return strapiVariation;
  }

  /**
   * Create variation attributes (color, size, model)
   * @param {object} options - Optional: { skipDefaultAttributes: true } to skip adding default color (e.g. when only updating stock on existing variations)
   */
  async createVariationAttributes(wcVariation, strapiVariation, options = {}) {
    const presentAttributes = new Set();

    if (Array.isArray(wcVariation.attributes)) {
      for (const attribute of wcVariation.attributes) {
        try {
          const attributeType = this.identifyAttributeType(attribute.name || "");
          presentAttributes.add(attributeType);

          const strapiId = await this.createOrGetAttribute(attributeType, attribute.option);

          if (strapiId) {
            switch (attributeType) {
              case "color":
                strapiVariation.product_variation_color = strapiId;
                break;
              case "size":
                strapiVariation.product_variation_size = strapiId;
                break;
              case "model":
                strapiVariation.product_variation_model = strapiId;
                break;
              default:
                break;
            }

            this.logger.debug(`🔄 Linked ${attributeType}: ${attribute.option} → ID: ${strapiId}`);
          }
        } catch (error) {
          this.logger.error(`❌ Failed to create attribute ${attribute.name}:`, error.message);
        }
      }
    }

    await this.addDefaultAttributes(strapiVariation, presentAttributes, wcVariation.id, options);
  }

  /**
   * Add default attributes for types not present in WooCommerce data
   * Note: Default size and model creation has been removed - only color defaults are added.
   * When options.skipDefaultAttributes is true (e.g. update-existing mode), default color is not added so only stock/price etc. are updated.
   */
  async addDefaultAttributes(strapiVariation, presentAttributes, variationId, options = {}) {
    if (options.skipDefaultAttributes) {
      return;
    }

    const defaultAttrs = this.config.import.defaults.variationAttributes;

    if (!presentAttributes.has("color") && !strapiVariation.product_variation_color) {
      try {
        const defaultColorId = await this.createOrGetAttribute(
          "color",
          defaultAttrs.color.title,
          defaultAttrs.color.colorCode,
        );
        if (defaultColorId) {
          strapiVariation.product_variation_color = defaultColorId;
          this.logger.info(
            `🔄 Variation ${variationId}: Added default color "${defaultAttrs.color.title}" → ID: ${defaultColorId}`,
          );
        }
      } catch (error) {
        this.logger.error("❌ Failed to create default color attribute:", error.message);
      }
    }

    // Default size and model creation removed - variations must have explicit size/model attributes
  }

  /**
   * Identify attribute type based on name
   */
  identifyAttributeType(attributeName) {
    const name = (attributeName || "").toLowerCase();

    if (name.includes("رنگ") || name.includes("color") || name.includes("colour")) {
      return "color";
    }

    if (name.includes("سایز") || name.includes("اندازه") || name.includes("size")) {
      return "size";
    }

    return "model";
  }

  /**
   * Create or get existing attribute
   */
  async createOrGetAttribute(type, value, customColorCode = null) {
    if (!value || value.toString().trim() === "") {
      return null;
    }

    let normalizedValue = value.toString().trim();
    let resolvedColor = null;

    if (type === "color") {
      resolvedColor = resolveColorMapping(normalizedValue);
      if (!resolvedColor.matched) {
        // Log unmapped colors to help increase mappings
        this.logger.warn(
          `🎨 UNMAPPED COLOR: "${normalizedValue}" (original: "${value}") - Using fallback ${resolvedColor.colorCode}. Add to color-mappings.json to improve accuracy.`,
        );
        // Track unmapped colors for summary
        if (!this.unmappedColors) {
          this.unmappedColors = new Set();
        }
        this.unmappedColors.add(normalizedValue);
      }
      normalizedValue = resolvedColor.title;
    }

    const cacheKey = `${type}:${normalizedValue.toLowerCase()}`;
    const cache = this.getCacheForType(type);

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      let result;
      const attributeData = {
        Title: normalizedValue,
        external_id: `${type}_${normalizedValue.toLowerCase().replace(/\s+/g, "_")}`,
        external_source: "woocommerce",
      };

      if (type === "color") {
        attributeData.ColorCode =
          customColorCode || resolvedColor?.colorCode || resolveColorMapping("").colorCode;
      }

      switch (type) {
        case "color":
          result = await this.strapiClient.createVariationColor(attributeData);
          break;
        case "size":
          result = await this.strapiClient.createVariationSize(attributeData);
          break;
        default:
          result = await this.strapiClient.createVariationModel(attributeData);
          break;
      }

      if (result && result.data) {
        cache.set(cacheKey, result.data.id);
        this.stats.attributesCreated += 1;
        this.logger.debug(
          `✅ Created ${type} attribute: ${normalizedValue} → ID: ${result.data.id}`,
        );
        return result.data.id;
      }
    } catch (error) {
      this.logger.error(`❌ Failed to create ${type} attribute "${value}":`, error.message);
    }

    return null;
  }

  /**
   * Get cache for attribute type
   */
  getCacheForType(type) {
    switch (type) {
      case "color":
        return this.colorMappingCache;
      case "size":
        return this.sizeMappingCache;
      case "model":
      default:
        return this.modelMappingCache;
    }
  }

  /**
   * Generate unique color code from color name using hash-based approach
   */
  generateColorCode(colorName) {
    let hash = 0;
    const normalizedName = colorName.toLowerCase().trim();

    for (let i = 0; i < normalizedName.length; i += 1) {
      const char = normalizedName.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }

    const r = Math.abs(hash) % 256;
    const g = Math.abs(hash >> 8) % 256;
    const b = Math.abs(hash >> 16) % 256;

    const adjustedR = Math.max(50, Math.min(205, r));
    const adjustedG = Math.max(50, Math.min(205, g));
    const adjustedB = Math.max(50, Math.min(205, b));

    const toHex = (val) => {
      const hex = val.toString(16);
      return hex.length === 1 ? `0${hex}` : hex;
    };

    return `#${toHex(adjustedR)}${toHex(adjustedG)}${toHex(adjustedB)}`.toUpperCase();
  }

  /**
   * Create or update product stock record
   */
  async createProductStock(variationId, wcVariation) {
    const stockData = {
      Count: Math.max(0, wcVariation.stock_quantity || 0),
      product_variation: variationId,
      external_id: `stock_${wcVariation.id}`,
      external_source: "woocommerce",
    };

    try {
      const existing = await this.strapiClient.findByExternalId(
        "/product-stocks",
        stockData.external_id,
      );
      const existingItems = Array.isArray(existing?.data) ? existing.data : [];

      if (existingItems.length > 0) {
        const stockId = existingItems[0].id;
        await this.strapiClient.updateProductStock(stockId, stockData);
        this.logger.debug(
          `🔍 Updated stock record: ${wcVariation.stock_quantity} units for variation ${variationId}`,
        );
        return { updated: true, id: stockId };
      }

      const result = await this.strapiClient.createProductStock(stockData);
      this.logger.debug(
        `🔍 Created stock record: ${wcVariation.stock_quantity} units for variation ${variationId}`,
      );
      return { created: true, id: result.data.id };
    } catch (error) {
      this.logger.error(`??O Failed to sync stock for variation ${variationId}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate SKU for variation
   */
  generateSKU(wcVariation) {
    const productId = wcVariation._parentProduct.id;
    const variationId = wcVariation.id;
    return `WC-${productId}-${variationId}`;
  }

  /**
   * Ensure SKU uniqueness - checks against existing SKUs in Strapi
   */
  async ensureUniqueSKU(sku) {
    let uniqueSKU = sku;
    let suffix = 0;
    let isUnique = false;

    while (!isUnique) {
      try {
        // Check if this SKU already exists in Strapi
        const existing = await this.strapiClient.get("/product-variations", {
          "filters[SKU][$eq]": uniqueSKU,
          "pagination[pageSize]": 1,
        });

        // If no results found, SKU is unique
        if (!existing.data || existing.data.length === 0) {
          isUnique = true;
        } else {
          // SKU exists, try with suffix
          suffix += 1;
          uniqueSKU = `${sku}-${suffix}`;
          this.logger.debug(`SKU ${sku} exists, trying ${uniqueSKU}`);
        }
      } catch (error) {
        // If query fails, assume SKU is unique to avoid blocking import
        this.logger.warn(`Failed to check SKU uniqueness for ${uniqueSKU}: ${error.message}`);
        isUnique = true;
      }
    }

    if (suffix > 0) {
      this.logger.info(`Generated unique SKU: ${sku} → ${uniqueSKU}`);
    }

    return uniqueSKU;
  }

  /**
   * Convert price from IRT to internal format
   */
  convertPrice(price) {
    if (!price || price === "0" || price === "") {
      return 0;
    }

    const numPrice = parseFloat(price);
    const multiplier = this.config.import.currency.multiplier || 1;

    return Math.round(numPrice * multiplier);
  }

  /**
   * Log final import statistics
   */
  logFinalStats() {
    this.logger.success(`🎉 Variation import completed!`);
    this.logger.logStats(this.stats);
    this.logger.info(`📊 Additional stats:`);
    this.logger.info(`   Variations created: ${this.stats.variationsCreated}`);
    this.logger.info(`   Variations updated: ${this.stats.variationsUpdated}`);
    this.logger.info(`   Stock records created: ${this.stats.stocksCreated}`);
    this.logger.info(`   Stock records updated: ${this.stats.stocksUpdated}`);
    this.logger.info(`   Attributes created: ${this.stats.attributesCreated}`);

    const trackingStats = this.duplicateTracker.getStats();
    this.logger.info(
      `📊 Duplicate tracking: ${trackingStats.variations?.total || 0} variations tracked`,
    );

    // Log unmapped colors summary
    if (this.unmappedColors && this.unmappedColors.size > 0) {
      this.logger.warn(
        `\n${"─".repeat(80)}\n🎨 UNMAPPED COLORS SUMMARY (${
          this.unmappedColors.size
        } unique colors):`,
      );
      const sortedColors = Array.from(this.unmappedColors).sort();
      sortedColors.forEach((color) => {
        this.logger.warn(`   - "${color}"`);
      });
      this.logger.warn(
        `\n💡 TIP: Add these colors to data/color-mappings.json to improve color mapping accuracy.\n${"─".repeat(
          80,
        )}\n`,
      );
    }
  }

  /**
   * Get import statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

module.exports = VariationImporter;
