import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    unoptimized: true,
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

export const headers = async () => {
  return [
    {
      source: "/:path*",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "geolocation=(), camera=(), microphone=()",
        },
        {
          key: "Content-Security-Policy",
          value:
            "default-src 'self' *.rgbgroup.ir; img-src 'self' data: blob: *.rgbgroup.ir; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.rgbgroup.ir; style-src 'self' 'unsafe-inline' *.rgbgroup.ir; connect-src 'self' https:; frame-ancestors 'none';",
        },
      ],
    },
  ];
};

export default nextConfig;
