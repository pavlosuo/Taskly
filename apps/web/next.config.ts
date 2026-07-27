import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@taskly/shared"],
  sassOptions: {
    additionalData: `@use "general/mixins" as *;`,
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "5050" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5050/api/:path*",
      },
    ];
  },
};

export default nextConfig;
