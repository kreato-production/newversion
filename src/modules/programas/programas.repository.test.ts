import { describe, expect, it } from 'vitest';
import { normalizeProgramaInput } from './programas.api.repository';
import { mapProgramaRow } from './programas.repository';

describe('programas.repository', () => {
  it('mapeia linha de programa para contrato de frontend', () => {
    const result = mapProgramaRow({
      id: 'prog-1',
      codigo_externo: 'PG-1',
      nome: 'Programa A',
      descricao: 'Descricao',
      unidade_negocio_id: 'un-1',
      created_at: '2026-03-25T12:00:00.000Z',
      unidade_negocio: { nome: 'Unidade A' },
    });

    expect(result).toEqual({
      id: 'prog-1',
      codigoExterno: 'PG-1',
      nome: 'Programa A',
      descricao: 'Descricao',
      unidadeNegocioId: 'un-1',
      unidadeNegocio: 'Unidade A',
      dataCadastro: '25/03/2026',
    });
  });

  it('normaliza payload para api quando unidade de negocio nao foi preenchida', () => {
    expect(normalizeProgramaInput({
      codigoExterno: '  PG-2  ',
      nome: 'Programa B',
      descricao: '   ',
      unidadeNegocioId: '',
      tenantId: 'tenant-1',
    })).toEqual({
      codigoExterno: 'PG-2',
      nome: 'Programa B',
      descricao: '',
      unidadeNegocioId: null,
      tenantId: 'tenant-1',
    });
  });
});
