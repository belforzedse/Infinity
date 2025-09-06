import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  images: {
    loader: "custom",
    loaderFile: "./src/utils/imageLoader.ts",
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
