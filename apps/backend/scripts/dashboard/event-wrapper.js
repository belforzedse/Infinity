/**
 * Event Wrapper for Importer
 *
 * Wraps importer classes to emit real-time events to the dashboard
 */

const { broadcastEvent } = require('./server');

class DashboardLogger {
  constructor(originalLogger) {
    this.originalLogger = originalLogger;
  }

  log(message) {
    this.originalLogger.log(message);
    broadcastEvent({
      type: 'log',
      message: message,
      level: 'info',
      timestamp: new Date().toISOString()
    });
  }

  info(message) {
    this.originalLogger.info(message);
    broadcastEvent({
      type: 'log',
      message: message,
      level: 'info',
      timestamp: new Date().toISOString()
    });
  }

  success(message) {
    this.originalLogger.success(message);
    broadcastEvent({
      type: 'log',
      message: message,
      level: 'success',
      timestamp: new Date().toISOString()
    });
  }

  warn(message) {
    this.originalLogger.warn(message);
    broadcastEvent({
      type: 'log',
      message: message,
      level: 'warning',
      timestamp: new Date().toISOString()
    });
  }

  error(message, data) {
    this.originalLogger.error(message, data);
    broadcastEvent({
      type: 'log',
      message: message,
      level: 'error',
      timestamp: new Date().toISOString()
    });
  }

  debug(message) {
    this.originalLogger.debug(message);
    broadcastEvent({
      type: 'log',
      message: message,
      level: 'debug',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Wrapper for import operations to track progress
 */
class ImportTracker {
  constructor(importer) {
    this.importer = importer;
    this.startTime = null;
  }

  /**
   * Wrap import method to emit progress events
   */
  wrapImport(importFn) {
    return async (options = {}) => {
      this.startTime = Date.now();

      broadcastEvent({
        type: 'import:start',
        timestamp: new Date().toISOString()
      });

      try {
        // Patch the importer stats object to emit progress
        const originalStats = { ...this.importer.stats };

        // Create a proxy for stats to detect changes
        const statsProxy = new Proxy(this.importer.stats, {
          set: (target, property, value) => {
            target[property] = value;
            this.emitProgress();
            return true;
          }
        });

        // Replace stats
        const oldStats = this.importer.stats;
        this.importer.stats = statsProxy;

        // Run import
        const result = await importFn.call(this.importer, options);

        // Restore stats
        this.importer.stats = oldStats;

        const duration = Math.round((Date.now() - this.startTime) / 1000);

        broadcastEvent({
          type: 'complete',
          stats: result,
          duration: `${duration}s`,
          timestamp: new Date().toISOString()
        });

        return result;
      } catch (error) {
        broadcastEvent({
          type: 'error',
          message: error.message,
          timestamp: new Date().toISOString()
        });

        throw error;
      }
    };
  }

  /**
   * Emit progress update
   */
  emitProgress() {
    const stats = this.importer.stats;
    const processing = this.getCurrentItem();

    broadcastEvent({
      type: 'progress',
      stats: {
        total: stats.total || 0,
        success: stats.success || 0,
        failed: stats.failed || 0,
        skipped: stats.skipped || 0
      },
      processing: processing,
      current: stats.total || 0,
      total: 100,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get current item being processed (can be overridden per importer)
   */
  getCurrentItem() {
    return 'Processing...';
  }
}

module.exports = {
  DashboardLogger,
  ImportTracker
};
