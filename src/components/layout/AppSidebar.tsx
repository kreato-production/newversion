'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Video,
  Users,
  Building2,
  LayoutDashboard,
  LogOut,
  Globe,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Check,
  Building,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspace } from '@/hooks/useWorkspace';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import kreatoLogo from '@/assets/kreato-logo.png';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavSubItem {
  label: string;
  path: string;
  permission?: { modulo: string; subModulo1?: string; subModulo2?: string };
}

interface NavItem {
  id: string;
  label: string;
  labelKey?: string;
  icon: React.ElementType;
  // direct link (no children)
  path?: string;
  permission?: { modulo: string };
  globalOnly?: boolean;
  // collapsible group
  children?: NavSubItem[];
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const getNavItems = (isGlobalAdmin: boolean): NavItem[] => [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  ...(isGlobalAdmin
    ? [
        {
          id: 'global',
          label: 'Global',
          icon: Globe,
          globalOnly: true as const,
          children: [
            { label: 'Tenants', path: '/global/tenants' },
            { label: 'Usuários Globais', path: '/global/usuarios' },
          ],
        } satisfies NavItem,
      ]
    : []),
  {
    id: 'producao',
    label: 'Produção',
    icon: Video,
    permission: { modulo: 'Produção' },
    children: [
      {
        label: 'Programas',
        path: '/producao/programas',
        permission: { modulo: 'Produção', subModulo1: 'Programas' },
      },
      {
        label: 'Conteúdo',
        path: '/producao/conteudo',
        permission: { modulo: 'Produção', subModulo1: 'Conteúdo' },
      },
      {
        label: 'Gravações',
        path: '/producao/gravacao',
        permission: { modulo: 'Produção', subModulo1: 'Gravação' },
      },
      {
        label: 'Tarefas',
        path: '/producao/tarefas',
        permission: { modulo: 'Produção', subModulo1: 'Tarefas' },
      },
      {
        label: 'Incidências',
        path: '/producao/incidencias',
        permission: { modulo: 'Produção', subModulo1: 'Incidências de Gravação' },
      },
      {
        label: 'Mapas',
        path: '/producao/mapas',
        permission: { modulo: 'Produção', subModulo1: 'Mapas' },
      },
      {
        label: 'Tipos de Gravação',
        path: '/producao/tipos-gravacao',
        permission: {
          modulo: 'Produção',
          subModulo1: 'Parametrizações',
          subModulo2: 'Tipo de gravação',
        },
      },
      {
        label: 'Classificação',
        path: '/producao/classificacao',
        permission: {
          modulo: 'Produção',
          subModulo1: 'Parametrizações',
          subModulo2: 'Classificação',
        },
      },
      {
        label: 'Status de Gravação',
        path: '/producao/status',
        permission: {
          modulo: 'Produção',
          subModulo1: 'Parametrizações',
          subModulo2: 'Status de Gravação',
        },
      },
      {
        label: 'Status de Tarefa',
        path: '/producao/status-tarefa',
        permission: {
          modulo: 'Produção',
          subModulo1: 'Parametrizações',
          subModulo2: 'Status da Tarefa',
        },
      },
      {
        label: 'Tabelas de Preço',
        path: '/producao/tabelas-preco',
        permission: {
          modulo: 'Produção',
          subModulo1: 'Parametrizações',
          subModulo2: 'Tabelas de Preços',
        },
      },
      {
        label: 'Cat. de Incidência',
        path: '/producao/categorias-incidencia',
        permission: {
          modulo: 'Produção',
          subModulo1: 'Parametrizações',
          subModulo2: 'Categorias de Incidência',
        },
      },
      {
        label: 'Sev. de Incidência',
        path: '/producao/severidades-incidencia',
        permission: {
          modulo: 'Produção',
          subModulo1: 'Parametrizações',
          subModulo2: 'Severidades de Incidência',
        },
      },
      {
        label: 'Imp. de Incidência',
        path: '/producao/impactos-incidencia',
        permission: {
          modulo: 'Produção',
          subModulo1: 'Parametrizações',
          subModulo2: 'Impactos de Incidência',
        },
      },
    ],
  },
  {
    id: 'recursos',
    label: 'Recursos',
    icon: Users,
    permission: { modulo: 'Recursos' },
    children: [
      {
        label: 'Rec. Humanos',
        path: '/recursos/humanos',
        permission: { modulo: 'Recursos', subModulo1: 'Recursos Humanos' },
      },
      {
        label: 'Rec. Técnicos',
        path: '/recursos/tecnicos',
        permission: { modulo: 'Recursos', subModulo1: 'Recursos Técnicos' },
      },
      {
        label: 'Rec. Físicos',
        path: '/recursos/fisicos',
        permission: { modulo: 'Recursos', subModulo1: 'Recursos Físicos' },
      },
      {
        label: 'Fornecedores',
        path: '/recursos/fornecedores',
        permission: { modulo: 'Recursos', subModulo1: 'Fornecedores' },
      },
      {
        label: 'Pessoas',
        path: '/recursos/pessoas',
        permission: { modulo: 'Recursos', subModulo1: 'Pessoas' },
      },
      {
        label: 'Figurinos',
        path: '/recursos/figurinos',
        permission: { modulo: 'Recursos', subModulo1: 'Figurinos' },
      },
      {
        label: 'Equipes',
        path: '/recursos/equipes',
        permission: { modulo: 'Recursos', subModulo1: 'Equipes' },
      },
      {
        label: 'Cargos',
        path: '/recursos/cargos',
        permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Cargos' },
      },
      {
        label: 'Departamentos',
        path: '/recursos/departamentos',
        permission: {
          modulo: 'Recursos',
          subModulo1: 'Parametrizações',
          subModulo2: 'Departamentos',
        },
      },
      {
        label: 'Funções',
        path: '/recursos/funcoes',
        permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Funções' },
      },
      {
        label: 'Serviços',
        path: '/recursos/servicos',
        permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Serviços' },
      },
      {
        label: 'Cat. Fornecedores',
        path: '/recursos/categoria-fornecedores',
        permission: {
          modulo: 'Recursos',
          subModulo1: 'Parametrizações',
          subModulo2: 'Categoria de Fornecedores',
        },
      },
      {
        label: 'Class. de Pessoas',
        path: '/recursos/classificacao-pessoas',
        permission: {
          modulo: 'Recursos',
          subModulo1: 'Parametrizações',
          subModulo2: 'Classificação de Pessoas',
        },
      },
      {
        label: 'Tipo de Figurino',
        path: '/recursos/tipo-figurino',
        permission: {
          modulo: 'Recursos',
          subModulo1: 'Parametrizações',
          subModulo2: 'Tipo de Figurino',
        },
      },
      {
        label: 'Material',
        path: '/recursos/material',
        permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Material' },
      },
    ],
  },
  {
    id: 'admin',
    label: 'Administração',
    icon: Building2,
    permission: { modulo: 'Administração' },
    children: [
      {
        label: 'Unidades de Negócio',
        path: '/admin/unidades',
        permission: { modulo: 'Administração', subModulo1: 'Unidades de Negócio' },
      },
      {
        label: 'Centros de Custos',
        path: '/admin/centros-lucro',
        permission: { modulo: 'Administração', subModulo1: 'Centros de Custos' },
      },
      {
        label: 'Usuários',
        path: '/admin/usuarios',
        permission: { modulo: 'Administração', subModulo1: 'Usuários' },
      },
      {
        label: 'Perfis de Acesso',
        path: '/admin/perfis',
        permission: { modulo: 'Administração', subModulo1: 'Perfis de Acesso' },
      },
      {
        label: 'Formulários',
        path: '/admin/formularios',
        permission: { modulo: 'Administração', subModulo1: 'Formulários' },
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { isVisible } = usePermissions();
  const { activeUnit, units, switchUnit } = useWorkspace();
  const pathname = usePathname();

  const isGlobalAdmin = user?.role === 'GLOBAL_ADMIN';
  const navItems = getNavItems(isGlobalAdmin);

  const logoSrc = typeof kreatoLogo === 'string' ? kreatoLogo : kreatoLogo.src;
  const userInitial = user?.nome?.charAt(0)?.toUpperCase() ?? 'U';
  const userLabel = isGlobalAdmin ? 'Global Admin' : (user?.perfil ?? '');

  // Check module-level permission
  const canSeeModule = (item: NavItem): boolean => {
    if (item.globalOnly) return isGlobalAdmin;
    if (!item.permission) return true;
    if (isGlobalAdmin) return true;
    return isVisible(item.permission.modulo, '-', '-', '-');
  };

  // Check sub-item permission
  const canSeeSubItem = (sub: NavSubItem): boolean => {
    if (!sub.permission) return true;
    if (isGlobalAdmin) return true;
    const { modulo, subModulo1, subModulo2 } = sub.permission;
    return isVisible(modulo, subModulo1 ?? '-', subModulo2 ?? '-', '-');
  };

  // Whether any child under a module path is currently active
  const isModuleActive = (item: NavItem): boolean => {
    if (item.path) return pathname === item.path;
    return (
      item.children?.some((c) => pathname === c.path || pathname.startsWith(c.path + '/')) ?? false
    );
  };

  return (
    <Sidebar collapsible="icon">
      {/* ── Workspace switcher ── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {units.length <= 1 ? (
              // Single unit or no units — static brand display
              <SidebarMenuButton
                size="lg"
                asChild
                className="hover:bg-transparent active:bg-transparent"
              >
                <Link href="/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary shrink-0">
                    <img
                      src={logoSrc}
                      alt="Kreato"
                      className="h-5 w-5 object-contain dark:brightness-0 dark:invert"
                    />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-sidebar-foreground">
                      {activeUnit?.nome ?? 'Kreato'}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/60">Produção</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            ) : (
              // Multiple units — dropdown switcher
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    tooltip={activeUnit?.nome ?? 'Selecionar unidade'}
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary shrink-0">
                      <img
                        src={logoSrc}
                        alt="Kreato"
                        className="h-5 w-5 object-contain dark:brightness-0 dark:invert"
                      />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{activeUnit?.nome ?? 'Kreato'}</span>
                      <span className="truncate text-xs text-sidebar-foreground/60">Produção</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 shrink-0" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  align="start"
                  side="bottom"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Unidades de Negócio
                  </DropdownMenuLabel>
                  {units.map((unit) => (
                    <DropdownMenuItem
                      key={unit.id}
                      onClick={() => switchUnit(unit.id)}
                      className="cursor-pointer gap-2"
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border bg-background shrink-0">
                        <Building className="size-3.5 shrink-0" />
                      </div>
                      <span className="flex-1 truncate">{unit.nome}</span>
                      {activeUnit?.id === unit.id && (
                        <Check className="ml-auto size-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
                        <Link href={item.path}>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                // Collapsible group
                const visibleChildren = (item.children ?? []).filter(canSeeSubItem);
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
                          {visibleChildren.map((child) => (
                            <SidebarMenuSubItem key={child.path}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={
                                  pathname === child.path || pathname.startsWith(child.path + '/')
                                }
                              >
                                <Link href={child.path}>
                                  <span>{child.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
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
