#!/usr/bin/env node
/**
 * DEPRECATED: Use scripts/woocommerce-importer/interactive.js instead
 *
 * This script is kept for backward compatibility only.
 * All functionality has been moved to the woocommerce-importer directory.
 *
 * It now forwards all requests to the new enhanced interactive importer.
 */

const path = require('path');
const { spawn } = require('child_process');

console.log('⚠️  DEPRECATION NOTICE');
console.log('═══════════════════════════════════════════════════════════════');
console.log('The old interactive-importer.js is deprecated.');
console.log('Use the new enhanced version:');
console.log('  npm run import:interactive');
console.log('  node scripts/woocommerce-importer/interactive.js');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('Forwarding to new interactive importer...\n');

// Forward to the new interactive importer in woocommerce-importer
const interactiveScript = path.join(__dirname, 'woocommerce-importer', 'interactive.js');
const child = spawn('node', [interactiveScript], {
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  process.exit(code);
});
