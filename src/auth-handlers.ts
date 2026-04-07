/**
 * Re-exporta os handlers HTTP do Auth.js a partir de auth.ts.
 *
 * Arquivo separado para evitar importar a configuração completa (com Prisma)
 * dentro de módulos de edge como o middleware.ts.
 *
 * O middleware.ts importa `auth` de `@/auth` que usa exports lazy.
 * Os route handlers importam daqui.
 */

import { handlers } from '@/auth';

export const { GET, POST } = handlers;
