import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  sassOptions: {
    additionalData: `
      @import "general/mixins.scss";
    `,
  },
};

export default nextConfig;
