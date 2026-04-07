'use client';

import { LayoutList, LayoutGrid, PanelRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ViewMode } from './useListingView';

interface ViewSwitcherProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

const MODES: { value: ViewMode; icon: React.ElementType; label: string }[] = [
  { value: 'list', icon: LayoutList, label: 'Lista' },
  { value: 'cards', icon: LayoutGrid, label: 'Cards' },
  { value: 'detail', icon: PanelRight, label: 'Lista + Detalhe' },
];

export const ViewSwitcher = ({ mode, onModeChange }: ViewSwitcherProps) => {
  return (
    <div className="flex items-center gap-0.5 rounded-md border bg-muted/40 p-0.5">
      {MODES.map(({ value, icon: Icon, label }) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                'h-7 w-7',
                mode === value && 'bg-background shadow-sm text-foreground',
              )}
              onClick={() => onModeChange(value)}
              aria-label={label}
              aria-pressed={mode === value}
            >
              <Icon className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};
