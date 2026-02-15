#!/usr/bin/env node

/**
 * Publish all unpublished product variations.
 * Sets IsPublished = true for every variation where it is currently false.
 */

const config = require("./config");
const { StrapiClient } = require("./utils/ApiClient");
const Logger = require("./utils/Logger");

const logger = new Logger();
const strapiClient = new StrapiClient(config, console);

const argList = process.argv.slice(2);
const dryRun = argList.includes("--dry-run");

async function fetchAllUnpublished() {
  const pageSize = 100;
  let page = 1;
  let items = [];
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await strapiClient.client.get("/product-variations", {
      params: {
        "pagination[pageSize]": pageSize,
        "pagination[page]": page,
        "filters[IsPublished][$eq]": false,
        sort: "id:asc",
      },
    });

    const data = Array.isArray(response?.data?.data) ? response.data.data : [];
    items = items.concat(data);
    totalPages = response?.data?.meta?.pagination?.pageCount || 1;
    page += 1;
  }

  return items;
}

async function publishAllVariations() {
  console.log("📦 Publishing all unpublished product variations");
  console.log(`🔎 Dry run: ${dryRun ? "Yes" : "No"}\n`);

  const variations = await fetchAllUnpublished();

  if (variations.length === 0) {
    console.log("✅ No unpublished variations found.");
    return;
  }

  console.log(`⚠️ Found ${variations.length} unpublished variation(s)\n`);

  let published = 0;

  for (const v of variations) {
    const sku = v.attributes?.SKU ?? v.SKU ?? "N/A";
    console.log(`   ${dryRun ? "Would publish" : "Publishing"} variation ${v.id} (SKU: ${sku})`);

    if (!dryRun) {
      try {
        await strapiClient.client.put(`/product-variations/${v.id}`, {
          data: { IsPublished: true },
        });
        published += 1;
      } catch (error) {
        console.error(`   ❌ Failed variation ${v.id}: ${error.message}`);
      }
    } else {
      published += 1;
    }
  }

  console.log(`\n✅ Done. ${dryRun ? "Would publish" : "Published"}: ${published} variation(s)`);
}

publishAllVariations().catch((error) => {
  console.error("❌ Script failed:", error.message || error);
  process.exit(1);
});
