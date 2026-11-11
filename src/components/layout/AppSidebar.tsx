'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, ChevronRight, ChevronUp, Settings2 } from 'lucide-react';
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import kreatoLogo from '@/assets/kreato-logo.png';
import { useModuleTabs } from './ModuleTabs';
import { getNavItems, isSubGroup, allPaths, type NavItem, type NavSubItem } from './nav-config';

// ─── Component ────────────────────────────────────────────────────────────────

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { isVisible } = usePermissions();
  const pathname = usePathname();
  const moduleTabs = useModuleTabs();
  const linkHref = (path: string) => moduleTabs?.resolveHref(path) ?? path;
  const onLinkClick = () => moduleTabs?.captureActive();

  const isGlobalAdmin = user?.role === 'GLOBAL_ADMIN';
  const _tenantLabel = isGlobalAdmin ? 'Kreato' : (user?.tenantNome ?? 'Kreato');
  const navItems = getNavItems(isGlobalAdmin, t);

  const logoSrc = typeof kreatoLogo === 'string' ? kreatoLogo : kreatoLogo.src;
  const userInitial = user?.nome?.charAt(0)?.toUpperCase() ?? 'U';
  const userLabel = isGlobalAdmin ? 'Global Admin' : (user?.perfil ?? '');

  const canSeeModule = (item: NavItem): boolean => {
    if (item.globalOnly) return isGlobalAdmin;
    if (!item.permission) return true;
    if (isGlobalAdmin) return true;
    return isVisible(item.permission.modulo, '-', '-', '-');
  };

  const canSeeSubItem = (sub: NavSubItem): boolean => {
    if (!sub.permission) return true;
    if (isGlobalAdmin) return true;
    const { modulo, subModulo1, subModulo2 } = sub.permission;
    return isVisible(modulo, subModulo1 ?? '-', subModulo2 ?? '-', '-');
  };

  const isModuleActive = (item: NavItem): boolean => {
    if (item.path) return pathname === item.path;
    return allPaths(item.children ?? []).some(
      (p) => pathname === p || pathname.startsWith(p + '/'),
    );
  };

  const isPathActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <Sidebar collapsible="icon">
      {/* ── Tenant identity ── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-transparent active:bg-transparent"
            >
              <Link href={linkHref('/dashboard')} onClick={onLinkClick}>
                {/* Collapsed icon mode: K icon */}
                <div className="hidden group-data-[collapsible=icon]:flex aspect-square size-8 items-center justify-center rounded-lg shrink-0">
                  <img
                    src={logoSrc}
                    alt="Kreato"
                    className="h-8 w-8 object-contain dark:invert dark:hue-rotate-180"
                  />
                </div>
                {/* Expanded mode: show the full Kreato logo */}
                <img
                  src={logoSrc}
                  alt="Kreato"
                  className="h-9 w-auto object-contain object-left group-data-[collapsible=icon]:hidden dark:invert dark:hue-rotate-180"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Navigation ── */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                if (!canSeeModule(item)) return null;

                const Icon = item.icon;

                // Direct link (Dashboard)
                if (item.path && !item.children) {
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.path}
                        tooltip={item.label}
                      >
                        <Link href={linkHref(item.path)} onClick={onLinkClick}>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                // Collapsible module group
                const children = item.children ?? [];

                // Separate regular items from sub-groups
                const visibleChildren = children.filter((child) => {
                  if (isSubGroup(child)) {
                    return child.children.some(canSeeSubItem);
                  }
                  return canSeeSubItem(child as NavSubItem);
                });

                if (visibleChildren.length === 0) return null;

                const defaultOpen = isModuleActive(item);

                return (
                  <Collapsible
                    key={item.id}
                    asChild
                    defaultOpen={defaultOpen}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.label} isActive={isModuleActive(item)}>
                          <Icon />
                          <span>{item.label}</span>
                          <ChevronRight className="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {visibleChildren.map((child) => {
                            // ── Sub-group (Parametrizações) ──────────────────
                            if (isSubGroup(child)) {
                              const visibleGroupItems = child.children.filter(canSeeSubItem);
                              if (visibleGroupItems.length === 0) return null;

                              const groupActive = visibleGroupItems.some((c) =>
                                isPathActive(c.path),
                              );

                              return (
                                <Collapsible
                                  key={child.label}
                                  defaultOpen={groupActive}
                                  className="group/paramgroup"
                                >
                                  <SidebarMenuSubItem>
                                    <CollapsibleTrigger asChild>
                                      <SidebarMenuSubButton
                                        isActive={groupActive}
                                        className="gap-1.5"
                                      >
                                        <Settings2 className="size-3.5 shrink-0 text-muted-foreground" />
                                        <span>{child.label}</span>
                                        <ChevronRight className="ml-auto size-3 shrink-0 transition-transform duration-200 group-data-[state=open]/paramgroup:rotate-90" />
                                      </SidebarMenuSubButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <SidebarMenuSub>
                                        {visibleGroupItems.map((subChild) => (
                                          <SidebarMenuSubItem key={subChild.path}>
                                            <SidebarMenuSubButton
                                              asChild
                                              isActive={isPathActive(subChild.path)}
                                            >
                                              <Link
                                                href={linkHref(subChild.path)}
                                                onClick={onLinkClick}
                                              >
                                                <span>{subChild.label}</span>
                                              </Link>
                                            </SidebarMenuSubButton>
                                          </SidebarMenuSubItem>
                                        ))}
                                      </SidebarMenuSub>
                                    </CollapsibleContent>
                                  </SidebarMenuSubItem>
                                </Collapsible>
                              );
                            }

                            // ── Regular sub-item ─────────────────────────────
                            const subChild = child as NavSubItem;
                            return (
                              <SidebarMenuSubItem key={subChild.path}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isPathActive(subChild.path)}
                                >
                                  <Link href={linkHref(subChild.path)} onClick={onLinkClick}>
                                    <span>{subChild.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── User footer ── */}
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
                  <ChevronUp className="ml-auto size-4 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem className="gap-2 p-2" disabled>
                  <Avatar className="h-8 w-8 rounded-lg shrink-0">
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
