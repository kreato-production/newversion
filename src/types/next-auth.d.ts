/**
 * Module augmentation do Auth.js v5.
 * Estende Session.user e JWT com os campos específicos da Kreato.
 */

import type { DefaultSession, DefaultJWT } from 'next-auth';

export type KreatoUserRole = 'GLOBAL_ADMIN' | 'TENANT_ADMIN' | 'USER';

export type KreatoPermission = {
  id: string;
  modulo: string;
  subModulo1: string;
  subModulo2: string;
  campo: string;
  acao: 'visible' | 'invisible';
  somenteLeitura: boolean;
  incluir: boolean;
  alterar: boolean;
  excluir: boolean;
  tipo: 'modulo' | 'submodulo1' | 'submodulo2' | 'campo';
};

type KreatoSessionUser = {
  id: string;
  role: KreatoUserRole;
  tenantId: string | null;
  usuario: string;
  perfil: string;
  tipoAcesso: string;
  unidadeIds: string[];
  enabledModules: string[];
  permissions: KreatoPermission[];
};

declare module 'next-auth' {
  interface Session {
    user: KreatoSessionUser & DefaultSession['user'];
  }

  interface User {
    role?: KreatoUserRole;
    tenantId?: string | null;
    usuario?: string;
    perfil?: string;
    tipoAcesso?: string;
    unidadeIds?: string[];
    enabledModules?: string[];
    permissions?: KreatoPermission[];
    status?: string;
    nome?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId?: string;
    role?: KreatoUserRole;
    tenantId?: string | null;
    usuario?: string;
    perfil?: string;
    tipoAcesso?: string;
    unidadeIds?: string[];
    enabledModules?: string[];
    permissions?: KreatoPermission[];
    checkedAt?: number;
  }
}
