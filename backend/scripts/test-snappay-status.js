/**
 * Test script for SnappPay status inquiry
 * Run: node scripts/test-snappay-status.js <paymentToken>
 *
 * Note: Can check status of any transaction at any time
 */

const axios = require('axios');

async function testSnappPayStatus(paymentToken) {
  try {
    console.log('Testing SnappPay Status Inquiry...');
    console.log('Payment Token:', paymentToken);

    const response = await axios.post(
      'http://localhost:1337/api/payment-gateway/test-snappay-status',
      { paymentToken },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('\n✅ Status Result:');
    console.log(JSON.stringify(response.data, null, 2));

    // Parse and display status nicely
    if (response.data?.data?.result?.response?.status) {
      console.log('\n📊 Transaction Status:', response.data.data.result.response.status);
    }

  } catch (error) {
    console.error('\n❌ Status Inquiry Failed:');
    console.error(error.response?.data || error.message);
  }
}

// Get paymentToken from command line
const paymentToken = process.argv[2];

if (!paymentToken) {
  console.error('Usage: node scripts/test-snappay-status.js <paymentToken>');
  console.error('\nHow to find paymentToken:');
  console.error('1. Check contract-transaction table for external_source="SnappPay"');
  console.error('2. Use the TrackId field as paymentToken');
  process.exit(1);
}

testSnappPayStatus(paymentToken);
