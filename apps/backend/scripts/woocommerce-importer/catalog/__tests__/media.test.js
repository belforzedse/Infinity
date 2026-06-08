"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const MappingStore = require("../lib/mapping");
const MediaSync = require("../lib/media");

const noopLogger = {
  info() {}, debug() {}, warn() {}, error() {}, success() {},
};

function makeMedia(allowHttp = false) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-media-"));
  const store = new MappingStore(dir, { fileName: "media.json" });
  const config = { import: { images: { enableUpload: true }, videos: {} } };
  const media = new MediaSync(config, noopLogger, store, { allowHttp });
  // Replace the real uploader (network/sharp) with a counting fake.
  let uploadCount = 0;
  media.uploader = {
    async downloadAndUploadMedia() {
      uploadCount += 1;
      return { id: 42, name: "a.webp", mime: "image/webp" };
    },
  };
  return { media, store, uploads: () => uploadCount };
}

test("MediaSync.syncUrl: uploads once, then reuses from persistent store", async () => {
  const { media, uploads } = makeMedia();
  const url = "https://cdn.example.com/a.jpg";

  const first = await media.syncUrl(url, "alt", "p-1", true);
  assert.equal(first.status, "uploaded");
  assert.equal(first.id, 42);
  assert.equal(uploads(), 1);

  const second = await media.syncUrl(url, "alt", "p-1", true);
  assert.equal(second.status, "reused");
  assert.equal(second.id, 42);
  assert.equal(uploads(), 1); // NOT re-uploaded on the second run
});

test("MediaSync.syncUrl: a fresh run reuses ids persisted to disk", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-media-"));
  const config = { import: { images: { enableUpload: true }, videos: {} } };

  const store1 = new MappingStore(dir, { fileName: "media.json" });
  const m1 = new MediaSync(config, noopLogger, store1);
  m1.uploader = { async downloadAndUploadMedia() { return { id: 7, name: "x", mime: "image/webp" }; } };
  await m1.syncUrl("https://cdn.example.com/x.jpg", "a", "p", false);
  store1.flush();

  const store2 = new MappingStore(dir, { fileName: "media.json" });
  const m2 = new MediaSync(config, noopLogger, store2);
  let called = false;
  m2.uploader = { async downloadAndUploadMedia() { called = true; return { id: 99 }; } };
  const res = await m2.syncUrl("https://cdn.example.com/x.jpg", "a", "p", false);
  assert.equal(res.status, "reused");
  assert.equal(res.id, 7);
  assert.equal(called, false);
});

test("MediaSync.syncUrl: SSRF / unsafe URLs are blocked before download", async () => {
  const { media, uploads } = makeMedia(false);
  const blocked = await media.syncUrl("http://127.0.0.1:6379/x.jpg", "a", "p", false);
  assert.equal(blocked.status, "failed");
  assert.equal(uploads(), 0); // uploader never invoked

  const httpBlocked = await media.syncUrl("http://cdn.example.com/a.jpg", "a", "p", false);
  assert.equal(httpBlocked.status, "failed"); // plain http blocked when allowHttp=false
});
