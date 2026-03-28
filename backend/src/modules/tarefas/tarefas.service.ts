import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { TarefasRepository } from './tarefas.repository.js';

const emptyToNull = (value: unknown) => {
  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }

  return value;
};

const optionalString = z.preprocess(emptyToNull, z.string().optional().nullable());

export const saveTarefaSchema = z.object({
  id: z.string().optional(),
  gravacaoId: optionalString,
  recursoHumanoId: optionalString,
  recursoTecnicoId: optionalString,
  titulo: z.string().min(1),
  descricao: optionalString,
  statusId: optionalString,
  prioridade: z.enum(['baixa', 'media', 'alta']).default('media'),
  dataInicio: optionalString,
  dataFim: optionalString,
  horaInicio: optionalString,
  horaFim: optionalString,
  observacoes: optionalString,
});

function mapTarefa(item: Awaited<ReturnType<TarefasRepository['findById']>> extends infer T ? Exclude<T, null> : never) {
  return {
    id: item.id,
    gravacaoId: item.gravacaoId || '',
    gravacaoNome: item.gravacaoNome || '',
    recursoHumanoId: item.recursoHumanoId || '',
    recursoHumanoNome: `${item.recursoHumanoNome || ''} ${item.recursoHumanoSobrenome || ''}`.trim(),
    recursoTecnicoId: item.recursoTecnicoId || '',
    recursoTecnicoNome: item.recursoTecnicoNome || '',
    titulo: item.titulo,
    descricao: item.descricao || '',
    statusId: item.statusId || '',
    statusNome: item.statusNome || '',
    statusCor: item.statusCor || '',
    statusCodigo: item.statusCodigo || '',
    prioridade: item.prioridade,
    dataInicio: item.dataInicio || '',
    dataFim: item.dataFim || '',
    horaInicio: item.horaInicio ? item.horaInicio.slice(0, 5) : '',
    horaFim: item.horaFim ? item.horaFim.slice(0, 5) : '',
    dataCriacao: item.createdAt?.toISOString() || '',
    dataAtualizacao: item.updatedAt?.toISOString() || '',
    observacoes: item.observacoes || '',
  };
}

export class TarefasService {
  constructor(private readonly repository: TarefasRepository) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const allowedRhIds = await this.resolveAllowedRhIds(actor);
    const { data, total } = await this.repository.listByTenant(tenantId, {
      ...opts,
      unidadeIds: actor.unidadeIds,
      allowedRhIds,
    });

    return {
      total,
      data: data.map((item) => mapTarefa(item)),
    };
  }

  async listOptions(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const allowedRhIds = await this.resolveAllowedRhIds(actor);
    const [statusList, gravacoes, recursosHumanos] = await Promise.all([
      this.repository.listStatusOptions(tenantId),
      this.repository.listGravacaoOptions(tenantId, actor.unidadeIds),
      this.repository.listRecursoHumanoOptions(tenantId, allowedRhIds),
    ]);

    return {
      statusList: statusList.map((item) => ({
        id: item.id,
        codigo: item.codigo,
        nome: item.nome,
        cor: item.cor || '',
        is_inicial: item.isInicial,
      })),
      gravacoes: gravacoes.map((item) => ({
        id: item.id,
        nome: item.nome,
      })),
      recursosHumanos: recursosHumanos.map((item) => ({
        id: item.id,
        nome: `${item.nome} ${item.sobrenome}`.trim(),
        status: item.status || 'Ativo',
        funcaoId: item.funcaoId || '',
      })),
    };
  }

  async listByGravacao(actor: SessionUser, gravacaoId: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const allowedRhIds = await this.resolveAllowedRhIds(actor);
    const rows = await this.repository.listByGravacao(tenantId, gravacaoId, allowedRhIds);
    return {
      data: rows.map((item) => mapTarefa(item)),
    };
  }

  async save(actor: SessionUser, input: z.infer<typeof saveTarefaSchema>) {
    const tenantId = resolveTenantId(actor, actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id);
      if (!existing) {
        throw new Error('Tarefa nao encontrada');
      }
      ensureSameTenant(actor, existing.tenantId);
    }

    const saved = await this.repository.save({
      id: input.id,
      tenantId,
      gravacaoId: input.gravacaoId,
      recursoHumanoId: input.recursoHumanoId,
      recursoTecnicoId: input.recursoTecnicoId,
      titulo: input.titulo,
      descricao: input.descricao,
      statusId: input.statusId,
      prioridade: input.prioridade,
      dataInicio: input.dataInicio,
      dataFim: input.dataFim,
      horaInicio: input.horaInicio,
      horaFim: input.horaFim,
      observacoes: input.observacoes,
    });

    return mapTarefa(saved);
  }

  async remove(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Tarefa nao encontrada');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id);
  }

  private async resolveAllowedRhIds(actor: SessionUser): Promise<string[] | null> {
    if (
      actor.role === 'GLOBAL_ADMIN' ||
      actor.role === 'TENANT_ADMIN' ||
      actor.perfil.toLowerCase().includes('administrador')
    ) {
      return null;
    }

    const ownRhId = await this.repository.getUserRecursoHumanoId(actor.id);

    if (actor.tipoAcesso === 'Operacional') {
      return ownRhId ? [ownRhId] : [];
    }

    if (actor.tipoAcesso === 'Coordenação' || actor.tipoAcesso === 'Coordenacao') {
      const teamRhIds = await this.repository.listTeamRecursoHumanoIds(actor.id);
      const merged = new Set<string>(teamRhIds);

      if (ownRhId) {
        merged.add(ownRhId);
      }

      return Array.from(merged);
    }

    return null;
  }
}
