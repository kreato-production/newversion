import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';
const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? 'http://localhost:3333';

// CSP em desenvolvimento usa 'unsafe-eval' para o hot-reload do Next.js.
// Em produção remove unsafe-eval e restringe connect-src ao backend real.
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://unpkg.com" + (isDev ? " 'unsafe-eval'" : ''),
  "style-src 'self' 'unsafe-inline' https://unpkg.com",
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
  "font-src 'self'",
  `connect-src 'self' ${backendOrigin}` + (isDev ? ' ws://localhost:3001' : ''),
  "frame-src 'self'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
].join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Content-Security-Policy', value: cspDirectives },
  // HSTS apenas em produção — não aplicar em HTTP local
  ...(!isDev
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
];

const nextConfig: NextConfig = {
  output: 'standalone',

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
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
