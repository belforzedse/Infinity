#!/usr/bin/env node

/**
 * Cleanup Script: Fix Products with Dangling Image References
 *
 * This script identifies and removes dangling image references
 * (products with CoverImage or Media pointing to deleted files)
 *
 * Usage:
 *   node cleanup-image-references.js [--delete-refs] [--limit=100]
 *
 * Options:
 *   --delete-refs    Actually delete the references (default: dry run only)
 *   --limit=N        Process only N products (default: 100)
 */

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

class ImageReferenceCleanup {
  constructor(apiUrl, token) {
    this.apiUrl = apiUrl;
    this.token = token;
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getAllProducts(limit = 100) {
    try {
      console.log(`📦 Fetching products (limit: ${limit})...`);
      const response = await this.client.get(`/products`, {
        params: {
          populate: 'CoverImage,Media',
          pagination: { limit },
          fields: ['id', 'Title'],
        },
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('❌ Failed to fetch products:', error.message);
      return [];
    }
  }

  async checkImageExists(imageId) {
    try {
      await this.client.get(`/upload/files/${imageId}`);
      return true;
    } catch (error) {
      if (error.response?.status === 404) {
        return false;
      }
      // Assume exists on other errors
      return true;
    }
  }

  async findProductsWithDanglingReferences() {
    const products = await this.getAllProducts();
    const issues = [];

    for (const product of products) {
      const problemDetails = [];

      // Check CoverImage
      if (product.attributes.CoverImage?.data?.id) {
        const imageId = product.attributes.CoverImage.data.id;
        const exists = await this.checkImageExists(imageId);
        if (!exists) {
          problemDetails.push(`CoverImage (ID: ${imageId}) does not exist`);
        }
      }

      // Check Media/Gallery images
      if (product.attributes.Media?.data && Array.isArray(product.attributes.Media.data)) {
        for (const image of product.attributes.Media.data) {
          const imageId = image.id;
          const exists = await this.checkImageExists(imageId);
          if (!exists) {
            problemDetails.push(`Media Image (ID: ${imageId}) does not exist`);
          }
        }
      }

      if (problemDetails.length > 0) {
        issues.push({
          productId: product.id,
          productTitle: product.attributes.Title,
          problems: problemDetails,
        });
      }
    }

    return issues;
  }

  async clearDanglingReferences(productId, deleteRefs = false) {
    try {
      if (!deleteRefs) {
        console.log(`   🔍 [DRY RUN] Would clear references for product ${productId}`);
        return true;
      }

      await this.client.put(`/products/${productId}`, {
        data: {
          CoverImage: null,
          Media: null,
        },
      });

      console.log(`   ✅ Cleared references for product ${productId}`);
      return true;
    } catch (error) {
      console.error(`   ❌ Failed to clear references: ${error.message}`);
      return false;
    }
  }

  async run(deleteRefs = false, limit = 100) {
    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                  🔍 Image Reference Cleanup Utility                        ║
╚════════════════════════════════════════════════════════════════════════════╝
    `);

    console.log(`Mode: ${deleteRefs ? '🗑️  DELETE MODE' : '🔍 DRY RUN (no changes)'}`);
    console.log(`Processing up to ${limit} products...\n`);

    const issues = await this.findProductsWithDanglingReferences();

    if (issues.length === 0) {
      console.log('✅ No products with dangling image references found!');
      rl.close();
      return;
    }

    console.log(`\n⚠️  Found ${issues.length} products with dangling image references:\n`);
    issues.forEach((issue) => {
      console.log(`   📦 Product: "${issue.productTitle}" (ID: ${issue.productId})`);
      issue.problems.forEach((problem) => {
        console.log(`      • ${problem}`);
      });
    });

    if (!deleteRefs) {
      console.log(`\n💡 Run with --delete-refs flag to actually remove these references`);
      rl.close();
      return;
    }

    const confirm = await prompt(`\n⚠️  About to clear references for ${issues.length} products. Continue? (y/n): `);

    if (confirm.toLowerCase() !== 'y') {
      console.log('❌ Cancelled');
      rl.close();
      return;
    }

    console.log('\n🗑️  Clearing dangling references...\n');

    let fixed = 0;
    for (const issue of issues) {
      const success = await this.clearDanglingReferences(issue.productId, true);
      if (success) fixed++;
    }

    console.log(`\n✅ Fixed ${fixed}/${issues.length} products`);
    rl.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const deleteRefs = args.includes('--delete-refs');
  const limitArg = args.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 100;

  const environment = await prompt('Select environment (1=Production, 2=Staging, 3=Custom, default=1): ');
  let env = environment === '2' ? 'staging' : 'production';
  let customUrl = '';
  let customToken = '';

  if (environment === '3') {
    customUrl = await prompt('Enter Strapi API URL (e.g., https://api.new.infinitycolor.co/api): ');
    customToken = await prompt('Enter Strapi API Token: ');
    if (!customUrl || !customToken) {
      console.log('❌ URL and Token are required!');
      process.exit(1);
    }
    env = 'custom';
  }

  const config = {
    production: {
      url: 'https://api.new.infinitycolor.co/api',
      token: process.env.STRAPI_TOKEN_PROD || '',
    },
    staging: {
      url: 'https://api.infinity.rgbgroup.ir/api',
      token: process.env.STRAPI_TOKEN_STAGING || '',
    },
  };

  let envConfig;
  if (env === 'custom') {
    envConfig = {
      url: customUrl.trim(),
      token: customToken.trim(),
    };
  } else {
    envConfig = config[env];
    if (!envConfig.token) {
      const token = await prompt(`Enter Strapi API token for ${env}: `);
      envConfig.token = token;
    }
  }

  const cleanup = new ImageReferenceCleanup(envConfig.url, envConfig.token);
  await cleanup.run(deleteRefs, limit);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
