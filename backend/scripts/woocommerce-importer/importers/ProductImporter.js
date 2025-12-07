const { WooCommerceClient, StrapiClient } = require('../utils/ApiClient');
const DuplicateTracker = require('../utils/DuplicateTracker');
const ImageUploader = require('../utils/ImageUploader');

// Import the central Unicode slug utility to ensure consistent slug behavior
let generateUnicodeSlug;
try {
  // Try to import from source TypeScript file (works in Strapi context with ts-node/tsx)
  generateUnicodeSlug = require('../../../src/utils/unicodeSlug.ts').generateUnicodeSlug;
} catch (e) {
  try {
    // Fallback to compiled dist directory (production builds)
    generateUnicodeSlug = require('../../../dist/src/utils/unicodeSlug.js').generateUnicodeSlug;
  } catch (e2) {
    // If both fail, use inline implementation matching the central utility exactly
    generateUnicodeSlug = (text, fallbackPrefix = 'product') => {
      if (!text) {
        return `${fallbackPrefix}-${Date.now()}`;
      }

      // First, replace spaces and ZWNJ with hyphens
      let slug = text
        .toString()
        .trim()
        .replace(/[\s\u200c]+/g, '-'); // Convert spaces and ZWNJ to hyphen

      // Lowercase only ASCII letters (a-z), preserve Persian characters
      slug = slug.replace(/[A-Z]/g, (char) => char.toLowerCase());

      // Remove unwanted characters but keep ASCII letters/numbers, Persian letters, and hyphens
      slug = slug.replace(/[^0-9a-z\u0600-\u06ff-]/g, '');

      // Collapse multiple hyphens
      slug = slug.replace(/-+/g, '-');

      // Trim leading/trailing hyphens
      slug = slug.replace(/^-|-$/g, '');

      return slug || `${fallbackPrefix}-${Date.now()}`;
    };
  }
}

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
      endTime: null,
    };

    // Cache for category mappings to avoid repeated lookups
    this.categoryMappingCache = new Map();
  }

  /**
   * Check if product name contains any of the target keywords
   * Keywords: کیف (bag), کفش (shoe), کتونی (sneaker), صندل (sandal)
   */
  shouldImportProduct(productName, nameFilter = null) {
    // If no filter, import all
    if (!nameFilter || nameFilter.length === 0) {
      return true;
    }

    // Convert to lowercase for case-insensitive matching
    const name = productName.toLowerCase();

    // Check if any keyword appears in the name
    return nameFilter.some((keyword) => name.includes(keyword.toLowerCase()));
  }
  /**
   * Main import method - Optimized for incremental processing
   * Supports optional category filtering
   */

  async import(options = {}) {
    const defaultKeywords = ["اسلیپر", "ونس", "کیف", "کفش", "کتونی", "صندل"];
    const {
      limit = 50,
      page = 1,
      dryRun = false,
      categoryIds = [],
      nameFilter = defaultKeywords,
      createdAfter,
      createdBefore,
      publishedAfter,
    } = options;

    this.stats.startTime = Date.now();

    const normalizedCreatedAfter = this.normalizeDateFilter(createdAfter, "createdAfter");
    const normalizedCreatedBefore = this.normalizeDateFilter(createdBefore, "createdBefore");
    const normalizedPublishedAfter = this.normalizeDateFilter(publishedAfter, "publishedAfter");

    if (
      normalizedCreatedAfter &&
      normalizedCreatedBefore &&
      new Date(normalizedCreatedAfter) > new Date(normalizedCreatedBefore)
    ) {
      throw new Error("createdAfter date must be before createdBefore date");
    }

    const dateFilterLabel = this.describeDateFilters(
      normalizedCreatedAfter,
      normalizedCreatedBefore,
      normalizedPublishedAfter,
    );

    // Determine categories to import
    let categoriesToProcess = categoryIds;
    if (!categoriesToProcess || categoriesToProcess.length === 0) {
      // If no specific categories provided, import all products
      categoriesToProcess = [null];
      this.logger.info(
        `🛍️ Starting product import (all categories, limit: ${limit}, page: ${page}, dryRun: ${dryRun}${dateFilterLabel}${
          normalizedPublishedAfter
            ? `, publishedAfter=${this.formatDateForLog(normalizedPublishedAfter)}`
            : ""
        })`,
      );
    } else {
      this.logger.info(
        `🛍️ Starting product import from categories: [${categoriesToProcess.join(
          ", ",
        )}] (limit: ${limit}, page: ${page}, dryRun: ${dryRun}${dateFilterLabel}${
          normalizedPublishedAfter
            ? `, publishedAfter=${this.formatDateForLog(normalizedPublishedAfter)}`
            : ""
        })`,
      );
    }

    try {
      // Pre-load category mappings for faster lookups
      await this.loadCategoryMappings();

      // Track processed product IDs to avoid duplicates across categories
      const processedProductIds = new Set();
      let sessionProcessed = 0;

      // Process each category
      for (const categoryId of categoriesToProcess) {
        const progressKey = categoryId
          ? `product-import-progress-cat-${categoryId}.json`
          : "product-import-progress.json";

        // Load progress state for this category
        const progressState = this.loadProgressState(progressKey);
        let currentPage = Math.max(page, progressState.lastCompletedPage + 1);
        let totalProcessed = progressState.totalProcessed;

        const categoryLabel = categoryId ? `category ${categoryId}` : "all categories";
        this.logger.info(
          `📊 Resuming ${categoryLabel} from page ${currentPage} (${totalProcessed} products already processed)`,
        );

        // Process products incrementally page by page for this category
        let hasMorePages = true;
        let processedInThisSession = 0;

        while (hasMorePages && processedInThisSession < limit) {
          const remainingLimit = limit - processedInThisSession;
          const perPage = Math.min(this.config.import.batchSizes.products, remainingLimit);

          this.logger.info(
            `📄 Processing page ${currentPage} from ${categoryLabel} (requesting ${perPage} items)...`,
          );

          // Fetch current page with optional category filter
          const result = await this.wooClient.getProducts(currentPage, perPage, categoryId, {
            modifiedAfter: normalizedCreatedAfter,
            modifiedBefore: normalizedCreatedBefore,
            createdAfter: normalizedCreatedAfter,
            createdBefore: normalizedCreatedBefore,
          });

          if (!result.data || result.data.length === 0) {
            this.logger.info(
              `📄 No more products found on page ${currentPage} for ${categoryLabel}`,
            );
            hasMorePages = false;
            break;
          }

          // Process products from this page with parallel execution (5 concurrent)
          this.logger.info(
            `🔄 Processing ${result.data.length} products from page ${currentPage}... (parallel mode)`,
          );

          // Process products in batches of 5 concurrent imports
          const BATCH_SIZE = 5;
          for (let i = 0; i < result.data.length; i += BATCH_SIZE) {
            const batch = result.data.slice(i, i + BATCH_SIZE);

            // Process batch in parallel with Promise.allSettled
            const batchResults = await Promise.allSettled(
              batch.map(async (wcProduct) => {
                // Skip if already processed in another category
                if (processedProductIds.has(wcProduct.id)) {
                  this.logger.debug(
                    `⏭️ Skipping product ${wcProduct.id} (${wcProduct.name}) - already imported from another category`,
                  );
                  this.stats.skipped++;
                  return { status: "skipped", reason: "duplicate" };
                }

                // Import products that have the needed demo titles
                if (!this.shouldImportProduct(wcProduct.name, nameFilter)) {
                  this.logger.debug(
                    `⏩ Skipping product ${wcProduct.id} (${wcProduct.name}) - doesnt match name filter`,
                  );
                  this.stats.skipped++;
                  return { status: "skipped", reason: "filter" };
                }

                // Check publishedAfter filter - only import products that were uploaded/published after timestamp
                if (normalizedPublishedAfter) {
                  const publishedAt = wcProduct.date_created || wcProduct.date_modified;
                  if (!publishedAt || new Date(publishedAt) < new Date(normalizedPublishedAfter)) {
                    this.logger.debug(
                      `⏩ Skipping product ${wcProduct.id} (${
                        wcProduct.name
                      }) - published before ${this.formatDateForLog(
                        normalizedPublishedAfter,
                      )} (published: ${
                        publishedAt ? this.formatDateForLog(publishedAt) : "unknown"
                      })`,
                    );
                    this.stats.skipped++;
                    return { status: "skipped", reason: "publishedAfter" };
                  }
                }

                await this.importSingleProduct(wcProduct, dryRun);
                processedProductIds.add(wcProduct.id);
                return { status: "success", productId: wcProduct.id };
              }),
            );

            // Process results and update stats
            for (let j = 0; j < batchResults.length; j++) {
              const result = batchResults[j];
              const wcProduct = batch[j];

              if (result.status === "fulfilled" && result.value.status === "success") {
                totalProcessed++;
                processedInThisSession++;
                sessionProcessed++;
                this.stats.total = totalProcessed;

                // Save progress after each successful batch
                this.saveProgressState(
                  {
                    lastCompletedPage: currentPage,
                    totalProcessed: totalProcessed,
                    lastProcessedAt: new Date().toISOString(),
                  },
                  progressKey,
                );

                if (totalProcessed % this.config.logging.progressInterval === 0) {
                  this.logger.info(
                    `📈 Progress: ${totalProcessed} products processed, current page: ${currentPage}`,
                  );
                }
              } else if (result.status === "rejected") {
                this.stats.errors++;
                this.logger.error(
                  `❌ Failed to import product ${wcProduct.id} (${wcProduct.name}):`,
                  result.reason?.message || result.reason,
                );

                if (!this.config.errorHandling.continueOnError) {
                  throw result.reason;
                }
              }
            }
          }

          this.logger.success(
            `✅ Completed page ${currentPage}: ${result.data.length} products processed`,
          );
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

      this.logger.success(
        `🎉 Import session completed: ${sessionProcessed} products processed in this session`,
      );
    } catch (error) {
      this.stats.errors++;
      this.logger.error("❌ Product import failed:", error);
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
    this.logger.debug("📂 Loading category mappings...");
    const categoryMappings = this.duplicateTracker.getAllMappings("categories");

    for (const [wcId, mapping] of Object.entries(categoryMappings)) {
      this.categoryMappingCache.set(parseInt(wcId), mapping.strapiId);
    }

    this.logger.info(`📂 Loaded ${this.categoryMappingCache.size} category mappings`);
  }

  /**
   * Load progress state from file
   */
  loadProgressState(progressKey = "product-import-progress.json") {
    const progressFile = `${this.config.duplicateTracking.storageDir}/${progressKey}`;

    try {
      if (require("fs").existsSync(progressFile)) {
        const data = JSON.parse(require("fs").readFileSync(progressFile, "utf8"));
        this.logger.debug(
          `📂 Loaded progress state: page ${data.lastCompletedPage}, ${data.totalProcessed} processed`,
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
    };
  }

  /**
   * Save progress state to file
   */
  saveProgressState(state, progressKey = "product-import-progress.json") {
    const progressFile = `${this.config.duplicateTracking.storageDir}/${progressKey}`;

    try {
      require("fs").writeFileSync(progressFile, JSON.stringify(state, null, 2));
    } catch (error) {
      this.logger.error(`❌ Failed to save progress state: ${error.message}`);
    }
  }

  /**
   * Reset progress state (useful for starting fresh)
   */
  resetProgressState(progressKey = "product-import-progress.json") {
    const progressFile = `${this.config.duplicateTracking.storageDir}/${progressKey}`;

    try {
      if (require("fs").existsSync(progressFile)) {
        require("fs").unlinkSync(progressFile);
        this.logger.info(`🧹 Reset product import progress state`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to reset progress state: ${error.message}`);
    }
  }

  describeDateFilters(createdAfter, createdBefore, publishedAfter) {
    if (!createdAfter && !createdBefore && !publishedAfter) {
      return "";
    }

    const parts = [];
    if (createdAfter) {
      parts.push(`createdAfter=${this.formatDateForLog(createdAfter)}`);
    }

    if (createdBefore) {
      parts.push(`createdBefore=${this.formatDateForLog(createdBefore)}`);
    }

    if (publishedAfter) {
      parts.push(`publishedAfter=${this.formatDateForLog(publishedAfter)}`);
    }

    return `, ${parts.join(" | ")}`;
  }

  formatDateForLog(value) {
    try {
      return new Date(value).toISOString();
    } catch (error) {
      this.logger.warn(`⚠️  Unable to format date filter value: ${value}`);
      return value;
    }
  }

  normalizeDateFilter(value, label = "dateFilter") {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        throw new Error(`Invalid ${label} value`);
      }
      return value.toISOString();
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) {
        return undefined;
      }

      const parsed = new Date(trimmed);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid ${label} value: ${value}`);
      }
      return parsed.toISOString();
    }

    throw new Error(`Unsupported ${label} value type: ${typeof value}`);
  }

  /**
   * Import a single product
   */
  async importSingleProduct(wcProduct, dryRun = false) {
    this.logger.debug(`🔍 Processing product: ${wcProduct.id} - ${wcProduct.name}`);

    // Pre-validation before processing
    if (!wcProduct.name || wcProduct.name.trim() === "") {
      this.stats.failed++;
      const errorMsg = `Product ${wcProduct.id}: Cannot import product without a name/title`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const existingMapping = this.duplicateTracker.getStrapiId("products", wcProduct.id);
    const existingStrapiId = existingMapping?.strapiId;

    try {
      const strapiProduct = await this.transformProduct(wcProduct);
      const payload = this.prepareProductPayload(strapiProduct);

      if (dryRun) {
        const mode = existingStrapiId ? "update" : "create";
        this.logger.info(`🔍 [DRY RUN] Would ${mode} product: ${wcProduct.name}`);
        this.stats.success++;
        if (existingStrapiId) {
          this.stats.updated++;
        }
        return { isDryRun: true, mode, data: payload };
      }

      let productId = existingStrapiId;
      let mode = "create";

      if (existingStrapiId) {
        // Check if product has actually changed before updating
        if (this.hasProductChanged(wcProduct, existingMapping)) {
          await this.strapiClient.updateProduct(existingStrapiId, payload);
          mode = "update";
          this.logger.success(`✅ Updated product: ${wcProduct.name} → ID: ${existingStrapiId}`);
        } else {
          // Product hasn't changed, skip update
          this.logger.info(`⏭️ No changes detected, skipping: ${wcProduct.name}`);
          this.stats.skipped++;
          return { mode: "skipped", strapiId: existingStrapiId };
        }
      } else {
        const result = await this.strapiClient.createProduct(payload);
        productId = result.data.id;
        this.logger.success(`✅ Created product: ${wcProduct.name} → ID: ${productId}`);
      }

      if (productId) {
        // Only handle images if enabled in config
        if (this.config.import.images.enableUpload) {
          // Always attempt to update images - no skip logic based on existing images
          const imageResults = await this.handleProductImages(wcProduct, productId);

          if (imageResults.coverImageId || imageResults.galleryImageIds.length > 0) {
            try {
              const updateData = {};

              // When updating product with new images, explicitly clear old references
              // This ensures dangling image references don't persist when images are replaced
              if (imageResults.coverImageId) {
                // Clear old cover image by setting new one
                // Strapi will disconnect the old one automatically
                updateData.CoverImage = imageResults.coverImageId;
              } else if (mode === "update") {
                // If no new cover image but this is an update, clear the old one
                updateData.CoverImage = null;
              }

              if (imageResults.galleryImageIds.length > 0) {
                // Replace all gallery images with new ones
                updateData.Media = imageResults.galleryImageIds;
              } else if (mode === "update") {
                // If no new gallery images but this is an update, clear old ones
                updateData.Media = null;
              }

              // Only update if we have data to update
              if (Object.keys(updateData).length > 0) {
                this.logger.debug(
                  `🔍 DEBUG: Attempting to update product ${productId} with image data:`,
                  JSON.stringify(updateData, null, 2),
                );

                try {
                  // Wait for Strapi to fully index uploaded images before linking them
                  await new Promise((resolve) => setTimeout(resolve, 100));
                  await this.strapiClient.updateProduct(productId, updateData);
                  this.logger.success(`📂 Images synced for product: ${wcProduct.name}`);
                } catch (apiError) {
                  // Log detailed error info for debugging
                  this.logger.error(
                    `❌ Image update API error for product ${productId}:`,
                    apiError.message,
                  );
                  if (apiError.response) {
                    this.logger.error(`   Status: ${apiError.response.status}`);
                    this.logger.error(
                      `   Response data:`,
                      JSON.stringify(apiError.response.data, null, 2),
                    );
                  }
                  throw apiError;
                }
              }
            } catch (imageUpdateError) {
              // If image update fails, log warning but continue with next product
              // The product itself was successfully created/updated
              this.logger.warn(
                `⚠️ Failed to sync images for product ${wcProduct.name}: ${imageUpdateError.message}`,
              );
            }
          }
        } else {
          this.logger.debug(`⏭️ Image upload disabled - skipping images for: ${wcProduct.name}`);
        }

        // Sync size guide helper per product
        try {
          await this.strapiClient.syncProductSizeHelper(productId, strapiProduct._sizeGuideMatrix);
        } catch (sizeGuideError) {
          this.logger.warn(
            `⚠️ Failed to sync size guide for product ${wcProduct.name}: ${sizeGuideError.message}`,
          );
        }

        this.duplicateTracker.recordMapping("products", wcProduct.id, productId, {
          name: wcProduct.name,
          slug: wcProduct.slug,
          type: wcProduct.type,
          status: wcProduct.status,
          rating: wcProduct.average_rating, // Track rating to detect changes
        });
      }

      this.stats.success++;
      if (mode === "update") {
        this.stats.updated++;
      }

      return { mode, strapiId: productId };
    } catch (error) {
      this.stats.failed++;
      this.logger.error(`❌ Failed to upsert product ${wcProduct.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if product data has changed since last import
   * Returns true if any key field has changed, false if unchanged
   */
  hasProductChanged(wcProduct, existingMapping) {
    if (!existingMapping) {
      return true; // New product, always import
    }

    // Compare key fields that matter
    const changed = {
      name: existingMapping.name !== wcProduct.name,
      slug: existingMapping.slug !== wcProduct.slug,
      status: existingMapping.status !== wcProduct.status,
      description: wcProduct.description && wcProduct.description !== "",
      price: wcProduct.price && parseFloat(wcProduct.price) > 0,
      rating:
        wcProduct.average_rating !== undefined &&
        wcProduct.average_rating !== existingMapping.rating,
    };

    // Log what changed
    const changedFields = Object.entries(changed)
      .filter(([_, hasChanged]) => hasChanged)
      .map(([field, _]) => field);

    if (changedFields.length > 0) {
      this.logger.debug(
        `📝 Product "${wcProduct.name}" changed fields: ${changedFields.join(", ")}`,
      );
      return true;
    }

    return false; // No changes detected
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
      _sizeGuideMatrix,
      ...payload
    } = strapiProduct;

    // Map additional categories to their IDs
    if (Array.isArray(_additionalCategories)) {
      const additionalCategoryIds = _additionalCategories
        .map((item) => (typeof item === "object" ? item?.id : item))
        .filter(Boolean);
      payload.product_other_categories = additionalCategoryIds;
    }

    if (payload.external_id) {
      payload.external_id = payload.external_id.toString();
    }

    if (!payload.external_source) {
      payload.external_source = "woocommerce";
    }

    return payload;
  }

  /**
   * Transform WooCommerce product to Strapi format
   */
  async transformProduct(wcProduct) {
    // Validate required product fields
    if (!wcProduct.name || wcProduct.name.trim() === "") {
      throw new Error(`Product ${wcProduct.id}: Missing product name/title`);
    }

    // Generate slug from WooCommerce slug or title
    const slug = this.generateProductSlug(wcProduct);

    // Prepare description - use main description if available, otherwise use short_description
    let descriptionContent = "";
    if (wcProduct.description && wcProduct.description.trim()) {
      descriptionContent = this.prepareRichtextContent(wcProduct.description);
    } else if (wcProduct.short_description && wcProduct.short_description.trim()) {
      // If main description is empty, use short_description as the main description
      descriptionContent = this.prepareRichtextContent(wcProduct.short_description);
      this.logger.debug(
        `📝 Product ${wcProduct.id}: Using short_description as Description (main description was empty)`,
      );
    }

    const strapiProduct = {
      Title: wcProduct.name.trim(),
      Slug: slug,
      // Description is richtext in Strapi, so preserve HTML
      Description: descriptionContent,
      Status: this.mapProductStatus(wcProduct.status),
      AverageRating: wcProduct.average_rating ? parseFloat(wcProduct.average_rating) : null,
      RatingCount: wcProduct.rating_count || 0,
      // Store WooCommerce ID for reference
      external_id: wcProduct.id.toString(),
      external_source: "woocommerce",
    };

    // Handle short description as cleaning tips or return conditions
    // Only use short_description for these fields if main description exists
    // (Otherwise short_description was already used as Description above)
    if (
      wcProduct.description &&
      wcProduct.description.trim() &&
      wcProduct.short_description &&
      wcProduct.short_description.trim()
    ) {
      // Preserve HTML for product details (short_description)
      const shortDescHtml = this.prepareRichtextContent(wcProduct.short_description);
      // Try to categorize the short description (check on cleaned version for logic)
      const cleanShortDesc = this.cleanHtmlContent(wcProduct.short_description);
      if (this.isCleaningInstructions(cleanShortDesc)) {
        // Store as HTML since it may be displayed with formatting
        strapiProduct.CleaningTips = shortDescHtml;
      } else {
        // Store as HTML for product details
        strapiProduct.ReturnConditions = shortDescHtml;
      }
    }

    // Handle main category relationship
    if (wcProduct.categories && wcProduct.categories.length > 0) {
      const mainCategory = wcProduct.categories[0];
      const mainCategoryStrapiId = this.categoryMappingCache.get(mainCategory.id);

      if (mainCategoryStrapiId) {
        strapiProduct.product_main_category = mainCategoryStrapiId;
        this.logger.debug(
          `🔗 Linked product ${wcProduct.name} to main category ID: ${mainCategoryStrapiId}`,
        );
      } else {
        this.logger.warn(
          `⚠️ Main category ${mainCategory.id} not found for product ${wcProduct.name}`,
        );
      }
    }

    // Store additional category relationships for later processing
    if (wcProduct.categories && wcProduct.categories.length > 1) {
      strapiProduct._additionalCategories = wcProduct.categories
        .slice(1)
        .map((cat) => {
          const strapiId = this.categoryMappingCache.get(cat.id);
          return strapiId ? { id: strapiId } : null;
        })
        .filter(Boolean);
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

    // Extract size guide matrix from WooCommerce meta fields
    const sizeGuideMatrix = this.extractSizeGuideMatrix(wcProduct);
    if (sizeGuideMatrix) {
      strapiProduct._sizeGuideMatrix = sizeGuideMatrix;
    } else {
      strapiProduct._sizeGuideMatrix = null;
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

      // Handle gallery images (remaining images) with max limit
      const maxGalleryImages = this.config.import.images.maxImagesPerProduct;
      const galleryImageIds = await this.imageUploader.handleGalleryImages(
        wcProduct,
        strapiProductId,
        maxGalleryImages,
      );

      return {
        coverImageId,
        galleryImageIds,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to handle images for product ${wcProduct.id}:`, error.message);
      return { coverImageId: null, galleryImageIds: [] };
    }
  }

  /**
   * Extract and sanitize size guide matrix stored in WooCommerce meta data
   */
  extractSizeGuideMatrix(wcProduct) {
    if (!wcProduct || !Array.isArray(wcProduct.meta_data)) {
      return null;
    }

    const sizeGuideKeys = ["product_size_guide", "product-custom-meta-inp"];
    const metaEntry = wcProduct.meta_data.find((meta) => meta && sizeGuideKeys.includes(meta.key));

    if (!metaEntry || metaEntry.value === undefined || metaEntry.value === null) {
      return null;
    }

    let rawValue = metaEntry.value;
    if (typeof rawValue === "string") {
      rawValue = rawValue.trim();
      if (rawValue === "") {
        return null;
      }
      try {
        rawValue = JSON.parse(rawValue);
      } catch (_) {
        // If parsing fails, treat as non-JSON payload
        return null;
      }
    }

    if (!Array.isArray(rawValue)) {
      return null;
    }

    const sanitized = rawValue
      .filter((row) => Array.isArray(row))
      .map((row) =>
        row.map((cell) => {
          if (cell === null || cell === undefined) {
            return "";
          }
          return typeof cell === "string" ? cell : String(cell);
        }),
      );

    const hasContent = sanitized.some((row) =>
      row.some((cell) => typeof cell === "string" && cell.trim() !== ""),
    );

    return hasContent ? sanitized : null;
  }

  /**
   * Map WooCommerce product status to Strapi status
   * Logs the mapping for verification and defaults to InActive for unknown statuses
   */
  mapProductStatus(wcStatus) {
    const mapping = this.config.import.statusMappings.product;
    const mappedStatus = mapping[wcStatus];

    if (mappedStatus) {
      this.logger.debug(`📋 Status mapping: WooCommerce "${wcStatus}" → Strapi "${mappedStatus}"`);
      return mappedStatus;
    }

    // Default to InActive for unknown statuses (safer than Active)
    // This ensures draft/unknown products are not accidentally published
    const fallbackStatus = "InActive";
    this.logger.warn(
      `⚠️ Unknown WooCommerce status "${wcStatus}", defaulting to "${fallbackStatus}" (not using config default "${this.config.import.defaults.productStatus}")`,
    );
    return fallbackStatus;
  }

  /**
   * Generate a product slug from WooCommerce data
   * Always generates Persian slugs from product name to preserve Persian characters
   * instead of using transliterated WooCommerce slugs
   * @param {Object} wcProduct - WooCommerce product object
   * @returns {string} - Generated slug with Persian characters preserved
   */
  generateProductSlug(wcProduct) {
    // Always generate slug from product name to preserve Persian characters
    // WooCommerce slugs are often transliterated (e.g., "baroni" instead of "بارانی")
    // We want to preserve the Persian characters from the product name
    if (wcProduct.name && wcProduct.name.trim()) {
      const generatedSlug = this.generateSlugFromTitle(wcProduct.name);
      return generatedSlug;
    }

    // Fallback: use WooCommerce slug if name is not available (shouldn't happen normally)
    if (wcProduct.slug && wcProduct.slug.trim()) {
      // Decode URL-encoded Persian slugs
      let slug = wcProduct.slug;
      try {
        slug = decodeURIComponent(slug);
      } catch (e) {
        // If decoding fails, use as-is
        this.logger.debug(`⚠️ Failed to decode slug "${slug}", using as-is`);
      }

      // Clean and normalize the slug
      const cleanedSlug = this.cleanSlug(slug);
      if (cleanedSlug) {
        return cleanedSlug;
      }
    }

    // Last resort: use WooCommerce ID
    return `product-${wcProduct.id}`;
  }

  /**
   * Generate a slug from a product title
   * Supports Persian/Arabic characters
   * Uses the central generateUnicodeSlug utility for consistency
   * @param {string} title - Product title
   * @returns {string} - Generated slug
   */
  generateSlugFromTitle(title) {
    return generateUnicodeSlug(title, "product");
  }

  /**
   * Clean and normalize a slug
   * Uses the central generateUnicodeSlug utility for consistency
   * @param {string} slug - Raw slug
   * @returns {string} - Cleaned slug
   */
  cleanSlug(slug) {
    if (!slug) return "";
    // Use generateUnicodeSlug with empty fallback prefix to get just the cleaned slug
    const cleaned = generateUnicodeSlug(slug, "");
    // If the result is just a timestamp (fallback with or without leading hyphen), return empty string instead
    // generateUnicodeSlug returns "-<timestamp>" when prefix is empty and slug is cleaned away
    return cleaned.match(/^-?\d+$/) ? "" : cleaned;
  }

  /**
   * Prepare HTML content for richtext fields in Strapi
   * Preserves HTML structure while cleaning up unsafe or problematic elements
   */
  prepareRichtextContent(htmlContent) {
    if (!htmlContent || typeof htmlContent !== "string") {
      return "";
    }

    // Trim whitespace
    let content = htmlContent.trim();

    if (!content) {
      return "";
    }

    // Strapi richtext accepts HTML, so we preserve it
    // Just do basic cleanup: normalize whitespace and ensure proper encoding
    content = content
      .replace(/\s+/g, " ") // Normalize multiple spaces
      .replace(/\n\s*\n/g, "\n") // Normalize multiple newlines
      .trim();

    return content;
  }

  /**
   * Clean HTML content for plain text fields
   */
  cleanHtmlContent(htmlContent) {
    if (!htmlContent || typeof htmlContent !== "string") {
      return "";
    }

    // Basic HTML tag removal - in production, use a proper HTML parser
    return htmlContent
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
      .replace(/&amp;/g, "&") // Replace &amp; with &
      .replace(/&lt;/g, "<") // Replace &lt; with <
      .replace(/&gt;/g, ">") // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .trim();
  }

  /**
   * Determine if content is cleaning instructions
   * Note: "جنس" (material) is removed as it's a product detail, not cleaning instruction
   */
  isCleaningInstructions(content) {
    const cleaningKeywords = [
      "شستشو",
      "پاک",
      "تمیز",
      "washing",
      "clean",
      "care",
      "نگهداری",
      "مراقبت",
      "دستورالعمل شستشو",
    ];
    return cleaningKeywords.some((keyword) =>
      content.toLowerCase().includes(keyword.toLowerCase()),
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
    this.logger.info(
      `📊 Duplicate tracking: ${trackingStats.products?.total || 0} products tracked`,
    );
  }

  /**
   * Get import statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

module.exports = ProductImporter;
