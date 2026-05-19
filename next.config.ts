import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    '**': [
      './node_modules/.prisma/**',
      './node_modules/@prisma/client/**',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3333',
      },
    ],
  },
};

export default nextConfig;
