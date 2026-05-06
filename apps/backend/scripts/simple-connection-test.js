const axios = require("axios");

// Test different connection methods
async function testSimpleConnection() {
  const url = "https://api.infinity.rgbgroup.ir/api";
  const token =
    "STRAPI_API_TOKEN";

  console.log("🔍 Testing basic connection methods...\n");

  // Test 1: Basic GET without authentication
  try {
    console.log("Test 1: Basic GET to root");
    const response = await axios.get(url, { timeout: 10000 });
    console.log("✅ Success:", response.status, response.statusText);
  } catch (error) {
    console.log("❌ Failed:", error.message);
  }

  // Test 2: GET with authentication header
  try {
    console.log("\nTest 2: GET with auth header");
    const response = await axios.get(`${url}/api/products`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
    console.log("✅ Success:", response.status, response.statusText);
  } catch (error) {
    console.log("❌ Failed:", error.message);
    if (error.response) {
      console.log("📊 Response status:", error.response.status);
      console.log("📊 Response headers:", Object.keys(error.response.headers));
    }
  }

  // Test 3: Try HTTP instead of HTTPS
  try {
    console.log("\nTest 3: HTTP instead of HTTPS");
    const httpUrl = url.replace("https://", "http://");
    const response = await axios.get(httpUrl, { timeout: 10000 });
    console.log("✅ HTTP Success:", response.status, response.statusText);
  } catch (error) {
    console.log("❌ HTTP Failed:", error.message);
  }

  // Test 4: Check if it's a Node.js specific issue
  try {
    console.log("\nTest 4: Using curl equivalent");
    const response = await axios({
      method: "GET",
      url: `${url}/api/products`,
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "axios/1.9.0",
      },
      timeout: 10000,
      validateStatus: () => true, // Accept any status code
    });
    console.log("✅ Curl-like Success:", response.status, response.statusText);
    console.log("📊 Response data type:", typeof response.data);
  } catch (error) {
    console.log("❌ Curl-like Failed:", error.message);
  }
}

testSimpleConnection().catch(console.error);
