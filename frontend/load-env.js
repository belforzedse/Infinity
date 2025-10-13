/**
 * Load environment variables from custom env files (dev.env or main.env)
 * This script runs before Next.js starts to inject env vars into process.env
 */

const fs = require('fs');
const path = require('path');

function loadEnvFile(filename) {
  const envPath = path.resolve(__dirname, filename);

  if (!fs.existsSync(envPath)) {
    console.warn(`Warning: ${filename} not found`);
    return;
  }

  console.log(`Loading environment variables from ${filename}`);

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');

  lines.forEach((line) => {
    // Skip empty lines and comments
    line = line.trim();
    if (!line || line.startsWith('#')) return;

    // Parse KEY=VALUE
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Only set if not already defined (allows .env.local to override)
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Determine which env file to load based on NODE_ENV
const isProduction = process.env.NODE_ENV === 'production';
const envFile = isProduction ? 'main.env' : 'dev.env';

// Load the appropriate env file
loadEnvFile(envFile);

// Also load .env.local if it exists (for local overrides)
loadEnvFile('.env.local');

console.log('Environment variables loaded successfully');
console.log(`API URL: ${process.env.NEXT_PUBLIC_API_BASE_URL || 'not set'}`);
