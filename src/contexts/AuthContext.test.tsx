import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
let mockSessionData: { data: object | null; status: string } = {
  data: null,
  status: 'unauthenticated',
};

vi.mock('next-auth/react', () => ({
  useSession: () => mockSessionData,
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

vi.mock('@/lib/kreato-local-storage', () => ({
  clearKreatoLocalStorage: vi.fn(),
}));

function TestConsumer() {
  const { user, isAuthenticated, isLoading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{isLoading ? 'carregando' : 'pronto'}</span>
      <span data-testid="auth">{isAuthenticated ? 'autenticado' : 'nao-autenticado'}</span>
      <span data-testid="user">{user?.nome ?? 'sem-usuario'}</span>
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSessionData = { data: null, status: 'unauthenticated' };
});

describe('AuthContext', () => {
  it('estado loading enquanto useSession retorna loading', () => {
    mockSessionData = { data: null, status: 'loading' };

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('carregando');
  });

  it('estado nao-autenticado quando sem sessao', async () => {
    mockSessionData = { data: null, status: 'unauthenticated' };

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('pronto'));
    expect(screen.getByTestId('auth')).toHaveTextContent('nao-autenticado');
    expect(screen.getByTestId('user')).toHaveTextContent('sem-usuario');
  });

  it('estado autenticado quando sessao presente', async () => {
    mockSessionData = {
      status: 'authenticated',
      data: {
        user: {
          id: 'u1',
          name: 'Ana Lima',
          email: 'ana@kreato.tv',
          usuario: 'ana_lima',
          perfil: 'Administrador',
          role: 'TENANT_ADMIN',
          tenantId: 't1',
          unidadeIds: [],
          enabledModules: [],
          permissions: [],
        },
      },
    };

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('autenticado'));
    expect(screen.getByTestId('user')).toHaveTextContent('Ana Lima');
  });

  it('login chama signIn com credenciais corretas', async () => {
    mockSignIn.mockResolvedValue({ error: null });

    let loginFn!: (u: string, p: string) => Promise<{ success: boolean; error?: string }>;

    function CaptureLogin(): null {
      const { login } = useAuth();
      loginFn = login;
      return null;
    }

    render(
      <AuthProvider>
        <CaptureLogin />
      </AuthProvider>,
    );

    await act(async () => {
      await loginFn('ana', '123456');
    });

    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      usuario: 'ana',
      password: '123456',
      redirect: false,
    });
  });

  it('login retorna erro quando credenciais invalidas', async () => {
    mockSignIn.mockResolvedValue({ error: 'CredentialsSignin' });

    let loginFn!: (u: string, p: string) => Promise<{ success: boolean; error?: string }>;

    function CaptureLogin(): null {
      const { login } = useAuth();
      loginFn = login;
      return null;
    }

    render(
      <AuthProvider>
        <CaptureLogin />
      </AuthProvider>,
    );

    let result!: { success: boolean; error?: string };
    await act(async () => {
      result = await loginFn('ana', 'errada');
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Usuário ou senha incorretos.');
  });

  it('logout chama signOut com callbackUrl correto', async () => {
    mockSignOut.mockResolvedValue(undefined);

    let logoutFn!: () => Promise<void>;

    function CaptureLogout(): null {
      const { logout } = useAuth();
      logoutFn = logout;
      return null;
    }

    render(
      <AuthProvider>
        <CaptureLogout />
      </AuthProvider>,
    );

    await act(async () => {
      await logoutFn();
    });

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
  });
});
