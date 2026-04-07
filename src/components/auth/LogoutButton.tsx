'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  className?: string;
}

export function LogoutButton({
  variant = 'ghost',
  size = 'sm',
  showIcon = true,
  className,
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    // callbackUrl: para onde redirecionar após o logout
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        showIcon && <LogOut className="h-4 w-4" />
      )}
      {size !== 'icon' && <span className={showIcon ? 'ml-2' : undefined}>Sair</span>}
    </Button>
  );
}
