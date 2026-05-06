#!/usr/bin/env node

const config = require('./config');
const { WooCommerceClient, StrapiClient } = require('./utils/ApiClient');
const Logger = require('./utils/Logger');

class VariationColorFixer {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.wooClient = new WooCommerceClient(config, logger);
    this.strapiClient = new StrapiClient(config, logger);
    this.stats = {
      processed: 0,
      updated: 0,
      failed: 0,
      colorsCreated: 0
    };
  }

  /**
   * Generate unique color code from color name using hash-based approach
   */
  generateColorCode(colorName) {
    // Create a hash from the color name
    let hash = 0;
    const normalizedName = colorName.toLowerCase().trim();
    
    for (let i = 0; i < normalizedName.length; i++) {
      const char = normalizedName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Use different parts of the hash for RGB components
    const r = Math.abs(hash) % 256;
    const g = Math.abs(hash >> 8) % 256;
    const b = Math.abs(hash >> 16) % 256;
    
    // Ensure the color is not too dark or too light for visibility
    const adjustedR = Math.max(50, Math.min(205, r));
    const adjustedG = Math.max(50, Math.min(205, g));
    const adjustedB = Math.max(50, Math.min(205, b));
    
    // Convert to hex
    const toHex = (val) => {
      const hex = val.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(adjustedR)}${toHex(adjustedG)}${toHex(adjustedB)}`.toUpperCase();
  }

  /**
   * Identify attribute type from WooCommerce attribute name
   */
  identifyAttributeType(attributeName) {
    const name = attributeName.toLowerCase();
    
    // Persian and English color keywords
    if (name.includes('رنگ') || name.includes('color') || name.includes('colour')) {
      return 'color';
    }
    
    // Persian and English size keywords
    if (name.includes('سایز') || name.includes('اندازه') || name.includes('size')) {
      return 'size';
    }
    
    // Default to model for other attributes
    return 'model';
  }

  /**
   * Create or get color attribute
   */
  async createOrGetColor(colorName) {
    try {
      const colorCode = this.generateColorCode(colorName);
      
      const result = await this.strapiClient.createVariationColor({
        Title: colorName,
        ColorCode: colorCode,
        external_id: `color_${colorName.toLowerCase().replace(/\s+/g, '_')}`,
        external_source: 'woocommerce'
      });

      if (result && result.data) {
        this.stats.colorsCreated++;
        this.logger.success(`🎨 Created color: ${colorName} → ${colorCode} (ID: ${result.data.id})`);
        return result.data.id;
      }
    } catch (error) {
      this.logger.error(`❌ Failed to create color ${colorName}:`, error.message);
    }
    return null;
  }

  /**
   * Get all Strapi variations
   */
  async getAllStrapiVariations() {
    try {
      const response = await this.strapiClient.client.get('/product-variations', {
        params: {
          'populate': 'product_variation_color',
          'pagination[pageSize]': 100
        }
      });

      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to fetch Strapi variations:', error);
      throw error;
    }
  }

  /**
   * Get WooCommerce variation by ID
   */
  async getWooCommerceVariation(productId, variationId) {
    try {
      const response = await this.wooClient.client.get(`/products/${productId}/variations/${variationId}`);
      return response.data;
    } catch (error) {
      this.logger.debug(`Could not fetch WooCommerce variation ${productId}/${variationId}:`, error.message);
      return null;
    }
  }

  /**
   * Extract WooCommerce product and variation IDs from Strapi SKU
   */
  parseWooCommerceSKU(sku) {
    // SKU format: WC-{productId}-{variationId}
    const match = sku.match(/^WC-(\d+)-(\d+)$/);
    if (match) {
      return {
        productId: parseInt(match[1]),
        variationId: parseInt(match[2])
      };
    }
    return null;
  }

  /**
   * Extract color name from WooCommerce variation attributes
   */
  extractColorFromWooCommerce(wcVariation) {
    if (!wcVariation.attributes || !Array.isArray(wcVariation.attributes)) {
      return null;
    }

    for (const attribute of wcVariation.attributes) {
      const attributeType = this.identifyAttributeType(attribute.name);
      if (attributeType === 'color') {
        return attribute.option;
      }
    }

    return null;
  }

  /**
   * Update Strapi variation with correct color
   */
  async updateVariationColor(strapiVariation, colorId) {
    try {
      await this.strapiClient.client.put(`/product-variations/${strapiVariation.id}`, {
        data: {
          product_variation_color: colorId
        }
      });

      this.stats.updated++;
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to update variation ${strapiVariation.attributes.SKU}:`, error.message);
      this.stats.failed++;
      return false;
    }
  }

  /**
   * Process a single variation
   */
  async processVariation(strapiVariation, dryRun = false) {
    try {
      this.stats.processed++;
      
      const sku = strapiVariation.attributes.SKU;
      this.logger.info(`🔍 Processing variation: ${sku}`);

      // Parse WooCommerce IDs from SKU
      const wcIds = this.parseWooCommerceSKU(sku);
      if (!wcIds) {
        this.logger.warn(`⚠️  Could not parse WooCommerce IDs from SKU: ${sku}`);
        return;
      }

      // Get WooCommerce variation data
      const wcVariation = await this.getWooCommerceVariation(wcIds.productId, wcIds.variationId);
      if (!wcVariation) {
        this.logger.warn(`⚠️  WooCommerce variation not found: ${wcIds.productId}/${wcIds.variationId}`);
        return;
      }

      // Extract color from WooCommerce data
      const wooColorName = this.extractColorFromWooCommerce(wcVariation);
      if (!wooColorName) {
        this.logger.info(`ℹ️  No color attribute found in WooCommerce for ${sku}`);
        return;
      }

      // Get current Strapi color
      const currentStrapiColor = strapiVariation.attributes.product_variation_color.data;
      const currentColorName = currentStrapiColor ? currentStrapiColor.attributes.Title : 'null';

      // Check if colors match
      if (currentColorName === wooColorName) {
        this.logger.info(`✅ Color already correct: ${sku} → ${wooColorName}`);
        return;
      }

      this.logger.info(`🔄 Color mismatch: ${sku}`);
      this.logger.info(`   WooCommerce: ${wooColorName}`);
      this.logger.info(`   Strapi: ${currentColorName}`);

      if (dryRun) {
        this.logger.info(`🔍 DRY RUN - would update to: ${wooColorName}`);
        return;
      }

      // Create or get the correct color
      const correctColorId = await this.createOrGetColor(wooColorName);
      if (!correctColorId) {
        this.logger.error(`❌ Failed to create/get color: ${wooColorName}`);
        this.stats.failed++;
        return;
      }

      // Update the variation
      const success = await this.updateVariationColor(strapiVariation, correctColorId);
      if (success) {
        this.logger.success(`✅ Updated ${sku}: ${currentColorName} → ${wooColorName}`);
      }

    } catch (error) {
      this.logger.error(`❌ Error processing variation ${strapiVariation.attributes.SKU}:`, error.message);
      this.stats.failed++;
    }
  }

  /**
   * Run the color fix process
   */
  async run(dryRun = false) {
    try {
      this.logger.info('🎨 Starting variation color correction...');
      
      if (dryRun) {
        this.logger.info('🔍 DRY RUN MODE - no changes will be made');
      }

      // Get all Strapi variations
      this.logger.info('📥 Fetching Strapi variations...');
      const strapiVariations = await this.getAllStrapiVariations();
      this.logger.info(`✅ Found ${strapiVariations.length} variations in Strapi`);

      // Process each variation
      for (const strapiVariation of strapiVariations) {
        await this.processVariation(strapiVariation, dryRun);
      }

      // Report results
      this.logger.info('📊 Color correction completed!');
      this.logger.info(`   Processed: ${this.stats.processed}`);
      this.logger.info(`   Updated: ${this.stats.updated}`);
      this.logger.info(`   Failed: ${this.stats.failed}`);
      this.logger.info(`   Colors created: ${this.stats.colorsCreated}`);

    } catch (error) {
      this.logger.error('❌ Color correction failed:', error);
      throw error;
    }
  }
}

// CLI execution
async function main() {
  const logger = new Logger();
  const fixer = new VariationColorFixer(config, logger);
  
  const dryRun = process.argv.includes('--dry-run');
  
  try {
    await fixer.run(dryRun);
    logger.success('🎉 Color correction completed!');
  } catch (error) {
    logger.error('💥 Color correction failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = VariationColorFixer; 