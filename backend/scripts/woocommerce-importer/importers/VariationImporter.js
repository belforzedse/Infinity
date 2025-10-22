const { WooCommerceClient, StrapiClient } = require('../utils/ApiClient');
const DuplicateTracker = require('../utils/DuplicateTracker');

/**
 * Variation Importer - Handles importing WooCommerce product variations to Strapi
 * 
 * Features:
 * - Product variation data transformation
 * - Color/Size/Model attribute mapping
 * - Stock management and logging
 * - SKU generation and validation
 * - Price conversion (IRT to internal format)
 * - Duplicate prevention
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
    this.logger.info(`🎨 Starting variation import (limit: ${limit}, page: ${page}, dryRun: ${dryRun}, onlyImported: ${onlyImported})`);
    
    try {
      // Pre-load mappings for faster lookups
      await this.loadMappingCaches();
      
      // Load progress state
      const progressState = this.loadProgressState();
      let currentPage = Math.max(page, progressState.lastCompletedPage + 1);
      let totalProcessed = progressState.totalProcessed;
      
      this.logger.info(`📊 Resuming from page ${currentPage} (${totalProcessed} variations already processed)`);
      
      // Process variations incrementally page by page
      let hasMorePages = true;
      let processedInThisSession = 0;
      
      while (hasMorePages && processedInThisSession < limit) {
        const remainingLimit = limit - processedInThisSession;
        const perPage = Math.min(this.config.import.batchSizes.products, remainingLimit);
        
        this.logger.info(`📄 Processing page ${currentPage} for variable products...`);
        
        // Fetch variable products from current page
        const result = await this.wooClient.getProducts(currentPage, perPage);
        
        if (!result.data || result.data.length === 0) {
          this.logger.info(`📄 No more products found on page ${currentPage}`);
          hasMorePages = false;
          break;
        }
        
        // Filter only variable products
        let variableProducts = result.data.filter(product => 
          product.type === 'variable' && product.variations && product.variations.length > 0
        );

        // If onlyImported flag is set, filter for products that are already imported
        if (onlyImported) {
          const originalCount = variableProducts.length;
          variableProducts = variableProducts.filter(product => 
            this.productMappingCache.has(product.id)
          );
          
          if (originalCount > variableProducts.length) {
            this.logger.debug(`🔍 Filtered ${originalCount - variableProducts.length} non-imported products`);
          }
        }
        
        if (variableProducts.length === 0) {
          this.logger.debug(`📄 No variable products found on page ${currentPage}, skipping...`);
          currentPage++;
          continue;
        }
        
        // Process variations from these products immediately
        this.logger.info(`🔄 Processing variations from ${variableProducts.length} variable products on page ${currentPage}...`);
        
        for (const product of variableProducts) {
          try {
            // Fetch variations for this product and process them immediately
            const variationResult = await this.wooClient.getProductVariations(product.id, 1, 100);
            
            if (variationResult.data && variationResult.data.length > 0) {
              for (const variation of variationResult.data) {
                // Add parent product info to variation
                variation._parentProduct = product;
                
                try {
                  await this.importSingleVariation(variation, dryRun);
                  totalProcessed++;
                  processedInThisSession++;
                  this.stats.total = totalProcessed;
                  
                  // Save progress after each successful import
                  this.saveProgressState({
                    lastCompletedPage: currentPage,
                    totalProcessed: totalProcessed,
                    lastProcessedAt: new Date().toISOString()
                  });
                  
                  if (totalProcessed % this.config.logging.progressInterval === 0) {
                    this.logger.info(`📈 Progress: ${totalProcessed} variations processed, current page: ${currentPage}`);
                  }
                  
                  if (processedInThisSession >= limit) {
                    this.logger.info(`📊 Reached session limit of ${limit} variations`);
                    break;
                  }
                  
                } catch (error) {
                  this.stats.errors++;
                  this.logger.error(`❌ Failed to import variation ${variation.id}:`, error.message);
                  
                  if (!this.config.errorHandling.continueOnError) {
                    throw error;
                  }
                }
              }
            }
            
            if (processedInThisSession >= limit) break;
            
          } catch (error) {
            this.logger.error(`❌ Failed to fetch variations for product ${product.id}:`, error.message);
          }
        }
        
        this.logger.success(`✅ Completed page ${currentPage}: processed variations from ${variableProducts.length} products`);
        currentPage++;
        
        // Check if we've reached the total pages or our limit
        if (result.totalPages && currentPage > result.totalPages) {
          hasMorePages = false;
        }
        
        if (processedInThisSession >= limit) {
          this.logger.info(`📊 Reached session limit of ${limit} variations`);
          break;
        }
      }
      
      this.logger.success(`🎉 Import session completed: ${processedInThisSession} variations processed in this session`);
      
    } catch (error) {
      this.stats.errors++;
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
    
    // Load product mappings
    const productMappings = this.duplicateTracker.getAllMappings('products');
    for (const [wcId, mapping] of Object.entries(productMappings)) {
      this.productMappingCache.set(parseInt(wcId), mapping.strapiId);
    }
    
    this.logger.info(`📂 Loaded ${this.productMappingCache.size} product mappings`);
  }

  /**
   * Load progress state from file
   */
  loadProgressState() {
    const progressFile = `${this.config.duplicateTracking.storageDir}/variation-import-progress.json`;
    
    try {
      if (require('fs').existsSync(progressFile)) {
        const data = JSON.parse(require('fs').readFileSync(progressFile, 'utf8'));
        this.logger.debug(`📂 Loaded progress state: page ${data.lastCompletedPage}, ${data.totalProcessed} processed`);
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
    const progressFile = `${this.config.duplicateTracking.storageDir}/variation-import-progress.json`;
    
    try {
      require('fs').writeFileSync(progressFile, JSON.stringify(state, null, 2));
    } catch (error) {
      this.logger.error(`❌ Failed to save progress state: ${error.message}`);
    }
  }

  /**
   * Reset progress state (useful for starting fresh)
   */
  resetProgressState() {
    const progressFile = `${this.config.duplicateTracking.storageDir}/variation-import-progress.json`;
    
    try {
      if (require('fs').existsSync(progressFile)) {
        require('fs').unlinkSync(progressFile);
        this.logger.info(`🧹 Reset variation import progress state`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to reset progress state: ${error.message}`);
    }
  }

  /**
   * Import a single variation
   */
  async importSingleVariation(wcVariation, dryRun = false) {
    this.logger.debug(`dYZ" Processing variation: ${wcVariation.id} - ${wcVariation._parentProduct.name}`);

    const existingMapping = this.duplicateTracker.getStrapiId('variations', wcVariation.id);
    const existingStrapiId = existingMapping?.strapiId;

    try {
      const strapiVariation = await this.transformVariation(wcVariation);

      if (dryRun) {
        const mode = existingStrapiId ? 'update' : 'create';
        this.logger.info(`dY"? [DRY RUN] Would ${mode} variation: ${wcVariation.id}`);
        this.stats.success++;
        if (existingStrapiId) {
          this.stats.updated++;
        }
        return { isDryRun: true, mode, data: strapiVariation };
      }

      await this.createVariationAttributes(wcVariation, strapiVariation);

      let variationId = existingStrapiId;
      let mode = 'create';

      if (existingStrapiId) {
        await this.strapiClient.updateProductVariation(existingStrapiId, strapiVariation);
        mode = 'update';
        this.stats.variationsUpdated++;
        this.logger.success(`dYZ" Updated variation: ${wcVariation.id} ? ${existingStrapiId}`);
      } else {
        const result = await this.strapiClient.createProductVariation(strapiVariation);
        variationId = result.data.id;
        this.stats.variationsCreated++;
        this.logger.success(`?o. Created variation: ${wcVariation.id} ?+' ID: ${variationId}`);
      }

      if (wcVariation.manage_stock && wcVariation.stock_quantity !== null) {
        const stockResult = await this.createProductStock(variationId, wcVariation);
        if (stockResult?.created) {
          this.stats.stocksCreated++;
        } else if (stockResult?.updated) {
          this.stats.stocksUpdated++;
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

      this.stats.success++;
      if (mode === 'update') {
        this.stats.updated++;
      }

      return { mode, strapiId: variationId };
    } catch (error) {
      this.stats.failed++;
      this.logger.error(`??O Failed to upsert variation ${wcVariation.id}:`, error.message);
      throw error;
    }
  }


  /**
   * Transform WooCommerce variation to Strapi format
   */
  async transformVariation(wcVariation) {
    // Generate SKU if not provided
    let sku = wcVariation.sku || this.generateSKU(wcVariation);

    // Ensure SKU uniqueness
    sku = await this.ensureUniqueSKU(sku);

    // Initialize variation object
    const strapiVariation = {
      SKU: sku,
      IsPublished: wcVariation.status === 'publish',
      // Store WooCommerce ID for reference
      external_id: wcVariation.id.toString(),
      external_source: 'woocommerce'
    };

    // Handle sale price / discount pricing
    const regularPrice = parseFloat(wcVariation.regular_price || wcVariation.price || 0);
    const salePrice = parseFloat(wcVariation.sale_price || 0);

    // If sale price exists and is less than regular price, add discount
    if (salePrice > 0 && salePrice < regularPrice) {
      strapiVariation.Price = this.convertPrice(regularPrice);
      strapiVariation.DiscountPrice = this.convertPrice(salePrice);
      this.logger.debug(`💰 Variation ${wcVariation.id}: Regular price ${regularPrice}, Discount price ${salePrice}`);
    } else {
      // No valid discount, use the standard price
      strapiVariation.Price = this.convertPrice(wcVariation.price || wcVariation.regular_price);
    }

    // Link to parent product
    const parentProductStrapiId = this.productMappingCache.get(wcVariation._parentProduct.id);
    if (parentProductStrapiId) {
      strapiVariation.product = parentProductStrapiId;
      this.logger.debug(`🔗 Linked variation to product ID: ${parentProductStrapiId}`);
    } else {
      throw new Error(`Parent product ${wcVariation._parentProduct.id} not found in mappings`);
    }

    this.logger.debug(`🔄 Transformed variation: ${wcVariation.id} → SKU: ${sku}`);
    return strapiVariation;
  }

  /**
   * Create variation attributes (color, size, model)
   */
  async createVariationAttributes(wcVariation, strapiVariation) {
    // Track which attribute types are present in WooCommerce data
    const presentAttributes = new Set();
    
    // Process existing WooCommerce attributes
    if (wcVariation.attributes && wcVariation.attributes.length > 0) {
      for (const attribute of wcVariation.attributes) {
        try {
          const attributeType = this.identifyAttributeType(attribute.name);
          presentAttributes.add(attributeType);
          
          const strapiId = await this.createOrGetAttribute(attributeType, attribute.option);
          
          if (strapiId) {
            // Link the attribute to the variation
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
            }
            
            this.logger.debug(`🎨 Linked ${attributeType}: ${attribute.option} → ID: ${strapiId}`);
          }
        } catch (error) {
          this.logger.error(`❌ Failed to create attribute ${attribute.name}:`, error.message);
        }
      }
    }

    // Add default attributes for missing types
    await this.addDefaultAttributes(strapiVariation, presentAttributes, wcVariation.id);
  }

  /**
   * Add default attributes for types not present in WooCommerce data
   */
  async addDefaultAttributes(strapiVariation, presentAttributes, variationId) {
    const defaultAttrs = this.config.import.defaults.variationAttributes;
    
    // Add default color if not present
    if (!presentAttributes.has('color') && !strapiVariation.product_variation_color) {
      try {
        const defaultColorId = await this.createOrGetAttribute('color', defaultAttrs.color.title, defaultAttrs.color.colorCode);
        if (defaultColorId) {
          strapiVariation.product_variation_color = defaultColorId;
          this.logger.info(`🎨 Variation ${variationId}: Added default color "${defaultAttrs.color.title}" → ID: ${defaultColorId}`);
        }
      } catch (error) {
        this.logger.error(`❌ Failed to create default color attribute:`, error.message);
      }
    }

    // Add default size if not present
    if (!presentAttributes.has('size') && !strapiVariation.product_variation_size) {
      try {
        const defaultSizeId = await this.createOrGetAttribute('size', defaultAttrs.size.title);
        if (defaultSizeId) {
          strapiVariation.product_variation_size = defaultSizeId;
          this.logger.info(`📏 Variation ${variationId}: Added default size "${defaultAttrs.size.title}" → ID: ${defaultSizeId}`);
        }
      } catch (error) {
        this.logger.error(`❌ Failed to create default size attribute:`, error.message);
      }
    }

    // Add default model if not present
    if (!presentAttributes.has('model') && !strapiVariation.product_variation_model) {
      try {
        const defaultModelId = await this.createOrGetAttribute('model', defaultAttrs.model.title);
        if (defaultModelId) {
          strapiVariation.product_variation_model = defaultModelId;
          this.logger.info(`🏷️ Variation ${variationId}: Added default model "${defaultAttrs.model.title}" → ID: ${defaultModelId}`);
        }
      } catch (error) {
        this.logger.error(`❌ Failed to create default model attribute:`, error.message);
      }
    }
  }

  /**
   * Identify attribute type based on name
   */
  identifyAttributeType(attributeName) {
    const name = attributeName.toLowerCase();
    
    // Persian and English color keywords
    if (name.includes('رنگ') || name.includes('color') || name.includes('colour')) {
      return 'color';
    }
    
    // Persian and English size keywords
    if (name.includes('سایز') || name.includes('اندازه') || name.includes('size')) {
      return 'size';
    }
    
    // Default to model for other attributes
    return 'model';
  }

  /**
   * Create or get existing attribute
   */
  async createOrGetAttribute(type, value, customColorCode = null) {
    const cacheKey = `${type}:${value}`;
    const cache = this.getCacheForType(type);
    
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    
    try {
      let result;
      const attributeData = { 
        Title: value,
        external_id: `${type}_${value.toLowerCase().replace(/\s+/g, '_')}`,
        external_source: 'woocommerce'
      };
      
      // Add color code for colors
      if (type === 'color') {
        attributeData.ColorCode = customColorCode || this.generateColorCode(value);
      }
      
      switch (type) {
        case 'color':
          result = await this.strapiClient.createVariationColor(attributeData);
          break;
        case 'size':
          result = await this.strapiClient.createVariationSize(attributeData);
          break;
        case 'model':
          result = await this.strapiClient.createVariationModel(attributeData);
          break;
      }
      
      if (result && result.data) {
        cache.set(cacheKey, result.data.id);
        this.stats.attributesCreated++;
        this.logger.debug(`✅ Created ${type} attribute: ${value} → ID: ${result.data.id}`);
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
      case 'color': return this.colorMappingCache;
      case 'size': return this.sizeMappingCache;
      case 'model': return this.modelMappingCache;
      default: return new Map();
    }
  }

  /**
   * Generate unique color code from color name using hash-based approach
   * This ensures every color name gets a unique, consistent color code
   */
  generateColorCode(colorName) {
    // Create a hash from the color name
    let hash = 0;
    const normalizedName = colorName.toLowerCase().trim();
    
    for (let i = 0; i < normalizedName.length; i++) {
      const char = normalizedName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Use different parts of the hash for RGB components
    const r = Math.abs(hash) % 256;
    const g = Math.abs(hash >> 8) % 256;
    const b = Math.abs(hash >> 16) % 256;
    
    // Ensure the color is not too dark or too light for visibility
    const adjustedR = Math.max(50, Math.min(205, r));
    const adjustedG = Math.max(50, Math.min(205, g));
    const adjustedB = Math.max(50, Math.min(205, b));
    
    // Convert to hex
    const toHex = (val) => {
      const hex = val.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
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
      const existing = await this.strapiClient.findByExternalId('/product-stocks', stockData.external_id);
      const existingItems = Array.isArray(existing?.data) ? existing.data : [];

      if (existingItems.length > 0) {
        const stockId = existingItems[0].id;
        await this.strapiClient.updateProductStock(stockId, stockData);
        this.logger.debug(`dY"? Updated stock record: ${wcVariation.stock_quantity} units for variation ${variationId}`);
        return { updated: true, id: stockId };
      }

      const result = await this.strapiClient.createProductStock(stockData);
      this.logger.debug(`dY"? Created stock record: ${wcVariation.stock_quantity} units for variation ${variationId}`);
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
    
    // Simple SKU generation - customize as needed
    return `WC-${productId}-${variationId}`;
  }

  /**
   * Ensure SKU uniqueness (placeholder - would check against existing SKUs)
   */
  async ensureUniqueSKU(sku) {
    // TODO: Check against existing SKUs in Strapi and modify if duplicate
    return sku;
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
    
    // Return as number for biginteger fields, handle large values properly
    return Math.round(numPrice * multiplier);
  }

  /**
   * Log final import statistics
   */
  logFinalStats() {
    this.logger.success(`🎉 Variation import completed!`);
    this.logger.logStats(this.stats);
    this.logger.info(`dY"S Additional stats:`);
    this.logger.info(`   Variations created: ${this.stats.variationsCreated}`);
    this.logger.info(`   Variations updated: ${this.stats.variationsUpdated}`);
    this.logger.info(`   Stock records created: ${this.stats.stocksCreated}`);
    this.logger.info(`   Stock records updated: ${this.stats.stocksUpdated}`);
    this.logger.info(`   Attributes created: ${this.stats.attributesCreated}`);
    
    // Log duplicate tracking stats
    const trackingStats = this.duplicateTracker.getStats();
    this.logger.info(`📊 Duplicate tracking: ${trackingStats.variations?.total || 0} variations tracked`);
  }

  /**
   * Get import statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

module.exports = VariationImporter; 




