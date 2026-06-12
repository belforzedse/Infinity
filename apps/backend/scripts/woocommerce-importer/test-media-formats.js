#!/usr/bin/env node

/**
 * Quick test for media field update formats
 */

const axios = require('axios');

const STRAPI_URL = process.env.STRAPI_URL || 'https://api.staging.infinitycolor.co/api';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

if (!STRAPI_TOKEN) {
  console.error('❌ STRAPI_TOKEN environment variable is required');
  process.exit(1);
}

const client = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    Authorization: `Bearer ${STRAPI_TOKEN}`,
  },
  timeout: 15000,
});

async function testFormat(name, productId, mediaId, format) {
  console.log(`\n${name}`);
  console.log(`Request body: ${JSON.stringify({ data: format }, null, 2)}`);

  try {
    const res = await client.put(`/products/${productId}`, { data: format });
    console.log('✅ SUCCESS');
    return true;
  } catch (err) {
    console.log(`❌ FAILED: ${err.response?.data?.message || err.message}`);
    if (err.response?.data?.error?.details) {
      console.log(`Details: ${JSON.stringify(err.response.data.error.details)}`);
    }
    if (err.response?.data?.errors) {
      console.log(`Errors: ${JSON.stringify(err.response.data.errors)}`);
    }
    return false;
  }
}

async function runTests() {
  try {
    // Use a known product ID - adjust this as needed
    const productId = 6480;
    const mediaId = 1; // Try with ID 1 first

    console.log(`🧪 Testing media update formats for product ${productId} with media ${mediaId}`);
    console.log('=====================================\n');

    const formats = [
      { name: '1️⃣  Direct ID', format: { CoverImage: mediaId } },
      { name: '2️⃣  Object with id', format: { CoverImage: { id: mediaId } } },
      { name: '3️⃣  Connect syntax (single)', format: { CoverImage: { connect: [{ id: mediaId }] } } },
      { name: '4️⃣  Disconnect and connect', format: { CoverImage: { disconnect: true, connect: [{ id: mediaId }] } } },
      { name: '5️⃣  Media array with object', format: { Media: [{ id: mediaId }] } },
      { name: '6️⃣  Media array with IDs', format: { Media: [mediaId] } },
    ];

    let successCount = 0;
    for (const test of formats) {
      const success = await testFormat(test.name, productId, mediaId, test.format);
      if (success) successCount++;
    }

    console.log(`\n✅ Summary: ${successCount}/${formats.length} formats succeeded`);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

runTests();
