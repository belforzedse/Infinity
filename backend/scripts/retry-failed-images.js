const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

// Configuration
const STRAPI_URL = "https://infinity-bck.darkube.app";
const API_TOKEN =
  "5ded48b60050770a36fd985fdef2a20b971cd82f26e2e8bc02d38b4fb52258c1ace5049f2bc82b8d336dd20b88d6af9bc826c49a465e4698042fac690650f70a663d357e9bc52e8a6c9cc4a5de7075e07472c6a6d55f0c9a29690a3e6717000c61bb9ba085c233311c9d7e7e1f8f3ab3ff6985a5fd7f2f4ede73204761451fd6";
const JSON_FILE_PATH = "./strapi_import_enhanced.json";

// API client setup
const apiClient = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    Authorization: `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
  },
  timeout: 60000, // Increased timeout
  httpsAgent: new (require("https").Agent)({
    rejectUnauthorized: false,
  }),
});

class ImageRetryService {
  constructor() {
    this.stats = {
      productsChecked: 0,
      missingImages: 0,
      successfulRetries: 0,
      failedRetries: 0,
      productsUpdated: 0,
    };
    this.originalData = null;
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

  getImageExtension(contentType, url) {
    if (contentType?.includes("webp")) return "webp";
    if (contentType?.includes("jpeg") || contentType?.includes("jpg"))
      return "jpg";
    if (contentType?.includes("png")) return "png";

    const urlExtension = url.split(".").pop().toLowerCase();
    return ["webp", "jpg", "jpeg", "png"].includes(urlExtension)
      ? urlExtension
      : "jpg";
  }

  async downloadImageWithRetry(imageUrl, maxRetries = 3) {
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`  📥 Attempt ${attempt}/${maxRetries}: ${imageUrl}`);

        const response = await axios.get(imageUrl, {
          responseType: "stream",
          timeout: 30000, // 30 second timeout per attempt
          maxRedirects: 5,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        const contentType = response.headers["content-type"];
        const extension = this.getImageExtension(contentType, imageUrl);

        return {
          stream: response.data,
          contentType,
          extension,
          originalUrl: imageUrl,
        };
      } catch (error) {
        lastError = error;
        console.log(`    ⚠️ Attempt ${attempt} failed: ${error.message}`);

        if (attempt < maxRetries) {
          // Progressive delay: 2s, 5s, 10s
          const delay = attempt * 2000 + Math.random() * 1000;
          console.log(
            `    ⏳ Waiting ${Math.round(delay / 1000)}s before retry...`
          );
          await this.delay(delay);
        }
      }
    }

    console.log(`    ❌ All attempts failed for: ${imageUrl}`);
    this.stats.failedRetries++;
    return null;
  }

  async uploadImageToStrapi(imageData, fileName) {
    try {
      if (!imageData) return null;

      const form = new FormData();
      form.append("files", imageData.stream, {
        filename: fileName,
        contentType: imageData.contentType,
      });

      const uploadResponse = await axios.post(
        `${STRAPI_URL}/api/upload`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${API_TOKEN}`,
          },
          timeout: 60000,
        }
      );

      console.log(`    ✅ Image uploaded: ${fileName}`);
      this.stats.successfulRetries++;
      return uploadResponse.data[0];
    } catch (error) {
      console.error(`    ❌ Failed to upload ${fileName}:`, error.message);
      this.stats.failedRetries++;
      return null;
    }
  }

  async getProductsFromStrapi() {
    try {
      console.log("📖 Fetching products from Strapi...");

      let allProducts = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await apiClient.get("/api/products", {
          params: {
            populate: ["CoverImage", "Media"],
            pagination: { page, pageSize: 25 },
          },
        });

        const products = response.data.data;
        allProducts = allProducts.concat(products);

        const pagination = response.data.meta.pagination;
        hasMore = page < pagination.pageCount;
        page++;

        console.log(
          `  📦 Fetched ${products.length} products (page ${page - 1}/${
            pagination.pageCount
          })`
        );
      }

      console.log(`✅ Total products fetched: ${allProducts.length}\n`);
      return allProducts;
    } catch (error) {
      console.error("❌ Failed to fetch products:", error.message);
      return [];
    }
  }

  async findProductInOriginalData(productTitle) {
    if (!this.originalData) {
      console.log("📖 Loading original JSON data...");
      this.originalData = JSON.parse(fs.readFileSync(JSON_FILE_PATH, "utf8"));
    }

    return this.originalData.products.find((p) => p.title === productTitle);
  }

  async retryMissingImages() {
    try {
      console.log("🔄 Starting Missing Image Retry Process\n");
      console.log("=".repeat(70));

      const strapiProducts = await this.getProductsFromStrapi();

      for (const product of strapiProducts) {
        this.stats.productsChecked++;
        const hasIssues =
          !product.attributes.CoverImage?.data ||
          !product.attributes.Media?.data ||
          product.attributes.Media.data.length === 0;

        if (hasIssues) {
          console.log(`\n🔍 Checking product: ${product.attributes.Title}`);
          console.log(
            `  📸 Cover Image: ${
              product.attributes.CoverImage?.data ? "✅" : "❌"
            }`
          );
          console.log(
            `  🖼️ Gallery Images: ${
              product.attributes.Media?.data?.length || 0
            }`
          );

          const originalProduct = await this.findProductInOriginalData(
            product.attributes.Title
          );

          if (originalProduct) {
            await this.retryProductImages(product, originalProduct);
          } else {
            console.log(`  ⚠️ Original product data not found`);
          }
        }
      }

      this.printRetryStats();
    } catch (error) {
      console.error("❌ Retry process failed:", error.message);
    }
  }

  async retryProductImages(strapiProduct, originalProduct) {
    const updatedMedia = [...(strapiProduct.attributes.Media?.data || [])];
    let updatedCoverImage = strapiProduct.attributes.CoverImage?.data;
    let hasUpdates = false;

    // Retry cover image if missing
    if (!updatedCoverImage && originalProduct.featured_image?.url) {
      console.log(`  🔄 Retrying cover image...`);
      this.stats.missingImages++;

      const imageData = await this.downloadImageWithRetry(
        originalProduct.featured_image.url
      );
      if (imageData) {
        const fileName = `cover_${this.generateSlug(
          originalProduct.title
        )}_retry.${imageData.extension}`;
        const uploadedImage = await this.uploadImageToStrapi(
          imageData,
          fileName
        );
        if (uploadedImage) {
          updatedCoverImage = uploadedImage;
          hasUpdates = true;
        }
      }
    }

    // Retry gallery images
    if (originalProduct.gallery && originalProduct.gallery.length > 0) {
      const currentGalleryCount = updatedMedia.length;
      const expectedGalleryCount = originalProduct.gallery.length;

      if (currentGalleryCount < expectedGalleryCount) {
        console.log(
          `  🔄 Retrying gallery images (${currentGalleryCount}/${expectedGalleryCount})...`
        );

        for (let i = currentGalleryCount; i < expectedGalleryCount; i++) {
          const galleryImage = originalProduct.gallery[i];
          if (galleryImage?.url) {
            this.stats.missingImages++;

            const imageData = await this.downloadImageWithRetry(
              galleryImage.url
            );
            if (imageData) {
              const fileName = `gallery_${this.generateSlug(
                originalProduct.title
              )}_${i + 1}_retry.${imageData.extension}`;
              const uploadedImage = await this.uploadImageToStrapi(
                imageData,
                fileName
              );
              if (uploadedImage) {
                updatedMedia.push(uploadedImage);
                hasUpdates = true;
              }
            }

            // Rate limiting
            await this.delay(1000);
          }
        }
      }
    }

    // Update product if we have new images
    if (hasUpdates) {
      await this.updateProductImages(
        strapiProduct.id,
        updatedCoverImage,
        updatedMedia
      );
    }
  }

  async updateProductImages(productId, coverImage, mediaImages) {
    try {
      const updateData = {
        data: {},
      };

      if (coverImage) {
        updateData.data.CoverImage = coverImage.id;
      }

      if (mediaImages && mediaImages.length > 0) {
        updateData.data.Media = mediaImages.map((img) => img.id);
      }

      await apiClient.put(`/api/products/${productId}`, updateData);
      console.log(`  ✅ Product updated with new images`);
      this.stats.productsUpdated++;
    } catch (error) {
      console.error(`  ❌ Failed to update product:`, error.message);
    }
  }

  printRetryStats() {
    console.log("\n" + "=".repeat(70));
    console.log("📊 IMAGE RETRY STATISTICS");
    console.log("=".repeat(70));
    console.log(`📦 Products Checked: ${this.stats.productsChecked}`);
    console.log(`🖼️ Missing Images Found: ${this.stats.missingImages}`);
    console.log(`✅ Successful Retries: ${this.stats.successfulRetries}`);
    console.log(`❌ Failed Retries: ${this.stats.failedRetries}`);
    console.log(`🔄 Products Updated: ${this.stats.productsUpdated}`);

    const successRate =
      this.stats.missingImages > 0
        ? Math.round(
            (this.stats.successfulRetries / this.stats.missingImages) * 100
          )
        : 0;
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log("=".repeat(70));
  }
}

// Run the retry service
if (require.main === module) {
  const retryService = new ImageRetryService();
  retryService.retryMissingImages().catch(console.error);
}

module.exports = ImageRetryService;
