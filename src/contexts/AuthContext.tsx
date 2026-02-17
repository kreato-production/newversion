import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { clearKreatoLocalStorage } from '@/hooks/useSupabaseData';

export interface User {
  id: string;
  nome: string;
  email: string;
  usuario: string;
  perfil: string;
  foto?: string;
  tipoAcesso?: string;
  recursoHumanoId?: string;
  unidadeIds?: string[];
}

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

// Convert username to internal email format
const usernameToEmail = (username: string): string => {
  return `${username.toLowerCase()}@kreato.app`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string): Promise<{ profile: User | null; status: string | null }> => {
    try {
      const [{ data: profile, error }, { data: unidadesData }] = await Promise.all([
        supabase
          .from('profiles')
          .select(`
            id,
            nome,
            email,
            usuario,
            foto_url,
            perfil_id,
            status,
            tipo_acesso,
            recurso_humano_id,
            perfis_acesso:perfil_id (nome)
          `)
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('usuario_unidades')
          .select('unidade_id')
          .eq('usuario_id', userId),
      ]);

      if (error) {
        console.error('Error fetching profile:', error);
        return { profile: null, status: null };
      }

      // Profile may not exist yet for newly created users
      if (!profile) {
        return { profile: null, status: null };
      }

      const unidadeIds = (unidadesData || []).map((u: any) => u.unidade_id);

      return {
        profile: {
          id: profile.id,
          nome: profile.nome,
          email: profile.email,
          usuario: profile.usuario,
          perfil: (profile.perfis_acesso as { nome: string } | null)?.nome || 'Usuário',
          foto: profile.foto_url || undefined,
          tipoAcesso: (profile as any).tipo_acesso || 'Operacional',
          recursoHumanoId: (profile as any).recurso_humano_id || undefined,
          unidadeIds,
        },
        status: profile.status || 'Ativo',
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return { profile: null, status: null };
    }
  };

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(async () => {
            const { profile, status } = await fetchUserProfile(session.user.id);
            // If profile doesn't exist yet (new user being created), don't sign out
            if (profile === null && status === null) {
              // Profile doesn't exist yet, this is likely a new user being created
              // Don't set user, but don't sign out either
              setIsLoading(false);
              return;
            }
            // Only set user if status is Ativo
            if (status === 'Ativo') {
              setUser(profile);
            } else if (status === 'Inativo') {
              // User is explicitly inactive, sign them out
              await supabase.auth.signOut();
              setUser(null);
            }
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);

      if (session?.user) {
        fetchUserProfile(session.user.id).then(({ profile, status }) => {
          // If profile doesn't exist yet (new user being created), don't sign out
          if (profile === null && status === null) {
            setIsLoading(false);
            return;
          }
          // Only set user if status is Ativo
          if (status === 'Ativo') {
            setUser(profile);
          } else if (status === 'Inativo') {
            // User is explicitly inactive, sign them out
            supabase.auth.signOut();
            setUser(null);
          }
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (usuario: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Convert username to internal email format
      const email = usernameToEmail(usuario);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Translate common errors to Portuguese
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Usuário ou senha inválidos' };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        const { profile, status } = await fetchUserProfile(data.user.id);
        
        // Check if user is active
        if (status !== 'Ativo') {
          // Sign out the user immediately
          await supabase.auth.signOut();
          return { success: false, error: 'Usuário inativo. Entre em contato com o administrador.' };
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
      await supabase.auth.signOut();
      setUser(null);
      setSupabaseUser(null);
      setSession(null);
      
      // SECURITY: Clear ALL kreato_* localStorage data on logout
      // This prevents sensitive data from persisting after logout
      clearKreatoLocalStorage();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      supabaseUser,
      session,
      isAuthenticated: !!session && !!user, 
      isLoading,
      login, 
      logout 
    }}>
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
