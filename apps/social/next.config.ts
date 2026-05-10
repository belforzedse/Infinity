import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../.."),
  transpilePackages: ["@repo/api"],
};

export default nextConfig;
