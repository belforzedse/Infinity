"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const MappingStore = require("../lib/mapping");

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "catalog-map-"));
}

test("MappingStore: set/get/has roundtrip", () => {
  const dir = tmpDir();
  const store = new MappingStore(dir);
  assert.equal(store.has("products", 101), false);
  store.set("products", 101, 500, { slug: "bag" });
  assert.equal(store.has("products", 101), true);
  assert.equal(store.getStrapiId("products", 101), 500);
  assert.equal(store.get("products", 101).slug, "bag");
  assert.equal(store.size("products"), 1);
});

test("MappingStore: flush persists atomically and reloads", () => {
  const dir = tmpDir();
  const a = new MappingStore(dir);
  a.set("variations", 201, 900);
  a.flush();
  assert.ok(fs.existsSync(path.join(dir, "catalog-mappings.json")));
  assert.ok(!fs.existsSync(path.join(dir, "catalog-mappings.json.tmp")));

  const b = new MappingStore(dir); // fresh instance reloads from disk
  assert.equal(b.getStrapiId("variations", 201), 900);
});

test("MappingStore: corrupt file does not throw, starts empty", () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, "catalog-mappings.json"), "{not json");
  const store = new MappingStore(dir);
  assert.equal(store.size("products"), 0);
});
