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
      updated: 0,
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
   * FIX: Now includes orphaned categories (those with missing parents)
   */
  sortCategoriesByHierarchy(categories) {
    const categoryMap = new Map();
    const rootCategories = [];
    const sortedCategories = [];

    // Build category map
    categories.forEach(cat => {
      categoryMap.set(cat.id, cat);
    });

    // Identify root categories: those with no parent OR parent doesn't exist in our list
    categories.forEach(cat => {
      if (!cat.parent || cat.parent === 0 || !categoryMap.has(cat.parent)) {
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

    if (rootCategories.length > 0) {
      this.logger.info(`🌳 Sorted categories hierarchically: ${rootCategories.length} root categories, ${sortedCategories.length} total`);
    }

    // Log any categories that might have been orphaned
    if (sortedCategories.length < categories.length) {
      const orphanedCount = categories.length - sortedCategories.length;
      this.logger.warn(`⚠️ ${orphanedCount} categories were not processed (possible cycles or missing references)`);
    }

    return sortedCategories;
  }

  /**
   * Import a single category (create, update, or repair mapping)
   */
  async importSingleCategory(wcCategory, dryRun = false) {
    this.logger.debug(`📂 Processing category: ${wcCategory.id} - ${wcCategory.name}`);

    try {
      const strapiCategory = await this.transformCategory(wcCategory);
      const resolved = await this.resolveExistingStrapiCategory(wcCategory, strapiCategory);
      const existingStrapiId = resolved.strapiId;
      const existingMapping = resolved.mapping;

      if (dryRun) {
        const mode = existingStrapiId ? "update" : "create";
        this.logger.info(`🔍 [DRY RUN] Would ${mode} category: ${wcCategory.name}`);
        this.stats.success++;
        if (existingStrapiId) {
          this.stats.updated++;
        }
        return { isDryRun: true, mode, data: strapiCategory };
      }

      if (existingStrapiId) {
        if (this.hasCategoryChanged(wcCategory, strapiCategory, existingMapping)) {
          await this.strapiClient.updateCategory(existingStrapiId, strapiCategory);
          this.stats.updated++;
          this.logger.success(
            `✅ Updated category: ${wcCategory.name} → ID: ${existingStrapiId}`,
          );
        } else {
          this.stats.skipped++;
          this.logger.debug(`⏭️ No changes detected, skipping category update: ${wcCategory.name}`);
        }

        this.duplicateTracker.recordMapping("categories", wcCategory.id, existingStrapiId, {
          name: wcCategory.name,
          slug: wcCategory.slug,
          parentId: wcCategory.parent,
          importedSlug: strapiCategory.Slug,
        });

        this.stats.success++;
        return { mode: "update", strapiId: existingStrapiId };
      }

      const result = await this.strapiClient.createCategory(strapiCategory);

      this.duplicateTracker.recordMapping("categories", wcCategory.id, result.data.id, {
        name: wcCategory.name,
        slug: wcCategory.slug,
        parentId: wcCategory.parent,
        importedSlug: strapiCategory.Slug,
      });

      this.stats.success++;
      this.logger.debug(`✅ Created category: ${wcCategory.name} → ID: ${result.data.id}`);

      return { mode: "create", strapiId: result.data.id, data: result };
    } catch (error) {
      this.stats.failed++;
      this.logger.error(`❌ Failed to upsert category ${wcCategory.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Resolve Strapi category ID from mapping or Strapi lookup.
   */
  async resolveExistingStrapiCategory(wcCategory, strapiCategory) {
    const existingMapping = this.duplicateTracker.getStrapiId("categories", wcCategory.id);
    if (existingMapping?.strapiId) {
      return { strapiId: existingMapping.strapiId, mapping: existingMapping };
    }

    try {
      const existingByExternal = await this.strapiClient.findByExternalId(
        "/product-categories",
        wcCategory.id.toString(),
      );
      const existingItems = Array.isArray(existingByExternal?.data) ? existingByExternal.data : [];
      if (existingItems.length > 0) {
        const strapiId = existingItems[0].id;
        this.logger.warn(
          `⚠️ Recovered category mapping by external_id for WC ${wcCategory.id} → Strapi ${strapiId}`,
        );
        return { strapiId, mapping: { strapiId, syncedFromExisting: true } };
      }
    } catch (lookupError) {
      this.logger.warn(
        `⚠️ Failed to lookup category ${wcCategory.id} by external_id: ${lookupError.message}`,
      );
    }

    const existingCategory = await this.findExistingCategoryBySlug(strapiCategory.Slug);
    if (existingCategory?.id) {
      this.logger.warn(
        `⚠️ Recovered category mapping by slug for WC ${wcCategory.id} → Strapi ${existingCategory.id}`,
      );
      return { strapiId: existingCategory.id, mapping: { strapiId: existingCategory.id, syncedFromExisting: true } };
    }

    return { strapiId: null, mapping: null };
  }

  /**
   * Determine if WooCommerce category data differs from last known mapping.
   */
  hasCategoryChanged(wcCategory, strapiCategory, existingMapping) {
    if (!existingMapping) {
      return true;
    }

    return (
      existingMapping.name !== wcCategory.name ||
      existingMapping.slug !== wcCategory.slug ||
      existingMapping.parentId !== wcCategory.parent ||
      (existingMapping.importedSlug && existingMapping.importedSlug !== strapiCategory.Slug)
    );
  }

  /**
   * Find an existing category by slug in the Strapi database
   */
  async findExistingCategoryBySlug(slug) {
    try {
      const response = await this.strapiClient.getCategories({
        'filters[Slug][$eq]': slug,
        'pagination[pageSize]': 1
      });

      const categories = response.data || [];
      if (categories.length > 0) {
        return categories[0];
      }

      return null;
    } catch (error) {
      this.logger.warn(`⚠️ Failed to query existing categories by slug: ${error.message}`);
      return null;
    }
  }

  /**
   * Transform WooCommerce category to Strapi format
   */
  async transformCategory(wcCategory) {
    // Preserve the WooCommerce slug for SEO continuity.
    const slug = this.generateCategorySlug(wcCategory);

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
   * Generate a Persian-compatible slug for a category
   * @param {Object} wcCategory - WooCommerce category object
   * @returns {string} - Generated slug
   */
  generateCategorySlug(wcCategory) {
    // First, try to use the WooCommerce slug if available
    if (wcCategory.slug && wcCategory.slug.trim()) {
      // Decode URL-encoded Persian slugs
      let slug = wcCategory.slug;
      try {
        slug = decodeURIComponent(slug);
      } catch (e) {
        // If decoding fails, use as-is
      }
      
      // Clean and normalize the slug
      const cleanedSlug = this.cleanSlug(slug);
      if (cleanedSlug) {
        return cleanedSlug;
      }
    }

    // Fallback: generate slug from category name
    if (wcCategory.name && wcCategory.name.trim()) {
      const generatedSlug = this.generateSlugFromTitle(wcCategory.name);
      return generatedSlug;
    }

    // Last resort: use WooCommerce ID
    return `category-${wcCategory.id}`;
  }

  /**
   * Generate a slug from a title
   * Supports Persian/Arabic characters
   * @param {string} title - Category title
   * @returns {string} - Generated slug
   */
  generateSlugFromTitle(title) {
    if (!title) {
      return `category-${Date.now()}`;
    }

    // First, replace spaces and ZWNJ with hyphens
    let slug = title
      .toString()
      .trim()
      .replace(/[\s\u200c]+/g, '-'); // Convert spaces and ZWNJ to hyphen

    // Lowercase only ASCII letters (a-z), preserve Persian characters
    slug = slug.replace(/[A-Z]/g, (char) => char.toLowerCase());

    // Remove unwanted characters but keep ASCII letters/numbers, Persian letters, and hyphens
    slug = slug.replace(/[^0-9a-z\u0600-\u06ff-]/gi, '');

    // Collapse multiple hyphens
    slug = slug.replace(/-+/g, '-');

    // Trim leading/trailing hyphens
    slug = slug.replace(/^-|-$/g, '');

    return slug || `category-${Date.now()}`;
  }

  /**
   * Clean and normalize a slug
   * Preserves Persian/Arabic characters
   * @param {string} slug - Slug to clean
   * @returns {string} - Cleaned slug
   */
  cleanSlug(slug) {
    if (!slug) return '';

    // First, replace spaces and ZWNJ with hyphens
    let cleaned = slug
      .toString()
      .trim()
      .replace(/[\s\u200c]+/g, '-'); // Convert spaces and ZWNJ to hyphen

    // Lowercase only ASCII letters (a-z), preserve Persian characters
    cleaned = cleaned.replace(/[A-Z]/g, (char) => char.toLowerCase());

    // Remove unwanted characters but keep ASCII letters/numbers, Persian letters, and hyphens
    cleaned = cleaned.replace(/[^0-9a-z\u0600-\u06ff-]/gi, '');

    // Collapse multiple hyphens
    cleaned = cleaned.replace(/-+/g, '-');

    // Trim leading/trailing hyphens
    cleaned = cleaned.replace(/^-|-$/g, '');

    return cleaned;
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
