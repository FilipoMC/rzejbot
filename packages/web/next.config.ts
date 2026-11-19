import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  transpilePackages: ["@rzej/shared"],
  partialPrefetching: false,
};

export default nextConfig;
