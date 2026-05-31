#!/usr/bin/env node

/**
 * Scan WooCommerce products for video-related fields in images[] and meta_data[].
 * Usage: node discover-product-videos.js [--limit=50] [--page=1]
 */

const config = require("./config");
const Logger = require("./utils/Logger");
const { WooCommerceClient } = require("./utils/ApiClient");
const {
  DEFAULT_VIDEO_META_KEYS,
  detectMediaKind,
  splitWcMediaItems,
  extractVideoUrlsFromMeta,
} = require("./utils/mediaUtils");

const logger = new Logger();

function parseArgs() {
  const args = { limit: 50, page: 1 };
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--(\w+)=(.+)$/);
    if (match) {
      args[match[1]] = match[2];
    }
  }
  return {
    limit: Number.parseInt(String(args.limit), 10) || 50,
    page: Number.parseInt(String(args.page), 10) || 1,
  };
}

async function main() {
  const { limit, page } = parseArgs();
  const videoConfig = config.import?.videos || {};
  const allowedVideoTypes = videoConfig.allowedTypes || ["mp4", "webm", "mov", "m4v"];
  const metaKeys = videoConfig.metaKeys?.length ? videoConfig.metaKeys : DEFAULT_VIDEO_META_KEYS;

  const client = new WooCommerceClient(config, logger);
  logger.info(`Scanning up to ${limit} products (page ${page}) for video fields...`);

  const response = await client.getProducts(page, limit);
  const products = response?.data || response || [];

  const metaKeyHits = new Map();
  let productsWithVideoInImages = 0;
  let productsWithVideoMeta = 0;

  for (const product of products) {
    const split = splitWcMediaItems(product.images, allowedVideoTypes);
    if (split.videos.length > 0) {
      productsWithVideoInImages++;
      logger.info(`Product ${product.id} "${product.name}": ${split.videos.length} video(s) in images[]`);
      split.videos.forEach((v) => logger.info(`  - ${v.src}`));
    }

    const metaVideos = extractVideoUrlsFromMeta(product, metaKeys);
    if (metaVideos.length > 0) {
      productsWithVideoMeta++;
      logger.info(`Product ${product.id} "${product.name}": ${metaVideos.length} video URL(s) in meta`);
      metaVideos.forEach((url) => logger.info(`  - ${url}`));
    }

    if (Array.isArray(product.meta_data)) {
      for (const meta of product.meta_data) {
        if (!meta?.key) continue;
        const valueStr = typeof meta.value === "string" ? meta.value : JSON.stringify(meta.value);
        if (/video|\.mp4|\.webm|\.mov/i.test(meta.key) || /\.mp4|\.webm|\.mov|video/i.test(valueStr)) {
          const count = metaKeyHits.get(meta.key) || 0;
          metaKeyHits.set(meta.key, count + 1);
        }
      }
    }

    for (const item of product.images || []) {
      if (item?.src) {
        const kind = detectMediaKind(item.src, undefined, allowedVideoTypes);
        if (kind === "embed") {
          logger.warn(`Product ${product.id}: embed URL in images[] (skipped on import): ${item.src}`);
        }
      }
    }
  }

  logger.info("\n--- Summary ---");
  logger.info(`Products scanned: ${products.length}`);
  logger.info(`With video in images[]: ${productsWithVideoInImages}`);
  logger.info(`With video in meta: ${productsWithVideoMeta}`);
  if (metaKeyHits.size > 0) {
    logger.info("Meta keys mentioning video:");
    for (const [key, count] of [...metaKeyHits.entries()].sort((a, b) => b[1] - a[1])) {
      logger.info(`  ${key}: ${count} product(s)`);
    }
  } else {
    logger.info("No video-related meta keys found in this sample.");
  }
}

main().catch((error) => {
  logger.error("Discovery failed:", error.message);
  process.exit(1);
});
