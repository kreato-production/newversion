import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { TabelasPrecoRepository } from './tabelas-preco.repository.js';

const recursoTipoSchema = z.enum(['tecnico', 'fisico']);

export const saveTabelaPrecoSchema = z.object({
  id: z.string().min(1).optional(),
  tenantId: z.string().min(1).optional(),
  codigoExterno: z.string().optional().nullable(),
  nome: z.string().min(1),
  status: z.enum(['Ativo', 'Inativo']).optional(),
  vigenciaInicio: z.string().optional().nullable(),
  vigenciaFim: z.string().optional().nullable(),
  descricao: z.string().optional().nullable(),
  unidadeNegocioId: z.string().optional().nullable(),
});

export const saveTabelaPrecoRecursoSchema = z.object({
  recursoId: z.string().min(1),
  valorHora: z.coerce.number().min(0),
  tipo: recursoTipoSchema,
});

export type SaveTabelaPrecoDto = z.infer<typeof saveTabelaPrecoSchema>;
export type SaveTabelaPrecoRecursoDto = z.infer<typeof saveTabelaPrecoRecursoSchema>;

function formatDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : '';
}

function mapTabelaPreco(item: {
  id: string;
  codigoExterno: string | null;
  nome: string;
  status: string | null;
  vigenciaInicio: Date | null;
  vigenciaFim: Date | null;
  descricao: string | null;
  createdAt: Date | null;
  createdBy: string | null;
  unidadeNegocioId: string | null;
  unidadeNegocioNome: string | null;
  moeda: string | null;
}) {
  return {
    id: item.id,
    codigoExterno: item.codigoExterno || '',
    nome: item.nome,
    status: item.status || 'Ativo',
    vigenciaInicio: formatDate(item.vigenciaInicio),
    vigenciaFim: formatDate(item.vigenciaFim),
    descricao: item.descricao || '',
    dataCadastro: item.createdAt?.toISOString() ?? '',
    usuarioCadastro: item.createdBy || '',
    unidadeNegocioId: item.unidadeNegocioId || '',
    unidadeNegocioNome: item.unidadeNegocioNome || '',
    moeda: item.moeda || 'BRL',
  };
}

export class TabelasPrecoService {
  constructor(private readonly repository: TabelasPrecoRepository) {}

  async list(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const rows = await this.repository.listByTenant(tenantId, actor.unidadeIds);
    return { data: rows.map(mapTabelaPreco) };
  }

  async save(actor: SessionUser, input: SaveTabelaPrecoDto) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id);
      if (!existing) {
        throw new Error('Tabela de preco nao encontrada');
      }
      ensureSameTenant(actor, existing.tenantId);
    }

    const saved = await this.repository.save({
      id: input.id,
      tenantId,
      codigoExterno: input.codigoExterno,
      nome: input.nome,
      status: input.status,
      vigenciaInicio: input.vigenciaInicio,
      vigenciaFim: input.vigenciaFim,
      descricao: input.descricao,
      unidadeNegocioId: input.unidadeNegocioId,
      createdBy: actor.nome,
    });

    return mapTabelaPreco(saved);
  }

  async remove(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Tabela de preco nao encontrada');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id);
  }

  async listOptions(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const unidades = await this.repository.listUnidadesNegocio(tenantId, actor.unidadeIds);

    return {
      unidades: unidades.map((item) => ({
        id: item.id,
        nome: item.nome,
        moeda: item.moeda || 'BRL',
      })),
    };
  }

  async listRecursos(actor: SessionUser, tabelaPrecoId: string, tipo: z.infer<typeof recursoTipoSchema>) {
    const existing = await this.repository.findById(tabelaPrecoId);
    if (!existing) {
      throw new Error('Tabela de preco nao encontrada');
    }

    ensureSameTenant(actor, existing.tenantId);
    const result = await this.repository.listRecursosTabela(tabelaPrecoId, tipo);

    return {
      items: result.items.map((item) => ({
        id: item.id,
        tabelaPrecoId: item.tabelaPrecoId,
        recursoId: item.recursoId,
        valorHora: item.valorHora,
        recursoNome: item.recursoNome,
      })),
      recursos: result.recursos,
    };
  }

  async addRecurso(actor: SessionUser, tabelaPrecoId: string, input: SaveTabelaPrecoRecursoDto) {
    const existing = await this.repository.findById(tabelaPrecoId);
    if (!existing) {
      throw new Error('Tabela de preco nao encontrada');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.addRecurso({
      tabelaPrecoId,
      tenantId: existing.tenantId,
      recursoId: input.recursoId,
      valorHora: input.valorHora,
      tipo: input.tipo,
    });

    return this.listRecursos(actor, tabelaPrecoId, input.tipo);
  }

  async removeRecurso(actor: SessionUser, tabelaPrecoId: string, itemId: string, tipo: z.infer<typeof recursoTipoSchema>) {
    const existing = await this.repository.findById(tabelaPrecoId);
    if (!existing) {
      throw new Error('Tabela de preco nao encontrada');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.removeRecurso(itemId, tipo);
  }
}
