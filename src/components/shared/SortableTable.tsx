import { useState, useCallback } from 'react';
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

export interface Column<T> {
  key: string;
  label: string;
  className?: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface SortableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  getRowKey: (item: T) => string;
  onColumnsReorder?: (columns: Column<T>[]) => void;
  storageKey?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function SortableTable<T>({
  data,
  columns: initialColumns,
  getRowKey,
  storageKey,
}: SortableTableProps<T>) {
  // Load saved column order from localStorage
  const [columns, setColumns] = useState<Column<T>[]>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`${storageKey}_columns`);
      if (saved) {
        const savedOrder = JSON.parse(saved) as string[];
        const reordered = savedOrder
          .map((key) => initialColumns.find((col) => col.key === key))
          .filter(Boolean) as Column<T>[];
        // Add any new columns that weren't in the saved order
        const newColumns = initialColumns.filter(
          (col) => !savedOrder.includes(col.key)
        );
        return [...reordered, ...newColumns];
      }
    }
    return initialColumns;
  });

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useCallback(() => {
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
  }, [data, sortKey, sortDirection])();

  const handleDragStart = (e: React.DragEvent, columnKey: string) => {
    setDraggedColumn(columnKey);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', columnKey);
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    if (draggedColumn && draggedColumn !== columnKey) {
      setDragOverColumn(columnKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetKey) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    const newColumns = [...columns];
    const draggedIndex = newColumns.findIndex((col) => col.key === draggedColumn);
    const targetIndex = newColumns.findIndex((col) => col.key === targetKey);

    const [removed] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, removed);

    setColumns(newColumns);
    setDraggedColumn(null);
    setDragOverColumn(null);

    // Save to localStorage
    if (storageKey) {
      localStorage.setItem(
        `${storageKey}_columns`,
        JSON.stringify(newColumns.map((col) => col.key))
      );
    }
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const getSortIcon = (key: string) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-3 h-3 ml-1 text-primary" />;
    }
    return <ArrowDown className="w-3 h-3 ml-1 text-primary" />;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="h-9">
          {columns.map((column) => (
            <TableHead
              key={column.key}
              className={cn(
                'cursor-pointer select-none transition-colors hover:bg-muted/50 py-2',
                column.className,
                dragOverColumn === column.key && 'bg-primary/10 border-l-2 border-primary',
                draggedColumn === column.key && 'opacity-50'
              )}
              draggable
              onDragStart={(e) => handleDragStart(e, column.key)}
              onDragOver={(e) => handleDragOver(e, column.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.key)}
              onDragEnd={handleDragEnd}
              onClick={() => column.sortable !== false && handleSort(column.key)}
            >
              <div className="flex items-center gap-1">
                <GripVertical className="w-3 h-3 opacity-30 cursor-grab" />
                <span>{column.label}</span>
                {column.sortable !== false && getSortIcon(column.key)}
              </div>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((item) => (
          <TableRow key={getRowKey(item)} className="h-10">
            {columns.map((column) => (
              <TableCell key={column.key} className={cn('py-2', column.className)}>
                {column.render 
                  ? column.render(item) 
                  : ((item as Record<string, unknown>)[column.key] as React.ReactNode) || '-'}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
