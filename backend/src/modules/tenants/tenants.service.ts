import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import type { TenantsRepository } from './tenants.repository.js';

export const saveTenantSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(1),
  plano: z.string().optional().nullable(),
  status: z.enum(['Ativo', 'Inativo', 'Bloqueado']),
  notas: z.string().optional().nullable(),
});

export type SaveTenantDto = z.infer<typeof saveTenantSchema>;

const statusMap = {
  Ativo: 'ATIVO',
  Inativo: 'INATIVO',
  Bloqueado: 'BLOQUEADO',
} as const;

const statusLabelMap = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  BLOQUEADO: 'Bloqueado',
} as const;

export class TenantsService {
  constructor(private readonly repository: TenantsRepository) {}

  async list(_actor: SessionUser) {
    const data = await this.repository.list();
    return data.map((item) => ({
      id: item.id,
      nome: item.nome,
      plano: item.plano || 'Mensal',
      status: statusLabelMap[item.status],
      notas: item.notas || '',
      createdAt: item.createdAt.toISOString(),
      licencaFim: item.licencaFim?.toISOString() ?? null,
    }));
  }

  async save(_actor: SessionUser, input: SaveTenantDto) {
    const item = await this.repository.save({
      id: input.id,
      nome: input.nome,
      plano: input.plano,
      notas: input.notas,
      status: statusMap[input.status],
    });

    return {
      id: item.id,
      nome: item.nome,
      plano: item.plano || 'Mensal',
      status: statusLabelMap[item.status],
      notas: item.notas || '',
      createdAt: item.createdAt.toISOString(),
      licencaFim: item.licencaFim?.toISOString() ?? null,
    };
  }

  async remove(_actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Tenant nao encontrado');
    }

    await this.repository.remove(id);
  }
}
