import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Exclui o Prisma do bundle do Turbopack — carregado em runtime pelo Node.js.
  // Necessário porque src/lib/prisma.ts usa require() com caminho relativo
  // para backend/node_modules/.prisma/client, que Turbopack não resolve via bundle.
  serverExternalPackages: ['@prisma/client', '.prisma/client', 'backend/node_modules/.prisma/client', 'backend/node_modules/@prisma/client'],
  outputFileTracingIncludes: {
    '**': [
      './node_modules/.prisma/**',
      './node_modules/@prisma/client/**',
      './backend/node_modules/.prisma/**',
      './backend/node_modules/@prisma/client/**',
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
