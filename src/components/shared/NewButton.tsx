import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';

interface NewButtonProps {
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Standardized "New" button for list pages.
 * Relies on the TooltipProvider already present in AppShell.
 */
export const NewButton = ({ tooltip, onClick, disabled }: NewButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" onClick={onClick} disabled={disabled} aria-label={tooltip}>
          <Plus className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
};
