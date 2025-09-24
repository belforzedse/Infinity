/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tighten React runtime checks
  reactStrictMode: true,

  // Skip ESLint during production builds to avoid failing on warnings
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Remove console.* calls in production for both client and server bundles
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  images: {
    // Enable Next Image Optimization
    unoptimized: false,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Allow images from any host (http/https)
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },

  // Optimize bundle size
  experimental: {
    optimizePackageImports: ["@heroicons/react", "lucide-react", "react-icons", "framer-motion"],
    scrollRestoration: true,
    optimizeCss: true,
  },

  // Enable compression
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // Bundle analyzer (uncomment for analysis)
  // bundleAnalyzer: {
  //   enabled: process.env.ANALYZE === 'true',
  // },
};

module.exports = nextConfig;
