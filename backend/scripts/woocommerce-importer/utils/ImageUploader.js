const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminOptipng = require('imagemin-optipng');
const imageminWebp = require('imagemin-webp');
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
   */
  async handleGalleryImages(wcProduct, strapiProductId) {
    try {
      if (!wcProduct.images || wcProduct.images.length <= 1) {
        this.logger.debug(`📸 No gallery images for product: ${wcProduct.name}`);
        return [];
      }

      this.logger.info(`📸 Processing ${wcProduct.images.length - 1} gallery images for: ${wcProduct.name}`);
      
      const uploadedImages = [];
      
      // Skip first image (already used as cover) and process the rest
      for (let i = 1; i < wcProduct.images.length; i++) {
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
        await this.delay(500);
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
   * Process image using industry-standard imagemin library
   * Strategy:
   * - JPEG: Optimize with mozjpeg (lossless, maintains quality)
   * - PNG: Optimize with optipng (lossless, preserves transparency)
   * - WebP: Optimize with imagemin-webp
   * - GIF: Keep as-is (no conversion - too risky)
   */
  async processImage(imageBuffer, imageUrl, prefix) {
    const tempDir = path.join(this.tempDir, `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    const originalFileName = this.generateFileName(imageUrl, prefix);

    try {
      // Create temp directory
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Write buffer to temp file with original extension
      const tempFilePath = path.join(tempDir, originalFileName);
      fs.writeFileSync(tempFilePath, imageBuffer);

      const originalSizeKb = (imageBuffer.length / 1024).toFixed(2);
      let optimizedFilePath = tempFilePath;
      let finalFileName = originalFileName;

      // Determine optimization based on file extension
      const ext = path.extname(originalFileName).toLowerCase();

      if (ext === '.jpg' || ext === '.jpeg') {
        // JPEG: Use mozjpeg for quality optimization
        this.logger.debug(`🔧 Optimizing JPEG with mozjpeg: ${originalFileName}`);
        await imagemin([tempFilePath], {
          destination: tempDir,
          plugins: [
            imageminMozjpeg({
              quality: 85,
              progressive: true
            })
          ]
        });
      } else if (ext === '.png') {
        // PNG: Use optipng for lossless compression (preserves transparency)
        this.logger.debug(`🔧 Optimizing PNG with optipng: ${originalFileName}`);
        await imagemin([tempFilePath], {
          destination: tempDir,
          plugins: [
            imageminOptipng({
              optimizationLevel: 3 // Good balance between compression and speed
            })
          ]
        });
      } else if (ext === '.webp') {
        // WebP: Use imagemin-webp for optimization
        this.logger.debug(`🔧 Optimizing WebP: ${originalFileName}`);
        await imagemin([tempFilePath], {
          destination: tempDir,
          plugins: [
            imageminWebp({
              quality: 85
            })
          ]
        });
      } else if (ext === '.gif') {
        // GIF: Keep as-is (no conversion - animation and format too risky to change)
        this.logger.debug(`🎬 Keeping GIF as-is: ${originalFileName}`);
      } else {
        this.logger.warn(`⚠️ Unsupported image format: ${ext}, keeping original`);
      }

      // Read optimized file
      const processedBuffer = fs.readFileSync(optimizedFilePath);
      const newSizeKb = (processedBuffer.length / 1024).toFixed(2);
      const savings = (((imageBuffer.length - processedBuffer.length) / imageBuffer.length) * 100).toFixed(1);

      // Log results
      const logMessage = `${finalFileName} (${originalSizeKb}KB → ${newSizeKb}KB, ${savings}% savings)`;
      if (ext === '.jpg' || ext === '.jpeg') {
        this.logger.success(`✅ JPEG optimized: ${logMessage}`);
      } else if (ext === '.png') {
        this.logger.debug(`✅ PNG optimized: ${logMessage}`);
      } else if (ext === '.webp') {
        this.logger.debug(`✅ WebP optimized: ${logMessage}`);
      }

      return {
        buffer: processedBuffer,
        fileName: finalFileName
      };
    } catch (error) {
      this.logger.error(`❌ Failed to process image:`, error.message);
      // Fallback to original buffer
      return {
        buffer: imageBuffer,
        fileName: this.generateFileName(imageUrl, prefix)
      };
    } finally {
      // Clean up temp directory
      try {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      } catch (cleanupError) {
        this.logger.warn(`⚠️ Failed to cleanup temp directory: ${cleanupError.message}`);
      }
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
    try {
      const url = new URL(imageUrl);
      const originalName = path.basename(url.pathname);
      const ext = path.extname(originalName) || '.jpg';
      const baseName = path.basename(originalName, ext);

      // Clean the filename
      const cleanBaseName = baseName
        .replace(/[^a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF-_]/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '');

      const timestamp = Date.now();
      return `${prefix}-${cleanBaseName}-${timestamp}${ext}`;
    } catch (error) {
      // Fallback filename
      const timestamp = Date.now();
      return `${prefix}-image-${timestamp}.jpg`;
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