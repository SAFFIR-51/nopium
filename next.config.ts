import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_PUBLIC_DEMO_MODE === "false" ? ".next-local" : ".next",
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
