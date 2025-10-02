/**
 * Test script for SnappPay update operation
 * Run: node scripts/test-snappay-update.js <paymentToken> <orderId>
 *
 * Note: Can only update transactions that are in "settled" status
 * Only allows REDUCING amount (not increasing)
 */

const axios = require('axios');

async function testSnappPayUpdate(paymentToken, orderId) {
  try {
    console.log('Testing SnappPay Update...');
    console.log('Payment Token:', paymentToken);
    console.log('Order ID:', orderId);

    // First, get the original order to build updated cart
    console.log('\n📦 Fetching original order details...');

    // Example updated cart structure (you need to adjust based on actual order)
    // This should represent the REMAINING items after return/refund
    const updatedCart = {
      amount: 30000, // New reduced amount in IRR (e.g., 3000 toman)
      discountAmount: 0,
      externalSourceAmount: 0,
      mobile: "+989121234567", // Keep original mobile
      paymentMethodTypeDto: "INSTALLMENT",
      returnURL: "https://api.infinitycolor.co/api/orders/payment-callback",
      transactionId: `U${orderId}${Date.now()}`.slice(0, 10), // New transaction ID
      cartList: [
        {
          cartId: parseInt(orderId),
          cartItems: [
            // Example: Only remaining items after one item was returned
            {
              amount: 30000, // Price per item in IRR
              category: "پوشاک", // Persian category name
              count: 1, // Reduced count
              id: 1,
              name: "محصول باقی‌مانده",
              commissionType: 100,
            },
          ],
          isShipmentIncluded: true,
          isTaxIncluded: true,
          shippingAmount: 0, // Adjust if needed
          taxAmount: 0, // Adjust if needed
          totalAmount: 30000, // Total of remaining items
        },
      ],
    };

    console.log('\n📝 Updated Cart Structure:');
    console.log(JSON.stringify(updatedCart, null, 2));
    console.log('\n⚠️  NOTE: You need to adjust the cart structure based on actual order!');
    console.log('⚠️  This is just an example. Modify the script with real data.\n');

    const response = await axios.post(
      'http://localhost:1337/api/payment-gateway/test-snappay-update',
      {
        paymentToken,
        updatedCart
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('\n✅ Update Result:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('\n❌ Update Failed:');
    console.error(error.response?.data || error.message);
  }
}

// Get paymentToken and orderId from command line
const paymentToken = process.argv[2];
const orderId = process.argv[3];

if (!paymentToken || !orderId) {
  console.error('Usage: node scripts/test-snappay-update.js <paymentToken> <orderId>');
  console.error('\nHow to find paymentToken and orderId:');
  console.error('1. Check contract-transaction table for external_source="SnappPay"');
  console.error('2. Use the TrackId field as paymentToken');
  console.error('3. Get the order ID from the contract');
  console.error('\nNote: Only works on transactions that have been settled');
  console.error('\nIMPORTANT: Edit this script to set the correct updatedCart structure!');
  console.error('The updatedCart should reflect the remaining items after return/refund.');
  process.exit(1);
}

testSnappPayUpdate(paymentToken, orderId);
