"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const T = require("../lib/transforms");
const products = require("../fixtures/products.json");
const variations = require("../fixtures/variations.json");

const byId = (arr, id) => arr.find((x) => x.id === id);

test("mapProduct: slug imported verbatim (URL-decoded), not regenerated", () => {
  const { data } = T.mapProduct(byId(products, 101));
  assert.equal(data.Slug, "کیف-دستی"); // decoded from percent-encoded WC slug
});

test("mapProduct: writes ProductType, IsSimpleProduct, Weight, Status", () => {
  const variable = T.mapProduct(byId(products, 101)).data;
  assert.equal(variable.ProductType, "Variable");
  assert.equal(variable.IsSimpleProduct, false);
  assert.equal(variable.Weight, 1); // round(0.5) -> 1; numeric weight is written
  assert.equal(variable.Status, "InActive"); // no status mapping passed → safe default

  const simple = T.mapProduct(byId(products, 102), {
    statusMappings: { publish: "Active", draft: "InActive" },
  }).data;
  assert.equal(simple.ProductType, "Simple");
  assert.equal(simple.IsSimpleProduct, true);
  assert.equal(simple.Status, "Active");
  assert.ok(!("Weight" in simple)); // blank weight → schema default kept (not written)
});

test("mapProduct: falls back to short_description when description empty", () => {
  const { data } = T.mapProduct(byId(products, 102));
  assert.match(data.Description, /شال نخی/);
});

test("mapProduct: resolves category relations and reports misses", () => {
  const resolveCategoryId = (id) => ({ 5: 50, 9: 90 })[id] || null;
  const { data, mainCategoryMissing, otherCategoryMisses } = T.mapProduct(byId(products, 101), {
    resolveCategoryId,
  });
  assert.equal(data.product_main_category, 50);
  assert.deepEqual(data.product_other_categories, [90]);
  assert.equal(mainCategoryMissing, false);
  assert.deepEqual(otherCategoryMisses, []);
});

test("mapProduct: sends empty product_other_categories to clear stale relations", () => {
  const resolveCategoryId = (id) => ({ 5: 50 })[id] || null;
  const { data } = T.mapProduct(byId(products, 102), { resolveCategoryId });

  assert.equal(data.product_main_category, 50);
  assert.deepEqual(data.product_other_categories, []);
});

test("extractSizeGuideMatrix: supports legacy meta keys and sanitizes cells", () => {
  const wcProduct = {
    ...byId(products, 101),
    meta_data: [
      { key: "ignored", value: [["x"]] },
      {
        key: "product-custom-meta-inp",
        value: JSON.stringify([
          ["Size", "Waist"],
          ["M", 38],
          ["L", null],
          "bad-row",
        ]),
      },
    ],
  };

  assert.deepEqual(T.extractSizeGuideMatrix(wcProduct), [
    ["Size", "Waist"],
    ["M", "38"],
    ["L", ""],
  ]);
  assert.deepEqual(T.mapProduct(wcProduct).sizeGuideMatrix, [
    ["Size", "Waist"],
    ["M", "38"],
    ["L", ""],
  ]);
});

test("extractSizeGuideMatrix: rejects empty or invalid payloads", () => {
  assert.equal(T.extractSizeGuideMatrix({}), null);
  assert.equal(T.extractSizeGuideMatrix({ meta_data: [{ key: "product_size_guide", value: "" }] }), null);
  assert.equal(T.extractSizeGuideMatrix({ meta_data: [{ key: "product_size_guide", value: "not-json" }] }), null);
  assert.equal(T.extractSizeGuideMatrix({ meta_data: [{ key: "product_size_guide", value: [["", null]] }] }), null);
});

test("computeVariationPricing: regular + sale → Price + DiscountPrice", () => {
  const r = T.computeVariationPricing(byId(variations, 201), {}, 1);
  assert.deepEqual(r, { price: 1000000, discountPrice: 850000 });
});

test("computeVariationPricing: only sale price → use sale as Price (no discount)", () => {
  const r = T.computeVariationPricing(byId(variations, 202), {}, 1);
  assert.deepEqual(r, { price: 950000 });
});

test("computeVariationPricing: no price anywhere → priceMissing", () => {
  const r = T.computeVariationPricing(byId(variations, 203), {}, 1);
  assert.deepEqual(r, { priceMissing: true });
});

test("computeVariationPricing: parent fallback when variation price blank", () => {
  const variation = { id: 9, regular_price: "", sale_price: "" };
  const parent = { regular_price: "500000" };
  const r = T.computeVariationPricing(variation, parent, 1);
  assert.deepEqual(r, { price: 500000 });
});

test("computeVariationPricing: 0 regular is not 'missing' when sale exists", () => {
  const r = T.computeVariationPricing({ id: 1, regular_price: "0", sale_price: "120000", on_sale: true }, {}, 1);
  assert.deepEqual(r, { price: 120000 });
});

test("mapVariation: stable SKU, no per-run mutation; IsPublished default true", () => {
  const parent = byId(products, 101);
  const { data } = T.mapVariation(byId(variations, 201), { parentStrapiId: 500, parentProduct: parent });
  assert.equal(data.SKU, "BAG-RED-M");
  assert.equal(data.product, 500);
  assert.equal(data.external_id, "201");
  assert.equal(data.IsPublished, true);

  const noStatus = T.mapVariation({ id: 7, regular_price: "100", attributes: [] }, { parentStrapiId: 1 });
  assert.equal(noStatus.data.IsPublished, true); // missing status defaults to published
});

test("generateVariationSku: synthesizes WC-<pid>-<vid> when blank", () => {
  assert.equal(T.generateVariationSku(byId(variations, 202), 101), "WC-101-202");
});

test("mapVariation: create with missing price flags priceMissing (no silent 0 on update)", () => {
  const create = T.mapVariation(byId(variations, 203), { parentStrapiId: 1, preserveMissingPrice: false });
  assert.equal(create.priceMissing, true);
  assert.equal(create.data.Price, 0); // create path sets 0, engine rejects it as a failure

  const update = T.mapVariation(byId(variations, 203), { parentStrapiId: 1, preserveMissingPrice: true });
  assert.equal(update.priceMissing, true);
  assert.ok(!("Price" in update.data)); // update preserves existing price
});

test("mapStock: managed quantity used directly", () => {
  assert.deepEqual(T.mapStock({ id: 1, manage_stock: true, stock_quantity: 5 }), {
    count: 5,
    externalId: "stock_1",
  });
});

test("mapStock: unmanaged in-stock → defaultInStockCount (fixes 'in-stock shown unavailable')", () => {
  const r = T.mapStock({ id: 2, manage_stock: false, stock_status: "instock" }, { defaultInStockCount: 9999 });
  assert.equal(r.count, 9999);
});

test("mapStock: out of stock → 0", () => {
  assert.equal(T.mapStock({ id: 3, stock_status: "outofstock" }).count, 0);
});

test("resolveAttribute: color normalized through mapping table with hex code", () => {
  const c = T.resolveAttribute("color", "قرمز");
  assert.ok(c.title);
  assert.match(c.colorCode, /^#/);
  assert.equal(c.externalId.startsWith("color_"), true);

  const s = T.resolveAttribute("size", "M");
  assert.equal(s.title, "M");
  assert.equal(s.externalId, "size_m");
  assert.equal(T.resolveAttribute("color", ""), null);
});

test("identifyAttributeType: Persian and English names", () => {
  assert.equal(T.identifyAttributeType("رنگ"), "color");
  assert.equal(T.identifyAttributeType("Color"), "color");
  assert.equal(T.identifyAttributeType("سایز"), "size");
  assert.equal(T.identifyAttributeType("Size"), "size");
  assert.equal(T.identifyAttributeType("جنس"), "model");
});

test("synthesizeSimpleVariation: builds a sellable variation for simple products", () => {
  const simple = byId(products, 102);
  const v = T.synthesizeSimpleVariation(simple);
  assert.equal(v.id, 102);
  assert.equal(v.sku, "WC-102"); // simple has no sku in fixture
  const { data, priceMissing } = T.mapVariation(v, { parentStrapiId: 600, parentProduct: simple });
  assert.equal(priceMissing, false);
  assert.equal(data.Price, 300000);
  assert.equal(data.SKU, "WC-102");
});

test("mapCategory: parent resolved when known, else flagged missing", () => {
  const child = { id: 9, name: "اکسسوری", slug: "acc", parent: 5 };
  const ok = T.mapCategory(child, () => 50);
  assert.equal(ok.data.parent, 50);
  assert.equal(ok.parentMissing, false);

  const miss = T.mapCategory(child, () => null);
  assert.ok(!("parent" in miss.data));
  assert.equal(miss.parentMissing, true);
});
