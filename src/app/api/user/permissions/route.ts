import { NextResponse } from 'next/server';
import { fastifyFetch } from '@/lib/api/fastify';
import type { PermissionItem } from '@/modules/auth/auth.types';

type PermissionsResponse = {
  permissions: PermissionItem[];
  enabledModules: string[];
};

export async function GET() {
  try {
    const data = await fastifyFetch<PermissionsResponse>('/auth/permissions');
    return NextResponse.json(data);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : 'Erro ao buscar permissões';
    return NextResponse.json({ message }, { status });
  }
}
