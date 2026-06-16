import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

export type ContaPagarRecord = {
  id: string;
  tenantId: string;
  numeroDocumento: string | null;
  descricao: string;
  fornecedorId: string | null;
  fornecedorNome: string | null;
  dataEmissao: string | null;
  dataVencimento: string;
  dataPagamento: string | null;
  valor: number;
  moeda: string;
  valorPago: number | null;
  statusId: string | null;
  statusNome: string | null;
  statusCor: string | null;
  categoriaId: string | null;
  categoriaNome: string | null;
  formaPagamentoId: string | null;
  formaPagamentoNome: string | null;
  tipoDocumentoId: string | null;
  tipoDocumentoNome: string | null;
  observacoes: string | null;
  eventoOrcamentoItemId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type OrcamentoItemInput = {
  id: string;
  fornecedorId: string;
  fornecedorNome: string;
  servicoNomes: string[];
  centroLucroNome: string | null;
  valor: number;
  moeda: string;
  dataPagamento: string | null;
};

export type SaveContaPagarFromDespesaInput = {
  gravacaoDespesaId: string;
  tenantId: string;
  createdBy: string | null;
  titulo: string;
  numeroDocumento: string | null;
  descricao: string | null;
  dataVencimento: string | null;
  valor: number | null;
  fornecedorId: string | null;
  statusTitulo: string | null;
  categoriaTitulo: string | null;
  tipoDocumentoTitulo: string | null;
  formaPagamentoTitulo: string | null;
};

export type SaveContaPagarInput = {
  id?: string;
  tenantId: string;
  numeroDocumento?: string | null;
  descricao: string;
  fornecedorId?: string | null;
  dataEmissao?: string | null;
  dataVencimento: string;
  dataPagamento?: string | null;
  valor: number;
  valorPago?: number | null;
  statusId?: string | null;
  categoriaId?: string | null;
  formaPagamentoId?: string | null;
  tipoDocumentoId?: string | null;
  observacoes?: string | null;
  createdBy?: string | null;
};

export type ListContasPagarOptions = {
  limit?: number;
  offset?: number;
};

type ContaPagarRow = {
  id: string;
  tenant_id: string;
  numero_documento: string | null;
  descricao: string;
  fornecedor_id: string | null;
  fornecedor_nome: string | null;
  data_emissao: string | null;
  data_vencimento: string;
  data_pagamento: string | null;
  valor: string;
  moeda: string | null;
  valor_pago: string | null;
  status_id: string | null;
  status_nome: string | null;
  status_cor: string | null;
  categoria_id: string | null;
  categoria_nome: string | null;
  forma_pagamento_id: string | null;
  forma_pagamento_nome: string | null;
  tipo_documento_id: string | null;
  tipo_documento_nome: string | null;
  observacoes: string | null;
  evento_orcamento_item_id: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

let ensurePromise: Promise<void> | null = null;

async function ensureTables() {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      // Create table with fornecedor_id column
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS contas_pagar (
          id text PRIMARY KEY,
          tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
          numero_documento text NULL,
          descricao text NOT NULL,
          fornecedor_id text NULL,
          data_emissao date NULL,
          data_vencimento date NOT NULL,
          data_pagamento date NULL,
          valor numeric(15,2) NOT NULL DEFAULT 0,
          valor_pago numeric(15,2) NULL,
          status_id text NULL,
          categoria_id text NULL,
          forma_pagamento_id text NULL,
          tipo_documento_id text NULL,
          observacoes text NULL,
          created_by text NULL,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW()
        )
      `);

      // Migrate existing tables that still have the old text 'fornecedor' column
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'contas_pagar' AND column_name = 'fornecedor'
          ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'contas_pagar' AND column_name = 'fornecedor_id'
          ) THEN
            ALTER TABLE contas_pagar RENAME COLUMN fornecedor TO fornecedor_id;
          END IF;
        END
        $$;
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS contas_pagar_tenant_idx ON contas_pagar (tenant_id)
      `);

      await prisma.$executeRawUnsafe(`
        ALTER TABLE contas_pagar ADD COLUMN IF NOT EXISTS gravacao_despesa_id text NULL
      `);

      await prisma.$executeRawUnsafe(`
        ALTER TABLE contas_pagar ADD COLUMN IF NOT EXISTS evento_orcamento_item_id text NULL
      `);

      await prisma.$executeRawUnsafe(`
        ALTER TABLE contas_pagar ADD COLUMN IF NOT EXISTS moeda text NOT NULL DEFAULT 'BRL'
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS contas_pagar_evento_orcamento_idx
          ON contas_pagar (tenant_id, evento_orcamento_item_id)
          WHERE evento_orcamento_item_id IS NOT NULL
      `);
    })();
  }

  await ensurePromise;
}

const SELECT_COLUMNS = `
  cp.id, cp.tenant_id, cp.numero_documento, cp.descricao,
  cp.fornecedor_id, f.nome AS fornecedor_nome,
  cp.data_emissao::text, cp.data_vencimento::text, cp.data_pagamento::text,
  cp.valor, COALESCE(cp.moeda, 'BRL') AS moeda, cp.valor_pago,
  cp.status_id, scp.titulo AS status_nome, scp.cor AS status_cor,
  cp.categoria_id, cd.titulo AS categoria_nome,
  cp.forma_pagamento_id, fp.titulo AS forma_pagamento_nome,
  cp.tipo_documento_id, tdf.titulo AS tipo_documento_nome,
  cp.observacoes, cp.evento_orcamento_item_id, cp.created_at, cp.updated_at
`;

const SELECT_JOINS = `
  LEFT JOIN fornecedores f ON f.id = cp.fornecedor_id
  LEFT JOIN status_conta_pagar scp ON scp.id = cp.status_id
  LEFT JOIN categorias_despesa cd ON cd.id = cp.categoria_id
  LEFT JOIN formas_pagamento fp ON fp.id = cp.forma_pagamento_id
  LEFT JOIN tipos_documento_financeiro tdf ON tdf.id = cp.tipo_documento_id
`;

function rowToRecord(row: ContaPagarRow): ContaPagarRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    numeroDocumento: row.numero_documento,
    descricao: row.descricao,
    fornecedorId: row.fornecedor_id,
    fornecedorNome: row.fornecedor_nome,
    dataEmissao: row.data_emissao,
    dataVencimento: row.data_vencimento,
    dataPagamento: row.data_pagamento,
    valor: parseFloat(row.valor) || 0,
    moeda: row.moeda ?? 'BRL',
    valorPago: row.valor_pago != null ? parseFloat(row.valor_pago) : null,
    statusId: row.status_id,
    statusNome: row.status_nome,
    statusCor: row.status_cor,
    categoriaId: row.categoria_id,
    categoriaNome: row.categoria_nome,
    formaPagamentoId: row.forma_pagamento_id,
    formaPagamentoNome: row.forma_pagamento_nome,
    tipoDocumentoId: row.tipo_documento_id,
    tipoDocumentoNome: row.tipo_documento_nome,
    observacoes: row.observacoes,
    eventoOrcamentoItemId: row.evento_orcamento_item_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ContasPagarRepository {
  listByTenant(tenantId: string, opts?: ListContasPagarOptions): Promise<{ data: ContaPagarRecord[]; total: number }>;
  findById(id: string, tenantId: string): Promise<ContaPagarRecord | null>;
  save(input: SaveContaPagarInput): Promise<ContaPagarRecord>;
  remove(id: string, tenantId: string): Promise<void>;
  saveLinkedToGravacaoDespesa(input: SaveContaPagarFromDespesaInput): Promise<void>;
  updateLinkedToGravacaoDespesa(input: SaveContaPagarFromDespesaInput): Promise<void>;
  deleteByGravacaoDespesaId(tenantId: string, gravacaoDespesaId: string): Promise<void>;
  syncFromEventoOrcamento(
    tenantId: string,
    eventoId: string,
    eventoNome: string,
    itens: OrcamentoItemInput[],
    createdBy: string | null,
  ): Promise<void>;
  deleteByEventoId(tenantId: string, eventoId: string): Promise<void>;
}

export class PrismaContasPagarRepository implements ContasPagarRepository {
  async listByTenant(tenantId: string, opts: ListContasPagarOptions = {}): Promise<{ data: ContaPagarRecord[]; total: number }> {
    await ensureTables();

    const limit = opts.limit ?? 200;
    const offset = opts.offset ?? 0;

    const [countRows, rows] = await Promise.all([
      prisma.$queryRawUnsafe<[{ count: string }]>(
        `SELECT COUNT(*) as count FROM contas_pagar WHERE tenant_id = $1`,
        tenantId,
      ),
      prisma.$queryRawUnsafe<ContaPagarRow[]>(
        `SELECT ${SELECT_COLUMNS} FROM contas_pagar cp ${SELECT_JOINS}
         WHERE cp.tenant_id = $1
         ORDER BY cp.data_vencimento ASC, cp.created_at DESC
         LIMIT $2 OFFSET $3`,
        tenantId,
        limit,
        offset,
      ),
    ]);

    return {
      total: parseInt(countRows[0]?.count ?? '0', 10),
      data: rows.map(rowToRecord),
    };
  }

  async findById(id: string, tenantId: string): Promise<ContaPagarRecord | null> {
    await ensureTables();

    const rows = await prisma.$queryRawUnsafe<ContaPagarRow[]>(
      `SELECT ${SELECT_COLUMNS} FROM contas_pagar cp ${SELECT_JOINS}
       WHERE cp.id = $1 AND cp.tenant_id = $2`,
      id,
      tenantId,
    );

    return rows[0] ? rowToRecord(rows[0]) : null;
  }

  async save(input: SaveContaPagarInput): Promise<ContaPagarRecord> {
    await ensureTables();

    const id = input.id ?? randomUUID();
    const now = new Date();

    if (input.id) {
      await prisma.$executeRawUnsafe(
        `UPDATE contas_pagar SET
           numero_documento = $1, descricao = $2, fornecedor_id = $3,
           data_emissao = $4::date, data_vencimento = $5::date, data_pagamento = $6::date,
           valor = $7, valor_pago = $8,
           status_id = $9, categoria_id = $10, forma_pagamento_id = $11,
           tipo_documento_id = $12, observacoes = $13, updated_at = $14
         WHERE id = $15 AND tenant_id = $16`,
        input.numeroDocumento ?? null,
        input.descricao,
        input.fornecedorId ?? null,
        input.dataEmissao ?? null,
        input.dataVencimento,
        input.dataPagamento ?? null,
        input.valor,
        input.valorPago ?? null,
        input.statusId ?? null,
        input.categoriaId ?? null,
        input.formaPagamentoId ?? null,
        input.tipoDocumentoId ?? null,
        input.observacoes ?? null,
        now,
        input.id,
        input.tenantId,
      );
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO contas_pagar
           (id, tenant_id, numero_documento, descricao, fornecedor_id,
            data_emissao, data_vencimento, data_pagamento,
            valor, valor_pago, status_id, categoria_id, forma_pagamento_id,
            tipo_documento_id, observacoes, created_by, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6::date,$7::date,$8::date,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        id,
        input.tenantId,
        input.numeroDocumento ?? null,
        input.descricao,
        input.fornecedorId ?? null,
        input.dataEmissao ?? null,
        input.dataVencimento,
        input.dataPagamento ?? null,
        input.valor,
        input.valorPago ?? null,
        input.statusId ?? null,
        input.categoriaId ?? null,
        input.formaPagamentoId ?? null,
        input.tipoDocumentoId ?? null,
        input.observacoes ?? null,
        input.createdBy ?? null,
        now,
        now,
      );
    }

    const record = await this.findById(id, input.tenantId);
    if (!record) throw new Error('Conta a pagar não encontrada após salvar');
    return record;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await ensureTables();
    await prisma.$executeRawUnsafe(
      `DELETE FROM contas_pagar WHERE id = $1 AND tenant_id = $2`,
      id,
      tenantId,
    );
  }

  private async resolveParametrizacoesIds(tenantId: string, input: SaveContaPagarFromDespesaInput) {
    const [statusRows, categoriaRows, tipoDocRows, formaPagRows] = await Promise.all([
      input.statusTitulo
        ? prisma.$queryRawUnsafe<[{ id: string }]>(`SELECT id FROM status_conta_pagar WHERE tenant_id = $1 AND titulo = $2 LIMIT 1`, tenantId, input.statusTitulo)
        : Promise.resolve([] as { id: string }[]),
      input.categoriaTitulo
        ? prisma.$queryRawUnsafe<[{ id: string }]>(`SELECT id FROM categorias_despesa WHERE tenant_id = $1 AND titulo = $2 LIMIT 1`, tenantId, input.categoriaTitulo)
        : Promise.resolve([] as { id: string }[]),
      input.tipoDocumentoTitulo
        ? prisma.$queryRawUnsafe<[{ id: string }]>(`SELECT id FROM tipos_documento_financeiro WHERE tenant_id = $1 AND titulo = $2 LIMIT 1`, tenantId, input.tipoDocumentoTitulo)
        : Promise.resolve([] as { id: string }[]),
      input.formaPagamentoTitulo
        ? prisma.$queryRawUnsafe<[{ id: string }]>(`SELECT id FROM formas_pagamento WHERE tenant_id = $1 AND titulo = $2 LIMIT 1`, tenantId, input.formaPagamentoTitulo)
        : Promise.resolve([] as { id: string }[]),
    ]);
    return {
      statusId: statusRows[0]?.id ?? null,
      categoriaId: categoriaRows[0]?.id ?? null,
      tipoDocumentoId: tipoDocRows[0]?.id ?? null,
      formaPagamentoId: formaPagRows[0]?.id ?? null,
    };
  }

  async saveLinkedToGravacaoDespesa(input: SaveContaPagarFromDespesaInput): Promise<void> {
    await ensureTables();
    const ids = await this.resolveParametrizacoesIds(input.tenantId, input);
    const today = new Date().toISOString().slice(0, 10);
    const id = randomUUID();
    const now = new Date();
    await prisma.$executeRawUnsafe(
      `INSERT INTO contas_pagar (id, tenant_id, gravacao_despesa_id, numero_documento, descricao, fornecedor_id, data_vencimento, valor, status_id, categoria_id, tipo_documento_id, forma_pagamento_id, observacoes, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::date,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      id, input.tenantId, input.gravacaoDespesaId,
      input.numeroDocumento ?? null, input.titulo,
      input.fornecedorId ?? null, input.dataVencimento ?? today,
      input.valor ?? 0,
      ids.statusId, ids.categoriaId, ids.tipoDocumentoId, ids.formaPagamentoId,
      input.descricao ?? null, input.createdBy ?? null, now, now,
    );
  }

  async updateLinkedToGravacaoDespesa(input: SaveContaPagarFromDespesaInput): Promise<void> {
    await ensureTables();
    const ids = await this.resolveParametrizacoesIds(input.tenantId, input);
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    await prisma.$executeRawUnsafe(
      `UPDATE contas_pagar SET numero_documento=$1, descricao=$2, fornecedor_id=$3, data_vencimento=$4::date, valor=$5, status_id=$6, categoria_id=$7, tipo_documento_id=$8, forma_pagamento_id=$9, observacoes=$10, updated_at=$11
       WHERE tenant_id=$12 AND gravacao_despesa_id=$13`,
      input.numeroDocumento ?? null, input.titulo,
      input.fornecedorId ?? null, input.dataVencimento ?? today,
      input.valor ?? 0,
      ids.statusId, ids.categoriaId, ids.tipoDocumentoId, ids.formaPagamentoId,
      input.descricao ?? null, now,
      input.tenantId, input.gravacaoDespesaId,
    );
  }

  async deleteByGravacaoDespesaId(tenantId: string, gravacaoDespesaId: string): Promise<void> {
    await ensureTables();
    await prisma.$executeRawUnsafe(
      `DELETE FROM contas_pagar WHERE tenant_id = $1 AND gravacao_despesa_id = $2`,
      tenantId, gravacaoDespesaId,
    );
  }

  async syncFromEventoOrcamento(
    tenantId: string,
    eventoId: string,
    eventoNome: string,
    itens: OrcamentoItemInput[],
    createdBy: string | null,
  ): Promise<void> {
    await ensureTables();

    // composite key: "{eventoId}/{itemId}" — identifica unicamente cada conta no evento
    const makeKey = (itemId: string) => `${eventoId}/${itemId}`;

    // Carrega as contas existentes para este evento
    const existing = await prisma.$queryRawUnsafe<Array<{ id: string; evento_orcamento_item_id: string }>>(
      `SELECT id, evento_orcamento_item_id FROM contas_pagar
       WHERE tenant_id = $1 AND evento_orcamento_item_id LIKE $2`,
      tenantId,
      `${eventoId}/%`,
    );

    const existingByKey = new Map(existing.map((r) => [r.evento_orcamento_item_id, r.id]));
    const newKeys = new Set(itens.map((i) => makeKey(i.id)));

    // Remove contas cujos itens foram excluídos do orçamento
    for (const [key, cpId] of existingByKey) {
      if (!newKeys.has(key)) {
        await prisma.$executeRawUnsafe(
          `DELETE FROM contas_pagar WHERE id = $1 AND tenant_id = $2`,
          cpId, tenantId,
        );
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();

    for (const item of itens) {
      const key = makeKey(item.id);
      const dataVencimento = item.dataPagamento || today;
      const servicosPart = item.servicoNomes.length > 0 ? item.servicoNomes.join(', ') : null;
      const descricao = `Evento: ${eventoNome}`;
      const observacoes = [
        `Fornecedor: ${item.fornecedorNome}`,
        servicosPart ? `Serviços: ${servicosPart}` : null,
        item.centroLucroNome ? `Centro de Custo: ${item.centroLucroNome}` : null,
      ].filter(Boolean).join(' | ');

      const existingId = existingByKey.get(key);

      if (existingId) {
        await prisma.$executeRawUnsafe(
          `UPDATE contas_pagar SET
             descricao = $1, fornecedor_id = $2, data_vencimento = $3::date,
             valor = $4, moeda = $5, observacoes = $6, updated_at = $7
           WHERE id = $8 AND tenant_id = $9`,
          descricao, item.fornecedorId, dataVencimento,
          item.valor, item.moeda, observacoes, now,
          existingId, tenantId,
        );
      } else {
        await prisma.$executeRawUnsafe(
          `INSERT INTO contas_pagar
             (id, tenant_id, descricao, fornecedor_id, data_vencimento, valor, moeda,
              observacoes, evento_orcamento_item_id, created_by, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5::date,$6,$7,$8,$9,$10,$11,$12)`,
          randomUUID(), tenantId, descricao, item.fornecedorId, dataVencimento,
          item.valor, item.moeda, observacoes, key, createdBy, now, now,
        );
      }
    }
  }

  async deleteByEventoId(tenantId: string, eventoId: string): Promise<void> {
    await ensureTables();
    await prisma.$executeRawUnsafe(
      `DELETE FROM contas_pagar WHERE tenant_id = $1 AND evento_orcamento_item_id LIKE $2`,
      tenantId,
      `${eventoId}/%`,
    );
  }
}
