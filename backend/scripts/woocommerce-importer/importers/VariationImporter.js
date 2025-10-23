const fs = require('fs');
const path = require('path');
const { WooCommerceClient, StrapiClient } = require('../utils/ApiClient');
const DuplicateTracker = require('../utils/DuplicateTracker');

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
      attributesCreated: 0
    };

    // Caches for faster lookups
    this.productMappingCache = new Map();
    this.colorMappingCache = new Map();
    this.sizeMappingCache = new Map();
    this.modelMappingCache = new Map();
  }

  /**
   * Main import method - Optimized for incremental processing
   */
  async import(options = {}) {
    const { limit = 100, page = 1, dryRun = false, onlyImported = false } = options;

    this.stats.startTime = Date.now();
    this.logger.info(
      `🔄 Starting variation import (limit: ${limit}, page: ${page}, dryRun: ${dryRun}, onlyImported: ${onlyImported})`
    );
    this.logger.warn(
      `⚠️  NOTE: Running concurrent import sessions may cause cache staleness. Run imports sequentially for best results.`
    );

    try {
      await this.loadMappingCaches();
      this.lastCacheRefreshTime = Date.now();

      const progressState = this.loadProgressState();
      let currentPage = Math.max(page, (progressState.lastCompletedPage || 0) + 1);
      let totalProcessed = progressState.totalProcessed || 0;

      this.logger.info(
        `📊 Resuming from page ${currentPage} (${totalProcessed} variations already processed)`
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
          this.logger.info(`🔄 Refreshing mapping caches (last refresh: ${Math.round(cacheAge / 1000)}s ago)`);
          await this.loadMappingCaches();
          this.lastCacheRefreshTime = Date.now();
        }

        const remainingLimit = limit - processedInThisSession;
        const perPage = Math.min(productBatchSize, remainingLimit);

        this.logger.info(
          `📂 Processing product page ${currentPage} (requesting ${perPage} items)`
        );

        const result = await this.wooClient.getProducts(currentPage, perPage);

        if (!Array.isArray(result.data) || result.data.length === 0) {
          this.logger.info(`📂 No more products found on page ${currentPage}`);
          hasMorePages = false;
          break;
        }

        let variableProducts = result.data.filter(
          (product) => product.type === 'variable' && Array.isArray(product.variations) && product.variations.length > 0
        );

        if (onlyImported) {
          const originalCount = variableProducts.length;
          variableProducts = variableProducts.filter((product) =>
            this.productMappingCache.has(product.id)
          );

          if (originalCount !== variableProducts.length) {
            this.logger.debug(
              `🔍 Filtered ${originalCount - variableProducts.length} products without imported parents`
            );
          }
        }

        if (variableProducts.length === 0) {
          this.logger.debug(
            `📂 No variable products with variations found on page ${currentPage}, skipping`
          );
          currentPage += 1;
          continue;
        }

        for (const product of variableProducts) {
          const parentStrapiId = this.productMappingCache.get(product.id);

          if (!parentStrapiId) {
            this.logger.warn(
              `⚠️ Skipping variations for product ${product.id} (${product.name}) - parent not imported yet`
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
              perVariationPage
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
                  lastProcessedAt: new Date().toISOString()
                });

                if (totalProcessed % this.config.logging.progressInterval === 0) {
                  this.logger.info(
                    `📈 Progress: ${totalProcessed} variations processed, current page: ${currentPage}`
                  );
                }
              } catch (error) {
                this.stats.errors += 1;
                this.logger.error(
                  `❌ Failed to import variation ${variation.id}:`,
                  error.message || error
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
            const totalVariationPages = Number.parseInt(variationResult.totalPages || '1', 10);
            if (variationPage > totalVariationPages) {
              hasMoreVariations = false;
            }
          }

          if (processedInThisSession >= limit) {
            break;
          }
        }

        this.logger.success(
          `✅ Completed product page ${currentPage}: processed variations from ${variableProducts.length} products`
        );

        // NOW mark this page as fully complete (all products and variations processed)
        this.saveProgressState({
          lastCompletedPage: currentPage,
          totalProcessed,
          lastProcessedAt: new Date().toISOString()
        });

        currentPage += 1;
        const totalProductPages = Number.parseInt(result.totalPages || '1', 10);
        if (currentPage > totalProductPages) {
          hasMorePages = false;
        }

        if (processedInThisSession >= limit) {
          this.logger.info(`📊 Reached session limit of ${limit} variations`);
          break;
        }
      }

      this.logger.success(
        `🎉 Import session completed: ${processedInThisSession} variations processed in this session`
      );
    } catch (error) {
      this.stats.errors += 1;
      this.logger.error('❌ Variation import failed:', error);
      throw error;
    } finally {
      this.stats.endTime = Date.now();
      this.stats.duration = this.stats.endTime - this.stats.startTime;
      this.logFinalStats();
    }

    return this.stats;
  }

  /**
   * Load all mapping caches
   */
  async loadMappingCaches() {
    this.logger.debug('📂 Loading mapping caches...');

    const productMappings = this.duplicateTracker.getAllMappings('products');
    for (const [wcId, mapping] of Object.entries(productMappings)) {
      this.productMappingCache.set(parseInt(wcId, 10), mapping.strapiId);
    }

    this.logger.info(`📂 Loaded ${this.productMappingCache.size} product mappings`);
  }

  /**
   * Load progress state from file
   */
  loadProgressState() {
    const progressFile = path.join(
      this.config.duplicateTracking.storageDir,
      'variation-import-progress.json'
    );

    try {
      if (fs.existsSync(progressFile)) {
        const data = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
        this.logger.debug(
          `📂 Loaded progress state: page ${data.lastCompletedPage}, ${data.totalProcessed} processed`
        );
        return data;
      }
    } catch (error) {
      this.logger.warn(`⚠️ Failed to load progress state: ${error.message}`);
    }

    return {
      lastCompletedPage: 0,
      totalProcessed: 0,
      lastProcessedAt: null
    };
  }

  /**
   * Save progress state to file
   */
  saveProgressState(state) {
    const progressFile = path.join(
      this.config.duplicateTracking.storageDir,
      'variation-import-progress.json'
    );

    try {
      fs.writeFileSync(progressFile, JSON.stringify(state, null, 2));
    } catch (error) {
      this.logger.error(`❌ Failed to save progress state: ${error.message}`);
    }
  }

  /**
   * Reset progress state (useful for starting fresh)
   */
  resetProgressState() {
    const progressFile = path.join(
      this.config.duplicateTracking.storageDir,
      'variation-import-progress.json'
    );

    try {
      if (fs.existsSync(progressFile)) {
        fs.unlinkSync(progressFile);
      } else {
        this.logger.info(`📂 No existing variation progress state to reset`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to reset progress state: ${error.message}`);
    }
  }

  /**
   * Import a single variation
   */
  async importSingleVariation(wcVariation, parentProductStrapiId, dryRun = false) {
    this.logger.debug(
      `🔄 Processing variation: ${wcVariation.id} - ${wcVariation._parentProduct.name}`
    );

    const existingMapping = this.duplicateTracker.getStrapiId('variations', wcVariation.id);
    const existingStrapiId = existingMapping?.strapiId;

    try {
      const strapiVariation = await this.transformVariation(
        wcVariation,
        parentProductStrapiId
      );

      if (dryRun) {
        const mode = existingStrapiId ? 'update' : 'create';
        this.logger.info(`🔍 [DRY RUN] Would ${mode} variation: ${wcVariation.id}`);
        this.stats.success += 1;
        if (existingStrapiId) {
          this.stats.updated += 1;
        }
        return { isDryRun: true, mode, data: strapiVariation };
      }

      await this.createVariationAttributes(wcVariation, strapiVariation);

      let variationId = existingStrapiId;
      let mode = 'create';

      if (existingStrapiId) {
        await this.strapiClient.updateProductVariation(existingStrapiId, strapiVariation);
        variationId = existingStrapiId;
        mode = 'update';
        this.stats.variationsUpdated += 1;
        this.logger.success(`🔄 Updated variation: ${wcVariation.id} → ID: ${existingStrapiId}`);
      } else {
        const result = await this.strapiClient.createProductVariation(strapiVariation);
        variationId = result.data.id;
        this.stats.variationsCreated += 1;
        this.logger.success(`?o. Created variation: ${wcVariation.id} → ID: ${variationId}`);
      }

      if (wcVariation.manage_stock && wcVariation.stock_quantity !== null) {
        const stockResult = await this.createProductStock(variationId, wcVariation);
        if (stockResult?.created) {
          this.stats.stocksCreated += 1;
        } else if (stockResult?.updated) {
          this.stats.stocksUpdated += 1;
        }
      }

      this.duplicateTracker.recordMapping(
        'variations',
        wcVariation.id,
        variationId,
        {
          productId: wcVariation._parentProduct.id,
          sku: wcVariation.sku,
          price: wcVariation.price,
          stockQuantity: wcVariation.stock_quantity
        }
      );

      this.stats.success += 1;
      if (mode === 'update') {
        this.stats.updated += 1;
      }

      return { mode, strapiId: variationId };
    } catch (error) {
      this.stats.failed += 1;
      this.logger.error(`??O Failed to upsert variation ${wcVariation.id}:`, error.message);
      throw error;
    }
  }

  /**
   * Transform WooCommerce variation to Strapi format
   */
  async transformVariation(wcVariation, parentProductStrapiId) {
    let sku = wcVariation.sku || this.generateSKU(wcVariation);
    sku = await this.ensureUniqueSKU(sku);

    const strapiVariation = {
      SKU: sku,
      IsPublished: wcVariation.status === 'publish',
      external_id: wcVariation.id.toString(),
      external_source: 'woocommerce',
      product: parentProductStrapiId
    };

    const regularPrice = parseFloat(wcVariation.regular_price || wcVariation.price || 0);
    const salePrice = parseFloat(wcVariation.sale_price || 0);

    if (salePrice > 0 && salePrice < regularPrice) {
      strapiVariation.Price = this.convertPrice(regularPrice);
      strapiVariation.DiscountPrice = this.convertPrice(salePrice);
      this.logger.debug(
        `💰 Variation ${wcVariation.id}: Regular price ${regularPrice}, Discount price ${salePrice}`
      );
    } else {
      strapiVariation.Price = this.convertPrice(
        wcVariation.price || wcVariation.regular_price
      );
    }

    this.logger.debug(`📂 Transformed variation: ${wcVariation.id} → SKU: ${sku}`);
    return strapiVariation;
  }

  /**
   * Create variation attributes (color, size, model)
   */
  async createVariationAttributes(wcVariation, strapiVariation) {
    const presentAttributes = new Set();

    if (Array.isArray(wcVariation.attributes)) {
      for (const attribute of wcVariation.attributes) {
        try {
          const attributeType = this.identifyAttributeType(attribute.name || '');
          presentAttributes.add(attributeType);

          const strapiId = await this.createOrGetAttribute(attributeType, attribute.option);

          if (strapiId) {
            switch (attributeType) {
              case 'color':
                strapiVariation.product_variation_color = strapiId;
                break;
              case 'size':
                strapiVariation.product_variation_size = strapiId;
                break;
              case 'model':
                strapiVariation.product_variation_model = strapiId;
                break;
              default:
                break;
            }

            this.logger.debug(
              `🔄 Linked ${attributeType}: ${attribute.option} → ID: ${strapiId}`
            );
          }
        } catch (error) {
          this.logger.error(
            `❌ Failed to create attribute ${attribute.name}:`,
            error.message
          );
        }
      }
    }

    await this.addDefaultAttributes(strapiVariation, presentAttributes, wcVariation.id);
  }

  /**
   * Add default attributes for types not present in WooCommerce data
   */
  async addDefaultAttributes(strapiVariation, presentAttributes, variationId) {
    const defaultAttrs = this.config.import.defaults.variationAttributes;

    if (!presentAttributes.has('color') && !strapiVariation.product_variation_color) {
      try {
        const defaultColorId = await this.createOrGetAttribute(
          'color',
          defaultAttrs.color.title,
          defaultAttrs.color.colorCode
        );
        if (defaultColorId) {
          strapiVariation.product_variation_color = defaultColorId;
          this.logger.info(
            `🔄 Variation ${variationId}: Added default color "${defaultAttrs.color.title}" → ID: ${defaultColorId}`
          );
        }
      } catch (error) {
        this.logger.error('❌ Failed to create default color attribute:', error.message);
      }
    }

    if (!presentAttributes.has('size') && !strapiVariation.product_variation_size) {
      try {
        const defaultSizeId = await this.createOrGetAttribute(
          'size',
          defaultAttrs.size.title
        );
        if (defaultSizeId) {
          strapiVariation.product_variation_size = defaultSizeId;
          this.logger.info(
            `🔍 Variation ${variationId}: Added default size "${defaultAttrs.size.title}" → ID: ${defaultSizeId}`
          );
        }
      } catch (error) {
        this.logger.error('❌ Failed to create default size attribute:', error.message);
      }
    }

    if (!presentAttributes.has('model') && !strapiVariation.product_variation_model) {
      try {
        const defaultModelId = await this.createOrGetAttribute(
          'model',
          defaultAttrs.model.title
        );
        if (defaultModelId) {
          strapiVariation.product_variation_model = defaultModelId;
          this.logger.info(
            `ℹ️ Variation ${variationId}: Added default model "${defaultAttrs.model.title}" → ID: ${defaultModelId}`
          );
        }
      } catch (error) {
        this.logger.error('❌ Failed to create default model attribute:', error.message);
      }
    }
  }

  /**
   * Identify attribute type based on name
   */
  identifyAttributeType(attributeName) {
    const name = (attributeName || '').toLowerCase();

    if (name.includes('رنگ') || name.includes('color') || name.includes('colour')) {
      return 'color';
    }

    if (name.includes('سایز') || name.includes('اندازه') || name.includes('size')) {
      return 'size';
    }

    return 'model';
  }

  /**
   * Create or get existing attribute
   */
  async createOrGetAttribute(type, value, customColorCode = null) {
    if (!value || value.toString().trim() === '') {
      return null;
    }

    const cacheKey = `${type}:${value}`;
    const cache = this.getCacheForType(type);

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      let result;
      const normalizedValue = value.toString().trim();
      const attributeData = {
        Title: normalizedValue,
        external_id: `${type}_${normalizedValue.toLowerCase().replace(/\s+/g, '_')}`,
        external_source: 'woocommerce'
      };

      if (type === 'color') {
        attributeData.ColorCode = customColorCode || this.generateColorCode(normalizedValue);
      }

      switch (type) {
        case 'color':
          result = await this.strapiClient.createVariationColor(attributeData);
          break;
        case 'size':
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
          `✅ Created ${type} attribute: ${normalizedValue} → ID: ${result.data.id}`
        );
        return result.data.id;
      }
    } catch (error) {
      this.logger.error(
        `❌ Failed to create ${type} attribute "${value}":`,
        error.message
      );
    }

    return null;
  }

  /**
   * Get cache for attribute type
   */
  getCacheForType(type) {
    switch (type) {
      case 'color':
        return this.colorMappingCache;
      case 'size':
        return this.sizeMappingCache;
      case 'model':
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
      external_source: 'woocommerce'
    };

    try {
      const existing = await this.strapiClient.findByExternalId(
        '/product-stocks',
        stockData.external_id
      );
      const existingItems = Array.isArray(existing?.data) ? existing.data : [];

      if (existingItems.length > 0) {
        const stockId = existingItems[0].id;
        await this.strapiClient.updateProductStock(stockId, stockData);
        this.logger.debug(
          `🔍 Updated stock record: ${wcVariation.stock_quantity} units for variation ${variationId}`
        );
        return { updated: true, id: stockId };
      }

      const result = await this.strapiClient.createProductStock(stockData);
      this.logger.debug(
        `🔍 Created stock record: ${wcVariation.stock_quantity} units for variation ${variationId}`
      );
      return { created: true, id: result.data.id };
    } catch (error) {
      this.logger.error(
        `??O Failed to sync stock for variation ${variationId}:`,
        error.message
      );
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
        const existing = await this.strapiClient.get('/product-variations', {
          'filters[SKU][$eq]': uniqueSKU,
          'pagination[pageSize]': 1
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
    if (!price || price === '0' || price === '') {
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
      `📊 Duplicate tracking: ${trackingStats.variations?.total || 0} variations tracked`
    );
  }

  /**
   * Get import statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

module.exports = VariationImporter;
