import type { TenantStatus, UserRole, UserStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import { hashPassword } from '../lib/security/password.js';
import type { AuthRepository, LoginUserRecord, RefreshTokenRecord } from '../modules/auth/auth.repository.js';
import { AuthService } from '../modules/auth/auth.service.js';
import type { TenantValidation } from '../modules/auth/auth.types.js';
import type {
  GravacaoConvidadoRecord,
  GravacaoFigurinoRecord,
  GravacaoRecord,
  GravacaoTerceiroRecord,
  GravacoesRepository,
  SaveGravacaoInput,
} from '../modules/gravacoes/gravacoes.repository.js';
import { GravacoesService } from '../modules/gravacoes/gravacoes.service.js';
import type { ProgramasRepository, ProgramaRecord, SaveProgramaInput } from '../modules/programas/programas.repository.js';
import { ProgramasService } from '../modules/programas/programas.service.js';
import type { HealthService } from '../routes/health/health.presenter.js';

class UpHealthService implements HealthService {
  async checkReadiness() { return { database: 'up' as const }; }
}

class RouteAuthRepository implements AuthRepository {
  user: LoginUserRecord = {
    id: 'user-1', tenantId: '11111111-1111-1111-1111-111111111111', nome: 'Ana Silva', email: 'ana@kreato.app', usuario: 'ana', role: 'TENANT_ADMIN' as UserRole, status: 'ATIVO' as UserStatus, passwordHash: hashPassword('123456'), tenantStatus: 'ATIVO' as TenantStatus,
  };
  tenantValidation: TenantValidation = { valid: true };
  refreshTokens = new Map<string, RefreshTokenRecord>();
  async findUserForLogin(identifier: string) { return this.user.usuario === identifier || this.user.email === identifier ? this.user : null; }
  async findUserById(id: string) { return this.user.id === id ? this.user : null; }
  async validateTenantAccess() { return this.tenantValidation; }
  async getAuthorizationContext() { return { perfil: 'Administrador Tenant', tipoAcesso: 'Operacional', unidadeIds: [], enabledModules: ['Dashboard', 'Produção', 'Recursos', 'Administração'], permissions: [] }; }
  async createRefreshToken(input: { userId: string; tokenHash: string; expiresAt: Date }) { this.refreshTokens.set(input.tokenHash, { id: input.tokenHash, userId: input.userId, tokenHash: input.tokenHash, expiresAt: input.expiresAt, revokedAt: null, user: { ...this.user, tenantStatus: this.user.tenantStatus } }); }
  async findRefreshToken(tokenHash: string) { return this.refreshTokens.get(tokenHash) ?? null; }
  async revokeRefreshToken(tokenHash: string, revokedAt: Date) { const token = this.refreshTokens.get(tokenHash); if (token) token.revokedAt = revokedAt; }
  async revokeExpiredRefreshTokens() {}
}

class InMemoryProgramasRepository implements ProgramasRepository {
  items = new Map<string, ProgramaRecord>();
  async listByTenant(tenantId: string) { const data = [...this.items.values()].filter((item) => item.tenantId === tenantId); return { data, total: data.length }; }
  async findById(id: string) { return this.items.get(id) ?? null; }
  async save(input: SaveProgramaInput) { const item: ProgramaRecord = { id: input.id ?? crypto.randomUUID(), tenantId: input.tenantId, codigoExterno: input.codigoExterno ?? null, nome: input.nome, descricao: input.descricao ?? null, unidadeNegocioId: input.unidadeNegocioId ?? null, unidadeNegocioNome: 'Unidade A', createdAt: new Date('2026-03-25T12:00:00.000Z') }; this.items.set(item.id, item); return item; }
  async remove(id: string) { this.items.delete(id); }
}

class InMemoryGravacoesRepository implements GravacoesRepository {
  items = new Map<string, GravacaoRecord>();
  async listByTenant(tenantId: string) { const data = [...this.items.values()].filter((item) => item.tenantId === tenantId); return { data, total: data.length }; }
  async findById(id: string) { return this.items.get(id) ?? null; }
  async save(input: SaveGravacaoInput) { const item: GravacaoRecord = { id: input.id ?? crypto.randomUUID(), tenantId: input.tenantId, codigo: input.codigo, codigoExterno: input.codigoExterno ?? null, nome: input.nome, descricao: input.descricao ?? null, unidadeNegocioId: input.unidadeNegocioId ?? null, unidadeNegocioNome: 'Unidade A', centroLucro: input.centroLucro ?? null, classificacao: input.classificacao ?? null, tipoConteudo: input.tipoConteudo ?? null, status: input.status ?? null, dataPrevista: input.dataPrevista ?? null, conteudoId: input.conteudoId ?? null, orcamento: input.orcamento ?? 0, programaId: input.programaId ?? null, programaNome: input.programaId ? 'Programa Smoke' : null, createdAt: new Date('2026-03-25T12:00:00.000Z') }; this.items.set(item.id, item); return item; }
  async remove(id: string) { this.items.delete(id); }
  async listFigurinos() { return { figurinos: [], items: [] }; }
  async addFigurino(): Promise<GravacaoFigurinoRecord> { throw new Error('Not implemented in test double'); }
  async updateFigurino() { return null; }
  async findFigurinoAllocationById() { return null; }
  async removeFigurino() {}
  async listTerceiros() { return { items: [], fornecedores: [], servicos: [], moeda: 'BRL' }; }
  async addTerceiro(): Promise<GravacaoTerceiroRecord> { throw new Error('Not implemented in test double'); }
  async findTerceiroById() { return null; }
  async removeTerceiro() {}
  async listConvidados() { return { pessoas: [], items: [] }; }
  async addConvidado(): Promise<GravacaoConvidadoRecord> { throw new Error('Not implemented in test double'); }
  async findConvidadoById() { return null; }
  async removeConvidado() {}
}

describe('api smoke', () => {
  it('executa smoke de login, refresh, health, ready, programas e gravacoes', async () => {
    const authService = new AuthService(new RouteAuthRepository(), () => new Date('2026-03-25T10:00:00.000Z'));
    const programasService = new ProgramasService(new InMemoryProgramasRepository());
    const gravacoesService = new GravacoesService(new InMemoryGravacoesRepository());
    const app = await buildApp({ authService, programasService, gravacoesService, healthService: new UpHealthService() });

    const healthResponse = await app.inject({ method: 'GET', url: '/health' });
    expect(healthResponse.statusCode).toBe(200);

    const readyResponse = await app.inject({ method: 'GET', url: '/ready' });
    expect(readyResponse.statusCode).toBe(200);

    const loginResponse = await app.inject({ method: 'POST', url: '/auth/login', payload: { usuario: 'ana', password: '123456' } });
    expect(loginResponse.statusCode).toBe(200);
    const { accessToken, refreshToken } = loginResponse.json();

    const refreshResponse = await app.inject({ method: 'POST', url: '/auth/refresh', payload: { refreshToken } });
    expect(refreshResponse.statusCode).toBe(200);
    expect(refreshResponse.json()).toEqual(expect.objectContaining({ accessToken: expect.any(String) }));

    const createProgramaResponse = await app.inject({ method: 'POST', url: '/programas', headers: { authorization: `Bearer ${accessToken}` }, payload: { nome: 'Programa Smoke', codigoExterno: 'SMK' } });
    expect(createProgramaResponse.statusCode).toBe(200);

    const listProgramasResponse = await app.inject({ method: 'GET', url: '/programas', headers: { authorization: `Bearer ${accessToken}` } });
    expect(listProgramasResponse.statusCode).toBe(200);
    expect(listProgramasResponse.json().data).toEqual([expect.objectContaining({ nome: 'Programa Smoke' })]);

    const createGravacaoResponse = await app.inject({
      method: 'POST',
      url: '/gravacoes',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { codigo: '202600001', nome: 'Gravacao Smoke', status: 'Planejada', dataPrevista: '2026-04-10', orcamento: 1800 },
    });
    expect(createGravacaoResponse.statusCode).toBe(200);

    const listGravacoesResponse = await app.inject({ method: 'GET', url: '/gravacoes', headers: { authorization: `Bearer ${accessToken}` } });
    expect(listGravacoesResponse.statusCode).toBe(200);
    expect(listGravacoesResponse.json().data).toEqual([expect.objectContaining({ nome: 'Gravacao Smoke', codigo: '202600001' })]);

    await app.close();
  });
});
