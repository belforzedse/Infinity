import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

// Build image remote patterns from env and known backends
const remotePatterns: RemotePattern[] = [];

try {
  const base = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
  if (base) {
    const u = new URL(base);
    remotePatterns.push({
      protocol: (u.protocol.replace(":", "") as "http" | "https") ?? "https",
      hostname: u.hostname,
      port: u.port || undefined,
      pathname: "/**",
    });
  }
} catch {}

// Add common defaults used in this project
remotePatterns.push(
  { protocol: "https", hostname: "api.infinity.rgbgroup.ir", pathname: "/**" },
  { protocol: "http", hostname: "api.infinity.rgbgroup.ir", pathname: "/**" },
  { protocol: "http", hostname: "localhost", pathname: "/**" },
  { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
  { protocol: "http", hostname: "192.168.33.183", pathname: "/**" },
);

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns,
  },
};

export default nextConfig;
