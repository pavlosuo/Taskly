import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@taskly/shared"],
  sassOptions: {
    additionalData: `@use "general/mixins" as *;`,
  },
};

export default nextConfig;
