import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import {
  Video,
  Settings,
  Users,
  Building2,
  Wrench,
  MapPin,
  Truck,
  Briefcase,
  FolderCog,
  UserCog,
  Shield,
  Map,
  Landmark,
  Film,
  Contact,
  Tag,
  Shirt,
  ListTodo,
  FileText,
  AlertTriangle,
  Globe,
  DollarSign,
  Layers,
  CheckSquare,
  TableProperties,
  BarChart3,
  Flame,
  Target,
} from 'lucide-react';

interface SubModuleItem {
  labelKey: string;
  label?: string;
  icon: React.ElementType;
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
          { labelKey: 'menu.programs', icon: FolderCog, path: '/producao/programas', permission: { modulo: 'Produção', subModulo1: 'Programas' } },
          { labelKey: 'menu.content', icon: Film, path: '/producao/conteudo', permission: { modulo: 'Produção', subModulo1: 'Conteúdo' } },
          { labelKey: 'menu.recordings', icon: Video, path: '/producao/gravacao', permission: { modulo: 'Produção', subModulo1: 'Gravação' } },
          { labelKey: 'menu.tasks', icon: ListTodo, path: '/producao/tarefas', permission: { modulo: 'Produção', subModulo1: 'Tarefas' } },
          { labelKey: 'menu.recordingIncidents', icon: AlertTriangle, path: '/producao/incidencias', permission: { modulo: 'Produção', subModulo1: 'Incidências de Gravação' } },
          { labelKey: 'menu.maps', icon: Map, path: '/producao/mapas', permission: { modulo: 'Produção', subModulo1: 'Mapas' } },
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
          { labelKey: 'menu.priceTables', icon: TableProperties, path: '/producao/tabelas-preco', permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Tabelas de Preços' } },
          { labelKey: 'menu.incidentCategories', icon: BarChart3, path: '/producao/categorias-incidencia', permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Categorias de Incidência' } },
          { labelKey: 'menu.incidentSeverities', icon: Flame, path: '/producao/severidades-incidencia', permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Severidades de Incidência' } },
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
          { labelKey: 'menu.humanResources', icon: Users, path: '/recursos/humanos', permission: { modulo: 'Recursos', subModulo1: 'Recursos Humanos' } },
          { labelKey: 'menu.technicalResources', icon: Wrench, path: '/recursos/tecnicos', permission: { modulo: 'Recursos', subModulo1: 'Recursos Técnicos' } },
          { labelKey: 'menu.physicalResources', icon: MapPin, path: '/recursos/fisicos', permission: { modulo: 'Recursos', subModulo1: 'Recursos Físicos' } },
          { labelKey: 'menu.suppliers', icon: Truck, path: '/recursos/fornecedores', permission: { modulo: 'Recursos', subModulo1: 'Fornecedores' } },
          { labelKey: 'menu.people', icon: Contact, path: '/recursos/pessoas', permission: { modulo: 'Recursos', subModulo1: 'Pessoas' } },
          { labelKey: 'menu.costumes', icon: Shirt, path: '/recursos/figurinos', permission: { modulo: 'Recursos', subModulo1: 'Figurinos' } },
          { labelKey: 'menu.teams', icon: Users, path: '/recursos/equipes', permission: { modulo: 'Recursos', subModulo1: 'Equipes' } },
        ],
      },
      {
        title: 'Parametrizações',
        titleKey: 'menu.parameters',
        items: [
          { labelKey: 'menu.positions', icon: Briefcase, path: '/recursos/cargos', permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Cargos' } },
          { labelKey: 'menu.departments', icon: Building2, path: '/recursos/departamentos', permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Departamentos' } },
          { labelKey: 'menu.functions', icon: Settings, path: '/recursos/funcoes', permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Funções' } },
          { labelKey: 'menu.services', icon: Settings, path: '/recursos/servicos', permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Serviços' } },
          { labelKey: 'menu.supplierCategory', icon: Settings, path: '/recursos/categoria-fornecedores', permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Categoria de Fornecedores' } },
          { labelKey: 'menu.peopleClassification', icon: Tag, path: '/recursos/classificacao-pessoas', permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Classificação de Pessoas' } },
          { labelKey: 'menu.costumeType', icon: Shirt, path: '/recursos/tipo-figurino', permission: { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Tipo de Figurino' } },
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
          { labelKey: 'menu.businessUnits', icon: Building2, path: '/admin/unidades', permission: { modulo: 'Administração', subModulo1: 'Unidades de Negócio' } },
          { labelKey: 'menu.profitCenters', icon: Landmark, path: '/admin/centros-lucro', permission: { modulo: 'Administração', subModulo1: 'Centros de Custos' } },
          { labelKey: 'menu.users', icon: UserCog, path: '/admin/usuarios', permission: { modulo: 'Administração', subModulo1: 'Usuários' } },
          { labelKey: 'menu.accessProfiles', icon: Shield, path: '/admin/perfis', permission: { modulo: 'Administração', subModulo1: 'Perfis de Acesso' } },
          { labelKey: 'menu.forms', icon: FileText, path: '/admin/formularios', permission: { modulo: 'Administração', subModulo1: 'Formulários' } },
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
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-7 h-7 text-primary" />
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
