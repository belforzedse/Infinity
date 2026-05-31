const path = require("path");

const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".m4v", ".ogv"]);
const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".avif",
]);

const VIDEO_MIME_PREFIX = "video/";
const IMAGE_MIME_PREFIX = "image/";

const EMBED_HOST_PATTERNS = [
  /youtube\.com/i,
  /youtu\.be/i,
  /vimeo\.com/i,
  /dailymotion\.com/i,
  /facebook\.com\/.*\/videos/i,
  /metacafe\.com/i,
];

/**
 * Common WooCommerce product video plugin meta keys (discovered + documented defaults).
 * Override via IMPORT_VIDEOS_META_KEYS env.
 */
const DEFAULT_VIDEO_META_KEYS = [
  "_product_video",
  "product_video",
  "_woo_product_video",
  "woo_product_video",
  "_product_video_gallery",
  "product_video_gallery",
  "_featured_video",
  "featured_video",
  "_wc_product_video",
  "wc_product_video",
  "_video_url",
  "video_url",
  "_woo_gallery_video",
  "woo_gallery_video",
];

function getUrlExtension(url) {
  try {
    const pathname = new URL(url).pathname;
    return path.extname(pathname).toLowerCase();
  } catch {
    const match = url.match(/(\.[a-z0-9]{2,5})(?:\?|#|$)/i);
    return match ? match[1].toLowerCase() : "";
  }
}

function isEmbedVideoUrl(url) {
  if (!url || typeof url !== "string") return false;
  return EMBED_HOST_PATTERNS.some((pattern) => pattern.test(url));
}

function isAllowedVideoExtension(ext, allowedTypes) {
  const normalized = ext.startsWith(".") ? ext.slice(1) : ext;
  return allowedTypes.includes(normalized.toLowerCase());
}

/**
 * @param {string} url
 * @param {string} [contentType]
 * @param {string[]} [allowedVideoTypes]
 * @returns {"image" | "video" | "unsupported" | "embed"}
 */
function detectMediaKind(url, contentType, allowedVideoTypes = ["mp4", "webm", "mov", "m4v"]) {
  if (!url || typeof url !== "string") return "unsupported";

  if (isEmbedVideoUrl(url)) {
    return "embed";
  }

  if (contentType) {
    const mime = contentType.toLowerCase().split(";")[0].trim();
    if (mime.startsWith(VIDEO_MIME_PREFIX)) return "video";
    if (mime.startsWith(IMAGE_MIME_PREFIX)) return "image";
  }

  const ext = getUrlExtension(url);
  if (VIDEO_EXTENSIONS.has(ext) && isAllowedVideoExtension(ext, allowedVideoTypes)) {
    return "video";
  }
  if (IMAGE_EXTENSIONS.has(ext)) {
    return "image";
  }

  return "unsupported";
}

/**
 * Extract direct media URLs from WooCommerce meta values (string, array, object, JSON).
 * @param {unknown} value
 * @returns {string[]}
 */
function extractUrlsFromMetaValue(value) {
  const urls = [];

  const visit = (node) => {
    if (node === null || node === undefined) return;

    if (typeof node === "string") {
      const trimmed = node.trim();
      if (!trimmed) return;

      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        try {
          visit(JSON.parse(trimmed));
          return;
        } catch {
          // fall through as URL
        }
      }

      if (/^https?:\/\//i.test(trimmed)) {
        urls.push(trimmed);
      }
      return;
    }

    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (typeof node === "object") {
      const record = /** @type {Record<string, unknown>} */ (node);
      const candidateKeys = ["url", "src", "video", "video_url", "file", "link", "value"];
      for (const key of candidateKeys) {
        if (typeof record[key] === "string") {
          visit(record[key]);
        }
      }
      if (typeof record.id === "number" || typeof record.id === "string") {
        // WordPress attachment ID — resolved separately by importer
      }
    }
  };

  visit(value);
  return urls;
}

/**
 * @param {object} wcProduct
 * @param {string[]} metaKeys
 * @returns {string[]}
 */
function extractVideoUrlsFromMeta(wcProduct, metaKeys = DEFAULT_VIDEO_META_KEYS) {
  if (!wcProduct || !Array.isArray(wcProduct.meta_data)) {
    return [];
  }

  const urls = [];
  const seen = new Set();

  for (const meta of wcProduct.meta_data) {
    if (!meta || !metaKeys.includes(meta.key)) continue;
    for (const url of extractUrlsFromMetaValue(meta.value)) {
      if (!seen.has(url)) {
        seen.add(url);
        urls.push(url);
      }
    }
  }

  return urls;
}

/**
 * Split WooCommerce product images array into image and video entries (preserving order).
 * @param {Array<{ src?: string, alt?: string }>} items
 * @param {string[]} allowedVideoTypes
 */
function splitWcMediaItems(items, allowedVideoTypes) {
  const images = [];
  const videos = [];
  const unsupported = [];

  if (!Array.isArray(items)) {
    return { images, videos, unsupported };
  }

  for (const item of items) {
    if (!item?.src) continue;
    const kind = detectMediaKind(item.src, undefined, allowedVideoTypes);
    if (kind === "image") {
      images.push(item);
    } else if (kind === "video") {
      videos.push(item);
    } else if (kind === "embed") {
      unsupported.push({ ...item, reason: "embed" });
    } else {
      unsupported.push({ ...item, reason: "unsupported" });
    }
  }

  return { images, videos, unsupported };
}

module.exports = {
  DEFAULT_VIDEO_META_KEYS,
  VIDEO_EXTENSIONS,
  detectMediaKind,
  isEmbedVideoUrl,
  getUrlExtension,
  extractUrlsFromMetaValue,
  extractVideoUrlsFromMeta,
  splitWcMediaItems,
};
