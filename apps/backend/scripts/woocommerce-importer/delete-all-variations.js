#!/usr/bin/env node

/**
 * Delete All Product Variations
 *
 * Removes all product variations from Strapi database and resets tracking
 * Use this to do a clean re-import from scratch
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const Logger = require('./utils/Logger');

const logger = new Logger();

const strapiClient = axios.create({
  baseURL: config.strapi.baseUrl,
  headers: {
    Authorization: `Bearer ${config.strapi.auth.token}`
  },
  timeout: 30000
});

async function deleteAllVariations() {
  try {
    logger.info('🗑️ Starting deletion of all product variations...');
    logger.warn('⚠️ WARNING: This will delete ALL product variations from the database!');
    logger.warn('⚠️ Make sure you have a backup before proceeding.');

    // Give user time to read warning
    await new Promise(resolve => setTimeout(resolve, 2000));

    let page = 1;
    let totalDeleted = 0;
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

      // Delete each variation
      for (const variation of variations) {
        try {
          // First delete related product stocks
          try {
            const stockResponse = await strapiClient.get('/product-stocks', {
              params: {
                filters: {
                  product_variation: {
                    id: variation.id
                  }
                }
              }
            });

            const stocks = stockResponse.data.data || [];
            for (const stock of stocks) {
              await strapiClient.delete(`/product-stocks/${stock.id}`);
              logger.debug(`  🗑️ Deleted stock record: ${stock.id}`);
            }
          } catch (error) {
            logger.debug(`  ⚠️ Could not delete stocks for variation ${variation.id}`);
          }

          // Now delete the variation
          await strapiClient.delete(`/product-variations/${variation.id}`);
          totalDeleted++;
          logger.success(`✅ Deleted variation: ${variation.id} (SKU: ${variation.SKU || 'N/A'})`);

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          logger.error(`❌ Failed to delete variation ${variation.id}:`, error.message);
          // Log detailed error info
          if (error.response?.data) {
            logger.error(`   Details:`, JSON.stringify(error.response.data, null, 2));
          }
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

    logger.success(`✅ Deleted ${totalDeleted} product variations`);

    // Reset tracking files
    logger.info('🧹 Resetting variation tracking files...');
    const trackingDir = config.duplicateTracking.storageDir;
    const variationMappingFile = path.join(trackingDir, 'variation-mappings.json');
    const variationProgressFile = path.join(trackingDir, 'variation-import-progress.json');

    if (fs.existsSync(variationMappingFile)) {
      fs.unlinkSync(variationMappingFile);
      logger.success(`✅ Reset variation mappings`);
    }

    if (fs.existsSync(variationProgressFile)) {
      fs.unlinkSync(variationProgressFile);
      logger.success(`✅ Reset variation progress`);
    }

    logger.success(`🎉 All product variations deleted and tracking reset!`);
    logger.info(`📦 You can now re-import variations with: node index.js variations --all`);

  } catch (error) {
    logger.error('❌ Failed to delete variations:', error.message);
    if (error.response?.data) {
      logger.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

deleteAllVariations();
