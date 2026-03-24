import type { Session, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { AuthSessionState, AuthUserProfile, LoginResult, TenantLicenseValidation, UserProfileResult } from './auth.types';

type ProfileRow = {
  id: string;
  nome: string;
  email: string;
  usuario: string;
  foto_url: string | null;
  status: string | null;
  tipo_acesso: string | null;
  recurso_humano_id: string | null;
  tenant_id: string | null;
  perfis_acesso: { nome: string } | { nome: string }[] | null;
};

type UnidadeRow = { unidade_id: string };
type LicenseRow = { data_fim: string };

export interface AuthRepository {
  usernameToEmail(username: string): string;
  validateTenantLicense(tenantId: string): Promise<TenantLicenseValidation>;
  fetchUserProfile(userId: string): Promise<UserProfileResult>;
  signInWithPassword(usuario: string, password: string): Promise<{ session: Session | null; user: SupabaseUser | null; error?: string }>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthSessionState>;
  onAuthStateChange(callback: (state: AuthSessionState) => void): { unsubscribe: () => void };
}

function mapProfileRow(profile: ProfileRow, unidadeIds: string[]): AuthUserProfile {
  const perfilData = Array.isArray(profile.perfis_acesso) ? profile.perfis_acesso[0] : profile.perfis_acesso;

  return {
    id: profile.id,
    nome: profile.nome,
    email: profile.email,
    usuario: profile.usuario,
    perfil: perfilData?.nome || 'Usuario',
    foto: profile.foto_url || undefined,
    tipoAcesso: profile.tipo_acesso || 'Operacional',
    recursoHumanoId: profile.recurso_humano_id || undefined,
    tenantId: profile.tenant_id || undefined,
    unidadeIds,
  };
}

export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly client: SupabaseClient = supabase) {}

  usernameToEmail(username: string): string {
    return `${username.toLowerCase()}@kreato.app`;
  }

  async validateTenantLicense(tenantId: string): Promise<TenantLicenseValidation> {
    try {
      const { data: tenant, error: tenantError } = await this.client
        .from('tenants')
        .select('status')
        .eq('id', tenantId)
        .single();

      if (tenantError || !tenant) return { valid: false, status: 'Erro' };
      if (tenant.status !== 'Ativo') return { valid: false, status: tenant.status };

      const today = new Date().toISOString().split('T')[0];
      const { data: licenses, error: licenseError } = await this.client
        .from('tenant_licencas')
        .select('data_fim')
        .eq('tenant_id', tenantId)
        .lte('data_inicio', today)
        .gte('data_fim', today);

      if (licenseError || !licenses || licenses.length === 0) {
        return { valid: false, status: 'Licenca Expirada' };
      }

      const expiringSoon = (licenses as LicenseRow[]).some((license) => {
        const endDate = new Date(license.data_fim);
        const daysUntilExpire = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntilExpire <= 30;
      });

      return { valid: true, status: 'Ativo', expiringSoon };
    } catch (error) {
      console.error('Error validating tenant license:', error);
      return { valid: false, status: 'Erro' };
    }
  }

  async fetchUserProfile(userId: string): Promise<UserProfileResult> {
    try {
      const [{ data: profile, error }, { data: unidadesData }] = await Promise.all([
        this.client
          .from('profiles')
          .select(`
            id,
            nome,
            email,
            usuario,
            foto_url,
            status,
            tipo_acesso,
            recurso_humano_id,
            tenant_id,
            perfis_acesso:perfil_id (nome)
          `)
          .eq('id', userId)
          .maybeSingle(),
        this.client
          .from('usuario_unidades')
          .select('unidade_id')
          .eq('usuario_id', userId),
      ]);

      if (error) {
        console.error('Error fetching profile:', error);
        return { profile: null, status: null };
      }

      if (!profile) {
        return { profile: null, status: null };
      }

      const typedProfile = profile as unknown as ProfileRow;
      const isGlobalAdmin = typedProfile.usuario === 'admin_global';

      if (!isGlobalAdmin && typedProfile.tenant_id) {
        const { valid, status } = await this.validateTenantLicense(typedProfile.tenant_id);

        if (!valid) {
          if (status === 'Licenca Expirada') {
            await this.client.from('tenants').update({ status: 'Bloqueado' }).eq('id', typedProfile.tenant_id);
          }

          return {
            profile: null,
            status: 'TenantBloqueado',
            error: `Acesso negado: Licenca ${status === 'Licenca Expirada' ? 'Expirada' : status}. Entre em contato com o administrador.`,
          };
        }
      }

      const unidadeIds = ((unidadesData || []) as UnidadeRow[]).map((unidade) => unidade.unidade_id);
      return {
        profile: mapProfileRow(typedProfile, unidadeIds),
        status: typedProfile.status || 'Ativo',
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return { profile: null, status: null };
    }
  }

  async signInWithPassword(
    usuario: string,
    password: string,
  ): Promise<{ session: Session | null; user: SupabaseUser | null; error?: string }> {
    const email = this.usernameToEmail(usuario);

    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        session: null,
        user: null,
        error: error.message.includes('Invalid login credentials')
          ? 'Usuario ou senha invalidos'
          : error.message,
      };
    }

    return {
      session: data.session,
      user: data.user,
    };
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  async getSession(): Promise<AuthSessionState> {
    const { data } = await this.client.auth.getSession();
    return {
      session: data.session,
      supabaseUser: data.session?.user ?? null,
    };
  }

  onAuthStateChange(callback: (state: AuthSessionState) => void): { unsubscribe: () => void } {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      callback({
        session,
        supabaseUser: session?.user ?? null,
      });
    });

    return {
      unsubscribe: () => data.subscription.unsubscribe(),
    };
  }
}

export const authRepository = new SupabaseAuthRepository();

export function mapLoginError(result: { error?: string | null }): LoginResult {
  return result.error ? { success: false, error: result.error } : { success: true };
}
