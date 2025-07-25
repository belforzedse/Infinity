/**
 * Test script for the new Mellat V3 implementation using mellat-checkout package
 */

const MellatCheckout = require('mellat-checkout');

async function testMellatCheckout() {
  console.log('🔄 Testing Mellat Checkout Package...\n');

  try {
    // Configuration (using test credentials)
    const config = {
      terminalId: process.env.MELLAT_TERMINAL_ID || "MELLAT_TERMINAL_ID",
      username: process.env.MELLAT_USERNAME || "MELLAT_TERMINAL_ID",
      password: process.env.MELLAT_PASSWORD || "MELLAT_PASSWORD",
      timeout: 15000,
      apiUrl: process.env.MELLAT_GATEWAY_URL || 'https://bpm.shaparak.ir/pgwchannel/services/pgw?wsdl'
    };

    console.log('📋 Configuration:');
    console.log({
      terminalId: config.terminalId.slice(0, 3) + '****',
      username: config.username.slice(0, 3) + '****',
      apiUrl: config.apiUrl,
      timeout: config.timeout
    });
    console.log('');

    // Create Mellat client
    const mellat = new MellatCheckout(config);
    console.log('✅ Mellat client created successfully');

    // Test initialization
    console.log('🔄 Initializing client...');
    await mellat.initialize();
    console.log('✅ Client initialized successfully');

    // Test payment request
    const orderId = Math.floor(Math.random() * 1000000);
    const amount = 10000; // 10,000 Rials
    
    console.log('\n🔄 Testing payment request...');
    console.log('Parameters:', { orderId, amount });

    const paymentResult = await mellat.paymentRequest({
      amount: amount,
      orderId: orderId.toString(),
      callbackUrl: 'http://localhost:1337/test/callback',
      payerId: '1'
    });

    console.log('\n📊 Payment Request Result:');
    console.log('Response Code:', paymentResult.resCode);
    console.log('RefId:', paymentResult.refId);
    
    if (paymentResult.resCode === 0) {
      console.log('✅ Payment request successful!');
      console.log('🔗 Redirect URL: https://bpm.shaparak.ir/pgwchannel/startpay.mellat');
      console.log('🆔 RefId for redirect:', paymentResult.refId);
    } else {
      console.log('❌ Payment request failed');
      console.log('Error Code:', paymentResult.resCode);
      
      // Error code descriptions
      const errorCodes = {
        11: "شماره کارت نامعتبر است - Invalid card number",
        12: "موجودی کافی نیست - Insufficient balance",
        21: "پذیرنده نامعتبر است - Invalid merchant",
        24: "اطلاعات کاربری پذیرنده نامعتبر است - Invalid merchant user info",
        25: "مبلغ نامعتبر است - Invalid amount",
        34: "خطای سیستمی - System error",
        421: "IP نامعتبر است - Invalid IP address"
      };
      
      const errorDesc = errorCodes[paymentResult.resCode] || `Unknown error code: ${paymentResult.resCode}`;
      console.log('Error Description:', errorDesc);
    }

    console.log('\n🎉 Test completed successfully!');
    return true;

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testMellatCheckout()
    .then(success => {
      console.log('\n' + '='.repeat(50));
      if (success) {
        console.log('✅ All tests passed! Mellat-checkout package is working correctly.');
      } else {
        console.log('❌ Tests failed! Check the error messages above.');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testMellatCheckout }; 