/**
 * Singleton do PrismaClient para uso no Next.js (server-side apenas).
 *
 * Reutiliza o cliente gerado no backend (`backend/prisma/schema.prisma`).
 * O require() aponta diretamente para o .prisma/client gerado pelo backend,
 * pois o root node_modules não tem .prisma/client gerado (Prisma gera por app).
 *
 * Em desenvolvimento o hot-reload do Next.js pode criar múltiplas instâncias
 * — o padrão global evita isso.
 */

import type { PrismaClient as PrismaClientType } from '../../backend/node_modules/.prisma/client';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('../../backend/node_modules/.prisma/client') as {
  PrismaClient: new (options?: { log?: string[] }) => PrismaClientType;
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined;
};

export const prisma: PrismaClientType =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
