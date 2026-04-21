import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  images: {
    remotePatterns: [
      // Pexels CDN — fashion photo thumbnails
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
};

export default nextConfig;
