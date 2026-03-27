import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { useLanguage } from '@/contexts/LanguageContext';
import AppSidebar from './AppSidebar';
import { Settings, Sun, Moon, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { languageLabels, Language } from '@/contexts/LanguageContext';
import { PageLoader } from '@/components/shared/PageLoader';

const MainLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

  const languages: Language[] = ['pt', 'en', 'es'];

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto relative">
        {/* Settings dropdown - top right */}
        <div className="absolute top-4 right-4 z-50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Settings className="h-5 w-5" />
                <span className="sr-only">{t('settings')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Theme Toggle */}
              <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer gap-2">
                {theme === 'light' ? (
                  <>
                    <Moon className="h-4 w-4" />
                    {t('theme.dark')}
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4" />
                    {t('theme.light')}
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Language Selector */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2">
                  <Globe className="h-4 w-4" />
                  <span>{t('language')}</span>
                  <span className="ml-auto">{languageLabels[language].flag}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-40">
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`cursor-pointer gap-2 ${language === lang ? 'bg-accent' : ''}`}
                    >
                      <span className="text-lg">{languageLabels[lang].flag}</span>
                      <span>{languageLabels[lang].name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
