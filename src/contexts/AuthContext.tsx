import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { clearKreatoLocalStorage } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';
import { authRepository } from '@/modules/auth/auth.repository';
import type { AuthUserProfile } from '@/modules/auth/auth.types';

export type User = AuthUserProfile;

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usuario: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const subscription = authRepository.onAuthStateChange(async ({ session: nextSession, supabaseUser: nextSupabaseUser }) => {
      setSession(nextSession);
      setSupabaseUser(nextSupabaseUser);

      if (nextSession?.user) {
        setTimeout(async () => {
          const { profile, status, error } = await authRepository.fetchUserProfile(nextSession.user.id);

          if (profile === null && status === null) {
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

          setIsLoading(false);
        }, 0);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    authRepository.getSession().then(({ session: existingSession, supabaseUser: existingSupabaseUser }) => {
      setSession(existingSession);
      setSupabaseUser(existingSupabaseUser);

      if (existingSession?.user) {
        authRepository.fetchUserProfile(existingSession.user.id).then(({ profile, status, error }) => {
          if (profile === null && status === null) {
            setIsLoading(false);
            return;
          }

          if (status === 'TenantBloqueado') {
            authRepository.signOut();
            setUser(null);
            toast({ title: 'Acesso Bloqueado', description: error, variant: 'destructive' });
          } else if (status === 'Ativo') {
            setUser(profile);
          } else if (status === 'Inativo') {
            authRepository.signOut();
            setUser(null);
          }

          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const login = async (usuario: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { user: authenticatedUser, error } = await authRepository.signInWithPassword(usuario, password);

      if (error) {
        return { success: false, error };
      }

      if (authenticatedUser) {
        const { profile, status, error: profileError } = await authRepository.fetchUserProfile(authenticatedUser.id);

        if (status === 'TenantBloqueado') {
          await authRepository.signOut();
          return { success: false, error: profileError };
        }

        if (status !== 'Ativo') {
          await authRepository.signOut();
          return { success: false, error: 'Usuario inativo. Entre em contato com o administrador.' };
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
      setSupabaseUser(null);
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
        supabaseUser,
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
