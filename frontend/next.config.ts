/**
 * Load build version from generated JSON file
 * This version is used for cache invalidation and is injected as NEXT_PUBLIC_BUILD_VERSION
 */
let BUILD_VERSION = 'dev';

try {
  const fs = require('fs');
  const path = require('path');
  const buildVersionPath = path.join(__dirname, 'src/constants/build-version.json');
  
  if (fs.existsSync(buildVersionPath)) {
    const buildVersionData = JSON.parse(fs.readFileSync(buildVersionPath, 'utf-8'));
    BUILD_VERSION = buildVersionData.BUILD_VERSION || BUILD_VERSION;
  }
} catch (error) {
  // Fallback to 'dev' if file doesn't exist or can't be read
  if (process.env.NODE_ENV === 'production') {
    console.warn('[Next Config] Warning: Could not load build version, using fallback');
  }
}

// Inject build version as environment variable for client-side access
process.env.NEXT_PUBLIC_BUILD_VERSION = BUILD_VERSION;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  images: {
    unoptimized: false,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Allow images from any host (http/https)
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  experimental: {
    optimizePackageImports: ["@heroicons/react", "lucide-react", "react-icons", "framer-motion"],
    scrollRestoration: true,
    optimizeCss: true,
  },
  serverExternalPackages: ["jsdom"],
  compress: true,
};
module.exports = nextConfig;
