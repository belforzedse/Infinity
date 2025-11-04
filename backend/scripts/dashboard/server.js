#!/usr/bin/env node

/**
 * Live Import Dashboard Server
 *
 * Provides real-time import monitoring via web interface
 * Streams logs and progress updates to connected clients
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const EventEmitter = require('events');
const axios = require('axios');

// Create app
const app = express();
const server = http.createServer(app);
const PORT = process.env.DASHBOARD_PORT || 3001;

// Store for connected clients (SSE connections)
let clients = [];

// Event emitter for import events
class ImportEventBus extends EventEmitter {}
const importEvents = new ImportEventBus();

// Import history storage
const HISTORY_FILE = path.join(__dirname, '../import-tracking/dashboard-history.json');

/**
 * Ensure history file exists
 */
function ensureHistoryFile() {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
  }
}

/**
 * Save import record to history
 */
function saveImportRecord(record) {
  try {
    ensureHistoryFile();
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    history.unshift({
      ...record,
      timestamp: new Date().toISOString()
    });
    // Keep only last 50 imports
    const limited = history.slice(0, 50);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(limited, null, 2));
  } catch (error) {
    console.error('Failed to save import record:', error.message);
  }
}

/**
 * Get import history
 */
function getImportHistory() {
  try {
    ensureHistoryFile();
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch (error) {
    return [];
  }
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Get import history
 */
app.get('/api/history', (req, res) => {
  res.json(getImportHistory());
});

/**
 * SSE endpoint for real-time updates
 */
app.get('/api/events', (req, res) => {
  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  // Store client
  clients.push(res);
  console.log(`✅ Client connected (total: ${clients.length})`);

  // Remove client on disconnect
  req.on('close', () => {
    clients = clients.filter(client => client !== res);
    console.log(`❌ Client disconnected (total: ${clients.length})`);
  });
});

/**
 * Broadcast event to all connected clients
 */
function broadcastEvent(event) {
  const message = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach(client => {
    try {
      client.write(message);
    } catch (error) {
      // Client likely disconnected
    }
  });
}

/**
 * Start import endpoint
 */
app.post('/api/import/start', express.json(), async (req, res) => {
  const { type, options } = req.body;

  if (!type) {
    return res.status(400).json({ error: 'Import type required' });
  }

  try {
    // Notify clients that import is starting
    broadcastEvent({
      type: 'import:start',
      importType: type,
      options: options,
      timestamp: new Date().toISOString()
    });

    res.json({ status: 'import started', type });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stop import endpoint
 */
app.post('/api/import/stop', (req, res) => {
  broadcastEvent({
    type: 'import:stop',
    timestamp: new Date().toISOString()
  });

  res.json({ status: 'import stop requested' });
});

/**
 * Get server info
 */
app.get('/api/info', (req, res) => {
  res.json({
    version: '1.0.0',
    port: PORT,
    connectedClients: clients.length,
    uptime: process.uptime()
  });
});

/**
 * Check API health (Strapi + WooCommerce)
 */
app.get('/api/health/apis', async (req, res) => {
  const config = require('../woocommerce-importer/config');
  const health = {
    dashboard: { status: 'healthy', latency: 0 },
    strapi: { status: 'unknown', latency: 0 },
    woocommerce: { status: 'unknown', latency: 0 },
    timestamp: new Date().toISOString()
  };

  // Check Strapi
  try {
    const start = Date.now();
    await axios.get(`${config.strapi.baseUrl}/api/products?pagination[limit]=1`, {
      timeout: 5000,
      headers: {
        Authorization: `Bearer ${config.strapi.apiToken}`
      }
    });
    health.strapi = {
      status: 'healthy',
      latency: Date.now() - start
    };
  } catch (error) {
    health.strapi = {
      status: 'error',
      latency: 0,
      message: error.message.substring(0, 100)
    };
  }

  // Check WooCommerce
  try {
    const start = Date.now();
    await axios.get(`${config.woocommerce.baseUrl}/wp-json/wc/v3/products?per_page=1`, {
      timeout: 5000,
      auth: {
        username: config.woocommerce.key,
        password: config.woocommerce.secret
      }
    });
    health.woocommerce = {
      status: 'healthy',
      latency: Date.now() - start
    };
  } catch (error) {
    health.woocommerce = {
      status: 'error',
      latency: 0,
      message: error.message.substring(0, 100)
    };
  }

  res.json(health);
});

/**
 * Get dashboard stats
 */
app.get('/api/stats', (req, res) => {
  const history = getImportHistory();
  const stats = {
    totalImports: history.length,
    totalItems: history.reduce((sum, h) => sum + (h.total || 0), 0),
    successfulItems: history.reduce((sum, h) => sum + (h.success || 0), 0),
    failedItems: history.reduce((sum, h) => sum + (h.failed || 0), 0),
    skippedItems: history.reduce((sum, h) => sum + (h.skipped || 0), 0),
    importTypes: [...new Set(history.map(h => h.type))],
    lastImport: history[0]?.timestamp || null
  };
  res.json(stats);
});

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export for use in importer
module.exports = {
  app,
  server,
  PORT,
  importEvents,
  broadcastEvent,
  saveImportRecord,
  getImportHistory
};

// Start server if run directly
if (require.main === module) {
  ensureHistoryFile();

  server.listen(PORT, () => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🚀 Import Dashboard running on http://localhost:${PORT}`);
    console.log(`${'='.repeat(70)}\n`);
  });
}
