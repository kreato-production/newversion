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
import { clearKreatoLocalStorage } from '@/lib/kreato-local-storage';
import type { AuthSession, AuthSessionUser, AuthUserProfile } from '@/modules/auth/auth.types';

export type User = AuthUserProfile;

interface AuthContextType {
  user: User | null;
  sessionUser: AuthSessionUser | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usuario: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: nextAuthSession, status } = useSession();

  const isLoading = status === 'loading';

  // Mapeia session.user (Auth.js v5) → AuthUserProfile (contrato legado)
  const user: User | null = useMemo(() => {
    if (!nextAuthSession?.user) return null;
    const u = nextAuthSession.user;
    return {
      id: u.id ?? '',
      nome: u.name ?? u.usuario ?? '',
      email: u.email ?? '',
      usuario: u.usuario ?? '',
      perfil: u.perfil ?? 'Usuário',
      foto: u.image ?? undefined,
      tipoAcesso: u.tipoAcesso ?? 'Operacional',
      unidadeIds: u.unidadeIds ?? [],
      tenantId: u.tenantId ?? undefined,
      role: u.role ?? 'USER',
      permissions: u.permissions ?? [],
      enabledModules: u.enabledModules ?? [],
    };
  }, [nextAuthSession]);

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

  const logout = async () => {
    // Limpa possíveis tokens legados no localStorage
    clearKreatoLocalStorage();
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionUser,
        session,
        isAuthenticated: status === 'authenticated' && !!user,
        isLoading,
        login,
        logout,
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
