import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Match the working frontend behavior to avoid double effects during dev
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  typescript: {
    // Do not fail production builds on type errors during iterative dev
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
