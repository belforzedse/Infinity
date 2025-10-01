const axios = require("axios");

// Test different connection methods
async function testSimpleConnection() {
  const url = "https://api.infinitycolor.co";
  const token =
    "5ded48b60050770a36fd985fdef2a20b971cd82f26e2e8bc02d38b4fb52258c1ace5049f2bc82b8d336dd20b88d6af9bc826c49a465e4698042fac690650f70a663d357e9bc52e8a6c9cc4a5de7075e07472c6a6d55f0c9a29690a3e6717000c61bb9ba085c233311c9d7e7e1f8f3ab3ff6985a5fd7f2f4ede73204761451fd6";

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
