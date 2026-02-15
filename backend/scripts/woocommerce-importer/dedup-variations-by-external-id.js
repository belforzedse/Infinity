#!/usr/bin/env node

/**
 * Deduplicate product variations by external_id.
 * - Reassigns related records (product-stocks, cart-items, order-items, product-variation-logs)
 * - Deletes duplicate variations after rewiring
 * - Ensures external_id uniqueness after cleanup
 */

const config = require("./config");
const { StrapiClient } = require("./utils/ApiClient");

const strapiClient = new StrapiClient(config, console);

const RELATED_ENDPOINTS = [
  { name: "product-stocks", endpoint: "/product-stocks", field: "product_variation" },
  { name: "cart-items", endpoint: "/cart-items", field: "product_variation" },
  { name: "order-items", endpoint: "/order-items", field: "product_variation" },
  { name: "product-variation-logs", endpoint: "/product-variation-logs", field: "product_variation" },
];

const PRODUCT_RELATED_ENDPOINTS = [
  { name: "product-variations", endpoint: "/product-variations", field: "product" },
  { name: "product-reviews", endpoint: "/product-reviews", field: "product" },
  { name: "product-faqs", endpoint: "/product-faqs", field: "product" },
  { name: "product-views", endpoint: "/product-views", field: "product" },
  { name: "product-likes", endpoint: "/product-likes", field: "product" },
  { name: "product-logs", endpoint: "/product-logs", field: "product" },
  { name: "product-size-helpers", endpoint: "/product-size-helpers", field: "product" },
];

const argList = process.argv.slice(2);
const toBoolean = (value) => value === true || value === "true";
const dryRun = argList.includes("--dry-run");
const ignoreForbidden = argList.includes("--ignore-forbidden");
const disableDuplicates = argList.includes("--disable-duplicates");
const skipRelationsArg = argList.find((arg) => arg.startsWith("--skip-relations="));

function parseSkipRelations(args) {
  const direct = args.find((arg) => arg === "--skip-relations");
  let list = "";
  if (skipRelationsArg) {
    [, list] = skipRelationsArg.split("=", 2);
  } else if (direct) {
    const idx = args.indexOf(direct);
    list = args[idx + 1] || "";
  }

  return list
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const skipRelations = parseSkipRelations(argList);

function getAttr(entity, field) {
  if (entity?.attributes && entity.attributes[field] !== undefined) {
    return entity.attributes[field];
  }
  return entity?.[field];
}

function hasRelation(entity, field) {
  const attr = getAttr(entity, field);
  if (!attr) return false;
  if (typeof attr === "object" && Array.isArray(attr?.data)) {
    return attr.data.length > 0;
  }
  if (typeof attr === "object" && attr?.data) {
    return true;
  }
  return typeof attr === "number";
}

function scoreVariation(entity) {
  const hasProduct = hasRelation(entity, "product");
  const hasSku = Boolean(getAttr(entity, "SKU"));
  const hasPrice = Number(getAttr(entity, "Price") ?? 0) > 0;
  return {
    hasProduct,
    hasSku,
    hasPrice,
  };
}

function pickCanonical(entities) {
  return [...entities].sort((a, b) => {
    const scoreA = scoreVariation(a);
    const scoreB = scoreVariation(b);

    if (scoreA.hasProduct !== scoreB.hasProduct) {
      return scoreA.hasProduct ? -1 : 1;
    }
    if (scoreA.hasSku !== scoreB.hasSku) {
      return scoreA.hasSku ? -1 : 1;
    }
    if (scoreA.hasPrice !== scoreB.hasPrice) {
      return scoreA.hasPrice ? -1 : 1;
    }
    return a.id - b.id;
  })[0];
}

function pickCanonicalProduct(entities) {
  // Keep the most recent product (highest ID)
  return [...entities].sort((a, b) => b.id - a.id)[0];
}

async function fetchAll(endpoint, params = {}) {
  const pageSize = 100;
  let page = 1;
  let items = [];
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await strapiClient.get(endpoint, {
      "pagination[pageSize]": pageSize,
      "pagination[page]": page,
      ...params,
    });

    const data = Array.isArray(response?.data) ? response.data : [];
    items = items.concat(data);
    totalPages = response?.meta?.pagination?.pageCount || 1;
    page += 1;
  }

  return items;
}

async function fetchRelated(endpoint, field, variationId) {
  try {
    const items = await fetchAll(endpoint, {
      [`filters[${field}][id][$eq]`]: variationId,
    });
    return { items, blocked: false };
  } catch (error) {
    if (error?.response?.status === 403) {
      console.warn(`⚠️  Forbidden reading ${endpoint}; skipping relation checks.`);
      return { items: [], blocked: true };
    }
    throw error;
  }
}

async function updateRelated(endpoint, id, field, newId, options = {}) {
  try {
    if (options.useDirectWrite) {
      await strapiClient.client.put(`${endpoint}/${id}`, {
        data: { [field]: newId },
      });
    } else {
      await strapiClient.update(endpoint, id, {
        [field]: newId,
      });
    }
    return { blocked: false };
  } catch (error) {
    if (error?.response?.status === 403) {
      console.warn(`⚠️  Forbidden updating ${endpoint}/${id}; skipping update.`);
      return { blocked: true };
    }
    throw error;
  }
}

async function updateEntity(endpoint, id, data, options = {}) {
  try {
    if (options.useDirectWrite) {
      await strapiClient.client.put(`${endpoint}/${id}`, { data });
    } else {
      await strapiClient.update(endpoint, id, data);
    }
    return { blocked: false };
  } catch (error) {
    if (error?.response?.status === 403) {
      console.warn(`⚠️  Forbidden updating ${endpoint}/${id}; skipping update.`);
      return { blocked: true };
    }
    throw error;
  }
}

async function deleteVariation(variationId, options = {}) {
  if (options.useDirectWrite) {
    await strapiClient.client.delete(`/product-variations/${variationId}`);
    return;
  }
  await strapiClient.client.delete(`/product-variations/${variationId}`);
}

async function updateVariation(variationId, data, options = {}) {
  try {
    if (options.useDirectWrite) {
      await strapiClient.client.put(`/product-variations/${variationId}`, { data });
    } else {
      await strapiClient.update("/product-variations", variationId, data);
    }
    return { blocked: false };
  } catch (error) {
    if (error?.response?.status === 403) {
      console.warn(`⚠️  Forbidden updating /product-variations/${variationId}; skipping update.`);
      return { blocked: true };
    }
    throw error;
  }
}

async function deleteProduct(productId, options = {}) {
  if (options.useDirectWrite) {
    await strapiClient.client.delete(`/products/${productId}`);
    return;
  }
  await strapiClient.client.delete(`/products/${productId}`);
}

async function updateProduct(productId, data, options = {}) {
  try {
    if (options.useDirectWrite) {
      await strapiClient.client.put(`/products/${productId}`, { data });
    } else {
      await strapiClient.update("/products", productId, data);
    }
    return { blocked: false };
  } catch (error) {
    if (error?.response?.status === 403) {
      console.warn(`⚠️  Forbidden updating /products/${productId}; skipping update.`);
      return { blocked: true };
    }
    throw error;
  }
}

async function dedupProducts(options = {}) {
  const runDry = options?.dryRun !== undefined ? toBoolean(options.dryRun) : dryRun;
  const allowForbiddenDeletes =
    options?.ignoreForbidden !== undefined ? toBoolean(options.ignoreForbidden) : ignoreForbidden;
  const shouldDisable =
    options?.disableDuplicates !== undefined
      ? toBoolean(options.disableDuplicates)
      : disableDuplicates;
  const skipList = Array.isArray(options?.skipRelations) ? options.skipRelations : skipRelations;
  const skipSet = new Set(skipList);
  const blockedEndpoints = new Set();
  const useDirectWrite = allowForbiddenDeletes;

  console.log(`🧹 Starting product deduplication by external_id`);
  console.log(`🔎 Dry run: ${runDry ? "Yes" : "No"}`);
  if (shouldDisable) {
    console.log("🛑 Disable mode: duplicates will be set to InActive (no deletes)");
  }
  if (allowForbiddenDeletes) {
    console.log(
      `⚠️  Ignoring forbidden relation endpoints${shouldDisable ? "" : " (will still delete duplicates)"}`,
    );
  }
  if (skipSet.size > 0) {
    console.log(`🚫 Skipping relations: ${Array.from(skipSet).join(", ")}`);
  }

  const products = await fetchAll("/products", {
    sort: "id:asc",
  });

  if (products.length === 0) {
    console.log("📭 No products found.");
    return { rewired: 0, deleted: 0 };
  }

  const groups = new Map();
  for (const product of products) {
    const externalId = getAttr(product, "external_id");
    if (!externalId || externalId.toString().trim() === "") {
      continue;
    }
    if (!groups.has(externalId)) {
      groups.set(externalId, []);
    }
    groups.get(externalId).push(product);
  }

  const duplicates = [];
  for (const [externalId, items] of groups.entries()) {
    if (items.length > 1) {
      duplicates.push({ externalId, items });
    }
  }

  if (duplicates.length === 0) {
    console.log("✅ No duplicate product external_id values found.");
    return { rewired: 0, deleted: 0 };
  }

  console.log(`⚠️ Found ${duplicates.length} product external_id groups with duplicates`);

  let totalRewired = 0;
  let totalDeleted = 0;

  for (const group of duplicates) {
    const { externalId, items } = group;
    const canonical = pickCanonicalProduct(items);
    const toDelete = items.filter((item) => item.id !== canonical.id);

    console.log(`\n🔁 product external_id "${externalId}" → keep ID ${canonical.id} (most recent)`);

    for (const duplicate of toDelete) {
      if (shouldDisable) {
        const newExternalId = `${externalId}-dup-${duplicate.id}`;
        console.log(
          `   🛑 Disabling duplicate product ID ${duplicate.id} (external_id → ${newExternalId})`,
        );

        if (!runDry) {
          await updateProduct(
            duplicate.id,
            {
              Status: "InActive",
              external_id: newExternalId,
            },
            { useDirectWrite },
          );
        }

        continue;
      }

      console.log(`   ↪️ Rewiring duplicate product ID ${duplicate.id}`);

      let hasForbidden = false;

      for (const relation of PRODUCT_RELATED_ENDPOINTS) {
        if (
          skipSet.has(relation.name) ||
          skipSet.has(relation.endpoint) ||
          blockedEndpoints.has(relation.endpoint)
        ) {
          continue;
        }

        const { items: relatedItems, blocked } = await fetchRelated(
          relation.endpoint,
          relation.field,
          duplicate.id,
        );
        if (blocked) {
          hasForbidden = true;
          blockedEndpoints.add(relation.endpoint);
        }

        if (relatedItems.length === 0) {
          continue;
        }

        console.log(
          `      ${relation.name}: ${relatedItems.length} record(s) → ${canonical.id}`,
        );

        if (!runDry) {
          for (const related of relatedItems) {
            const { blocked: updateBlocked } = await updateRelated(
              relation.endpoint,
              related.id,
              relation.field,
              canonical.id,
              { useDirectWrite },
            );
            if (updateBlocked) {
              hasForbidden = true;
              blockedEndpoints.add(relation.endpoint);
              continue;
            }
            totalRewired += 1;
          }
        }
      }

      if (hasForbidden && !allowForbiddenDeletes) {
        console.warn(
          `⚠️  Skipping delete for product ${duplicate.id} due to forbidden relation access.`,
        );
        continue;
      }

      if (!runDry) {
        await deleteProduct(duplicate.id, { useDirectWrite });
        totalDeleted += 1;
      }
    }
  }

  console.log("\n✅ Product deduplication complete.");
  console.log(`   Rewired records: ${totalRewired}`);
  console.log(`   Deleted products: ${runDry ? 0 : totalDeleted}`);

  return { rewired: totalRewired, deleted: totalDeleted };
}

async function dedup(options = {}) {
  const runDry = options?.dryRun !== undefined ? toBoolean(options.dryRun) : dryRun;
  const allowForbiddenDeletes =
    options?.ignoreForbidden !== undefined ? toBoolean(options.ignoreForbidden) : ignoreForbidden;
  const shouldDisable =
    options?.disableDuplicates !== undefined
      ? toBoolean(options.disableDuplicates)
      : disableDuplicates;
  const skipList = Array.isArray(options?.skipRelations) ? options.skipRelations : skipRelations;
  const skipSet = new Set(skipList);
  const blockedEndpoints = new Set();
  const useDirectWrite = allowForbiddenDeletes;
  console.log(`🧹 Starting variation deduplication by external_id`);
  console.log(`🔎 Dry run: ${runDry ? "Yes" : "No"}`);
  if (shouldDisable) {
    console.log("🛑 Disable mode: duplicates will be unpublished and zeroed (no deletes)");
  }
  if (allowForbiddenDeletes) {
    console.log(
      `⚠️  Ignoring forbidden relation endpoints${shouldDisable ? "" : " (will still delete duplicates)"}`,
    );
  }
  if (skipSet.size > 0) {
    console.log(`🚫 Skipping relations: ${Array.from(skipSet).join(", ")}`);
  }

  const variations = await fetchAll("/product-variations", {
    sort: "id:asc",
  });

  if (variations.length === 0) {
    console.log("📭 No variations found.");
    return { rewired: 0, deleted: 0 };
  }

  const groups = new Map();
  for (const variation of variations) {
    const externalId = getAttr(variation, "external_id");
    if (!externalId || externalId.toString().trim() === "") {
      continue;
    }
    if (!groups.has(externalId)) {
      groups.set(externalId, []);
    }
    groups.get(externalId).push(variation);
  }

  const duplicates = [];
  for (const [externalId, items] of groups.entries()) {
    if (items.length > 1) {
      duplicates.push({ externalId, items });
    }
  }

  if (duplicates.length === 0) {
    console.log("✅ No duplicate external_id values found.");
    return { rewired: 0, deleted: 0 };
  }

  console.log(`⚠️ Found ${duplicates.length} external_id groups with duplicates`);

  let totalRewired = 0;
  let totalDeleted = 0;

  for (const group of duplicates) {
    const { externalId, items } = group;
    const canonical = pickCanonical(items);
    const toDelete = items.filter((item) => item.id !== canonical.id);

    console.log(`\n🔁 external_id "${externalId}" → keep ID ${canonical.id}`);

    for (const duplicate of toDelete) {
      if (shouldDisable) {
        const newExternalId = `${externalId}-dup-${duplicate.id}`;
        console.log(
          `   🛑 Disabling duplicate ID ${duplicate.id} (external_id → ${newExternalId})`,
        );

        if (!runDry) {
          await updateVariation(
            duplicate.id,
            {
              IsPublished: false,
              Price: 0,
              DiscountPrice: null,
              external_id: newExternalId,
            },
            { useDirectWrite },
          );

          if (!skipSet.has("product-stocks") && !skipSet.has("/product-stocks")) {
            const { items: stocks, blocked } = await fetchRelated(
              "/product-stocks",
              "product_variation",
              duplicate.id,
            );
            if (!blocked) {
              for (const stock of stocks) {
                await updateEntity(
                  "/product-stocks",
                  stock.id,
                  { Count: 0 },
                  { useDirectWrite },
                );
              }
            }
          }
        }

        continue;
      }

      console.log(`   ↪️ Rewiring duplicate ID ${duplicate.id}`);

      let hasForbidden = false;

      for (const relation of RELATED_ENDPOINTS) {
        if (
          skipSet.has(relation.name) ||
          skipSet.has(relation.endpoint) ||
          blockedEndpoints.has(relation.endpoint)
        ) {
          continue;
        }

        const { items: relatedItems, blocked } = await fetchRelated(
          relation.endpoint,
          relation.field,
          duplicate.id,
        );
        if (blocked) {
          hasForbidden = true;
          blockedEndpoints.add(relation.endpoint);
        }

        if (relatedItems.length === 0) {
          continue;
        }

        console.log(
          `      ${relation.name}: ${relatedItems.length} record(s) → ${canonical.id}`,
        );

        if (!runDry) {
          for (const related of relatedItems) {
            const { blocked: updateBlocked } = await updateRelated(
              relation.endpoint,
              related.id,
              relation.field,
              canonical.id,
              { useDirectWrite },
            );
            if (updateBlocked) {
              hasForbidden = true;
              blockedEndpoints.add(relation.endpoint);
              continue;
            }
            totalRewired += 1;
          }
        }
      }

      if (hasForbidden && !allowForbiddenDeletes) {
        console.warn(
          `⚠️  Skipping delete for variation ${duplicate.id} due to forbidden relation access.`,
        );
        continue;
      }

      if (!runDry) {
        await deleteVariation(duplicate.id, { useDirectWrite });
        totalDeleted += 1;
      }
    }
  }

  console.log("\n✅ Deduplication complete.");
  console.log(`   Rewired records: ${totalRewired}`);
  console.log(`   Deleted variations: ${runDry ? 0 : totalDeleted}`);

  return { rewired: totalRewired, deleted: totalDeleted };
}

async function fullDedup(options = {}) {
  console.log(`\n${"=".repeat(80)}`);
  console.log("🚀 Starting FULL deduplication (Products + Variations)");
  console.log(`${"=".repeat(80)}\n`);

  const runDry = options?.dryRun !== undefined ? toBoolean(options.dryRun) : dryRun;
  console.log(`🔎 Dry run: ${runDry ? "Yes" : "No"}\n`);

  // Step 1: Deduplicate products
  console.log("📦 STEP 1: Product Deduplication\n");
  const productStats = await dedupProducts(options);

  console.log(`\n${"─".repeat(80)}\n`);

  // Step 2: Deduplicate variations
  console.log("🔧 STEP 2: Variation Deduplication\n");
  const variationStats = await dedup(options);

  // Summary
  console.log(`\n${"=".repeat(80)}`);
  console.log("🎉 FULL DEDUPLICATION COMPLETE");
  console.log(`${"=".repeat(80)}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Products:`);
  console.log(`     - Rewired records: ${productStats.rewired}`);
  console.log(`     - Deleted products: ${productStats.deleted}`);
  console.log(`   Variations:`);
  console.log(`     - Rewired records: ${variationStats.rewired}`);
  console.log(`     - Deleted variations: ${variationStats.deleted}`);
  console.log(`\n   Total rewired: ${productStats.rewired + variationStats.rewired}`);
  console.log(`   Total deleted: ${productStats.deleted + variationStats.deleted}\n`);

  return {
    products: productStats,
    variations: variationStats,
  };
}

module.exports = { dedup, dedupProducts, fullDedup };

if (require.main === module) {
  const runFull = argList.includes("--full");
  const runProductsOnly = argList.includes("--products-only");

  let runner;
  if (runFull) {
    runner = fullDedup();
  } else if (runProductsOnly) {
    runner = dedupProducts();
  } else {
    runner = dedup();
  }

  runner.catch((error) => {
    console.error("❌ Deduplication failed:", error.message || error);
    process.exit(1);
  });
}
