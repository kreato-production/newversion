'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { AlertCircle, Eye, EyeOff, Loader2, LogIn, Moon, Sun } from 'lucide-react';
import kreatoLogo from '@/assets/kreato-logo.png';
import { LanguageSelector } from '@/components/shared/LanguageSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/use-theme';
import { APP_METADATA } from '@/lib/app-metadata';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: 'Usuario ou senha invalidos.',
  OAuthSignin: 'Erro ao iniciar autenticacao com provedor externo.',
  OAuthCallback: 'Erro no retorno do provedor externo.',
  OAuthCreateAccount: 'Nao foi possivel criar conta via provedor externo.',
  EmailCreateAccount: 'Nao foi possivel criar conta com este e-mail.',
  Callback: 'Erro no fluxo de autenticacao.',
  OAuthAccountNotLinked: 'Esta conta ja esta vinculada a outro metodo de login.',
  SessionRequired: 'Sua sessao expirou. Faca login novamente.',
  Default: 'Erro de autenticacao. Tente novamente.',
};

function getErrorMessage(error: string | null): string | null {
  if (!error) return null;
  return AUTH_ERROR_MESSAGES[error] ?? AUTH_ERROR_MESSAGES.Default;
}

const Login = () => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isKeycloakLoading, setIsKeycloakLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { status } = useSession();
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get('from') || '/dashboard';
  const oauthError = searchParams.get('error');
  const errorMessage = getErrorMessage(oauthError);
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
      router.replace(`/login?from=${encodeURIComponent(redirectTo)}&error=${result.error}`);
    } else if (result?.ok) {
      router.replace(redirectTo);
    }

    setIsLoading(false);
  };

  const handleKeycloakSignIn = async () => {
    setIsKeycloakLoading(true);
    await signIn('keycloak', { callbackUrl: redirectTo });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background: `
              radial-gradient(circle at 12% 18%, hsl(var(--kreato-blue) / 0.20), transparent 30%),
              radial-gradient(circle at 82% 16%, hsl(var(--kreato-cyan) / 0.16), transparent 26%),
              radial-gradient(circle at 50% 100%, hsl(var(--kreato-orange) / 0.14), transparent 34%),
              linear-gradient(180deg, hsl(var(--background)), hsl(var(--background)))
            `,
          }}
        />
        <div
          className="absolute left-[11%] top-[20%] hidden h-56 w-16 rounded-full lg:block"
          style={{
            background:
              'linear-gradient(180deg, hsl(var(--kreato-blue-dark) / 0.82), hsl(var(--kreato-cyan) / 0.34))',
            boxShadow: '0 0 40px hsl(var(--kreato-blue) / 0.14)',
            transform: 'rotate(28deg)',
          }}
        />
        <div
          className="absolute left-[17%] top-[29%] hidden h-36 w-16 rounded-full lg:block"
          style={{
            background:
              'linear-gradient(180deg, hsl(var(--kreato-purple) / 0.58), hsl(var(--kreato-blue) / 0.24))',
            transform: 'rotate(28deg)',
          }}
        />
        <div
          className="absolute left-[20.5%] top-[24%] hidden h-52 w-16 rounded-full lg:block"
          style={{
            background:
              'linear-gradient(180deg, hsl(var(--kreato-orange) / 0.72), hsl(var(--kreato-yellow) / 0.38))',
            boxShadow: '0 0 40px hsl(var(--kreato-orange) / 0.14)',
            transform: 'rotate(28deg)',
          }}
        />
        <div className="absolute inset-x-10 top-10 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute inset-x-10 bottom-10 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
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

      <div className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="w-full max-w-md">
          <Card className="relative overflow-hidden border-border/60 bg-card/92 shadow-2xl backdrop-blur-xl">
            <div className="gradient-brand absolute inset-x-0 top-0 h-1" />
            <div
              className="absolute -right-16 top-10 h-36 w-36 rounded-full blur-3xl"
              style={{ backgroundColor: 'hsl(var(--kreato-cyan) / 0.12)' }}
            />
            <div
              className="absolute -left-12 bottom-6 h-28 w-28 rounded-full blur-3xl"
              style={{ backgroundColor: 'hsl(var(--kreato-orange) / 0.12)' }}
            />

            <CardHeader className="relative pb-2 text-center">
              <div className="mb-3 flex justify-center">
                <div className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.32em] text-muted-foreground shadow-sm">
                  Kreato
                </div>
              </div>

              <div className="mb-4 flex justify-center">
                <div className="rounded-2xl border border-border/60 bg-background/80 px-6 py-4 shadow-sm">
                  <img
                    src={logoSrc}
                    alt="Kreato"
                    className="h-14 object-contain dark:brightness-0 dark:invert"
                  />
                </div>
              </div>

              <CardTitle className="text-xl">{t('login.welcome')}</CardTitle>
              <CardDescription>{t('login.subtitle')}</CardDescription>
            </CardHeader>

            <CardContent className="relative space-y-4">
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              {keycloakEnabled && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleKeycloakSignIn}
                    disabled={isKeycloakLoading}
                  >
                    {isKeycloakLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="mr-2 h-4 w-4" />
                    )}
                    Entrar com Keycloak (SSO)
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">ou</span>
                    </div>
                  </div>
                </>
              )}

              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="usuario">{t('login.user')}</Label>
                  <Input
                    id="usuario"
                    type="text"
                    placeholder={t('login.user.placeholder')}
                    value={usuario}
                    onChange={(event) => setUsuario(event.target.value)}
                    required
                    autoComplete="username"
                    autoFocus
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha">{t('login.password')}</Label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('login.password.placeholder')}
                      value={senha}
                      onChange={(event) => setSenha(event.target.value)}
                      required
                      autoComplete="current-password"
                      className="pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      tabIndex={-1}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="gradient-primary w-full hover:opacity-95"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('login.loading')}
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      {t('login.submit')}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="relative flex-col items-stretch gap-3 border-t border-border/40 bg-muted/10 px-6 py-5">
              <div className="text-center">
                <p className="text-[9px] font-normal uppercase tracking-[0.26em] text-muted-foreground/75">
                  {t('login.developedBy')}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-border/35 bg-background/35 px-3 py-2.5">
                  <p className="text-[9px] font-normal uppercase tracking-[0.18em] text-muted-foreground/70">
                    {t('login.version')}
                  </p>
                  <p className="mt-1 font-mono text-[13px] font-normal text-foreground/80">
                    {APP_METADATA.version}
                  </p>
                </div>

                <div className="rounded-lg border border-border/35 bg-background/35 px-3 py-2.5">
                  <p className="text-[9px] font-normal uppercase tracking-[0.18em] text-muted-foreground/70">
                    {t('login.release')}
                  </p>
                  <p className="mt-1 font-mono text-[13px] font-normal text-foreground/80">
                    {APP_METADATA.release}
                  </p>
                </div>

                <div className="rounded-lg border border-border/35 bg-background/35 px-3 py-2.5">
                  <p className="text-[9px] font-normal uppercase tracking-[0.18em] text-muted-foreground/70">
                    {t('login.lastPublished')}
                  </p>
                  <p className="mt-1 text-[13px] font-normal text-foreground/80">
                    {APP_METADATA.publishedAt}
                  </p>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
