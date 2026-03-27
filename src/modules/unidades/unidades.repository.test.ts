import { describe, expect, it, vi } from 'vitest';
import { mapDbToUnidade, SupabaseUnidadesRepository } from './unidades.repository';

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
        created_by: 'user-1',
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

  it('faz upload da logo e devolve a url publica', async () => {
    const remove = vi.fn().mockResolvedValue({ data: null, error: null });
    const upload = vi.fn().mockResolvedValue({ data: null, error: null });
    const getPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: 'https://cdn/unidades-negocio/un-1.png' },
    });
    const from = vi.fn().mockReturnValue({
      remove,
      upload,
      getPublicUrl,
    });

    const repository = new SupabaseUnidadesRepository({
      storage: { from },
    } as never);

    const file = new File(['binary'], 'logo.png', { type: 'image/png' });
    const result = await repository.uploadLogo(file, 'un-1');

    expect(from).toHaveBeenCalledWith('unidades-negocio');
    expect(remove).toHaveBeenCalledWith(['un-1.png']);
    expect(upload).toHaveBeenCalledWith('un-1.png', file, { upsert: true });
    expect(result).toBe('https://cdn/unidades-negocio/un-1.png');
  });
});
