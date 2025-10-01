#!/usr/bin/env node

const config = require('./config');
const { StrapiClient } = require('./utils/ApiClient');
const Logger = require('./utils/Logger');

class ColorFixer {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.strapiClient = new StrapiClient(config, logger);
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

  async findVariationsWithMissingColors() {
    try {
      const response = await this.strapiClient.client.get('/product-variations', {
        params: {
          'populate': 'product_variation_color',
          'pagination[pageSize]': 100
        }
      });

      const variationsWithMissingColors = response.data.data.filter(variation => 
        !variation.attributes.product_variation_color.data
      );

      this.logger.info(`Found ${variationsWithMissingColors.length} variations with missing colors`);
      return variationsWithMissingColors;
    } catch (error) {
      this.logger.error('Failed to fetch variations:', error);
      throw error;
    }
  }

  async createOrGetDefaultColor() {
    try {
      const defaultColorTitle = this.config.import.defaults.variationAttributes.color.title;
      const defaultColorCode = this.generateColorCode(defaultColorTitle);

      // Try to find existing default color
      const existing = await this.strapiClient.client.get('/product-variation-colors', {
        params: {
          'filters[Title][$eq]': defaultColorTitle
        }
      });

      if (existing.data.data && existing.data.data.length > 0) {
        return existing.data.data[0].id;
      }

      // Create new default color
      const result = await this.strapiClient.createVariationColor({
        Title: defaultColorTitle,
        ColorCode: defaultColorCode,
        external_id: `default_color_${defaultColorTitle.toLowerCase().replace(/\s+/g, '_')}`,
        external_source: 'woocommerce'
      });

      return result.data.id;
    } catch (error) {
      this.logger.error('Failed to create/get default color:', error);
      throw error;
    }
  }

  async fixVariation(variation, defaultColorId) {
    try {
      await this.strapiClient.client.put(`/product-variations/${variation.id}`, {
        data: {
          product_variation_color: defaultColorId
        }
      });

      this.logger.success(`✅ Fixed variation ${variation.attributes.SKU} - assigned default color`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to fix variation ${variation.attributes.SKU}:`, error);
      return false;
    }
  }

  async run(dryRun = false) {
    try {
      this.logger.info('🎨 Starting missing colors fix...');
      
      // Find variations with missing colors
      const variations = await this.findVariationsWithMissingColors();
      
      if (variations.length === 0) {
        this.logger.success('✅ No variations with missing colors found!');
        return;
      }

      if (dryRun) {
        this.logger.info('🔍 DRY RUN - would fix the following variations:');
        variations.forEach(variation => {
          this.logger.info(`  - ${variation.attributes.SKU}`);
        });
        return;
      }

      // Get or create default color
      const defaultColorId = await this.createOrGetDefaultColor();
      this.logger.info(`🎨 Using default color ID: ${defaultColorId}`);

      // Fix each variation
      let fixed = 0;
      for (const variation of variations) {
        const success = await this.fixVariation(variation, defaultColorId);
        if (success) fixed++;
      }

      this.logger.success(`✅ Fixed ${fixed}/${variations.length} variations`);
    } catch (error) {
      this.logger.error('❌ Color fix failed:', error);
      throw error;
    }
  }
}

// CLI execution
async function main() {
  const logger = new Logger();
  const fixer = new ColorFixer(config, logger);
  
  const dryRun = process.argv.includes('--dry-run');
  
  try {
    await fixer.run(dryRun);
    logger.success('🎉 Color fix completed!');
  } catch (error) {
    logger.error('💥 Color fix failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ColorFixer; 