// ============= Full file contents =============

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { clearKreatoLocalStorage } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';

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
  tenantId?: string;
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
  const { toast } = useToast();

  // Validate tenant license
  const validateTenantLicense = async (tenantId: string): Promise<{ valid: boolean; status: string; expiringSoon?: boolean }> => {
    try {
      // 1. Get tenant status
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('status')
        .eq('id', tenantId)
        .single();

      if (tenantError || !tenant) return { valid: false, status: 'Erro' };
      if (tenant.status !== 'Ativo') return { valid: false, status: tenant.status };

      // 2. Check active license
      const today = new Date().toISOString().split('T')[0];
      const { data: licenses, error: licenseError } = await supabase
        .from('tenant_licencas')
        .select('data_inicio, data_fim')
        .eq('tenant_id', tenantId)
        .lte('data_inicio', today)
        .gte('data_fim', today);

      if (licenseError || !licenses || licenses.length === 0) {
        return { valid: false, status: 'Licença Expirada' };
      }

      // 3. Check for expiring soon (30 days)
      const expiringSoon = licenses.some(l => {
        const endDate = new Date(l.data_fim);
        const daysUntilExpire = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpire <= 30;
      });

      return { valid: true, status: 'Ativo', expiringSoon };
    } catch (err) {
      console.error('Error validating license:', err);
      return { valid: false, status: 'Erro' };
    }
  };

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string): Promise<{ profile: User | null; status: string | null; error?: string }> => {
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
            tenant_id,
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

      // Check if user is global admin (skip license check)
      const isGlobalAdmin = profile.usuario === 'admin_global';

      // If not global admin, validate tenant license
      if (!isGlobalAdmin && profile.tenant_id) {
        const { valid, status, expiringSoon } = await validateTenantLicense(profile.tenant_id);
        
        if (!valid) {
          // If license invalid, update tenant status to Blocked if expired
          if (status === 'Licença Expirada') {
             await supabase.from('tenants').update({ status: 'Bloqueado' }).eq('id', profile.tenant_id);
          }
          return { profile: null, status: 'TenantBloqueado', error: `Acesso negado: Licença ${status === 'Licença Expirada' ? 'Expirada' : status}. Entre em contato com o administrador.` };
        }

        // Notify global admin if expiring soon (handled in Login page/dashboard actually)
        // We can attach a flag to the user object
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
          tenantId: profile.tenant_id,
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
            const { profile, status, error } = await fetchUserProfile(session.user.id);
            // If profile doesn't exist yet (new user being created), don't sign out
            if (profile === null && status === null) {
              setIsLoading(false);
              return;
            }
            
            if (status === 'TenantBloqueado') {
              await supabase.auth.signOut();
              setUser(null);
              toast({ title: 'Acesso Bloqueado', description: error, variant: 'destructive' });
            } else if (status === 'Ativo') {
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
        fetchUserProfile(session.user.id).then(({ profile, status, error }) => {
          if (profile === null && status === null) {
            setIsLoading(false);
            return;
          }
          if (status === 'TenantBloqueado') {
            supabase.auth.signOut();
            setUser(null);
            toast({ title: 'Acesso Bloqueado', description: error, variant: 'destructive' });
          } else if (status === 'Ativo') {
            setUser(profile);
          } else if (status === 'Inativo') {
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
  }, [toast]);

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
        const { profile, status, error: profileError } = await fetchUserProfile(data.user.id);
        
        if (status === 'TenantBloqueado') {
          await supabase.auth.signOut();
          return { success: false, error: profileError };
        }
        
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
