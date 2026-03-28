import type { TenantStatus, UserRole, UserStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../../app.js';
import { hashPassword } from '../../../lib/security/password.js';
import { AuthService } from '../../auth/auth.service.js';
import type { AuthRepository, LoginUserRecord, RefreshTokenRecord } from '../../auth/auth.repository.js';
import type { TenantValidation } from '../../auth/auth.types.js';
import type {
  GravacaoConvidadoRecord,
  GravacaoFigurinoRecord,
  GravacaoRecord,
  GravacaoTerceiroRecord,
  GravacoesRepository,
  SaveGravacaoInput,
} from '../gravacoes.repository.js';
import { GravacoesService } from '../gravacoes.service.js';

class RouteAuthRepository implements AuthRepository {
  user: LoginUserRecord = {
    id: 'user-1',
    tenantId: 'tenant-1',
    nome: 'Ana Silva',
    email: 'ana@kreato.app',
    usuario: 'ana',
    role: 'TENANT_ADMIN' as UserRole,
    status: 'ATIVO' as UserStatus,
    passwordHash: hashPassword('123456'),
    tenantStatus: 'ATIVO' as TenantStatus,
  };
  tenantValidation: TenantValidation = { valid: true };
  refreshTokens = new Map<string, RefreshTokenRecord>();

  async findUserForLogin(identifier: string) {
    return this.user.usuario === identifier || this.user.email === identifier ? this.user : null;
  }

  async findUserById(id: string) {
    return this.user.id === id ? this.user : null;
  }

  async validateTenantAccess() {
    return this.tenantValidation;
  }

  async getAuthorizationContext() {
    return { perfil: 'Administrador Tenant', tipoAcesso: 'Operacional', unidadeIds: [], enabledModules: ['Dashboard', 'Produ��o', 'Recursos', 'Administra��o'], permissions: [] };
  }

  async createRefreshToken(input: { userId: string; tokenHash: string; expiresAt: Date }) {
    this.refreshTokens.set(input.tokenHash, {
      id: input.tokenHash,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
      user: { ...this.user, tenantStatus: this.user.tenantStatus },
    });
  }

  async findRefreshToken(tokenHash: string) {
    return this.refreshTokens.get(tokenHash) ?? null;
  }

  async revokeRefreshToken(tokenHash: string, revokedAt: Date) {
    const token = this.refreshTokens.get(tokenHash);
    if (token) token.revokedAt = revokedAt;
  }

  async revokeExpiredRefreshTokens() {}
}

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

describe('gravacoes routes', () => {
  it('cria e lista gravacoes via API protegida', async () => {
    const authService = new AuthService(new RouteAuthRepository(), () => new Date('2026-03-25T10:00:00.000Z'));
    const gravacoesService = new GravacoesService(new InMemoryGravacoesRepository());
    const app = await buildApp({ authService, gravacoesService });

    const loginResponse = await app.inject({ method: 'POST', url: '/auth/login', payload: { usuario: 'ana', password: '123456' } });
    const { accessToken } = loginResponse.json();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/gravacoes',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        codigo: '202600001',
        nome: 'Gravacao piloto',
        status: 'Planejada',
        dataPrevista: '2026-04-05',
        orcamento: 1500,
      },
    });

    expect(createResponse.statusCode).toBe(200);
    expect(createResponse.json()).toMatchObject({ codigo: '202600001', nome: 'Gravacao piloto' });

    const listResponse = await app.inject({
      method: 'GET',
      url: '/gravacoes',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json().data).toEqual([
      expect.objectContaining({ codigo: '202600001', nome: 'Gravacao piloto', status: 'Planejada' }),
    ]);

    await app.close();
  });
});
