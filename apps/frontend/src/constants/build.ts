/**
 * Build Version Constants
 *
 * This file exports the build version generated at build time.
 * The version is used for cache invalidation on deployments.
 *
 * The version is set via NEXT_PUBLIC_BUILD_VERSION environment variable,
 * which is injected by next.config.ts from the generated build-version.json file.
 */

// Get build version from environment variable (set by next.config.ts)
// Falls back to 'dev' in development mode
const BUILD_VERSION =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BUILD_VERSION)
    ? process.env.NEXT_PUBLIC_BUILD_VERSION
    : 'dev';

export { BUILD_VERSION };

// Export default for convenience
export default BUILD_VERSION;

