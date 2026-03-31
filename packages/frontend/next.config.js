/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Tối ưu dev mode
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // Giảm overhead
  productionBrowserSourceMaps: false,

  // Headers: only disable cache for SSE endpoint
  async headers() {
    return [
      {
        source: "/api/backend/products/events",
        headers: [
          { key: "Cache-Control", value: "no-cache" },
          { key: "X-Accel-Buffering", value: "no" },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.cloudflare.net",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        protocol: "https",
        hostname: "**.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.s3.**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.railway.app",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  },
};

module.exports = nextConfig;
