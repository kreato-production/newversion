import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { ContasPagarRepository } from './contas-pagar.repository.js';

const emptyToNull = (value: unknown) => {
  if (typeof value === 'string' && value.trim() === '') return null;
  return value;
};
const optionalString = z.preprocess(emptyToNull, z.string().optional().nullable());
const optionalNumber = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
  z.number().optional().nullable(),
);

export const saveContaPagarSchema = z.object({
  id: z.string().optional(),
  numeroDocumento: optionalString,
  descricao: z.string().min(1),
  fornecedorId: optionalString,
  dataEmissao: optionalString,
  dataVencimento: z.string().min(1),
  dataPagamento: optionalString,
  valor: z.preprocess((v) => (v === null || v === undefined || v === '' ? 0 : Number(v)), z.number().min(0)),
  valorPago: optionalNumber,
  statusId: optionalString,
  categoriaId: optionalString,
  formaPagamentoId: optionalString,
  tipoDocumentoId: optionalString,
  observacoes: optionalString,
});

export type SaveContaPagarData = z.infer<typeof saveContaPagarSchema>;

export class ContasPagarService {
  constructor(private readonly repository: ContasPagarRepository) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId, opts);
    return { total, data: data.map(mapContaPagar) };
  }

  async save(actor: SessionUser, input: SaveContaPagarData) {
    const tenantId = resolveTenantId(actor, actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id, tenantId);
      if (existing) ensureSameTenant(actor, existing.tenantId);
    }

    const record = await this.repository.save({
      id: input.id,
      tenantId,
      numeroDocumento: input.numeroDocumento,
      descricao: input.descricao,
      fornecedorId: input.fornecedorId,
      dataEmissao: input.dataEmissao,
      dataVencimento: input.dataVencimento,
      dataPagamento: input.dataPagamento,
      valor: input.valor,
      valorPago: input.valorPago,
      statusId: input.statusId,
      categoriaId: input.categoriaId,
      formaPagamentoId: input.formaPagamentoId,
      tipoDocumentoId: input.tipoDocumentoId,
      observacoes: input.observacoes,
      createdBy: actor.nome,
    });

    return mapContaPagar(record);
  }

  async remove(actor: SessionUser, id: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const existing = await this.repository.findById(id, tenantId);
    if (existing) ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id, tenantId);
  }
}

function mapContaPagar(item: Awaited<ReturnType<ContasPagarRepository['findById']>> extends infer T ? Exclude<T, null> : never) {
  return {
    id: item.id,
    numeroDocumento: item.numeroDocumento ?? '',
    descricao: item.descricao,
    fornecedorId: item.fornecedorId ?? '',
    fornecedorNome: item.fornecedorNome ?? '',
    dataEmissao: item.dataEmissao ?? '',
    dataVencimento: item.dataVencimento,
    dataPagamento: item.dataPagamento ?? '',
    valor: item.valor,
    valorPago: item.valorPago ?? null,
    statusId: item.statusId ?? '',
    statusNome: item.statusNome ?? '',
    statusCor: item.statusCor ?? '',
    categoriaId: item.categoriaId ?? '',
    categoriaNome: item.categoriaNome ?? '',
    formaPagamentoId: item.formaPagamentoId ?? '',
    formaPagamentoNome: item.formaPagamentoNome ?? '',
    tipoDocumentoId: item.tipoDocumentoId ?? '',
    tipoDocumentoNome: item.tipoDocumentoNome ?? '',
    observacoes: item.observacoes ?? '',
    createdAt: item.createdAt?.toISOString() ?? '',
    updatedAt: item.updatedAt?.toISOString() ?? '',
  };
}
