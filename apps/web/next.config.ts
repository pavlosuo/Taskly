import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@taskly/shared"],
  sassOptions: {
    additionalData: `@use "@/scss/general/mixins" as *;`,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_INTERNAL_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
