import Link from 'next/link';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/auth';

export default async function UnauthorizedPage() {
  const session = await auth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <ShieldX className="h-12 w-12 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
          {session?.user?.perfil && (
            <p className="text-sm text-muted-foreground">
              Seu perfil atual: <span className="font-medium">{session.user.perfil}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default">
            <Link href="/dashboard">Ir para o Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Trocar de conta</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
