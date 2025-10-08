/**
 * Test script to verify callback URL configuration
 */

async function testCallbackUrl() {
  console.log('🔗 Testing Callback URL Configuration...\n');

  try {
    // Simulate the formatCallbackUrl function
    function formatCallbackUrl(callbackURL, serverUrl = "http://localhost:1337") {
      const defaultCallback = "/orders/payment-callback";
      let callbackUrl = callbackURL || defaultCallback;
      
      if (!callbackUrl.startsWith("http")) {
        callbackUrl = `${serverUrl}${callbackUrl.startsWith("/") ? "" : "/"}${callbackUrl}`;
      }
      
      return callbackUrl;
    }

    console.log('📋 Testing different scenarios:');
    console.log('');

    // Test 1: Default callback
    const defaultUrl = formatCallbackUrl();
    console.log('1. Default callback URL:');
    console.log('   Input: (none)');
    console.log('   Output:', defaultUrl);
    console.log('');

    // Test 2: Custom relative callback
    const customRelativeUrl = formatCallbackUrl("/custom/payment/callback");
    console.log('2. Custom relative callback URL:');
    console.log('   Input: "/custom/payment/callback"');
    console.log('   Output:', customRelativeUrl);
    console.log('');

    // Test 3: Absolute callback
    const absoluteUrl = formatCallbackUrl("https://example.com/callback");
    console.log('3. Absolute callback URL:');
    console.log('   Input: "https://example.com/callback"');
    console.log('   Output:', absoluteUrl);
    console.log('');

    // Test 4: Production-like URL
    const productionUrl = formatCallbackUrl("/orders/payment-callback", "https://infinity-bck.darkube.app");
    console.log('4. Production-like URL:');
    console.log('   Input: "/orders/payment-callback"');
    console.log('   Server: "https://infinity-bck.darkube.app"');
    console.log('   Output:', productionUrl);
    console.log('');

    // Test 5: API prefix
    const apiUrl = formatCallbackUrl("/api/orders/payment-callback");
    console.log('5. API prefixed URL:');
    console.log('   Input: "/api/orders/payment-callback"');
    console.log('   Output:', apiUrl);
    console.log('');

    console.log('🎯 Recommendations:');
    console.log('');
    console.log('✅ For Production:');
    console.log('   - Set server.url in Strapi config to your domain');
    console.log('   - Use: "https://your-domain.com/api/orders/payment-callback"');
    console.log('');
    console.log('⚠️  Common Issues:');
    console.log('   - Missing "/api" prefix in callback URL');
    console.log('   - HTTP vs HTTPS mismatch');
    console.log('   - Server URL not configured properly');
    console.log('   - Firewall blocking callback requests');
    console.log('');

    console.log('🔍 Current Route Configuration:');
    console.log('   Method: POST');
    console.log('   Path: /orders/payment-callback');
    console.log('   Full URL: {base}/api/orders/payment-callback');
    console.log('   Auth: false (accessible without token)');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testCallbackUrl()
    .then(success => {
      console.log('\n' + '='.repeat(50));
      if (success) {
        console.log('✅ Callback URL test completed!');
      } else {
        console.log('❌ Callback URL test failed!');
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
    });
}

module.exports = { testCallbackUrl }; 