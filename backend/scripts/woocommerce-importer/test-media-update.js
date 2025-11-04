#!/usr/bin/env node

/**
 * Test script to diagnose media field update format in Strapi
 * Run with: STRAPI_TOKEN=your_token node test-media-update.js
 */

const axios = require('axios');

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337/api';
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
});

async function testMediaUpdate() {
  try {
    // First, find a product to test with
    console.log('🔍 Finding a test product...');
    const productsRes = await client.get('/products', {
      fields: ['id', 'Title'],
      pagination: { limit: 1 },
    });

    if (!productsRes.data.data || productsRes.data.data.length === 0) {
      console.error('❌ No products found to test with');
      process.exit(1);
    }

    const testProduct = productsRes.data.data[0];
    const productId = testProduct.id;
    console.log(`✅ Using product: ${testProduct.attributes.Title} (ID: ${productId})`);

    // Find or create a test media file
    console.log('\n🔍 Finding a test media file...');
    const mediaRes = await client.get('/upload/files', {
      pagination: { limit: 1 },
    });

    if (!mediaRes.data.data || mediaRes.data.data.length === 0) {
      console.error('❌ No media files found. Please upload an image first.');
      process.exit(1);
    }

    const testMedia = mediaRes.data.data[0];
    const mediaId = testMedia.id;
    console.log(`✅ Using media: ${testMedia.name} (ID: ${mediaId})`);

    // Test different update formats
    console.log('\n📝 Testing different media field update formats...\n');

    // Format 1: Direct ID
    console.log('1️⃣  Testing format: { CoverImage: <ID> }');
    try {
      const res = await client.put(`/products/${productId}`, {
        data: {
          CoverImage: mediaId,
        },
      });
      console.log('   ✅ SUCCESS');
      console.log(`   Response: ${JSON.stringify(res.data, null, 2)}`);
    } catch (err) {
      console.log(`   ❌ FAILED: ${err.response?.data?.message || err.message}`);
      if (err.response?.data?.error?.details) {
        console.log(`   Details: ${JSON.stringify(err.response.data.error.details)}`);
      }
    }

    // Format 2: Object with id
    console.log('\n2️⃣  Testing format: { CoverImage: { id: <ID> } }');
    try {
      const res = await client.put(`/products/${productId}`, {
        data: {
          CoverImage: { id: mediaId },
        },
      });
      console.log('   ✅ SUCCESS');
      console.log(`   Response: ${JSON.stringify(res.data, null, 2)}`);
    } catch (err) {
      console.log(`   ❌ FAILED: ${err.response?.data?.message || err.message}`);
      if (err.response?.data?.error?.details) {
        console.log(`   Details: ${JSON.stringify(err.response.data.error.details)}`);
      }
    }

    // Format 3: Connect syntax
    console.log('\n3️⃣  Testing format: { CoverImage: { connect: [{ id: <ID> }] } }');
    try {
      const res = await client.put(`/products/${productId}`, {
        data: {
          CoverImage: {
            connect: [{ id: mediaId }],
          },
        },
      });
      console.log('   ✅ SUCCESS');
      console.log(`   Response: ${JSON.stringify(res.data, null, 2)}`);
    } catch (err) {
      console.log(`   ❌ FAILED: ${err.response?.data?.message || err.message}`);
      if (err.response?.data?.error?.details) {
        console.log(`   Details: ${JSON.stringify(err.response.data.error.details)}`);
      }
    }

    // Format 4: Disconnect and connect
    console.log('\n4️⃣  Testing format: { CoverImage: { disconnect: true, connect: [{ id: <ID> }] } }');
    try {
      const res = await client.put(`/products/${productId}`, {
        data: {
          CoverImage: {
            disconnect: true,
            connect: [{ id: mediaId }],
          },
        },
      });
      console.log('   ✅ SUCCESS');
      console.log(`   Response: ${JSON.stringify(res.data, null, 2)}`);
    } catch (err) {
      console.log(`   ❌ FAILED: ${err.response?.data?.message || err.message}`);
      if (err.response?.data?.error?.details) {
        console.log(`   Details: ${JSON.stringify(err.response.data.error.details)}`);
      }
    }

    // Format 5: Array for Media field
    console.log('\n5️⃣  Testing format for Media field: { Media: [{ id: <ID> }] }');
    try {
      const res = await client.put(`/products/${productId}`, {
        data: {
          Media: [{ id: mediaId }],
        },
      });
      console.log('   ✅ SUCCESS');
      console.log(`   Response: ${JSON.stringify(res.data, null, 2)}`);
    } catch (err) {
      console.log(`   ❌ FAILED: ${err.response?.data?.message || err.message}`);
      if (err.response?.data?.error?.details) {
        console.log(`   Details: ${JSON.stringify(err.response.data.error.details)}`);
      }
    }

    console.log('\n✅ Test complete');
  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

testMediaUpdate();
