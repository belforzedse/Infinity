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
      timeout: 30000,
      headers: {
        'User-Agent': 'WooCommerce-Strapi-Importer/1.0'
      }
    });

    // Request interceptor for rate limiting
    this.client.interceptors.request.use(async (config) => {
      await this.rateLimitDelay();
      return config;
    });

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(`✅ WC API: ${response.config.method?.toUpperCase()} ${response.config.url} → ${response.status}`);
        return response;
      },
      (error) => {
        if (error.response) {
          this.logger.error(`❌ WC API Error: ${error.response.status} ${error.response.statusText} - ${error.response.config.url}`);
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
   * Create variation color
   */
  async createVariationColor(colorData) {
    const response = await this.retryRequest(() => 
      this.client.post('/product-variation-colors', { data: colorData })
    );
    return response.data;
  }

  /**
   * Create variation size
   */
  async createVariationSize(sizeData) {
    const response = await this.retryRequest(() => 
      this.client.post('/product-variation-sizes', { data: sizeData })
    );
    return response.data;
  }

  /**
   * Create variation model
   */
  async createVariationModel(modelData) {
    const response = await this.retryRequest(() => 
      this.client.post('/product-variation-models', { data: modelData })
    );
    return response.data;
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