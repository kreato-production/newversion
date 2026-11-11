import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * Foto do usuário logado.
 *
 * A foto é guardada como data URL (até ~2MB) em `User.fotoUrl`, grande demais
 * para o cookie JWT do Auth.js — por isso ela não vai na sessão e é buscada
 * aqui, à parte, pelo AuthContext.
 */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { fotoUrl: true, image: true },
    });

    return NextResponse.json(
      { foto: dbUser?.fotoUrl || dbUser?.image || null },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json({ message: 'Erro ao buscar foto' }, { status: 500 });
  }
}
