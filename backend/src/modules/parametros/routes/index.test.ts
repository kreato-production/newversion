import { describe, expect, it } from 'vitest';
import { buildApp } from '../../../app.js';
import {
  OTHER_TENANT_ID,
  TEST_TENANT_ID,
  createRouteAuthService,
  loginHeaders,
} from '../../../test/route-auth.js';
import { ParametrosService } from '../parametros.service.js';
import type {
  ParametroRecord,
  ParametrosRepository,
  SaveParametroInput,
} from '../parametros.repository.js';

class InMemoryParametrosRepository implements ParametrosRepository {
  items = new Map<string, ParametroRecord & { storageKey: string }>();

  async listByTenant(storageKey: string, tenantId: string) {
    const data = [...this.items.values()].filter(
      (item) => item.storageKey === storageKey && item.tenantId === tenantId,
    );
    return { data, total: data.length };
  }

  async findById(storageKey: string, id: string) {
    const item = this.items.get(id);
    return item && item.storageKey === storageKey ? item : null;
  }

  async save(storageKey: string, input: SaveParametroInput) {
    const item = {
      storageKey,
      id: input.id ?? crypto.randomUUID(),
      tenantId: input.tenantId,
      codigoExterno: input.codigoExterno ?? null,
      nome: input.nome,
      descricao: input.descricao ?? null,
      cor: input.cor ?? null,
      traducoes: input.traducoes ?? null,
      createdAt: new Date('2026-11-10T12:00:00.000Z'),
      createdBy: input.createdBy ?? null,
    };
    this.items.set(item.id, item);
    return item;
  }

  async remove(_storageKey: string, id: string) {
    this.items.delete(id);
  }
}

async function setup() {
  const repository = new InMemoryParametrosRepository();
  const app = await buildApp({
    authService: createRouteAuthService(),
    parametrosService: new ParametrosService(repository),
  });
  return { app, repository, headers: await loginHeaders(app) };
}

describe('parametros routes - GET /parametros/:storageKey/:id', () => {
  it('retorna o parametro pelo id', async () => {
    const { app, repository, headers } = await setup();
    const cargo = await repository.save('kreato_cargos', {
      tenantId: TEST_TENANT_ID,
      codigoExterno: 'C1',
      nome: 'Produtor',
      descricao: 'Produtor executivo',
      traducoes: { en: 'Producer' },
    });

    const response = await app.inject({
      method: 'GET',
      url: `/parametros/kreato_cargos/${cargo.id}`,
      headers,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        id: cargo.id,
        codigo_externo: 'C1',
        nome: 'Produtor',
        descricao: 'Produtor executivo',
        traducoes: { en: 'Producer' },
      }),
    );
    await app.close();
  });

  it('retorna 404 quando o registro nao existe ou e de outro parametro', async () => {
    const { app, repository, headers } = await setup();
    const funcao = await repository.save('kreato_funcoes', { tenantId: TEST_TENANT_ID, nome: 'Editor' });

    const missing = await app.inject({
      method: 'GET',
      url: '/parametros/kreato_cargos/33333333-3333-3333-3333-333333333333',
      headers,
    });
    const wrongKey = await app.inject({
      method: 'GET',
      url: `/parametros/kreato_cargos/${funcao.id}`,
      headers,
    });

    expect(missing.statusCode).toBe(404);
    expect(wrongKey.statusCode).toBe(404);
    await app.close();
  });

  it('bloqueia parametro de outro tenant', async () => {
    const { app, repository, headers } = await setup();
    const outro = await repository.save('kreato_cargos', { tenantId: OTHER_TENANT_ID, nome: 'Outro' });

    const response = await app.inject({
      method: 'GET',
      url: `/parametros/kreato_cargos/${outro.id}`,
      headers,
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });
});
