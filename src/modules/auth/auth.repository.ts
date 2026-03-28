import { apiRequest, logoutBackendSession, refreshBackendSession } from '@/lib/api/http';
import type {
  AuthSession,
  AuthSessionState,
  AuthSessionUser,
  AuthUserProfile,
  LoginResult,
  TenantLicenseValidation,
  UserProfileResult,
} from './auth.types';

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

type BackendProfilePayload = {
  id: string;
  tenantId: string | null;
  nome: string;
  email: string;
  usuario: string;
  role: string;
  perfil: string;
  tipoAcesso: string;
  unidadeIds: string[];
  enabledModules: string[];
  permissions: AuthUserProfile['permissions'];
};

type BackendSessionPayload = {
  user: BackendProfilePayload;
  accessToken: string;
  refreshToken: string;
};

type LegacyAuthUser = {
  id: string;
  email?: string;
};

type LegacyAuthSession = {
  user?: LegacyAuthUser | null;
};

type LegacyAuthClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
  auth: {
    signInWithPassword: (params: { email: string; password: string }) => Promise<{
      data: { user: LegacyAuthUser | null };
      error: { message: string } | null;
    }>;
    signOut: () => Promise<void>;
    getSession: () => Promise<{ data: { session: LegacyAuthSession | null } }>;
    onAuthStateChange: (callback: (_event: string, session: LegacyAuthSession | null) => void) => {
      data: { subscription: { unsubscribe: () => void } };
    };
  };
};

export interface AuthRepository {
  usernameToEmail(username: string): string;
  validateTenantLicense(tenantId: string): Promise<TenantLicenseValidation>;
  fetchUserProfile(userId: string): Promise<UserProfileResult>;
  signInWithPassword(
    usuario: string,
    password: string,
  ): Promise<{ session: AuthSession | null; user: AuthSessionUser | null; error?: string }>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthSessionState>;
  onAuthStateChange(callback: (state: AuthSessionState) => void): { unsubscribe: () => void };
}

function createDisabledLegacyAuthClient(): LegacyAuthClient {
  const disabled = () => {
    throw new Error(
      'O caminho legado de autenticacao via Supabase foi desativado. Use a API local.',
    );
  };

  return {
    from: disabled,
    auth: {
      signInWithPassword: async () => disabled(),
      signOut: async () => disabled(),
      getSession: async () => disabled(),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
    },
  };
}

function mapProfileRow(profile: ProfileRow, unidadeIds: string[]): AuthUserProfile {
  const perfilData = Array.isArray(profile.perfis_acesso)
    ? profile.perfis_acesso[0]
    : profile.perfis_acesso;

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

function mapBackendProfile(user: BackendProfilePayload): AuthUserProfile {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    usuario: user.usuario,
    perfil: user.perfil,
    tenantId: user.tenantId || undefined,
    tipoAcesso: user.tipoAcesso,
    unidadeIds: user.unidadeIds,
    role: user.role,
    enabledModules: user.enabledModules,
    permissions: user.permissions || [],
  };
}

function mapBackendSession(payload: BackendSessionPayload): AuthSession {
  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    user: {
      id: payload.user.id,
      email: payload.user.email,
      usuario: payload.user.usuario,
      tenantId: payload.user.tenantId,
      role: payload.user.role,
    },
  };
}

export class SupabaseAuthRepository implements AuthRepository {
  constructor(protected readonly client: LegacyAuthClient = createDisabledLegacyAuthClient()) {}

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
          .select(
            `
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
          `,
          )
          .eq('id', userId)
          .maybeSingle(),
        this.client.from('usuario_unidades').select('unidade_id').eq('usuario_id', userId),
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
            await this.client
              .from('tenants')
              .update({ status: 'Bloqueado' })
              .eq('id', typedProfile.tenant_id);
          }

          return {
            profile: null,
            status: 'TenantBloqueado',
            error: `Acesso negado: Licenca ${status === 'Licenca Expirada' ? 'Expirada' : status}. Entre em contato com o administrador.`,
          };
        }
      }

      const unidadeIds = ((unidadesData || []) as UnidadeRow[]).map(
        (unidade) => unidade.unidade_id,
      );
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
  ): Promise<{ session: AuthSession | null; user: AuthSessionUser | null; error?: string }> {
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

    const user: AuthSessionUser | null = data.user
      ? {
          id: data.user.id,
          email: data.user.email,
        }
      : null;

    return {
      session: user ? { user } : null,
      user,
    };
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  async getSession(): Promise<AuthSessionState> {
    const { data } = await this.client.auth.getSession();
    const user = data.session?.user
      ? {
          id: data.session.user.id,
          email: data.session.user.email,
        }
      : null;

    return {
      session: user ? { user } : null,
      sessionUser: user,
    };
  }

  onAuthStateChange(callback: (state: AuthSessionState) => void): { unsubscribe: () => void } {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
          }
        : null;

      callback({
        session: user ? { user } : null,
        sessionUser: user,
      });
    });

    return {
      unsubscribe: () => data.subscription.unsubscribe(),
    };
  }
}

export class BackendAuthRepository extends SupabaseAuthRepository {
  private readonly listeners = new Set<(state: AuthSessionState) => void>();

  private emit(state: AuthSessionState) {
    this.listeners.forEach((listener) => listener(state));
  }

  override async fetchUserProfile(_userId: string): Promise<UserProfileResult> {
    try {
      const payload = await apiRequest<{ user: BackendProfilePayload }>('/auth/me');
      return {
        profile: mapBackendProfile(payload.user),
        status: 'Ativo',
      };
    } catch (error) {
      return {
        profile: null,
        status: null,
        error: error instanceof Error ? error.message : 'Erro ao carregar perfil',
      };
    }
  }

  async signInWithPassword(
    usuario: string,
    password: string,
  ): Promise<{ session: AuthSession | null; user: AuthSessionUser | null; error?: string }> {
    try {
      const payload = await apiRequest<BackendSessionPayload>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ usuario, password }),
      });

      const session = mapBackendSession(payload);
      this.emit({ session, sessionUser: session.user });
      return { session, user: session.user };
    } catch (error) {
      return {
        session: null,
        user: null,
        error: error instanceof Error ? error.message : 'Erro ao autenticar',
      };
    }
  }

  async signOut(): Promise<void> {
    await logoutBackendSession();
    this.emit({ session: null, sessionUser: null });
  }

  async getSession(): Promise<AuthSessionState> {
    try {
      const payload = await apiRequest<{ user: BackendProfilePayload }>('/auth/me');
      const session: AuthSession = {
        user: {
          id: payload.user.id,
          email: payload.user.email,
          usuario: payload.user.usuario,
          tenantId: payload.user.tenantId,
          role: payload.user.role,
        },
      };

      return { session, sessionUser: session.user };
    } catch {
      const refreshed = await refreshBackendSession();
      if (!refreshed) {
        return { session: null, sessionUser: null };
      }

      try {
        const payload = await apiRequest<{ user: BackendProfilePayload }>('/auth/me');
        const session: AuthSession = {
          user: {
            id: payload.user.id,
            email: payload.user.email,
            usuario: payload.user.usuario,
            tenantId: payload.user.tenantId,
            role: payload.user.role,
          },
        };

        return { session, sessionUser: session.user };
      } catch {
        return { session: null, sessionUser: null };
      }
    }
  }

  onAuthStateChange(callback: (state: AuthSessionState) => void): { unsubscribe: () => void } {
    this.listeners.add(callback);
    return {
      unsubscribe: () => {
        this.listeners.delete(callback);
      },
    };
  }
}

export const authRepository = new BackendAuthRepository();

export function mapLoginError(result: { error?: string | null }): LoginResult {
  return result.error ? { success: false, error: result.error } : { success: true };
}
