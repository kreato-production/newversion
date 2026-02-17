import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
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
  LayoutDashboard,
  LogOut,
  Map,
  Landmark,
  Film,
  Contact,
  Tag,
  Shirt,
  ListTodo,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import kreatoLogo from '@/assets/kreato-logo.png';

interface MenuItemData {
  labelKey: string;
  icon: React.ElementType;
  path?: string;
  children?: MenuItemData[];
  // Permissão: modulo, subModulo1, subModulo2
  permission?: {
    modulo: string;
    subModulo1?: string;
    subModulo2?: string;
  };
}

const getMenuItems = (): MenuItemData[] => [
  {
    labelKey: 'menu.dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    permission: { modulo: 'Dashboard' },
  },
  {
    labelKey: 'menu.production',
    icon: Video,
    permission: { modulo: 'Produção' },
    children: [
      { labelKey: 'menu.content', icon: Film, path: '/producao/conteudo', permission: { modulo: 'Produção', subModulo1: 'Conteúdo' } },
      { labelKey: 'menu.recordings', icon: Video, path: '/producao/gravacao', permission: { modulo: 'Produção', subModulo1: 'Gravação' } },
      { labelKey: 'menu.tasks', icon: ListTodo, path: '/producao/tarefas', permission: { modulo: 'Produção', subModulo1: 'Tarefas' } },
      { labelKey: 'menu.maps', icon: Map, path: '/producao/mapas', permission: { modulo: 'Produção', subModulo1: 'Mapas' } },
      {
        labelKey: 'menu.parameters',
        icon: Settings,
        permission: { modulo: 'Produção', subModulo1: 'Parametrizações' },
        children: [
          { labelKey: 'menu.recordingTypes', icon: Settings, path: '/producao/tipos-gravacao', permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Tipo de gravação' } },
          { labelKey: 'menu.classification', icon: Settings, path: '/producao/classificacao', permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Classificação' } },
          { labelKey: 'menu.recordingStatus', icon: Settings, path: '/producao/status', permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Status de Gravação' } },
          { labelKey: 'menu.taskStatus', icon: Settings, path: '/producao/status-tarefa', permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Status da Tarefa' } },
          { labelKey: 'menu.priceTables', icon: Settings, path: '/producao/tabelas-preco', permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Tabelas de Preços' } },
          { labelKey: 'menu.incidentCategories', icon: Settings, path: '/producao/categorias-incidencia', permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Categorias de Incidência' } },
          { labelKey: 'menu.incidentSeverities', icon: Settings, path: '/producao/severidades-incidencia', permission: { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Severidades de Incidência' } },
        ],
      },
    ],
  },
  {
    labelKey: 'menu.resources',
    icon: Users,
    permission: { modulo: 'Recursos' },
    children: [
      { labelKey: 'menu.humanResources', icon: Users, path: '/recursos/humanos', permission: { modulo: 'Recursos', subModulo1: 'Recursos Humanos' } },
      { labelKey: 'menu.technicalResources', icon: Wrench, path: '/recursos/tecnicos', permission: { modulo: 'Recursos', subModulo1: 'Recursos Técnicos' } },
      { labelKey: 'menu.physicalResources', icon: MapPin, path: '/recursos/fisicos', permission: { modulo: 'Recursos', subModulo1: 'Recursos Físicos' } },
      { labelKey: 'menu.suppliers', icon: Truck, path: '/recursos/fornecedores', permission: { modulo: 'Recursos', subModulo1: 'Fornecedores' } },
      { labelKey: 'menu.people', icon: Contact, path: '/recursos/pessoas', permission: { modulo: 'Recursos', subModulo1: 'Pessoas' } },
      { labelKey: 'menu.costumes', icon: Shirt, path: '/recursos/figurinos', permission: { modulo: 'Recursos', subModulo1: 'Figurinos' } },
      { labelKey: 'menu.teams', icon: Users, path: '/recursos/equipes', permission: { modulo: 'Recursos', subModulo1: 'Equipes' } },
      {
        labelKey: 'menu.parameters',
        icon: FolderCog,
        permission: { modulo: 'Recursos', subModulo1: 'Parametrizações' },
        children: [
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
  {
    labelKey: 'menu.admin',
    icon: Building2,
    permission: { modulo: 'Administração' },
    children: [
      { labelKey: 'menu.businessUnits', icon: Building2, path: '/admin/unidades', permission: { modulo: 'Administração', subModulo1: 'Unidades de Negócio' } },
      { labelKey: 'menu.profitCenters', icon: Landmark, path: '/admin/centros-lucro', permission: { modulo: 'Administração', subModulo1: 'Centros de Lucro' } },
      { labelKey: 'menu.users', icon: UserCog, path: '/admin/usuarios', permission: { modulo: 'Administração', subModulo1: 'Usuários' } },
      { labelKey: 'menu.accessProfiles', icon: Shield, path: '/admin/perfis', permission: { modulo: 'Administração', subModulo1: 'Perfis de Acesso' } },
      { labelKey: 'menu.forms', icon: FileText, path: '/admin/formularios', permission: { modulo: 'Administração', subModulo1: 'Formulários' } },
    ],
  },
];

const MenuItemComponent = ({
  item,
  level = 0,
  checkPermission,
}: {
  item: MenuItemData;
  level?: number;
  checkPermission: (modulo: string, subModulo1?: string, subModulo2?: string) => boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();
  
  // Verifica permissão do item
  if (item.permission) {
    const { modulo, subModulo1, subModulo2 } = item.permission;
    if (!checkPermission(modulo, subModulo1, subModulo2)) {
      return null;
    }
  }
  
  // Filtra children visíveis
  const visibleChildren = item.children?.filter((child) => {
    if (!child.permission) return true;
    const { modulo, subModulo1, subModulo2 } = child.permission;
    return checkPermission(modulo, subModulo1, subModulo2);
  });
  
  const hasChildren = visibleChildren && visibleChildren.length > 0;
  const isActive = item.path === location.pathname;
  const Icon = item.icon;

  const isChildActive = (items: MenuItemData[]): boolean => {
    return items.some((child) => {
      if (child.path === location.pathname) return true;
      if (child.children) return isChildActive(child.children);
      return false;
    });
  };

  const isParentActive = hasChildren && visibleChildren ? isChildActive(visibleChildren) : false;

  // Se tem children mas nenhum visível, não renderiza o pai
  if (item.children && item.children.length > 0 && (!visibleChildren || visibleChildren.length === 0)) {
    return null;
  }

  return (
    <div>
      {hasChildren ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
            'hover:bg-sidebar-accent text-sidebar-foreground',
            isParentActive && 'bg-sidebar-accent',
            level > 0 && 'text-sm'
          )}
          style={{ paddingLeft: `${12 + level * 16}px` }}
        >
          <Icon size={level === 0 ? 20 : 16} className="shrink-0" />
          <span className="flex-1 text-left font-medium">{t(item.labelKey)}</span>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      ) : (
        <Link
          to={item.path || '#'}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
            'hover:bg-sidebar-accent text-sidebar-foreground',
            isActive && 'bg-sidebar-primary text-sidebar-primary-foreground',
            level > 0 && 'text-sm'
          )}
          style={{ paddingLeft: `${12 + level * 16}px` }}
        >
          <Icon size={level === 0 ? 20 : 16} className="shrink-0" />
          <span className="font-medium">{t(item.labelKey)}</span>
        </Link>
      )}
      
      {hasChildren && isOpen && (
        <div className="mt-1 space-y-1">
          {visibleChildren?.map((child, idx) => (
            <MenuItemComponent key={idx} item={child} level={level + 1} checkPermission={checkPermission} />
          ))}
        </div>
      )}
    </div>
  );
};

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { isVisible } = usePermissions();
  const menuItems = getMenuItems();

  // Função para verificar permissão
  const checkPermission = (modulo: string, subModulo1?: string, subModulo2?: string): boolean => {
    return isVisible(modulo, subModulo1 || '-', subModulo2 || '-', '-');
  };

  return (
    <aside className="w-64 h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <img src={kreatoLogo} alt="Kreato" className="h-10 object-contain dark:brightness-0 dark:invert" />
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item, idx) => (
          <MenuItemComponent key={idx} item={item} checkPermission={checkPermission} />
        ))}
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
            <p className="text-xs text-sidebar-foreground/70 truncate">{user?.perfil}</p>
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
