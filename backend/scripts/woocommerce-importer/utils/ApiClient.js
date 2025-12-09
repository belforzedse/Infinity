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
      await new Promise((resolve) => setTimeout(resolve, delay));
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

        // Check if it's a DNS/network error
        const isNetworkError =
          error.code === "ENOTFOUND" ||
          error.code === "ECONNREFUSED" ||
          error.code === "ETIMEDOUT" ||
          error.message?.includes("getaddrinfo ENOTFOUND");

        if (isNetworkError && attempt === 1) {
          this.logger.error(
            `🌐 Network/DNS Error: Cannot resolve hostname. Please check:\n` +
              `   1. Internet connectivity\n` +
              `   2. DNS resolution (try: nslookup infinitycolor.co)\n` +
              `   3. Firewall/VPN settings\n` +
              `   4. Domain accessibility (try: curl https://infinitycolor.co)`,
          );
        }

        if (attempt === maxRetries) {
          break;
        }

        this.logger.warn(
          `🔄 Request failed (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms:`,
          error.message,
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
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

    this.consumerKey = config.woocommerce.auth.consumerKey;
    this.consumerSecret = config.woocommerce.auth.consumerSecret;

    this.client = axios.create({
      baseURL: config.woocommerce.baseUrl,
      auth: {
        username: this.consumerKey,
        password: this.consumerSecret,
      },
      timeout: 60000, // Increased to 60 seconds for slow responses
      headers: {
        "User-Agent": "WooCommerce-Strapi-Importer/1.0",
      },
    });

    // Request interceptor for rate limiting
    this.client.interceptors.request.use(async (requestConfig) => {
      this.logger.info(
        `🔄 Making WC API request: ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`,
      );
      await this.rateLimitDelay();

      // Some WooCommerce installations (including Infinity Store) block HTTP Basic auth
      // headers at the web server layer. To maintain compatibility we always append
      // the consumer key/secret as query parameters in addition to the Authorization
      // header so the request succeeds regardless of the server configuration.
      requestConfig.params = requestConfig.params || {};

      if (!requestConfig.params.consumer_key) {
        requestConfig.params.consumer_key = this.consumerKey;
      }

      if (!requestConfig.params.consumer_secret) {
        requestConfig.params.consumer_secret = this.consumerSecret;
      }

      return requestConfig;
    });

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        this.logger.info(
          `✅ WC API Response: ${response.config.method?.toUpperCase()} ${response.config.url} → ${
            response.status
          } (${response.data?.length || "unknown"} items)`,
        );
        return response;
      },
      (error) => {
        if (error.response) {
          this.logger.error(
            `❌ WC API Error: ${error.response.status} ${error.response.statusText} - ${error.response.config.url}`,
          );
          this.logger.error(`Error details: ${JSON.stringify(error.response.data)}`);
        } else if (error.code === "ECONNABORTED") {
          this.logger.error(`❌ WC API Timeout: ${error.message} - ${error.config?.url}`);
        } else {
          this.logger.error(`❌ WC API Error: ${error.message}`);
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * Get categories with pagination
   */
  async getCategories(page = 1, perPage = 50) {
    const response = await this.retryRequest(() =>
      this.client.get("/products/categories", {
        params: { page, per_page: perPage, orderby: "id", order: "asc" },
      }),
    );

    return {
      data: response.data,
      totalPages: parseInt(response.headers["x-wp-totalpages"] || "1"),
      totalItems: parseInt(response.headers["x-wp-total"] || "0"),
    };
  }

  /**
   * Get products with pagination and optional category filtering
   */
  async getProducts(page = 1, perPage = 20, categoryId = null, filters = {}) {
    const params = { page, per_page: perPage, orderby: "id", order: "asc" };

    // Add category filter if specified
    if (categoryId) {
      params.category = categoryId;
    }

    if (filters.createdAfter) {
      params.after = filters.createdAfter;
    }

    if (filters.createdBefore) {
      params.before = filters.createdBefore;
    }

    if (filters.modifiedAfter) {
      params.modified_after = filters.modifiedAfter;
    }

    if (filters.modifiedBefore) {
      params.modified_before = filters.modifiedBefore;
    }

    const response = await this.retryRequest(() => this.client.get("/products", { params }));

    return {
      data: response.data,
      totalPages: parseInt(response.headers["x-wp-totalpages"] || "1"),
      totalItems: parseInt(response.headers["x-wp-total"] || "0"),
    };
  }

  /**
   * Get product variations
   */
  async getProductVariations(productId, page = 1, perPage = 100) {
    const response = await this.retryRequest(() =>
      this.client.get(`/products/${productId}/variations`, {
        params: { page, per_page: perPage },
      }),
    );

    return {
      data: response.data,
      totalPages: parseInt(response.headers["x-wp-totalpages"] || "1"),
      totalItems: parseInt(response.headers["x-wp-total"] || "0"),
    };
  }

  /**
   * Get product by slug from WooCommerce
   */
  async getProductBySlug(slug) {
    try {
      // Decode slug in case it's URL-encoded
      const decodedSlug = decodeURIComponent(slug);
      const response = await this.retryRequest(() =>
        this.client.get("/products", {
          params: { slug: decodedSlug, per_page: 1 },
        }),
      );

      if (response.data && response.data.length > 0) {
        return response.data[0];
      }

      // If not found with decoded slug, try encoded
      if (decodedSlug !== slug) {
        const encodedResponse = await this.retryRequest(() =>
          this.client.get("/products", {
            params: { slug: slug, per_page: 1 },
          }),
        );

        if (encodedResponse.data && encodedResponse.data.length > 0) {
          return encodedResponse.data[0];
        }
      }

      return null;
    } catch (error) {
      this.logger.warn(`⚠️ Failed to get product by slug "${slug}": ${error.message}`);
      return null;
    }
  }

  /**
   * Get orders with pagination
   */
  async getOrders(page = 1, perPage = 30) {
    const response = await this.retryRequest(() =>
      this.client.get("/orders", {
        params: { page, per_page: perPage, orderby: "id", order: "asc" },
      }),
    );

    return {
      data: response.data,
      totalPages: parseInt(response.headers["x-wp-totalpages"] || "1"),
      totalItems: parseInt(response.headers["x-wp-total"] || "0"),
    };
  }

  /**
   * Get customers with pagination
   */
  async getCustomers(page = 1, perPage = 50) {
    const response = await this.retryRequest(() =>
      this.client.get("/customers", {
        params: { page, per_page: perPage, orderby: "id", order: "asc" },
      }),
    );

    return {
      data: response.data,
      totalPages: parseInt(response.headers["x-wp-totalpages"] || "1"),
      totalItems: parseInt(response.headers["x-wp-total"] || "0"),
    };
  }
}

/**
 * WordPress API Client (posts, categories, tags, media, users)
 */
class WordPressClient extends BaseApiClient {
  constructor(config, logger) {
    super(config.wordpress, logger);

    this.username = config.wordpress.auth.username;
    this.password = config.wordpress.auth.password;
    this.useEmbeddedResponses = config.wordpress.useEmbeddedResponses;

    this.client = axios.create({
      baseURL: config.wordpress.baseUrl,
      timeout: 60000,
      auth:
        this.username && this.password
          ? {
              username: this.username,
              password: this.password,
            }
          : undefined,
      headers: {
        "User-Agent": "WordPress-Strapi-Importer/1.0",
      },
    });

    // Request interceptor for rate limiting
    this.client.interceptors.request.use(async (requestConfig) => {
      this.logger.info(
        `🔄 Making WP API request: ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`,
      );
      await this.rateLimitDelay();

      requestConfig.params = requestConfig.params || {};
      if (this.useEmbeddedResponses && requestConfig.method?.toLowerCase() === "get") {
        requestConfig.params._embed = 1;
      }

      return requestConfig;
    });

    this.client.interceptors.response.use(
      (response) => {
        this.logger.info(
          `✅ WP API Response: ${response.config.method?.toUpperCase()} ${response.config.url} → ${
            response.status
          }`,
        );
        return response;
      },
      (error) => {
        if (error.response) {
          this.logger.error(
            `❌ WP API Error: ${error.response.status} ${error.response.statusText} - ${error.response.config.url}`,
          );
          if (error.response.data) {
            this.logger.error(`Error details: ${JSON.stringify(error.response.data)}`);
          }
        } else {
          this.logger.error(`❌ WP API Error: ${error.message}`);
        }
        return Promise.reject(error);
      },
    );
  }

  async getPosts(page = 1, perPage = 20, options = {}) {
    const params = {
      page,
      per_page: perPage,
      orderby: "date",
      order: "desc",
      status: options.status || "publish",
    };

    if (options.after) {
      params.after = options.after;
    }

    if (options.search) {
      params.search = options.search;
    }

    if (options.category) {
      params.categories = options.category;
    }

    if (options.tag) {
      params.tags = options.tag;
    }

    const response = await this.retryRequest(() => this.client.get("/posts", { params }));

    return {
      data: response.data,
      totalPages: parseInt(response.headers["x-wp-totalpages"] || "1", 10),
      totalItems: parseInt(response.headers["x-wp-total"] || "0", 10),
    };
  }

  async getCategory(id) {
    const response = await this.retryRequest(() => this.client.get(`/categories/${id}`));
    return response.data;
  }

  async getTag(id) {
    const response = await this.retryRequest(() => this.client.get(`/tags/${id}`));
    return response.data;
  }

  async getUser(id) {
    const response = await this.retryRequest(() => this.client.get(`/users/${id}`));
    return response.data;
  }

  async getMedia(id) {
    const response = await this.retryRequest(() => this.client.get(`/media/${id}`));
    return response.data;
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
        Authorization: `Bearer ${config.strapi.auth.token}`,
        "Content-Type": "application/json",
        "User-Agent": "WooCommerce-Strapi-Importer/1.0",
      },
    });

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(
          `✅ Strapi API: ${response.config.method?.toUpperCase()} ${response.config.url} → ${
            response.status
          }`,
        );
        return response;
      },
        (error) => {
          if (error.response) {
            this.logger.error(
              `❌ Strapi API Error: ${error.response.status} ${error.response.statusText} - ${error.response.config.url}`,
            );
            // Log error details at ERROR level, not DEBUG, so users can see what validation failed
            if (error.response.data?.error) {
              this.logger.error(
                `Error details: ${JSON.stringify(error.response.data.error, null, 2)}`,
              );
            } else if (error.response.data) {
              this.logger.error(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
            }
          } else {
            this.logger.error(`❌ Strapi API Error: ${error.message}`);
          }
          return Promise.reject(error);
        },
    );
  }

  /**
   * Create a new category
   */
  async createCategory(categoryData) {
    const response = await this.retryRequest(() =>
      this.client.post("/product-categories", { data: categoryData }),
    );
    return response.data;
  }

  /**
   * Get existing categories
   */
  async getCategories(params = {}) {
    const response = await this.retryRequest(() =>
      this.client.get("/product-categories", { params }),
    );
    return response.data;
  }

  /**
   * Create a new product
   */
  async createProduct(productData) {
    const response = await this.retryRequest(() =>
      this.client.post("/products", { data: productData }),
    );
    return response.data;
  }

  /**
   * Get a product by ID
   */
  async getProductById(productId) {
    const response = await this.retryRequest(() =>
      this.client.get(`/products/${productId}`, {
        params: {
          "populate[0]": "CoverImage",
          "populate[1]": "product_main_category",
        },
      }),
    );
    return response.data;
  }

  /**
   * Get a product by slug
   */
  async getProductBySlug(slug) {
    const response = await this.retryRequest(() =>
      this.client.get("/products", {
        params: {
          "filters[Slug][$eq]": slug,
          "populate[0]": "CoverImage",
          "populate[1]": "product_main_category",
          "pagination[pageSize]": 1,
        },
      }),
    );
    return this.extractFirstEntry(response.data ?? response);
  }

  /**
   * Update an existing product
   */
  async updateProduct(productId, updateData) {
    const response = await this.retryRequest(() =>
      this.client.put(`/products/${productId}`, { data: updateData }),
    );
    return response.data;
  }

  /**
   * Find existing product size helper for a product
   */
  async findProductSizeHelper(productId) {
    const response = await this.retryRequest(() =>
      this.client.get("/product-size-helpers", {
        params: {
          "filters[product][id][$eq]": productId,
        },
      }),
    );
    if (response.data?.data && response.data.data.length > 0) {
      return response.data.data[0];
    }
    return null;
  }

  /**
   * Create or update the size helper associated with a product
   */
  async syncProductSizeHelper(productId, helperMatrix) {
    const existingHelper = await this.findProductSizeHelper(productId);

    // If no helper data provided, delete existing helper if present
    if (!helperMatrix) {
      if (existingHelper) {
        await this.retryRequest(() =>
          this.client.delete(`/product-size-helpers/${existingHelper.id}`),
        );
      }
      return null;
    }

    if (existingHelper) {
      const response = await this.retryRequest(() =>
        this.client.put(`/product-size-helpers/${existingHelper.id}`, {
          data: {
            Helper: helperMatrix,
          },
        }),
      );
      return response.data;
    }

    const response = await this.retryRequest(() =>
      this.client.post("/product-size-helpers", {
        data: {
          Helper: helperMatrix,
          product: productId,
        },
      }),
    );
    return response.data;
  }

  /**
   * Update an existing product variation
   */
  async updateProductVariation(variationId, updateData) {
    const response = await this.retryRequest(() =>
      this.client.put(`/product-variations/${variationId}`, { data: updateData }),
    );
    return response.data;
  }

  /**
   * Create a new product variation
   */
  async createProductVariation(variationData) {
    const response = await this.retryRequest(() =>
      this.client.post("/product-variations", { data: variationData }),
    );
    return response.data;
  }

  /**
   * Shipping helpers (provinces/cities)
   */
  async findShippingProvinceByTitle(title) {
    const response = await this.retryRequest(() =>
      this.client.get("/shipping-provinces", {
        params: {
          "filters[Title][$eq]": title,
          "pagination[pageSize]": 1,
        },
      }),
    );
    return response.data?.data?.[0] || null;
  }

  async createShippingProvince(data) {
    const response = await this.retryRequest(() =>
      this.client.post("/shipping-provinces", { data }),
    );
    return response.data?.data;
  }

  async updateShippingProvince(id, data) {
    const response = await this.retryRequest(() =>
      this.client.put(`/shipping-provinces/${id}`, { data }),
    );
    return response.data?.data;
  }

  async findShippingCity(title, provinceId) {
    const response = await this.retryRequest(() =>
      this.client.get("/shipping-cities", {
        params: {
          "filters[Title][$eq]": title,
          "filters[shipping_province][id][$eq]": provinceId,
          "pagination[pageSize]": 1,
        },
      }),
    );
    return response.data?.data?.[0] || null;
  }

  async createShippingCity(data) {
    const response = await this.retryRequest(() => this.client.post("/shipping-cities", { data }));
    return response.data?.data;
  }

  async updateShippingCity(id, data) {
    const response = await this.retryRequest(() =>
      this.client.put(`/shipping-cities/${id}`, { data }),
    );
    return response.data?.data;
  }

  /**
   * Find or create variation color
   */
  async createVariationColor(colorData) {
    try {
      // First try to find existing color by Title
      const existingByTitle = await this.retryRequest(() =>
        this.client.get("/product-variation-colors", {
          params: {
            "filters[Title][$eq]": colorData.Title,
          },
        }),
      );

      if (existingByTitle.data?.data && existingByTitle.data.data.length > 0) {
        // Return in consistent format { data: {...} }
        return { data: existingByTitle.data.data[0] };
      }

      // Also check by ColorCode to avoid duplicates
      const existingByColor = await this.retryRequest(() =>
        this.client.get("/product-variation-colors", {
          params: {
            "filters[ColorCode][$eq]": colorData.ColorCode,
          },
        }),
      );

      if (existingByColor.data?.data && existingByColor.data.data.length > 0) {
        // Return in consistent format { data: {...} }
        return { data: existingByColor.data.data[0] };
      }

      // If not found, create new one
      const response = await this.retryRequest(() =>
        this.client.post("/product-variation-colors", { data: colorData }),
      );
      return response.data;
    } catch (error) {
      // If creation fails, try to find again (race condition handling)
      try {
        // Check by Title first
        const existingByTitle = await this.retryRequest(() =>
          this.client.get("/product-variation-colors", {
            params: {
              "filters[Title][$eq]": colorData.Title,
            },
          }),
        );

        if (existingByTitle.data?.data && existingByTitle.data.data.length > 0) {
          return { data: existingByTitle.data.data[0] };
        }

        // Then check by ColorCode
        const existingByColor = await this.retryRequest(() =>
          this.client.get("/product-variation-colors", {
            params: {
              "filters[ColorCode][$eq]": colorData.ColorCode,
            },
          }),
        );

        if (existingByColor.data?.data && existingByColor.data.data.length > 0) {
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
        this.client.get("/product-variation-sizes", {
          params: {
            "filters[Title][$eq]": sizeData.Title,
          },
        }),
      );

      if (
        existingResponse.data &&
        existingResponse.data.data &&
        existingResponse.data.data.length > 0
      ) {
        return { data: existingResponse.data.data[0] };
      }

      // If not found, create new one
      const response = await this.retryRequest(() =>
        this.client.post("/product-variation-sizes", { data: sizeData }),
      );
      return response.data;
    } catch (error) {
      // If creation fails, try to find again (race condition handling)
      try {
        const existingResponse = await this.retryRequest(() =>
          this.client.get("/product-variation-sizes", {
            params: {
              "filters[Title][$eq]": sizeData.Title,
            },
          }),
        );

        if (
          existingResponse.data &&
          existingResponse.data.data &&
          existingResponse.data.data.length > 0
        ) {
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
        this.client.get("/product-variation-models", {
          params: {
            "filters[Title][$eq]": modelData.Title,
          },
        }),
      );

      if (
        existingResponse.data &&
        existingResponse.data.data &&
        existingResponse.data.data.length > 0
      ) {
        return { data: existingResponse.data.data[0] };
      }

      // If not found, create new one
      const response = await this.retryRequest(() =>
        this.client.post("/product-variation-models", { data: modelData }),
      );
      return response.data;
    } catch (error) {
      // If creation fails, try to find again (race condition handling)
      try {
        const existingResponse = await this.retryRequest(() =>
          this.client.get("/product-variation-models", {
            params: {
              "filters[Title][$eq]": modelData.Title,
            },
          }),
        );

        if (
          existingResponse.data &&
          existingResponse.data.data &&
          existingResponse.data.data.length > 0
        ) {
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
      this.client.post("/product-stocks", { data: stockData }),
    );
    return response.data;
  }

  /**
   * Update an existing product stock
   */
  async updateProductStock(stockId, stockData) {
    const response = await this.retryRequest(() =>
      this.client.put(`/product-stocks/${stockId}`, { data: stockData }),
    );
    return response.data;
  }

  /**
   * Create an order
   */
  async createOrder(orderData) {
    const response = await this.retryRequest(() =>
      this.client.post("/orders", { data: orderData }),
    );
    return response.data;
  }

  /**
   * Create order item
   */
  async createOrderItem(orderItemData) {
    const response = await this.retryRequest(() =>
      this.client.post("/order-items", { data: orderItemData }),
    );
    return response.data;
  }

  /**
   * Create contract
   */
  async createContract(contractData) {
    const response = await this.retryRequest(() =>
      this.client.post("/contracts", { data: contractData }),
    );
    return response.data;
  }

  /**
   * Get all plugin users (for phone uniqueness check)
   */
  async getAllPluginUsers(params = {}) {
    const response = await this.retryRequest(() =>
      this.client.get("/users", {
        params: {
          ...params,
          "pagination[pageSize]": params["pagination[pageSize]"] || 1000,
        },
      }),
    );
    return response.data ?? response;
  }

  /**
   * Find a local user by external ID
   */
  async findPluginUserByExternalId(externalId) {
    if (!externalId) {
      return null;
    }

    const response = await this.retryRequest(() =>
      this.client.get("/users", {
        params: {
          "filters[external_id][$eq]": externalId,
          "pagination[pageSize]": 1,
        },
      }),
    );

    return this.extractFirstEntry(response.data ?? response);
  }

  /**
   * Find a local user by phone number
   */
  async findPluginUserByPhone(phone) {
    if (!phone) {
      return null;
    }

    const response = await this.retryRequest(() =>
      this.client.get("/users", {
        params: {
          "filters[phone][$eq]": phone,
          "pagination[pageSize]": 1,
        },
      }),
    );

    return this.extractFirstEntry(response.data ?? response);
  }

  /**
   * Find a plugin user by email
   */
  async findPluginUserByEmail(email) {
    if (!email) {
      return null;
    }

    const response = await this.retryRequest(() =>
      this.client.get("/users", {
        params: {
          "filters[email][$eq]": email,
          "pagination[pageSize]": 1,
        },
      }),
    );

    return this.extractFirstEntry(response.data ?? response);
  }

  /**
   * Extract the first entity from a Strapi collection response
   */
  extractFirstEntry(responseData) {
    if (!responseData) {
      return null;
    }

    const items = Array.isArray(responseData?.data)
      ? responseData.data
      : Array.isArray(responseData)
      ? responseData
      : [];
    if (items.length === 0) {
      return null;
    }

    return items[0];
  }

  /**
   * Create local user
   */
  async createPluginUser(userData) {
    const response = await this.retryRequest(() => this.client.post("/users", userData));
    return response.data ?? response;
  }

  /**
   * Create local user info (profile record linked to plugin user)
   */
  async createLocalUserInfo(userInfoData) {
    const response = await this.retryRequest(() =>
      this.client.post("/local-user-infos", { data: userInfoData }),
    );
    return response.data;
  }

  /**
   * Fetch plugin roles
   */
  async getPluginRoles() {
    const response = await this.retryRequest(() => this.client.get("/users-permissions/roles"));
    return response.data?.roles ?? response.data ?? response;
  }

  /**
   * Blog helpers
   */
  async findBlogCategoryBySlug(slug) {
    if (!slug) {
      return null;
    }

    const response = await this.retryRequest(() =>
      this.client.get("/blog-categories", {
        params: {
          "filters[Slug][$eq]": slug,
          "pagination[pageSize]": 1,
        },
      }),
    );

    return this.extractFirstEntry(response.data);
  }

  async createBlogCategory(data) {
    const response = await this.retryRequest(() => this.client.post("/blog-categories", { data }));
    return response.data;
  }

  async findBlogTagBySlug(slug) {
    if (!slug) {
      return null;
    }

    const response = await this.retryRequest(() =>
      this.client.get("/blog-tags", {
        params: {
          "filters[Slug][$eq]": slug,
          "pagination[pageSize]": 1,
        },
      }),
    );

    return this.extractFirstEntry(response.data);
  }

  async createBlogTag(data) {
    const response = await this.retryRequest(() => this.client.post("/blog-tags", { data }));
    return response.data;
  }

  async findBlogAuthorByEmailOrName(email, name) {
    if (email) {
      const byEmail = await this.retryRequest(() =>
        this.client.get("/blog-authors", {
          params: {
            "filters[Email][$eq]": email,
            "pagination[pageSize]": 1,
          },
        }),
      );
      const emailMatch = this.extractFirstEntry(byEmail.data);
      if (emailMatch) {
        return emailMatch;
      }
    }

    if (name) {
      const byName = await this.retryRequest(() =>
        this.client.get("/blog-authors", {
          params: {
            "filters[Name][$eq]": name,
            "pagination[pageSize]": 1,
          },
        }),
      );
      const nameMatch = this.extractFirstEntry(byName.data);
      if (nameMatch) {
        return nameMatch;
      }
    }

    return null;
  }

  async createBlogAuthor(data) {
    const response = await this.retryRequest(() => this.client.post("/blog-authors", { data }));
    return response.data;
  }

  async updateBlogAuthor(id, data) {
    const response = await this.retryRequest(() =>
      this.client.put(`/blog-authors/${id}`, { data }),
    );
    return response.data;
  }

  async findBlogPostBySlug(slug) {
    if (!slug) {
      return null;
    }

    const response = await this.retryRequest(() =>
      this.client.get("/blog-posts", {
        params: {
          "filters[Slug][$eq]": slug,
          "pagination[pageSize]": 1,
          populate: "blog_author,blog_category,blog_tags,FeaturedImage",
        },
      }),
    );

    return this.extractFirstEntry(response.data);
  }

  async createBlogPost(data) {
    const response = await this.retryRequest(() => this.client.post("/blog-posts", { data }));
    return response.data;
  }

  async updateBlogPost(id, data) {
    const response = await this.retryRequest(() => this.client.put(`/blog-posts/${id}`, { data }));
    return response.data;
  }

  /**
   * Get existing items by external ID (stored in meta_data)
   */
  async findByExternalId(endpoint, externalId) {
    const response = await this.retryRequest(() =>
      this.client.get(endpoint, {
        params: {
          "filters[external_id][$eq]": externalId,
        },
      }),
    );
    return response.data;
  }

  /**
   * Generic create method
   */
  async create(endpoint, data) {
    const response = await this.retryRequest(() => this.client.post(endpoint, { data }));
    return response.data;
  }

  /**
   * Generic update method
   */
  async update(endpoint, id, data) {
    const response = await this.retryRequest(() => this.client.put(`${endpoint}/${id}`, { data }));
    return response.data;
  }

  /**
   * Generic get method
   */
  async get(endpoint, params = {}) {
    const response = await this.retryRequest(() => this.client.get(endpoint, { params }));
    return response.data;
  }
}

module.exports = {
  WooCommerceClient,
  StrapiClient,
  WordPressClient,
};
