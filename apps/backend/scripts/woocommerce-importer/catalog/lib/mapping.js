"use strict";

const fs = require("fs");
const path = require("path");

/**
 * Persistent WooCommerce-id → Strapi-id store.
 *
 * This is a cache / repair aid, NOT the source of truth — idempotency ultimately
 * relies on the unique `external_id` field in Strapi (see StrapiRepo). Writes are
 * atomic (temp file + rename) so a crash mid-write can't corrupt the file, which
 * was a real risk in the legacy progress-state files.
 */
class MappingStore {
  /**
   * @param {string} dir directory to store mapping files in
   * @param {object} [opts]
   * @param {string} [opts.fileName="catalog-mappings.json"]
   * @param {{ info: Function, error: Function }} [opts.logger]
   */
  constructor(dir, opts = {}) {
    this.dir = dir;
    this.fileName = opts.fileName || "catalog-mappings.json";
    this.filePath = path.join(dir, this.fileName);
    this.logger = opts.logger || { info() {}, error() {} };
    /** @type {Record<string, Record<string, { strapiId:number, [k:string]:any }>>} */
    this.data = {};
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        this.data = JSON.parse(fs.readFileSync(this.filePath, "utf8")) || {};
      }
    } catch (error) {
      this.logger.error(`Failed to load mappings (${this.fileName}): ${error.message}`);
      this.data = {};
    }
  }

  _bucket(type) {
    if (!this.data[type]) {
      this.data[type] = {};
    }
    return this.data[type];
  }

  get(type, wcId) {
    return this._bucket(type)[wcId.toString()] || null;
  }

  getStrapiId(type, wcId) {
    return this.get(type, wcId)?.strapiId ?? null;
  }

  has(type, wcId) {
    return Object.prototype.hasOwnProperty.call(this._bucket(type), wcId.toString());
  }

  set(type, wcId, strapiId, meta = {}) {
    this._bucket(type)[wcId.toString()] = {
      strapiId,
      updatedAt: new Date().toISOString(),
      ...meta,
    };
  }

  all(type) {
    return this._bucket(type);
  }

  size(type) {
    return Object.keys(this._bucket(type)).length;
  }

  /** Atomically persist to disk (temp file + rename). */
  flush() {
    try {
      if (!fs.existsSync(this.dir)) {
        fs.mkdirSync(this.dir, { recursive: true });
      }
      const tmp = `${this.filePath}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
      fs.renameSync(tmp, this.filePath);
    } catch (error) {
      this.logger.error(`Failed to flush mappings (${this.fileName}): ${error.message}`);
    }
  }
}

module.exports = MappingStore;
