#!/usr/bin/env node

/**
 * Fix Variation Prices Migration
 *
 * Divides all variation prices by 10 to correct the multiplier bug
 * Affects: Price, DiscountPrice fields
 */

const axios = require('axios');
const config = require('./config');
const Logger = require('./utils/Logger');

const logger = new Logger();

const strapiClient = axios.create({
  baseURL: config.strapi.baseUrl,
  headers: {
    Authorization: `Bearer ${config.strapi.auth.token}`
  },
  timeout: 60000
});

async function fixVariationPrices() {
  try {
    logger.info('💰 Starting variation price fix migration...');
    logger.warn('⚠️ WARNING: This will divide all variation prices by 10!');
    logger.warn('⚠️ Make sure you have a backup before proceeding.');

    // Give user time to read warning
    await new Promise(resolve => setTimeout(resolve, 2000));

    let page = 1;
    let totalFixed = 0;
    let totalAlreadyFixed = 0;
    let hasMorePages = true;

    while (hasMorePages) {
      logger.info(`📄 Fetching variation page ${page}...`);

      // Fetch variations with pagination
      const response = await strapiClient.get('/product-variations', {
        params: {
          pagination: {
            page: page,
            pageSize: 100
          }
        }
      });

      const variations = response.data.data || [];
      const pagination = response.data.meta?.pagination || {};

      if (variations.length === 0) {
        logger.info('📄 No more variations found');
        hasMorePages = false;
        break;
      }

      logger.info(`🔍 Found ${variations.length} variations on page ${page}`);

      // Fix prices for each variation
      for (const variation of variations) {
        try {
          const price = parseFloat(variation.Price) || 0;
          const discountPrice = parseFloat(variation.DiscountPrice) || 0;

          // Check if price looks like it hasn't been fixed yet (> 1000 suggests multiplied)
          if (price === 0 && discountPrice === 0) {
            logger.debug(`⏭️ Variation ${variation.id}: No prices set, skipping`);
            totalAlreadyFixed++;
            continue;
          }

          // Only fix if price looks like it needs fixing (ends in 0 - multiplied by 10)
          // Or if discount price is set but price isn't reasonable
          const priceLooksMultiplied = price > 1000 || (discountPrice > 1000 && discountPrice < price);

          if (!priceLooksMultiplied) {
            logger.debug(`✓ Variation ${variation.id} (SKU: ${variation.SKU || 'N/A'}): Prices look correct, skipping`);
            totalAlreadyFixed++;
            continue;
          }

          // Fix prices
          const fixedPrice = Math.round(price / 10);
          const fixedDiscountPrice = Math.round(discountPrice / 10);

          const updateData = {};
          if (price > 0) {
            updateData.Price = fixedPrice;
          }
          if (discountPrice > 0) {
            updateData.DiscountPrice = fixedDiscountPrice;
          }

          if (Object.keys(updateData).length > 0) {
            await strapiClient.put(`/product-variations/${variation.id}`, { data: updateData });
            totalFixed++;
            logger.success(
              `✅ Fixed variation ${variation.id} (SKU: ${variation.SKU || 'N/A'}): ${price} → ${fixedPrice}${discountPrice > 0 ? `, ${discountPrice} → ${fixedDiscountPrice}` : ''}`
            );
          }

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          logger.error(`❌ Failed to fix variation ${variation.id}:`, error.message);
        }
      }

      // Check if there are more pages
      if (pagination.page && pagination.pageCount) {
        if (pagination.page >= pagination.pageCount) {
          hasMorePages = false;
        } else {
          page++;
        }
      } else {
        hasMorePages = false;
      }
    }

    logger.success(`🎉 Price fix migration completed!`);
    logger.info(`   Fixed: ${totalFixed} variations`);
    logger.info(`   Already correct: ${totalAlreadyFixed} variations`);
    logger.info(`   Total: ${totalFixed + totalAlreadyFixed} variations processed`);

  } catch (error) {
    logger.error('❌ Failed to fix prices:', error.message);
    if (error.response?.data) {
      logger.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

fixVariationPrices();
