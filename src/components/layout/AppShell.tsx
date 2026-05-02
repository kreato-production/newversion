'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Sun, Moon, Globe, Settings, Info, Layers, BookOpen, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppSidebar from './AppSidebar';
import { AppBreadcrumb } from './AppBreadcrumb';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/use-theme';
import { useLanguage, languageLabels, type Language } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const LANGUAGES: Language[] = ['pt', 'en', 'es'];

// Routes that GLOBAL_ADMIN may access (no tenant required)
const GLOBAL_ADMIN_ALLOWED_PREFIXES = [
  '/dashboard',
  '/global',
  '/api-docs',
  '/arquitetura',
  '/sobre',
];

function GlobalAdminGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  // While session is loading, don't render children — prevents tenant-scoped
  // useEffects from firing before we know the user's role.
  if (isLoading) return null;

  if (user?.role !== 'GLOBAL_ADMIN') return <>{children}</>;

  const allowed = GLOBAL_ADMIN_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/'),
  );

  if (allowed) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 text-center px-6">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30">
        <ShieldAlert className="h-7 w-7 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="max-w-sm space-y-1">
        <h2 className="text-lg font-semibold">Acesso restrito</h2>
        <p className="text-sm text-muted-foreground">
          Você está logado como <strong>Administrador Global</strong> e não possui tenant associado.
          Esta página requer um tenant para exibir dados.
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link href="/global/tenants">Gerenciar Tenants</Link>
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const nextThemeLabel = !mounted || theme === 'light' ? t('theme.dark') : t('theme.light');

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Top header bar */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <AppBreadcrumb />

          {/* Settings: theme + language */}
          <div className="ml-auto flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Globe className="h-4 w-4" />
                  <span className="sr-only">{t('language')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {LANGUAGES.map((lang) => (
                  <DropdownMenuItem
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`cursor-pointer gap-2 ${language === lang ? 'bg-accent' : ''}`}
                  >
                    <span className="text-base">{languageLabels[lang].flag}</span>
                    <span>{languageLabels[lang].name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleTheme}
              title={nextThemeLabel}
            >
              {!mounted || theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span className="sr-only">{nextThemeLabel}</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Sistema">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Sistema</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild className="cursor-pointer gap-2">
                  <Link href="/api-docs">
                    <BookOpen className="h-4 w-4" />
                    API
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer gap-2">
                  <Link href="/arquitetura">
                    <Layers className="h-4 w-4" />
                    Arquitetura
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer gap-2">
                  <Link href="/sobre">
                    <Info className="h-4 w-4" />
                    Sobre o Sistema
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-6 animate-fade-in">
          <GlobalAdminGuard>{children}</GlobalAdminGuard>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
