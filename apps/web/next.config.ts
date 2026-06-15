import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@town/types", "@town/db"],
};

export default nextConfig;
