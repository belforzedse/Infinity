import type { NextConfig } from "next";

const imageBaseUrl =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? "https://api.infinity.rgbgroup.ir";
const imageHost = new URL(imageBaseUrl);

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: imageHost.hostname,
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "uploads", // Add this to handle malformed URLs
        pathname: "/**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
