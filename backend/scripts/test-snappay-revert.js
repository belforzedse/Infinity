/**
 * Test script for SnappPay revert operation
 * Run: node scripts/test-snappay-revert.js <paymentToken>
 *
 * Note: Can only revert transactions that are in "verified" status (before settle)
 */

const axios = require('axios');

async function testSnappPayRevert(paymentToken) {
  try {
    console.log('Testing SnappPay Revert...');
    console.log('Payment Token:', paymentToken);

    const response = await axios.post(
      'http://localhost:1337/api/payment-gateway/test-snappay-revert',
      { paymentToken },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('\n✅ Revert Result:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('\n❌ Revert Failed:');
    console.error(error.response?.data || error.message);
  }
}

// Get paymentToken from command line
const paymentToken = process.argv[2];

if (!paymentToken) {
  console.error('Usage: node scripts/test-snappay-revert.js <paymentToken>');
  console.error('\nHow to find paymentToken:');
  console.error('1. Check contract-transaction table for external_source="SnappPay"');
  console.error('2. Use the TrackId field as paymentToken');
  console.error('\nNote: Only works on transactions that have been verified but NOT settled');
  process.exit(1);
}

testSnappPayRevert(paymentToken);
