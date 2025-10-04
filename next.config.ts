import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wd08gxpfiidntuav.public.blob.vercel-storage.com',
        port: '',
      },
    ],
  },
};

export default nextConfig;