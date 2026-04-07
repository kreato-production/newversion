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
  Settings2,
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

/** Agrupa sub-itens sob um título colapsável (ex: "Parametrizações") */
interface NavSubGroup {
  label: string;
  isGroup: true;
  permission?: { modulo: string };
  children: NavSubItem[];
}

type NavChild = NavSubItem | NavSubGroup;

interface NavItem {
  id: string;
  label: string;
  labelKey?: string;
  icon: React.ElementType;
  path?: string;
  permission?: { modulo: string };
  globalOnly?: boolean;
  children?: NavChild[];
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const getNavItems = (isGlobalAdmin: boolean, t: (k: string) => string): NavItem[] => [
  {
    id: 'dashboard',
    label: t('menu.dashboard'),
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  ...(isGlobalAdmin
    ? [
        {
          id: 'global',
          label: t('menu.global'),
          icon: Globe,
          globalOnly: true as const,
          children: [
            { label: t('menu.globalTenants'), path: '/global/tenants' },
            { label: t('menu.globalUsers'), path: '/global/usuarios' },
          ],
        } satisfies NavItem,
      ]
    : []),
  {
    id: 'producao',
    label: t('menu.production'),
    icon: Video,
    permission: { modulo: 'Produção' },
    children: [
      {
        label: t('menu.programs'),
        path: '/producao/programas',
        permission: { modulo: 'Produção', subModulo1: 'Programas' },
      },
      {
        label: t('menu.content'),
        path: '/producao/conteudo',
        permission: { modulo: 'Produção', subModulo1: 'Conteúdo' },
      },
      {
        label: t('menu.recordings'),
        path: '/producao/gravacao',
        permission: { modulo: 'Produção', subModulo1: 'Gravação' },
      },
      {
        label: t('menu.tasks'),
        path: '/producao/tarefas',
        permission: { modulo: 'Produção', subModulo1: 'Tarefas' },
      },
      {
        label: t('menu.recordingIncidents'),
        path: '/producao/incidencias',
        permission: { modulo: 'Produção', subModulo1: 'Incidências de Gravação' },
      },
      {
        label: t('menu.maps'),
        path: '/producao/mapas',
        permission: { modulo: 'Produção', subModulo1: 'Mapas' },
      },
      {
        label: t('menu.parameters'),
        isGroup: true,
        children: [
          {
            label: t('menu.recordingTypes'),
            path: '/producao/tipos-gravacao',
            permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Tipo de gravação' },
          },
          {
            label: t('menu.classification'),
            path: '/producao/classificacao',
            permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Classificação' },
          },
          {
            label: t('menu.recordingStatus'),
            path: '/producao/status',
            permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Status de Gravação' },
          },
          {
            label: t('menu.taskStatus'),
            path: '/producao/status-tarefa',
            permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Status da Tarefa' },
          },
          {
            label: t('menu.priceTables'),
            path: '/producao/tabelas-preco',
            permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Tabelas de Preços' },
          },
          {
            label: t('menu.incidentCategories'),
            path: '/producao/categorias-incidencia',
            permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Categorias de Incidência' },
          },
          {
            label: t('menu.incidentSeverities'),
            path: '/producao/severidades-incidencia',
            permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Severidades de Incidência' },
          },
          {
            label: t('menu.incidentImpacts'),
            path: '/producao/impactos-incidencia',
            permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Impactos de Incidência' },
          },
        ],
      } satisfies NavSubGroup,
    ],
  },
  {
    id: 'recursos',
    label: t('menu.resources'),
    icon: Users,
    permission: { modulo: 'Recursos' },
    children: [
      {
        label: t('menu.humanResources'),
        path: '/recursos/humanos',
        permission: { modulo: 'Recursos', subModulo1: 'Recursos Humanos' },
      },
      {
        label: t('menu.technicalResources'),
        path: '/recursos/tecnicos',
        permission: { modulo: 'Recursos', subModulo1: 'Recursos Técnicos' },
      },
      {
        label: t('menu.physicalResources'),
        path: '/recursos/fisicos',
        permission: { modulo: 'Recursos', subModulo1: 'Recursos Físicos' },
      },
      {
        label: t('menu.suppliers'),
        path: '/recursos/fornecedores',
        permission: { modulo: 'Recursos', subModulo1: 'Fornecedores' },
      },
      {
        label: t('menu.people'),
        path: '/recursos/pessoas',
        permission: { modulo: 'Recursos', subModulo1: 'Pessoas' },
      },
      {
        label: t('menu.parameters'),
        isGroup: true,
        children: [
          {
            label: t('menu.material'),
            path: '/recursos/material',
            permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Material' },
          },
          {
            label: t('menu.costumeType'),
            path: '/recursos/tipo-figurino',
            permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Tipo de Figurino' },
          },
          {
            label: t('menu.peopleClassification'),
            path: '/recursos/classificacao-pessoas',
            permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Classificação de Pessoas' },
          },
          {
            label: t('menu.supplierCategory'),
            path: '/recursos/categoria-fornecedores',
            permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Categoria de Fornecedores' },
          },
          {
            label: t('menu.services'),
            path: '/recursos/servicos',
            permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Serviços' },
          },
          {
            label: t('menu.departments'),
            path: '/recursos/departamentos',
            permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Departamentos' },
          },
          {
            label: t('menu.functions'),
            path: '/recursos/funcoes',
            permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Funções' },
          },
          {
            label: t('menu.holidays'),
            path: '/recursos/feriados',
            permission: { modulo: 'Recursos', subModulo1: 'Parametrizacoes', subModulo2: 'Feriados' },
          },
          {
            label: t('menu.positions'),
            path: '/recursos/cargos',
            permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Cargos' },
          },
          {
            label: t('menu.teams'),
            path: '/recursos/equipes',
            permission: { modulo: 'Recursos', subModulo1: 'Equipes' },
          },
          {
            label: t('menu.costumes'),
            path: '/recursos/figurinos',
            permission: { modulo: 'Recursos', subModulo1: 'Figurinos' },
          },
        ],
      } satisfies NavSubGroup,
    ],
  },
  {
    id: 'financeiro',
    label: t('menu.financeiro'),
    icon: Settings2,
    permission: { modulo: 'Financeiro' },
    children: [
      {
        label: t('menu.contasAPagar'),
        path: '/financeiro/contas-a-pagar',
        permission: { modulo: 'Financeiro', subModulo1: 'Contas a Pagar' },
      },
      {
        label: t('menu.apropriacaoCustos'),
        path: '/financeiro/apropriacoes-custo',
        permission: { modulo: 'Financeiro', subModulo1: 'Apropriação de Custos' },
      },
      {
        label: t('menu.parameters'),
        isGroup: true,
        children: [
          {
            label: t('menu.statusContasPagar'),
            path: '/financeiro/status-contas-pagar',
          },
          {
            label: t('menu.tiposDocumentos'),
            path: '/financeiro/tipos-documentos',
          },
          {
            label: t('menu.tiposPagamento'),
            path: '/financeiro/tipos-pagamento',
          },
          {
            label: t('menu.categoriasDespesa'),
            path: '/financeiro/categorias-despesa',
          },
          {
            label: t('menu.formasPagamento'),
            path: '/financeiro/formas-pagamento',
          },
        ],
      } satisfies NavSubGroup,
    ],
  },
  {
    id: 'admin',
    label: t('menu.admin'),
    icon: Building2,
    permission: { modulo: 'Administração' },
    children: [
      {
        label: t('menu.businessUnits'),
        path: '/admin/unidades',
        permission: { modulo: 'Administração', subModulo1: 'Unidades de Negócio' },
      },
      {
        label: t('menu.profitCenters'),
        path: '/admin/centros-lucro',
        permission: { modulo: 'Administração', subModulo1: 'Centros de Custos' },
      },
      {
        label: t('menu.users'),
        path: '/admin/usuarios',
        permission: { modulo: 'Administração', subModulo1: 'Usuários' },
      },
      {
        label: t('menu.accessProfiles'),
        path: '/admin/perfis',
        permission: { modulo: 'Administração', subModulo1: 'Perfis de Acesso' },
      },
      {
        label: t('menu.forms'),
        path: '/admin/formularios',
        permission: { modulo: 'Administração', subModulo1: 'Formulários' },
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSubGroup(child: NavChild): child is NavSubGroup {
  return 'isGroup' in child && child.isGroup === true;
}

function allPaths(children: NavChild[]): string[] {
  return children.flatMap((c) =>
    isSubGroup(c) ? c.children.map((sc) => sc.path) : [c.path],
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { isVisible } = usePermissions();
  const { activeUnit, units, switchUnit } = useWorkspace();
  const pathname = usePathname();

  const isGlobalAdmin = user?.role === 'GLOBAL_ADMIN';
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
    return (
      allPaths(item.children ?? []).some(
        (p) => pathname === p || pathname.startsWith(p + '/'),
      )
    );
  };

  const isPathActive = (path: string) =>
    pathname === path || pathname.startsWith(path + '/');

  return (
    <Sidebar collapsible="icon">
      {/* ── Workspace switcher ── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {units.length <= 1 ? (
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
                                              <Link href={subChild.path}>
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
                                  <Link href={subChild.path}>
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
