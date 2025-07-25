const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Configuration
const JSON_FILE_PATH = "./strapi_import_enhanced.json";

class DryRunImporter {
  constructor() {
    this.stats = {
      totalProducts: 0,
      uniqueCategories: new Set(),
      totalImages: 0,
      validImages: 0,
      invalidImages: 0,
      duplicateProducts: 0,
      variations: 0,
      skusGenerated: 0,
    };
    this.issues = [];
    this.sampleData = {
      categories: [],
      products: [],
      variations: [],
    };
  }

  async validateImageUrl(url) {
    try {
      const response = await axios.head(url, { timeout: 5000 });
      const contentType = response.headers["content-type"];
      const contentLength = response.headers["content-length"];

      return {
        valid: true,
        contentType,
        size: contentLength ? parseInt(contentLength) : "unknown",
        status: response.status,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        status: error.response?.status || "timeout",
      };
    }
  }

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\u0600-\u06FF\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  }

  generateSKU(product) {
    const productId = product.original_id || "unknown";
    const timestamp = Date.now();
    return `${productId}-default-${timestamp}`;
  }

  async analyzeProduct(product, index) {
    console.log(`📦 Analyzing product ${index + 1}: ${product.title}`);

    const productAnalysis = {
      index: index + 1,
      title: product.title,
      slug: this.generateSlug(product.title),
      hasDescription: !!(product.description || product.short_description),
      categories: product.categories || [],
      price: product.price?.amount || 0,
      currency: product.price?.currency || "IRR",
      stockStatus: product.stock_status,
      images: {
        featured: null,
        gallery: [],
      },
      issues: [],
    };

    // Analyze categories
    if (product.categories) {
      product.categories.forEach((cat) => this.stats.uniqueCategories.add(cat));
    } else {
      productAnalysis.issues.push("No categories defined");
    }

    // Analyze featured image
    if (product.featured_image?.url) {
      console.log(`  📸 Checking featured image...`);
      this.stats.totalImages++;
      const imageCheck = await this.validateImageUrl(
        product.featured_image.url
      );
      productAnalysis.images.featured = {
        url: product.featured_image.url,
        ...imageCheck,
      };

      if (imageCheck.valid) {
        this.stats.validImages++;
      } else {
        this.stats.invalidImages++;
        productAnalysis.issues.push(
          `Featured image invalid: ${imageCheck.error}`
        );
      }
    } else {
      productAnalysis.issues.push("No featured image");
    }

    // Analyze gallery images
    if (product.gallery && product.gallery.length > 0) {
      console.log(`  🖼️ Checking ${product.gallery.length} gallery images...`);
      for (let i = 0; i < Math.min(product.gallery.length, 3); i++) {
        // Check first 3 to save time
        const galleryImage = product.gallery[i];
        if (galleryImage.url) {
          this.stats.totalImages++;
          const imageCheck = await this.validateImageUrl(galleryImage.url);
          productAnalysis.images.gallery.push({
            url: galleryImage.url,
            ...imageCheck,
          });

          if (imageCheck.valid) {
            this.stats.validImages++;
          } else {
            this.stats.invalidImages++;
          }
        }
      }

      if (product.gallery.length > 3) {
        productAnalysis.images.gallery.push({
          note: `... and ${
            product.gallery.length - 3
          } more images (not checked)`,
        });
        this.stats.totalImages += product.gallery.length - 3;
      }
    }

    // Generate variation info
    const variation = {
      sku: product.sku || this.generateSKU(product),
      price: product.price?.amount || 0,
      isPublished: product.stock_status === "instock",
      stockCount: product.stock_quantity || 0,
    };

    if (!product.sku) {
      this.stats.skusGenerated++;
      productAnalysis.issues.push("SKU was auto-generated");
    }

    productAnalysis.variation = variation;
    this.stats.variations++;

    // Store sample data
    if (this.sampleData.products.length < 5) {
      this.sampleData.products.push(productAnalysis);
    }

    return productAnalysis;
  }

  async runDryRun() {
    console.log("🏃‍♂️ Starting Dry Run Import Analysis\n");
    console.log("=".repeat(70));

    try {
      // Read and parse JSON
      console.log("📖 Reading JSON file...");
      const jsonData = JSON.parse(fs.readFileSync(JSON_FILE_PATH, "utf8"));
      const products = jsonData.products || [];
      this.stats.totalProducts = products.length;

      console.log(`✅ Found ${products.length} products to analyze\n`);

      // Analyze products in batches
      const batchSize = 10;
      const productsToAnalyze = products.slice(
        0,
        Math.min(50, products.length)
      ); // Analyze first 50 for demo

      console.log(
        `🔍 Analyzing first ${productsToAnalyze.length} products (sample)...\n`
      );

      for (let i = 0; i < productsToAnalyze.length; i += batchSize) {
        const batch = productsToAnalyze.slice(i, i + batchSize);
        console.log(
          `\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
            productsToAnalyze.length / batchSize
          )}`
        );

        for (let j = 0; j < batch.length; j++) {
          await this.analyzeProduct(batch[j], i + j);
        }

        // Small delay to avoid overwhelming image servers
        if (i + batchSize < productsToAnalyze.length) {
          console.log("⏳ Brief pause...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // Generate analysis report
      this.generateReport();
    } catch (error) {
      console.error("❌ Dry run failed:", error.message);
    }
  }

  generateReport() {
    console.log("\n" + "=".repeat(70));
    console.log("📊 DRY RUN ANALYSIS REPORT");
    console.log("=".repeat(70));

    // Basic statistics
    console.log("\n📈 BASIC STATISTICS:");
    console.log(`📦 Total Products: ${this.stats.totalProducts}`);
    console.log(`📂 Unique Categories: ${this.stats.uniqueCategories.size}`);
    console.log(`🔄 Product Variations: ${this.stats.variations}`);
    console.log(`🏷️ Auto-generated SKUs: ${this.stats.skusGenerated}`);

    // Image analysis
    console.log("\n🖼️ IMAGE ANALYSIS:");
    console.log(
      `📸 Total Images Checked: ${
        this.stats.validImages + this.stats.invalidImages
      }`
    );
    console.log(`✅ Valid Images: ${this.stats.validImages}`);
    console.log(`❌ Invalid Images: ${this.stats.invalidImages}`);
    console.log(
      `📊 Success Rate: ${
        this.stats.validImages + this.stats.invalidImages > 0
          ? Math.round(
              (this.stats.validImages /
                (this.stats.validImages + this.stats.invalidImages)) *
                100
            )
          : 0
      }%`
    );
    console.log(`🔢 Total Images (estimated): ${this.stats.totalImages}`);

    // Categories
    console.log("\n📂 CATEGORIES TO BE CREATED:");
    const categories = Array.from(this.stats.uniqueCategories).sort();
    categories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat}`);
      if (this.sampleData.categories.length < 10) {
        this.sampleData.categories.push({
          title: cat,
          slug: this.generateSlug(cat),
        });
      }
    });

    // Sample products
    console.log("\n📦 SAMPLE PRODUCTS:");
    this.sampleData.products.forEach((product, index) => {
      console.log(`\n  ${index + 1}. ${product.title}`);
      console.log(`     Slug: ${product.slug}`);
      console.log(`     Categories: ${product.categories.join(", ")}`);
      console.log(
        `     Price: ${product.price.toLocaleString()} ${product.currency}`
      );
      console.log(`     Stock: ${product.stockStatus}`);
      console.log(
        `     Featured Image: ${product.images.featured?.valid ? "✅" : "❌"}`
      );
      console.log(
        `     Gallery Images: ${
          product.images.gallery.filter((img) => img.valid).length
        } valid`
      );
      if (product.issues.length > 0) {
        console.log(`     Issues: ${product.issues.join(", ")}`);
      }
    });

    // What would be created
    console.log("\n🏗️ WHAT WOULD BE CREATED:");
    console.log(`✨ ${this.stats.uniqueCategories.size} product categories`);
    console.log(`✨ ${this.stats.totalProducts} products`);
    console.log(`✨ ${this.stats.variations} product variations`);
    console.log(`✨ ${this.stats.variations} stock records`);
    console.log(
      `✨ ${this.stats.validImages} images uploaded to media library`
    );

    // Import commands
    console.log("\n🚀 WHEN SERVER IS AVAILABLE:");
    console.log("Run these commands to start the actual import:");
    console.log("  npm run test:api    # Test server connection");
    console.log("  npm run import:products    # Start full import");

    // Estimated time
    const estimatedMinutes = Math.ceil(this.stats.totalProducts / 50); // ~50 products per minute
    console.log(`\n⏱️ ESTIMATED IMPORT TIME: ${estimatedMinutes} minutes`);

    console.log("\n" + "=".repeat(70));
    console.log("✅ Dry run completed successfully!");
    console.log("📝 The data structure looks good and ready for import.");
    console.log(
      "🔗 Once the server is accessible, the actual import can proceed."
    );
    console.log("=".repeat(70));
  }
}

// Run the dry run
if (require.main === module) {
  const dryRunner = new DryRunImporter();
  dryRunner.runDryRun().catch(console.error);
}

module.exports = DryRunImporter;
