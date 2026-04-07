import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ModalNavigationProps {
  /** 0-based index of the current record in the list */
  currentIndex: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * Renders ← N / T → navigation controls for modal footers.
 * Returns null when total ≤ 1 (no navigation needed).
 * Place on the left side of the DialogFooter.
 */
export const ModalNavigation = ({
  currentIndex,
  total,
  onPrevious,
  onNext,
}: ModalNavigationProps) => {
  if (total <= 1) return null;

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={onPrevious}
        disabled={currentIndex <= 0}
        title="Registro anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm text-muted-foreground tabular-nums min-w-[3.5rem] text-center select-none">
        {currentIndex + 1} / {total}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={onNext}
        disabled={currentIndex >= total - 1}
        title="Próximo registro"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
