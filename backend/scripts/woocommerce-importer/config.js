/**
 * Configuration for WooCommerce to Strapi Importer
 *
 * API credentials are now sourced from environment variables to avoid committing secrets.
 * See README / deployment docs for the list of required variables.
 */

const requiredEnvVar = (key, { optional = false, defaultValue = '' } = {}) => {
  const value = process.env[key];

  if (value !== undefined && value !== null && value.toString().trim() !== '') {
    return value.toString().trim();
  }

  if (optional) {
    return defaultValue;
  }

  throw new Error(
    `Missing environment variable "${key}" required for importer configuration. ` +
    `Set it before running the interactive importer.`
  );
};

const toNumber = (value, fallback) => {
  const asNumber = Number.parseInt(value ?? '', 10);
  return Number.isNaN(asNumber) ? fallback : asNumber;
};

const toArray = (value, fallback = []) => {
  if (typeof value !== 'string' || value.trim() === '') {
    return fallback;
  }
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
};

module.exports = {
  // WooCommerce API Configuration
  woocommerce: {
    baseUrl: "https://infinitycolor.co/wp-json/wc/v3",
    auth: {
      consumerKey: "WOOCOMMERCE_CONSUMER_KEY",
      consumerSecret: "WOOCOMMERCE_CONSUMER_SECRET",
    },
    // Rate limiting to avoid overwhelming the API
    rateLimiting: {
      requestsPerSecond: 2,
      delayBetweenRequests: 500, // ms
    },
  },

  // Strapi API Configuration
  strapi: {
    // Default to production - will be overridden by user selection in interactive mode
    baseUrl: "https://api.infinitycolor.co/api",
    auth: {
      token:
        "c53f2effbd2f9e3184e2a5932899b1fd9a614afbce4ede82d9e83b34b76188be3dc10e9923e0023450671a24d95c639d60ef6f289e66efc3670be6e2b207f455d19a28f886e7ad9eb1c92ca06354f3ac8e13355f296900e8dbcdd0ab6137c5a704b863775a9615464c3a3097595054d8dbfc45e0ad1140f2ae9a0af638f9e728",
    },
    // Credential options for interactive selection
    credentials: {
      production: {
        baseUrl: "https://api.infinitycolor.co/api",
        token: "c53f2effbd2f9e3184e2a5932899b1fd9a614afbce4ede82d9e83b34b76188be3dc10e9923e0023450671a24d95c639d60ef6f289e66efc3670be6e2b207f455d19a28f886e7ad9eb1c92ca06354f3ac8e13355f296900e8dbcdd0ab6137c5a704b863775a9615464c3a3097595054d8dbfc45e0ad1140f2ae9a0af638f9e728",
      },
      staging: {
        baseUrl: "https://api.infinity.rgbgroup.ir/api",
        token: "STRAPI_API_TOKEN",
      },
      local: {
        baseUrl: process.env.STRAPI_IMPORT_LOCAL_URL || "http://localhost:1337/api",
        token:
          process.env.STRAPI_IMPORT_LOCAL_TOKEN ||
          "01a64981d0a2ad0dac5d0a08fc047c0036d4deaac2ad6d342141aad1ace16680cab4fab969be2343c93268975394bdfe490feffc7913542a187715e8bb5d4c724f63076d68d9d2f2ad381bb690960c7e6ff89e75b6b82ca81e282bcf71c85a624a31cb3ad1591416c0676f584f81797109a4eb1642a7ccbaffa4c013e60be873",
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
      localUsers: "/local-users",
      localUserInfos: "/local-user-infos",
      localUserRoles: "/local-user-roles",
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
