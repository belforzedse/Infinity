const fs = require('fs');
const path = require('path');

/**
 * Logger utility for WooCommerce importer with progress tracking
 */
class Logger {
  constructor(config = {}) {
    this.level = config.level || 'info';
    this.saveToFile = config.saveToFile || false;
    this.logDir = config.logDir || './logs';
    this.progressInterval = config.progressInterval || 10;
    
    // Progress tracking
    this.progress = {
      total: 0,
      current: 0,
      startTime: null,
      lastUpdate: null
    };

    // Log levels
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    // Colors for console output
    this.colors = {
      error: '\x1b[31m',   // Red
      warn: '\x1b[33m',    // Yellow
      info: '\x1b[36m',    // Cyan
      debug: '\x1b[90m',   // Gray
      success: '\x1b[32m', // Green
      reset: '\x1b[0m'     // Reset
    };

    this.init();
  }

  init() {
    // Create log directory if it doesn't exist
    if (this.saveToFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Generate log filename with timestamp
    if (this.saveToFile) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.logFile = path.join(this.logDir, `import-${timestamp}.log`);
    }
  }

  /**
   * Initialize progress tracking
   */
  startProgress(total, description = 'Processing') {
    this.progress = {
      total,
      current: 0,
      startTime: Date.now(),
      lastUpdate: Date.now(),
      description
    };
    
    this.info(`📊 Starting ${description}: 0/${total} items`);
  }

  /**
   * Update progress
   */
  updateProgress(increment = 1) {
    this.progress.current += increment;
    
    // Only log at intervals to avoid spam
    if (this.progress.current % this.progressInterval === 0 || 
        this.progress.current === this.progress.total) {
      
      const elapsed = Date.now() - this.progress.startTime;
      const elapsedSeconds = elapsed / 1000;
      const rate = this.progress.current / elapsedSeconds;
      const eta = this.progress.total > this.progress.current ? 
        (this.progress.total - this.progress.current) / rate : 0;
      
      const percentage = ((this.progress.current / this.progress.total) * 100).toFixed(1);
      
      this.info(
        `📈 ${this.progress.description}: ${this.progress.current}/${this.progress.total} ` +
        `(${percentage}%) - Rate: ${rate.toFixed(1)} items/sec - ETA: ${eta.toFixed(0)}s`
      );
    }
  }

  /**
   * Complete progress tracking
   */
  completeProgress() {
    if (this.progress.startTime) {
      const elapsed = Date.now() - this.progress.startTime;
      const elapsedSeconds = elapsed / 1000;
      const rate = this.progress.current / elapsedSeconds;
      
      this.success(
        `✅ ${this.progress.description} completed: ${this.progress.current} items ` +
        `in ${elapsedSeconds.toFixed(1)}s (${rate.toFixed(1)} items/sec)`
      );
    }
  }

  /**
   * Log a message with specified level
   */
  log(level, message, ...args) {
    if (this.levels[level] > this.levels[this.level]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const color = this.colors[level] || this.colors.info;
    const levelUpper = level.toUpperCase().padEnd(5);
    
    // Format message
    let formattedMessage = typeof message === 'string' ? message : JSON.stringify(message);
    if (args.length > 0) {
      formattedMessage += ' ' + args.map(arg => 
        typeof arg === 'string' ? arg : JSON.stringify(arg)
      ).join(' ');
    }

    // Console output with colors
    console.log(`${color}[${timestamp}] ${levelUpper}${this.colors.reset} ${formattedMessage}`);

    // File output (without colors)
    if (this.saveToFile) {
      const logLine = `[${timestamp}] ${levelUpper} ${formattedMessage}\n`;
      fs.appendFileSync(this.logFile, logLine);
    }
  }

  /**
   * Log error message
   */
  error(message, ...args) {
    this.log('error', message, ...args);
  }

  /**
   * Log warning message
   */
  warn(message, ...args) {
    this.log('warn', message, ...args);
  }

  /**
   * Log info message
   */
  info(message, ...args) {
    this.log('info', message, ...args);
  }

  /**
   * Log debug message
   */
  debug(message, ...args) {
    this.log('debug', message, ...args);
  }

  /**
   * Log success message (special info with green color)
   */
  success(message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message);
    const fullMessage = args.length > 0 ? 
      formattedMessage + ' ' + args.join(' ') : formattedMessage;

    // Console output with green color
    console.log(`${this.colors.success}[${timestamp}] SUCCESS${this.colors.reset} ${fullMessage}`);

    // File output
    if (this.saveToFile) {
      const logLine = `[${timestamp}] SUCCESS ${fullMessage}\n`;
      fs.appendFileSync(this.logFile, logLine);
    }
  }

  /**
   * Log import statistics
   */
  logStats(stats) {
    this.info('📊 Import Statistics:');
    this.info(`   Total processed: ${stats.total || 0}`);
    this.info(`   Successfully imported: ${stats.success || 0}`);
    this.info(`   Skipped (duplicates): ${stats.skipped || 0}`);
    this.info(`   Failed: ${stats.failed || 0}`);
    this.info(`   Errors: ${stats.errors || 0}`);
    
    if (stats.duration) {
      this.info(`   Duration: ${stats.duration}ms`);
      this.info(`   Rate: ${((stats.total || 0) / (stats.duration / 1000)).toFixed(2)} items/sec`);
    }
  }

  /**
   * Get log file path
   */
  getLogFile() {
    return this.logFile;
  }
}

module.exports = Logger; 