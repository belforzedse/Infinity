"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { ImportReport } = require("../lib/report");

function newReport() {
  return new ImportReport({
    command: "sync",
    environment: "local",
    trackingDir: fs.mkdtempSync(path.join(os.tmpdir(), "catalog-rep-")),
  });
}

test("ImportReport: counts per entity and media", () => {
  const r = newReport();
  r.count("products", "created");
  r.count("products", "created");
  r.count("products", "updated");
  r.count("variations", "created", 3);
  r.mediaUploaded(2);
  r.mediaReused(5);
  assert.equal(r.entities.products.created, 2);
  assert.equal(r.entities.products.updated, 1);
  assert.equal(r.entities.variations.created, 3);
  assert.equal(r.media.uploaded, 2);
  assert.equal(r.media.reused, 5);
});

test("ImportReport: failures always carry wcId + stage", () => {
  const r = newReport();
  r.fail("variations", { wcId: 203, stage: "price", error: new Error("no price") });
  assert.equal(r.entities.variations.failed, 1);
  assert.equal(r.failures.length, 1);
  assert.equal(r.failures[0].wcId, 203);
  assert.equal(r.failures[0].stage, "price");
  assert.match(r.failures[0].error, /no price/);
  assert.equal(r.hasFailures(), true);
});

test("ImportReport: toJSON includes duration and save() writes a file", () => {
  const r = newReport();
  r.count("products", "created");
  const json = r.toJSON();
  assert.equal(typeof json.durationMs, "number");
  assert.equal(json.entities.products.created, 1);
  const file = r.save();
  assert.ok(fs.existsSync(file));
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.equal(parsed.command, "sync");
});
