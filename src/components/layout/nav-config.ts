import type { ElementType } from 'react';
import {
  Video,
  Users,
  Building2,
  LayoutDashboard,
  Globe,
  Settings2,
  Satellite,
  CalendarDays,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavSubItem {
  label: string;
  path: string;
  permission?: { modulo: string; subModulo1?: string; subModulo2?: string };
}

/** Agrupa sub-itens sob um título colapsável (ex: "Parametrizações") */
export interface NavSubGroup {
  label: string;
  isGroup: true;
  permission?: { modulo: string };
  children: NavSubItem[];
}

export type NavChild = NavSubItem | NavSubGroup;

export interface NavItem {
  id: string;
  label: string;
  labelKey?: string;
  icon: ElementType;
  path?: string;
  permission?: { modulo: string };
  globalOnly?: boolean;
  children?: NavChild[];
}

// ─── Nav config ───────────────────────────────────────────────────────────────

export const getNavItems = (isGlobalAdmin: boolean, t: (k: string) => string): NavItem[] => [
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
        label: 'Templates',
        path: '/producao/templates',
        permission: { modulo: 'Produção', subModulo1: 'Templates' },
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
        label: t('menu.programGrid'),
        path: '/producao/grelha-programacao',
        permission: { modulo: 'Produção', subModulo1: 'Grelha de Programação' },
      },
      {
        label: t('menu.parameters'),
        isGroup: true,
        children: [
          {
            label: t('menu.recordingTypes'),
            path: '/producao/tipos-gravacao',
            permission: {
              modulo: 'Produção',
              subModulo1: 'Parametrizações',
              subModulo2: 'Tipo de gravação',
            },
          },
          {
            label: t('menu.classification'),
            path: '/producao/classificacao',
            permission: {
              modulo: 'Produção',
              subModulo1: 'Parametrizações',
              subModulo2: 'Classificação',
            },
          },
          {
            label: t('menu.recordingStatus'),
            path: '/producao/status',
            permission: {
              modulo: 'Produção',
              subModulo1: 'Parametrizações',
              subModulo2: 'Status de Gravação',
            },
          },
          {
            label: t('menu.taskStatus'),
            path: '/producao/status-tarefa',
            permission: {
              modulo: 'Produção',
              subModulo1: 'Parametrizações',
              subModulo2: 'Status da Tarefa',
            },
          },
          {
            label: t('menu.planningStatus'),
            path: '/producao/status-planeamento',
            permission: {
              modulo: 'Produção',
              subModulo1: 'Parametrizações',
              subModulo2: 'Status de Planeamento',
            },
          },
          {
            label: t('menu.priceTables'),
            path: '/producao/tabelas-preco',
            permission: {
              modulo: 'Produção',
              subModulo1: 'Parametrizações',
              subModulo2: 'Tabelas de Preços',
            },
          },
          {
            label: t('menu.incidentCategories'),
            path: '/producao/categorias-incidencia',
            permission: {
              modulo: 'Produção',
              subModulo1: 'Parametrizações',
              subModulo2: 'Categorias de Incidência',
            },
          },
          {
            label: t('menu.incidentSeverities'),
            path: '/producao/severidades-incidencia',
            permission: {
              modulo: 'Produção',
              subModulo1: 'Parametrizações',
              subModulo2: 'Severidades de Incidência',
            },
          },
          {
            label: t('menu.incidentImpacts'),
            path: '/producao/impactos-incidencia',
            permission: {
              modulo: 'Produção',
              subModulo1: 'Parametrizações',
              subModulo2: 'Impactos de Incidência',
            },
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
        label: t('menu.escalas'),
        path: '/recursos/escalas',
        permission: { modulo: 'Recursos', subModulo1: 'Escalas' },
      },
      {
        label: t('menu.spaces'),
        path: '/recursos/espacos',
        permission: { modulo: 'Recursos', subModulo1: 'Espaços' },
      },
      {
        label: t('menu.parameters'),
        isGroup: true,
        children: [
          {
            label: t('menu.material'),
            path: '/recursos/material',
            permission: {
              modulo: 'Recursos',
              subModulo1: 'Parametrizações',
              subModulo2: 'Material',
            },
          },
          {
            label: t('menu.costumeType'),
            path: '/recursos/tipo-figurino',
            permission: {
              modulo: 'Recursos',
              subModulo1: 'Parametrizações',
              subModulo2: 'Tipo de Figurino',
            },
          },
          {
            label: t('menu.peopleClassification'),
            path: '/recursos/classificacao-pessoas',
            permission: {
              modulo: 'Recursos',
              subModulo1: 'Parametrizações',
              subModulo2: 'Classificação de Pessoas',
            },
          },
          {
            label: t('menu.supplierCategory'),
            path: '/recursos/categoria-fornecedores',
            permission: {
              modulo: 'Recursos',
              subModulo1: 'Parametrizações',
              subModulo2: 'Categoria de Fornecedores',
            },
          },
          {
            label: t('menu.services'),
            path: '/recursos/servicos',
            permission: {
              modulo: 'Recursos',
              subModulo1: 'Parametrizações',
              subModulo2: 'Serviços',
            },
          },
          {
            label: t('menu.departments'),
            path: '/recursos/departamentos',
            permission: {
              modulo: 'Recursos',
              subModulo1: 'Parametrizações',
              subModulo2: 'Departamentos',
            },
          },
          {
            label: t('menu.functions'),
            path: '/recursos/funcoes',
            permission: {
              modulo: 'Recursos',
              subModulo1: 'Parametrizações',
              subModulo2: 'Funções',
            },
          },
          {
            label: t('menu.holidays'),
            path: '/recursos/feriados',
            permission: {
              modulo: 'Recursos',
              subModulo1: 'Parametrizacoes',
              subModulo2: 'Feriados',
            },
          },
          {
            label: t('menu.shifts'),
            path: '/recursos/turnos',
            permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Turnos' },
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
        label: t('menu.orcamento'),
        path: '/financeiro/orcamento',
        permission: { modulo: 'Financeiro', subModulo1: 'Orçamento' },
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
    id: 'satops',
    label: t('menu.satops'),
    icon: Satellite,
    permission: { modulo: 'SatOps' },
    children: [
      {
        label: t('menu.satopsDashboard'),
        path: '/satops/dashboard',
        permission: { modulo: 'SatOps', subModulo1: 'Dashboard' },
      },
      {
        label: t('menu.satopsJanelas'),
        path: '/satops/janelas',
        permission: { modulo: 'SatOps', subModulo1: 'Janelas' },
      },
      {
        label: t('menu.satopsSatelites'),
        path: '/satops/satelites',
        permission: { modulo: 'SatOps', subModulo1: 'Satélites' },
      },
      {
        label: t('menu.parameters'),
        isGroup: true,
        children: [
          {
            label: t('menu.satopsEstadosEvento'),
            path: '/satops/estados-evento',
            permission: {
              modulo: 'SatOps',
              subModulo1: 'Parametrizações',
              subModulo2: 'Estados de Evento',
            },
          },
          {
            label: t('menu.satopsAlertas'),
            path: '/satops/alertas',
            permission: {
              modulo: 'SatOps',
              subModulo1: 'Parametrizações',
              subModulo2: 'Alertas',
            },
          },
        ],
      } satisfies NavSubGroup,
    ],
  },
  {
    id: 'eventos',
    label: t('menu.eventos'),
    icon: CalendarDays,
    permission: { modulo: 'Gestão de Eventos' },
    children: [
      {
        label: t('menu.eventos.list'),
        path: '/eventos',
        permission: { modulo: 'Gestão de Eventos', subModulo1: 'Eventos' },
      },
      {
        label: t('menu.expositores'),
        path: '/eventos/expositores',
        permission: { modulo: 'Gestão de Eventos', subModulo1: 'Expositores' },
      },
      {
        label: t('menu.suppliers'),
        path: '/eventos/fornecedores',
        permission: { modulo: 'Recursos', subModulo1: 'Fornecedores' },
      },
      {
        label: t('menu.parameters'),
        isGroup: true,
        children: [
          {
            label: t('menu.tipoEvento'),
            path: '/eventos/parametrizacoes/tipo-evento',
            permission: {
              modulo: 'Gestão de Eventos',
              subModulo1: 'Parametrizações',
              subModulo2: 'Tipo de Evento',
            },
          },
          {
            label: t('menu.tipoExpositor'),
            path: '/eventos/parametrizacoes/tipo-expositor',
            permission: {
              modulo: 'Gestão de Eventos',
              subModulo1: 'Parametrizações',
              subModulo2: 'Tipo de Expositor',
            },
          },
          {
            label: t('menu.services'),
            path: '/eventos/parametrizacoes/servicos',
            permission: {
              modulo: 'Recursos',
              subModulo1: 'Parametrizações',
              subModulo2: 'Serviços',
            },
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
      {
        label: t('menu.maestro'),
        path: '/admin/maestro',
        permission: { modulo: 'Administração', subModulo1: 'Maestro' },
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isSubGroup(child: NavChild): child is NavSubGroup {
  return 'isGroup' in child && child.isGroup === true;
}

export function allPaths(children: NavChild[]): string[] {
  return children.flatMap((c) => (isSubGroup(c) ? c.children.map((sc) => sc.path) : [c.path]));
}

export interface NavLink {
  path: string;
  label: string;
  icon: ElementType;
}

/** Flattens the nav tree into `{ path, label, icon }` entries (labels already translated). */
export function flattenNavLinks(items: NavItem[]): NavLink[] {
  return items.flatMap((item) => {
    const own = item.path ? [{ path: item.path, label: item.label, icon: item.icon }] : [];
    const children = (item.children ?? []).flatMap((c) =>
      isSubGroup(c)
        ? c.children.map((sc) => ({ path: sc.path, label: sc.label, icon: item.icon }))
        : [{ path: c.path, label: c.label, icon: item.icon }],
    );
    return [...own, ...children];
  });
}
