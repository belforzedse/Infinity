#!/usr/bin/env node
/**
 * DEPRECATED: Use the unified interactive importer instead
 *
 * This script is kept for backward compatibility.
 * Use the new interactive importer which supports all entity types:
 *   npm run import:interactive
 *   node scripts/woocommerce-importer/interactive.js
 */

const path = require('path');
const { spawn } = require('child_process');

console.log('⚠️  DEPRECATION NOTICE');
console.log('═══════════════════════════════════════════════════════════════');
console.log('import-products.js has been deprecated.');
console.log('Use the unified interactive importer instead:');
console.log('  npm run import:interactive');
console.log('  node scripts/woocommerce-importer/index.js products [options]');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('Forwarding to interactive importer...\n');

// Forward to the new interactive importer
const interactiveScript = path.join(__dirname, 'woocommerce-importer', 'interactive.js');
const child = spawn('node', [interactiveScript], {
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  process.exit(code);
});
