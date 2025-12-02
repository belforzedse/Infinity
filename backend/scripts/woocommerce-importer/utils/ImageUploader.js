const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { promisify } = require('util');
const { pipeline } = require('stream');
const streamPipeline = promisify(pipeline);

/**
 * ImageUploader - Handles downloading and uploading images from WooCommerce to Strapi
 */
class ImageUploader {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.uploadCache = new Map(); // Cache uploaded images to avoid duplicates
    this.downloadCache = new Map(); // Cache downloaded image data
    this.tempDir = path.join(__dirname, '../temp');
    
    // Ensure temp directory exists
    this.ensureTempDir();
  }

  /**
   * Ensure temp directory exists for image processing
   */
  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
      this.logger.debug(`📁 Created temp directory: ${this.tempDir}`);
    }
  }

  /**
   * Download and upload cover image for a product
   */
  async handleCoverImage(wcProduct, strapiProductId) {
    try {
      // Get the first featured image or first image in gallery
      const coverImageData = wcProduct.images && wcProduct.images.length > 0 
        ? wcProduct.images[0]
        : null;

      if (!coverImageData || !coverImageData.src) {
        this.logger.warn(`📸 No cover image found for product: ${wcProduct.name}`);
        return null;
      }

      this.logger.info(`📸 Processing cover image for: ${wcProduct.name}`);
      
      const uploadedImage = await this.downloadAndUploadImage(
        coverImageData.src,
        coverImageData.alt || wcProduct.name,
        `product-${wcProduct.id}-cover`
      );

      if (uploadedImage) {
        this.logger.success(`✅ Cover image uploaded: ${uploadedImage.name}`);
        return uploadedImage.id;
      }

      return null;
    } catch (error) {
      this.logger.error(`❌ Failed to handle cover image for product ${wcProduct.id}:`, error.message);
      return null;
    }
  }

  /**
   * Download and upload all gallery images for a product
   * @param {Object} wcProduct - WooCommerce product
   * @param {number} strapiProductId - Strapi product ID
   * @param {number} maxImages - Maximum number of gallery images to upload (default: unlimited)
   */
  async handleGalleryImages(wcProduct, strapiProductId, maxImages = 999) {
    try {
      if (!wcProduct.images || wcProduct.images.length <= 1) {
        this.logger.debug(`📸 No gallery images for product: ${wcProduct.name}`);
        return [];
      }

      const totalGalleryImages = wcProduct.images.length - 1;
      const imagesToProcess = Math.min(totalGalleryImages, maxImages);

      this.logger.info(`📸 Processing ${imagesToProcess}/${totalGalleryImages} gallery images for: ${wcProduct.name}${maxImages < 999 ? ` (max: ${maxImages})` : ''}`);

      const uploadedImages = [];

      // Skip first image (already used as cover) and process the rest
      for (let i = 1; i < wcProduct.images.length && uploadedImages.length < maxImages; i++) {
        const imageData = wcProduct.images[i];

        if (!imageData.src) continue;

        const uploadedImage = await this.downloadAndUploadImage(
          imageData.src,
          imageData.alt || `${wcProduct.name} - Image ${i}`,
          `product-${wcProduct.id}-gallery-${i}`
        );

        if (uploadedImage) {
          uploadedImages.push(uploadedImage.id);
          this.logger.debug(`✅ Gallery image ${i} uploaded: ${uploadedImage.name}`);
        }

        // Add delay between uploads to avoid rate limiting
        await this.delay(100);
      }

      this.logger.success(`✅ Uploaded ${uploadedImages.length} gallery images`);
      return uploadedImages;
    } catch (error) {
      this.logger.error(`❌ Failed to handle gallery images for product ${wcProduct.id}:`, error.message);
      return [];
    }
  }

  /**
   * Download and upload a single image
   */
  async downloadAndUploadImage(imageUrl, altText, prefix) {
    try {
      // Check cache first
      if (this.uploadCache.has(imageUrl)) {
        this.logger.debug(`📸 Using cached image: ${imageUrl}`);
        return this.uploadCache.get(imageUrl);
      }

      // Download image
      let imageBuffer = await this.downloadImage(imageUrl);
      if (!imageBuffer) return null;

      // Convert WebP to JPG if necessary
      const { buffer: processedBuffer, fileName: processedFileName } = await this.processImage(imageBuffer, imageUrl, prefix);
      
      // Upload to Strapi
      const uploadedImage = await this.uploadToStrapi(processedBuffer, processedFileName, altText);
      
      if (uploadedImage) {
        // Cache the result
        this.uploadCache.set(imageUrl, uploadedImage);
      }

      return uploadedImage;
    } catch (error) {
      this.logger.error(`❌ Failed to process image ${imageUrl}:`, error.message);
      return null;
    }
  }

  /**
   * Download image from URL
   */
  async downloadImage(imageUrl) {
    try {
      // Check download cache first
      if (this.downloadCache.has(imageUrl)) {
        this.logger.debug(`📥 Using cached download: ${imageUrl}`);
        return this.downloadCache.get(imageUrl);
      }

      this.logger.debug(`📥 Downloading image: ${imageUrl}`);

      const response = await axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'WooCommerce-Strapi-Importer/1.0.0'
        }
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }

      const buffer = Buffer.from(response.data);
      
      // Validate image size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (buffer.length > maxSize) {
        throw new Error(`Image too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB > 10MB`);
      }

      // Cache the download
      this.downloadCache.set(imageUrl, buffer);
      
      this.logger.debug(`✅ Downloaded ${(buffer.length / 1024).toFixed(2)}KB from: ${imageUrl}`);
      return buffer;
    } catch (error) {
      this.logger.error(`❌ Failed to download image ${imageUrl}:`, error.message);
      return null;
    }
  }

  /**
   * Process image: Convert all images to WebP format (except GIFs)
   * Strategy:
   * - JPEG, PNG, WebP: Convert to WebP with quality 85
   * - GIFs: Keep as-is (preserves animation)
   * - Result: Most images stored as .webp with optimal compression, GIFs untouched
   */
  async processImage(imageBuffer, imageUrl, prefix) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const originalFormat = metadata.format;
      const originalSizeKb = (imageBuffer.length / 1024).toFixed(2);

      // Keep GIFs as-is (preserve animation)
      if (originalFormat === 'gif') {
        this.logger.debug(`🎬 Keeping GIF as-is: ${this.generateFileName(imageUrl, prefix)}`);
        return {
          buffer: imageBuffer,
          fileName: this.generateFileName(imageUrl, prefix)
        };
      }

      // Convert all other formats to WebP
      this.logger.debug(`🔧 Converting ${originalFormat?.toUpperCase() || 'UNKNOWN'} to WebP...`);

      const processedBuffer = await sharp(imageBuffer)
        .webp({ quality: 85 })
        .toBuffer();

      // Generate filename with .webp extension
      let fileName = this.generateFileName(imageUrl, prefix);
      // Replace original extension with .webp
      fileName = fileName.substring(0, fileName.lastIndexOf('.')) + '.webp';

      const newSizeKb = (processedBuffer.length / 1024).toFixed(2);
      const savings = (((imageBuffer.length - processedBuffer.length) / imageBuffer.length) * 100).toFixed(1);

      this.logger.success(`✅ Converted to WebP: ${originalFormat?.toUpperCase() || 'UNKNOWN'} → ${fileName} (${originalSizeKb}KB → ${newSizeKb}KB, ${savings}% savings)`);

      return {
        buffer: processedBuffer,
        fileName: fileName
      };
    } catch (error) {
      this.logger.error(`❌ Failed to convert image to WebP:`, error.message);
      // Fallback to original
      return {
        buffer: imageBuffer,
        fileName: this.generateFileName(imageUrl, prefix)
      };
    }
  }

  /**
   * Upload image buffer to Strapi media library
   */
  async uploadToStrapi(imageBuffer, fileName, altText) {
    try {
      const form = new FormData();
      
      // Add the image buffer as a stream
      form.append('files', imageBuffer, {
        filename: fileName,
        contentType: this.getContentType(fileName)
      });

      // Add metadata
      const fileInfo = JSON.stringify({
        alternativeText: altText,
        caption: altText
      });
      form.append('fileInfo', fileInfo);

      const response = await axios.post(
        `${this.config.strapi.baseUrl}/upload`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${this.config.strapi.auth.token}`
          },
          timeout: 60000,
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      if (response.data && response.data.length > 0) {
        const uploadedFile = response.data[0];
        this.logger.debug(`✅ Uploaded to Strapi: ${uploadedFile.name} (ID: ${uploadedFile.id})`);
        this.logger.debug(`🔍 DEBUG - Upload response object:`, JSON.stringify(uploadedFile, null, 2));
        return uploadedFile;
      }

      throw new Error('No file data returned from Strapi');
    } catch (error) {
      this.logger.error(`❌ Failed to upload to Strapi:`, error.message);
      
      if (error.response) {
        this.logger.error(`Strapi response:`, error.response.data);
      }
      
      return null;
    }
  }

  /**
   * Generate a clean filename for the image (preserves original extension)
   */
  generateFileName(imageUrl, prefix) {
    const sanitizeSegment = (value, fallback) => {
      const cleaned = (value || "")
        .toString()
        .normalize("NFKD")
        .replace(/[^\w-]+/g, "-") // keep alnum/underscore/hyphen
        .replace(/-+/g, "-")
        .replace(/^[-_]+|[-_]+$/g, "")
        .toLowerCase()
        .slice(0, 30);
      return cleaned || fallback;
    };

    try {
      const url = new URL(imageUrl);
      const originalName = path.basename(url.pathname);
      const ext = (path.extname(originalName) || ".jpg").toLowerCase();

      const safePrefix = sanitizeSegment(prefix, "blog-media");
      const timestamp = Date.now();
      const rand = Math.random().toString(36).slice(2, 8);

      return `${safePrefix}-${timestamp}-${rand}${ext}`;
    } catch (error) {
      const timestamp = Date.now();
      const safePrefix = sanitizeSegment(prefix, "blog-media");
      const rand = Math.random().toString(36).slice(2, 8);
      return `${safePrefix}-${timestamp}-${rand}.jpg`;
    }
  }

  /**
   * Get content type based on file extension
   */
  getContentType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };
    return contentTypes[ext] || 'image/jpeg';
  }

  /**
   * Clean up temp files and caches
   */
  cleanup() {
    try {
      // Clear caches
      this.uploadCache.clear();
      this.downloadCache.clear();
      
      // Clean temp directory (if exists)
      if (fs.existsSync(this.tempDir)) {
        const files = fs.readdirSync(this.tempDir);
        for (const file of files) {
          const filePath = path.join(this.tempDir, file);
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          }
        }
      }
      
      this.logger.debug('🧹 Image uploader cleanup completed');
    } catch (error) {
      this.logger.error('❌ Error during cleanup:', error.message);
    }
  }

  /**
   * Get upload statistics
   */
  getStats() {
    return {
      cacheSize: this.uploadCache.size,
      downloadCacheSize: this.downloadCache.size
    };
  }

  /**
   * Utility delay function
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ImageUploader; 
