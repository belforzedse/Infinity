#!/usr/bin/env node
/**
 * Purge all product entries from the configured Strapi instance.
 * The script fetches every product id via paginated requests and deletes them one by one.
 * Use `--dry-run` to preview and `--yes` to skip the confirmation prompt.
 */

const axios = require("axios");
const readline = require("readline");
const path = require("path");

// Reuse the importer configuration for base URLs and the API token.
const config = require(path.join(__dirname, "woocommerce-importer", "config"));

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--yes");
const PAGE_SIZE = 100;

const strapiBaseUrl = (config?.strapi?.baseUrl || "").replace(/\/$/, "");
const productEndpoint = `${strapiBaseUrl}${config?.strapi?.endpoints?.products || "/products"}`;
const authToken = config?.strapi?.auth?.token;

if (!strapiBaseUrl || !authToken) {
  console.error("❌ Missing Strapi base URL or auth token in config.");
  process.exit(1);
}

const http = axios.create({
  timeout: 30000,
  headers: {
    Authorization: `Bearer ${authToken}`,
  },
});

function prompt(question) {
  if (FORCE) {
    return Promise.resolve("DELETE");
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function fetchProductPage(page) {
  const response = await http.get(productEndpoint, {
    params: {
      "pagination[page]": page,
      "pagination[pageSize]": PAGE_SIZE,
      "fields[0]": "id",
    },
  });

  const items = response.data?.data ?? [];
  const meta = response.data?.meta ?? {};
  return {
    ids: items.map((item) => item.id).filter(Boolean),
    pagination: meta.pagination || { page: 1, pageCount: 1, total: items.length },
  };
}

async function deleteProduct(id) {
  await http.delete(`${productEndpoint}/${id}`);
}

async function main() {
  console.log("⚠️  This script will permanently delete all products from:", productEndpoint);

  const firstPage = await fetchProductPage(1);
  const totalProducts = firstPage.pagination?.total ?? firstPage.ids.length;

  if (totalProducts === 0) {
    console.log("ℹ️  No products found. Nothing to delete.");
    return;
  }

  console.log(`📦 Found ${totalProducts} product(s) in Strapi.`);
  if (DRY_RUN) {
    console.log("✅ Dry run complete. No deletions were performed.");
    return;
  }

  const confirmation = await prompt('Type "DELETE" to confirm removal of all products: ');
  if (confirmation !== "DELETE") {
    console.log("❎ Confirmation failed. Aborting without deleting any products.");
    return;
  }

  let deleted = 0;
  let currentPage = 1;
  let pageCount = firstPage.pagination?.pageCount ?? 1;

  // Iterate through every page; always refetch to stay in sync after deletes.
  while (true) {
    const { ids, pagination } = await fetchProductPage(currentPage);

    if (ids.length === 0) {
      if (currentPage >= pageCount) {
        break;
      }
      currentPage += 1;
      pageCount = pagination.pageCount || pageCount;
      continue;
    }

    for (const id of ids) {
      try {
        await deleteProduct(id);
        deleted += 1;
        if (deleted % 20 === 0) {
          console.log(`🗑️  Deleted ${deleted}/${totalProducts} products...`);
        }
      } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data || error.message;
        console.error(`❌ Failed to delete product ${id} (status: ${status})`, message);
        // Abort early so the operator can inspect the failure.
        throw error;
      }
    }

    // After deleting the current batch, reset to page 1 to account for pagination shifts.
    currentPage = 1;
    const nextPage = await fetchProductPage(currentPage);
    if (nextPage.ids.length === 0) {
      break;
    }
  }

  console.log(`✅ Completed deletion of ${deleted} product(s).`);
}

main().catch((error) => {
  console.error("❌ Product purge script failed:", error?.message || error);
  process.exit(1);
});

