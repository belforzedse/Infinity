/**
 * Configuration for WooCommerce to Strapi Importer
 *
 * API credentials are now sourced from environment variables to avoid committing secrets.
 * See README / deployment docs for the list of required variables.
 */

const requiredEnvVar = (key, { optional = false, defaultValue = "" } = {}) => {
  const value = process.env[key];

  if (value !== undefined && value !== null && value.toString().trim() !== "") {
    return value.toString().trim();
  }

  if (optional) {
    return defaultValue;
  }

  throw new Error(
    `Missing environment variable "${key}" required for importer configuration. ` +
      `Set it before running the interactive importer.`,
  );
};

const toNumber = (value, fallback) => {
  const asNumber = Number.parseInt(value ?? "", 10);
  return Number.isNaN(asNumber) ? fallback : asNumber;
};

const toArray = (value, fallback = []) => {
  if (typeof value !== "string" || value.trim() === "") {
    return fallback;
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

module.exports = {
  // WooCommerce API Configuration
  woocommerce: {
    baseUrl: process.env.WOOCOMMERCE_BASE_URL || "https://infinitycolor.co/wp-json/wc/v3",
    auth: {
      consumerKey: requiredEnvVar("WOOCOMMERCE_CONSUMER_KEY"),
      consumerSecret: requiredEnvVar("WOOCOMMERCE_CONSUMER_SECRET"),
    },
    // Rate limiting to avoid overwhelming the API
    rateLimiting: {
      requestsPerSecond: 2,
      delayBetweenRequests: 500, // ms
    },
  },

  // WordPress API Configuration (for blog import)
  wordpress: {
    baseUrl: process.env.WORDPRESS_BASE_URL || "https://infinitycolor.co/wp-json/wp/v2",
    auth: {
      username: process.env.WORDPRESS_BASIC_USER || "",
      password: process.env.WORDPRESS_BASIC_PASSWORD || "",
    },
    // Rate limiting to keep the public WP API happy
    rateLimiting: {
      requestsPerSecond: toNumber(process.env.WORDPRESS_REQUESTS_PER_SECOND, 4),
      delayBetweenRequests: toNumber(process.env.WORDPRESS_REQUEST_DELAY, 300),
    },
    useEmbeddedResponses: process.env.WORDPRESS_USE_EMBED !== "false",
  },

  // Strapi API Configuration
  strapi: {
    // Default to production - will be overridden by user selection in interactive mode
    baseUrl: process.env.STRAPI_IMPORT_PRODUCTION_URL || "https://api.infinitycolor.org/api",
    auth: {
      token: requiredEnvVar("STRAPI_API_TOKEN_PRODUCTION", { optional: false }),
    },
    // Credential options for interactive selection
    credentials: {
      production: {
        baseUrl: process.env.STRAPI_IMPORT_PRODUCTION_URL || "https://api.infinitycolor.org/api",
        token: requiredEnvVar("STRAPI_API_TOKEN_PRODUCTION", { optional: false }),
      },
      staging: {
        baseUrl: process.env.STRAPI_IMPORT_STAGING_URL || "https://api.staging.infinitycolor.org/api",
        token: requiredEnvVar("STRAPI_API_TOKEN_STAGING", { optional: false }),
      },
      local: {
        baseUrl: process.env.STRAPI_IMPORT_LOCAL_URL || "http://localhost:1337/api",
        token: requiredEnvVar("STRAPI_API_TOKEN_LOCAL", { optional: true, defaultValue: "" }),
      },
    },
    endpoints: {
      categories: "/product-categories",
      products: "/products",
      variations: "/product-variations",
      variationColors: "/product-variation-colors",
      variationSizes: "/product-variation-sizes",
      variationModels: "/product-variation-models",
      stocks: "/product-stocks",
      orders: "/orders",
      orderItems: "/order-items",
      contracts: "/contracts",
      users: "/users",
      userInfos: "/local-user-infos",
      userRoles: "/users-permissions/roles",
      blogPosts: "/blog-posts",
      blogCategories: "/blog-categories",
      blogTags: "/blog-tags",
      blogAuthors: "/blog-authors",
    },
  },

  // Import Settings
  import: {
    filters: {
      // Optional list of WooCommerce category IDs to restrict imports
      categoryIds: toArray(process.env.IMPORT_FILTER_CATEGORY_IDS),
    },
    // Batch sizes for different entities
    batchSizes: {
      categories: toNumber(process.env.IMPORT_BATCH_CATEGORIES, 100),
      products: toNumber(process.env.IMPORT_BATCH_PRODUCTS, 100), // WooCommerce API max
      variations: toNumber(process.env.IMPORT_BATCH_VARIATIONS, 100),
      orders: toNumber(process.env.IMPORT_BATCH_ORDERS, 50),
      users: toNumber(process.env.IMPORT_BATCH_USERS, 50),
      blogPosts: toNumber(process.env.IMPORT_BATCH_BLOG_POSTS, 20),
    },

    // Currency conversion (IRT to our internal format)
    currency: {
      from: process.env.CURRENCY_FROM || "IRT", // Iranian Toman
      to: process.env.CURRENCY_TO || "IRR", // Iranian Rial (internal)
      multiplier: toNumber(process.env.CURRENCY_MULTIPLIER, 1), // Default: 1 (no conversion, use WooCommerce prices as-is)
    },

    // Image handling settings
    images: {
      enableUpload: process.env.IMPORT_IMAGES_ENABLE_UPLOAD !== "false", // Enabled by default (set to 'false' to disable)
      maxImagesPerProduct: toNumber(process.env.IMPORT_IMAGES_MAX_PER_PRODUCT, 999), // Limit gallery images (999 = unlimited)
      updateProductsWithExistingImages: process.env.IMPORT_IMAGES_UPDATE_EXISTING === "true", // Only update products that don't have images yet
      maxSize: toNumber(process.env.IMPORT_IMAGES_MAX_SIZE, 10 * 1024 * 1024), // 10MB
      allowedTypes: toArray(process.env.IMPORT_IMAGES_ALLOWED_TYPES, [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
      ]),
      downloadTimeout: toNumber(process.env.IMPORT_IMAGES_DOWNLOAD_TIMEOUT, 30000),
      uploadTimeout: toNumber(process.env.IMPORT_IMAGES_UPLOAD_TIMEOUT, 60000),
      delayBetweenUploads: toNumber(process.env.IMPORT_IMAGES_DELAY, 500),
      cacheImages: process.env.IMPORT_IMAGES_CACHE !== "false",
      conversion: {
        convertWebpToJpg: process.env.IMPORT_IMAGES_CONVERT_WEBP !== "false",
        jpegQuality: toNumber(process.env.IMPORT_IMAGES_JPEG_QUALITY, 90),
        pngCompressionLevel: toNumber(process.env.IMPORT_IMAGES_PNG_COMPRESSION, 8),
        enableOptimization: process.env.IMPORT_IMAGES_ENABLE_OPTIMIZATION !== "false",
      },
    },

    // Status mappings
    statusMappings: {
      product: {
        publish: "Active",
        draft: "InActive",
        private: "InActive",
        pending: "InActive",
      },
      order: {
        pending: "Paying",
        processing: "Started",
        "on-hold": "Started",
        completed: "Done",
        cancelled: "Cancelled",
        refunded: "Returned",
        failed: "Cancelled",
      },
      stock: {
        instock: "available",
        outofstock: "out_of_stock",
        onbackorder: "backorder",
      },
    },

    // Default values
    defaults: {
      productStatus: process.env.IMPORT_DEFAULT_PRODUCT_STATUS || "Active",
      orderType: process.env.IMPORT_DEFAULT_ORDER_TYPE || "Automatic",
      taxPercent: toNumber(process.env.IMPORT_DEFAULT_TAX_PERCENT, 10),
      contractType: process.env.IMPORT_DEFAULT_CONTRACT_TYPE || "Cash",

      // Default variation attributes when not specified in WooCommerce
      variationAttributes: {
        color: {
          title: process.env.IMPORT_DEFAULT_COLOR_TITLE || "خاکستری روشن", // Default in Persian
          colorCode: process.env.IMPORT_DEFAULT_COLOR_CODE || "#CCCCCC", // Light gray
        },
        size: {
          title: process.env.IMPORT_DEFAULT_SIZE_TITLE || "یک سایز", // One size (free size) in Persian
        },
        model: {
          title: process.env.IMPORT_DEFAULT_MODEL_TITLE || "استاندارد", // Standard in Persian
        },
      },
    },
  },

  // Logging and Progress Tracking
  logging: {
    level: process.env.IMPORT_LOG_LEVEL || "debug", // error, warn, info, debug
    saveToFile: process.env.IMPORT_LOG_SAVE_TO_FILE !== "false",
    logDir: process.env.IMPORT_LOG_DIR || "./logs",
    progressInterval: toNumber(process.env.IMPORT_PROGRESS_INTERVAL, 10), // Log progress every N items
  },

  // Duplicate Prevention
  duplicateTracking: {
    // Base directory - will be environment-specific in interactive mode
    // e.g., "./import-tracking/production" or "./import-tracking/staging"
    storageDir: process.env.IMPORT_TRACKING_DIR || "./import-tracking",
    mappingFiles: {
      categories: process.env.IMPORT_TRACKING_CATEGORIES_FILE || "category-mappings.json",
      products: process.env.IMPORT_TRACKING_PRODUCTS_FILE || "product-mappings.json",
      variations: process.env.IMPORT_TRACKING_VARIATIONS_FILE || "variation-mappings.json",
      orders: process.env.IMPORT_TRACKING_ORDERS_FILE || "order-mappings.json",
      users: process.env.IMPORT_TRACKING_USERS_FILE || "user-mappings.json",
      blogPosts: process.env.IMPORT_TRACKING_BLOG_POSTS_FILE || "blog-post-mappings.json",
      blogCategories:
        process.env.IMPORT_TRACKING_BLOG_CATEGORIES_FILE || "blog-category-mappings.json",
      blogTags: process.env.IMPORT_TRACKING_BLOG_TAGS_FILE || "blog-tag-mappings.json",
      blogAuthors: process.env.IMPORT_TRACKING_BLOG_AUTHORS_FILE || "blog-author-mappings.json",
      blogMedia: process.env.IMPORT_TRACKING_BLOG_MEDIA_FILE || "blog-media-mappings.json",
    },
    // Environment-specific directories
    environments: {
      production: "./import-tracking/production",
      staging: "./import-tracking/staging",
      local: "./import-tracking/local",
    },
  },

  // Error Handling
  errorHandling: {
    maxRetries: toNumber(process.env.IMPORT_ERROR_MAX_RETRIES, 3),
    retryDelay: toNumber(process.env.IMPORT_ERROR_RETRY_DELAY, 2000), // ms
    continueOnError: process.env.IMPORT_ERROR_CONTINUE_ON_ERROR !== "false",
    saveFailedItems: process.env.IMPORT_ERROR_SAVE_FAILED_ITEMS !== "false",
  },
};
