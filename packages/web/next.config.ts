import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  transpilePackages: ["@rzej/shared"],
};

export default nextConfig;
