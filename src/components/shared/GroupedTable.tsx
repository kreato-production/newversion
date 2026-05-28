import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Column } from './table.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GroupRow {
  type: 'group';
  id: string;
  label: string;
  value: string;
  depth: number;
  count: number;
}

interface ItemRow<T> {
  type: 'item';
  item: T;
  depth: number;
}

type FlatRow<T> = GroupRow | ItemRow<T>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractGroupValue<T>(item: T, column: Column<T>): string {
  if (column.groupValue) return column.groupValue(item);
  const val = (item as Record<string, unknown>)[column.key];
  if (val === null || val === undefined || val === '') return '(Vazio)';
  return String(val);
}

function buildFlatRows<T>(
  data: T[],
  groupColumns: Column<T>[],
  depth: number,
  parentId: string,
  collapsedIds: Set<string>,
): FlatRow<T>[] {
  if (groupColumns.length === 0) {
    return data.map<ItemRow<T>>((item) => ({ type: 'item', item, depth }));
  }

  const [currentCol, ...remainingCols] = groupColumns;

  // Preserve insertion order of group values
  const groupMap = new Map<string, T[]>();
  for (const item of data) {
    const val = extractGroupValue(item, currentCol);
    if (!groupMap.has(val)) groupMap.set(val, []);
    groupMap.get(val)!.push(item);
  }

  // Sort group keys alphabetically so groups are stable
  const sortedEntries = [...groupMap.entries()].sort(([a], [b]) =>
    a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
  );

  const rows: FlatRow<T>[] = [];
  for (const [value, items] of sortedEntries) {
    const id = `${parentId}||${currentCol.key}:${value}`;
    const isCollapsed = collapsedIds.has(id);

    rows.push({ type: 'group', id, label: currentCol.label, value, depth, count: items.length });

    if (!isCollapsed) {
      rows.push(...buildFlatRows(items, remainingCols, depth + 1, id, collapsedIds));
    }
  }

  return rows;
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface GroupedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  groupByColumns: Column<T>[];
  getRowKey: (item: T) => string;
  visibleColumnKeys?: string[];
  /** Controlled collapse state — when set, the component is semi-controlled */
  externalCollapsedIds?: Set<string>;
  onCollapsedIdsChange?: (ids: Set<string>) => void;
}

export function GroupedTable<T>({
  data,
  columns: allColumns,
  groupByColumns,
  getRowKey,
  visibleColumnKeys,
  externalCollapsedIds,
  onCollapsedIdsChange,
}: GroupedTableProps<T>) {
  const [internalCollapsedIds, setInternalCollapsedIds] = useState<Set<string>>(new Set());

  const collapsedIds = externalCollapsedIds ?? internalCollapsedIds;

  const setCollapsedIds = (updater: (prev: Set<string>) => Set<string>) => {
    if (onCollapsedIdsChange) {
      onCollapsedIdsChange(updater(collapsedIds));
    } else {
      setInternalCollapsedIds(updater);
    }
  };

  const renderedColumns = visibleColumnKeys
    ? allColumns.filter((c) => visibleColumnKeys.includes(c.key))
    : allColumns;

  const flatRows = useMemo(
    () => buildFlatRows(data, groupByColumns, 0, 'root', collapsedIds),
    [data, groupByColumns, collapsedIds],
  );

  const toggleGroup = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const colCount = renderedColumns.length;
  const totalItems = useMemo(() => flatRows.filter((r) => r.type === 'item').length, [flatRows]);

  return (
    <div>
      <div className="overflow-x-auto">
        <Table style={{ minWidth: 'max-content', width: '100%' }}>
          <TableHeader>
            <TableRow className="h-9">
              {renderedColumns.map((column) => (
                <TableHead key={column.key} className={cn('py-2 select-none', column.className)}>
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {flatRows.map((row, idx) => {
              if (row.type === 'group') {
                const isCollapsed = collapsedIds.has(row.id);
                return (
                  <TableRow
                    key={`group-${row.id}`}
                    className={cn(
                      'cursor-pointer hover:bg-muted/60 h-8 border-b',
                      row.depth === 0 ? 'bg-muted/50' : 'bg-muted/25',
                    )}
                    onClick={() => toggleGroup(row.id)}
                  >
                    <TableCell
                      colSpan={colCount}
                      className="py-1"
                      style={{ paddingLeft: `${8 + row.depth * 20}px` }}
                    >
                      <div className="flex items-center gap-1.5">
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="text-[11px] text-muted-foreground font-normal">
                          {row.label}:
                        </span>
                        <span className="text-sm font-medium">{row.value}</span>
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                          {row.count}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }

              return (
                <TableRow key={getRowKey(row.item)} className="h-10">
                  {renderedColumns.map((column, colIdx) => (
                    <TableCell
                      key={column.key}
                      className={cn('py-2', column.className)}
                      style={colIdx === 0 ? { paddingLeft: `${8 + row.depth * 20}px` } : undefined}
                    >
                      {column.render
                        ? column.render(row.item)
                        : ((row.item as Record<string, unknown>)[column.key] as React.ReactNode) ||
                          '-'}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}

            {totalItems === 0 && (
              <TableRow>
                <TableCell
                  colSpan={colCount}
                  className="text-center text-muted-foreground py-8 text-sm"
                >
                  Nenhum item encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalItems > 0 && (
        <div className="flex items-center justify-end px-3 py-2 text-xs text-muted-foreground border-t">
          {totalItems} {totalItems === 1 ? 'registro' : 'registros'}
        </div>
      )}
    </div>
  );
}
