import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DialogActionBarProps {
  children: ReactNode;
  className?: string;
}

/**
 * A standardized action bar for dialog modals.
 * Place this between the DialogHeader and the Tabs/form content.
 * Used for filter buttons, report generators, and other action buttons.
 */
export const DialogActionBar = ({ children, className }: DialogActionBarProps) => {
  return (
    <div 
      className={cn(
        "flex items-center justify-end gap-2 py-2 px-1 border-b border-border/50 -mx-6 px-6 bg-muted/30",
        className
      )}
    >
      {children}
    </div>
  );
};
