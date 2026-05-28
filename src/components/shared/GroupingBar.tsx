import { X, Plus, Layers, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface GroupOption {
  key: string;
  label: string;
}

interface GroupingBarProps {
  /** Ordered list of currently active groups */
  activeGroups: GroupOption[];
  /** Columns available to add as a new grouping level */
  availableGroups: GroupOption[];
  allCollapsed: boolean;
  onAdd: (key: string) => void;
  onRemove: (key: string) => void;
  onClear: () => void;
  onToggleCollapseAll: () => void;
}

export function GroupingBar({
  activeGroups,
  availableGroups,
  allCollapsed,
  onAdd,
  onRemove,
  onClear,
  onToggleCollapseAll,
}: GroupingBarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 border-b flex-wrap min-h-[36px]">
      <Layers className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground shrink-0">Agrupar por:</span>

      {activeGroups.map((group, index) => (
        <div
          key={group.key}
          className="flex items-center gap-1 bg-background border rounded px-2 py-0.5 text-xs shadow-sm"
        >
          <span className="text-muted-foreground text-[10px] font-mono tabular-nums w-3 text-center">
            {index + 1}
          </span>
          <span className="font-medium">{group.label}</span>
          <button
            type="button"
            onClick={() => onRemove(group.key)}
            className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
            title={`Remover agrupamento por ${group.label}`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {availableGroups.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs gap-1">
              <Plus className="w-3 h-3" />
              {activeGroups.length === 0 ? 'Escolher coluna' : 'Adicionar nível'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {availableGroups.map((group) => (
              <DropdownMenuItem key={group.key} onClick={() => onAdd(group.key)}>
                {group.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {activeGroups.length > 0 && (
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapseAll}
            className="h-6 px-1.5 text-xs text-muted-foreground"
            title={allCollapsed ? 'Expandir todos os grupos' : 'Recolher todos os grupos'}
          >
            {allCollapsed ? (
              <ChevronsUpDown className="w-3 h-3" />
            ) : (
              <ChevronsDownUp className="w-3 h-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 px-1.5 text-xs text-muted-foreground hover:text-destructive"
          >
            Limpar
          </Button>
        </div>
      )}
    </div>
  );
}
