import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  nome: string;
  email: string;
  usuario: string;
  perfil: string;
  foto?: string;
}

interface StoredUsuario {
  id: string;
  codigoExterno: string;
  nome: string;
  email: string;
  usuario: string;
  senha: string;
  foto?: string;
  perfil: string;
  descricao: string;
  dataCadastro: string;
  usuarioCadastro: string;
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
    try {
      // Primeiro verifica credenciais do admin padrão
      if (usuario.toLowerCase() === 'admin' && senha === 'kreato') {
        setUser(ADMIN_USER);
        localStorage.setItem('kreato_user', JSON.stringify(ADMIN_USER));
        return true;
      }

      // Busca usuários cadastrados no sistema
      const storedUsuarios = localStorage.getItem('kreato_usuarios');
      if (storedUsuarios) {
        const usuarios: StoredUsuario[] = JSON.parse(storedUsuarios);
        const foundUser = usuarios.find(
          (u) => u.usuario.toLowerCase() === usuario.toLowerCase() && u.senha === senha
        );

        if (foundUser) {
          // Não armazena a foto na sessão para evitar estouro de quota
          const loggedUser: User = {
            id: foundUser.id,
            nome: foundUser.nome,
            email: foundUser.email,
            usuario: foundUser.usuario,
            perfil: foundUser.perfil,
          };
          setUser(loggedUser);
          localStorage.setItem('kreato_user', JSON.stringify(loggedUser));
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
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
