"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { resolveScope, resolvePreset, needsProductLoop, PRESETS } = require("../lib/presets");

test("resolveScope: full enables everything (media unless skipped)", () => {
  assert.deepEqual(resolveScope("full"), {
    categories: true, products: true, variations: true, stock: true, media: true,
    onlyExisting: false, variationFields: "all",
  });
  assert.equal(resolveScope("full", { skipMedia: true }).media, false);
});

test("resolveScope: no-media never uploads media", () => {
  const f = resolveScope("no-media");
  assert.equal(f.media, false);
  assert.equal(f.products, true);
  assert.equal(f.variations, true);
});

test("resolveScope: stock only writes stock, only existing", () => {
  assert.deepEqual(resolveScope("stock"), {
    categories: false, products: false, variations: false, stock: true, media: false,
    onlyExisting: true, variationFields: "none",
  });
});

test("resolveScope: price writes variations price-only, only existing", () => {
  const f = resolveScope("price");
  assert.equal(f.variations, true);
  assert.equal(f.variationFields, "price-only");
  assert.equal(f.onlyExisting, true);
  assert.equal(f.stock, false);
  assert.equal(f.media, false);
  assert.equal(f.categories, false);
});

test("resolveScope: media only attaches media, only existing", () => {
  const f = resolveScope("media");
  assert.equal(f.media, true);
  assert.equal(f.onlyExisting, true);
  assert.equal(f.products, false);
  assert.equal(f.variations, false);
});

test("resolveScope: categories only", () => {
  const f = resolveScope("categories");
  assert.equal(f.categories, true);
  assert.equal(needsProductLoop(f), false);
});

test("resolveScope: unknown scope throws", () => {
  assert.throws(() => resolveScope("nope"), /Unknown scope/);
});

test("needsProductLoop: true when any product-touching phase is on", () => {
  assert.equal(needsProductLoop(resolveScope("stock")), true);
  assert.equal(needsProductLoop(resolveScope("media")), true);
  assert.equal(needsProductLoop(resolveScope("categories")), false);
});

test("resolvePreset: every preset resolves and is well-formed", () => {
  for (const p of PRESETS) {
    const r = resolvePreset(p.id);
    assert.equal(r.id, p.id);
    assert.equal(typeof r.label, "string");
    if (!r.verify) {
      assert.ok(r.run.scope, `${p.id} must carry a scope`);
      // scope must be resolvable
      resolveScope(r.run.scope);
    }
  }
});

test("resolvePreset: dry-run preset previews full without writing", () => {
  const r = resolvePreset("dry-run");
  assert.equal(r.run.scope, "full");
  assert.equal(r.run.dryRun, true);
  assert.equal(r.confirm, false);
});

test("resolvePreset: verify preset is read-only", () => {
  const r = resolvePreset("verify");
  assert.equal(r.verify, true);
  assert.equal(r.confirm, false);
});

test("resolvePreset: unknown id throws", () => {
  assert.throws(() => resolvePreset("xxx"), /Unknown preset/);
});
