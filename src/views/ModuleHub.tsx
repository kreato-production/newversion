'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, CalendarDays } from 'lucide-react';

// Custom SVG icons
import iconProgramas from '@/assets/icons/programas.svg';
import iconConteudo from '@/assets/icons/conteudo.svg';
import iconGravacoes from '@/assets/icons/gravacoes.svg';
import iconTarefas from '@/assets/icons/tarefas.svg';
import iconIncidencias from '@/assets/icons/incidencias.svg';
import iconMapas from '@/assets/icons/mapas.svg';
import iconRecursosHumanos from '@/assets/icons/recursos_humanos.svg';
import iconRecursosFisicos from '@/assets/icons/recursos_fisicos.svg';
import iconRecursosTecnicos from '@/assets/icons/recursos_tecnicos.svg';
import iconFormularios from '@/assets/icons/formularios.svg';
import iconUnidadeNegocio from '@/assets/icons/unidade_negocio.svg';
import iconCentroCustos from '@/assets/icons/centro_custos.svg';
import iconTipoFigurino from '@/assets/icons/tipo_figurino.svg';
import iconCategoriaFornecedores from '@/assets/icons/categoria_fornecedores.svg';
import iconServicos from '@/assets/icons/servicos.svg';
import iconFuncoes from '@/assets/icons/funcoes.svg';
import iconDepartamentos from '@/assets/icons/departamentos.svg';
import iconEquipes from '@/assets/icons/equipes.svg';
import iconSeveridadeIncidencias from '@/assets/icons/severidade_incidencias.svg';
import iconTabelaPrecos from '@/assets/icons/tabela_precos.svg';
import iconFornecedores from '@/assets/icons/fornecedores.svg';
import iconPessoas from '@/assets/icons/pessoas.svg';
import iconFigurinos from '@/assets/icons/figurinos.svg';
import iconCargos from '@/assets/icons/cargos.svg';
import iconClassificacaoPessoas from '@/assets/icons/classificacao_pessoas.svg';
import iconMaterial from '@/assets/icons/material.svg';
import iconTipoGravacao from '@/assets/icons/tipo_gravacao.svg';
import iconStatusGravacao from '@/assets/icons/status_gravacao.svg';
import iconStatusTarefa from '@/assets/icons/status_tarefa.svg';
import iconImpactoIncidencias from '@/assets/icons/impacto_incidencias.svg';
import iconUsuarios from '@/assets/icons/usuarios.svg';
import iconPerfisAcesso from '@/assets/icons/perfis_acesso.svg';
import iconTenant from '@/assets/icons/tenant.svg';
import iconUsuariosGlobais from '@/assets/icons/usuarios_globais.svg';

interface ModuleConfig {
  title: string;
  titleKey?: string;
  groups: SubModuleGroup[];
}

interface SubModuleItem {
  labelKey: string;
  label?: string;
  icon?: React.ElementType;
  svgIcon?: string;
  path: string;
  permission?: {
    modulo: string;
    subModulo1?: string;
    subModulo2?: string;
  };
  globalOnly?: boolean;
}

interface SubModuleGroup {
  title: string;
  titleKey?: string;
  items: SubModuleItem[];
}

const moduleConfig: Record<string, ModuleConfig> = {
  producao: {
    title: 'Produção',
    titleKey: 'menu.production',
    groups: [
      {
        title: 'Produção',
        titleKey: 'menu.production',
        items: [
          {
            labelKey: 'menu.programs',
            svgIcon: iconProgramas,
            path: '/producao/programas',
            permission: { modulo: 'Produção', subModulo1: 'Programas' },
          },
          {
            labelKey: 'menu.content',
            svgIcon: iconConteudo,
            path: '/producao/conteudo',
            permission: { modulo: 'Produção', subModulo1: 'Conteúdo' },
          },
          {
            labelKey: 'menu.recordings',
            svgIcon: iconGravacoes,
            path: '/producao/gravacao',
            permission: { modulo: 'Produção', subModulo1: 'Gravação' },
          },
          {
            labelKey: 'menu.tasks',
            svgIcon: iconTarefas,
            path: '/producao/tarefas',
            permission: { modulo: 'Produção', subModulo1: 'Tarefas' },
          },
          {
            labelKey: 'menu.recordingIncidents',
            svgIcon: iconIncidencias,
            path: '/producao/incidencias',
            permission: { modulo: 'Produção', subModulo1: 'Incidências de Gravação' },
          },
          {
            labelKey: 'menu.maps',
            svgIcon: iconMapas,
            path: '/producao/mapas',
            permission: { modulo: 'Produção', subModulo1: 'Mapas' },
          },
        ],
      },
      {
        title: 'Parametrizações',
        titleKey: 'menu.parameters',
        items: [
          {
            labelKey: 'menu.recordingTypes',
            svgIcon: iconTipoGravacao,
            path: '/producao/tipos-gravacao',
            permission: {
              modulo: 'Produção',
              subModulo1: 'Parametrizações',
              subModulo2: 'Tipo de gravação',
            },
          },
          {
            labelKey: 'menu.classification',
            svgIcon: iconIncidencias,
            path: '/producao/classificacao',
            permission: {
              modulo: 'Produção',
              subModulo1: 'Parametrizações',
              subModulo2: 'Classificação',
            },
          },
          {
            labelKey: 'menu.recordingStatus',
            svgIcon: iconStatusGravacao,
            path: '/producao/status',
            permission: {
              modulo: 'Produção',
              subModulo1: 'Parametrizações',
              subModulo2: 'Status de Gravação',
            },
          },
          {
            labelKey: 'menu.taskStatus',
            svgIcon: iconStatusTarefa,
            path: '/producao/status-tarefa',
            permission: {
              modulo: 'Produção',
              subModulo1: 'Parametrizações',
              subModulo2: 'Status da Tarefa',
            },
          },
          {
            labelKey: 'menu.priceTables',
            svgIcon: iconTabelaPrecos,
            path: '/producao/tabelas-preco',
            permission: {
              modulo: 'Produção',
              subModulo1: 'Parametrizações',
              subModulo2: 'Tabelas de Preços',
            },
          },
          {
            labelKey: 'menu.incidentCategories',
            svgIcon: iconIncidencias,
            path: '/producao/categorias-incidencia',
            permission: {
              modulo: 'Produção',
              subModulo1: 'Parametrizações',
              subModulo2: 'Categorias de Incidência',
            },
          },
          {
            labelKey: 'menu.incidentSeverities',
            svgIcon: iconSeveridadeIncidencias,
            path: '/producao/severidades-incidencia',
            permission: {
              modulo: 'Produção',
              subModulo1: 'Parametrizações',
              subModulo2: 'Severidades de Incidência',
            },
          },
          {
            labelKey: 'menu.incidentImpacts',
            svgIcon: iconImpactoIncidencias,
            path: '/producao/impactos-incidencia',
            permission: {
              modulo: 'Produção',
              subModulo1: 'Parametrizações',
              subModulo2: 'Impactos de Incidência',
            },
          },
        ],
      },
    ],
  },
  recursos: {
    title: 'Recursos',
    titleKey: 'menu.resources',
    groups: [
      {
        title: 'Recursos',
        titleKey: 'menu.resources',
        items: [
          {
            labelKey: 'menu.humanResources',
            svgIcon: iconRecursosHumanos,
            path: '/recursos/humanos',
            permission: { modulo: 'Recursos', subModulo1: 'Recursos Humanos' },
          },
          {
            labelKey: 'menu.technicalResources',
            svgIcon: iconRecursosTecnicos,
            path: '/recursos/tecnicos',
            permission: { modulo: 'Recursos', subModulo1: 'Recursos Técnicos' },
          },
          {
            labelKey: 'menu.physicalResources',
            svgIcon: iconRecursosFisicos,
            path: '/recursos/fisicos',
            permission: { modulo: 'Recursos', subModulo1: 'Recursos Físicos' },
          },
          {
            labelKey: 'menu.suppliers',
            svgIcon: iconFornecedores,
            path: '/recursos/fornecedores',
            permission: { modulo: 'Recursos', subModulo1: 'Fornecedores' },
          },
          {
            labelKey: 'menu.people',
            svgIcon: iconPessoas,
            path: '/recursos/pessoas',
            permission: { modulo: 'Recursos', subModulo1: 'Pessoas' },
          },
          {
            labelKey: 'menu.costumes',
            svgIcon: iconFigurinos,
            path: '/recursos/figurinos',
            permission: { modulo: 'Recursos', subModulo1: 'Figurinos' },
          },
          {
            labelKey: 'menu.teams',
            svgIcon: iconEquipes,
            path: '/recursos/equipes',
            permission: { modulo: 'Recursos', subModulo1: 'Equipes' },
          },
        ],
      },
      {
        title: 'Parametrizações',
        titleKey: 'menu.parameters',
        items: [
          {
            labelKey: 'menu.positions',
            svgIcon: iconCargos,
            path: '/recursos/cargos',
            permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Cargos' },
          },
          {
            labelKey: 'menu.departments',
            svgIcon: iconDepartamentos,
            path: '/recursos/departamentos',
            permission: {
              modulo: 'Recursos',
              subModulo1: 'Parametrizações',
              subModulo2: 'Departamentos',
            },
          },
          {
            labelKey: 'menu.functions',
            svgIcon: iconFuncoes,
            path: '/recursos/funcoes',
            permission: {
              modulo: 'Recursos',
              subModulo1: 'Parametrizações',
              subModulo2: 'Funções',
            },
          },
          {
            labelKey: 'menu.holidays',
            icon: CalendarDays,
            path: '/recursos/feriados',
            permission: {
              modulo: 'Recursos',
              subModulo1: 'Parametrizacoes',
              subModulo2: 'Feriados',
            },
          },
          {
            labelKey: 'menu.services',
            svgIcon: iconServicos,
            path: '/recursos/servicos',
            permission: {
              modulo: 'Recursos',
              subModulo1: 'Parametrizações',
              subModulo2: 'Serviços',
            },
          },
          {
            labelKey: 'menu.supplierCategory',
            svgIcon: iconCategoriaFornecedores,
            path: '/recursos/categoria-fornecedores',
            permission: {
              modulo: 'Recursos',
              subModulo1: 'Parametrizações',
              subModulo2: 'Categoria de Fornecedores',
            },
          },
          {
            labelKey: 'menu.peopleClassification',
            svgIcon: iconClassificacaoPessoas,
            path: '/recursos/classificacao-pessoas',
            permission: {
              modulo: 'Recursos',
              subModulo1: 'Parametrizações',
              subModulo2: 'Classificação de Pessoas',
            },
          },
          {
            labelKey: 'menu.costumeType',
            svgIcon: iconTipoFigurino,
            path: '/recursos/tipo-figurino',
            permission: {
              modulo: 'Recursos',
              subModulo1: 'Parametrizações',
              subModulo2: 'Tipo de Figurino',
            },
          },
          {
            labelKey: 'menu.material',
            svgIcon: iconMaterial,
            path: '/recursos/material',
            permission: {
              modulo: 'Recursos',
              subModulo1: 'Parametrizações',
              subModulo2: 'Material',
            },
          },
        ],
      },
    ],
  },
  financeiro: {
    title: 'Financeiro',
    groups: [
      {
        title: 'Parametrizações',
        items: [
          {
            labelKey: 'finance.statusContasPagar',
            label: 'Status de Contas a Pagar',
            icon: Building2,
            path: '/financeiro/status-contas-pagar',
          },
          {
            labelKey: 'finance.tiposDocumentos',
            label: 'Tipos de Documentos',
            icon: Building2,
            path: '/financeiro/tipos-documentos',
          },
          {
            labelKey: 'finance.tiposPagamento',
            label: 'Tipos de Pagamentos',
            icon: Building2,
            path: '/financeiro/tipos-pagamento',
          },
          {
            labelKey: 'finance.categoriasDespesa',
            label: 'Categorias de Despesas',
            icon: Building2,
            path: '/financeiro/categorias-despesa',
          },
          {
            labelKey: 'finance.formasPagamento',
            label: 'Formas de Pagamento',
            icon: Building2,
            path: '/financeiro/formas-pagamento',
          },
        ],
      },
    ],
  },
  admin: {
    title: 'Administração',
    titleKey: 'menu.admin',
    groups: [
      {
        title: 'Administração',
        titleKey: 'menu.admin',
        items: [
          {
            labelKey: 'menu.businessUnits',
            svgIcon: iconUnidadeNegocio,
            path: '/admin/unidades',
            permission: { modulo: 'Administração', subModulo1: 'Unidades de Negócio' },
          },
          {
            labelKey: 'menu.profitCenters',
            svgIcon: iconCentroCustos,
            path: '/admin/centros-lucro',
            permission: { modulo: 'Administração', subModulo1: 'Centros de Custos' },
          },
          {
            labelKey: 'menu.users',
            svgIcon: iconUsuarios,
            path: '/admin/usuarios',
            permission: { modulo: 'Administração', subModulo1: 'Usuários' },
          },
          {
            labelKey: 'menu.accessProfiles',
            svgIcon: iconPerfisAcesso,
            path: '/admin/perfis',
            permission: { modulo: 'Administração', subModulo1: 'Perfis de Acesso' },
          },
          {
            labelKey: 'menu.forms',
            svgIcon: iconFormularios,
            path: '/admin/formularios',
            permission: { modulo: 'Administração', subModulo1: 'Formulários' },
          },
        ],
      },
    ],
  },
  global: {
    title: 'Global',
    titleKey: 'menu.global',
    groups: [
      {
        title: 'Global',
        items: [
          {
            labelKey: 'menu.tenants',
            label: 'Tenants',
            svgIcon: iconTenant,
            path: '/global/tenants',
            globalOnly: true,
          },
          {
            labelKey: 'menu.globalUsers',
            label: 'Usuários Globais',
            svgIcon: iconUsuariosGlobais,
            path: '/global/usuarios',
            globalOnly: true,
          },
        ],
      },
    ],
  },
};

const ModuleHub = () => {
  const params = useParams();
  const moduleName = params?.moduleName as string | undefined;
  const { t } = useLanguage();
  const { isVisible } = usePermissions();
  const { user } = useAuth();

  const isGlobalAdmin = user?.email?.includes('admin_global') || user?.usuario === 'admin_global';

  const config = moduleName ? moduleConfig[moduleName] : null;

  if (!config) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Módulo não encontrado
      </div>
    );
  }

  const checkPermission = (modulo: string, subModulo1?: string, subModulo2?: string): boolean => {
    if (isGlobalAdmin) return true;
    return isVisible(modulo, subModulo1 || '-', subModulo2 || '-', '-');
  };

  const moduleTitle = config.titleKey ? t(config.titleKey) : config.title;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{moduleTitle}</h1>
      </div>

      {config.groups.map((group, groupIdx) => {
        const visibleItems = group.items.filter((item) => {
          if (item.globalOnly) return isGlobalAdmin;
          if (!item.permission) return true;
          const { modulo, subModulo1, subModulo2 } = item.permission;
          return checkPermission(modulo, subModulo1, subModulo2);
        });

        if (visibleItems.length === 0) return null;

        return (
          <div key={groupIdx}>
            <h2 className="text-base font-semibold text-muted-foreground mb-4">
              {group.titleKey ? t(group.titleKey) : group.title}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {visibleItems.map((item, idx) => {
                const Icon = item.icon;
                const label = item.label || t(item.labelKey);
                return (
                  <Link
                    key={idx}
                    href={item.path}
                    className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      {item.svgIcon ? (
                        <img src={item.svgIcon} alt={label} className="w-6 h-6" />
                      ) : Icon ? (
                        <Icon className="w-5 h-5 text-primary" />
                      ) : null}
                    </div>
                    <span className="text-xs font-medium text-center text-foreground group-hover:text-accent-foreground leading-tight transition-colors">
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ModuleHub;
