import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';

interface NewButtonProps {
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Standardized "New" button for list pages.
 * Square icon button with Plus icon and tooltip hint.
 * Positioned as the first button in the ListActionBar.
 */
export const NewButton = ({ tooltip, onClick, disabled }: NewButtonProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
