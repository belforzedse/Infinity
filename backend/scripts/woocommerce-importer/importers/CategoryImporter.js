const { WooCommerceClient, StrapiClient } = require('../utils/ApiClient');
const DuplicateTracker = require('../utils/DuplicateTracker');

/**
 * Category Importer - Handles importing WooCommerce categories to Strapi
 * 
 * Features:
 * - Hierarchical category import (parents first)
 * - Duplicate prevention
 * - Progress tracking
 * - Error handling and retry logic
 */
class CategoryImporter {
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
  }

  /**
   * Main import method
   */
  async import(options = {}) {
    const { limit = 100, page = 1, dryRun = false } = options;
    
    this.stats.startTime = Date.now();
    this.logger.info(`🏷️ Starting category import (limit: ${limit}, page: ${page}, dryRun: ${dryRun})`);
    
    try {
      // Get all categories from WooCommerce
      const allCategories = await this.fetchAllCategories(limit, page);
      this.stats.total = allCategories.length;
      
      if (allCategories.length === 0) {
        this.logger.warn('📭 No categories found to import');
        return this.stats;
      }
      
      // Sort categories by hierarchy (parents first)
      const sortedCategories = this.sortCategoriesByHierarchy(allCategories);
      this.logger.info(`📊 Found ${sortedCategories.length} categories to process`);
      
      // Start progress tracking
      this.logger.startProgress(sortedCategories.length, 'Importing categories');
      
      // Import categories in hierarchical order
      for (const wcCategory of sortedCategories) {
        try {
          await this.importSingleCategory(wcCategory, dryRun);
          this.logger.updateProgress();
        } catch (error) {
          this.stats.errors++;
          this.logger.error(`❌ Failed to import category ${wcCategory.id} (${wcCategory.name}):`, error.message);
          
          if (!this.config.errorHandling.continueOnError) {
            throw error;
          }
        }
      }
      
      this.logger.completeProgress();
      
    } catch (error) {
      this.stats.errors++;
      this.logger.error('❌ Category import failed:', error);
      throw error;
    } finally {
      this.stats.endTime = Date.now();
      this.stats.duration = this.stats.endTime - this.stats.startTime;
      this.logFinalStats();
    }
    
    return this.stats;
  }

  /**
   * Fetch all categories from WooCommerce with pagination
   */
  async fetchAllCategories(limit, startPage) {
    let allCategories = [];
    let currentPage = startPage;
    let totalFetched = 0;
    
    this.logger.info(`📥 Fetching categories from WooCommerce...`);
    
    while (totalFetched < limit) {
      const remainingLimit = limit - totalFetched;
      const perPage = Math.min(this.config.import.batchSizes.categories, remainingLimit);
      
      this.logger.debug(`Fetching page ${currentPage} (${perPage} items)`);
      
      const result = await this.wooClient.getCategories(currentPage, perPage);
      
      if (!result.data || result.data.length === 0) {
        this.logger.info(`📄 No more categories found on page ${currentPage}`);
        break;
      }
      
      allCategories = allCategories.concat(result.data);
      totalFetched += result.data.length;
      currentPage++;
      
      this.logger.debug(`📊 Fetched ${result.data.length} categories (total: ${totalFetched})`);
      
      // Break if we've reached the last page
      if (currentPage > result.totalPages) {
        break;
      }
    }
    
    this.logger.info(`✅ Fetched ${allCategories.length} categories from WooCommerce`);
    return allCategories;
  }

  /**
   * Sort categories by hierarchy - parents first, then children
   */
  sortCategoriesByHierarchy(categories) {
    const categoryMap = new Map();
    const rootCategories = [];
    const sortedCategories = [];
    
    // Build category map
    categories.forEach(cat => {
      categoryMap.set(cat.id, cat);
      // Check for root categories (parent is 0, null, undefined, or falsy)
      if (!cat.parent || cat.parent === 0) {
        rootCategories.push(cat);
      }
    });
    
    // Track visited categories to detect cycles and prevent infinite recursion
    const visitedCategories = new Set();

    // Recursive function to add categories in hierarchical order
    const addCategoryAndChildren = (category, ancestorChain = []) => {
      // Detect cycles: if this category is already in the ancestor chain, we have a cycle
      if (ancestorChain.includes(category.id)) {
        this.logger.warn(
          `⚠️ Cycle detected in category hierarchy: ${ancestorChain.join(' → ')} → ${category.id} (${category.name})`
        );
        return;
      }

      // Skip if already processed (can happen with cycles)
      if (visitedCategories.has(category.id)) {
        return;
      }

      visitedCategories.add(category.id);
      sortedCategories.push(category);

      // Find and add children, passing the updated ancestor chain
      const newAncestorChain = [...ancestorChain, category.id];
      categories
        .filter(cat => cat.parent === category.id)
        .forEach(childCategory => {
          addCategoryAndChildren(childCategory, newAncestorChain);
        });
    };
    
    // Start with root categories
    rootCategories.forEach(rootCategory => {
      addCategoryAndChildren(rootCategory);
    });
    
    this.logger.info(`🌳 Sorted categories hierarchically: ${rootCategories.length} root categories`);
    return sortedCategories;
  }

  /**
   * Import a single category
   */
  async importSingleCategory(wcCategory, dryRun = false) {
    this.logger.debug(`📂 Processing category: ${wcCategory.id} - ${wcCategory.name}`);
    
    // Check for duplicates
    const duplicateCheck = this.duplicateTracker.checkDuplicate('categories', wcCategory);
    if (duplicateCheck.isDuplicate) {
      this.stats.skipped++;
      return duplicateCheck;
    }
    
    try {
      // Transform WooCommerce category to Strapi format
      const strapiCategory = await this.transformCategory(wcCategory);
      
      if (dryRun) {
        this.logger.info(`🔍 [DRY RUN] Would import category: ${wcCategory.name}`);
        this.stats.success++;
        return { isDryRun: true, data: strapiCategory };
      }
      
      // Create category in Strapi
      const result = await this.strapiClient.createCategory(strapiCategory);
      
      // Record the mapping
      this.duplicateTracker.recordMapping(
        'categories',
        wcCategory.id,
        result.data.id,
        {
          name: wcCategory.name,
          slug: wcCategory.slug,
          parentId: wcCategory.parent
        }
      );
      
      this.stats.success++;
      this.logger.debug(`✅ Created category: ${wcCategory.name} → ID: ${result.data.id}`);
      
      return result;
      
    } catch (error) {
      this.stats.failed++;
      this.logger.error(`❌ Failed to create category ${wcCategory.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Transform WooCommerce category to Strapi format
   */
  async transformCategory(wcCategory) {
    // Ensure slug is unique by appending ID if needed
    let slug = wcCategory.slug;
    if (!slug) {
      slug = wcCategory.name
        .toLowerCase()
        .replace(/[^\u0600-\u06FF\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
    }

    // Add WooCommerce ID to slug to ensure uniqueness
    if (!slug.endsWith(`-${wcCategory.id}`)) {
      slug = `${slug}-${wcCategory.id}`.toLowerCase();
    }

    const strapiCategory = {
      Title: wcCategory.name,
      Slug: slug,
      // Store WooCommerce ID for reference
      external_id: wcCategory.id.toString(),
      external_source: 'woocommerce'
    };

    // Handle parent relationship - only set if parent exists in mappings
    if (wcCategory.parent && wcCategory.parent !== 0) {
      const parentMapping = this.duplicateTracker.getStrapiId('categories', wcCategory.parent);
      if (parentMapping && parentMapping.strapiId) {
        strapiCategory.parent = parentMapping.strapiId;
        this.logger.debug(`🔗 Linking category ${wcCategory.name} to parent ID: ${parentMapping.strapiId}`);
      } else {
        // Don't set parent if it doesn't exist - let it be a root category for now
        this.logger.warn(`⚠️ Parent category ${wcCategory.parent} not found for ${wcCategory.name} - will import as root category`);
      }
    }

    // Create category content if description exists
    if (wcCategory.description && wcCategory.description.trim()) {
      // Note: We'll handle category content creation separately
      // For now, we'll store the description for later processing
      strapiCategory.description_html = wcCategory.description;
    }

    this.logger.debug(`🔄 Transformed category: ${wcCategory.name} → ${JSON.stringify(strapiCategory, null, 2)}`);
    return strapiCategory;
  }

  /**
   * Create category content entries
   */
  async createCategoryContent(categoryId, wcCategory) {
    if (!wcCategory.description || !wcCategory.description.trim()) {
      return null;
    }
    
    const contentData = {
      Title: `${wcCategory.name} Description`,
      Paragraph: wcCategory.description,
      IsPublished: true,
      IsRTL: true, // Persian content
      product_category: categoryId
    };
    
    try {
      const result = await this.strapiClient.create('/product-category-contents', contentData);
      this.logger.debug(`📝 Created category content for: ${wcCategory.name}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Failed to create category content for ${wcCategory.name}:`, error.message);
      return null;
    }
  }

  /**
   * Log final import statistics
   */
  logFinalStats() {
    this.logger.success(`🎉 Category import completed!`);
    this.logger.logStats(this.stats);
    
    // Log duplicate tracking stats
    const trackingStats = this.duplicateTracker.getStats();
    this.logger.info(`📊 Duplicate tracking: ${trackingStats.categories.total} categories tracked`);
  }

  /**
   * Provide a lightweight progress snapshot for the interactive importer.
   */
  loadProgressState() {
    return {
      lastCompletedPage: 0,
      totalProcessed: this.stats.total || 0,
      lastProcessedAt: this.stats.endTime
        ? new Date(this.stats.endTime).toISOString()
        : null
    };
  }

  /**
   * Categories are reprocessed every run; nothing to reset.
   */
  resetProgressState() {
    this.logger.info('📂 Category importer has no persisted progress to reset');
  }

  /**
   * Get import statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

module.exports = CategoryImporter; 
