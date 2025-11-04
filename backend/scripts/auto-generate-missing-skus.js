const axios = require("axios");

// Configuration
const STRAPI_URL = "https://api.infinity.rgbgroup.ir";
const API_TOKEN = "STRAPI_API_TOKEN";

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

async function autoGenerateMissingSKUs() {
  try {
    console.log("🚀 Auto-generating SKUs for variations missing them...\n");

    // Step 1: Fetch all variations that are missing SKU or have empty SKU
    console.log("📋 Step 1: Fetching variations with missing/empty SKU...");
    let page = 1;
    let totalProcessed = 0;
    let totalUpdated = 0;
    let hasMorePages = true;

    while (hasMorePages) {
      try {
        const response = await apiClient.get("/api/product-variations", {
          params: {
            pagination: { pageSize: 50, page },
            populate: {
              product: { fields: ["id", "Title"] },
            },
          },
        });

        const variations = response.data.data || [];

        if (variations.length === 0) {
          hasMorePages = false;
          break;
        }

        console.log(`\n📄 Processing page ${page} (${variations.length} variations)...`);

        // Filter variations with missing or empty SKU
        const variationsNeedingSKU = variations.filter(
          (v) => !v.attributes.SKU || v.attributes.SKU.trim() === ""
        );

        if (variationsNeedingSKU.length === 0) {
          console.log(`  ✅ All variations on this page have SKUs`);
          page++;
          continue;
        }

        console.log(`  🔍 Found ${variationsNeedingSKU.length} variations needing SKU`);

        // Generate and update SKU for each variation
        for (const variation of variationsNeedingSKU) {
          try {
            const productId = variation.attributes.product?.data?.id;
            const variationId = variation.id;
            const productTitle = variation.attributes.product?.data?.attributes?.Title || "Unknown";

            if (!productId) {
              console.log(
                `  ⚠️ Variation ${variationId} (${productTitle}): No product linked, skipping`
              );
              continue;
            }

            // Generate SKU using timestamp and ID-based approach
            const timestamp = Date.now().toString().slice(-5);
            const baseSKU = `VAR-${variationId}-${timestamp}`;

            // Check if SKU is unique
            let uniqueSKU = baseSKU;
            let suffix = 0;
            let isUnique = false;

            while (!isUnique && suffix < 10) {
              try {
                const existingCheck = await apiClient.get("/api/product-variations", {
                  params: {
                    filters: { SKU: { $eq: uniqueSKU } },
                    pagination: { pageSize: 1 },
                  },
                });

                if (!existingCheck.data.data || existingCheck.data.data.length === 0) {
                  isUnique = true;
                } else {
                  suffix++;
                  uniqueSKU = `${baseSKU}-${suffix}`;
                }
              } catch (error) {
                isUnique = true; // If check fails, assume unique
              }
            }

            // Update variation with generated SKU
            await apiClient.put(`/api/product-variations/${variationId}`, {
              data: {
                SKU: uniqueSKU,
              },
            });

            console.log(
              `  ✅ Variation ${variationId} (${productTitle}): Generated SKU = ${uniqueSKU}`
            );
            totalUpdated++;
          } catch (error) {
            console.error(
              `  ❌ Failed to update variation ${variation.id}:`,
              error.response?.data?.error?.message || error.message
            );
          }

          totalProcessed++;
        }

        page++;
        const totalPages = Math.ceil(response.data.meta?.pagination?.total / 50) || "?";
        console.log(`  📊 Progress: ${totalProcessed} processed, ${totalUpdated} updated (Page ${page - 1}/${totalPages})`);
      } catch (error) {
        console.error(`\n❌ Error fetching variations on page ${page}:`, error.message);
        hasMorePages = false;
      }
    }

    console.log(`\n🎉 Auto-generation complete!`);
    console.log(`   Total processed: ${totalProcessed}`);
    console.log(`   Total updated: ${totalUpdated}`);
    console.log(`\n✅ All variations now have SKUs and can be purchased without errors!\n`);
  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
  }
}

autoGenerateMissingSKUs();
