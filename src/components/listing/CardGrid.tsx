import { type ReactNode } from 'react';
import { EmptyState } from '@/components/shared/PageComponents';
import { LayoutGrid } from 'lucide-react';

interface CardGridProps<T> {
  data: T[];
  renderCard: (item: T) => ReactNode;
  getRowKey: (item: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
  /** Number of columns: 'auto' (default) | 2 | 3 | 4 */
  cols?: 'auto' | 2 | 3 | 4;
}

const colsClass = {
  auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
} as const;

export function CardGrid<T>({
  data,
  renderCard,
  getRowKey,
  emptyTitle = 'Nenhum item encontrado',
  emptyDescription = 'Adicione um novo item para começar.',
  onEmptyAction,
  emptyActionLabel,
  cols = 'auto',
}: CardGridProps<T>) {
  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={LayoutGrid}
        onAction={onEmptyAction}
        actionLabel={emptyActionLabel}
      />
    );
  }

  return (
    <div className={`p-4 grid ${colsClass[cols]} gap-3`}>
      {data.map((item) => (
        <div key={getRowKey(item)}>{renderCard(item)}</div>
      ))}
    </div>
  );
}
