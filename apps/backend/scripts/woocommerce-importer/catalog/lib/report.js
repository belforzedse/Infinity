"use strict";

const fs = require("fs");
const path = require("path");

function emptyCounters() {
  return { created: 0, updated: 0, unchanged: 0, skipped: 0, failed: 0, duplicate: 0, deleted: 0 };
}

/**
 * Import report: per-entity counts (created / updated / unchanged / skipped /
 * failed / duplicate), media upload vs reuse, and total duration. Every failure
 * entry carries the WooCommerce id and stage so problems are diagnosable without
 * grepping logs (a key gap in the legacy importer).
 */
class ImportReport {
  /**
   * @param {object} opts
   * @param {string} opts.command
   * @param {string} opts.environment
   * @param {string} opts.trackingDir
   * @param {{ info: Function, warn: Function, error: Function, success?: Function }} [opts.logger]
   */
  constructor(opts) {
    this.command = opts.command;
    this.environment = opts.environment;
    this.trackingDir = opts.trackingDir;
    this.logger = opts.logger;
    this.startedAt = Date.now();
    this.runAt = new Date().toISOString();

    this.entities = {
      categories: emptyCounters(),
      products: emptyCounters(),
      variations: emptyCounters(),
      stocks: emptyCounters(),
      attributes: emptyCounters(),
      sizeHelpers: emptyCounters(),
    };
    this.media = { uploaded: 0, reused: 0, failed: 0 };
    /** @type {Array<{ entity:string, wcId:any, stage:string, error:string }>} */
    this.failures = [];
  }

  count(entity, stat, n = 1) {
    if (this.entities[entity] && this.entities[entity][stat] !== undefined) {
      this.entities[entity][stat] += n;
    }
  }

  /**
   * Record a failure. Always include the WooCommerce id and the stage.
   * @param {string} entity
   * @param {{ wcId:any, stage:string, error: string|Error }} detail
   */
  fail(entity, detail) {
    this.count(entity, "failed");
    this.failures.push({
      entity,
      wcId: detail.wcId,
      stage: detail.stage,
      error: detail.error instanceof Error ? detail.error.message : String(detail.error),
    });
  }

  mediaUploaded(n = 1) {
    this.media.uploaded += n;
  }
  mediaReused(n = 1) {
    this.media.reused += n;
  }
  mediaFailed(n = 1) {
    this.media.failed += n;
  }

  durationMs() {
    return Date.now() - this.startedAt;
  }

  toJSON() {
    return {
      runAt: this.runAt,
      command: this.command,
      environment: this.environment,
      durationMs: this.durationMs(),
      entities: this.entities,
      media: this.media,
      failures: this.failures,
    };
  }

  printSummary() {
    if (!this.logger) {
      return;
    }
    const seconds = (this.durationMs() / 1000).toFixed(1);
    this.logger.info("=== Catalog Import Summary ===");
    for (const [entity, c] of Object.entries(this.entities)) {
      this.logger.info(
        `${entity.padEnd(11)} created=${c.created} updated=${c.updated} unchanged=${c.unchanged} ` +
          `skipped=${c.skipped} duplicate=${c.duplicate} deleted=${c.deleted} failed=${c.failed}`,
      );
    }
    this.logger.info(
      `media        uploaded=${this.media.uploaded} reused=${this.media.reused} failed=${this.media.failed}`,
    );
    this.logger.info(`duration     ${seconds}s`);

    if (this.failures.length > 0) {
      this.logger.warn(`⚠️ ${this.failures.length} failure(s):`);
      for (const f of this.failures.slice(0, 50)) {
        this.logger.warn(`   [${f.entity} WC:${f.wcId} @${f.stage}] ${f.error}`);
      }
      if (this.failures.length > 50) {
        this.logger.warn(`   …and ${this.failures.length - 50} more (see saved report)`);
      }
    }
  }

  /** Persist the report JSON under <trackingDir>/sync-reports/. Returns the path. */
  save() {
    const dir = path.join(this.trackingDir, "sync-reports");
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${this.command}-${this.runAt.replace(/[:.]/g, "-")}.json`);
    fs.writeFileSync(filePath, JSON.stringify(this.toJSON(), null, 2));
    if (this.logger) {
      this.logger.info(`Report saved: ${filePath}`);
    }
    return filePath;
  }

  hasFailures() {
    return this.failures.length > 0;
  }
}

module.exports = { ImportReport, emptyCounters };
