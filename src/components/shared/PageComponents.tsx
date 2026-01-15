import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Filter } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  onAdd?: () => void;
  addLabel?: string;
  children?: ReactNode;
}

export const PageHeader = ({ title, description, onAdd, addLabel = 'Adicionar', children }: PageHeaderProps) => (
  <div className="rounded-lg mb-6 overflow-hidden shadow-sm">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-gradient-to-r from-kreato-cyan via-primary to-kreato-orange">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {description && <p className="text-white/80 mt-1">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        {children}
        {onAdd && (
          <Button onClick={onAdd} variant="secondary" className="bg-white text-primary hover:bg-white/90">
            <Plus className="w-4 h-4 mr-2" />
            {addLabel}
          </Button>
        )}
      </div>
    </div>
  </div>
);

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar = ({ value, onChange, placeholder = 'Pesquisar...' }: SearchBarProps) => (
  <div className="relative max-w-sm">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="pl-9"
    />
  </div>
);

interface DataCardProps {
  children: ReactNode;
  className?: string;
}

export const DataCard = ({ children, className = '' }: DataCardProps) => (
  <Card className={className}>
    <CardContent className="p-0">{children}</CardContent>
  </Card>
);

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  onAction?: () => void;
  actionLabel?: string;
}

export const EmptyState = ({ title, description, icon: Icon, onAction, actionLabel }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {Icon && (
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
    )}
    <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
    {onAction && actionLabel && (
      <Button onClick={onAction} variant="outline">
        <Plus className="w-4 h-4 mr-2" />
        {actionLabel}
      </Button>
    )}
  </div>
);
