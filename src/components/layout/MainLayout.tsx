import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import AppSidebar from './AppSidebar';
import { Settings, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const MainLayout = () => {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
                <span className="sr-only">Configurações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer gap-2">
                {theme === 'light' ? (
                  <>
                    <Moon className="h-4 w-4" />
                    Tema Escuro
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4" />
                    Tema Claro
                  </>
                )}
              </DropdownMenuItem>
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
