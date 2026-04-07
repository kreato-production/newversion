import { describe, expect, it } from 'vitest';
import { ApiUnidadesRepository } from './unidades.api.repository';
import { mapDbToUnidade } from './unidades.repository';

describe('unidades.repository', () => {
  it('mapeia registro do banco para entidade de unidade de negocio', () => {
    const result = mapDbToUnidade(
      {
        id: 'un-1',
        codigo_externo: 'UN-EXT',
        nome: 'Unidade Lisboa',
        descricao: 'Operacao Europa',
        imagem_url: 'https://cdn/logo.png',
        moeda: 'EUR',
        created_at: '2026-03-22T10:00:00.000Z',
      },
      'Erico',
    );

    expect(result).toEqual({
      id: 'un-1',
      codigoExterno: 'UN-EXT',
      nome: 'Unidade Lisboa',
      descricao: 'Operacao Europa',
      imagem: 'https://cdn/logo.png',
      moeda: 'EUR',
      dataCadastro: '22/03/2026',
      usuarioCadastro: 'Erico',
    });
  });

  it('mantem uploadLogo neutro enquanto o backend nao expor upload proprio', async () => {
    const repository = new ApiUnidadesRepository();
    const file = new File(['binary'], 'logo.png', { type: 'image/png' });

    await expect(repository.uploadLogo(file, 'un-1')).resolves.toBeNull();
  });
});
