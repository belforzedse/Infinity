#!/usr/bin/env node
/**
 * DEPRECATED: Use the unified interactive importer with --dry-run option
 *
 * Dry-run functionality is now integrated into all importers.
 * Use the interactive importer or CLI with --dry-run flag:
 *   npm run import:interactive  (select "Dry Run: yes")
 *   node scripts/woocommerce-importer/index.js categories --dry-run
 */

const path = require('path');
const { spawn } = require('child_process');

console.log('⚠️  DEPRECATION NOTICE');
console.log('═══════════════════════════════════════════════════════════════');
console.log('dry-run-import.js has been deprecated.');
console.log('Dry-run is now built-in to all importers:');
console.log('  npm run import:interactive  (select "Dry Run: yes")');
console.log('  node scripts/woocommerce-importer/index.js categories --dry-run');
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
