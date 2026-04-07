'use client';

import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ColumnConfig } from './useListingView';

interface ColumnSelectorProps {
  columns: ColumnConfig[];
  visibleColumnKeys: string[];
  onToggle: (key: string) => void;
  onReset: () => void;
}

export const ColumnSelector = ({
  columns,
  visibleColumnKeys,
  onToggle,
  onReset,
}: ColumnSelectorProps) => {
  const optionalColumns = columns.filter((c) => !c.required);

  const optionalVisibleCount = visibleColumnKeys.filter((k) => {
    const c = columns.find((cc) => cc.key === k);
    return c && !c.required;
  }).length;

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              aria-label="Configurar colunas"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Configurar colunas</TooltipContent>
      </Tooltip>

      <PopoverContent align="end" className="w-56 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-medium">Colunas visíveis</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={onReset}
          >
            Redefinir
          </Button>
        </div>
        <Separator />
        <div className="p-2 space-y-0.5 max-h-72 overflow-y-auto">
          {optionalColumns.map((col) => {
            const isVisible = visibleColumnKeys.includes(col.key);
            const isLastVisible = isVisible && optionalVisibleCount <= 1;

            return (
              <label
                key={col.key}
                className={`flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors select-none ${
                  isLastVisible
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-muted cursor-pointer'
                }`}
              >
                <Checkbox
                  checked={isVisible}
                  onCheckedChange={() => !isLastVisible && onToggle(col.key)}
                  disabled={isLastVisible}
                  className="h-3.5 w-3.5 shrink-0"
                />
                <span className="leading-none">{col.label}</span>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
