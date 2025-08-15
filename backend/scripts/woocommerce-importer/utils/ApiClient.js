const axios = require('axios');

/**
 * Base API client with rate limiting and error handling
 */
class BaseApiClient {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.lastRequestTime = 0;
  }

  /**
   * Rate limiting - ensure we don't exceed API limits
   */
  async rateLimitDelay() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minDelay = this.config.rateLimiting?.delayBetweenRequests || 0;
    
    if (timeSinceLastRequest < minDelay) {
      const delay = minDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Retry mechanism for failed requests
   */
  async retryRequest(requestFn, maxRetries = 3, retryDelay = 2000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        this.logger.warn(`🔄 Request failed (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms:`, error.message);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    throw lastError;
  }
}

/**
 * WooCommerce API Client
 */
class WooCommerceClient extends BaseApiClient {
  constructor(config, logger) {
    super(config.woocommerce, logger);
    
    this.client = axios.create({
      baseURL: config.woocommerce.baseUrl,
      auth: {
        username: config.woocommerce.auth.consumerKey,
        password: config.woocommerce.auth.consumerSecret
      },
      timeout: 60000, // Increased to 60 seconds for slow responses
      headers: {
        'User-Agent': 'WooCommerce-Strapi-Importer/1.0'
      }
    });

    // Request interceptor for rate limiting
    this.client.interceptors.request.use(async (config) => {
      this.logger.info(`🔄 Making WC API request: ${config.method?.toUpperCase()} ${config.url}`);
      await this.rateLimitDelay();
      return config;
    });

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        this.logger.info(`✅ WC API Response: ${response.config.method?.toUpperCase()} ${response.config.url} → ${response.status} (${response.data?.length || 'unknown'} items)`);
        return response;
      },
      (error) => {
        if (error.response) {
          this.logger.error(`❌ WC API Error: ${error.response.status} ${error.response.statusText} - ${error.response.config.url}`);
          this.logger.error(`Error details: ${JSON.stringify(error.response.data)}`);
        } else if (error.code === 'ECONNABORTED') {
          this.logger.error(`❌ WC API Timeout: ${error.message} - ${error.config?.url}`);
        } else {
          this.logger.error(`❌ WC API Error: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get categories with pagination
   */
  async getCategories(page = 1, perPage = 50) {
    const response = await this.retryRequest(() => 
      this.client.get('/products/categories', {
        params: { page, per_page: perPage, orderby: 'id', order: 'asc' }
      })
    );
    
    return {
      data: response.data,
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '1'),
      totalItems: parseInt(response.headers['x-wp-total'] || '0')
    };
  }

  /**
   * Get products with pagination
   */
  async getProducts(page = 1, perPage = 20) {
    const response = await this.retryRequest(() => 
      this.client.get('/products', {
        params: { page, per_page: perPage, orderby: 'id', order: 'asc' }
      })
    );
    
    return {
      data: response.data,
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '1'),
      totalItems: parseInt(response.headers['x-wp-total'] || '0')
    };
  }

  /**
   * Get product variations
   */
  async getProductVariations(productId, page = 1, perPage = 100) {
    const response = await this.retryRequest(() => 
      this.client.get(`/products/${productId}/variations`, {
        params: { page, per_page: perPage }
      })
    );
    
    return {
      data: response.data,
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '1'),
      totalItems: parseInt(response.headers['x-wp-total'] || '0')
    };
  }

  /**
   * Get orders with pagination
   */
  async getOrders(page = 1, perPage = 30) {
    const response = await this.retryRequest(() => 
      this.client.get('/orders', {
        params: { page, per_page: perPage, orderby: 'id', order: 'asc' }
      })
    );
    
    return {
      data: response.data,
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '1'),
      totalItems: parseInt(response.headers['x-wp-total'] || '0')
    };
  }

  /**
   * Get customers with pagination
   */
  async getCustomers(page = 1, perPage = 50) {
    const response = await this.retryRequest(() => 
      this.client.get('/customers', {
        params: { page, per_page: perPage, orderby: 'id', order: 'asc' }
      })
    );
    
    return {
      data: response.data,
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '1'),
      totalItems: parseInt(response.headers['x-wp-total'] || '0')
    };
  }
}

/**
 * Strapi API Client
 */
class StrapiClient extends BaseApiClient {
  constructor(config, logger) {
    super(config.strapi, logger);
    
    this.client = axios.create({
      baseURL: config.strapi.baseUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${config.strapi.auth.token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'WooCommerce-Strapi-Importer/1.0'
      }
    });

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(`✅ Strapi API: ${response.config.method?.toUpperCase()} ${response.config.url} → ${response.status}`);
        return response;
      },
      (error) => {
        if (error.response) {
          this.logger.error(`❌ Strapi API Error: ${error.response.status} ${error.response.statusText} - ${error.response.config.url}`);
          this.logger.debug('Response data:', error.response.data);
        } else {
          this.logger.error(`❌ Strapi API Error: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Create a new category
   */
  async createCategory(categoryData) {
    const response = await this.retryRequest(() => 
      this.client.post('/product-categories', { data: categoryData })
    );
    return response.data;
  }

  /**
   * Get existing categories
   */
  async getCategories(params = {}) {
    const response = await this.retryRequest(() => 
      this.client.get('/product-categories', { params })
    );
    return response.data;
  }

  /**
   * Create a new product
   */
  async createProduct(productData) {
    const response = await this.retryRequest(() => 
      this.client.post('/products', { data: productData })
    );
    return response.data;
  }

  /**
   * Update an existing product
   */
  async updateProduct(productId, updateData) {
    const response = await this.retryRequest(() => 
      this.client.put(`/products/${productId}`, { data: updateData })
    );
    return response.data;
  }

  /**
   * Create a new product variation
   */
  async createProductVariation(variationData) {
    const response = await this.retryRequest(() => 
      this.client.post('/product-variations', { data: variationData })
    );
    return response.data;
  }

    /**
   * Find or create variation color
   */
  async createVariationColor(colorData) {
    try {
      // First try to find existing color by Title
      const existingByTitle = await this.retryRequest(() =>
        this.client.get('/product-variation-colors', {
          params: {
            'filters[Title][$eq]': colorData.Title
          }
        })
      );
      
      if (existingByTitle.data && existingByTitle.data.data && existingByTitle.data.data.length > 0) {
        return { data: existingByTitle.data.data[0] };
      }
      
      // Also check by ColorCode to avoid duplicates
      const existingByColor = await this.retryRequest(() =>
        this.client.get('/product-variation-colors', {
          params: {
            'filters[ColorCode][$eq]': colorData.ColorCode
          }
        })
      );
      
      if (existingByColor.data && existingByColor.data.data && existingByColor.data.data.length > 0) {
        return { data: existingByColor.data.data[0] };
      }
      
      // If not found, create new one
      const response = await this.retryRequest(() => 
        this.client.post('/product-variation-colors', { data: colorData })
      );
      return response.data;
    } catch (error) {
      
      // If creation fails, try to find again (race condition handling)
      try {
        // Check by Title first
        const existingByTitle = await this.retryRequest(() =>
          this.client.get('/product-variation-colors', {
            params: {
              'filters[Title][$eq]': colorData.Title
            }
          })
        );
        
        if (existingByTitle.data && existingByTitle.data.data && existingByTitle.data.data.length > 0) {
          return { data: existingByTitle.data.data[0] };
        }
        
        // Then check by ColorCode
        const existingByColor = await this.retryRequest(() =>
          this.client.get('/product-variation-colors', {
            params: {
              'filters[ColorCode][$eq]': colorData.ColorCode
            }
          })
        );
        
        if (existingByColor.data && existingByColor.data.data && existingByColor.data.data.length > 0) {
          return { data: existingByColor.data.data[0] };
        }
      } catch (findError) {
        // Ignore find error, throw original creation error
      }
      throw error;
    }
  }

  /**
   * Find or create variation size
   */
  async createVariationSize(sizeData) {
    try {
      // First try to find existing size by Title
      const existingResponse = await this.retryRequest(() =>
        this.client.get('/product-variation-sizes', {
          params: {
            'filters[Title][$eq]': sizeData.Title
          }
        })
      );
      
      if (existingResponse.data && existingResponse.data.data && existingResponse.data.data.length > 0) {
        return { data: existingResponse.data.data[0] };
      }
      
      // If not found, create new one
      const response = await this.retryRequest(() => 
        this.client.post('/product-variation-sizes', { data: sizeData })
      );
      return response.data;
    } catch (error) {
      // If creation fails, try to find again (race condition handling)
      try {
                 const existingResponse = await this.retryRequest(() =>
           this.client.get('/product-variation-sizes', {
             params: {
               'filters[Title][$eq]': sizeData.Title
             }
           })
         );
        
        if (existingResponse.data && existingResponse.data.data && existingResponse.data.data.length > 0) {
          return { data: existingResponse.data.data[0] };
        }
      } catch (findError) {
        // Ignore find error, throw original creation error
      }
      throw error;
    }
  }

  /**
   * Find or create variation model
   */
  async createVariationModel(modelData) {
    try {
      // First try to find existing model by Title
      const existingResponse = await this.retryRequest(() =>
        this.client.get('/product-variation-models', {
          params: {
            'filters[Title][$eq]': modelData.Title
          }
        })
      );
      
      if (existingResponse.data && existingResponse.data.data && existingResponse.data.data.length > 0) {
        return { data: existingResponse.data.data[0] };
      }
      
      // If not found, create new one
      const response = await this.retryRequest(() => 
        this.client.post('/product-variation-models', { data: modelData })
      );
      return response.data;
    } catch (error) {
      // If creation fails, try to find again (race condition handling)
      try {
                 const existingResponse = await this.retryRequest(() =>
           this.client.get('/product-variation-models', {
             params: {
               'filters[Title][$eq]': modelData.Title
             }
           })
         );
        
        if (existingResponse.data && existingResponse.data.data && existingResponse.data.data.length > 0) {
          return { data: existingResponse.data.data[0] };
        }
      } catch (findError) {
        // Ignore find error, throw original creation error
      }
      throw error;
    }
  }

  /**
   * Create product stock
   */
  async createProductStock(stockData) {
    const response = await this.retryRequest(() => 
      this.client.post('/product-stocks', { data: stockData })
    );
    return response.data;
  }

  /**
   * Create an order
   */
  async createOrder(orderData) {
    const response = await this.retryRequest(() => 
      this.client.post('/orders', { data: orderData })
    );
    return response.data;
  }

  /**
   * Create order item
   */
  async createOrderItem(orderItemData) {
    const response = await this.retryRequest(() => 
      this.client.post('/order-items', { data: orderItemData })
    );
    return response.data;
  }

  /**
   * Create contract
   */
  async createContract(contractData) {
    const response = await this.retryRequest(() => 
      this.client.post('/contracts', { data: contractData })
    );
    return response.data;
  }

  /**
   * Get all local users (for phone uniqueness check)
   */
  async getAllLocalUsers() {
    const response = await this.retryRequest(() => 
      this.client.get('/local-users', {
        params: { 
          'pagination[pageSize]': 1000, // Get a large batch for phone checking
          'fields[0]': 'Phone' // Only get phone field for efficiency
        }
      })
    );
    return response.data;
  }

  /**
   * Create local user
   */
  async createLocalUser(userData) {
    const response = await this.retryRequest(() => 
      this.client.post('/local-users', { data: userData })
    );
    return response.data;
  }

  /**
   * Create local user info
   */
  async createLocalUserInfo(userInfoData) {
    const response = await this.retryRequest(() => 
      this.client.post('/local-user-infos', { data: userInfoData })
    );
    return response.data;
  }

  /**
   * Create local user role
   */
  async createLocalUserRole(roleData) {
    const response = await this.retryRequest(() => 
      this.client.post('/local-user-roles', { data: roleData })
    );
    return response.data;
  }

  /**
   * Get existing items by external ID (stored in meta_data)
   */
  async findByExternalId(endpoint, externalId) {
    const response = await this.retryRequest(() => 
      this.client.get(endpoint, {
        params: {
          'filters[external_id][$eq]': externalId
        }
      })
    );
    return response.data;
  }

  /**
   * Generic create method
   */
  async create(endpoint, data) {
    const response = await this.retryRequest(() => 
      this.client.post(endpoint, { data })
    );
    return response.data;
  }

  /**
   * Generic get method
   */
  async get(endpoint, params = {}) {
    const response = await this.retryRequest(() => 
      this.client.get(endpoint, { params })
    );
    return response.data;
  }
}

module.exports = {
  WooCommerceClient,
  StrapiClient
}; 