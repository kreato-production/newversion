import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { AlocacoesRepository, AlocacaoRecord } from './alocacoes.repository.js';

export const allocationConflictQuerySchema = z.object({
  tipo: z.enum(['tecnico', 'fisico']),
  recursoId: z.string().min(1),
});

export const saveAllocationAnchorSchema = z.object({
  tipo: z.enum(['tecnico', 'fisico']),
  recursoId: z.string().min(1),
  estoqueItemId: z.string().optional().nullable(),
});

export const saveAllocationHorarioSchema = z.object({
  horaInicio: z.string().optional().nullable(),
  horaFim: z.string().optional().nullable(),
  estoqueItemId: z.string().optional().nullable(),
});

export const saveAllocationColaboradorSchema = z.object({
  recursoHumanoId: z.string().min(1),
  horaInicio: z.string().min(1),
  horaFim: z.string().min(1),
});

function timeRangeToHours(horaInicio: string | null, horaFim: string | null): number {
  if (!horaInicio || !horaFim) {
    return 0;
  }

  const [h1, m1] = horaInicio.split(':').map(Number);
  const [h2, m2] = horaFim.split(':').map(Number);
  return ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
}

function mapAllocation(
  item: AlocacaoRecord,
  dataPrevista: string | null,
  allItems: AlocacaoRecord[],
) {
  const isTecnicoAnchor = Boolean(item.recursoTecnicoId) && !item.recursoHumanoId;
  const isFisicoAnchor = Boolean(item.recursoFisicoId) && !item.recursoHumanoId;

  if (!isTecnicoAnchor && !isFisicoAnchor) {
    return null;
  }

  const horas = dataPrevista && item.horaInicio && item.horaFim
    ? { [dataPrevista]: timeRangeToHours(item.horaInicio, item.horaFim) }
    : {};

  const horarios = dataPrevista && item.horaInicio && item.horaFim
    ? { [dataPrevista]: { horaInicio: item.horaInicio.slice(0, 5), horaFim: item.horaFim.slice(0, 5) } }
    : {};

  const colaboradores = allItems
    .filter((row) => row.parentRecursoId === item.id && row.recursoHumanoId)
    .map((row) => ({
      id: row.id,
      recursoHumanoId: row.recursoHumanoId as string,
      nome: `${row.recursoHumanoNome || ''} ${row.recursoHumanoSobrenome || ''}`.trim(),
      horaInicio: row.horaInicio?.slice(0, 5) || '08:00',
      horaFim: row.horaFim?.slice(0, 5) || '18:00',
    }));

  return {
    id: item.id,
    anchorDbId: item.id,
    tipo: isTecnicoAnchor ? 'tecnico' : 'fisico',
    recursoId: (item.recursoTecnicoId || item.recursoFisicoId) as string,
    recursoNome: item.recursoTecnicoNome || item.recursoFisicoNome || '',
    funcaoOperador: item.recursoTecnicoFuncaoOperador || undefined,
    estoqueItemId: item.estoqueItemId || undefined,
    estoqueItemNome: item.estoqueItemNome
      ? `#${item.estoqueItemNumerador || 0} - ${item.estoqueItemNome}${item.estoqueItemCodigo ? ` (${item.estoqueItemCodigo})` : ''}`
      : undefined,
    horas,
    recursosHumanos: dataPrevista && colaboradores.length > 0 ? { [dataPrevista]: colaboradores } : {},
    horarios,
  };
}

export class AlocacoesService {
  constructor(private readonly repository: AlocacoesRepository) {}

  async listByGravacao(actor: SessionUser, gravacaoId: string) {
    const gravacao = await this.repository.findGravacao(gravacaoId);
    if (!gravacao) {
      throw new Error('Gravacao nao encontrada');
    }

    ensureSameTenant(actor, gravacao.tenantId);

    const rows = await this.repository.listByGravacao(gravacao.tenantId, gravacaoId);
    const data = rows
      .map((row) => mapAllocation(row, gravacao.dataPrevista, rows))
      .filter((item): item is NonNullable<ReturnType<typeof mapAllocation>> => Boolean(item));

    return {
      gravacao: {
        id: gravacao.id,
        nome: gravacao.nome,
        codigo: gravacao.codigo,
        dataPrevista: gravacao.dataPrevista || '',
        conteudoId: gravacao.conteudoId || '',
      },
      data,
    };
  }

  async listOverview(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { alocacoes, terceiros } = await this.repository.listOverview(tenantId);

    return {
      alocacoes,
      terceiros,
    };
  }

  async listConflicts(
    actor: SessionUser,
    gravacaoId: string,
    tipo: 'tecnico' | 'fisico',
    recursoId: string,
  ) {
    const gravacao = await this.repository.findGravacao(gravacaoId);
    if (!gravacao) {
      throw new Error('Gravacao nao encontrada');
    }

    ensureSameTenant(actor, gravacao.tenantId);

    const rows = await this.repository.listConflicts(gravacao.tenantId, gravacaoId, tipo, recursoId);
    return {
      data: rows,
    };
  }

  async addAnchor(actor: SessionUser, gravacaoId: string, input: z.infer<typeof saveAllocationAnchorSchema>) {
    const gravacao = await this.repository.findGravacao(gravacaoId);
    if (!gravacao) {
      throw new Error('Gravacao nao encontrada');
    }

    ensureSameTenant(actor, gravacao.tenantId);

    const saved = await this.repository.addAnchor({
      tenantId: gravacao.tenantId,
      gravacaoId,
      tipo: input.tipo,
      recursoId: input.recursoId,
      estoqueItemId: input.estoqueItemId ?? null,
    });

    const defaultHours = await this.repository.findDefaultHours(
      gravacao.tenantId,
      gravacao.conteudoId,
      input.tipo,
      input.recursoId,
    );

    const withSchedule = defaultHours > 0 && gravacao.dataPrevista
      ? await this.repository.updateHorario({
          id: saved.id,
          tenantId: gravacao.tenantId,
          gravacaoId,
          horaInicio: '00:00',
          horaFim: `${String(Math.floor(defaultHours)).padStart(2, '0')}:${String(Math.round((defaultHours % 1) * 60)).padStart(2, '0')}`,
        })
      : saved;

    const rows = await this.repository.listByGravacao(gravacao.tenantId, gravacaoId);
    const mapped = mapAllocation(withSchedule || saved, gravacao.dataPrevista, rows);
    if (!mapped) {
      throw new Error('Alocacao nao encontrada apos salvar');
    }

    return mapped;
  }

  async updateHorario(
    actor: SessionUser,
    gravacaoId: string,
    allocationId: string,
    input: z.infer<typeof saveAllocationHorarioSchema>,
  ) {
    const gravacao = await this.repository.findGravacao(gravacaoId);
    if (!gravacao) {
      throw new Error('Gravacao nao encontrada');
    }

    ensureSameTenant(actor, gravacao.tenantId);

    const existing = await this.repository.findAllocationById(allocationId);
    if (!existing || existing.gravacaoId !== gravacaoId) {
      throw new Error('Alocacao nao encontrada');
    }

    const updated = await this.repository.updateHorario({
      id: allocationId,
      tenantId: gravacao.tenantId,
      gravacaoId,
      horaInicio: input.horaInicio ?? null,
      horaFim: input.horaFim ?? null,
      estoqueItemId: input.estoqueItemId,
    });

    if (!updated) {
      throw new Error('Alocacao nao encontrada');
    }

    const rows = await this.repository.listByGravacao(gravacao.tenantId, gravacaoId);
    const mapped = mapAllocation(updated, gravacao.dataPrevista, rows);
    if (mapped) {
      return mapped;
    }

    return {
      id: updated.id,
      horaInicio: updated.horaInicio?.slice(0, 5) || '',
      horaFim: updated.horaFim?.slice(0, 5) || '',
    };
  }

  async addColaborador(
    actor: SessionUser,
    gravacaoId: string,
    anchorId: string,
    input: z.infer<typeof saveAllocationColaboradorSchema>,
  ) {
    const gravacao = await this.repository.findGravacao(gravacaoId);
    if (!gravacao) {
      throw new Error('Gravacao nao encontrada');
    }

    ensureSameTenant(actor, gravacao.tenantId);

    const anchor = await this.repository.findAllocationById(anchorId);
    if (!anchor || anchor.gravacaoId !== gravacaoId || !anchor.recursoTecnicoId) {
      throw new Error('Recurso tecnico da gravacao nao encontrado');
    }

    const saved = await this.repository.addColaborador({
      tenantId: gravacao.tenantId,
      gravacaoId,
      parentRecursoId: anchorId,
      recursoHumanoId: input.recursoHumanoId,
      horaInicio: input.horaInicio,
      horaFim: input.horaFim,
    });

    return {
      id: saved.id,
      recursoHumanoId: saved.recursoHumanoId || '',
      nome: `${saved.recursoHumanoNome || ''} ${saved.recursoHumanoSobrenome || ''}`.trim(),
      horaInicio: saved.horaInicio?.slice(0, 5) || '08:00',
      horaFim: saved.horaFim?.slice(0, 5) || '18:00',
    };
  }

  async removeAllocation(actor: SessionUser, gravacaoId: string, allocationId: string) {
    const gravacao = await this.repository.findGravacao(gravacaoId);
    if (!gravacao) {
      throw new Error('Gravacao nao encontrada');
    }

    ensureSameTenant(actor, gravacao.tenantId);

    const existing = await this.repository.findAllocationById(allocationId);
    if (!existing || existing.gravacaoId !== gravacaoId) {
      throw new Error('Alocacao nao encontrada');
    }

    await this.repository.removeAllocation(allocationId);
  }
}
