/**
 * Singleton do PrismaClient para uso no Next.js (server-side apenas).
 *
 * Reutiliza o cliente gerado no backend (`backend/prisma/schema.prisma`).
 * O require() aponta diretamente para o .prisma/client gerado pelo backend,
 * pois o root node_modules não tem .prisma/client gerado (Prisma gera por app).
 *
 * Em desenvolvimento o hot-reload do Next.js pode criar múltiplas instâncias
 * — o padrão global evita isso.
 *
 * O bloco try/catch garante que falhas de inicialização (ex: binário nativo
 * incompatível com a plataforma) não derrubem o route handler de auth —
 * as chamadas a prisma.X lançarão erro, mas o jwt callback as captura graciosamente.
 */

import type { PrismaClient as PrismaClientType } from '../../backend/node_modules/.prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined;
};

function createPrismaClient(): PrismaClientType | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('../../backend/node_modules/.prisma/client') as {
      PrismaClient: new (options?: { log?: string[] }) => PrismaClientType;
    };
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  } catch (err) {
    console.error('[prisma] Falha ao inicializar PrismaClient:', err);
    return undefined;
  }
}

export const prisma: PrismaClientType = (globalForPrisma.prisma ??
  createPrismaClient()) as PrismaClientType;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
