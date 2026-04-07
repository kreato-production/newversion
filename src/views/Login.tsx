'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, LogIn, Loader2, Sun, Moon, AlertCircle } from 'lucide-react';
import { LanguageSelector } from '@/components/shared/LanguageSelector';
import { useTheme } from '@/hooks/use-theme';
import kreatoLogo from '@/assets/kreato-logo.png';

// Mapeia os erros do Auth.js para mensagens legíveis em PT-BR
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

  const { status } = useSession();
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get('from') || '/dashboard';
  // Auth.js passa o erro como ?error= na URL ao redirecionar para /login
  const oauthError = searchParams.get('error');
  const errorMessage = getErrorMessage(oauthError);

  const logoSrc = typeof kreatoLogo === 'string' ? kreatoLogo : kreatoLogo.src;
  const keycloakEnabled =
    process.env.NEXT_PUBLIC_KEYCLOAK_AUTH_ENABLED === 'true' &&
    !!process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;

  // Sessão já existe — redireciona fora do render (useEffect)
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(redirectTo);
    }
  }, [status, router, redirectTo]);

  // Enquanto verifica a sessão ou aguarda redirect
  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // signIn com redirect: false para capturar erros sem navegar
    const result = await signIn('credentials', {
      usuario,
      password: senha,
      redirect: false,
    });

    if (result?.error) {
      // Auth.js retorna o tipo do erro em result.error
      router.replace(`/login?from=${encodeURIComponent(redirectTo)}&error=${result.error}`);
    } else if (result?.ok) {
      router.replace(redirectTo);
    }

    setIsLoading(false);
  };

  const handleKeycloakSignIn = async () => {
    setIsKeycloakLoading(true);
    // signIn com Keycloak redireciona diretamente — não retorna
    await signIn('keycloak', { callbackUrl: redirectTo });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Controles de tema e idioma */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span className="sr-only">Alternar tema</span>
        </Button>
        <LanguageSelector variant="ghost" />
      </div>

      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <img
                src={logoSrc}
                alt="Kreato"
                className="h-14 object-contain dark:brightness-0 dark:invert"
              />
            </div>
            <CardTitle className="text-xl">{t('login.welcome')}</CardTitle>
            <CardDescription>{t('login.subtitle')}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Erro de autenticação (Auth.js ou OAuth callback) */}
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Login com Keycloak (SSO corporativo) */}
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

            {/* Login com credenciais (username + password) */}
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usuario">{t('login.user')}</Label>
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
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
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
        </Card>
      </div>
    </div>
  );
};

export default Login;
