import type { NextConfig } from "next";

const imageBaseUrl =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? "https://api.infinity.rgbgroup.ir";
const imageHost = new URL(imageBaseUrl);

const nextConfig: NextConfig = {
  output: "standalone",
  // Match the working frontend behavior to avoid double effects during dev
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: imageHost.protocol.replace(":", ""),
        hostname: imageHost.hostname,
        pathname: "/**",
      },
    ],
  },
  eslint: {
    // Do not fail builds on lint issues; surface them in dev/CI instead
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Do not fail production builds on type errors during iterative dev
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
