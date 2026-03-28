'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Video, Users, Building2, LayoutDashboard, LogOut, Globe, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import kreatoLogo from '@/assets/kreato-logo.png';

interface NavItem {
  labelKey: string;
  label?: string;
  icon: React.ElementType;
  path: string;
  permission?: { modulo: string };
  globalOnly?: boolean;
}

const getNavItems = (isGlobalAdmin: boolean): NavItem[] => [
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
          globalOnly: true as const,
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
  const pathname = usePathname();

  const isGlobalAdmin = user?.role === 'GLOBAL_ADMIN';
  const navItems = getNavItems(isGlobalAdmin);

  const checkPermission = (modulo: string): boolean => {
    if (isGlobalAdmin) return true;
    return isVisible(modulo, '-', '-', '-');
  };

  const isItemActive = (itemPath: string): boolean => {
    if (itemPath === '/dashboard') return pathname === '/dashboard';
    const moduleKey = itemPath.replace('/module/', '/');
    return pathname.startsWith(itemPath) || pathname.startsWith(moduleKey);
  };

  const logoSrc = typeof kreatoLogo === 'string' ? kreatoLogo : kreatoLogo.src;
  const userInitial = user?.nome?.charAt(0)?.toUpperCase() || 'U';
  const userLabel = isGlobalAdmin ? 'Global Admin' : (user?.perfil ?? '');

  return (
    <Sidebar collapsible="icon">
      {/* Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-transparent active:bg-transparent"
            >
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
                  <img
                    src={logoSrc}
                    alt="Kreato"
                    className="h-5 w-5 object-contain dark:brightness-0 dark:invert"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-sidebar-foreground">Kreato</span>
                  <span className="truncate text-xs text-sidebar-foreground/60">Produção</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                if (item.permission && !checkPermission(item.permission.modulo)) return null;

                const Icon = item.icon;
                const label = item.label ?? t(item.labelKey);
                const active = isItemActive(item.path);

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={active} tooltip={label}>
                      <Link href={item.path}>
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg shrink-0">
                    <AvatarImage src={user?.foto ?? undefined} alt={user?.nome} />
                    <AvatarFallback className="rounded-lg bg-accent text-accent-foreground font-bold text-sm">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.nome}</span>
                    <span className="truncate text-xs text-sidebar-foreground/60">{userLabel}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem className="gap-2 p-2" disabled>
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.foto ?? undefined} alt={user?.nome} />
                    <AvatarFallback className="rounded-lg bg-accent text-accent-foreground font-bold">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.nome}</span>
                    <span className="truncate text-xs text-muted-foreground">{userLabel}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="size-4" />
                  {t('menu.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};

export default AppSidebar;
