import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't use static export - Vercel handles Next.js natively
  images: {
    domains: ['cdn.builder.io'],
  },
};

export default nextConfig;
