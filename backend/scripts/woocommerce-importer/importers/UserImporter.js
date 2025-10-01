const { WooCommerceClient, StrapiClient } = require('../utils/ApiClient');
const DuplicateTracker = require('../utils/DuplicateTracker');

/**
 * User Importer - Handles importing WooCommerce customers to Strapi
 * 
 * Features:
 * - Customer data transformation
 * - Local user creation with info and roles
 * - Address management
 * - Email validation and uniqueness
 * - Duplicate prevention
 * - Incremental processing with progress persistence
 */
class UserImporter {
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
      usersCreated: 0,
      userInfosCreated: 0,
      rolesAssigned: 0
    };

    // Cache for email uniqueness checks
    this.emailCache = new Set();
  }

  /**
   * Main import method - Optimized for incremental processing
   */
  async import(options = {}) {
    const { limit = 50, page = 1, dryRun = false } = options;
    
    this.stats.startTime = Date.now();
    this.logger.info(`👥 Starting user import (limit: ${limit}, page: ${page}, dryRun: ${dryRun})`);
    
    try {
      // Pre-load email cache for uniqueness checks
      await this.loadEmailCache();
      
      // Load progress state
      const progressState = this.loadProgressState();
      let currentPage = Math.max(page, progressState.lastCompletedPage + 1);
      let totalProcessed = progressState.totalProcessed;
      
      this.logger.info(`📊 Resuming from page ${currentPage} (${totalProcessed} users already processed)`);
      
      // Process users incrementally page by page
      let hasMorePages = true;
      let processedInThisSession = 0;
      
      while (hasMorePages && processedInThisSession < limit) {
        const remainingLimit = limit - processedInThisSession;
        const perPage = Math.min(this.config.import.batchSizes.users || 50, remainingLimit);
        
        this.logger.info(`📄 Processing page ${currentPage} (requesting ${perPage} items)...`);
        
        // Fetch current page
        const result = await this.wooClient.getCustomers(currentPage, perPage);
        
        if (!result.data || result.data.length === 0) {
          this.logger.info(`📄 No more customers found on page ${currentPage}`);
          hasMorePages = false;
          break;
        }
        
        // Process users from this page immediately
        this.logger.info(`🔄 Processing ${result.data.length} customers from page ${currentPage}...`);
        
        for (const wcCustomer of result.data) {
          try {
            await this.importSingleUser(wcCustomer, dryRun);
            totalProcessed++;
            processedInThisSession++;
            this.stats.total = totalProcessed;
            
            // Save progress after each successful import
            this.saveProgressState({
              lastCompletedPage: currentPage,
              totalProcessed: totalProcessed,
              lastProcessedAt: new Date().toISOString()
            });
            
            if (totalProcessed % this.config.logging.progressInterval === 0) {
              this.logger.info(`📈 Progress: ${totalProcessed} users processed, current page: ${currentPage}`);
            }
            
          } catch (error) {
            this.stats.errors++;
            this.logger.error(`❌ Failed to import user ${wcCustomer.id} (${wcCustomer.email}):`, error.message);
            
            if (!this.config.errorHandling.continueOnError) {
              throw error;
            }
          }
        }
        
        this.logger.success(`✅ Completed page ${currentPage}: ${result.data.length} users processed`);
        currentPage++;
        
        // Check if we've reached the total pages or our limit
        if (result.totalPages && currentPage > result.totalPages) {
          hasMorePages = false;
        }
        
        if (processedInThisSession >= limit) {
          this.logger.info(`📊 Reached session limit of ${limit} users`);
          break;
        }
      }
      
      this.logger.success(`🎉 Import session completed: ${processedInThisSession} users processed in this session`);
      
    } catch (error) {
      this.stats.errors++;
      this.logger.error('❌ User import failed:', error);
      throw error;
    } finally {
      this.stats.endTime = Date.now();
      this.stats.duration = this.stats.endTime - this.stats.startTime;
      this.logFinalStats();
    }
    
    return this.stats;
  }

  /**
   * Load existing phones into cache for uniqueness checks
   */
  async loadEmailCache() {
    this.logger.debug('📂 Loading existing user phones...');
    
    try {
      // Get existing local users to check for phone duplicates
      const existingUsers = await this.strapiClient.getAllLocalUsers();
      
      if (existingUsers && existingUsers.data) {
        for (const user of existingUsers.data) {
          if (user.Phone) {
            this.emailCache.add(user.Phone.toLowerCase());
          }
        }
      }
      
      this.logger.info(`📂 Loaded ${this.emailCache.size} existing user phones`);
    } catch (error) {
      this.logger.warn(`⚠️ Failed to load existing phones: ${error.message}`);
    }
  }

  /**
   * Find or create customer role
   */
  async findOrCreateCustomerRole() {
    try {
      // Try to find existing customer role
      const existingRoles = await this.strapiClient.get('/local-user-roles', {
        'filters[Title][$eq]': 'Customer'
      });
      
      if (existingRoles.data && existingRoles.data.length > 0) {
        this.logger.debug(`📋 Found existing customer role: ${existingRoles.data[0].id}`);
        return existingRoles.data[0];
      }
      
      // Create customer role if it doesn't exist
      const newRole = await this.strapiClient.create('/local-user-roles', {
        Title: 'Customer'
      });
      
      this.logger.info(`📋 Created customer role: ${newRole.data.id}`);
      return newRole.data;
      
    } catch (error) {
      this.logger.error(`❌ Failed to find/create customer role: ${error.message}`);
      // Return a default structure if role creation fails
      return { id: null };
    }
  }

  /**
   * Load progress state from file
   */
  loadProgressState() {
    const progressFile = `${this.config.duplicateTracking.storageDir}/user-import-progress.json`;
    
    try {
      if (require('fs').existsSync(progressFile)) {
        const data = JSON.parse(require('fs').readFileSync(progressFile, 'utf8'));
        this.logger.debug(`📂 Loaded progress state: page ${data.lastCompletedPage}, ${data.totalProcessed} processed`);
        return data;
      }
    } catch (error) {
      this.logger.warn(`⚠️ Failed to load progress state: ${error.message}`);
    }
    
    return {
      lastCompletedPage: 0,
      totalProcessed: 0,
      lastProcessedAt: null
    };
  }

  /**
   * Save progress state to file
   */
  saveProgressState(state) {
    const progressFile = `${this.config.duplicateTracking.storageDir}/user-import-progress.json`;
    
    try {
      require('fs').writeFileSync(progressFile, JSON.stringify(state, null, 2));
    } catch (error) {
      this.logger.error(`❌ Failed to save progress state: ${error.message}`);
    }
  }

  /**
   * Reset progress state (useful for starting fresh)
   */
  resetProgressState() {
    const progressFile = `${this.config.duplicateTracking.storageDir}/user-import-progress.json`;
    
    try {
      if (require('fs').existsSync(progressFile)) {
        require('fs').unlinkSync(progressFile);
        this.logger.info(`🧹 Reset user import progress state`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to reset progress state: ${error.message}`);
    }
  }

  /**
   * Import a single user
   */
  async importSingleUser(wcCustomer, dryRun = false) {
    this.logger.debug(`👤 Processing user: ${wcCustomer.id} - ${wcCustomer.email || 'No Email'}`);
    
    // Validate email format if email exists
    if (wcCustomer.email && wcCustomer.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(wcCustomer.email)) {
        this.logger.warn(`⏭️ Skipping user ${wcCustomer.id} - invalid email format: ${wcCustomer.email}`);
        this.stats.skipped++;
        return { isSkipped: true, reason: 'Invalid email format' };
      }
    }
    
    // Check for duplicates
    const duplicateCheck = this.duplicateTracker.checkDuplicate('users', wcCustomer);
    if (duplicateCheck.isDuplicate) {
      this.stats.skipped++;
      return duplicateCheck;
    }
    
    // Get phone or generate a unique identifier
    const phone = this.extractPhone(wcCustomer);
    let userPhone;
    
    if (phone && phone.trim() !== '') {
      userPhone = phone;
    } else if (wcCustomer.email && wcCustomer.email.trim() !== '') {
      userPhone = wcCustomer.email;
    } else {
      // Generate a unique phone from user ID and timestamp if no phone or email
      const timestamp = Date.now();
      userPhone = `wc_${wcCustomer.id}_${timestamp}`;
      this.logger.info(`📱 Generated phone for user ${wcCustomer.id}: ${userPhone}`);
    }
    
    if (this.emailCache.has(userPhone.toLowerCase())) {
      this.logger.warn(`⏭️ Skipping user ${wcCustomer.id} - phone already exists: ${userPhone}`);
      this.stats.skipped++;
      return { isSkipped: true, reason: 'Phone already exists' };
    }
    
    try {
      // Transform WooCommerce customer to Strapi format
      const strapiUser = await this.transformUser(wcCustomer);
      
      if (dryRun) {
        this.logger.info(`🔍 [DRY RUN] Would import user: ${wcCustomer.email}`);
        this.stats.success++;
        return { isDryRun: true, data: strapiUser };
      }
      
      // Find or create customer role
      const customerRole = await this.findOrCreateCustomerRole();
      
      // Create local user in Strapi
      let userResult;
      try {
        userResult = await this.strapiClient.createLocalUser({
          ...strapiUser.user,
          user_role: customerRole.id // Link to customer role
        });
        this.stats.usersCreated++;
      } catch (error) {
        this.logger.error(`❌ Failed to create local user for ${wcCustomer.email || `ID:${wcCustomer.id}`}:`, error.message);
        if (error.response && error.response.data) {
          this.logger.error(`API Error Details:`, JSON.stringify(error.response.data, null, 2));
        }
        throw error;
      }
      
      // Create user info
      try {
        const userInfoResult = await this.strapiClient.createLocalUserInfo({
          ...strapiUser.userInfo,
          user: userResult.data.id // Link to user
        });
        this.stats.userInfosCreated++;
        this.stats.rolesAssigned++;
      } catch (error) {
        this.logger.error(`❌ Failed to create user info for ${wcCustomer.email || `ID:${wcCustomer.id}`}:`, error.message);
        if (error.response && error.response.data) {
          this.logger.error(`API Error Details:`, JSON.stringify(error.response.data, null, 2));
        }
        // Don't throw here - user was created successfully, just info failed
        this.logger.warn(`⚠️ User created but user info failed for ${wcCustomer.email || `ID:${wcCustomer.id}`}`);
      }
      
      // Add phone to cache to prevent duplicates in this session
      const phone = this.extractPhone(wcCustomer);
      let userPhone;
      
      if (phone && phone.trim() !== '') {
        userPhone = phone;
      } else if (wcCustomer.email && wcCustomer.email.trim() !== '') {
        userPhone = wcCustomer.email;
      } else {
        const timestamp = Date.now();
        userPhone = `wc_${wcCustomer.id}_${timestamp}`;
      }
      
      this.emailCache.add(userPhone.toLowerCase());
      
      // Record the mapping
      this.duplicateTracker.recordMapping(
        'users',
        wcCustomer.id,
        userResult.data.id,
        {
          email: wcCustomer.email || '',
          firstName: wcCustomer.first_name || '',
          lastName: wcCustomer.last_name || '',
          phone: userPhone
        }
      );
      
      this.stats.success++;
      this.logger.debug(`✅ Created user: ${wcCustomer.email || `ID:${wcCustomer.id}`} → ID: ${userResult.data.id}`);
      
      return userResult;
      
    } catch (error) {
      this.stats.failed++;
      this.logger.error(`❌ Failed to create user ${wcCustomer.email || `ID:${wcCustomer.id}`}:`, error.message);
      throw error;
    }
  }

  /**
   * Transform WooCommerce customer to Strapi format
   */
  async transformUser(wcCustomer) {
    // Get phone or generate unique identifier
    const phone = this.extractPhone(wcCustomer);
    let userPhone;
    
    if (phone && phone.trim() !== '') {
      userPhone = phone;
    } else if (wcCustomer.email && wcCustomer.email.trim() !== '') {
      userPhone = wcCustomer.email;
    } else {
      // Generate a unique phone from user ID and timestamp if no phone or email
      const timestamp = Date.now();
      userPhone = `wc_${wcCustomer.id}_${timestamp}`;
    }
    
    // Ensure phone is not too long (database constraints)
    const sanitizedPhone = userPhone.substring(0, 255);
    
    // Sanitize names
    const firstName = (wcCustomer.first_name || '').trim().substring(0, 255);
    const lastName = (wcCustomer.last_name || '').trim().substring(0, 255);
    
    // Create bio with available information
    const address = this.formatAddress(wcCustomer);
    let bio = '';
    
    // Add email to bio if available
    if (wcCustomer.email && wcCustomer.email.trim() !== '') {
      bio = `Email: ${wcCustomer.email}`;
    }
    
    // Add address to bio if available
    if (address && address.trim()) {
      if (bio) {
        bio += `\nAddress: ${address}`;
      } else {
        bio = `Address: ${address}`;
      }
    }
    
    // Add WooCommerce ID if no other info available
    if (!bio) {
      bio = `WooCommerce Customer ID: ${wcCustomer.id}`;
    }
    
    // Ensure bio is not too long
    bio = bio.substring(0, 1000);
    
    const strapiUser = {
      user: {
        Phone: sanitizedPhone, // Phone is required and unique in local-user schema
        Password: this.generateRandomPassword(), // Generate random password
        IsActive: true,
        IsVerified: false, // Default to unverified
        external_id: wcCustomer.id.toString(),
        external_source: 'woocommerce'
      },
      userInfo: {
        FirstName: firstName,
        LastName: lastName,
        Bio: bio
      },
      roleId: null // We'll find or create the customer role
    };

    this.logger.debug(`🔄 Transformed user: ${wcCustomer.email || 'No Email'} → Phone: ${sanitizedPhone}`);
    return strapiUser;
  }

  /**
   * Extract phone number from customer data
   */
  extractPhone(wcCustomer) {
    // Try billing phone first, then shipping phone
    return wcCustomer.billing?.phone || 
           wcCustomer.shipping?.phone || 
           '';
  }

  /**
   * Format address from customer data
   */
  formatAddress(wcCustomer) {
    const billing = wcCustomer.billing || {};
    const shipping = wcCustomer.shipping || {};
    
    // Prefer billing address, fallback to shipping
    const address = {
      street: billing.address_1 || shipping.address_1 || '',
      street2: billing.address_2 || shipping.address_2 || '',
      city: billing.city || shipping.city || '',
      state: billing.state || shipping.state || '',
      postcode: billing.postcode || shipping.postcode || '',
      country: billing.country || shipping.country || ''
    };
    
    // Format as single string
    const parts = [
      address.street,
      address.street2,
      address.city,
      address.state,
      address.postcode,
      address.country
    ].filter(part => part && part.trim());
    
    return parts.join(', ');
  }

  /**
   * Generate random password for imported users
   */
  generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Log final import statistics
   */
  logFinalStats() {
    this.logger.success(`🎉 User import completed!`);
    this.logger.logStats(this.stats);
    this.logger.info(`📊 Additional stats:`);
    this.logger.info(`   Users created: ${this.stats.usersCreated}`);
    this.logger.info(`   User infos created: ${this.stats.userInfosCreated}`);
    this.logger.info(`   Roles assigned: ${this.stats.rolesAssigned}`);
    
    // Log duplicate tracking stats
    const trackingStats = this.duplicateTracker.getStats();
    this.logger.info(`📊 Duplicate tracking: ${trackingStats.users?.total || 0} users tracked`);
  }

  /**
   * Get import statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

module.exports = UserImporter;
