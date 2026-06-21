import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: "/stretch",
  assetPrefix: "/stretch/",
};

export default nextConfig;
