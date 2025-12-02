const axios = require("axios");

/**
 * Debug script for Mellat Payment Gateway
 * This script helps identify connection issues with the Beh Pardakht Mellat gateway
 */

// Get credentials from environment variables or command-line arguments
const MELLAT_CONFIG = {
  terminalId: process.env.MELLAT_TERMINAL_ID || process.argv[2] || null,
  username: process.env.MELLAT_USERNAME || process.argv[3] || null, 
  password: process.env.MELLAT_PASSWORD || process.argv[4] || null,
  gatewayUrl: process.env.MELLAT_GATEWAY_URL || "https://bpm.shaparak.ir/pgwchannel/services/pgw"
};

// Validate required credentials
if (!MELLAT_CONFIG.terminalId || !MELLAT_CONFIG.username || !MELLAT_CONFIG.password) {
  console.error("❌ Error: Mellat credentials are required");
  console.error("   Set environment variables:");
  console.error("   export MELLAT_TERMINAL_ID='your-terminal-id'");
  console.error("   export MELLAT_USERNAME='your-username'");
  console.error("   export MELLAT_PASSWORD='your-password'");
  console.error("\n   Or pass as command-line arguments:");
  console.error("   node debug-mellat.js <terminalId> <username> <password>");
  process.exit(1);
}

class MellatDebugger {
  constructor() {
    this.results = {};
  }

  async testBasicConnectivity() {
    console.log("🔍 Testing basic connectivity to Mellat gateway...");
    
    try {
      // Test basic HTTP connectivity
      const response = await axios.get("https://bpm.shaparak.ir", {
        timeout: 10000,
        validateStatus: () => true // Accept any status code
      });
      
      console.log(`✅ Basic connectivity: ${response.status} ${response.statusText}`);
      this.results.connectivity = true;
      return true;
    } catch (error) {
      console.log(`❌ Basic connectivity failed: ${error.message}`);
      this.results.connectivity = false;
      return false;
    }
  }

  async testGatewayEndpoint() {
    console.log("🔍 Testing gateway SOAP endpoint...");
    
    try {
      // Test the actual SOAP endpoint
      const response = await axios.get(MELLAT_CONFIG.gatewayUrl, {
        timeout: 10000,
        validateStatus: () => true
      });
      
      console.log(`✅ Gateway endpoint: ${response.status} ${response.statusText}`);
      this.results.gateway = true;
      return true;
    } catch (error) {
      console.log(`❌ Gateway endpoint failed: ${error.message}`);
      this.results.gateway = false;
      return false;
    }
  }

  createTestSOAPRequest() {
    const testOrderId = Math.floor(Math.random() * 1000000);
    const testAmount = 10000; // 100 Toman test amount
    const testUserId = 1;
    const callbackUrl = "https://example.com/callback";

    const currentDate = new Date();
    const localDate = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
    const localTime = currentDate.toTimeString().slice(0, 8).replace(/:/g, "");

    // Order of elements must match Mellat gateway expectations
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <bpPayRequest xmlns="http://interfaces.core.sw.bps.com/">
      <userPassword>${MELLAT_CONFIG.password}</userPassword>
      <amount>${testAmount}</amount>
      <callBackUrl>${callbackUrl}</callBackUrl>
      <orderId>${testOrderId}</orderId>
      <payerId>${testUserId}</payerId>
      <terminalId>${MELLAT_CONFIG.terminalId}</terminalId>
      <userName>${MELLAT_CONFIG.username}</userName>
      <localTime>${localTime}</localTime>
      <localDate>${localDate}</localDate>
      <additionalData>Test-Debug</additionalData>
    </bpPayRequest>
  </soap:Body>
</soap:Envelope>`;
  }

  async testSOAPRequest() {
    console.log("🔍 Testing SOAP payment request...");
    
    const soapEnvelope = this.createTestSOAPRequest();
    
    console.log("📤 SOAP Request:");
    console.log(soapEnvelope);
    console.log("\n" + "=".repeat(50) + "\n");

    try {
      const response = await axios.post(
        MELLAT_CONFIG.gatewayUrl,
        soapEnvelope,
        {
          headers: {
            "Content-Type": "text/xml; charset=utf-8",
            "SOAPAction": "",
          },
          timeout: 30000,
          validateStatus: () => true // Accept any status code
        }
      );

      console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
      console.log("📥 Response Headers:", response.headers);
      console.log("📥 Response Data:");
      console.log(response.data);
      
      // Try to parse the response
      if (response.data && typeof response.data === 'string') {
        const refIdMatch = response.data.match(/<return[^>]*>([^<]+)<\/return>/);
        if (refIdMatch) {
          const refId = refIdMatch[1];
          console.log(`🔑 Extracted RefId: ${refId}`);
          
          if (refId.includes(",") || parseInt(refId) < 0) {
            console.log(`❌ Error code detected: ${refId}`);
            this.decodeErrorCode(refId);
          } else {
            console.log("✅ Valid RefId received");
          }
        }
      }

      this.results.soapRequest = {
        status: response.status,
        success: response.status === 200,
        data: response.data
      };

      return response.status === 200;
    } catch (error) {
      console.log(`❌ SOAP request failed: ${error.message}`);
      
      if (error.response) {
        console.log(`📊 Error Status: ${error.response.status}`);
        console.log(`📊 Error Data:`, error.response.data);
      }
      
      this.results.soapRequest = {
        success: false,
        error: error.message
      };
      
      return false;
    }
  }

  decodeErrorCode(errorCode) {
    const errorCodes = {
      "11": "شماره کارت نامعتبر است",
      "12": "موجودی کافی نیست", 
      "13": "رمز نادرست است",
      "14": "تعداد دفعات وارد کردن رمز بیش از حد مجاز است",
      "15": "کارت نامعتبر است",
      "16": "وجه برداشت بیش از حد مجاز است",
      "17": "کاربر از انجام تراکنش منصرف شده است",
      "18": "تاریخ انقضای کارت گذشته است",
      "19": "مبلغ برداشت بیش از حد مجاز است",
      "111": "صادر کننده کارت نامعتبر است",
      "112": "خطای سوییچ صادر کننده کارت",
      "113": "پاسخی از صادر کننده کارت دریافت نشد",
      "114": "دارنده این کارت مجاز به انجام این تراکنش نیست",
      "21": "پذیرنده نامعتبر است",
      "23": "خطای امنیتی رخ داده است",
      "24": "اطلاعات کاربری پذیرنده نامعتبر است",
      "25": "مبلغ نامعتبر است",
      "31": "پاسخ نامعتبر است",
      "32": "فرمت اطلاعات وارد شده صحیح نمی‌باشد",
      "33": "حساب نامعتبر است",
      "34": "خطای سیستمی",
      "35": "تاریخ نامعتبر است",
      "41": "شماره درخواست تکراری است",
      "42": "تراکنش Sale یافت نشد",
      "43": "قبلا درخواست Verify داده شده است",
      "44": "درخواست Verify یافت نشد",
      "45": "تراکنش Settle شده است",
      "46": "تراکنش Settle نشده است",
      "47": "تراکنش Settle یافت نشد",
      "48": "تراکنش Reverse شده است",
      "49": "تراکنش Refund یافت نشد",
      "412": "شناسه قبض نادرست است",
      "413": "شناسه پرداخت نادرست است",
      "414": "سازمان صادر کننده قبض نامعتبر است",
      "415": "زمان جلسه کاری به پایان رسیده است",
      "416": "خطا در ثبت اطلاعات",
      "417": "شناسه پرداخت کننده نامعتبر است",
      "418": "اشکال در تعریف اطلاعات مشتری",
      "419": "تعداد دفعات ورود اطلاعات از حد مجاز گذشته است",
      "421": "IP نامعتبر است"
    };

    const code = errorCode.toString();
    if (errorCodes[code]) {
      console.log(`🔍 Error meaning: ${errorCodes[code]}`);
    } else {
      console.log(`🔍 Unknown error code: ${code}`);
    }
  }

  async runFullDiagnostics() {
    console.log("🚀 Starting Mellat Payment Gateway Diagnostics\n");
    console.log("=".repeat(60));
    
    await this.testBasicConnectivity();
    console.log("");
    
    await this.testGatewayEndpoint();
    console.log("");
    
    await this.testSOAPRequest();
    console.log("");
    
    console.log("=".repeat(60));
    console.log("📊 DIAGNOSTIC SUMMARY");
    console.log("=".repeat(60));
    console.log("Basic Connectivity:", this.results.connectivity ? "✅ PASS" : "❌ FAIL");
    console.log("Gateway Endpoint:", this.results.gateway ? "✅ PASS" : "❌ FAIL");
    console.log("SOAP Request:", this.results.soapRequest?.success ? "✅ PASS" : "❌ FAIL");
    
    if (!this.results.connectivity) {
      console.log("\n🚨 Network connectivity issue detected!");
      console.log("💡 Check your internet connection and firewall settings.");
    }
    
    if (!this.results.gateway) {
      console.log("\n🚨 Gateway endpoint not accessible!");
      console.log("💡 Bank Mellat servers might be down or blocking requests.");
    }
    
    if (!this.results.soapRequest?.success) {
      console.log("\n🚨 SOAP request failed!");
      console.log("💡 Check credentials, request format, or IP whitelisting.");
    }
    
    console.log("\n📋 NEXT STEPS:");
    console.log("1. Verify your Mellat merchant credentials");
    console.log("2. Check if your server IP is whitelisted with Bank Mellat");
    console.log("3. Ensure you're using production credentials for production environment");
    console.log("4. Contact Bank Mellat support if issues persist");
  }
}

// Run diagnostics
const mellatDebugger = new MellatDebugger();
mellatDebugger.runFullDiagnostics().catch(console.error); 