const { WooCommerceClient, StrapiClient } = require('../utils/ApiClient');
const DuplicateTracker = require('../utils/DuplicateTracker');
const ImageUploader = require('../utils/ImageUploader');

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
    this.imageUploader = new ImageUploader(config, logger);
    
    // Import statistics
    this.stats = {
      total: 0,
      success: 0,
      updated: 0,
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
   * Main import method - Optimized for incremental processing
   * Supports optional category filtering
   */
  async import(options = {}) {
    const { limit = 50, page = 1, dryRun = false, categoryIds = [] } = options;

    this.stats.startTime = Date.now();

    // Determine categories to import
    let categoriesToProcess = categoryIds;
    if (!categoriesToProcess || categoriesToProcess.length === 0) {
      // If no specific categories provided, import all products
      categoriesToProcess = [null];
      this.logger.info(`🛍️ Starting product import (all categories, limit: ${limit}, page: ${page}, dryRun: ${dryRun})`);
    } else {
      this.logger.info(`🛍️ Starting product import from categories: [${categoriesToProcess.join(', ')}] (limit: ${limit}, page: ${page}, dryRun: ${dryRun})`);
    }

    try {
      // Pre-load category mappings for faster lookups
      await this.loadCategoryMappings();

      // Track processed product IDs to avoid duplicates across categories
      const processedProductIds = new Set();

      // Process each category
      for (const categoryId of categoriesToProcess) {
        const progressKey = categoryId ? `product-import-progress-cat-${categoryId}.json` : 'product-import-progress.json';

        // Load progress state for this category
        const progressState = this.loadProgressState(progressKey);
        let currentPage = Math.max(page, progressState.lastCompletedPage + 1);
        let totalProcessed = progressState.totalProcessed;

        const categoryLabel = categoryId ? `category ${categoryId}` : 'all categories';
        this.logger.info(`📊 Resuming ${categoryLabel} from page ${currentPage} (${totalProcessed} products already processed)`);

        // Process products incrementally page by page for this category
        let hasMorePages = true;
        let processedInThisSession = 0;

        while (hasMorePages && processedInThisSession < limit) {
          const remainingLimit = limit - processedInThisSession;
          const perPage = Math.min(this.config.import.batchSizes.products, remainingLimit);

          this.logger.info(`📄 Processing page ${currentPage} from ${categoryLabel} (requesting ${perPage} items)...`);

          // Fetch current page with optional category filter
          const result = await this.wooClient.getProducts(currentPage, perPage, categoryId);

          if (!result.data || result.data.length === 0) {
            this.logger.info(`📄 No more products found on page ${currentPage} for ${categoryLabel}`);
            hasMorePages = false;
            break;
          }

          // Process products from this page immediately
          this.logger.info(`🔄 Processing ${result.data.length} products from page ${currentPage}...`);

          for (const wcProduct of result.data) {
            try {
              // Skip if already processed in another category
              if (processedProductIds.has(wcProduct.id)) {
                this.logger.debug(`⏭️ Skipping product ${wcProduct.id} (${wcProduct.name}) - already imported from another category`);
                this.stats.skipped++;
                continue;
              }

              await this.importSingleProduct(wcProduct, dryRun);
              processedProductIds.add(wcProduct.id);
              totalProcessed++;
              processedInThisSession++;
              this.stats.total = totalProcessed;

              // Save progress after each successful import
              this.saveProgressState(
                {
                  lastCompletedPage: currentPage,
                  totalProcessed: totalProcessed,
                  lastProcessedAt: new Date().toISOString()
                },
                progressKey
              );

              if (totalProcessed % this.config.logging.progressInterval === 0) {
                this.logger.info(`📈 Progress: ${totalProcessed} products processed, current page: ${currentPage}`);
              }

            } catch (error) {
              this.stats.errors++;
              this.logger.error(`❌ Failed to import product ${wcProduct.id} (${wcProduct.name}):`, error.message);

              if (!this.config.errorHandling.continueOnError) {
                throw error;
              }
            }
          }

          this.logger.success(`✅ Completed page ${currentPage}: ${result.data.length} products processed`);
          currentPage++;

          // Check if we've reached the total pages or our limit
          if (result.totalPages && currentPage > result.totalPages) {
            hasMorePages = false;
          }

          if (processedInThisSession >= limit) {
            this.logger.info(`📊 Reached session limit of ${limit} products`);
            break;
          }
        }
      }

      this.logger.success(`🎉 Import session completed: ${processedInThisSession} products processed in this session`);

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
   * Load progress state from file
   */
  loadProgressState(progressKey = 'product-import-progress.json') {
    const progressFile = `${this.config.duplicateTracking.storageDir}/${progressKey}`;

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
  saveProgressState(state, progressKey = 'product-import-progress.json') {
    const progressFile = `${this.config.duplicateTracking.storageDir}/${progressKey}`;

    try {
      require('fs').writeFileSync(progressFile, JSON.stringify(state, null, 2));
    } catch (error) {
      this.logger.error(`❌ Failed to save progress state: ${error.message}`);
    }
  }

  /**
   * Reset progress state (useful for starting fresh)
   */
  resetProgressState(progressKey = 'product-import-progress.json') {
    const progressFile = `${this.config.duplicateTracking.storageDir}/${progressKey}`;

    try {
      if (require('fs').existsSync(progressFile)) {
        require('fs').unlinkSync(progressFile);
        this.logger.info(`🧹 Reset product import progress state`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to reset progress state: ${error.message}`);
    }
  }

  /**
   * Import a single product
   */
  async importSingleProduct(wcProduct, dryRun = false) {
    this.logger.debug(`dY"? Processing product: ${wcProduct.id} - ${wcProduct.name}`);

    const existingMapping = this.duplicateTracker.getStrapiId('products', wcProduct.id);
    const existingStrapiId = existingMapping?.strapiId;

    try {
      const strapiProduct = await this.transformProduct(wcProduct);
      const payload = this.prepareProductPayload(strapiProduct);

      if (dryRun) {
        const mode = existingStrapiId ? 'update' : 'create';
        this.logger.info(`dY"? [DRY RUN] Would ${mode} product: ${wcProduct.name}`);
        this.stats.success++;
        if (existingStrapiId) {
          this.stats.updated++;
        }
        return { isDryRun: true, mode, data: payload };
      }

      let productId = existingStrapiId;
      let mode = 'create';

      if (existingStrapiId) {
        await this.strapiClient.updateProduct(existingStrapiId, payload);
        mode = 'update';
        this.logger.success(`?o. Updated product: ${wcProduct.name} ?+' ID: ${existingStrapiId}`);
      } else {
        const result = await this.strapiClient.createProduct(payload);
        productId = result.data.id;
        this.logger.success(`?o. Created product: ${wcProduct.name} ?+' ID: ${productId}`);
      }

      if (productId) {
        const imageResults = await this.handleProductImages(wcProduct, productId);

        if (imageResults.coverImageId || imageResults.galleryImageIds.length > 0) {
          const updateData = {};

          if (imageResults.coverImageId) {
            updateData.CoverImage = imageResults.coverImageId;
          }

          updateData.Media = imageResults.galleryImageIds;

          await this.strapiClient.updateProduct(productId, updateData);
          this.logger.success(`dY", Images synced for product: ${wcProduct.name}`);
        }

        this.duplicateTracker.recordMapping(
          'products',
          wcProduct.id,
          productId,
          {
            name: wcProduct.name,
            slug: wcProduct.slug,
            type: wcProduct.type,
            status: wcProduct.status
          }
        );
      }

      this.stats.success++;
      if (mode === 'update') {
        this.stats.updated++;
      }

      return { mode, strapiId: productId };
    } catch (error) {
      this.stats.failed++;
      this.logger.error(`??O Failed to upsert product ${wcProduct.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Prepare payload for Strapi create/update operations
   */
  prepareProductPayload(strapiProduct) {
    const {
      _coverImageUrl,
      _additionalImages,
      _variationIds,
      _attributes,
      _additionalCategories,
      ...payload
    } = strapiProduct;

    const additionalCategoryIds = Array.isArray(_additionalCategories)
      ? _additionalCategories
          .map((item) => (typeof item === 'object' ? item?.id : item))
          .filter(Boolean)
      : [];

    if (Array.isArray(_additionalCategories)) {
      payload.product_other_categories = additionalCategoryIds;
    }

    if (payload.external_id) {
      payload.external_id = payload.external_id.toString();
    }

    if (!payload.external_source) {
      payload.external_source = 'woocommerce';
    }

    return payload;
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
    } else {
      strapiProduct._additionalCategories = [];
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
   * Handle product images - download from WooCommerce and upload to Strapi
   */
  async handleProductImages(wcProduct, strapiProductId) {
    try {
      if (!wcProduct.images || wcProduct.images.length === 0) {
        this.logger.debug(`📸 No images found for product: ${wcProduct.name}`);
        return { coverImageId: null, galleryImageIds: [] };
      }

      this.logger.info(`📸 Processing ${wcProduct.images.length} images for: ${wcProduct.name}`);

      // Handle cover image (first image)
      const coverImageId = await this.imageUploader.handleCoverImage(wcProduct, strapiProductId);
      
      // Handle gallery images (remaining images)
      const galleryImageIds = await this.imageUploader.handleGalleryImages(wcProduct, strapiProductId);

      return {
        coverImageId,
        galleryImageIds
      };
    } catch (error) {
      this.logger.error(`❌ Failed to handle images for product ${wcProduct.id}:`, error.message);
      return { coverImageId: null, galleryImageIds: [] };
    }
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

