const axios = require("axios");
const crypto = require("crypto");

// Configuration
const STRAPI_URL = process.env.STRAPI_URL || "https://api.infinity.rgbgroup.ir";
const API_TOKEN = process.env.STRAPI_API_TOKEN;

if (!API_TOKEN) {
  console.error("❌ Error: STRAPI_API_TOKEN environment variable is required");
  console.error("   Set it before running this script:");
  console.error("   export STRAPI_API_TOKEN='your-token-here'");
  process.exit(1);
}

const apiClient = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    Authorization: `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
  },
  timeout: 60000,
  httpsAgent: new (require("https").Agent)({
    rejectUnauthorized: false,
  }),
});

async function createCompleteTestProduct() {
  try {
    console.log("🚀 Creating a complete test product with variations...\n");

    // Step 1: Create a category (or use existing)
    console.log("📂 Step 1: Creating/fetching category...");
    let categoryId = null;
    try {
      const categoryResponse = await apiClient.get("/api/product-categories", {
        params: {
          filters: { Title: { $eq: "Test Category" } },
          pagination: { limit: 1 },
        },
      });

      if (categoryResponse.data.data.length > 0) {
        categoryId = categoryResponse.data.data[0].id;
        console.log(`  ✅ Found existing category: ${categoryId}\n`);
      } else {
        const newCategory = await apiClient.post("/api/product-categories", {
          data: {
            Title: "Test Category",
            Slug: "test-category",
          },
        });
        categoryId = newCategory.data.data.id;
        console.log(`  ✅ Created new category: ${categoryId}\n`);
      }
    } catch (error) {
      console.error("  ❌ Failed to create/fetch category:", error.message);
      return;
    }

    // Step 2: Create product
    console.log("📦 Step 2: Creating product...");
    const productPayload = {
      data: {
        Title: "کیف1234567",
        Description: "This is a test product with complete variation data",
        Status: "Active",
        AverageRating: 0,
        RatingCount: 0,
        product_main_category: categoryId,
      },
    };

    let productId;
    try {
      const productResponse = await apiClient.post("/api/products", productPayload);
      productId = productResponse.data.data.id;
      console.log(`  ✅ Created product with ID: ${productId}\n`);
    } catch (error) {
      console.error("  ❌ Failed to create product:", error.response?.data?.error?.message || error.message);
      return;
    }

    // Step 3: Create variation attributes (color, size, model)
    console.log("🎨 Step 3: Creating/fetching variation attributes...");

    let colorId, sizeId, modelId;

    // Create or fetch color (سبز - Green)
    try {
      const colorListResponse = await apiClient.get("/api/product-variation-colors", {
        params: {
          pagination: { limit: 100 },
        },
      });

      const greenColor = colorListResponse.data.data.find(c => c.attributes.Title === "سبز");

      if (greenColor) {
        colorId = greenColor.id;
        console.log(`  ✅ Found existing color (سبز): ${colorId}`);
      } else {
        const colorResponse = await apiClient.post("/api/product-variation-colors", {
          data: {
            Title: "سبز",
            ColorCode: "#00AA00",
          },
        });
        colorId = colorResponse.data.data.id;
        console.log(`  ✅ Created color (سبز): ${colorId}`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to create/fetch color:`, error.response?.data?.error?.message || error.message);
      return;
    }

    // Create or fetch size (ایکس لارج - X-Large)
    try {
      const sizeListResponse = await apiClient.get("/api/product-variation-sizes", {
        params: {
          pagination: { limit: 100 },
        },
      });

      const xlSize = sizeListResponse.data.data.find(s => s.attributes.Title === "ایکس لارج");

      if (xlSize) {
        sizeId = xlSize.id;
        console.log(`  ✅ Found existing size (ایکس لارج): ${sizeId}`);
      } else {
        const sizeResponse = await apiClient.post("/api/product-variation-sizes", {
          data: {
            Title: "ایکس لارج",
          },
        });
        sizeId = sizeResponse.data.data.id;
        console.log(`  ✅ Created size (ایکس لارج): ${sizeId}`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to create/fetch size:`, error.response?.data?.error?.message || error.message);
      return;
    }

    // Create or fetch model (استاندارد - Standard)
    try {
      const modelListResponse = await apiClient.get("/api/product-variation-models", {
        params: {
          pagination: { limit: 100 },
        },
      });

      const standardModel = modelListResponse.data.data.find(m => m.attributes.Title === "استاندارد");

      if (standardModel) {
        modelId = standardModel.id;
        console.log(`  ✅ Found existing model (استاندارد): ${modelId}\n`);
      } else {
        const modelResponse = await apiClient.post("/api/product-variation-models", {
          data: {
            Title: "استاندارد",
          },
        });
        modelId = modelResponse.data.data.id;
        console.log(`  ✅ Created model (استاندارد): ${modelId}\n`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to create/fetch model:`, error.response?.data?.error?.message || error.message);
      return;
    }

    // Step 4: Create product stock
    console.log("📊 Step 4: Creating product stock...");
    let stockId;
    try {
      const stockResponse = await apiClient.post("/api/product-stocks", {
        data: {
          Count: 100,
        },
      });
      stockId = stockResponse.data.data.id;
      console.log(`  ✅ Created stock: ${stockId}\n`);
    } catch (error) {
      console.error(`  ❌ Failed to create stock:`, error.response?.data?.error?.message || error.message);
      return;
    }

    // Step 5: Create variation with all required fields
    console.log("🧵 Step 5: Creating product variation...");
    const sku = `TEST-${Date.now().toString().slice(-6)}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const price = 500000; // Price in Tomans

    try {
      const variationResponse = await apiClient.post("/api/product-variations", {
        data: {
          SKU: sku,
          Price: price.toString(),
          IsPublished: true,
          product: productId,
          product_variation_color: colorId,
          product_variation_size: sizeId,
          product_variation_model: modelId,
          product_stock: stockId,
        },
      });
      const variationId = variationResponse.data.data.id;
      console.log(`  ✅ Created variation with ID: ${variationId}`);
      console.log(`     SKU: ${sku}`);
      console.log(`     Price: ${price} Tomans\n`);
    } catch (error) {
      console.error(
        `  ❌ Failed to create variation:`,
        error.response?.data?.error?.message || error.message
      );
      if (error.response?.data?.error?.details) {
        console.error("     Details:", JSON.stringify(error.response.data.error.details, null, 2));
      }
      return;
    }

    // Step 6: Verify the product is complete
    console.log("✅ Step 6: Verifying product is complete...");
    try {
      const fullProductResponse = await apiClient.get(`/api/products/${productId}`, {
        params: {
          populate: {
            product_variations: {
              populate: {
                product: { fields: ["id", "Title", "SKU"] },
                product_stock: true,
                product_variation_color: true,
                product_variation_size: true,
                product_variation_model: true,
              },
            },
            product_main_category: true,
          },
        },
      });

      const product = fullProductResponse.data.data;
      console.log(`\n📋 Product Summary:`);
      console.log(`   Product ID: ${product.id}`);
      console.log(`   Title: ${product.attributes.Title}`);
      console.log(`   Variations: ${product.attributes.product_variations?.data?.length || 0}`);

      if (product.attributes.product_variations?.data?.length > 0) {
        const variation = product.attributes.product_variations.data[0];
        console.log(`\n   Variation Details:`);
        console.log(`   - Variation ID: ${variation.id}`);
        console.log(`   - SKU: ${variation.attributes.SKU}`);
        console.log(`   - Price: ${variation.attributes.Price}`);
        console.log(`   - Product ID: ${variation.attributes.product?.data?.id}`);
        console.log(`   - Product Title: ${variation.attributes.product?.data?.attributes?.Title}`);
        console.log(`   - Has Stock: ${!!variation.attributes.product_stock?.data}`);
        console.log(`   - Has Color: ${!!variation.attributes.product_variation_color?.data}`);
        console.log(`   - Has Size: ${!!variation.attributes.product_variation_size?.data}`);
        console.log(`   - Has Model: ${!!variation.attributes.product_variation_model?.data}`);
      }

      console.log(`\n🎉 Product created successfully!`);
      console.log(`\n⏭️  Next steps:`);
      console.log(`1. Add this product to your cart (Product ID: ${productId})`);
      console.log(`2. Try to checkout`);
      console.log(`3. The checkout should now work without the "incomplete data" error\n`);
    } catch (error) {
      console.error(`  ❌ Failed to verify product:`, error.message);
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
  }
}

createCompleteTestProduct();
