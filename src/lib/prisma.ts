/**
 * Singleton do PrismaClient para uso no Next.js (server-side apenas).
 *
 * Usa process.cwd() + caminho relativo para garantir que o Turbopack NÃO
 * tente bundle o módulo (require com caminho computado é opaco para o bundler).
 * Em desenvolvimento: cwd = raiz do projeto → backend/node_modules/.prisma/client
 * Em standalone:      cwd = .next/standalone → backend/node_modules/.prisma/client (copiado pelo nft)
 */

import path from 'path';
import type { PrismaClient as PrismaClientType } from '../../backend/node_modules/.prisma/client';

const prismaClientPath = path.join(process.cwd(), 'backend', 'node_modules', '.prisma', 'client');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require(prismaClientPath) as {
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
