import type { SessionUser } from '../auth/auth.types.js';
import { describe, expect, it } from 'vitest';
import type {
  GravacaoConvidadoRecord,
  GravacaoFigurinoRecord,
  GravacaoRecord,
  GravacaoTerceiroRecord,
  GravacoesRepository,
  SaveGravacaoInput,
} from './gravacoes.repository.js';
import { GravacoesService } from './gravacoes.service.js';

class InMemoryGravacoesRepository implements GravacoesRepository {
  records: GravacaoRecord[] = [];

  async listByTenant(tenantId: string) {
    const data = this.records.filter((item) => item.tenantId === tenantId);
    return { data, total: data.length };
  }

  async findById(id: string) {
    return this.records.find((item) => item.id === id) ?? null;
  }

  async save(input: SaveGravacaoInput) {
    const record: GravacaoRecord = {
      id: input.id ?? 'gravacao-1',
      tenantId: input.tenantId,
      codigo: input.codigo,
      codigoExterno: input.codigoExterno ?? null,
      nome: input.nome,
      descricao: input.descricao ?? null,
      unidadeNegocioId: input.unidadeNegocioId ?? null,
      unidadeNegocioNome: 'Unidade 1',
      centroLucro: input.centroLucro ?? null,
      classificacao: input.classificacao ?? null,
      tipoConteudo: input.tipoConteudo ?? null,
      status: input.status ?? null,
      dataPrevista: input.dataPrevista ?? null,
      conteudoId: input.conteudoId ?? null,
      orcamento: input.orcamento ?? 0,
      programaId: input.programaId ?? null,
      programaNome: input.programaId ? 'Programa 1' : null,
      createdAt: new Date('2026-03-25T10:00:00.000Z'),
    };

    this.records = [...this.records.filter((item) => item.id !== record.id), record];
    return record;
  }

  async remove(id: string) {
    this.records = this.records.filter((item) => item.id !== id);
  }

  async listFigurinos() {
    return { figurinos: [], items: [] };
  }

  async addFigurino(): Promise<GravacaoFigurinoRecord> {
    throw new Error('Not implemented in test double');
  }

  async updateFigurino() {
    return null;
  }

  async findFigurinoAllocationById() {
    return null;
  }

  async removeFigurino() {}

  async listTerceiros() {
    return { items: [], fornecedores: [], servicos: [], moeda: 'BRL' };
  }

  async addTerceiro(): Promise<GravacaoTerceiroRecord> {
    throw new Error('Not implemented in test double');
  }

  async findTerceiroById() {
    return null;
  }

  async removeTerceiro() {}

  async listConvidados() {
    return { pessoas: [], items: [] };
  }

  async addConvidado(): Promise<GravacaoConvidadoRecord> {
    throw new Error('Not implemented in test double');
  }

  async findConvidadoById() {
    return null;
  }

  async removeConvidado() {}
}

const actor: SessionUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  nome: 'Ana',
  email: 'ana@kreato.app',
  usuario: 'ana',
  role: 'TENANT_ADMIN',
  perfil: 'Administrador Tenant',
  tipoAcesso: 'Operacional',
  unidadeIds: [],
  enabledModules: ['Dashboard', 'Produ��o', 'Recursos', 'Administra��o'],
  permissions: [],
};

describe('GravacoesService', () => {
  it('lista gravacoes do tenant do ator', async () => {
    const repository = new InMemoryGravacoesRepository();
    repository.records = [
      {
        id: 'gravacao-1',
        tenantId: 'tenant-1',
        codigo: '202600001',
        codigoExterno: null,
        nome: 'Capitulo 1',
        descricao: null,
        unidadeNegocioId: null,
        unidadeNegocioNome: null,
        centroLucro: null,
        classificacao: null,
        tipoConteudo: null,
        status: 'Planejada',
        dataPrevista: new Date('2026-04-01T00:00:00.000Z'),
        conteudoId: null,
        orcamento: 100,
        programaId: null,
        programaNome: null,
        createdAt: new Date('2026-03-25T10:00:00.000Z'),
      },
      {
        id: 'gravacao-2',
        tenantId: 'tenant-2',
        codigo: '202600002',
        codigoExterno: null,
        nome: 'Outro tenant',
        descricao: null,
        unidadeNegocioId: null,
        unidadeNegocioNome: null,
        centroLucro: null,
        classificacao: null,
        tipoConteudo: null,
        status: null,
        dataPrevista: null,
        conteudoId: null,
        orcamento: 0,
        programaId: null,
        programaNome: null,
        createdAt: new Date('2026-03-25T10:00:00.000Z'),
      },
    ];

    const service = new GravacoesService(repository);
    const result = await service.list(actor);

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({ id: 'gravacao-1', codigo: '202600001', status: 'Planejada' });
  });

  it('salva gravacao no tenant do ator', async () => {
    const repository = new InMemoryGravacoesRepository();
    const service = new GravacoesService(repository);

    const result = await service.save(actor, {
      codigo: '202600003',
      nome: 'Nova gravacao',
      status: 'Planejada',
      dataPrevista: '2026-04-10',
      orcamento: 2500,
      programaId: 'programa-1',
    });

    expect(result).toMatchObject({
      codigo: '202600003',
      nome: 'Nova gravacao',
      status: 'Planejada',
      dataPrevista: '2026-04-10',
      orcamento: 2500,
    });
  });
});
