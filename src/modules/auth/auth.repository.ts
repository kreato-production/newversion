import {
  apiRequest,
  getBackendBaseUrl,
  isKeycloakAuthEnabled,
  logoutBackendSession,
  logoutKeycloakSession,
  refreshBackendSession,
} from '@/lib/api/http';
import type {
  AuthSession,
  AuthSessionState,
  AuthSessionUser,
  AuthUserProfile,
  LoginResult,
  UserProfileResult,
} from './auth.types';

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

export interface AuthRepository {
  usernameToEmail(username: string): string;
  fetchUserProfile(userId: string): Promise<UserProfileResult>;
  signInWithPassword(
    usuario: string,
    password: string,
  ): Promise<{ session: AuthSession | null; user: AuthSessionUser | null; error?: string }>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthSessionState>;
  onAuthStateChange(callback: (state: AuthSessionState) => void): { unsubscribe: () => void };
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

function buildSessionFromProfile(user: BackendProfilePayload): AuthSession {
  return {
    user: {
      id: user.id,
      email: user.email,
      usuario: user.usuario,
      tenantId: user.tenantId,
      role: user.role,
    },
  };
}

export class BackendAuthRepository implements AuthRepository {
  private readonly listeners = new Set<(state: AuthSessionState) => void>();

  usernameToEmail(username: string): string {
    return `${username.toLowerCase()}@kreato.app`;
  }

  protected emit(state: AuthSessionState) {
    this.listeners.forEach((listener) => listener(state));
  }

  async fetchUserProfile(_userId: string): Promise<UserProfileResult> {
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
      const session = buildSessionFromProfile(payload.user);
      return { session, sessionUser: session.user };
    } catch {
      const refreshed = await refreshBackendSession();
      if (!refreshed) {
        return { session: null, sessionUser: null };
      }

      try {
        const payload = await apiRequest<{ user: BackendProfilePayload }>('/auth/me');
        const session = buildSessionFromProfile(payload.user);
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

export class KeycloakBffAuthRepository extends BackendAuthRepository {
  override async signInWithPassword(
    _usuario: string,
    _password: string,
  ): Promise<{ session: AuthSession | null; user: AuthSessionUser | null; error?: string }> {
    const loginUrl = `${getBackendBaseUrl()}/auth/login`;
    window.location.assign(loginUrl);
    return new Promise(() => {});
  }

  override async signOut(): Promise<void> {
    await logoutKeycloakSession();
    this.emit({ session: null, sessionUser: null });
  }
}

export const authRepository: AuthRepository = isKeycloakAuthEnabled()
  ? new KeycloakBffAuthRepository()
  : new BackendAuthRepository();

export function mapLoginError(result: { error?: string | null }): LoginResult {
  return result.error ? { success: false, error: result.error } : { success: true };
}
