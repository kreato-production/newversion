'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { clearKreatoLocalStorage } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';
import { authRepository } from '@/modules/auth/auth.repository';
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
  const [user, setUser] = useState<User | null>(null);
  const [sessionUser, setSessionUser] = useState<AuthSessionUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const syncProfile = async (
      nextSession: AuthSession | null,
      nextSessionUser: AuthSessionUser | null,
    ) => {
      setSession(nextSession);
      setSessionUser(nextSessionUser);

      if (nextSession?.user?.id) {
        const { profile, status, error } = await authRepository.fetchUserProfile(
          nextSession.user.id,
        );

        if (profile === null && status === null) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        if (status === 'TenantBloqueado') {
          await authRepository.signOut();
          setUser(null);
          toast({ title: 'Acesso Bloqueado', description: error, variant: 'destructive' });
        } else if (status === 'Ativo') {
          setUser(profile);
        } else if (status === 'Inativo') {
          await authRepository.signOut();
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setIsLoading(false);
    };

    const subscription = authRepository.onAuthStateChange(
      async ({ session: nextSession, sessionUser: nextSessionUser }) => {
        await syncProfile(nextSession, nextSessionUser);
      },
    );

    authRepository
      .getSession()
      .then(async ({ session: existingSession, sessionUser: existingSessionUser }) => {
        await syncProfile(existingSession, existingSessionUser);
      });

    return () => subscription.unsubscribe();
  }, [toast]);

  const login = async (
    usuario: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { user: authenticatedUser, error } = await authRepository.signInWithPassword(
        usuario,
        password,
      );

      if (error) {
        return { success: false, error };
      }

      if (authenticatedUser) {
        const {
          profile,
          status,
          error: profileError,
        } = await authRepository.fetchUserProfile(authenticatedUser.id);

        if (status === 'TenantBloqueado') {
          await authRepository.signOut();
          return { success: false, error: profileError };
        }

        if (status !== 'Ativo') {
          await authRepository.signOut();
          return {
            success: false,
            error: 'Usuario inativo. Entre em contato com o administrador.',
          };
        }

        setUser(profile);
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Ocorreu um erro inesperado' };
    }
  };

  const logout = async () => {
    try {
      await authRepository.signOut();
      setUser(null);
      setSessionUser(null);
      setSession(null);
      clearKreatoLocalStorage();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionUser,
        session,
        isAuthenticated: !!session && !!user,
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
