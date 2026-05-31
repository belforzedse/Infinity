#!/usr/bin/env node

/**
 * Smoke tests for mediaUtils (no network required).
 */

const assert = require("assert");
const {
  detectMediaKind,
  splitWcMediaItems,
  extractVideoUrlsFromMeta,
  isEmbedVideoUrl,
} = require("./utils/mediaUtils");

function testDetectMediaKind() {
  assert.strictEqual(detectMediaKind("https://example.com/photo.jpg"), "image");
  assert.strictEqual(detectMediaKind("https://example.com/clip.mp4"), "video");
  assert.strictEqual(detectMediaKind("https://example.com/clip.mp4", "video/mp4"), "video");
  assert.strictEqual(detectMediaKind("https://www.youtube.com/watch?v=abc"), "embed");
  assert.strictEqual(isEmbedVideoUrl("https://youtu.be/abc123"), true);
}

function testSplitWcMediaItems() {
  const split = splitWcMediaItems(
    [
      { src: "https://example.com/a.jpg" },
      { src: "https://example.com/b.mp4" },
      { src: "https://vimeo.com/123" },
    ],
    ["mp4", "webm", "mov", "m4v"],
  );
  assert.strictEqual(split.images.length, 1);
  assert.strictEqual(split.videos.length, 1);
  assert.strictEqual(split.unsupported.length, 1);
}

function testExtractVideoUrlsFromMeta() {
  const urls = extractVideoUrlsFromMeta(
    {
      meta_data: [
        { key: "_product_video", value: "https://example.com/v.mp4" },
        { key: "other", value: "ignore" },
      ],
    },
    ["_product_video"],
  );
  assert.deepStrictEqual(urls, ["https://example.com/v.mp4"]);
}

testDetectMediaKind();
testSplitWcMediaItems();
testExtractVideoUrlsFromMeta();

console.log("✅ mediaUtils smoke tests passed");
