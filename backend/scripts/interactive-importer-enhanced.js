#!/usr/bin/env node
/**
 * DEPRECATED: This was the enhanced interactive importer.
 *
 * All features have been merged into:
 * scripts/woocommerce-importer/interactive.js
 *
 * Use the new unified version instead:
 *   npm run import:interactive
 *   node scripts/woocommerce-importer/interactive.js
 */

const path = require('path');
const { spawn } = require('child_process');

console.log('⚠️  DEPRECATION NOTICE');
console.log('═══════════════════════════════════════════════════════════════');
console.log('interactive-importer-enhanced.js has been deprecated.');
console.log('All features are now in the unified enhanced interactive importer:');
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
