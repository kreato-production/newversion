import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import {
  Settings,
  Users,
  Building2,
  Truck,
  Briefcase,
  UserCog,
  Shield,
  Contact,
  Tag,
  Shirt,
  Globe,
  Layers,
  CheckSquare,
  BarChart3,
  Target,
} from 'lucide-react';

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

const moduleConfig: Record<string, { titleKey: string; groups: SubModuleGroup[] }> = {
  producao: {
    titleKey: 'menu.production',
    groups: [
      {
        title: 'Produção',
        titleKey: 'menu.production',
        items: [
          { labelKey: 'menu.programs', svgIcon: iconProgramas, path: '/producao/programas', permission: { modulo: 'Produção', subModulo1: 'Programas' } },
          { labelKey: 'menu.content', svgIcon: iconConteudo, path: '/producao/conteudo', permission: { modulo: 'Produção', subModulo1: 'Conteúdo' } },
          { labelKey: 'menu.recordings', svgIcon: iconGravacoes, path: '/producao/gravacao', permission: { modulo: 'Produção', subModulo1: 'Gravação' } },
          { labelKey: 'menu.tasks', svgIcon: iconTarefas, path: '/producao/tarefas', permission: { modulo: 'Produção', subModulo1: 'Tarefas' } },
          { labelKey: 'menu.recordingIncidents', svgIcon: iconIncidencias, path: '/producao/incidencias', permission: { modulo: 'Produção', subModulo1: 'Incidências de Gravação' } },
          { labelKey: 'menu.maps', svgIcon: iconMapas, path: '/producao/mapas', permission: { modulo: 'Produção', subModulo1: 'Mapas' } },
        ],
      },
      {
        title: 'Parametrizações',
        titleKey: 'menu.parameters',
        items: [
          { labelKey: 'menu.recordingTypes', icon: Layers, path: '/producao/tipos-gravacao', permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Tipo de gravação' } },
          { labelKey: 'menu.classification', icon: Tag, path: '/producao/classificacao', permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Classificação' } },
          { labelKey: 'menu.recordingStatus', icon: CheckSquare, path: '/producao/status', permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Status de Gravação' } },
          { labelKey: 'menu.taskStatus', icon: CheckSquare, path: '/producao/status-tarefa', permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Status da Tarefa' } },
          { labelKey: 'menu.priceTables', svgIcon: iconTabelaPrecos, path: '/producao/tabelas-preco', permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Tabelas de Preços' } },
          { labelKey: 'menu.incidentCategories', icon: BarChart3, path: '/producao/categorias-incidencia', permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Categorias de Incidência' } },
          { labelKey: 'menu.incidentSeverities', svgIcon: iconSeveridadeIncidencias, path: '/producao/severidades-incidencia', permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Severidades de Incidência' } },
          { labelKey: 'menu.incidentImpacts', icon: Target, path: '/producao/impactos-incidencia', permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Impactos de Incidência' } },
        ],
      },
    ],
  },
  recursos: {
    titleKey: 'menu.resources',
    groups: [
      {
        title: 'Recursos',
        titleKey: 'menu.resources',
        items: [
          { labelKey: 'menu.humanResources', svgIcon: iconRecursosHumanos, path: '/recursos/humanos', permission: { modulo: 'Recursos', subModulo1: 'Recursos Humanos' } },
          { labelKey: 'menu.technicalResources', svgIcon: iconRecursosTecnicos, path: '/recursos/tecnicos', permission: { modulo: 'Recursos', subModulo1: 'Recursos Técnicos' } },
          { labelKey: 'menu.physicalResources', svgIcon: iconRecursosFisicos, path: '/recursos/fisicos', permission: { modulo: 'Recursos', subModulo1: 'Recursos Físicos' } },
          { labelKey: 'menu.suppliers', icon: Truck, path: '/recursos/fornecedores', permission: { modulo: 'Recursos', subModulo1: 'Fornecedores' } },
          { labelKey: 'menu.people', icon: Contact, path: '/recursos/pessoas', permission: { modulo: 'Recursos', subModulo1: 'Pessoas' } },
          { labelKey: 'menu.costumes', icon: Shirt, path: '/recursos/figurinos', permission: { modulo: 'Recursos', subModulo1: 'Figurinos' } },
          { labelKey: 'menu.teams', svgIcon: iconEquipes, path: '/recursos/equipes', permission: { modulo: 'Recursos', subModulo1: 'Equipes' } },
        ],
      },
      {
        title: 'Parametrizações',
        titleKey: 'menu.parameters',
        items: [
          { labelKey: 'menu.positions', icon: Briefcase, path: '/recursos/cargos', permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Cargos' } },
          { labelKey: 'menu.departments', svgIcon: iconDepartamentos, path: '/recursos/departamentos', permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Departamentos' } },
          { labelKey: 'menu.functions', svgIcon: iconFuncoes, path: '/recursos/funcoes', permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Funções' } },
          { labelKey: 'menu.services', svgIcon: iconServicos, path: '/recursos/servicos', permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Serviços' } },
          { labelKey: 'menu.supplierCategory', svgIcon: iconCategoriaFornecedores, path: '/recursos/categoria-fornecedores', permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Categoria de Fornecedores' } },
          { labelKey: 'menu.peopleClassification', icon: Tag, path: '/recursos/classificacao-pessoas', permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Classificação de Pessoas' } },
          { labelKey: 'menu.costumeType', svgIcon: iconTipoFigurino, path: '/recursos/tipo-figurino', permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Tipo de Figurino' } },
          { labelKey: 'menu.material', icon: Settings, path: '/recursos/material', permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Material' } },
        ],
      },
    ],
  },
  admin: {
    titleKey: 'menu.admin',
    groups: [
      {
        title: 'Administração',
        titleKey: 'menu.admin',
        items: [
          { labelKey: 'menu.businessUnits', svgIcon: iconUnidadeNegocio, path: '/admin/unidades', permission: { modulo: 'Administração', subModulo1: 'Unidades de Negócio' } },
          { labelKey: 'menu.profitCenters', svgIcon: iconCentroCustos, path: '/admin/centros-lucro', permission: { modulo: 'Administração', subModulo1: 'Centros de Custos' } },
          { labelKey: 'menu.users', icon: UserCog, path: '/admin/usuarios', permission: { modulo: 'Administração', subModulo1: 'Usuários' } },
          { labelKey: 'menu.accessProfiles', icon: Shield, path: '/admin/perfis', permission: { modulo: 'Administração', subModulo1: 'Perfis de Acesso' } },
          { labelKey: 'menu.forms', svgIcon: iconFormularios, path: '/admin/formularios', permission: { modulo: 'Administração', subModulo1: 'Formulários' } },
        ],
      },
    ],
  },
  global: {
    titleKey: 'menu.global',
    groups: [
      {
        title: 'Global',
        items: [
          { labelKey: 'menu.tenants', label: 'Tenants', icon: Building2, path: '/global/tenants', globalOnly: true },
          { labelKey: 'menu.globalUsers', label: 'Usuários Globais', icon: Users, path: '/global/usuarios', globalOnly: true },
        ],
      },
    ],
  },
};

const ModuleHub = () => {
  const { moduleName } = useParams<{ moduleName: string }>();
  const navigate = useNavigate();
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

  const moduleTitle = t(config.titleKey);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">{moduleTitle}</h1>
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
                  <button
                    key={idx}
                    onClick={() => navigate(item.path)}
                    className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      {item.svgIcon ? (
                        <img src={item.svgIcon} alt={label} className="w-6 h-6" />
                      ) : Icon ? (
                        <Icon className="w-5 h-5 text-primary" />
                      ) : null}
                    </div>
                    <span className="text-xs font-medium text-center text-foreground leading-tight">
                      {label}
                    </span>
                  </button>
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
