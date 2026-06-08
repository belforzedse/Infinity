"use strict";

const ImageUploader = require("../../utils/ImageUploader");
const { splitWcMediaItems, extractVideoUrlsFromMeta, isEmbedVideoUrl } = require("../../utils/mediaUtils");
const { validateMediaUrl } = require("./safeUrl");

/**
 * Media synchronization with persistent deduplication and an SSRF guard.
 *
 * Fixes two legacy problems:
 *  1. The old uploader cached uploads only in memory, so every run re-downloaded
 *     and re-uploaded every image (and `generateFileName` used a timestamp, so
 *     Strapi couldn't dedup either). Here a persistent URL → Strapi-file-id map
 *     means each image is uploaded once and reused forever.
 *  2. The old uploader downloaded any URL with no validation. Here every URL is
 *     checked against an SSRF guard before any network call.
 *
 * The actual download/convert(WebP)/upload is delegated to the existing
 * `ImageUploader` (working code we deliberately reuse rather than rewrite).
 */
class MediaSync {
  /**
   * @param {object} config
   * @param {object} logger
   * @param {import('./mapping')} mediaStore persistent MappingStore (type "media", keyed by URL)
   * @param {object} [opts]
   * @param {boolean} [opts.allowHttp=false]
   */
  constructor(config, logger, mediaStore, opts = {}) {
    this.config = config;
    this.logger = logger;
    this.store = mediaStore;
    this.allowHttp = opts.allowHttp ?? false;
    this.uploader = new ImageUploader(config, logger);
    this.videoConfig = config.import?.videos || {};
    this.maxGallery = config.import?.images?.maxImagesPerProduct ?? 999;
  }

  /**
   * Sync a single media URL. Returns `{ id, mime, status }` where status is one of
   * "reused" | "uploaded" | "failed".
   * @param {string} url
   * @param {string} altText
   * @param {string} prefix
   * @param {boolean} isCover
   */
  async syncUrl(url, altText, prefix, isCover = false) {
    // 1. Persistent dedup — already uploaded in a previous run?
    const cached = this.store.get("media", url);
    if (cached && cached.strapiId) {
      this.logger.debug(`♻️ Reusing media ${url} → ${cached.strapiId}`);
      return { id: cached.strapiId, mime: cached.mime, status: "reused" };
    }

    // 2. SSRF guard before any network access
    const check = validateMediaUrl(url, { allowHttp: this.allowHttp });
    if (!check.ok) {
      this.logger.warn(`🚫 Blocked unsafe media URL (${check.reason})`);
      return { id: null, mime: null, status: "failed" };
    }

    // 3. Delegate download/convert/upload to the existing uploader
    const uploaded = await this.uploader.downloadAndUploadMedia(url, altText, prefix, isCover);
    if (!uploaded || !uploaded.id) {
      return { id: null, mime: null, status: "failed" };
    }

    this.store.set("media", url, uploaded.id, { name: uploaded.name, mime: uploaded.mime });
    return { id: uploaded.id, mime: uploaded.mime, status: "uploaded" };
  }

  /**
   * Resolve all media for a product into an ordered set of ids.
   *
   * Returns `{ coverId, galleryIds, counts }`. The caller attaches these to the
   * Strapi product ONLY when ids are present — it never nulls existing media on a
   * failed re-download (the legacy data-loss bug).
   *
   * @param {object} wcProduct
   */
  async syncProductMedia(wcProduct) {
    const counts = { uploaded: 0, reused: 0, failed: 0 };
    const allowedVideoTypes = this.videoConfig.allowedTypes || ["mp4", "webm", "mov", "m4v"];
    const imagesEnabled = this.config.import?.images?.enableUpload !== false;
    const videosEnabled = this.videoConfig.enableUpload !== false;

    const split = splitWcMediaItems(wcProduct.images, allowedVideoTypes);
    const metaVideoUrls = videosEnabled ? extractVideoUrlsFromMeta(wcProduct, this.videoConfig.metaKeys) : [];

    let coverId = null;
    const galleryIds = [];

    const track = (res) => {
      if (res.status === "uploaded") counts.uploaded += 1;
      else if (res.status === "reused") counts.reused += 1;
      else counts.failed += 1;
      return res;
    };

    // Cover = first image (fallback: first downloadable video)
    if (imagesEnabled && split.images.length > 0) {
      const c = split.images[0];
      const res = track(await this.syncUrl(c.src, c.alt || wcProduct.name, `product-${wcProduct.id}-cover`, true));
      coverId = res.id;
    } else if (videosEnabled && split.videos.length > 0) {
      const v = split.videos[0];
      const res = track(await this.syncUrl(v.src, v.alt || wcProduct.name, `product-${wcProduct.id}-cover-video`, true));
      coverId = res.id;
    }

    // Gallery images (preserve order; skip the one already used as cover)
    if (imagesEnabled) {
      const galleryImages = split.images.slice(coverId && split.images.length > 0 ? 1 : 0);
      for (let i = 0; i < galleryImages.length && galleryIds.length < this.maxGallery; i += 1) {
        const img = galleryImages[i];
        const res = track(
          await this.syncUrl(img.src, img.alt || `${wcProduct.name} - ${i + 1}`, `product-${wcProduct.id}-gallery-${i + 1}`, false),
        );
        if (res.id) galleryIds.push(res.id);
      }
    }

    // Videos (from images array + meta), skipping embeds
    if (videosEnabled) {
      const galleryVideos = split.videos.slice(coverId && split.images.length === 0 ? 1 : 0);
      const videoUrls = [
        ...galleryVideos.map((v) => v.src),
        ...metaVideoUrls.filter((u) => !isEmbedVideoUrl(u)),
      ];
      const seen = new Set(split.images.map((i) => i.src));
      for (let i = 0; i < videoUrls.length && galleryIds.length < this.maxGallery; i += 1) {
        const u = videoUrls[i];
        if (seen.has(u)) continue;
        seen.add(u);
        const res = track(await this.syncUrl(u, `${wcProduct.name} - video ${i + 1}`, `product-${wcProduct.id}-video-${i + 1}`, false));
        if (res.id) galleryIds.push(res.id);
      }
    }

    return { coverId, galleryIds, counts };
  }
}

module.exports = MediaSync;
