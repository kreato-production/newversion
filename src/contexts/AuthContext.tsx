import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  nome: string;
  email: string;
  usuario: string;
  perfil: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (usuario: string, senha: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_USER: User = {
  id: '1',
  nome: 'Administrador',
  email: 'admin@kreato.com',
  usuario: 'Admin',
  perfil: 'Administrador',
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('kreato_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (usuario: string, senha: string): boolean => {
    if (usuario.toLowerCase() === 'admin' && senha === 'kreato') {
      setUser(ADMIN_USER);
      localStorage.setItem('kreato_user', JSON.stringify(ADMIN_USER));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kreato_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
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
