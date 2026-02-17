import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ListActionBarProps {
  children: ReactNode;
  className?: string;
}

/**
 * A standardized action bar for list pages.
 * Place this between the PageHeader and the DataCard/table content.
 * Used for search bars, filter buttons, export buttons, and other action buttons.
 */
export const ListActionBar = ({ children, className }: ListActionBarProps) => {
  return (
    <div 
      className={cn(
        "flex items-center justify-end gap-2 py-1.5 px-4 mb-4 border-b border-border/50 bg-muted/30 rounded-lg",
        className
      )}
    >
      {children}
    </div>
  );
};
