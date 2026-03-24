import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

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
  session: Session | null;
  supabaseUser: SupabaseUser | null;
}
