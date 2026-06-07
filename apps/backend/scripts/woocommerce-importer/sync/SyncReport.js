const fs = require("fs");
const path = require("path");

function emptyEntityStats() {
  return {
    created: 0,
    updated: 0,
    unchanged: 0,
    strapiOnly: 0,
    wcOnly: 0,
    failed: 0,
    mismatched: 0,
    matched: 0,
  };
}

class SyncReport {
  /**
   * @param {{ command: string; environment: string; trackingDir: string; logger?: { info: Function; success: Function; error: Function } }} options
   */
  constructor(options) {
    this.command = options.command;
    this.environment = options.environment;
    this.trackingDir = options.trackingDir;
    this.logger = options.logger;
    this.runAt = new Date().toISOString();
    this.summary = {
      categories: emptyEntityStats(),
      products: emptyEntityStats(),
      variations: emptyEntityStats(),
    };
    this.strapiOnly = [];
    this.wcOnly = [];
    this.mismatched = [];
    this.failed = [];
    this.details = {
      created: [],
      updated: [],
      unchanged: [],
    };
  }

  /**
   * @param {'categories'|'products'|'variations'} entityType
   * @param {'created'|'updated'|'unchanged'|'strapiOnly'|'wcOnly'|'failed'|'mismatched'|'matched'} stat
   * @param {Record<string, unknown>} [detail]
   */
  record(entityType, stat, detail = null) {
    if (this.summary[entityType] && this.summary[entityType][stat] !== undefined) {
      this.summary[entityType][stat] += 1;
    }

    if (!detail) {
      return;
    }

    if (stat === "strapiOnly") {
      this.strapiOnly.push({ type: entityType, ...detail });
    } else if (stat === "wcOnly") {
      this.wcOnly.push({ type: entityType, ...detail });
    } else if (stat === "failed") {
      this.failed.push({ type: entityType, ...detail });
    } else if (stat === "mismatched") {
      this.mismatched.push({ type: entityType, ...detail });
    } else if (stat === "created" || stat === "updated" || stat === "unchanged") {
      this.details[stat].push({ type: entityType, ...detail });
    }
  }

  /**
   * Merge importer stats into report summary.
   * @param {'categories'|'products'|'variations'} entityType
   * @param {{ success?: number; updated?: number; skipped?: number; failed?: number }} stats
   */
  mergeImporterStats(entityType, stats) {
    const bucket = this.summary[entityType];
    if (!bucket || !stats) {
      return;
    }

    const created = Math.max(0, (stats.success || 0) - (stats.updated || 0));
    bucket.created += created;
    bucket.updated += stats.updated || 0;
    bucket.unchanged += stats.skipped || 0;
    bucket.failed += stats.failed || 0;
  }

  toJSON() {
    return {
      runAt: this.runAt,
      command: this.command,
      environment: this.environment,
      summary: this.summary,
      strapiOnly: this.strapiOnly,
      wcOnly: this.wcOnly,
      mismatched: this.mismatched,
      failed: this.failed,
    };
  }

  save() {
    const reportsDir = path.join(this.trackingDir, "sync-reports");
    fs.mkdirSync(reportsDir, { recursive: true });
    const filename = `${this.command}-${this.runAt.replace(/[:.]/g, "-")}.json`;
    const filePath = path.join(reportsDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(this.toJSON(), null, 2));

    if (this.logger) {
      this.logger.info(`Sync report saved: ${filePath}`);
    }

    return filePath;
  }

  printSummary() {
    if (!this.logger) {
      return;
    }

    this.logger.info("=== Catalog Sync Summary ===");
    for (const [entity, stats] of Object.entries(this.summary)) {
      this.logger.info(
        `${entity}: created=${stats.created}, updated=${stats.updated}, unchanged=${stats.unchanged}, ` +
          `strapiOnly=${stats.strapiOnly}, wcOnly=${stats.wcOnly}, mismatched=${stats.mismatched}, failed=${stats.failed}`,
      );
    }

    if (this.strapiOnly.length > 0) {
      this.logger.info(`Strapi-only items: ${this.strapiOnly.length}`);
    }
    if (this.wcOnly.length > 0) {
      this.logger.warn(`WC-only items (missing in Strapi): ${this.wcOnly.length}`);
    }
    if (this.mismatched.length > 0) {
      this.logger.warn(`Mismatched items: ${this.mismatched.length}`);
    }
    if (this.failed.length > 0) {
      this.logger.error(`Failed items: ${this.failed.length}`);
    }
  }

  hasBlockingIssues(options = {}) {
    const { allowStrapiOnly = false } = options;
    const totals = Object.values(this.summary).reduce(
      (acc, stats) => {
        acc.wcOnly += stats.wcOnly || 0;
        acc.mismatched += stats.mismatched || 0;
        acc.failed += stats.failed || 0;
        acc.strapiOnly += stats.strapiOnly || 0;
        return acc;
      },
      { wcOnly: 0, mismatched: 0, failed: 0, strapiOnly: 0 },
    );

    if (totals.wcOnly > 0 || totals.mismatched > 0 || totals.failed > 0) {
      return true;
    }

    if (!allowStrapiOnly && totals.strapiOnly > 0) {
      return true;
    }

    return false;
  }
}

module.exports = SyncReport;
