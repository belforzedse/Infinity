const { WooCommerceClient, StrapiClient } = require('../utils/ApiClient');
const DuplicateTracker = require('../utils/DuplicateTracker');

/**
 * Product Importer - Handles importing WooCommerce products to Strapi
 * 
 * Features:
 * - Product data transformation
 * - Category relationship mapping
 * - Image import and linking
 * - Attribute processing for variations
 * - Duplicate prevention
 */
class ProductImporter {
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
      endTime: null
    };

    // Cache for category mappings to avoid repeated lookups
    this.categoryMappingCache = new Map();
  }

  /**
   * Main import method
   */
  async import(options = {}) {
    const { limit = 50, page = 1, dryRun = false } = options;
    
    this.stats.startTime = Date.now();
    this.logger.info(`🛍️ Starting product import (limit: ${limit}, page: ${page}, dryRun: ${dryRun})`);
    
    try {
      // Pre-load category mappings for faster lookups
      await this.loadCategoryMappings();
      
      // Get all products from WooCommerce
      const allProducts = await this.fetchAllProducts(limit, page);
      this.stats.total = allProducts.length;
      
      if (allProducts.length === 0) {
        this.logger.warn('📭 No products found to import');
        return this.stats;
      }
      
      this.logger.info(`📊 Found ${allProducts.length} products to process`);
      
      // Start progress tracking
      this.logger.startProgress(allProducts.length, 'Importing products');
      
      // Import products
      for (const wcProduct of allProducts) {
        try {
          await this.importSingleProduct(wcProduct, dryRun);
          this.logger.updateProgress();
        } catch (error) {
          this.stats.errors++;
          this.logger.error(`❌ Failed to import product ${wcProduct.id} (${wcProduct.name}):`, error.message);
          
          if (!this.config.errorHandling.continueOnError) {
            throw error;
          }
        }
      }
      
      this.logger.completeProgress();
      
    } catch (error) {
      this.stats.errors++;
      this.logger.error('❌ Product import failed:', error);
      throw error;
    } finally {
      this.stats.endTime = Date.now();
      this.stats.duration = this.stats.endTime - this.stats.startTime;
      this.logFinalStats();
    }
    
    return this.stats;
  }

  /**
   * Load category mappings into cache
   */
  async loadCategoryMappings() {
    this.logger.debug('📂 Loading category mappings...');
    const categoryMappings = this.duplicateTracker.getAllMappings('categories');
    
    for (const [wcId, mapping] of Object.entries(categoryMappings)) {
      this.categoryMappingCache.set(parseInt(wcId), mapping.strapiId);
    }
    
    this.logger.info(`📂 Loaded ${this.categoryMappingCache.size} category mappings`);
  }

  /**
   * Fetch all products from WooCommerce with pagination
   */
  async fetchAllProducts(limit, startPage) {
    let allProducts = [];
    let currentPage = startPage;
    let totalFetched = 0;
    
    this.logger.info(`📥 Fetching products from WooCommerce...`);
    
    while (totalFetched < limit) {
      const remainingLimit = limit - totalFetched;
      const perPage = Math.min(this.config.import.batchSizes.products, remainingLimit);
      
      this.logger.debug(`Fetching page ${currentPage} (${perPage} items)`);
      
      const result = await this.wooClient.getProducts(currentPage, perPage);
      
      if (!result.data || result.data.length === 0) {
        this.logger.info(`📄 No more products found on page ${currentPage}`);
        break;
      }
      
      allProducts = allProducts.concat(result.data);
      totalFetched += result.data.length;
      currentPage++;
      
      this.logger.debug(`📊 Fetched ${result.data.length} products (total: ${totalFetched})`);
      
      if (currentPage > result.totalPages) {
        break;
      }
    }
    
    this.logger.info(`✅ Fetched ${allProducts.length} products from WooCommerce`);
    return allProducts;
  }

  /**
   * Import a single product
   */
  async importSingleProduct(wcProduct, dryRun = false) {
    this.logger.debug(`📦 Processing product: ${wcProduct.id} - ${wcProduct.name}`);
    
    // Check for duplicates
    const duplicateCheck = this.duplicateTracker.checkDuplicate('products', wcProduct);
    if (duplicateCheck.isDuplicate) {
      this.stats.skipped++;
      return duplicateCheck;
    }
    
    try {
      // Transform WooCommerce product to Strapi format
      const strapiProduct = await this.transformProduct(wcProduct);
      
      if (dryRun) {
        this.logger.info(`🔍 [DRY RUN] Would import product: ${wcProduct.name}`);
        this.stats.success++;
        return { isDryRun: true, data: strapiProduct };
      }
      
      // Create product in Strapi
      const result = await this.strapiClient.createProduct(strapiProduct);
      
      // Handle images if present
      if (wcProduct.images && wcProduct.images.length > 0) {
        await this.handleProductImages(result.data.id, wcProduct.images);
      }
      
      // Record the mapping
      this.duplicateTracker.recordMapping(
        'products',
        wcProduct.id,
        result.data.id,
        {
          name: wcProduct.name,
          slug: wcProduct.slug,
          type: wcProduct.type,
          status: wcProduct.status
        }
      );
      
      this.stats.success++;
      this.logger.debug(`✅ Created product: ${wcProduct.name} → ID: ${result.data.id}`);
      
      return result;
      
    } catch (error) {
      this.stats.failed++;
      this.logger.error(`❌ Failed to create product ${wcProduct.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Transform WooCommerce product to Strapi format
   */
  async transformProduct(wcProduct) {
    const strapiProduct = {
      Title: wcProduct.name,
      Description: this.cleanHtmlContent(wcProduct.description),
      Status: this.mapProductStatus(wcProduct.status),
      AverageRating: wcProduct.average_rating ? parseFloat(wcProduct.average_rating) : null,
      RatingCount: wcProduct.rating_count || 0,
      // Store WooCommerce ID for reference
      external_id: wcProduct.id.toString(),
      external_source: 'woocommerce'
    };

    // Handle short description as cleaning tips or return conditions
    if (wcProduct.short_description && wcProduct.short_description.trim()) {
      const cleanShortDesc = this.cleanHtmlContent(wcProduct.short_description);
      // Try to categorize the short description
      if (this.isCleaningInstructions(cleanShortDesc)) {
        strapiProduct.CleaningTips = cleanShortDesc;
      } else {
        strapiProduct.ReturnConditions = cleanShortDesc;
      }
    }

    // Handle main category relationship
    if (wcProduct.categories && wcProduct.categories.length > 0) {
      const mainCategory = wcProduct.categories[0];
      const mainCategoryStrapiId = this.categoryMappingCache.get(mainCategory.id);
      
      if (mainCategoryStrapiId) {
        strapiProduct.product_main_category = mainCategoryStrapiId;
        this.logger.debug(`🔗 Linked product ${wcProduct.name} to main category ID: ${mainCategoryStrapiId}`);
      } else {
        this.logger.warn(`⚠️ Main category ${mainCategory.id} not found for product ${wcProduct.name}`);
      }
    }

    // Store additional category relationships for later processing
    if (wcProduct.categories && wcProduct.categories.length > 1) {
      strapiProduct._additionalCategories = wcProduct.categories.slice(1).map(cat => {
        const strapiId = this.categoryMappingCache.get(cat.id);
        return strapiId ? { id: strapiId } : null;
      }).filter(Boolean);
    }

    // Handle cover image
    if (wcProduct.images && wcProduct.images.length > 0) {
      // We'll handle image upload separately after product creation
      strapiProduct._coverImageUrl = wcProduct.images[0].src;
      strapiProduct._additionalImages = wcProduct.images.slice(1);
    }

    // Store variation information for processing
    if (wcProduct.variations && wcProduct.variations.length > 0) {
      strapiProduct._variationIds = wcProduct.variations;
    }

    // Store attributes for variation processing
    if (wcProduct.attributes && wcProduct.attributes.length > 0) {
      strapiProduct._attributes = wcProduct.attributes;
    }

    this.logger.debug(`🔄 Transformed product: ${wcProduct.name}`);
    return strapiProduct;
  }

  /**
   * Handle product images (placeholder - would need actual image upload logic)
   */
  async handleProductImages(productId, images) {
    // Note: This is a placeholder. In a real implementation, you would:
    // 1. Download images from WooCommerce URLs
    // 2. Upload them to Strapi's media library
    // 3. Link them to the product
    
    this.logger.debug(`📸 Would process ${images.length} images for product ${productId}`);
    
    for (const image of images) {
      this.logger.debug(`📸 Image: ${image.src} (${image.alt || 'No alt text'})`);
    }
    
    // TODO: Implement actual image upload logic
    return null;
  }

  /**
   * Map WooCommerce product status to Strapi status
   */
  mapProductStatus(wcStatus) {
    const mapping = this.config.import.statusMappings.product;
    return mapping[wcStatus] || this.config.import.defaults.productStatus;
  }

  /**
   * Clean HTML content for plain text fields
   */
  cleanHtmlContent(htmlContent) {
    if (!htmlContent || typeof htmlContent !== 'string') {
      return '';
    }
    
    // Basic HTML tag removal - in production, use a proper HTML parser
    return htmlContent
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')  // Replace &nbsp; with space
      .replace(/&amp;/g, '&')   // Replace &amp; with &
      .replace(/&lt;/g, '<')    // Replace &lt; with <
      .replace(/&gt;/g, '>')    // Replace &gt; with >
      .replace(/&quot;/g, '"')  // Replace &quot; with "
      .trim();
  }

  /**
   * Determine if content is cleaning instructions
   */
  isCleaningInstructions(content) {
    const cleaningKeywords = ['شستشو', 'پاک', 'تمیز', 'washing', 'clean', 'care', 'جنس'];
    return cleaningKeywords.some(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Log final import statistics
   */
  logFinalStats() {
    this.logger.success(`🎉 Product import completed!`);
    this.logger.logStats(this.stats);
    
    // Log duplicate tracking stats
    const trackingStats = this.duplicateTracker.getStats();
    this.logger.info(`📊 Duplicate tracking: ${trackingStats.products?.total || 0} products tracked`);
  }

  /**
   * Get import statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

module.exports = ProductImporter; 