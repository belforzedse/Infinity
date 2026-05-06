/**
 * Test script for Mellat V2 implementation using direct HTTP/SOAP
 */

const axios = require('axios');

async function testMellatV2() {
  console.log('🔄 Testing Mellat V2 (HTTP/SOAP Implementation)...\n');

  try {
    // Configuration
    const config = {
      terminalId: process.env.MELLAT_TERMINAL_ID || "MELLAT_TERMINAL_ID",
      username: process.env.MELLAT_USERNAME || "MELLAT_TERMINAL_ID",
      password: process.env.MELLAT_PASSWORD || "MELLAT_PASSWORD",
      gatewayUrl: process.env.MELLAT_GATEWAY_URL || "https://bpm.shaparak.ir/pgwchannel/services/pgw",
    };

    console.log('📋 Configuration:');
    console.log({
      terminalId: config.terminalId.slice(0, 3) + '****',
      username: config.username.slice(0, 3) + '****',
      gatewayUrl: config.gatewayUrl,
      timeout: '30000ms'
    });
    console.log('');

    // Test parameters
    const orderId = Math.floor(Math.random() * 1000000);
    const amount = 10000; // 10,000 Rials
    const callbackUrl = 'https://api.infinity.rgbgroup.ir/api/orders/payment-callback';

    console.log('🔄 Testing HTTP POST (REST endpoint)...');
    const payload = new URLSearchParams({
      terminalId: config.terminalId,
      userName: config.username,
      userPassword: config.password,
      orderId: orderId.toString(),
      amount: amount.toString(),
      localDate: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
      localTime: new Date().toTimeString().slice(0, 8).replace(/:/g, ""),
      additionalData: 'Test-V2',
      callBackUrl: callbackUrl,
      payerId: '1'
    });

    console.log('Parameters:', { orderId, amount, callbackUrl });
    console.log('');

    const startTime = Date.now();

    try {
      // Try REST endpoint first
      console.log('📡 Attempting REST endpoint: /pay');
      const response = await axios.post(
        `${config.gatewayUrl}/pay`,
        payload,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; Infinity-Store/1.0)'
          },
          timeout: 30000,
          validateStatus: (status) => status < 500
        }
      );

      const duration = Date.now() - startTime;
      console.log(`✅ HTTP response received in ${duration}ms`);
      console.log('Status:', response.status);
      console.log('Content-Type:', response.headers['content-type']);
      console.log('Response:', JSON.stringify(response.data).slice(0, 200));

    } catch (restError) {
      const duration = Date.now() - startTime;
      console.log(`⚠️  REST endpoint failed after ${duration}ms, trying SOAP fallback...`);
      console.log('Error:', restError.message);
      console.log('');

      // Fallback to SOAP
      console.log('📡 Attempting SOAP fallback');
      const soapXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <bpPayRequest xmlns="http://interfaces.core.sw.bps.com/">
      <terminalId>${config.terminalId}</terminalId>
      <userName>${config.username}</userName>
      <userPassword>${config.password}</userPassword>
      <orderId>${orderId}</orderId>
      <amount>${amount}</amount>
      <localDate>${new Date().toISOString().slice(0, 10).replace(/-/g, "")}</localDate>
      <localTime>${new Date().toTimeString().slice(0, 8).replace(/:/g, "")}</localTime>
      <additionalData>Test-V2</additionalData>
      <callBackUrl>${callbackUrl}</callBackUrl>
      <payerId>1</payerId>
    </bpPayRequest>
  </soap:Body>
</soap:Envelope>`;

      const soapStart = Date.now();
      const soapResponse = await axios.post(
        config.gatewayUrl,
        soapXml,
        {
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': ''
          },
          timeout: 30000
        }
      );

      const soapDuration = Date.now() - soapStart;
      console.log(`✅ SOAP response received in ${soapDuration}ms`);
      console.log('Status:', soapResponse.status);
      console.log('Response (first 300 chars):', soapResponse.data.slice(0, 300));

      // Parse RefId from SOAP response
      const refIdMatch = soapResponse.data.match(/<return[^>]*>([^<]+)<\/return>/);
      if (refIdMatch) {
        const refId = refIdMatch[1].trim();
        console.log('\n📊 Payment Request Result:');
        console.log('RefId:', refId);

        if (refId && !refId.includes(',') && parseInt(refId) > 0) {
          console.log('✅ Payment request successful!');
          console.log('🔗 Redirect URL:', `https://bpm.shaparak.ir/pgwchannel/startpay.mellat?RefId=${refId}`);
        } else {
          console.log('❌ Gateway returned error code:', refId);
          const errorCodes = {
            11: "Invalid card number",
            12: "Insufficient balance",
            21: "Invalid merchant",
            24: "Invalid merchant credentials",
            25: "Invalid amount",
            34: "System error",
            421: "Invalid IP address"
          };
          const desc = errorCodes[refId] || `Unknown error: ${refId}`;
          console.log('Error:', desc);
        }
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`\n⏱️  Total time: ${totalDuration}ms`);
    console.log('🎉 Test completed!');
    return true;

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('\n❌ Test failed with error:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Duration before error:', duration + 'ms');

    if (error.code === 'ETIMEDOUT') {
      console.error('\n⚠️  TIMEOUT ERROR - Connection took too long');
      console.error('This suggests network/firewall issues, not code issues');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  CONNECTION REFUSED - Check if gateway is reachable');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n⚠️  DNS RESOLUTION FAILED - Check DNS settings');
    }

    console.error('\nStack:', error.stack);
    return false;
  }
}

// Run the test
const startTime = Date.now();
if (require.main === module) {
  testMellatV2()
    .then(success => {
      console.log('\n' + '='.repeat(50));
      const totalTime = Date.now() - startTime;
      if (success) {
        console.log(`✅ Test passed! Total time: ${totalTime}ms`);
      } else {
        console.log(`❌ Test failed! Total time: ${totalTime}ms`);
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testMellatV2 };
