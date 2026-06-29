import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@taskly/shared"],
  sassOptions: {
    additionalData: `
      @import "general/mixins.scss";
    `,
  },
};

export default nextConfig;
