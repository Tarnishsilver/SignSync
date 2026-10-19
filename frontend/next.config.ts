import type { NextConfig } from "next";

const SIGN_SERVER = process.env.NEXT_PUBLIC_SIGN_SERVER || 'http://127.0.0.1:8765';
const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Only proxy to the backend in local development.
  // In production (Vercel), the frontend connects directly to the backend
  // via NEXT_PUBLIC_SIGN_SERVER env var set in the Vercel dashboard.
  async rewrites() {
    if (!isDev) return []
    return [
      {
        source: '/ws/:path*',
        destination: `${SIGN_SERVER}/ws/:path*`,
      },
      {
        source: '/labels',
        destination: `${SIGN_SERVER}/labels`,
      },
    ]
  },
};

export default nextConfig;
