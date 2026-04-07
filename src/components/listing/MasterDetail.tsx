'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { EmptyState } from '@/components/shared/PageComponents';
import { PanelRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MasterDetailProps<T> {
  data: T[];
  selectedItem: T | null;
  onSelect: (item: T | null) => void;
  renderRow: (item: T, isSelected: boolean) => ReactNode;
  renderDetail: (item: T) => ReactNode;
  getRowKey: (item: T) => string;
  /** Title shown in the Sheet header on mobile */
  detailTitle?: string;
  emptyDetailTitle?: string;
  emptyDetailDescription?: string;
  emptyListContent?: ReactNode;
  /** Width of the master list panel. Default: '38%' */
  masterWidth?: string;
}

export function MasterDetail<T>({
  data,
  selectedItem,
  onSelect,
  renderRow,
  renderDetail,
  getRowKey,
  detailTitle = 'Detalhe',
  emptyDetailTitle = 'Nenhum item selecionado',
  emptyDetailDescription = 'Selecione um item na lista para ver os detalhes.',
  emptyListContent,
  masterWidth = '38%',
}: MasterDetailProps<T>) {
  const isMobile = useIsMobile();

  const isSelected = (item: T) =>
    selectedItem !== null && getRowKey(item) === getRowKey(selectedItem!);

  const listItems = (
    <div className="divide-y overflow-y-auto h-full">
      {data.length === 0
        ? (emptyListContent ?? (
            <div className="p-6 text-sm text-muted-foreground text-center">
              Nenhum item para exibir.
            </div>
          ))
        : data.map((item) => {
            const active = isSelected(item);
            return (
              <div
                key={getRowKey(item)}
                className={cn(
                  'px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50',
                  active && 'bg-accent border-l-[3px] border-primary',
                )}
                onClick={() => {
                  if (isMobile) {
                    onSelect(item);
                  } else {
                    onSelect(active ? null : item);
                  }
                }}
              >
                {renderRow(item, active)}
              </div>
            );
          })}
    </div>
  );

  const detailContent = selectedItem ? (
    <div className="p-4 overflow-y-auto h-full">{renderDetail(selectedItem)}</div>
  ) : (
    <div className="h-full flex items-center justify-center py-12">
      <EmptyState
        title={emptyDetailTitle}
        description={emptyDetailDescription}
        icon={PanelRight}
      />
    </div>
  );

  /* ── Mobile: list full-width, detail in Sheet ── */
  if (isMobile) {
    return (
      <>
        <div className="overflow-y-auto">{listItems}</div>
        <Sheet
          open={!!selectedItem}
          onOpenChange={(open) => !open && onSelect(null)}
        >
          <SheetContent side="right" className="w-full sm:w-[480px] p-0 flex flex-col">
            <SheetHeader className="px-4 pt-4 pb-2 border-b shrink-0">
              <SheetTitle>{detailTitle}</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              {selectedItem && <div className="p-4">{renderDetail(selectedItem)}</div>}
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  /* ── Desktop: side-by-side ── */
  return (
    <div className="flex min-h-[420px] overflow-hidden">
      {/* Master list */}
      <div
        className="shrink-0 border-r flex flex-col overflow-hidden"
        style={{ width: masterWidth }}
      >
        {listItems}
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-hidden">{detailContent}</div>
    </div>
  );
}
