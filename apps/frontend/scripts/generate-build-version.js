/**
 * Generate Build Version Script
 *
 * Generates a unique build version based on git commit hash and timestamp.
 * This version is used for cache invalidation on deployments.
 *
 * Format: ${commitHash}-${timestamp}
 * Example: abc123def-1704067200000
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.resolve(__dirname, '../src/constants');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'build-version.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function getGitCommitHash() {
  // First, try to use CI environment variable (GitHub Actions, GitLab CI, etc.)
  if (process.env.GITHUB_SHA) {
    // GitHub Actions provides full SHA, use short version
    return process.env.GITHUB_SHA.substring(0, 7);
  }

  if (process.env.CI_COMMIT_SHA) {
    // GitLab CI provides full SHA, use short version
    return process.env.CI_COMMIT_SHA.substring(0, 7);
  }

  // Try to get from git directly
  try {
    const hash = execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      cwd: path.resolve(__dirname, '..'),
    }).trim();

    if (hash && hash.length > 0) {
      return hash;
    }
  } catch (error) {
    // Git not available or not in a git repo
    console.warn('[Build Version] Warning: Could not get git commit hash:', error.message);
  }

  return null;
}

function getTimestamp() {
  return Date.now().toString();
}

function generateBuildVersion() {
  const commitHash = getGitCommitHash();
  const timestamp = getTimestamp();

  // Generate version string
  let buildVersion;
  if (commitHash) {
    buildVersion = `${commitHash}-${timestamp}`;
  } else {
    // Fallback: use timestamp only if git is not available
    buildVersion = `build-${timestamp}`;
    console.warn("[Build Version] Warning: Using timestamp-only version (git not available)");
  }

  // Create version object
  const versionData = {
    BUILD_VERSION: buildVersion,
    timestamp: parseInt(timestamp, 10),
    commitHash: commitHash || null,
    generatedAt: new Date().toISOString(),
  };

  // Write to JSON file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(versionData, null, 2) + "\n", "utf-8");

  console.log(`[Build Version] Generated: ${buildVersion}`);
  console.log(`[Build Version] Written to: ${OUTPUT_FILE}`);

  // Also inject BUILD_VERSION into service worker
  injectBuildVersionIntoServiceWorker(buildVersion);

  return buildVersion;
}

function injectBuildVersionIntoServiceWorker(buildVersion) {
  const swPath = path.resolve(__dirname, "../public/sw.js");

  if (!fs.existsSync(swPath)) {
    console.warn("[Build Version] Warning: sw.js not found, skipping injection");
    return;
  }

  try {
    let swContent = fs.readFileSync(swPath, "utf-8");

    // Replace the BUILD_VERSION fallback with the actual build version
    // Match: let BUILD_VERSION = "v1-dev"; // Fallback version
    const versionPattern = /let BUILD_VERSION = ["'][^"']+["']; \/\/ Fallback version/;
    const replacement = `let BUILD_VERSION = "${buildVersion}"; // Injected at build time`;

    if (versionPattern.test(swContent)) {
      swContent = swContent.replace(versionPattern, replacement);
      fs.writeFileSync(swPath, swContent, "utf-8");
      console.log(`[Build Version] Injected into sw.js: ${buildVersion}`);
    } else {
      console.warn("[Build Version] Warning: Could not find BUILD_VERSION placeholder in sw.js");
    }
  } catch (error) {
    console.warn("[Build Version] Warning: Could not inject version into sw.js:", error.message);
  }
}

// Generate version if run directly
if (require.main === module) {
  try {
    generateBuildVersion();
    process.exit(0);
  } catch (error) {
    console.error('[Build Version] Error generating version:', error);
    process.exit(1);
  }
}

module.exports = { generateBuildVersion };

