import { Link, useLocation } from 'react-router-dom';
import {
  Video,
  Users,
  Building2,
  LayoutDashboard,
  LogOut,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import kreatoLogo from '@/assets/kreato-logo.png';

interface ModuleItemData {
  labelKey: string;
  label?: string;
  icon: React.ElementType;
  path: string;
  permission?: { modulo: string };
  globalOnly?: boolean;
}

const getModuleItems = (isGlobalAdmin: boolean): ModuleItemData[] => [
  {
    labelKey: 'menu.dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    permission: { modulo: 'Dashboard' },
  },
  ...(isGlobalAdmin
    ? [
        {
          labelKey: 'menu.global',
          label: 'Global',
          icon: Globe,
          path: '/module/global',
          globalOnly: true,
        },
      ]
    : []),
  {
    labelKey: 'menu.production',
    icon: Video,
    path: '/module/producao',
    permission: { modulo: 'Produção' },
  },
  {
    labelKey: 'menu.resources',
    icon: Users,
    path: '/module/recursos',
    permission: { modulo: 'Recursos' },
  },
  {
    labelKey: 'menu.admin',
    icon: Building2,
    path: '/module/admin',
    permission: { modulo: 'Administração' },
  },
];

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { isVisible } = usePermissions();
  const location = useLocation();

  const isGlobalAdmin = user?.role === 'GLOBAL_ADMIN';
  const moduleItems = getModuleItems(isGlobalAdmin);

  const checkPermission = (modulo: string): boolean => {
    if (isGlobalAdmin) return true;
    return isVisible(modulo, '-', '-', '-');
  };

  // Check if current path belongs to a module
  const isModuleActive = (modulePath: string): boolean => {
    if (modulePath === '/dashboard') return location.pathname === '/dashboard';
    // e.g. /module/producao -> check if current path starts with /producao or /module/producao
    const moduleKey = modulePath.replace('/module/', '/');
    return location.pathname.startsWith(modulePath) || location.pathname.startsWith(moduleKey);
  };

  return (
    <aside className="w-64 h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <img src={kreatoLogo} alt="Kreato" className="h-10 object-contain dark:brightness-0 dark:invert" />
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {moduleItems.map((item, idx) => {
          // Check permission
          if (item.permission && !checkPermission(item.permission.modulo)) return null;

          const Icon = item.icon;
          const label = item.label || t(item.labelKey);
          const active = isModuleActive(item.path);

          return (
            <Link
              key={idx}
              to={item.path}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                'hover:bg-sidebar-accent text-sidebar-foreground',
                active && 'bg-sidebar-primary text-sidebar-primary-foreground'
              )}
            >
              <Icon size={20} className="shrink-0" />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 text-sidebar-foreground">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.foto || undefined} alt={user?.nome} />
            <AvatarFallback className="text-sm font-bold bg-accent text-accent-foreground">
              {user?.nome?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.nome}</p>
            <p className="text-xs text-sidebar-foreground/70 truncate">
              {isGlobalAdmin ? 'Global Admin' : user?.perfil}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
            title={t('menu.logout')}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
