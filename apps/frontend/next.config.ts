import { withSentryConfig } from "@sentry/nextjs";
import path from "path";

/**
 * Load build version from generated JSON file
 * This version is used for cache invalidation and is injected as NEXT_PUBLIC_BUILD_VERSION
 */
let BUILD_VERSION = "dev";

try {
  const fs = require("fs");
  const buildVersionPath = path.join(__dirname, "src/constants/build-version.json");

  if (fs.existsSync(buildVersionPath)) {
    const buildVersionData = JSON.parse(fs.readFileSync(buildVersionPath, "utf-8"));
    BUILD_VERSION = buildVersionData.BUILD_VERSION || BUILD_VERSION;
  }
} catch (error) {
  // Fallback to 'dev' if file doesn't exist or can't be read
  if (process.env.NODE_ENV === "production") {
    console.warn("[Next Config] Warning: Could not load build version, using fallback");
  }
}

// Inject build version as environment variable for client-side access
process.env.NEXT_PUBLIC_BUILD_VERSION = BUILD_VERSION;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  transpilePackages: ["@repo/api", "@repo/brand", "@repo/fonts", "@repo/social-posts", "@repo/story-rail"],
  reactStrictMode: true,
  // Allow sitemap and other static generation to run longer during build (default 60s)
  staticPageGenerationTimeout: 180,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  images: {
    unoptimized: false,
    // Allow local backend image URLs (localhost/127.0.0.1) during local development.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [50, 60, 70, 75, 90, 95, 100],
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
  // Disabled: Nginx already compresses responses; double compression wastes CPU on all instances.
  compress: false,
  // Custom cache handler: Redis + LRU fallback (cache-handler.mjs). Shared cache across instances for production load.
  cacheHandler:
    process.env.NODE_ENV === "production"
      ? require.resolve("./cache-handler.mjs")
      : undefined,
  cacheMaxMemorySize: 256 * 1024 * 1024, // 256MB in-memory cache per instance
};
module.exports = withSentryConfig(nextConfig, {
  silent: !process.env.CI,
});
