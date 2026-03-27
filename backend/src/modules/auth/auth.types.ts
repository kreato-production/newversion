import type { UserRole, UserStatus } from '@prisma/client';

export type PermissionItem = {
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

export type AuthenticatedUser = {
  id: string;
  tenantId: string | null;
  nome: string;
  email: string;
  usuario: string;
  role: UserRole;
  status: UserStatus;
};

export type AuthorizationContext = {
  perfil: string;
  tipoAcesso: string;
  unidadeIds: string[];
  enabledModules: string[];
  permissions: PermissionItem[];
};

export type TenantValidation = {
  valid: boolean;
  reason?: 'TENANT_INACTIVE' | 'TENANT_BLOCKED' | 'LICENSE_EXPIRED' | 'TENANT_NOT_FOUND';
};

export type SessionUser = {
  id: string;
  tenantId: string | null;
  role: UserRole;
  email: string;
  usuario: string;
  nome: string;
  perfil: string;
  tipoAcesso: string;
  unidadeIds: string[];
  enabledModules: string[];
  permissions: PermissionItem[];
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
};

export type LoginResult = AuthTokens & {
  user: SessionUser;
};

export type RefreshSessionResult = AuthTokens & {
  user: SessionUser;
};
