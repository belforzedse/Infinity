"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { resolveSlug, safeDecode, slugifyTitle } = require("../lib/slug");

test("resolveSlug: uses WooCommerce slug verbatim (URL-decoded)", () => {
  assert.equal(resolveSlug({ id: 1, slug: "blue-shirt" }, "product"), "blue-shirt");
  assert.equal(
    resolveSlug({ id: 1, slug: "%da%a9%db%8c%d9%81" }, "product"),
    "کیف", // decoded Persian
  );
});

test("resolveSlug: is deterministic (same input → same output, no Date.now)", () => {
  const e = { id: 7, slug: "x-y" };
  assert.equal(resolveSlug(e, "product"), resolveSlug(e, "product"));
});

test("resolveSlug: falls back to slugified title, then <prefix>-<id>", () => {
  assert.equal(resolveSlug({ id: 7, name: "Red Bag" }, "product"), "red-bag");
  assert.equal(resolveSlug({ id: 7 }, "product"), "product-7");
});

test("safeDecode: never throws on malformed percent-encoding", () => {
  assert.equal(safeDecode("%E0%A4%A"), "%E0%A4%A");
  assert.equal(safeDecode(undefined), "");
});

test("slugifyTitle: preserves Persian, lowercases ASCII, collapses separators", () => {
  assert.equal(slugifyTitle("  Hello   World "), "hello-world");
  assert.equal(slugifyTitle("کیف دستی"), "کیف-دستی");
});
