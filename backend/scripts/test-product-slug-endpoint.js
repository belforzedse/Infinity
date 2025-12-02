#!/usr/bin/env node

/**
 * Test script to verify product slug endpoint
 * 
 * Usage:
 *   node scripts/test-product-slug-endpoint.js [slug-or-id]
 * 
 * Examples:
 *   node scripts/test-product-slug-endpoint.js 73
 *   node scripts/test-product-slug-endpoint.js "کفش-زنانه"
 */

const http = require('http');
const https = require('https');

// Get API base URL from environment or use default
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:1337';
const slugOrId = process.argv[2];

if (!slugOrId) {
  console.error('❌ Please provide a slug or product ID');
  console.error('   Usage: node scripts/test-product-slug-endpoint.js [slug-or-id]');
  process.exit(1);
}

// Encode the slug for URL
const encodedSlug = encodeURIComponent(slugOrId);
const url = `${API_BASE_URL}/api/products/by-slug/${encodedSlug}`;

console.log(`\n🧪 Testing product slug endpoint...`);
console.log(`   URL: ${url}`);
console.log(`   Slug/ID: ${slugOrId}\n`);

// Use http or https based on URL
const client = url.startsWith('https') ? https : http;

const req = client.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const product = JSON.parse(data);
        
        if (product.data) {
          console.log('✅ Product found!\n');
          console.log(`   ID: ${product.data.id}`);
          console.log(`   Title: ${product.data.attributes?.Title || 'N/A'}`);
          console.log(`   Slug: ${product.data.attributes?.Slug || '❌ MISSING'}`);
          console.log(`   Status: ${product.data.attributes?.Status || 'N/A'}`);
          console.log(`   Removed: ${product.data.attributes?.removedAt ? 'Yes ⚠️' : 'No ✅'}`);
          
          if (!product.data.attributes?.Slug) {
            console.log(`\n⚠️  Warning: Product has no slug!`);
            console.log(`   Run migration: npm run strapi db:migrate`);
          }
          
          if (product.data.attributes?.removedAt) {
            console.log(`\n⚠️  Warning: Product is trashed (removedAt is set)`);
          }
        } else {
          console.log('❌ Unexpected response format:', data);
        }
      } catch (error) {
        console.error('❌ Error parsing response:', error.message);
        console.log('   Raw response:', data);
      }
    } else if (res.statusCode === 404) {
      console.log('❌ Product not found (404)');
      console.log(`\n   Possible reasons:`);
      console.log(`   - Product ID ${slugOrId} doesn't exist`);
      console.log(`   - Product is trashed (removedAt is set)`);
      console.log(`   - Slug "${slugOrId}" doesn't match any product`);
      console.log(`\n   Try:`);
      console.log(`   - Check if product exists in Strapi admin`);
      console.log(`   - Verify migration ran: npm run strapi db:migrate`);
    } else {
      console.error(`❌ Request failed with status ${res.statusCode}`);
      console.log('   Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
  console.log(`\n   Make sure:`);
  console.log(`   - Backend is running on ${API_BASE_URL}`);
  console.log(`   - API endpoint is accessible`);
  process.exit(1);
});

req.setTimeout(10000, () => {
  console.error('❌ Request timeout');
  req.destroy();
  process.exit(1);
});


