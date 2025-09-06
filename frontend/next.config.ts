import type { NextConfig } from "next";

const imageBaseUrl =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? "https://api.infinity.rgbgroup.ir";
const imageHost = new URL(imageBaseUrl);

const protocol: "http" | "https" = imageHost.protocol === "https:" ? "https" : "http";

const nextConfig: NextConfig = {
  output: "standalone",
  // Match the working frontend behavior to avoid double effects during dev
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol,
        hostname: imageHost.hostname,
        pathname: "/**",
      },
    ],
  },
  typescript: {
    // Do not fail production builds on type errors during iterative dev
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
