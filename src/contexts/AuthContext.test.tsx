import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('@/modules/auth/auth.repository', () => ({
  authRepository: {
    onAuthStateChange: vi.fn(() => ({ unsubscribe: vi.fn() })),
    getSession: vi.fn().mockResolvedValue({ session: null, sessionUser: null }),
    signInWithPassword: vi.fn(),
    signOut: vi.fn().mockResolvedValue(undefined),
    fetchUserProfile: vi.fn(),
  },
}));

vi.mock('@/hooks/useSupabaseData', () => ({
  clearKreatoLocalStorage: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { authRepository } from '@/modules/auth/auth.repository';
const mockAuthRepo = vi.mocked(authRepository);

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
  mockAuthRepo.onAuthStateChange.mockReturnValue({ unsubscribe: vi.fn() });
  mockAuthRepo.getSession.mockResolvedValue({ session: null, sessionUser: null });
});

describe('AuthContext', () => {
  it('inicia em estado de carregamento e finaliza como nao autenticado', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('pronto'));
    expect(screen.getByTestId('auth')).toHaveTextContent('nao-autenticado');
    expect(screen.getByTestId('user')).toHaveTextContent('sem-usuario');
  });

  it('login chama signInWithPassword com credenciais corretas', async () => {
    mockAuthRepo.signInWithPassword.mockResolvedValue({
      session: null,
      user: null,
      error: 'senha invalida',
    });

    let loginFn!: (u: string, p: string) => Promise<{ success: boolean; error?: string }>;

    function CaptureLogin() {
      const { login } = useAuth();
      loginFn = login;
      return null;
    }

    render(
      <AuthProvider>
        <CaptureLogin />
      </AuthProvider>,
    );

    await waitFor(() => expect(mockAuthRepo.getSession).toHaveBeenCalled());

    await act(async () => {
      await loginFn('ana', '123456');
    });

    expect(mockAuthRepo.signInWithPassword).toHaveBeenCalledWith('ana', '123456');
  });

  it('login retorna erro quando credenciais invalidas', async () => {
    mockAuthRepo.signInWithPassword.mockResolvedValue({
      session: null,
      user: null,
      error: 'Usuario ou senha invalidos',
    });

    let loginFn!: (u: string, p: string) => Promise<{ success: boolean; error?: string }>;

    function CaptureLogin() {
      const { login } = useAuth();
      loginFn = login;
      return null;
    }

    render(
      <AuthProvider>
        <CaptureLogin />
      </AuthProvider>,
    );

    await waitFor(() => expect(mockAuthRepo.getSession).toHaveBeenCalled());

    let result!: { success: boolean; error?: string };
    await act(async () => {
      result = await loginFn('ana', 'errada');
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Usuario ou senha invalidos');
  });

  it('logout chama signOut no repositorio', async () => {
    let logoutFn!: () => Promise<void>;

    function CaptureLogout() {
      const { logout } = useAuth();
      logoutFn = logout;
      return null;
    }

    render(
      <AuthProvider>
        <CaptureLogout />
      </AuthProvider>,
    );

    await waitFor(() => expect(mockAuthRepo.getSession).toHaveBeenCalled());

    await act(async () => {
      await logoutFn();
    });

    expect(mockAuthRepo.signOut).toHaveBeenCalled();
  });
});
