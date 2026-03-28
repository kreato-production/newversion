export interface PermissionItem {
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
}

export interface AuthSessionUser {
  id: string;
  email?: string;
  usuario?: string;
  tenantId?: string | null;
  role?: string;
}

export interface AuthSession {
  accessToken?: string;
  refreshToken?: string | null;
  user: AuthSessionUser;
}

export interface AuthUserProfile {
  id: string;
  nome: string;
  email: string;
  usuario: string;
  perfil: string;
  foto?: string;
  tipoAcesso?: string;
  recursoHumanoId?: string;
  unidadeIds?: string[];
  tenantId?: string;
  role?: string;
  permissions?: PermissionItem[];
  enabledModules?: string[];
}

export interface TenantLicenseValidation {
  valid: boolean;
  status: string;
  expiringSoon?: boolean;
}

export interface UserProfileResult {
  profile: AuthUserProfile | null;
  status: string | null;
  error?: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

export interface AuthSessionState {
  session: AuthSession | null;
  sessionUser: AuthSessionUser | null;
}
