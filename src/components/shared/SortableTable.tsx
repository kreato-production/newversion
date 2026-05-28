'use client';

import { useRef, useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TablePagination } from './TablePagination';
import { GroupingBar } from './GroupingBar';
import { GroupedTable } from './GroupedTable';
import type { Column } from './table.types';

// Re-export Column so existing imports stay valid
export type { Column } from './table.types';

interface SortableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  getRowKey: (item: T) => string;
  onColumnsReorder?: (columns: Column<T>[]) => void;
  storageKey?: string;
  paginated?: boolean;
  defaultPageSize?: number;
  /** When provided, only columns whose key is in this array are rendered */
  visibleColumnKeys?: string[];
}

type SortDirection = 'asc' | 'desc' | null;
type ColumnWidths = Record<string, number>;

const DEFAULT_MIN_COLUMN_WIDTH = 96;

function readStoredStringArray(storageKey?: string, suffix?: string): string[] | null {
  if (!storageKey || typeof window === 'undefined') return null;
  const saved = localStorage.getItem(`${storageKey}_${suffix}`);
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as string[]) : null;
  } catch {
    return null;
  }
}

function readStoredColumnWidths(storageKey?: string): ColumnWidths {
  if (!storageKey || typeof window === 'undefined') return {};
  const saved = localStorage.getItem(`${storageKey}_columnWidths`);
  if (!saved) return {};
  try {
    const parsed = JSON.parse(saved) as Record<string, unknown>;
    return Object.entries(parsed).reduce<ColumnWidths>((acc, [key, value]) => {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) acc[key] = value;
      return acc;
    }, {});
  } catch {
    return {};
  }
}

/** Collects all group IDs that exist in the data for the given grouping columns */
function collectAllGroupIds<T>(
  data: T[],
  groupColumns: Column<T>[],
  parentId: string,
): Set<string> {
  if (groupColumns.length === 0) return new Set();
  const [col, ...rest] = groupColumns;
  const ids = new Set<string>();
  const groupMap = new Map<string, T[]>();
  for (const item of data) {
    const val = col.groupValue
      ? col.groupValue(item)
      : String((item as Record<string, unknown>)[col.key] ?? '(Vazio)');
    if (!groupMap.has(val)) groupMap.set(val, []);
    groupMap.get(val)!.push(item);
  }
  for (const [value, items] of groupMap) {
    const id = `${parentId}||${col.key}:${value}`;
    ids.add(id);
    for (const childId of collectAllGroupIds(items, rest, id)) ids.add(childId);
  }
  return ids;
}

export function SortableTable<T>({
  data,
  columns: initialColumns,
  getRowKey,
  storageKey,
  paginated = true,
  defaultPageSize = 20,
  visibleColumnKeys,
}: SortableTableProps<T>) {
  // ── Column ordering (persisted) ───────────────────────────────────────────
  const [columnOrder, setColumnOrder] = useState<string[] | null>(() =>
    readStoredStringArray(storageKey, 'columns'),
  );

  const columns = useMemo(() => {
    if (!columnOrder) return initialColumns;
    const colMap = new Map(initialColumns.map((c) => [c.key, c]));
    const ordered = columnOrder.filter((key) => colMap.has(key)).map((key) => colMap.get(key)!);
    const newCols = initialColumns.filter((c) => !columnOrder.includes(c.key));
    return [...ordered, ...newCols];
  }, [initialColumns, columnOrder]);

  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() =>
    readStoredColumnWidths(storageKey),
  );

  // ── Sort ──────────────────────────────────────────────────────────────────
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // ── Drag / resize ─────────────────────────────────────────────────────────
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const headerRefs = useRef<Record<string, HTMLTableCellElement | null>>({});

  // ── Pagination ────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`${storageKey}_pageSize`);
      if (saved) return Number(saved);
    }
    return defaultPageSize;
  });

  // ── Grouping ──────────────────────────────────────────────────────────────
  const [groupByKeys, setGroupByKeys] = useState<string[]>([]);
  const [groupCollapsedIds, setGroupCollapsedIds] = useState<Set<string>>(new Set());

  // ── Derived ───────────────────────────────────────────────────────────────

  const renderedColumns = visibleColumnKeys
    ? columns.filter((c) => visibleColumnKeys.includes(c.key))
    : columns;

  const groupableColumns = useMemo(
    () => renderedColumns.filter((c) => c.groupable),
    [renderedColumns],
  );

  const activeGroupColumns = useMemo(
    () =>
      groupByKeys
        .map((key) => renderedColumns.find((c) => c.key === key))
        .filter(Boolean) as Column<T>[],
    [groupByKeys, renderedColumns],
  );

  const activeGroupOptions = useMemo(
    () =>
      groupByKeys.map((key) => {
        const col = groupableColumns.find((c) => c.key === key);
        return { key, label: col?.label ?? key };
      }),
    [groupByKeys, groupableColumns],
  );

  const availableGroupOptions = useMemo(
    () =>
      groupableColumns
        .filter((c) => !groupByKeys.includes(c.key))
        .map((c) => ({ key: c.key, label: c.label })),
    [groupableColumns, groupByKeys],
  );

  const allGroupIds = useMemo(
    () =>
      activeGroupColumns.length > 0
        ? collectAllGroupIds(data, activeGroupColumns, 'root')
        : new Set<string>(),
    [data, activeGroupColumns],
  );

  const allCollapsed =
    allGroupIds.size > 0 && [...allGroupIds].every((id) => groupCollapsedIds.has(id));

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;
    return [...data].sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[sortKey];
      const bValue = (b as Record<string, unknown>)[sortKey];
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue, 'pt-BR', { sensitivity: 'base' });
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue), 'pt-BR');
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, paginated]);

  const totalPages = Math.ceil(data.length / pageSize);

  useMemo(() => {
    if (currentPage > Math.ceil(data.length / pageSize) && data.length > 0) setCurrentPage(1);
  }, [data.length, pageSize, currentPage]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    if (storageKey) localStorage.setItem(`${storageKey}_pageSize`, String(size));
  };

  const persistColumnWidths = (nextWidths: ColumnWidths) => {
    if (!storageKey || typeof window === 'undefined') return;
    localStorage.setItem(`${storageKey}_columnWidths`, JSON.stringify(nextWidths));
  };

  const handleDragStart = (e: React.DragEvent, columnKey: string) => {
    if (resizingColumn) return;
    setDraggedColumn(columnKey);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', columnKey);
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    if (draggedColumn && draggedColumn !== columnKey) setDragOverColumn(columnKey);
  };

  const handleDragLeave = () => setDragOverColumn(null);

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetKey) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }
    const currentKeys = columns.map((c) => c.key);
    const draggedIndex = currentKeys.indexOf(draggedColumn);
    const targetIndex = currentKeys.indexOf(targetKey);
    const newOrder = [...currentKeys];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColumn);
    setColumnOrder(newOrder);
    setDraggedColumn(null);
    setDragOverColumn(null);
    if (storageKey) localStorage.setItem(`${storageKey}_columns`, JSON.stringify(newOrder));
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const buildMeasuredWidths = () =>
    renderedColumns.reduce<ColumnWidths>((acc, column) => {
      const w = headerRefs.current[column.key]?.offsetWidth ?? columnWidths[column.key];
      if (w) acc[column.key] = w;
      return acc;
    }, {});

  const handleResizeStart = (event: React.MouseEvent, column: Column<T>) => {
    event.preventDefault();
    event.stopPropagation();
    const measuredWidths = buildMeasuredWidths();
    const startingWidths =
      Object.keys(measuredWidths).length > 0 ? measuredWidths : { ...columnWidths };
    const startX = event.clientX;
    const startWidth =
      startingWidths[column.key] ??
      headerRefs.current[column.key]?.offsetWidth ??
      column.minWidth ??
      DEFAULT_MIN_COLUMN_WIDTH;
    const minWidth = column.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
    setResizingColumn(column.key);
    setColumnWidths(startingWidths);
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const nextWidth = Math.max(minWidth, startWidth + (moveEvent.clientX - startX));
      setColumnWidths((current) => ({ ...startingWidths, ...current, [column.key]: nextWidth }));
    };
    const handleMouseUp = () => {
      setColumnWidths((current) => {
        persistColumnWidths(current);
        return current;
      });
      setResizingColumn(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleGroupAdd = (key: string) => {
    setGroupByKeys((prev) => [...prev, key]);
    setGroupCollapsedIds(new Set());
  };

  const handleGroupRemove = (key: string) => {
    setGroupByKeys((prev) => prev.filter((k) => k !== key));
    setGroupCollapsedIds(new Set());
  };

  const handleGroupClear = () => {
    setGroupByKeys([]);
    setGroupCollapsedIds(new Set());
  };

  const handleToggleCollapseAll = () => {
    setGroupCollapsedIds((prev) =>
      prev.size >= allGroupIds.size ? new Set() : new Set(allGroupIds),
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const getSortIcon = (key: string) => {
    if (sortKey !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    if (sortDirection === 'asc') return <ArrowUp className="w-3 h-3 ml-1 text-primary" />;
    return <ArrowDown className="w-3 h-3 ml-1 text-primary" />;
  };

  const hasManualWidths = renderedColumns.some((column) => columnWidths[column.key]);

  return (
    <div>
      {/* Grouping bar — visible only when at least one column is groupable */}
      {groupableColumns.length > 0 && (
        <GroupingBar
          activeGroups={activeGroupOptions}
          availableGroups={availableGroupOptions}
          allCollapsed={allCollapsed}
          onAdd={handleGroupAdd}
          onRemove={handleGroupRemove}
          onClear={handleGroupClear}
          onToggleCollapseAll={handleToggleCollapseAll}
        />
      )}

      {groupByKeys.length > 0 ? (
        /* ── Grouped view ── */
        <GroupedTable
          data={sortedData}
          columns={renderedColumns}
          groupByColumns={activeGroupColumns}
          getRowKey={getRowKey}
          externalCollapsedIds={groupCollapsedIds}
          onCollapsedIdsChange={setGroupCollapsedIds}
        />
      ) : (
        /* ── Flat table view ── */
        <div>
          <div className="overflow-x-auto">
            <Table
              className={hasManualWidths ? 'table-fixed' : undefined}
              style={
                hasManualWidths ? { minWidth: '100%' } : { minWidth: 'max-content', width: '100%' }
              }
            >
              <colgroup>
                {renderedColumns.map((column) => {
                  const width = columnWidths[column.key];
                  return (
                    <col
                      key={column.key}
                      style={
                        width
                          ? { width: `${width}px`, minWidth: `${width}px` }
                          : column.minWidth
                            ? { minWidth: `${column.minWidth}px` }
                            : undefined
                      }
                    />
                  );
                })}
              </colgroup>
              <TableHeader>
                <TableRow className="h-9">
                  {renderedColumns.map((column) => (
                    <TableHead
                      key={column.key}
                      ref={(node) => {
                        headerRefs.current[column.key] = node;
                      }}
                      className={cn(
                        'relative cursor-pointer select-none transition-colors hover:bg-muted/50 py-2',
                        column.className,
                        dragOverColumn === column.key && 'bg-primary/10 border-l-2 border-primary',
                        draggedColumn === column.key && 'opacity-50',
                        resizingColumn === column.key && 'bg-primary/5',
                      )}
                      draggable
                      onDragStart={(e) => handleDragStart(e, column.key)}
                      onDragOver={(e) => handleDragOver(e, column.key)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, column.key)}
                      onDragEnd={handleDragEnd}
                      onClick={() => column.sortable !== false && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-1 pr-3">
                        <GripVertical className="w-3 h-3 opacity-30 cursor-grab" />
                        <span>{column.label}</span>
                        {column.sortable !== false && getSortIcon(column.key)}
                      </div>
                      <div
                        role="separator"
                        aria-orientation="vertical"
                        aria-label={`Redimensionar coluna ${column.label}`}
                        className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none"
                        onMouseDown={(event) => handleResizeStart(event, column)}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="mx-auto h-full w-px bg-border/80" />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item) => (
                  <TableRow key={getRowKey(item)} className="h-10">
                    {renderedColumns.map((column) => (
                      <TableCell key={column.key} className={cn('py-2', column.className)}>
                        {column.render
                          ? column.render(item)
                          : ((item as Record<string, unknown>)[column.key] as React.ReactNode) ||
                            '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {paginated && data.length > 0 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={data.length}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </div>
      )}
    </div>
  );
}
