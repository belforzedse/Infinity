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
    this.logger.debug('📂 Loading existing user contact identifiers...');
    
    try {
      const existingUsers = await this.strapiClient.getAllPluginUsers({
        'pagination[pageSize]': 1000,
        'fields[0]': 'phone',
      });
      const items = Array.isArray(existingUsers?.data)
        ? existingUsers.data
        : Array.isArray(existingUsers)
          ? existingUsers
          : [];
      
      for (const entry of items) {
        const rawPhone = entry?.phone ?? entry?.Phone ?? entry?.attributes?.phone;
        const normalized = this.normalizePhone(rawPhone);
        if (normalized) {
          this.emailCache.add(normalized);
        }
      }
      
      this.logger.info(`📂 Loaded ${this.emailCache.size} existing user identifiers`);
    } catch (error) {
      this.logger.warn(`⚠️ Failed to load existing emails: ${error.message}`);
    }
  }

  /**
   * Find or create customer role
   */
  async findOrCreateCustomerRole() {
    try {
      const roles = await this.strapiClient.getPluginRoles();
      const customerRole = roles.find(
        (role) => role?.name?.toLowerCase() === 'customer' || role?.type === 'customer',
      );

      if (!customerRole) {
        this.logger.error("❌ Customer plugin role not found. Please create it before importing users.");
        return { id: null };
      }

      this.logger.debug(`📋 Using plugin role: ${customerRole.name} (ID: ${customerRole.id})`);
      return customerRole;
    } catch (error) {
      this.logger.error(`❌ Failed to load plugin roles: ${error.message}`);
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
   * Check Strapi for an existing user by external ID or phone
   */
  async findExistingStrapiUser(externalId, phone) {
    try {
      const existingByExternalId = await this.strapiClient.findPluginUserByExternalId(externalId);
      if (existingByExternalId) {
        return existingByExternalId;
      }
    } catch (error) {
      this.logger.warn(`⚠️ Failed to look up user by external ID ${externalId}: ${error.message}`);
    }

    try {
      const existingByPhone = await this.strapiClient.findPluginUserByPhone(phone);
      if (existingByPhone) {
        return existingByPhone;
      }
    } catch (error) {
      this.logger.warn(`⚠️ Failed to look up user by phone ${phone}: ${error.message}`);
    }

    return null;
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
    
    // Require a valid phone number for import
    const extractedPhone = this.extractPhone(wcCustomer);
    if (!extractedPhone || extractedPhone.trim() === '') {
      this.logger.warn(`⏭️ Skipping user ${wcCustomer.id} - missing phone number`);
      this.stats.skipped++;
      return { isSkipped: true, reason: 'Missing phone number' };
    }

    const formattedPhone = this.formatPhone(extractedPhone);
    if (!formattedPhone) {
      this.logger.warn(`⏭️ Skipping user ${wcCustomer.id} - invalid phone number: ${extractedPhone}`);
      this.stats.skipped++;
      return { isSkipped: true, reason: 'Invalid phone number' };
    }

    const normalizedPhone = this.normalizePhone(formattedPhone);
    if (!normalizedPhone) {
      this.logger.warn(`⏭️ Skipping user ${wcCustomer.id} - unable to normalize phone number: ${formattedPhone}`);
      this.stats.skipped++;
      return { isSkipped: true, reason: 'Invalid phone number' };
    }

    if (normalizedPhone && this.emailCache.has(normalizedPhone)) {
      this.logger.warn(`⏭️ Skipping user ${wcCustomer.id} - phone already exists: ${formattedPhone}`);
      this.stats.skipped++;
      return { isSkipped: true, reason: 'Phone already exists' };
    }

    try {
      // Transform WooCommerce customer to Strapi format
      const strapiUser = await this.transformUser(wcCustomer, formattedPhone);

      // Check if this user already exists in Strapi to avoid duplicates
      const existingUser = await this.findExistingStrapiUser(
        strapiUser.pluginUser.external_id,
        strapiUser.pluginUser.phone
      );

      if (existingUser) {
        const existingId = existingUser?.id ?? existingUser?.data?.id ?? null;
        this.logger.warn(`⏭️ Skipping user ${wcCustomer.id} - already exists in Strapi (ID: ${existingId ?? 'unknown'})`);
        this.stats.skipped++;

        if (normalizedPhone) {
          this.emailCache.add(normalizedPhone);
        }

        if (existingId) {
          this.duplicateTracker.recordMapping(
            'users',
            wcCustomer.id,
            existingId,
            {
              email: wcCustomer.email || '',
              firstName: wcCustomer.first_name || '',
              lastName: wcCustomer.last_name || '',
              phone: strapiUser.pluginUser.phone
            }
          );
        }

        return { isSkipped: true, reason: 'Already exists', existingId };
      }

      if (dryRun) {
        this.logger.info(`🔍 [DRY RUN] Would import user: ${wcCustomer.email}`);
        this.stats.success++;
        return { isDryRun: true, data: strapiUser };
      }
      
      const customerRole = await this.findOrCreateCustomerRole();

      let pluginUserResult;
      try {
        pluginUserResult = await this.strapiClient.createPluginUser({
          ...strapiUser.pluginUser,
          ...(customerRole?.id ? { role: customerRole.id } : {}),
        });
        this.stats.usersCreated++;
      } catch (error) {
        this.logger.error(
          `❌ Failed to create plugin user for ${wcCustomer.email || `ID:${wcCustomer.id}`}:`,
          error.message,
        );
        if (error.response && error.response.data) {
          this.logger.error(`API Error Details:`, JSON.stringify(error.response.data, null, 2));
        }
        throw error;
      }

      const pluginUserId = pluginUserResult?.id ?? pluginUserResult?.data?.id;

      try {
        await this.strapiClient.createLocalUserInfo({
          ...strapiUser.userInfo,
          user: pluginUserId,
        });
        this.stats.userInfosCreated++;
        this.stats.rolesAssigned++;
      } catch (error) {
        this.logger.error(
          `❌ Failed to create user info for ${wcCustomer.email || `ID:${wcCustomer.id}`}:`,
          error.message,
        );
        if (error.response && error.response.data) {
          this.logger.error(`API Error Details:`, JSON.stringify(error.response.data, null, 2));
        }
        this.logger.warn(
          `⚠️ Plugin user created but user info failed for ${wcCustomer.email || `ID:${wcCustomer.id}`}`,
        );
      }

      // Add normalized phone/email to cache to prevent duplicates in this session
      if (normalizedPhone) {
        this.emailCache.add(normalizedPhone);
      }

      // Record the mapping
      if (pluginUserId) {
        this.duplicateTracker.recordMapping('users', wcCustomer.id, pluginUserId, {
          email: wcCustomer.email || '',
          firstName: wcCustomer.first_name || '',
          lastName: wcCustomer.last_name || '',
          phone: strapiUser.pluginUser.phone,
        });
      }

      this.stats.success++;
      this.logger.debug(
        `✅ Created user: ${wcCustomer.email || `ID:${wcCustomer.id}`} → ID: ${pluginUserId}`,
      );
      
      return pluginUserResult;
      
    } catch (error) {
      this.stats.failed++;
      this.logger.error(`❌ Failed to create user ${wcCustomer.email || `ID:${wcCustomer.id}`}:`, error.message);
      throw error;
    }
  }

  /**
   * Transform WooCommerce customer to Strapi payloads
   */
  async transformUser(wcCustomer, enforcedPhone = null) {
    const phone = enforcedPhone ?? this.extractPhone(wcCustomer);
    if (!phone || phone.trim() === '') {
      throw new Error(`Cannot transform user ${wcCustomer.id} - missing phone number`);
    }

    const formattedPhone = this.formatPhone(phone);
    if (!formattedPhone) {
      throw new Error(`Cannot transform user ${wcCustomer.id} - invalid phone number: ${phone}`);
    }

    const sanitizedPhone = formattedPhone.substring(0, 255);
    const firstName = (wcCustomer.first_name || '').trim().substring(0, 255);
    const lastName = (wcCustomer.last_name || '').trim().substring(0, 255);
    const address = this.formatAddress(wcCustomer);

    let bio = '';
    if (wcCustomer.email && wcCustomer.email.trim() !== '') {
      bio = `Email: ${wcCustomer.email}`;
    }
    if (address && address.trim()) {
      bio = bio ? `${bio}\nAddress: ${address}` : `Address: ${address}`;
    }
    if (!bio) {
      bio = `WooCommerce Customer ID: ${wcCustomer.id}`;
    }
    bio = bio.substring(0, 1000);

    const pluginUser = {
      username: sanitizedPhone,
      email: this.ensureEmail(wcCustomer, sanitizedPhone),
      phone: sanitizedPhone,
      password: this.generateRandomPassword(),
      confirmed: true,
      blocked: false,
      IsActive: true,
      IsVerified: false,
      external_id: wcCustomer.id.toString(),
      external_source: 'woocommerce',
    };

    const userInfo = {
      FirstName: firstName,
      LastName: lastName,
      Bio: bio,
    };

    this.logger.debug(`🔄 Transformed user: ${wcCustomer.email || 'No Email'} → Phone: ${sanitizedPhone}`);
    return { pluginUser, userInfo };
  }

  /**
   * Normalize phone identifiers for duplicate detection.
   */
  normalizePhone(value) {
    if (value === undefined || value === null) {
      return '';
    }

    const formatted = this.formatPhone(value);
    if (!formatted) {
      return '';
    }

    return formatted.replace(/\s+/g, '').toLowerCase();
  }

  formatPhone(value) {
    if (value === undefined || value === null) {
      return '';
    }
    let trimmed = value.toString().trim();
    if (!trimmed) return '';

    trimmed = trimmed.replace(/\s+/g, '');

    if (trimmed.startsWith('+')) {
      return trimmed;
    }

    if (trimmed.startsWith('0')) {
      return `+98${trimmed.slice(1)}`;
    }

    if (trimmed.startsWith('98')) {
      return `+${trimmed}`;
    }

    return `+${trimmed}`;
  }

  ensureEmail(wcCustomer, fallbackPhone) {
    if (wcCustomer.email && wcCustomer.email.trim() !== '') {
      return wcCustomer.email.trim();
    }
    const numeric =
      (fallbackPhone || '').replace(/\D/g, '') ||
      wcCustomer.id?.toString() ||
      Math.random().toString(36).slice(2, 10);
    return `${numeric}@placeholder.local`;
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
