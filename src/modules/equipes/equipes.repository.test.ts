import { describe, expect, it } from 'vitest';
import { mapEquipeRow, mapMembroRow, mapRecursoHumanoRow } from './equipes.repository';

describe('equipes.repository mappers', () => {
  it('mapeia equipe com contagem de membros e data formatada', () => {
    const result = mapEquipeRow({
      id: 'eq-1',
      codigo: 'EQ-001',
      descricao: 'Equipe Principal',
      created_at: '2026-03-20T12:00:00.000Z',
      equipe_membros: [{ id: '1' }, { id: '2' }],
    });

    expect(result).toEqual({
      id: 'eq-1',
      codigo: 'EQ-001',
      descricao: 'Equipe Principal',
      membrosCount: 2,
      dataCadastro: '20/03/2026',
    });
  });

  it('mapeia recurso humano ativo com funcao', () => {
    const result = mapRecursoHumanoRow({
      id: 'rh-1',
      nome: 'Ana',
      sobrenome: 'Silva',
      funcoes: { nome: 'Coordenadora' },
    });

    expect(result).toEqual({
      id: 'rh-1',
      nome: 'Ana',
      sobrenome: 'Silva',
      funcao_nome: 'Coordenadora',
    });
  });

  it('mapeia membro com data de associacao formatada', () => {
    const result = mapMembroRow({
      id: 'm-1',
      recurso_humano_id: 'rh-1',
      created_at: '2026-03-21T08:30:00.000Z',
    });

    expect(result).toEqual({
      id: 'm-1',
      recursoHumanoId: 'rh-1',
      dataAssociacao: '21/03/2026',
    });
  });
});
