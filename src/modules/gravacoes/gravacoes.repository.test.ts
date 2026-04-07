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

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/proxy/gravacoes?limit=200&offset=0',
      expect.objectContaining({ credentials: 'same-origin' }),
    );
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

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/proxy/gravacoes',
      expect.objectContaining({ method: 'POST', credentials: 'same-origin' }),
    );
  });
});

afterAll(() => {
  global.fetch = originalFetch;
});
