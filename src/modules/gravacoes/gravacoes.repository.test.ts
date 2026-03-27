import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiGravacoesRepository } from './gravacoes.api.repository';

const originalFetch = global.fetch;

describe('ApiGravacoesRepository', () => {
  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    } as Response);
  });

  it('lista gravacoes pela API propria', async () => {
    const repository = new ApiGravacoesRepository();
    await repository.list();

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3333/gravacoes', expect.objectContaining({ headers: expect.any(Headers) }));
  });

  it('salva gravacao com POST quando nao ha id', async () => {
    const repository = new ApiGravacoesRepository();
    await repository.save({
      codigo: '202600001',
      codigoExterno: '',
      nome: 'Gravacao 1',
      centroLucro: '',
      classificacao: '',
      tipoConteudo: '',
      descricao: '',
      status: '',
      dataPrevista: '',
    });

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3333/gravacoes', expect.objectContaining({ method: 'POST' }));
  });
});

afterAll(() => {
  global.fetch = originalFetch;
});

