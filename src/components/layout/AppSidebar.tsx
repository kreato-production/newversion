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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import kreatoLogo from '@/assets/kreato-logo.png';

interface MenuItem {
  label: string;
  icon: React.ElementType;
  path?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    label: 'Produção',
    icon: Video,
    children: [
      { label: 'Gravação', icon: Video, path: '/producao/gravacao' },
      { label: 'Mapas', icon: Map, path: '/producao/mapas' },
      {
        label: 'Parametrizações',
        icon: Settings,
        children: [
          { label: 'Tipos de Gravação', icon: Settings, path: '/producao/tipos-gravacao' },
          { label: 'Classificação', icon: Settings, path: '/producao/classificacao' },
          { label: 'Status de Gravação', icon: Settings, path: '/producao/status' },
        ],
      },
    ],
  },
  {
    label: 'Recursos',
    icon: Users,
    children: [
      { label: 'Recursos Humanos', icon: Users, path: '/recursos/humanos' },
      { label: 'Recursos Técnicos', icon: Wrench, path: '/recursos/tecnicos' },
      { label: 'Recursos Físicos', icon: MapPin, path: '/recursos/fisicos' },
      { label: 'Fornecedores', icon: Truck, path: '/recursos/fornecedores' },
      {
        label: 'Parametrizações',
        icon: FolderCog,
        children: [
          { label: 'Cargos', icon: Briefcase, path: '/recursos/cargos' },
          { label: 'Departamentos', icon: Building2, path: '/recursos/departamentos' },
          { label: 'Funções', icon: Settings, path: '/recursos/funcoes' },
          { label: 'Serviços', icon: Settings, path: '/recursos/servicos' },
          { label: 'Categoria de Fornecedores', icon: Settings, path: '/recursos/categoria-fornecedores' },
        ],
      },
    ],
  },
  {
    label: 'Administração',
    icon: Building2,
    children: [
      { label: 'Unidade de Negócio', icon: Building2, path: '/admin/unidades' },
      { label: 'Usuários', icon: UserCog, path: '/admin/usuarios' },
      { label: 'Perfil de Acesso', icon: Shield, path: '/admin/perfis' },
    ],
  },
];

const MenuItem = ({
  item,
  level = 0,
}: {
  item: MenuItem;
  level?: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.path === location.pathname;
  const Icon = item.icon;

  const isChildActive = (items: MenuItem[]): boolean => {
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
          <span className="flex-1 text-left font-medium">{item.label}</span>
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
          <span className="font-medium">{item.label}</span>
        </Link>
      )}
      
      {hasChildren && isOpen && (
        <div className="mt-1 space-y-1">
          {item.children?.map((child, idx) => (
            <MenuItem key={idx} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const AppSidebar = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <img src={kreatoLogo} alt="Kreato" className="h-10 object-contain" />
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item, idx) => (
          <MenuItem key={idx} item={item} />
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
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
