import type React from 'react';

export interface Column<T> {
  key: string;
  label: string;
  className?: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  minWidth?: number;
  /** Mark as true to allow this column to be used as a grouping key */
  groupable?: boolean;
  /** Extracts the raw string value used for grouping (falls back to item[key]) */
  groupValue?: (item: T) => string;
}
