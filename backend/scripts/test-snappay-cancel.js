/**
 * Test script for SnappPay cancel operation
 * Run: node scripts/test-snappay-cancel.js <paymentToken>
 *
 * Note: Can only cancel transactions that are in "settled" status
 */

const axios = require('axios');

async function testSnappPayCancel(paymentToken) {
  try {
    console.log('Testing SnappPay Cancel...');
    console.log('Payment Token:', paymentToken);

    const response = await axios.post(
      'http://localhost:1337/api/payment-gateway/test-snappay-cancel',
      { paymentToken },
      {
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
        }
      }
    );

    console.log('\n✅ Cancel Result:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('\n❌ Cancel Failed:');
    console.error(error.response?.data || error.message);
  }
}

// Get paymentToken from command line
const paymentToken = process.argv[2];

if (!paymentToken) {
  console.error('Usage: node scripts/test-snappay-cancel.js <paymentToken>');
  console.error('\nHow to find paymentToken:');
  console.error('1. Check contract-transaction table for external_source="SnappPay"');
  console.error('2. Use the TrackId field as paymentToken');
  process.exit(1);
}

testSnappPayCancel(paymentToken);
