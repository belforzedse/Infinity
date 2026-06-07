const fs = require("fs");
const path = require("path");

/**
 * Duplicate prevention system for WooCommerce imports
 *
 * Tracks mappings between WooCommerce IDs and Strapi IDs to prevent
 * importing the same item multiple times.
 */
class DuplicateTracker {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.storageDir = config.duplicateTracking.storageDir;
    this.mappingFiles = config.duplicateTracking.mappingFiles;
    this.mappingTypes = Object.keys(this.mappingFiles);

    // In-memory cache of mappings
    this.mappings = this.mappingTypes.reduce((acc, type) => {
      acc[type] = new Map();
      return acc;
    }, {});

    this.flushDelayMs = config.duplicateTracking?.flushDelayMs ?? 500;
    this.pendingFlushTypes = new Set();
    this.flushTimer = null;
    this.writeQueues = {};

    this.init();
  }

  /**
   * Initialize the duplicate tracker
   */
  init() {
    // Create storage directory if it doesn't exist
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
      this.logger.info(`📁 Created duplicate tracking directory: ${this.storageDir}`);
    }

    // Load existing mappings from files
    this.loadMappings();
  }

  /**
   * Load existing mappings from JSON files
   */
  loadMappings() {
    for (const [type, filename] of Object.entries(this.mappingFiles)) {
      const filePath = path.join(this.storageDir, filename);

      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
          this.mappings[type] = new Map(Object.entries(data));
          this.logger.info(
            `📥 Loaded ${this.mappings[type].size} ${type} mappings from ${filename}`,
          );
        } catch (error) {
          this.logger.error(`❌ Failed to load ${type} mappings:`, error.message);
          this.mappings[type] = new Map();
        }
      } else {
        this.logger.debug(`📄 No existing ${type} mappings found, starting fresh`);
      }
    }
  }

  /**
   * Ensure we have an in-memory map for the requested type.
   */
  ensureMapping(type) {
    if (!this.mappings[type]) {
      this.mappings[type] = new Map();
    }
    return this.mappings[type];
  }

  /**
   * Serialize writes per mapping type to avoid concurrent file access on Windows.
   */
  enqueueWrite(type, writeFn) {
    const previous = this.writeQueues[type] || Promise.resolve();
    const next = previous.then(writeFn).catch((error) => {
      this.logger.error(`❌ Failed to save ${type} mappings:`, error.message);
    });
    this.writeQueues[type] = next;
    return next;
  }

  /**
   * Write mapping file atomically via temp file + rename.
   */
  writeMappingFile(type) {
    return this.enqueueWrite(type, async () => {
      this.ensureMapping(type);
      const filename = this.mappingFiles[type];
      const filePath = path.join(this.storageDir, filename);
      const tempPath = `${filePath}.tmp`;

      const data = Object.fromEntries(this.mappings[type]);
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
      fs.renameSync(tempPath, filePath);
      this.logger.debug(
        `💾 Saved ${this.mappings[type].size} ${type} mappings to ${filename}`,
      );
    });
  }

  /**
   * Save mappings to JSON files immediately.
   */
  saveMappings(type = null) {
    const typesToSave = type ? [type] : Object.keys(this.mappingFiles);

    for (const saveType of typesToSave) {
      this.writeMappingFile(saveType);
    }
  }

  /**
   * Schedule a debounced flush for a mapping type.
   */
  scheduleFlush(type) {
    this.pendingFlushTypes.add(type);

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    this.flushTimer = setTimeout(() => {
      this.flushMappings();
    }, this.flushDelayMs);
  }

  /**
   * Flush all pending mapping writes immediately.
   */
  flushMappings(type = null) {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const typesToFlush = type
      ? [type]
      : this.pendingFlushTypes.size > 0
        ? Array.from(this.pendingFlushTypes)
        : Object.keys(this.mappingFiles);

    this.pendingFlushTypes.clear();

    for (const flushType of typesToFlush) {
      this.writeMappingFile(flushType);
    }
  }

  /**
   * Check if a WooCommerce item has already been imported
   */
  isImported(type, wooCommerceId) {
    return this.ensureMapping(type).has(wooCommerceId.toString());
  }

  /**
   * Get the Strapi ID for a WooCommerce ID
   */
  getStrapiId(type, wooCommerceId) {
    return this.ensureMapping(type).get(wooCommerceId.toString());
  }

  /**
   * Record a mapping between WooCommerce ID and Strapi ID
   */
  recordMapping(type, wooCommerceId, strapiId, additionalData = {}, options = {}) {
    const { immediate = false } = options;
    const mapping = {
      strapiId: strapiId,
      importedAt: new Date().toISOString(),
      ...additionalData,
    };

    this.ensureMapping(type).set(wooCommerceId.toString(), mapping);
    this.logger.debug(`🔗 Recorded ${type} mapping: WC:${wooCommerceId} → Strapi:${strapiId}`);

    if (immediate) {
      this.flushMappings(type);
    } else {
      this.scheduleFlush(type);
    }
  }

  /**
   * Get mapping statistics
   */
  getStats() {
    const stats = {};
    for (const [type, mapping] of Object.entries(this.mappings)) {
      const map = this.ensureMapping(type);
      stats[type] = {
        total: map.size,
        oldest: null,
        newest: null,
      };

      if (map.size > 0) {
        const importDates = Array.from(map.values())
          .map((item) => new Date(item.importedAt))
          .filter((date) => !isNaN(date));

        if (importDates.length > 0) {
          stats[type].oldest = new Date(Math.min(...importDates)).toISOString();
          stats[type].newest = new Date(Math.max(...importDates)).toISOString();
        }
      }
    }
    return stats;
  }

  /**
   * Check for duplicate prevention before import
   */
  checkDuplicate(type, wooCommerceItem) {
    const wooId = wooCommerceItem.id;

    if (this.isImported(type, wooId)) {
      const mapping = this.getStrapiId(type, wooId);
      this.logger.debug(`⏭️ Skipping ${type} ${wooId} (already imported as ${mapping.strapiId})`);
      return {
        isDuplicate: true,
        strapiId: mapping.strapiId,
        importedAt: mapping.importedAt,
      };
    }

    return {
      isDuplicate: false,
    };
  }

  /**
   * Get all mappings for a specific type
   */
  getAllMappings(type) {
    return Object.fromEntries(this.ensureMapping(type));
  }

  /**
   * Remove a mapping (useful for reimporting specific items)
   */
  removeMapping(type, wooCommerceId) {
    const removed = this.ensureMapping(type).delete(wooCommerceId.toString());
    if (removed) {
      this.flushMappings(type);
      this.logger.info(`🗑️ Removed ${type} mapping for WC ID: ${wooCommerceId}`);
    }
    return removed;
  }

  /**
   * Clear all mappings for a type (useful for full reimport)
   */
  clearMappings(type) {
    const mapping = this.ensureMapping(type);
    const count = mapping.size;
    mapping.clear();
    this.flushMappings(type);
    this.logger.warn(`🧹 Cleared ${count} ${type} mappings`);
  }

  /**
   * Export mappings to a backup file
   */
  exportMappings(backupPath) {
    const allMappings = {};
    for (const [type, mapping] of Object.entries(this.mappings)) {
      allMappings[type] = Object.fromEntries(mapping);
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      mappings: allMappings,
    };

    fs.writeFileSync(backupPath, JSON.stringify(exportData, null, 2));
    this.logger.info(`📤 Exported all mappings to ${backupPath}`);
  }

  /**
   * Import mappings from a backup file
   */
  importMappings(backupPath) {
    try {
      const importData = JSON.parse(fs.readFileSync(backupPath, "utf8"));

      for (const [type, mappingData] of Object.entries(importData.mappings)) {
        if (this.mappings[type]) {
          this.mappings[type] = new Map(Object.entries(mappingData));
          this.flushMappings(type);
        }
      }

      this.logger.info(`📥 Imported mappings from ${backupPath}`);
    } catch (error) {
      this.logger.error(`❌ Failed to import mappings:`, error.message);
    }
  }
}

module.exports = DuplicateTracker;
