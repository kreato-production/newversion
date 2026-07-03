'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { ArrowRight, Eye, EyeOff, Loader2, LogIn, Moon, Sun } from 'lucide-react';
import kreatoLogo from '@/assets/kreato-logo.png';
import studioBg from '@/assets/studio-bg.png';
import { LanguageSelector } from '@/components/shared/LanguageSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/use-theme';
import { APP_METADATA } from '@/lib/app-metadata';

// Garante que o destino pós-login seja sempre um path interno.
// Rejeita URLs absolutas (http://...), protocol-relative (//evil.com)
// e qualquer valor que o URL constructor resolva para outra origem.
function sanitizeRedirect(from: string | null): string {
  if (!from || !from.startsWith('/') || from.startsWith('//')) return '/dashboard';
  try {
    const url = new URL(from, 'http://localhost');
    return url.origin === 'http://localhost' ? url.pathname + url.search : '/dashboard';
  } catch {
    return '/dashboard';
  }
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: 'Usuário ou senha inválidos.',
  OAuthSignin: 'Erro ao iniciar autenticação com provedor externo.',
  OAuthCallback: 'Erro no retorno do provedor externo.',
  OAuthCreateAccount: 'Não foi possível criar conta via provedor externo.',
  EmailCreateAccount: 'Não foi possível criar conta com este e-mail.',
  Callback: 'Erro no fluxo de autenticação.',
  OAuthAccountNotLinked: 'Esta conta já está vinculada a outro método de login.',
  SessionRequired: 'Sua sessão expirou. Faça login novamente.',
  Default: 'Erro de autenticação. Tente novamente.',
};

// Códigos específicos emitidos por src/auth.ts (authorize) para credenciais
// válidas mas acesso negado por outro motivo (licença, tenant, status).
const CREDENTIALS_ERROR_CODES: Record<string, string> = {
  'license-expired': 'A licença da sua organização está expirada. Contate o administrador.',
  'tenant-inactive': 'Sua organização está inativa. Contate o administrador.',
  'tenant-blocked': 'Sua organização está bloqueada. Contate o administrador.',
  'user-inactive': 'Seu usuário não está ativo. Contate o administrador.',
};

function getErrorMessage(error: string | null, code: string | null): string | null {
  if (code && CREDENTIALS_ERROR_CODES[code]) return CREDENTIALS_ERROR_CODES[code];
  if (!error) return null;
  return AUTH_ERROR_MESSAGES[error] ?? AUTH_ERROR_MESSAGES.Default;
}

const Login = () => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [manterConectado, setManterConectado] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { status } = useSession();
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = sanitizeRedirect(searchParams.get('from'));
  const oauthError = searchParams.get('error');
  const oauthErrorCode = searchParams.get('code');
  const errorMessage = getErrorMessage(oauthError, oauthErrorCode);
  const logoSrc = typeof kreatoLogo === 'string' ? kreatoLogo : kreatoLogo.src;
  const keycloakEnabled =
    process.env.NEXT_PUBLIC_KEYCLOAK_AUTH_ENABLED === 'true' &&
    !!process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(redirectTo);
    }
  }, [status, router, redirectTo]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleCredentialsSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const result = await signIn('credentials', {
      usuario,
      password: senha,
      redirect: false,
    });

    if (result?.error) {
      const code = (result as { code?: string }).code;
      const codeParam = code ? `&code=${encodeURIComponent(code)}` : '';
      router.replace(
        `/login?from=${encodeURIComponent(redirectTo)}&error=${result.error}${codeParam}`,
      );
    } else if (result?.ok) {
      router.replace(redirectTo);
    }

    setIsLoading(false);
  };

  const handleKeycloakSignIn = async () => {
    await signIn('keycloak', { callbackUrl: redirectTo });
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Painel esquerdo: Studio backdrop ───────────────────────────────── */}
      <div className="relative hidden flex-1 overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <img
          src={typeof studioBg === 'string' ? studioBg : studioBg.src}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Overlay escuro para garantir legibilidade do texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />

        {/* Conteúdo textual do painel esquerdo */}
        <div className="relative z-10 flex-1 p-12 pt-14">
          {/* Logo Kreato */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <img
                src={logoSrc}
                alt="Kreato"
                className="h-6 w-6 object-contain brightness-0 invert"
              />
            </div>
            <span className="text-lg font-semibold tracking-wide text-white">KREATO</span>
          </div>
        </div>

        {/* Badge + Tagline */}
        <div className="relative z-10 p-12 pb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
            <span className="text-[11px] font-medium uppercase tracking-widest text-white/80">
              Sistema de Gestão de Produção
            </span>
          </div>

          <h1 className="mb-4 text-5xl font-bold leading-tight tracking-tight text-white">
            Da pauta ao ar.
          </h1>
          <p className="max-w-xs text-base leading-relaxed text-white/55">
            Toda a sua operação audiovisual em um só lugar — pauta, escalas, recursos e programas.
          </p>
        </div>
      </div>

      {/* ── Painel direito: Card de login ──────────────────────────────────── */}
      <div className="relative flex w-full flex-col items-center justify-center bg-background px-6 py-10 lg:w-[440px] lg:min-w-[440px] lg:shadow-[-32px_0_80px_rgba(0,0,0,0.25)]">
        {/* Controles de tema e idioma */}
        <div className="absolute right-4 top-4 flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {!mounted || theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span className="sr-only">Alternar tema</span>
          </Button>
          <LanguageSelector variant="ghost" />
        </div>

        <div className="w-full max-w-sm">
          {/* Ícone de app + Título */}
          <div className="mb-8 text-center">
            <div className="mb-5 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-violet-600 to-orange-500 shadow-lg shadow-violet-500/30">
                <img
                  src={logoSrc}
                  alt="Kreato"
                  className="h-9 w-9 object-contain brightness-0 invert"
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {t('login.welcome')}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Acesse sua conta para entrar no ar
            </p>
          </div>

          {/* Alerta de erro */}
          {errorMessage && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Keycloak SSO */}
          {keycloakEnabled && (
            <>
              <Button
                type="button"
                variant="outline"
                className="mb-4 w-full"
                onClick={handleKeycloakSignIn}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Entrar com Keycloak (SSO)
              </Button>
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>
            </>
          )}

          {/* Formulário */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-5">
            {/* Campo Usuário */}
            <div className="space-y-1.5">
              <Label htmlFor="usuario" className="text-sm font-medium">
                {t('login.user')}
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <Input
                  id="usuario"
                  type="text"
                  placeholder={t('login.user.placeholder')}
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  required
                  autoComplete="username"
                  autoFocus
                  disabled={isLoading}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="senha" className="text-sm font-medium">
                  {t('login.password')}
                </Label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  tabIndex={-1}
                >
                  Esqueci a senha
                </button>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <Input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('login.password.placeholder')}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pl-9 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground transition-colors hover:text-foreground"
                  tabIndex={-1}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Manter conectado */}
            <div className="flex items-center gap-2.5">
              <Checkbox
                id="manter"
                checked={manterConectado}
                onCheckedChange={(v) => setManterConectado(Boolean(v))}
                disabled={isLoading}
              />
              <Label
                htmlFor="manter"
                className="cursor-pointer text-sm font-normal text-muted-foreground"
              >
                Manter conectado
              </Label>
            </div>

            {/* Botão de submit */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 via-violet-600 to-violet-700 text-white shadow-md shadow-violet-500/20 hover:opacity-95 hover:shadow-violet-500/30"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('login.loading')}
                </>
              ) : (
                <>
                  {t('login.submit')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 space-y-3 border-t border-border/50 pt-6">
            <p className="text-center text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground/70">
              Desenvolvido por <span className="text-muted-foreground">Planora Tech</span>
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5">
                <p className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground/60">
                  Versão
                </p>
                <p className="mt-0.5 font-mono text-[12px] font-medium text-foreground/75">
                  {APP_METADATA.version}
                </p>
              </div>
              <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5">
                <p className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground/60">
                  Release
                </p>
                <p className="mt-0.5 font-mono text-[12px] font-medium text-foreground/75">
                  {APP_METADATA.release}
                </p>
              </div>
              <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5">
                <p className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground/60">
                  Última pub.
                </p>
                <p className="mt-0.5 text-[12px] font-medium text-foreground/75">
                  {APP_METADATA.publishedAt}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
