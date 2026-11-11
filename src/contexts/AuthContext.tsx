'use client';
/* eslint-disable react-refresh/only-export-components */

/**
 * AuthContext — bridge entre Auth.js v5 (useSession) e o contrato legado useAuth().
 *
 * Todos os 36+ consumidores de useAuth() continuam funcionando sem alteração.
 * A fonte de verdade é o JWT do Auth.js v5, lido via useSession().
 *
 * login()  → signIn('credentials', ...) do next-auth/react
 * logout() → signOut({ callbackUrl: '/login' })
 */

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clearKreatoLocalStorage } from '@/lib/kreato-local-storage';
import type {
  AuthSession,
  AuthSessionUser,
  AuthUserProfile,
  PermissionItem,
} from '@/modules/auth/auth.types';

export type User = AuthUserProfile;

interface AuthContextType {
  user: User | null;
  sessionUser: AuthSessionUser | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usuario: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  /** Rebusca a foto do usuário logado (ex.: depois de alterá-la no cadastro). */
  refreshUserFoto: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserPermissions(): Promise<{
  permissions: PermissionItem[];
  enabledModules: string[];
}> {
  const res = await fetch('/api/user/permissions');
  if (!res.ok) throw new Error('Erro ao buscar permissões');
  return res.json() as Promise<{ permissions: PermissionItem[]; enabledModules: string[] }>;
}

export const USER_FOTO_QUERY_KEY = 'user-foto';

// A foto (data URL) não cabe no cookie JWT — é buscada à parte.
async function fetchUserFoto(): Promise<string | null> {
  const res = await fetch('/api/user/foto');
  if (!res.ok) throw new Error('Erro ao buscar foto do usuário');
  const body = (await res.json()) as { foto?: string | null };
  return body.foto || null;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: nextAuthSession, status } = useSession();
  const queryClient = useQueryClient();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && !!nextAuthSession?.user;

  const { data: permissionsData } = useQuery({
    queryKey: ['user-permissions', nextAuthSession?.user?.id],
    queryFn: fetchUserPermissions,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

  const { data: fotoData } = useQuery({
    queryKey: [USER_FOTO_QUERY_KEY, nextAuthSession?.user?.id],
    queryFn: fetchUserFoto,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  // Mapeia session.user (Auth.js v5) → AuthUserProfile (contrato legado)
  // Permissions are fetched separately via /api/user/permissions to keep the JWT cookie small.
  const user: User | null = useMemo(() => {
    if (!nextAuthSession?.user) return null;
    const u = nextAuthSession.user;
    return {
      id: u.id ?? '',
      nome: u.name ?? u.usuario ?? '',
      email: u.email ?? '',
      usuario: u.usuario ?? '',
      perfil: u.perfil ?? 'Usuário',
      foto: fotoData ?? u.image ?? undefined,
      tipoAcesso: u.tipoAcesso ?? 'Operacional',
      unidadeIds: u.unidadeIds ?? [],
      tenantId: u.tenantId ?? undefined,
      tenantNome: u.tenantNome ?? null,
      role: u.role ?? 'USER',
      permissions: permissionsData?.permissions ?? [],
      enabledModules: permissionsData?.enabledModules ?? u.enabledModules ?? [],
    };
  }, [nextAuthSession, permissionsData, fotoData]);

  const sessionUser: AuthSessionUser | null = useMemo(() => {
    if (!nextAuthSession?.user) return null;
    const u = nextAuthSession.user;
    return {
      id: u.id ?? '',
      email: u.email ?? undefined,
      usuario: u.usuario ?? undefined,
      tenantId: u.tenantId ?? null,
      role: u.role ?? 'USER',
    };
  }, [nextAuthSession]);

  const session: AuthSession | null = useMemo(() => {
    if (!sessionUser) return null;
    return { user: sessionUser };
  }, [sessionUser]);

  const login = async (
    usuario: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await signIn('credentials', {
      usuario,
      password,
      redirect: false,
    });

    if (result?.error) {
      const errorMap: Record<string, string> = {
        CredentialsSignin: 'Usuário ou senha incorretos.',
        Configuration: 'Erro de configuração do servidor.',
        Default: 'Erro de autenticação. Tente novamente.',
      };
      return {
        success: false,
        error: errorMap[result.error] ?? errorMap.Default,
      };
    }

    return { success: true };
  };

  const refreshUserFoto = () => {
    void queryClient.invalidateQueries({ queryKey: [USER_FOTO_QUERY_KEY] });
  };

  const logout = async () => {
    // Limpa possíveis tokens legados no localStorage
    clearKreatoLocalStorage();
    await signOut({ callbackUrl: window.location.origin + '/login' });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionUser,
        session,
        isAuthenticated: isAuthenticated && !!user,
        isLoading,
        login,
        logout,
        refreshUserFoto,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
