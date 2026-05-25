import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface ModalNavigationProps {
  /** 0-based index of the current record in the list */
  currentIndex: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}

export const ModalNavigation = ({
  currentIndex,
  total,
  onPrevious,
  onNext,
}: ModalNavigationProps) => {
  if (total <= 1) return null;

  const atFirst = currentIndex <= 0;
  const atLast = currentIndex >= total - 1;

  return (
    <div className="inline-flex items-center rounded-md border border-input divide-x divide-input overflow-hidden">
      <button
        type="button"
        onClick={onPrevious}
        disabled={atFirst}
        title="Registro anterior"
        className="flex items-center justify-center h-8 w-8 text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <span className="px-3 h-8 flex items-center text-sm tabular-nums select-none text-foreground">
        {currentIndex + 1} / {total}
      </span>

      <button
        type="button"
        onClick={onNext}
        disabled={atLast}
        title="Próximo registro"
        className="flex items-center justify-center h-8 w-8 text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};
