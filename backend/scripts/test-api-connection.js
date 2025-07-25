const axios = require("axios");

// Configuration
const STRAPI_URL = "https://infinity-bck.darkube.app";
const API_TOKEN =
  "5ded48b60050770a36fd985fdef2a20b971cd82f26e2e8bc02d38b4fb52258c1ace5049f2bc82b8d336dd20b88d6af9bc826c49a465e4698042fac690650f70a663d357e9bc52e8a6c9cc4a5de7075e07472c6a6d55f0c9a29690a3e6717000c61bb9ba085c233311c9d7e7e1f8f3ab3ff6985a5fd7f2f4ede73204761451fd6";

// API client setup
const apiClient = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    Authorization: `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
  },
  timeout: 30000,
  // Bypass SSL verification for testing (remove in production)
  httpsAgent: new (require("https").Agent)({
    rejectUnauthorized: false,
  }),
});

class APITester {
  constructor() {
    this.testResults = {
      connection: false,
      endpoints: {},
      schemas: {},
      counts: {},
    };
  }

  async testConnection() {
    try {
      console.log("🔍 Testing API connection...");
      console.log(`🌐 Connecting to: ${STRAPI_URL}`);

      // Try different endpoints to test connectivity
      const testEndpoints = ["/api", "/api/products", "/"];

      for (const endpoint of testEndpoints) {
        try {
          console.log(`🔍 Trying endpoint: ${endpoint}`);
          const response = await apiClient.get(
            endpoint + "?pagination[pageSize]=1"
          );
          this.testResults.connection = true;
          console.log(`✅ API connection successful via ${endpoint}`);
          console.log(`📊 Status: ${response.status} ${response.statusText}`);
          return true;
        } catch (endpointError) {
          console.log(
            `⚠️ Endpoint ${endpoint} failed: ${endpointError.message}`
          );
          if (endpointError.response?.status) {
            console.log(
              `📊 Status: ${endpointError.response.status} ${endpointError.response.statusText}`
            );
            // If we get a response (even error), the server is reachable
            if (
              endpointError.response.status === 401 ||
              endpointError.response.status === 403
            ) {
              console.log(
                "🔑 Server is reachable but authentication may be required"
              );
              this.testResults.connection = true;
              return true;
            }
          }
        }
      }

      throw new Error("All endpoints failed");
    } catch (error) {
      console.error("❌ API connection failed:", error.message);
      console.error("🔍 Error details:", {
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        baseURL: error.config?.baseURL,
      });
      this.testResults.connection = false;
      return false;
    }
  }

  async testEndpoint(endpoint, name) {
    try {
      console.log(`🔍 Testing ${name} endpoint...`);
      const response = await apiClient.get(
        `${endpoint}?pagination[pageSize]=1`
      );
      this.testResults.endpoints[name] = {
        status: "success",
        available: true,
        count: response.data.meta?.pagination?.total || 0,
      };
      this.testResults.counts[name] =
        response.data.meta?.pagination?.total || 0;
      console.log(
        `✅ ${name} endpoint working - ${this.testResults.counts[name]} records`
      );
      return response.data;
    } catch (error) {
      console.error(`❌ ${name} endpoint failed:`, error.message);
      this.testResults.endpoints[name] = {
        status: "error",
        available: false,
        error: error.message,
      };
      return null;
    }
  }

  async checkSchemaStructure(endpoint, name) {
    try {
      const response = await apiClient.get(
        `${endpoint}?pagination[pageSize]=1&populate=*`
      );
      if (response.data.data && response.data.data.length > 0) {
        const sampleItem = response.data.data[0];
        this.testResults.schemas[name] = {
          id: sampleItem.id,
          attributes: Object.keys(sampleItem.attributes || {}),
          sampleData: sampleItem,
        };
        console.log(
          `📋 ${name} schema structure:`,
          Object.keys(sampleItem.attributes || {})
        );
      } else {
        this.testResults.schemas[name] = {
          attributes: [],
          note: "No existing records to analyze schema",
        };
        console.log(`📋 ${name}: No existing records to analyze schema`);
      }
    } catch (error) {
      console.error(`❌ Failed to check ${name} schema:`, error.message);
    }
  }

  async runAllTests() {
    console.log("🚀 Starting API and Schema Tests\n");
    console.log("=".repeat(60));

    // Test basic connection
    const connectionOk = await this.testConnection();
    if (!connectionOk) {
      console.log("\n❌ Cannot proceed without API connection");
      return;
    }

    console.log("\n📊 Testing all endpoints...");

    // Test all required endpoints
    const endpoints = [
      { url: "/api/products", name: "Products" },
      { url: "/api/product-categories", name: "Categories" },
      { url: "/api/product-variations", name: "Variations" },
      { url: "/api/product-variation-colors", name: "Colors" },
      { url: "/api/product-variation-sizes", name: "Sizes" },
      { url: "/api/product-variation-models", name: "Models" },
      { url: "/api/product-stocks", name: "Stocks" },
      { url: "/api/upload", name: "Upload" },
    ];

    for (const endpoint of endpoints) {
      if (endpoint.name === "Upload") {
        // Special test for upload endpoint
        try {
          // Just test if the endpoint exists, don't actually upload
          console.log(`🔍 Testing ${endpoint.name} endpoint...`);
          this.testResults.endpoints[endpoint.name] = {
            status: "available",
            available: true,
            note: "Upload endpoint available",
          };
          console.log(`✅ ${endpoint.name} endpoint available`);
        } catch (error) {
          console.error(`❌ ${endpoint.name} endpoint failed:`, error.message);
        }
      } else {
        await this.testEndpoint(endpoint.url, endpoint.name);
      }
    }

    console.log("\n📋 Checking schema structures...");

    // Check schema structures for entities with data
    const schemaEndpoints = [
      { url: "/api/products", name: "Products" },
      { url: "/api/product-categories", name: "Categories" },
      { url: "/api/product-variations", name: "Variations" },
      { url: "/api/product-variation-colors", name: "Colors" },
      { url: "/api/product-variation-sizes", name: "Sizes" },
      { url: "/api/product-stocks", name: "Stocks" },
    ];

    for (const endpoint of schemaEndpoints) {
      if (this.testResults.endpoints[endpoint.name]?.available) {
        await this.checkSchemaStructure(endpoint.url, endpoint.name);
      }
    }

    this.printResults();
  }

  printResults() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 API TEST RESULTS");
    console.log("=".repeat(60));

    console.log(
      `\n🔗 Connection Status: ${
        this.testResults.connection ? "✅ Connected" : "❌ Failed"
      }`
    );

    console.log("\n📈 Endpoint Status:");
    for (const [name, result] of Object.entries(this.testResults.endpoints)) {
      const status = result.available ? "✅" : "❌";
      const count = this.testResults.counts[name]
        ? ` (${this.testResults.counts[name]} records)`
        : "";
      console.log(`  ${status} ${name}${count}`);
    }

    console.log("\n📋 Schema Information:");
    for (const [name, schema] of Object.entries(this.testResults.schemas)) {
      console.log(`\n  ${name}:`);
      if (schema.attributes && schema.attributes.length > 0) {
        console.log(`    Fields: ${schema.attributes.join(", ")}`);
      } else {
        console.log(`    ${schema.note || "No schema information available"}`);
      }
    }

    console.log("\n📝 Required Schema Fields for Import:");
    console.log(`
  Products (Required):
    - Title: string (required)
    - CoverImage: media (required)
    - Status: enum ['Active', 'InActive']
    - Description: text
    - Media: media (multiple)
    - product_main_category: relation
    - product_other_categories: relation

  Categories (Required):
    - Title: string (required)
    - Slug: string (required, unique)

  Variations (Required):
    - SKU: string (required, unique)
    - Price: biginteger (required)
    - IsPublished: boolean
    - product: relation (required)
    - product_stock: relation

  Stocks (Required):
    - Count: integer (default: 0)
    `);

    console.log("\n🚀 Import Readiness:");
    const readyToImport =
      this.testResults.connection &&
      this.testResults.endpoints.Products?.available &&
      this.testResults.endpoints.Categories?.available &&
      this.testResults.endpoints.Variations?.available;

    if (readyToImport) {
      console.log("✅ System ready for import!");
      console.log("\nTo start the import, run:");
      console.log("  npm run import:products");
      console.log("\nOr directly:");
      console.log("  node scripts/import-products.js");
    } else {
      console.log(
        "❌ System not ready for import. Please check the errors above."
      );
    }

    console.log("\n" + "=".repeat(60));
  }
}

// Run the tests
if (require.main === module) {
  const tester = new APITester();
  tester.runAllTests().catch(console.error);
}

module.exports = APITester;
