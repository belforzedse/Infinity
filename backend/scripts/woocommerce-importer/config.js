/**
 * Configuration for WooCommerce to Strapi Importer
 */

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
      localUsers: '/local-users'
    }
  },

  // Import Settings
  import: {
    // Batch sizes for different entities
    batchSizes: {
      categories: 50,
      products: 20,
      variations: 100,
      orders: 30
    },
    
    // Currency conversion (IRT to our internal format)
    currency: {
      from: 'IRT', // Iranian Toman
      to: 'IRR',   // Iranian Rial (internal)
      multiplier: 10 // 1 Toman = 10 Rial
    },

    // Image handling settings
    images: {
      enableUpload: true,
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      downloadTimeout: 30000,
      uploadTimeout: 60000,
      delayBetweenUploads: 500,
      cacheImages: true
    },

    // Status mappings
    statusMappings: {
      product: {
        'publish': 'Active',
        'draft': 'InActive',
        'private': 'InActive',
        'pending': 'InActive'
      },
      order: {
        'pending': 'Paying',
        'processing': 'Started',
        'on-hold': 'Started',
        'completed': 'Done',
        'cancelled': 'Cancelled',
        'refunded': 'Returned',
        'failed': 'Cancelled'
      },
      stock: {
        'instock': 'available',
        'outofstock': 'out_of_stock',
        'onbackorder': 'backorder'
      }
    },

    // Default values
    defaults: {
      productStatus: 'Active',
      orderType: 'Automatic',
      taxPercent: 10,
      contractType: 'Cash'
    }
  },

  // Logging and Progress Tracking
  logging: {
    level: 'info', // error, warn, info, debug
    saveToFile: true,
    logDir: './logs',
    progressInterval: 10 // Log progress every N items
  },

  // Duplicate Prevention
  duplicateTracking: {
    // Store external ID mappings in JSON files
    storageDir: './import-tracking',
    mappingFiles: {
      categories: 'category-mappings.json',
      products: 'product-mappings.json',
      variations: 'variation-mappings.json',
      orders: 'order-mappings.json'
    }
  },

  // Error Handling
  errorHandling: {
    maxRetries: 3,
    retryDelay: 2000, // ms
    continueOnError: true,
    saveFailedItems: true
  }
}; 