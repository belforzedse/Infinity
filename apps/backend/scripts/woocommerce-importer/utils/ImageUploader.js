const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { detectMediaKind, isEmbedVideoUrl } = require("./mediaUtils");

/**
 * ImageUploader - Handles downloading and uploading images and videos from WooCommerce to Strapi
 */
class ImageUploader {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.uploadCache = new Map();
    this.downloadCache = new Map();
    this.tempDir = path.join(__dirname, "../temp");

    const imageConfig = this.getImageConfig();
    if (!imageConfig.retry) {
      imageConfig.retry = {
        coverImageDownloadRetries: 3,
        coverImageUploadRetries: 3,
        galleryImageDownloadRetries: 3,
        galleryImageUploadRetries: 3,
        initialRetryDelay: 1000,
        maxRetryDelay: 10000,
        retryMultiplier: 2,
      };
    }

    this.ensureTempDir();
  }

  getImageConfig() {
    return this.config.import?.images || this.config.images || {};
  }

  getVideoConfig() {
    return this.config.import?.videos || this.config.videos || {};
  }

  getStrapiConfig() {
    return this.config.strapi || {};
  }

  /**
   * Download and upload cover image for a product (first image entry only — legacy/blog path)
   */
  async handleCoverImage(wcProduct, strapiProductId) {
    try {
      const coverImageData =
        wcProduct.images && wcProduct.images.length > 0 ? wcProduct.images[0] : null;

      if (!coverImageData || !coverImageData.src) {
        this.logger.warn(`📸 No cover image found for product: ${wcProduct.name}`);
        return null;
      }

      const kind = detectMediaKind(
        coverImageData.src,
        undefined,
        this.getVideoConfig().allowedTypes || ["mp4", "webm", "mov", "m4v"],
      );
      if (kind !== "image") {
        this.logger.debug(
          `📸 Skipping non-image cover entry for ${wcProduct.name} (use handleProductMedia for videos)`,
        );
        return null;
      }

      this.logger.info(`📸 Processing cover image for: ${wcProduct.name}`);

      const uploadedImage = await this.downloadAndUploadImage(
        coverImageData.src,
        coverImageData.alt || wcProduct.name,
        `product-${wcProduct.id}-cover`,
        true,
      );

      if (uploadedImage) {
        this.logger.success(`✅ Cover image uploaded: ${uploadedImage.name}`);
        return uploadedImage.id;
      }

      return null;
    } catch (error) {
      this.logger.error(
        `❌ Failed to handle cover image for product ${wcProduct.id}:`,
        error.message,
      );
      return null;
    }
  }

  /**
   * Download and upload gallery images (skips first image — legacy path)
   */
  async handleGalleryImages(wcProduct, strapiProductId, maxImages = 999) {
    try {
      if (!wcProduct.images || wcProduct.images.length <= 1) {
        this.logger.debug(`📸 No gallery images for product: ${wcProduct.name}`);
        return [];
      }

      const totalGalleryImages = wcProduct.images.length - 1;
      const imagesToProcess = Math.min(totalGalleryImages, maxImages);

      this.logger.info(
        `📸 Processing ${imagesToProcess}/${totalGalleryImages} gallery images for: ${
          wcProduct.name
        }${maxImages < 999 ? ` (max: ${maxImages})` : ""}`,
      );

      const uploadedImages = [];
      const allowedVideoTypes = this.getVideoConfig().allowedTypes || ["mp4", "webm", "mov", "m4v"];

      for (let i = 1; i < wcProduct.images.length && uploadedImages.length < maxImages; i++) {
        const imageData = wcProduct.images[i];
        if (!imageData.src) continue;

        const kind = detectMediaKind(imageData.src, undefined, allowedVideoTypes);
        if (kind !== "image") continue;

        const uploadedImage = await this.downloadAndUploadImage(
          imageData.src,
          imageData.alt || `${wcProduct.name} - Image ${i}`,
          `product-${wcProduct.id}-gallery-${i}`,
        );

        if (uploadedImage) {
          uploadedImages.push(uploadedImage.id);
          this.logger.debug(`✅ Gallery image ${i} uploaded: ${uploadedImage.name}`);
        }

        await this.delay(100);
      }

      this.logger.success(`✅ Uploaded ${uploadedImages.length} gallery images`);
      return uploadedImages;
    } catch (error) {
      this.logger.error(
        `❌ Failed to handle gallery images for product ${wcProduct.id}:`,
        error.message,
      );
      return [];
    }
  }

  /**
   * Upload a single media URL (auto-detects image vs video)
   */
  async downloadAndUploadMedia(mediaUrl, altText, prefix, isCover = false) {
    const videoConfig = this.getVideoConfig();
    const kind = detectMediaKind(mediaUrl, undefined, videoConfig.allowedTypes || ["mp4", "webm", "mov", "m4v"]);

    if (kind === "embed") {
      if (videoConfig.skipEmbedUrls !== false) {
        this.logger.warn(
          `⚠️ ویدیوی تعبیه‌شده (YouTube/Vimeo) پشتیبانی نمی‌شود — رد شد: ${mediaUrl}`,
        );
        return null;
      }
    }

    if (kind === "video") {
      if (videoConfig.enableUpload === false) {
        this.logger.debug(`⏭️ Video upload disabled — skipping: ${mediaUrl}`);
        return null;
      }
      return this.downloadAndUploadVideo(mediaUrl, altText, prefix, isCover);
    }

    if (kind === "image") {
      return this.downloadAndUploadImage(mediaUrl, altText, prefix, isCover);
    }

    this.logger.warn(`⚠️ نوع فایل پشتیبانی نمی‌شود — رد شد: ${mediaUrl}`);
    return null;
  }

  async downloadAndUploadImage(imageUrl, altText, prefix, isCoverImage = false) {
    try {
      if (this.uploadCache.has(imageUrl)) {
        this.logger.debug(`📸 Using cached image: ${imageUrl}`);
        return this.uploadCache.get(imageUrl);
      }

      const retryConfig = this.getImageConfig().retry || {};
      const downloadRetries = isCoverImage
        ? retryConfig.coverImageDownloadRetries || 3
        : retryConfig.galleryImageDownloadRetries || 3;

      const imageBuffer = await this.downloadMediaWithRetry(imageUrl, downloadRetries, "image");
      if (!imageBuffer) return null;

      const { buffer: processedBuffer, fileName: processedFileName } = await this.processImage(
        imageBuffer,
        imageUrl,
        prefix,
      );

      const uploadRetries = isCoverImage
        ? retryConfig.coverImageUploadRetries || 3
        : retryConfig.galleryImageUploadRetries || 3;

      const uploadedImage = await this.uploadToStrapiWithRetry(
        processedBuffer,
        processedFileName,
        altText,
        uploadRetries,
        "image",
      );

      if (uploadedImage) {
        this.uploadCache.set(imageUrl, uploadedImage);
      }

      return uploadedImage;
    } catch (error) {
      this.logger.error(`❌ Failed to process image ${imageUrl}:`, error.message);
      return null;
    }
  }

  async downloadAndUploadVideo(videoUrl, altText, prefix, isCoverVideo = false) {
    try {
      if (isEmbedVideoUrl(videoUrl)) {
        this.logger.warn(
          `⚠️ ویدیوی تعبیه‌شده (YouTube/Vimeo) قابل دانلود نیست — رد شد: ${videoUrl}`,
        );
        return null;
      }

      if (this.uploadCache.has(videoUrl)) {
        this.logger.debug(`🎬 Using cached video: ${videoUrl}`);
        return this.uploadCache.get(videoUrl);
      }

      const videoConfig = this.getVideoConfig();
      const retryConfig = this.getImageConfig().retry || {};
      const downloadRetries = isCoverVideo
        ? retryConfig.coverImageDownloadRetries || 3
        : retryConfig.galleryImageDownloadRetries || 3;

      const downloadResult = await this.downloadMediaWithRetry(videoUrl, downloadRetries, "video");
      if (!downloadResult) return null;

      const { buffer, contentType } = downloadResult;
      const fileName = this.generateFileName(videoUrl, prefix, contentType);

      if (!this.isValidVideoFile(fileName, contentType)) {
        this.logger.error(
          `❌ فرمت ویدیو نامعتبر است — فقط ${(videoConfig.allowedTypes || []).join(", ")} مجاز است: ${videoUrl}`,
        );
        return null;
      }

      const uploadRetries = isCoverVideo
        ? retryConfig.coverImageUploadRetries || 3
        : retryConfig.galleryImageUploadRetries || 3;

      const uploadedVideo = await this.uploadToStrapiWithRetry(
        buffer,
        fileName,
        altText,
        uploadRetries,
        "video",
      );

      if (uploadedVideo) {
        this.uploadCache.set(videoUrl, uploadedVideo);
        this.logger.success(`✅ Video uploaded: ${uploadedVideo.name}`);
      }

      return uploadedVideo;
    } catch (error) {
      this.logger.error(`❌ Failed to process video ${videoUrl}:`, error.message);
      return null;
    }
  }

  isValidVideoFile(fileName, contentType) {
    const videoConfig = this.getVideoConfig();
    const allowedTypes = videoConfig.allowedTypes || ["mp4", "webm", "mov", "m4v"];
    const ext = path.extname(fileName).slice(1).toLowerCase();

    if (contentType && contentType.startsWith("video/")) {
      return allowedTypes.some((type) => contentType.includes(type) || ext === type);
    }

    return allowedTypes.includes(ext);
  }

  async downloadMediaWithRetry(mediaUrl, maxRetries = 3, mediaKind = "image") {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.downloadMedia(mediaUrl, mediaKind);
        if (result) {
          return result;
        }
        throw new Error("Download returned null");
      } catch (error) {
        lastError = error;

        if (
          error.message?.includes("too large") ||
          error.message?.includes("HTTP 404") ||
          error.message?.includes("نامعتبر")
        ) {
          this.logger.error(`❌ Non-retryable error for ${mediaUrl}:`, error.message);
          return null;
        }

        if (attempt === maxRetries) {
          break;
        }

        const retryConfig = this.getImageConfig().retry || {};
        const initialDelay = retryConfig.initialRetryDelay || 1000;
        const multiplier = retryConfig.retryMultiplier || 2;
        const maxDelay = retryConfig.maxRetryDelay || 10000;
        const retryDelay = Math.min(initialDelay * Math.pow(multiplier, attempt - 1), maxDelay);

        this.logger.warn(
          `🔄 Media download failed (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms: ${mediaUrl}`,
          error.message,
        );
        await this.delay(retryDelay);
      }
    }

    this.logger.error(
      `❌ Failed to download media after ${maxRetries} attempts: ${mediaUrl}`,
      lastError?.message,
    );
    return null;
  }

  /** @returns {Buffer | { buffer: Buffer, contentType: string } | null} */
  async downloadMedia(mediaUrl, mediaKind = "image") {
    if (this.downloadCache.has(mediaUrl)) {
      this.logger.debug(`📥 Using cached download: ${mediaUrl}`);
      const cached = this.downloadCache.get(mediaUrl);
      if (mediaKind === "video") {
        return typeof cached === "object" && cached.buffer ? cached : { buffer: cached, contentType: "" };
      }
      return typeof cached === "object" && cached.buffer ? cached.buffer : cached;
    }

    const imageConfig = this.getImageConfig();
    const videoConfig = this.getVideoConfig();
    const timeout =
      mediaKind === "video"
        ? videoConfig.downloadTimeout || 120000
        : imageConfig.downloadTimeout || 30000;
    const maxSize =
      mediaKind === "video" ? videoConfig.maxSize || 256 * 1024 * 1024 : imageConfig.maxSize || 10 * 1024 * 1024;

    this.logger.debug(`📥 Downloading ${mediaKind}: ${mediaUrl}`);

    const response = await axios({
      method: "GET",
      url: mediaUrl,
      responseType: "arraybuffer",
      timeout,
      headers: {
        "User-Agent": "WooCommerce-Strapi-Importer/1.0.0",
      },
    });

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }

    const buffer = Buffer.from(response.data);
    const contentType = (response.headers["content-type"] || "").toLowerCase().split(";")[0].trim();

    if (mediaKind === "video" && contentType && !contentType.startsWith("video/")) {
      throw new Error(`نوع MIME ویدیو نامعتبر است: ${contentType || "unknown"}`);
    }

    if (buffer.length > maxSize) {
      throw new Error(
        `${mediaKind === "video" ? "Video" : "Image"} too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB > ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
      );
    }

    const cacheEntry = mediaKind === "video" ? { buffer, contentType } : buffer;
    this.downloadCache.set(mediaUrl, cacheEntry);

    this.logger.debug(`✅ Downloaded ${(buffer.length / 1024).toFixed(2)}KB from: ${mediaUrl}`);
    return cacheEntry;
  }

  /** @deprecated Use downloadMediaWithRetry */
  async downloadImageWithRetry(imageUrl, maxRetries = 3) {
    return this.downloadMediaWithRetry(imageUrl, maxRetries, "image");
  }

  /** @deprecated Use downloadMedia */
  async downloadImage(imageUrl) {
    return this.downloadMedia(imageUrl, "image");
  }

  async processImage(imageBuffer, imageUrl, prefix) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const originalFormat = metadata.format;
      const originalSizeKb = (imageBuffer.length / 1024).toFixed(2);

      if (originalFormat === "gif") {
        this.logger.debug(`🎬 Keeping GIF as-is: ${this.generateFileName(imageUrl, prefix)}`);
        return {
          buffer: imageBuffer,
          fileName: this.generateFileName(imageUrl, prefix),
        };
      }

      this.logger.debug(`🔧 Converting ${originalFormat?.toUpperCase() || "UNKNOWN"} to WebP...`);

      const processedBuffer = await sharp(imageBuffer).webp({ quality: 85 }).toBuffer();

      let fileName = this.generateFileName(imageUrl, prefix);
      fileName = fileName.substring(0, fileName.lastIndexOf(".")) + ".webp";

      const newSizeKb = (processedBuffer.length / 1024).toFixed(2);
      const savings = (
        ((imageBuffer.length - processedBuffer.length) / imageBuffer.length) *
        100
      ).toFixed(1);

      if (processedBuffer.length >= imageBuffer.length) {
        this.logger.debug(
          `WebP conversion skipped: ${originalFormat?.toUpperCase() || "UNKNOWN"} original is smaller (${originalSizeKb}KB <= ${newSizeKb}KB)`,
        );
        return {
          buffer: imageBuffer,
          fileName: this.generateFileName(imageUrl, prefix),
        };
      }

      this.logger.success(
        `✅ Converted to WebP: ${originalFormat?.toUpperCase() || "UNKNOWN"} → ${fileName} (${originalSizeKb}KB → ${newSizeKb}KB, ${savings}% savings)`,
      );

      return {
        buffer: processedBuffer,
        fileName,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to convert image to WebP:`, error.message);
      return {
        buffer: imageBuffer,
        fileName: this.generateFileName(imageUrl, prefix),
      };
    }
  }

  async uploadToStrapiWithRetry(fileBuffer, fileName, altText, maxRetries = 3, mediaKind = "image") {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const uploadedFile = await this.uploadToStrapi(fileBuffer, fileName, altText);
        if (uploadedFile) {
          return uploadedFile;
        }
        throw new Error("Upload returned null");
      } catch (error) {
        lastError = error;

        if (
          error.response?.status === 401 ||
          error.response?.status === 403 ||
          error.response?.status === 400
        ) {
          this.logger.error(`❌ Non-retryable error for ${mediaKind} upload:`, error.message);
          if (error.response?.data) {
            this.logger.error(`Strapi response:`, error.response.data);
          }
          return null;
        }

        if (attempt === maxRetries) {
          break;
        }

        const retryConfig = this.getImageConfig().retry || {};
        const initialDelay = retryConfig.initialRetryDelay || 1000;
        const multiplier = retryConfig.retryMultiplier || 2;
        const maxDelay = retryConfig.maxRetryDelay || 10000;
        const retryDelay = Math.min(initialDelay * Math.pow(multiplier, attempt - 1), maxDelay);

        this.logger.warn(
          `🔄 ${mediaKind} upload failed (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms: ${fileName}`,
          error.message,
        );
        await this.delay(retryDelay);
      }
    }

    this.logger.error(
      `❌ Failed to upload ${mediaKind} after ${maxRetries} attempts: ${fileName}`,
      lastError?.message,
    );
    if (lastError?.response?.data) {
      this.logger.error(`Strapi response:`, lastError.response.data);
    }
    return null;
  }

  async uploadToStrapi(fileBuffer, fileName, altText) {
    const form = new FormData();

    form.append("files", fileBuffer, {
      filename: fileName,
      contentType: this.getContentType(fileName),
    });

    form.append(
      "fileInfo",
      JSON.stringify({
        alternativeText: altText,
        caption: altText,
      }),
    );

    const uploadHeaders = { ...form.getHeaders() };
    const strapiConfig = this.getStrapiConfig();
    if (!strapiConfig.usePublicAccess && strapiConfig.auth?.token) {
      uploadHeaders.Authorization = `Bearer ${strapiConfig.auth.token}`;
    }

    const imageConfig = this.getImageConfig();
    const videoConfig = this.getVideoConfig();
    const isVideo = this.getContentType(fileName).startsWith("video/");
    const uploadTimeout = isVideo
      ? videoConfig.uploadTimeout || 120000
      : imageConfig.uploadTimeout || 60000;

    const response = await axios.post(`${strapiConfig.baseUrl}/upload`, form, {
      headers: uploadHeaders,
      timeout: uploadTimeout,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (response.data && response.data.length > 0) {
      const uploadedFile = response.data[0];
      this.logger.debug(`✅ Uploaded to Strapi: ${uploadedFile.name} (ID: ${uploadedFile.id})`);
      return uploadedFile;
    }

    throw new Error("No file data returned from Strapi");
  }

  generateFileName(mediaUrl, prefix, contentTypeHint = "") {
    const sanitizeSegment = (value, fallback) => {
      const cleaned = (value || "")
        .toString()
        .normalize("NFKD")
        .replace(/[^\w-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^[-_]+|[-_]+$/g, "")
        .toLowerCase()
        .slice(0, 30);
      return cleaned || fallback;
    };

    const extFromMime = () => {
      const mime = contentTypeHint.toLowerCase();
      if (mime.includes("mp4")) return ".mp4";
      if (mime.includes("webm")) return ".webm";
      if (mime.includes("quicktime") || mime.includes("mov")) return ".mov";
      return "";
    };

    try {
      const url = new URL(mediaUrl);
      const originalName = path.basename(url.pathname);
      let ext = (path.extname(originalName) || extFromMime() || ".jpg").toLowerCase();

      const safePrefix = sanitizeSegment(prefix, "blog-media");
      const timestamp = Date.now();
      const rand = Math.random().toString(36).slice(2, 8);

      return `${safePrefix}-${timestamp}-${rand}${ext}`;
    } catch (error) {
      const timestamp = Date.now();
      const safePrefix = sanitizeSegment(prefix, "blog-media");
      const rand = Math.random().toString(36).slice(2, 8);
      const ext = extFromMime() || ".jpg";
      return `${safePrefix}-${timestamp}-${rand}${ext}`;
    }
  }

  getContentType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const contentTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".mov": "video/quicktime",
      ".m4v": "video/mp4",
      ".ogv": "video/ogg",
    };
    return contentTypes[ext] || "application/octet-stream";
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
      this.logger.debug(`📁 Created temp directory: ${this.tempDir}`);
    }
  }

  cleanup() {
    try {
      this.uploadCache.clear();
      this.downloadCache.clear();

      if (fs.existsSync(this.tempDir)) {
        const files = fs.readdirSync(this.tempDir);
        for (const file of files) {
          const filePath = path.join(this.tempDir, file);
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          }
        }
      }

      this.logger.debug("🧹 Media uploader cleanup completed");
    } catch (error) {
      this.logger.error("❌ Error during cleanup:", error.message);
    }
  }

  getStats() {
    return {
      cacheSize: this.uploadCache.size,
      downloadCacheSize: this.downloadCache.size,
    };
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = ImageUploader;
