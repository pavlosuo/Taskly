import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@taskly/shared"],
  sassOptions: {
    additionalData: `@use "@/scss/general/mixins" as *;`,
  }
};

export default nextConfig;
