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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import kreatoLogo from '@/assets/kreato-logo.png';

interface MenuItemData {
  labelKey: string;
  icon: React.ElementType;
  path?: string;
  children?: MenuItemData[];
}

const getMenuItems = (): MenuItemData[] => [
  {
    labelKey: 'menu.dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    labelKey: 'menu.production',
    icon: Video,
    children: [
      { labelKey: 'menu.content', icon: Film, path: '/producao/conteudo' },
      { labelKey: 'menu.recordings', icon: Video, path: '/producao/gravacao' },
      { labelKey: 'menu.tasks', icon: ListTodo, path: '/producao/tarefas' },
      { labelKey: 'menu.maps', icon: Map, path: '/producao/mapas' },
      {
        labelKey: 'menu.parameters',
        icon: Settings,
        children: [
          { labelKey: 'menu.recordingTypes', icon: Settings, path: '/producao/tipos-gravacao' },
          { labelKey: 'menu.classification', icon: Settings, path: '/producao/classificacao' },
          { labelKey: 'menu.recordingStatus', icon: Settings, path: '/producao/status' },
          { labelKey: 'menu.taskStatus', icon: Settings, path: '/producao/status-tarefa' },
        ],
      },
    ],
  },
  {
    labelKey: 'menu.resources',
    icon: Users,
    children: [
      { labelKey: 'menu.humanResources', icon: Users, path: '/recursos/humanos' },
      { labelKey: 'menu.technicalResources', icon: Wrench, path: '/recursos/tecnicos' },
      { labelKey: 'menu.physicalResources', icon: MapPin, path: '/recursos/fisicos' },
      { labelKey: 'menu.suppliers', icon: Truck, path: '/recursos/fornecedores' },
      { labelKey: 'menu.people', icon: Contact, path: '/recursos/pessoas' },
      { labelKey: 'menu.costumes', icon: Shirt, path: '/recursos/figurinos' },
      {
        labelKey: 'menu.parameters',
        icon: FolderCog,
        children: [
          { labelKey: 'menu.positions', icon: Briefcase, path: '/recursos/cargos' },
          { labelKey: 'menu.departments', icon: Building2, path: '/recursos/departamentos' },
          { labelKey: 'menu.functions', icon: Settings, path: '/recursos/funcoes' },
          { labelKey: 'menu.services', icon: Settings, path: '/recursos/servicos' },
          { labelKey: 'menu.supplierCategory', icon: Settings, path: '/recursos/categoria-fornecedores' },
          { labelKey: 'menu.peopleClassification', icon: Tag, path: '/recursos/classificacao-pessoas' },
          { labelKey: 'menu.costumeType', icon: Shirt, path: '/recursos/tipo-figurino' },
          { labelKey: 'menu.material', icon: Settings, path: '/recursos/material' },
        ],
      },
    ],
  },
  {
    labelKey: 'menu.admin',
    icon: Building2,
    children: [
      { labelKey: 'menu.businessUnits', icon: Building2, path: '/admin/unidades' },
      { labelKey: 'menu.profitCenters', icon: Landmark, path: '/admin/centros-lucro' },
      { labelKey: 'menu.users', icon: UserCog, path: '/admin/usuarios' },
      { labelKey: 'menu.accessProfiles', icon: Shield, path: '/admin/perfis' },
    ],
  },
];

const MenuItemComponent = ({
  item,
  level = 0,
}: {
  item: MenuItemData;
  level?: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.path === location.pathname;
  const Icon = item.icon;

  const isChildActive = (items: MenuItemData[]): boolean => {
    return items.some((child) => {
      if (child.path === location.pathname) return true;
      if (child.children) return isChildActive(child.children);
      return false;
    });
  };

  const isParentActive = hasChildren && item.children ? isChildActive(item.children) : false;

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
          {item.children?.map((child, idx) => (
            <MenuItemComponent key={idx} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const menuItems = getMenuItems();

  return (
    <aside className="w-64 h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <img src={kreatoLogo} alt="Kreato" className="h-10 object-contain" />
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item, idx) => (
          <MenuItemComponent key={idx} item={item} />
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 text-sidebar-foreground">
          <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-sm font-bold text-accent-foreground">
            {user?.nome?.charAt(0) || 'U'}
          </div>
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
