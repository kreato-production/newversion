import type { FastifyRequest } from 'fastify';
import type { SessionUser } from './modules/auth/auth.types.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: SessionUser;
    correlationId: string;
    startedAt: number;
  }
}

/** Cast seguro para handlers que garantem autenticação via preHandler */
export type AuthenticatedRequest = FastifyRequest & { user: SessionUser };

export {};
