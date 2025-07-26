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
      skipped: 0,
      failed: 0,
      errors: 0,
      startTime: null,
      endTime: null,
      variationsCreated: 0,
      stocksCreated: 0,
      attributesCreated: 0
    };

    // Caches for faster lookups
    this.productMappingCache = new Map();
    this.colorMappingCache = new Map();
    this.sizeMappingCache = new Map();
    this.modelMappingCache = new Map();
  }

  /**
   * Main import method
   */
  async import(options = {}) {
    const { limit = 100, page = 1, dryRun = false } = options;
    
    this.stats.startTime = Date.now();
    this.logger.info(`🎨 Starting variation import (limit: ${limit}, page: ${page}, dryRun: ${dryRun})`);
    
    try {
      // Pre-load mappings for faster lookups
      await this.loadMappingCaches();
      
      // Get all variable products to extract variations
      const variableProducts = await this.fetchVariableProducts(limit, page);
      
      if (variableProducts.length === 0) {
        this.logger.warn('📭 No variable products found for variation import');
        return this.stats;
      }
      
      // Extract all variations from variable products
      const allVariations = await this.extractAllVariations(variableProducts);
      this.stats.total = allVariations.length;
      
      if (allVariations.length === 0) {
        this.logger.warn('📭 No variations found to import');
        return this.stats;
      }
      
      this.logger.info(`📊 Found ${allVariations.length} variations to process`);
      
      // Start progress tracking
      this.logger.startProgress(allVariations.length, 'Importing variations');
      
      // Import variations
      for (const variation of allVariations) {
        try {
          await this.importSingleVariation(variation, dryRun);
          this.logger.updateProgress();
        } catch (error) {
          this.stats.errors++;
          this.logger.error(`❌ Failed to import variation ${variation.id}:`, error.message);
          
          if (!this.config.errorHandling.continueOnError) {
            throw error;
          }
        }
      }
      
      this.logger.completeProgress();
      
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
   * Fetch variable products from WooCommerce
   */
  async fetchVariableProducts(limit, startPage) {
    let allProducts = [];
    let currentPage = startPage;
    let totalFetched = 0;
    
    this.logger.info(`📥 Fetching variable products from WooCommerce...`);
    
    while (totalFetched < limit) {
      const remainingLimit = limit - totalFetched;
      const perPage = Math.min(this.config.import.batchSizes.products, remainingLimit);
      
      this.logger.debug(`Fetching page ${currentPage} (${perPage} items)`);
      
      const result = await this.wooClient.getProducts(currentPage, perPage);
      
      if (!result.data || result.data.length === 0) {
        this.logger.info(`📄 No more products found on page ${currentPage}`);
        break;
      }
      
      // Filter only variable products
      const variableProducts = result.data.filter(product => 
        product.type === 'variable' && product.variations && product.variations.length > 0
      );
      
      allProducts = allProducts.concat(variableProducts);
      totalFetched += result.data.length;
      currentPage++;
      
      if (currentPage > result.totalPages) {
        break;
      }
    }
    
    this.logger.info(`✅ Found ${allProducts.length} variable products with variations`);
    return allProducts;
  }

  /**
   * Extract all variations from variable products
   */
  async extractAllVariations(variableProducts) {
    let allVariations = [];
    
    this.logger.info(`🔍 Extracting variations from ${variableProducts.length} variable products...`);
    
    for (const product of variableProducts) {
      try {
        this.logger.debug(`📦 Processing variations for product: ${product.name} (${product.variations.length} variations)`);
        
        // Fetch variations for this product
        const result = await this.wooClient.getProductVariations(product.id, 1, 100);
        
        if (result.data && result.data.length > 0) {
          // Add parent product info to each variation
          const variationsWithProduct = result.data.map(variation => ({
            ...variation,
            _parentProduct: product
          }));
          
          allVariations = allVariations.concat(variationsWithProduct);
          this.logger.debug(`✅ Extracted ${result.data.length} variations from ${product.name}`);
        }
      } catch (error) {
        this.logger.error(`❌ Failed to fetch variations for product ${product.id}:`, error.message);
      }
    }
    
    this.logger.info(`✅ Extracted ${allVariations.length} total variations`);
    return allVariations;
  }

  /**
   * Import a single variation
   */
  async importSingleVariation(wcVariation, dryRun = false) {
    this.logger.debug(`🎨 Processing variation: ${wcVariation.id} - ${wcVariation._parentProduct.name}`);
    
    // Check for duplicates
    const duplicateCheck = this.duplicateTracker.checkDuplicate('variations', wcVariation);
    if (duplicateCheck.isDuplicate) {
      this.stats.skipped++;
      return duplicateCheck;
    }
    
    try {
      // Transform variation to Strapi format
      const strapiVariation = await this.transformVariation(wcVariation);
      
      if (dryRun) {
        this.logger.info(`🔍 [DRY RUN] Would import variation: ${wcVariation.id}`);
        this.stats.success++;
        return { isDryRun: true, data: strapiVariation };
      }
      
      // Create variation attributes first (color, size, model)
      await this.createVariationAttributes(wcVariation, strapiVariation);
      
      // Create the variation in Strapi
      const result = await this.strapiClient.createProductVariation(strapiVariation);
      
      // Create stock record
      if (wcVariation.manage_stock && wcVariation.stock_quantity !== null) {
        await this.createProductStock(result.data.id, wcVariation);
        this.stats.stocksCreated++;
      }
      
      // Record the mapping
      this.duplicateTracker.recordMapping(
        'variations',
        wcVariation.id,
        result.data.id,
        {
          productId: wcVariation._parentProduct.id,
          sku: wcVariation.sku,
          price: wcVariation.price,
          stockQuantity: wcVariation.stock_quantity
        }
      );
      
      this.stats.success++;
      this.stats.variationsCreated++;
      this.logger.debug(`✅ Created variation: ${wcVariation.id} → ID: ${result.data.id}`);
      
      return result;
      
    } catch (error) {
      this.stats.failed++;
      this.logger.error(`❌ Failed to create variation ${wcVariation.id}:`, error.message);
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
    
    const strapiVariation = {
      SKU: sku,
      Price: this.convertPrice(wcVariation.price || wcVariation.regular_price),
      IsPublished: wcVariation.status === 'publish',
      // Store WooCommerce ID for reference
      external_id: wcVariation.id.toString(),
      external_source: 'woocommerce'
    };

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
    if (!wcVariation.attributes || wcVariation.attributes.length === 0) {
      return;
    }

    for (const attribute of wcVariation.attributes) {
      try {
        const attributeType = this.identifyAttributeType(attribute.name);
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
  async createOrGetAttribute(type, value) {
    const cacheKey = `${type}:${value}`;
    const cache = this.getCacheForType(type);
    
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    
    try {
      let result;
      const attributeData = { Title: value };
      
      // Add color code for colors
      if (type === 'color') {
        attributeData.ColorCode = this.generateColorCode(value);
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
   * Generate color code from color name
   */
  generateColorCode(colorName) {
    // Basic color mapping - extend as needed
    const colorMap = {
      'قرمز': '#FF0000',
      'آبی': '#0000FF',
      'سبز': '#00FF00',
      'زرد': '#FFFF00',
      'سیاه': '#000000',
      'سفید': '#FFFFFF',
      'نسکافه ای': '#6B4226',
      'طوسی': '#808080',
      'صورتی': '#FFC0CB',
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#00FF00',
      'yellow': '#FFFF00',
      'black': '#000000',
      'white': '#FFFFFF'
    };
    
    return colorMap[colorName.toLowerCase()] || '#CCCCCC'; // Default gray
  }

  /**
   * Create product stock record
   */
  async createProductStock(variationId, wcVariation) {
    const stockData = {
      Count: Math.max(0, wcVariation.stock_quantity || 0),
      product_variation: variationId,
      external_id: `stock_${wcVariation.id}`,
      external_source: 'woocommerce'
    };
    
    try {
      const result = await this.strapiClient.createProductStock(stockData);
      this.logger.debug(`📦 Created stock record: ${wcVariation.stock_quantity} units for variation ${variationId}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Failed to create stock for variation ${variationId}:`, error.message);
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
      return '0';
    }
    
    const numPrice = parseInt(price);
    const multiplier = this.config.import.currency.multiplier || 1;
    
    return (numPrice * multiplier).toString();
  }

  /**
   * Log final import statistics
   */
  logFinalStats() {
    this.logger.success(`🎉 Variation import completed!`);
    this.logger.logStats(this.stats);
    this.logger.info(`📊 Additional stats:`);
    this.logger.info(`   Variations created: ${this.stats.variationsCreated}`);
    this.logger.info(`   Stock records created: ${this.stats.stocksCreated}`);
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