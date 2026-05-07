import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { EspacosRepository } from './espacos.repository.js';

const faixaDisponibilidadeSchema = z.object({
  id: z.string().optional(),
  dataInicio: z.string().min(1),
  dataFim: z.string().min(1),
  horaInicio: z.string().min(1),
  horaFim: z.string().min(1),
  diasSemana: z.array(z.coerce.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
});

export const saveEspacoSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional().nullable(),
  codigoExterno: z.string().optional().nullable(),
  titulo: z.string().min(1),
  descricao: z.string().optional().nullable(),
  faixasDisponibilidade: z.array(faixaDisponibilidadeSchema).default([]),
});

export type SaveEspacoDto = z.infer<typeof saveEspacoSchema>;

export class EspacosService {
  constructor(private readonly repository: EspacosRepository) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId, opts);

    return {
      total,
      data: data.map((item) => ({
        id: item.id,
        codigoExterno: item.codigoExterno || '',
        titulo: item.titulo,
        descricao: item.descricao || '',
        faixasDisponibilidade: item.faixasDisponibilidade,
        dataCadastro: item.createdAt?.toISOString() || '',
        usuarioCadastro: item.createdByNome || '',
        usuarioCadastroId: item.createdBy || '',
      })),
    };
  }

  async save(actor: SessionUser, input: SaveEspacoDto) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id);
      if (!existing) throw new Error('Espaço não encontrado');
      ensureSameTenant(actor, existing.tenantId);
    }

    const item = await this.repository.save({
      id: input.id,
      tenantId,
      codigoExterno: input.codigoExterno,
      titulo: input.titulo,
      descricao: input.descricao,
      createdBy: actor.id,
      faixasDisponibilidade: input.faixasDisponibilidade.map((faixa) => ({
        id: faixa.id || '',
        dataInicio: faixa.dataInicio,
        dataFim: faixa.dataFim,
        horaInicio: faixa.horaInicio,
        horaFim: faixa.horaFim,
        diasSemana: faixa.diasSemana,
      })),
    });

    return {
      id: item.id,
      codigoExterno: item.codigoExterno || '',
      titulo: item.titulo,
      descricao: item.descricao || '',
      faixasDisponibilidade: item.faixasDisponibilidade,
      dataCadastro: item.createdAt?.toISOString() || '',
      usuarioCadastro: item.createdByNome || '',
      usuarioCadastroId: item.createdBy || '',
    };
  }

  async remove(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new Error('Espaço não encontrado');
    ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id);
  }
}
