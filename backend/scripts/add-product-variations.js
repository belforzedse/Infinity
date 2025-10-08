const axios = require("axios");
const fs = require("fs");

const STRAPI_URL = "https://infinity-bck.darkube.app";
const API_TOKEN =
  "5ded48b60050770a36fd985fdef2a20b971cd82f26e2e8bc02d38b4fb52258c1ace5049f2bc82b8d336dd20b88d6af9bc826c49a465e4698042fac690650f70a663d357e9bc52e8a6c9cc4a5de7075e07472c6a6d55f0c9a29690a3e6717000c61bb9ba085c233311c9d7e7e1f8f3ab3ff6985a5fd7f2f4ede73204761451fd6";
const ENHANCED_JSON_FILE = "./scarf_products_enhanced.json";

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

class ProductVariationService {
  constructor() {
    this.stats = {
      colorsCreated: 0,
      sizesCreated: 0,
      modelsCreated: 0,
      variationsCreated: 0,
      variationsSkipped: 0,
      stocksCreated: 0,
      productsProcessed: 0,
      errors: 0,
    };

    this.colorCache = new Map();
    this.sizeCache = new Map();
    this.modelCache = new Map();
    this.productCache = new Map();
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\u0600-\u06FF\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  }

  generateColorCode(colorTitle) {
    const colorMap = {
      متنوع: "#FF6B6B",
      سفید: "#FFFFFF",
      مشکی: "#000000",
      قرمز: "#FF0000",
      آبی: "#0000FF",
      سبز: "#00FF00",
      زرد: "#FFFF00",
      نارنجی: "#FFA500",
      بنفش: "#800080",
      صورتی: "#FFC0CB",
      قهوه‌ای: "#8B4513",
      خاکستری: "#808080",
      طلایی: "#FFD700",
      نقره‌ای: "#C0C0C0",
    };

    return (
      colorMap[colorTitle] ||
      `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")}`
    );
  }

  async createOrGetColor(colorTitle) {
    if (this.colorCache.has(colorTitle)) {
      return this.colorCache.get(colorTitle);
    }

    try {
      const existingResponse = await apiClient.get(
        "/api/product-variation-colors",
        {
          params: {
            filters: { Title: { $eq: colorTitle } },
          },
        }
      );

      if (existingResponse.data.data.length > 0) {
        const color = existingResponse.data.data[0];
        this.colorCache.set(colorTitle, color);
        return color;
      }

      const colorData = {
        data: {
          Title: colorTitle,
          ColorCode: this.generateColorCode(colorTitle),
        },
      };

      const response = await apiClient.post(
        "/api/product-variation-colors",
        colorData
      );
      const color = response.data.data;
      this.colorCache.set(colorTitle, color);
      this.stats.colorsCreated++;

      console.log(
        `  ✅ Created color: ${colorTitle} (${color.attributes.ColorCode})`
      );
      return color;
    } catch (error) {
      console.error(
        `  ❌ Failed to create color ${colorTitle}:`,
        error.response?.data?.error?.message || error.message
      );
      this.stats.errors++;
      return null;
    }
  }

  async createOrGetSize(sizeTitle) {
    if (this.sizeCache.has(sizeTitle)) {
      return this.sizeCache.get(sizeTitle);
    }

    try {
      const existingResponse = await apiClient.get(
        "/api/product-variation-sizes",
        {
          params: {
            filters: { Title: { $eq: sizeTitle } },
          },
        }
      );

      if (existingResponse.data.data.length > 0) {
        const size = existingResponse.data.data[0];
        this.sizeCache.set(sizeTitle, size);
        return size;
      }

      const sizeData = {
        data: {
          Title: sizeTitle,
        },
      };

      const response = await apiClient.post(
        "/api/product-variation-sizes",
        sizeData
      );
      const size = response.data.data;
      this.sizeCache.set(sizeTitle, size);
      this.stats.sizesCreated++;

      console.log(`  ✅ Created size: ${sizeTitle}`);
      return size;
    } catch (error) {
      console.error(
        `  ❌ Failed to create size ${sizeTitle}:`,
        error.response?.data?.error?.message || error.message
      );
      this.stats.errors++;
      return null;
    }
  }

  async createOrGetModel(modelTitle) {
    if (this.modelCache.has(modelTitle)) {
      return this.modelCache.get(modelTitle);
    }

    try {
      const existingResponse = await apiClient.get(
        "/api/product-variation-models",
        {
          params: {
            filters: { Title: { $eq: modelTitle } },
          },
        }
      );

      if (existingResponse.data.data.length > 0) {
        const model = existingResponse.data.data[0];
        this.modelCache.set(modelTitle, model);
        return model;
      }

      const modelData = {
        data: {
          Title: modelTitle,
        },
      };

      const response = await apiClient.post(
        "/api/product-variation-models",
        modelData
      );
      const model = response.data.data;
      this.modelCache.set(modelTitle, model);
      this.stats.modelsCreated++;

      console.log(`  ✅ Created model: ${modelTitle}`);
      return model;
    } catch (error) {
      console.error(
        `  ❌ Failed to create model ${modelTitle}:`,
        error.response?.data?.error?.message || error.message
      );
      this.stats.errors++;
      return null;
    }
  }

  async getProductByTitle(productTitle) {
    if (this.productCache.has(productTitle)) {
      return this.productCache.get(productTitle);
    }

    try {
      const response = await apiClient.get("/api/products", {
        params: {
          filters: { Title: { $eq: productTitle } },
          populate: ["product_variations"],
        },
      });

      if (response.data.data.length > 0) {
        const product = response.data.data[0];
        this.productCache.set(productTitle, product);
        return product;
      }

      return null;
    } catch (error) {
      console.error(
        `  ❌ Failed to get product ${productTitle}:`,
        error.message
      );
      return null;
    }
  }

  async createProductStock(count = 10) {
    try {
      const stockData = {
        data: {
          Count: count,
        },
      };

      const response = await apiClient.post("/api/product-stocks", stockData);
      this.stats.stocksCreated++;
      return response.data.data;
    } catch (error) {
      console.error(
        `  ❌ Failed to create stock:`,
        error.response?.data?.error?.message || error.message
      );
      this.stats.errors++;
      return null;
    }
  }

  generateSKU(productTitle, color, size, model) {
    // Create a unique SKU using timestamp and hash
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const combination = `${productTitle}|${color}|${size}|${model}`;
    const hash = require("crypto")
      .createHash("md5")
      .update(combination)
      .digest("hex")
      .substring(0, 6);

    // Clean product title for readability
    const productCode = productTitle
      .replace(/[^\w\u0600-\u06FF]/g, "")
      .substring(0, 8)
      .toUpperCase();

    // Simple and guaranteed unique SKU
    return `${productCode}-${timestamp}-${hash}`;
  }

  async createProductVariation(
    product,
    color,
    size,
    model,
    basePrice = 500000
  ) {
    try {
      const colorEntity = await this.createOrGetColor(color);
      const sizeEntity = await this.createOrGetSize(size);
      const modelEntity = await this.createOrGetModel(model);

      if (!colorEntity || !sizeEntity || !modelEntity) {
        console.log(`  ⚠️ Skipping variation due to missing entities`);
        return null;
      }

      const stock = await this.createProductStock();
      if (!stock) {
        console.log(`  ⚠️ Skipping variation due to stock creation failure`);
        return null;
      }

      const sku = this.generateSKU(
        product.attributes.Title,
        color,
        size,
        model
      );

      const variationData = {
        data: {
          SKU: sku,
          Price: basePrice.toString(),
          IsPublished: true,
          product: product.id,
          product_variation_color: colorEntity.id,
          product_variation_size: sizeEntity.id,
          product_variation_model: modelEntity.id,
          product_stock: stock.id,
        },
      };

      const response = await apiClient.post(
        "/api/product-variations",
        variationData
      );
      this.stats.variationsCreated++;

      console.log(
        `    ✅ Created variation: ${color} × ${size} × ${model} (${sku})`
      );
      return response.data.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error?.message || error.message;

      // Handle specific uniqueness constraint errors
      if (
        errorMessage.includes("unique") ||
        errorMessage.includes("duplicate") ||
        errorMessage.includes("SKU")
      ) {
        console.log(`    ⚠️ Duplicate SKU ${sku}, variation may already exist`);
        // Try to find the existing variation
        try {
          const existingResponse = await apiClient.get(
            "/api/product-variations",
            {
              params: {
                filters: { SKU: { $eq: sku } },
              },
            }
          );
          if (existingResponse.data.data.length > 0) {
            return existingResponse.data.data[0];
          }
        } catch (findError) {
          // Ignore find errors
        }
      } else {
        console.error(
          `    ❌ Failed to create variation: ${color} × ${size} × ${model}`,
          errorMessage
        );
        this.stats.errors++;
      }
      return null;
    }
  }

  async processProductVariations() {
    try {
      console.log("🚀 Starting Product Variations Creation Process");
      console.log("=".repeat(70));

      const jsonData = JSON.parse(fs.readFileSync(ENHANCED_JSON_FILE, "utf8"));
      const products = jsonData.products;

      console.log(`📦 Found ${products.length} products to process\n`);

      for (let i = 0; i < products.length; i++) {
        const productData = products[i];
        this.stats.productsProcessed++;

        console.log(
          `\n[${i + 1}/${products.length}] Processing: ${productData.title}`
        );

        const strapiProduct = await this.getProductByTitle(productData.title);
        if (!strapiProduct) {
          console.log(`  ⚠️ Product not found in Strapi, skipping...`);
          continue;
        }

        // Get existing variations with their color/size/model details
        let existingVariationsResponse;
        try {
          existingVariationsResponse = await apiClient.get(
            "/api/product-variations",
            {
              params: {
                filters: { product: { id: { $eq: strapiProduct.id } } },
                populate: [
                  "product_variation_color",
                  "product_variation_size",
                  "product_variation_model",
                ],
              },
            }
          );
        } catch (error) {
          console.error(
            `  ❌ Failed to get existing variations:`,
            error.message
          );
          continue;
        }

        const existingVariations = existingVariationsResponse.data.data;
        console.log(
          `  📋 Product has ${existingVariations.length} existing variations`
        );

        // Create a set of existing combinations for quick lookup
        const existingCombinations = new Set();
        existingVariations.forEach((variation) => {
          const color =
            variation.attributes.product_variation_color?.data?.attributes
              ?.Title || "unknown";
          const size =
            variation.attributes.product_variation_size?.data?.attributes
              ?.Title || "unknown";
          const model =
            variation.attributes.product_variation_model?.data?.attributes
              ?.Title || "unknown";
          const combo = `${color}|${size}|${model}`;
          existingCombinations.add(combo);
        });

        const colors = productData.colors || ["متنوع"];
        const sizes = productData.sizes || ["فری سایز"];
        const designs = productData.designs || ["ساده"];

        console.log(
          `  🎨 Colors: ${colors.length} | 📏 Sizes: ${sizes.length} | 🎪 Designs: ${designs.length}`
        );

        let variationCount = 0;
        let skippedCount = 0;

        for (const color of colors) {
          for (const size of sizes) {
            for (const design of designs) {
              const combo = `${color}|${size}|${design}`;

              if (existingCombinations.has(combo)) {
                console.log(
                  `    ⏭️ Skipping existing: ${color} × ${size} × ${design}`
                );
                skippedCount++;
                this.stats.variationsSkipped++;
                continue;
              }

              const result = await this.createProductVariation(
                strapiProduct,
                color,
                size,
                design
              );

              if (result) {
                variationCount++;
              }

              await this.delay(500);
            }
          }
        }

        console.log(
          `  ✅ Created ${variationCount} new variations, skipped ${skippedCount} existing`
        );

        if (i % 5 === 0 && i > 0) {
          console.log(`  ⏳ Rate limiting pause...`);
          await this.delay(2000);
        }
      }

      this.printStats();
    } catch (error) {
      console.error("❌ Process failed:", error.message);
    }
  }

  printStats() {
    console.log("\n" + "=".repeat(70));
    console.log("📊 PRODUCT VARIATIONS CREATION STATISTICS");
    console.log("=".repeat(70));
    console.log(`📦 Products Processed: ${this.stats.productsProcessed}`);
    console.log(`🎨 Colors Created: ${this.stats.colorsCreated}`);
    console.log(`📏 Sizes Created: ${this.stats.sizesCreated}`);
    console.log(`🎪 Models Created: ${this.stats.modelsCreated}`);
    console.log(`⚡ Variations Created: ${this.stats.variationsCreated}`);
    console.log(`⏭️ Variations Skipped: ${this.stats.variationsSkipped}`);
    console.log(`📦 Stocks Created: ${this.stats.stocksCreated}`);
    console.log(`❌ Errors: ${this.stats.errors}`);

    const successRate =
      this.stats.productsProcessed > 0
        ? Math.round(
            ((this.stats.productsProcessed - this.stats.errors) /
              this.stats.productsProcessed) *
              100
          )
        : 0;
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log("=".repeat(70));
  }
}

if (require.main === module) {
  const variationService = new ProductVariationService();
  variationService.processProductVariations().catch(console.error);
}

module.exports = ProductVariationService;
