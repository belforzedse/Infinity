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
    baseUrl: 'https://infinitycolor.co/wp-json/wc/v3',
    auth: {
      consumerKey: 'WOOCOMMERCE_CONSUMER_KEY',
      consumerSecret: 'WOOCOMMERCE_CONSUMER_SECRET'
    },
    // Rate limiting to avoid overwhelming the API
    rateLimiting: {
      requestsPerSecond: 2,
      delayBetweenRequests: 500 // ms
    }
  },

  // Strapi API Configuration
  strapi: {
    baseUrl: 'https://api.infinity.rgbgroup.ir/api',
    auth: {
      token: 'STRAPI_API_TOKEN'
    },
    endpoints: {
      categories: '/product-categories',
      products: '/products',
      variations: '/product-variations',
      variationColors: '/product-variation-colors',
      variationSizes: '/product-variation-sizes',
      variationModels: '/product-variation-models',
      stocks: '/product-stocks',
      orders: '/orders',
      orderItems: '/order-items',
      contracts: '/contracts',
      localUsers: '/local-users',
      localUserInfos: '/local-user-infos',
      localUserRoles: '/local-user-roles'
    }
  },

  // Import Settings
  import: {
    filters: {
      // Optional list of WooCommerce category IDs to restrict imports
      categoryIds: toArray(process.env.IMPORT_FILTER_CATEGORY_IDS)
    },
    // Batch sizes for different entities
    batchSizes: {
      categories: toNumber(process.env.IMPORT_BATCH_CATEGORIES, 100),
      products: toNumber(process.env.IMPORT_BATCH_PRODUCTS, 100), // WooCommerce API max
      variations: toNumber(process.env.IMPORT_BATCH_VARIATIONS, 100),
      orders: toNumber(process.env.IMPORT_BATCH_ORDERS, 50),
      users: toNumber(process.env.IMPORT_BATCH_USERS, 50)
    },
    
    // Currency conversion (IRT to our internal format)
    currency: {
      from: process.env.CURRENCY_FROM || 'IRT', // Iranian Toman
      to: process.env.CURRENCY_TO || 'IRR',   // Iranian Rial (internal)
      multiplier: toNumber(process.env.CURRENCY_MULTIPLIER, 1) // Default: 1 (no conversion, use WooCommerce prices as-is)
    },

    // Image handling settings
    images: {
      enableUpload: process.env.IMPORT_IMAGES_ENABLE_UPLOAD !== 'false', // Enabled by default (set to 'false' to disable)
      maxSize: toNumber(process.env.IMPORT_IMAGES_MAX_SIZE, 10 * 1024 * 1024), // 10MB
      allowedTypes: toArray(process.env.IMPORT_IMAGES_ALLOWED_TYPES, ['jpg', 'jpeg', 'png', 'gif', 'webp']),
      downloadTimeout: toNumber(process.env.IMPORT_IMAGES_DOWNLOAD_TIMEOUT, 30000),
      uploadTimeout: toNumber(process.env.IMPORT_IMAGES_UPLOAD_TIMEOUT, 60000),
      delayBetweenUploads: toNumber(process.env.IMPORT_IMAGES_DELAY, 500),
      cacheImages: process.env.IMPORT_IMAGES_CACHE !== 'false',
      conversion: {
        convertWebpToJpg: process.env.IMPORT_IMAGES_CONVERT_WEBP !== 'false',
        jpegQuality: toNumber(process.env.IMPORT_IMAGES_JPEG_QUALITY, 90),
        pngCompressionLevel: toNumber(process.env.IMPORT_IMAGES_PNG_COMPRESSION, 8),
        enableOptimization: process.env.IMPORT_IMAGES_ENABLE_OPTIMIZATION !== 'false'
      }
    },

    // Status mappings
    statusMappings: {
      product: {
        publish: 'Active',
        draft: 'InActive',
        private: 'InActive',
        pending: 'InActive'
      },
      order: {
        pending: 'Paying',
        processing: 'Started',
        'on-hold': 'Started',
        completed: 'Done',
        cancelled: 'Cancelled',
        refunded: 'Returned',
        failed: 'Cancelled'
      },
      stock: {
        instock: 'available',
        outofstock: 'out_of_stock',
        onbackorder: 'backorder'
      }
    },

    // Default values
    defaults: {
      productStatus: process.env.IMPORT_DEFAULT_PRODUCT_STATUS || 'Active',
      orderType: process.env.IMPORT_DEFAULT_ORDER_TYPE || 'Automatic',
      taxPercent: toNumber(process.env.IMPORT_DEFAULT_TAX_PERCENT, 10),
      contractType: process.env.IMPORT_DEFAULT_CONTRACT_TYPE || 'Cash',
      
      // Default variation attributes when not specified in WooCommerce
      variationAttributes: {
        color: {
          title: process.env.IMPORT_DEFAULT_COLOR_TITLE || 'خاکستری روشن', // Default in Persian
          colorCode: process.env.IMPORT_DEFAULT_COLOR_CODE || '#CCCCCC' // Light gray
        },
        size: {
          title: process.env.IMPORT_DEFAULT_SIZE_TITLE || 'یک سایز' // One size (free size) in Persian
        },
        model: {
          title: process.env.IMPORT_DEFAULT_MODEL_TITLE || 'استاندارد' // Standard in Persian
        }
      }
    }
  },

  // Logging and Progress Tracking
  logging: {
    level: process.env.IMPORT_LOG_LEVEL || 'info', // error, warn, info, debug
    saveToFile: process.env.IMPORT_LOG_SAVE_TO_FILE !== 'false',
    logDir: process.env.IMPORT_LOG_DIR || './logs',
    progressInterval: toNumber(process.env.IMPORT_PROGRESS_INTERVAL, 10) // Log progress every N items
  },

  // Duplicate Prevention
  duplicateTracking: {
    // Store external ID mappings in JSON files
    storageDir: process.env.IMPORT_TRACKING_DIR || './import-tracking',
    mappingFiles: {
      categories: process.env.IMPORT_TRACKING_CATEGORIES_FILE || 'category-mappings.json',
      products: process.env.IMPORT_TRACKING_PRODUCTS_FILE || 'product-mappings.json',
      variations: process.env.IMPORT_TRACKING_VARIATIONS_FILE || 'variation-mappings.json',
      orders: process.env.IMPORT_TRACKING_ORDERS_FILE || 'order-mappings.json',
      users: process.env.IMPORT_TRACKING_USERS_FILE || 'user-mappings.json'
    }
  },

  // Error Handling
  errorHandling: {
    maxRetries: toNumber(process.env.IMPORT_ERROR_MAX_RETRIES, 3),
    retryDelay: toNumber(process.env.IMPORT_ERROR_RETRY_DELAY, 2000), // ms
    continueOnError: process.env.IMPORT_ERROR_CONTINUE_ON_ERROR !== 'false',
    saveFailedItems: process.env.IMPORT_ERROR_SAVE_FAILED_ITEMS !== 'false'
  }
};
