#!/usr/bin/env node

/**
 * Delete All Product Variations (Direct Database)
 *
 * Bypasses Strapi validation to delete all variations directly from database
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
  timeout: 60000
});

async function deleteAllVariationsViaBulk() {
  try {
    logger.info('🗑️ Starting bulk deletion of all product variations...');
    logger.warn('⚠️ WARNING: This will delete ALL product variations from the database!');
    logger.warn('⚠️ Make sure you have a backup before proceeding.');

    // Give user time to read warning
    await new Promise(resolve => setTimeout(resolve, 2000));

    let page = 1;
    let totalDeleted = 0;
    let totalFailed = 0;
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

      // Delete each variation, ignoring relation errors
      for (const variation of variations) {
        try {
          await strapiClient.delete(`/product-variations/${variation.id}`);
          totalDeleted++;
          logger.success(`✅ Deleted variation: ${variation.id} (SKU: ${variation.SKU || 'N/A'})`);

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 150));
        } catch (error) {
          // Check if it's a relation error - these are expected for broken refs
          if (error.response?.status === 400) {
            const message = error.response?.data?.error?.message || '';
            if (message.includes('relation')) {
              logger.warn(`⚠️ Variation ${variation.id} has broken relations, skipping...`);
              totalFailed++;
              // Try clearing the relation by patching to null
              try {
                await strapiClient.put(`/product-variations/${variation.id}`, {
                  data: {}
                });
                // Now try to delete
                await strapiClient.delete(`/product-variations/${variation.id}`);
                totalDeleted++;
                logger.success(`✅ Deleted variation after clearing relations: ${variation.id}`);
              } catch (patchError) {
                logger.error(`❌ Failed even after clearing relations for ${variation.id}`);
              }
            } else {
              totalFailed++;
              logger.error(`❌ Failed to delete variation ${variation.id}:`, message);
            }
          } else {
            totalFailed++;
            logger.error(`❌ Failed to delete variation ${variation.id}:`, error.message);
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
    if (totalFailed > 0) {
      logger.warn(`⚠️ Failed to delete ${totalFailed} variations (likely due to broken relations)`);
    }

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

    logger.success(`🎉 Variation deletion and tracking reset completed!`);
    logger.info(`📦 You can now re-import variations with: node index.js variations --all`);

  } catch (error) {
    logger.error('❌ Failed to delete variations:', error.message);
    if (error.response?.data) {
      logger.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

deleteAllVariationsViaBulk();
