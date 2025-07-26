const { WooCommerceClient, StrapiClient } = require('../utils/ApiClient');
const DuplicateTracker = require('../utils/DuplicateTracker');

/**
 * Order Importer - Handles importing WooCommerce orders to Strapi
 * 
 * Features:
 * - Order data transformation
 * - Customer data handling (guest orders)
 * - Order items processing
 * - Contract and transaction creation
 * - Address management
 * - Status mapping
 * - Duplicate prevention
 */
class OrderImporter {
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
      endTime: null,
      ordersCreated: 0,
      orderItemsCreated: 0,
      contractsCreated: 0,
      guestUsersCreated: 0
    };

    // Caches for faster lookups
    this.variationMappingCache = new Map();
    this.userCache = new Map(); // Cache for guest users created
  }

  /**
   * Main import method
   */
  async import(options = {}) {
    const { limit = 50, page = 1, dryRun = false } = options;
    
    this.stats.startTime = Date.now();
    this.logger.info(`📦 Starting order import (limit: ${limit}, page: ${page}, dryRun: ${dryRun})`);
    
    try {
      // Pre-load mappings for faster lookups
      await this.loadMappingCaches();
      
      // Get all orders from WooCommerce
      const allOrders = await this.fetchAllOrders(limit, page);
      this.stats.total = allOrders.length;
      
      if (allOrders.length === 0) {
        this.logger.warn('📭 No orders found to import');
        return this.stats;
      }
      
      this.logger.info(`📊 Found ${allOrders.length} orders to process`);
      
      // Start progress tracking
      this.logger.startProgress(allOrders.length, 'Importing orders');
      
      // Import orders
      for (const wcOrder of allOrders) {
        try {
          await this.importSingleOrder(wcOrder, dryRun);
          this.logger.updateProgress();
        } catch (error) {
          this.stats.errors++;
          this.logger.error(`❌ Failed to import order ${wcOrder.id}:`, error.message);
          
          if (!this.config.errorHandling.continueOnError) {
            throw error;
          }
        }
      }
      
      this.logger.completeProgress();
      
    } catch (error) {
      this.stats.errors++;
      this.logger.error('❌ Order import failed:', error);
      throw error;
    } finally {
      this.stats.endTime = Date.now();
      this.stats.duration = this.stats.endTime - this.stats.startTime;
      this.logFinalStats();
    }
    
    return this.stats;
  }

  /**
   * Load all mapping caches
   */
  async loadMappingCaches() {
    this.logger.debug('📂 Loading mapping caches...');
    
    // Load variation mappings for order items
    const variationMappings = this.duplicateTracker.getAllMappings('variations');
    for (const [wcId, mapping] of Object.entries(variationMappings)) {
      this.variationMappingCache.set(parseInt(wcId), mapping.strapiId);
    }
    
    this.logger.info(`📂 Loaded ${this.variationMappingCache.size} variation mappings`);
  }

  /**
   * Fetch all orders from WooCommerce with pagination
   */
  async fetchAllOrders(limit, startPage) {
    let allOrders = [];
    let currentPage = startPage;
    let totalFetched = 0;
    
    this.logger.info(`📥 Fetching orders from WooCommerce...`);
    
    while (totalFetched < limit) {
      const remainingLimit = limit - totalFetched;
      const perPage = Math.min(this.config.import.batchSizes.orders, remainingLimit);
      
      this.logger.debug(`Fetching page ${currentPage} (${perPage} items)`);
      
      const result = await this.wooClient.getOrders(currentPage, perPage);
      
      if (!result.data || result.data.length === 0) {
        this.logger.info(`📄 No more orders found on page ${currentPage}`);
        break;
      }
      
      allOrders = allOrders.concat(result.data);
      totalFetched += result.data.length;
      currentPage++;
      
      this.logger.debug(`📊 Fetched ${result.data.length} orders (total: ${totalFetched})`);
      
      if (currentPage > result.totalPages) {
        break;
      }
    }
    
    this.logger.info(`✅ Fetched ${allOrders.length} orders from WooCommerce`);
    return allOrders;
  }

  /**
   * Import a single order
   */
  async importSingleOrder(wcOrder, dryRun = false) {
    this.logger.debug(`📦 Processing order: ${wcOrder.id} - ${wcOrder.status}`);
    
    // Check for duplicates
    const duplicateCheck = this.duplicateTracker.checkDuplicate('orders', wcOrder);
    if (duplicateCheck.isDuplicate) {
      this.stats.skipped++;
      return duplicateCheck;
    }
    
    try {
      // Handle customer (guest or registered)
      const customerId = await this.handleCustomer(wcOrder, dryRun);
      
      // Transform order to Strapi format
      const strapiOrder = await this.transformOrder(wcOrder, customerId);
      
      if (dryRun) {
        this.logger.info(`🔍 [DRY RUN] Would import order: ${wcOrder.id} (${wcOrder.status})`);
        this.stats.success++;
        return { isDryRun: true, data: strapiOrder };
      }
      
      // Create order in Strapi
      const orderResult = await this.strapiClient.createOrder(strapiOrder);
      this.stats.ordersCreated++;
      
      // Create order items
      await this.createOrderItems(orderResult.data.id, wcOrder);
      
      // Create contract
      await this.createContract(orderResult.data.id, wcOrder, customerId);
      
      // Record the mapping
      this.duplicateTracker.recordMapping(
        'orders',
        wcOrder.id,
        orderResult.data.id,
        {
          status: wcOrder.status,
          total: wcOrder.total,
          currency: wcOrder.currency,
          date: wcOrder.date_created
        }
      );
      
      this.stats.success++;
      this.logger.debug(`✅ Created order: ${wcOrder.id} → ID: ${orderResult.data.id}`);
      
      return orderResult;
      
    } catch (error) {
      this.stats.failed++;
      this.logger.error(`❌ Failed to create order ${wcOrder.id}:`, error.message);
      throw error;
    }
  }

  /**
   * Handle customer creation for guest orders
   */
  async handleCustomer(wcOrder, dryRun = false) {
    // Check if customer already exists or is registered
    if (wcOrder.customer_id && wcOrder.customer_id !== 0) {
      // For registered customers, we would need to map WC customer to Strapi user
      // For now, we'll treat all as guest orders
      this.logger.debug(`📝 Order has registered customer ID: ${wcOrder.customer_id}`);
    }
    
    // Create guest user based on billing information
    if (wcOrder.billing && wcOrder.billing.phone) {
      const phone = wcOrder.billing.phone;
      
      // Check cache first
      if (this.userCache.has(phone)) {
        return this.userCache.get(phone);
      }
      
      if (dryRun) {
        return null; // Don't create in dry run
      }
      
      try {
        // Create guest user
        const guestUser = await this.createGuestUser(wcOrder.billing);
        this.userCache.set(phone, guestUser.data.id);
        this.stats.guestUsersCreated++;
        return guestUser.data.id;
      } catch (error) {
        this.logger.warn(`⚠️ Failed to create guest user for order ${wcOrder.id}:`, error.message);
        return null; // Continue without user link
      }
    }
    
    return null;
  }

  /**
   * Create guest user from billing information
   */
  async createGuestUser(billing) {
    const userData = {
      Phone: billing.phone,
      IsActive: false, // Guest users are inactive by default
      IsVerified: false,
      external_id: `guest_${billing.phone}`,
      external_source: 'woocommerce_guest'
    };
    
    const userResult = await this.strapiClient.create('/local-users', userData);
    
    // Create user info if we have name data
    if (userResult.data && (billing.first_name || billing.last_name)) {
      const userInfoData = {
        FirstName: billing.first_name || '',
        LastName: billing.last_name || '',
        user: userResult.data.id
      };
      
      try {
        await this.strapiClient.create('/local-user-infos', userInfoData);
      } catch (error) {
        this.logger.warn(`⚠️ Failed to create user info for guest:`, error.message);
      }
    }
    
    this.logger.debug(`👤 Created guest user: ${billing.phone} → ID: ${userResult.data.id}`);
    return userResult;
  }

  /**
   * Transform WooCommerce order to Strapi format
   */
  async transformOrder(wcOrder, customerId) {
    const strapiOrder = {
      Date: new Date(wcOrder.date_created).toISOString(),
      Status: this.mapOrderStatus(wcOrder.status),
      Type: this.config.import.defaults.orderType,
      ShippingCost: this.convertPrice(wcOrder.shipping_total),
      Description: wcOrder.customer_note || '',
      Note: `WooCommerce Order #${wcOrder.id}`,
      // Store WooCommerce ID for reference
      external_id: wcOrder.id.toString(),
      external_source: 'woocommerce'
    };

    // Link to user if available
    if (customerId) {
      strapiOrder.user = customerId;
    }

    // Handle shipping method
    if (wcOrder.shipping_lines && wcOrder.shipping_lines.length > 0) {
      const shippingMethod = wcOrder.shipping_lines[0];
      strapiOrder._shippingMethod = {
        title: shippingMethod.method_title,
        cost: shippingMethod.total
      };
    }

    this.logger.debug(`🔄 Transformed order: ${wcOrder.id} → Status: ${strapiOrder.Status}`);
    return strapiOrder;
  }

  /**
   * Create order items
   */
  async createOrderItems(orderId, wcOrder) {
    if (!wcOrder.line_items || wcOrder.line_items.length === 0) {
      return;
    }

    for (const lineItem of wcOrder.line_items) {
      try {
        const orderItemData = {
          Count: lineItem.quantity,
          PerAmount: this.convertPrice(lineItem.price),
          ProductSKU: lineItem.sku || `WC-${lineItem.product_id}`,
          ProductTitle: lineItem.name,
          order: orderId,
          external_id: `line_item_${lineItem.id}`,
          external_source: 'woocommerce'
        };

        // Link to product variation if available
        if (lineItem.variation_id && lineItem.variation_id !== 0) {
          const variationStrapiId = this.variationMappingCache.get(lineItem.variation_id);
          if (variationStrapiId) {
            orderItemData.product_variation = variationStrapiId;
            this.logger.debug(`🔗 Linked order item to variation ID: ${variationStrapiId}`);
          }
        }

        const result = await this.strapiClient.createOrderItem(orderItemData);
        this.stats.orderItemsCreated++;
        this.logger.debug(`📦 Created order item: ${lineItem.name} x${lineItem.quantity}`);
        
      } catch (error) {
        this.logger.error(`❌ Failed to create order item for line ${lineItem.id}:`, error.message);
      }
    }
  }

  /**
   * Create contract for the order
   */
  async createContract(orderId, wcOrder, customerId) {
    const contractData = {
      Amount: this.convertPrice(wcOrder.total),
      Date: new Date(wcOrder.date_created).toISOString(),
      Type: this.config.import.defaults.contractType,
      Status: this.mapContractStatus(wcOrder.status),
      TaxPercent: this.config.import.defaults.taxPercent,
      order: orderId,
      external_id: `contract_${wcOrder.id}`,
      external_source: 'woocommerce'
    };

    // Link to user if available
    if (customerId) {
      contractData.local_user = customerId;
    }

    try {
      const contractResult = await this.strapiClient.createContract(contractData);
      this.stats.contractsCreated++;
      this.logger.debug(`💼 Created contract for order ${wcOrder.id} → ID: ${contractResult.data.id}`);
      
      // Create contract transaction if payment method is available
      if (wcOrder.payment_method && wcOrder.status !== 'pending') {
        await this.createContractTransaction(contractResult.data.id, wcOrder);
      }
      
      return contractResult;
    } catch (error) {
      this.logger.error(`❌ Failed to create contract for order ${wcOrder.id}:`, error.message);
      throw error;
    }
  }

  /**
   * Create contract transaction
   */
  async createContractTransaction(contractId, wcOrder) {
    const transactionData = {
      Amount: this.convertPrice(wcOrder.total),
      Type: this.mapPaymentType(wcOrder.payment_method),
      Status: this.mapTransactionStatus(wcOrder.status),
      Step: 1,
      Date: new Date(wcOrder.date_created).toISOString(),
      DiscountAmount: this.convertPrice(wcOrder.discount_total),
      TrackId: wcOrder.transaction_id || wcOrder.order_key,
      contract: contractId,
      external_id: `transaction_${wcOrder.id}`,
      external_source: 'woocommerce'
    };

    try {
      const result = await this.strapiClient.create('/contract-transactions', transactionData);
      this.logger.debug(`💳 Created transaction for contract ${contractId}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Failed to create transaction for contract ${contractId}:`, error.message);
    }
  }

  /**
   * Map WooCommerce order status to Strapi order status
   */
  mapOrderStatus(wcStatus) {
    const mapping = this.config.import.statusMappings.order;
    return mapping[wcStatus] || 'Paying';
  }

  /**
   * Map order status to contract status
   */
  mapContractStatus(orderStatus) {
    const statusMap = {
      'pending': 'Not Ready',
      'processing': 'Confirmed',
      'on-hold': 'Not Ready',
      'completed': 'Finished',
      'cancelled': 'Cancelled',
      'refunded': 'Cancelled',
      'failed': 'Failed'
    };
    
    return statusMap[orderStatus] || 'Not Ready';
  }

  /**
   * Map WooCommerce payment method to transaction type
   */
  mapPaymentType(paymentMethod) {
    const methodMap = {
      'bacs': 'Manual',
      'cheque': 'Cheque',
      'cod': 'Manual',
      'paypal': 'Gateway',
      'stripe': 'Gateway'
    };
    
    return methodMap[paymentMethod] || 'Gateway';
  }

  /**
   * Map order status to transaction status
   */
  mapTransactionStatus(orderStatus) {
    const statusMap = {
      'pending': 'Pending',
      'processing': 'Success',
      'on-hold': 'Pending',
      'completed': 'Success',
      'cancelled': 'Failed',
      'refunded': 'Failed',
      'failed': 'Failed'
    };
    
    return statusMap[orderStatus] || 'Pending';
  }

  /**
   * Convert price from IRT to internal format
   */
  convertPrice(price) {
    if (!price || price === '0' || price === '') {
      return 0;
    }
    
    const numPrice = parseFloat(price);
    const multiplier = this.config.import.currency.multiplier || 1;
    
    // Return as number for biginteger fields, handle large values properly
    return Math.round(numPrice * multiplier);
  }

  /**
   * Log final import statistics
   */
  logFinalStats() {
    this.logger.success(`🎉 Order import completed!`);
    this.logger.logStats(this.stats);
    this.logger.info(`📊 Additional stats:`);
    this.logger.info(`   Orders created: ${this.stats.ordersCreated}`);
    this.logger.info(`   Order items created: ${this.stats.orderItemsCreated}`);
    this.logger.info(`   Contracts created: ${this.stats.contractsCreated}`);
    this.logger.info(`   Guest users created: ${this.stats.guestUsersCreated}`);
    
    // Log duplicate tracking stats
    const trackingStats = this.duplicateTracker.getStats();
    this.logger.info(`📊 Duplicate tracking: ${trackingStats.orders?.total || 0} orders tracked`);
  }

  /**
   * Get import statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

module.exports = OrderImporter; 