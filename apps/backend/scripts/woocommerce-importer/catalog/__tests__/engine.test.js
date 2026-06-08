"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { CatalogEngine, sortCategoriesByHierarchy } = require("../engine");
const products = require("../fixtures/products.json");
const variations = require("../fixtures/variations.json");

const noopLogger = { info() {}, debug() {}, warn() {}, error() {}, success() {} };

function makeConfig() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-engine-"));
  return {
    woocommerce: { baseUrl: "https://example.com/wp-json/wc/v3", auth: { consumerKey: "k", consumerSecret: "s" } },
    strapi: { baseUrl: "http://localhost:1337/api", usePublicAccess: false, auth: { token: "t" } },
    duplicateTracking: { storageDir: dir },
    import: {
      currency: { multiplier: 1 },
      statusMappings: { product: { publish: "Active", draft: "InActive" } },
      images: { enableUpload: false },
      videos: { enableUpload: false },
      defaults: { variationAttributes: { color: { title: "خاکستری روشن", colorCode: "#CCCCCC" } } },
    },
    catalog: { maxRetries: 1, baseRetryDelay: 1, perPage: 100, defaultInStockCount: 9999, allowHttpMedia: true, trackingDirAbs: dir },
  };
}

/**
 * Build an engine whose network layers are stubbed against the fixtures.
 * @param {object} [opts]
 * @param {boolean} [opts.withExisting=false] preload indexes so existing entities are present
 */
function makeEngine(opts = {}) {
  const engine = new CatalogEngine(makeConfig(), noopLogger, { environment: "local" });
  const calls = { upserts: [], stockUpserts: [], puts: [] };

  // Every variation id that "exists" in Strapi (variable variations + simple synth ids).
  const existingVariationIds = opts.withExisting ? ["201", "202", "203", "102", "103"] : [];
  const existingProductIds = opts.withExisting ? ["101", "102", "103"] : [];

  engine.preflight = async () => {};
  engine.repo.preloadAttributes = async () => {};
  engine.repo.buildExternalIndex = async (endpoint) => {
    const map = new Map();
    if (endpoint === "/products") existingProductIds.forEach((id) => map.set(id, { id: Number(id) + 10000 }));
    if (endpoint === "/product-variations") existingVariationIds.forEach((id) => map.set(id, { id: Number(id) + 10000 }));
    return map;
  };
  engine.repo.upsert = async ({ endpoint, externalId }) => {
    calls.upserts.push({ endpoint, externalId });
    return { id: Number(externalId) + 10000, mode: "created" };
  };
  engine.repo.upsertStock = async ({ externalId, variationId }) => {
    calls.stockUpserts.push({ externalId, variationId });
    return "created";
  };
  engine.repo.resolveAttributeId = async () => 1;
  engine.repo.http = { put: async (url, body) => { calls.puts.push({ url, body }); return {}; } };

  engine.woo.fetchAllCategories = async () => [
    { id: 5, name: "کیف", slug: "kif", parent: 0 },
    { id: 9, name: "اکسسوری", slug: "acc", parent: 5 },
  ];
  engine.woo.iterateProducts = async function* () { for (const p of products) yield p; };
  engine.woo.iterateVariations = async function* (productId) {
    for (const v of variations.filter((x) => x.parent_id === productId)) yield v;
  };

  engine._calls = calls;
  return engine;
}

test("sortCategoriesByHierarchy: parents before children, orphans included", () => {
  const cats = [{ id: 3, parent: 1 }, { id: 1, parent: 0 }, { id: 2, parent: 99 }];
  const sorted = sortCategoriesByHierarchy(cats).map((c) => c.id);
  assert.ok(sorted.indexOf(1) < sorted.indexOf(3));
  assert.ok(sorted.includes(2));
  assert.equal(sorted.length, 3);
});

test("full dry-run: counts creates, synthesizes simple variations, flags missing price", async () => {
  const engine = makeEngine();
  const report = await engine.runSync({ dryRun: true, skipMedia: true });
  assert.equal(report.entities.products.created, 3);
  // 201, 202, 203 (203 inherits parent price), simple-102 synth = 4 created; simple-103 (no price) fails.
  assert.equal(report.entities.variations.created, 4);
  assert.equal(report.entities.variations.failed, 1);
  assert.deepEqual(report.failures.filter((f) => f.stage === "price").map((f) => f.wcId), [103]);
});

test("full sync: upserts categories + products + variations + stock, records mappings", async () => {
  const engine = makeEngine();
  const report = await engine.runSync({ dryRun: false, scope: "no-media" });
  assert.equal(report.entities.categories.created, 2);
  assert.equal(report.entities.products.created, 3);
  assert.equal(report.entities.variations.created, 4);
  assert.equal(report.entities.stocks.created, 4);
  assert.equal(engine.mapping.getStrapiId("products", 101), 10101);
  assert.equal(engine.mapping.getStrapiId("variations", 201), 10201);
});

test("stock scope: writes ONLY stock, only for existing variations, no product/variation upserts", async () => {
  const engine = makeEngine({ withExisting: true });
  const report = await engine.runSync({ scope: "stock" });

  // No product or variation record writes at all.
  assert.equal(engine._calls.upserts.length, 0);
  // Stock upserted for each existing variation (201,202,203 + simple 102,103) = 5.
  assert.equal(engine._calls.stockUpserts.length, 5);
  assert.equal(report.entities.stocks.created, 5);
  assert.equal(report.entities.products.created, 0);
  assert.equal(report.entities.variations.created, 0);
});

test("price scope: PUTs only {Price,DiscountPrice} on existing variations, creates nothing", async () => {
  const engine = makeEngine({ withExisting: true });
  const report = await engine.runSync({ scope: "price" });

  // Nothing created (no upsert), no stock writes.
  assert.equal(engine._calls.upserts.length, 0);
  assert.equal(engine._calls.stockUpserts.length, 0);

  // Price PUTs only touch /product-variations and only carry price fields.
  const pricePuts = engine._calls.puts.filter((p) => p.url.startsWith("/product-variations/"));
  assert.ok(pricePuts.length >= 4);
  for (const put of pricePuts) {
    assert.deepEqual(Object.keys(put.body.data).sort(), ["DiscountPrice", "Price"]);
  }
  assert.equal(report.entities.variations.updated, pricePuts.length);
});

test("media scope: attaches media to existing products, creates nothing", async () => {
  const engine = makeEngine({ withExisting: true });
  // Stub media resolution to return ids so an attach PUT happens.
  engine.media.syncProductMedia = async () => ({ coverId: 1, galleryIds: [2, 3], counts: { uploaded: 1, reused: 2, failed: 0 } });
  const report = await engine.runSync({ scope: "media" });

  assert.equal(engine._calls.upserts.length, 0);
  assert.equal(engine._calls.stockUpserts.length, 0);
  const productPuts = engine._calls.puts.filter((p) => p.url.startsWith("/products/"));
  assert.equal(productPuts.length, 3); // one per existing product
  for (const put of productPuts) {
    assert.equal(put.body.data.CoverImage, 1);
    assert.deepEqual(put.body.data.Media, [2, 3]);
  }
  assert.equal(report.media.uploaded, 3);
  assert.equal(report.media.reused, 6);
});

test("onlyExisting scopes skip entities that were never imported", async () => {
  const engine = makeEngine({ withExisting: false }); // nothing exists
  const report = await engine.runSync({ scope: "stock" });
  assert.equal(engine._calls.stockUpserts.length, 0);
  assert.equal(report.entities.products.skipped, 3); // all products skipped (not imported)
});
