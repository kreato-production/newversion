import { describe, expect, it } from 'vitest';
import type { SessionUser } from '../auth/auth.types.js';
import { ConteudosService } from './conteudos.service.js';
import type { ConteudoRecord, ConteudosRepository } from './conteudos.repository.js';

const record = (id: string, unidadeNegocioId: string | null): ConteudoRecord => ({
  id,
  tenantId: 't1',
  codigoExterno: null,
  descricao: `Conteudo ${id}`,
  quantidadeEpisodios: 10,
  centroLucroId: null,
  centroLucroNome: null,
  unidadeNegocioId,
  unidadeNegocioNome: null,
  programaId: null,
  programaNome: null,
  tipoConteudoId: null,
  tipoConteudoNome: null,
  classificacaoId: null,
  classificacaoNome: null,
  anoProducao: null,
  sinopse: null,
  orcamento: 0,
  tabelaPrecoId: null,
  tabelaPrecoNome: null,
  frequenciaDataInicio: null,
  frequenciaDataFim: null,
  frequenciaDiasSemana: null,
  createdBy: null,
  createdAt: null,
});

const RECORDS = [record('c1', 'u1'), record('c2', 'u2'), record('c3', null)];
const repository = {
  findById: async (id: string) => RECORDS.find((item) => item.id === id) ?? null,
} as unknown as ConteudosRepository;

const actor = (unidadeIds: string[]): SessionUser => ({
  id: 'user-1',
  tenantId: 't1',
  tenantNome: 'Tenant',
  role: 'USER',
  email: 'op@kreato.app',
  usuario: 'op',
  nome: 'Operador',
  perfil: '',
  tipoAcesso: 'Operacional',
  unidadeIds,
  enabledModules: [],
  permissions: [],
});

describe('ConteudosService.getById (restricao por unidade, como na lista)', () => {
  const service = new ConteudosService(repository);

  it('retorna qualquer conteudo do tenant quando o usuario nao tem unidades restritas', async () => {
    expect(await service.getById(actor([]), 'c2')).toMatchObject({ id: 'c2' });
    expect(await service.getById(actor([]), 'c3')).toMatchObject({ id: 'c3' });
  });

  it('retorna o conteudo de uma unidade do usuario', async () => {
    expect(await service.getById(actor(['u1']), 'c1')).toMatchObject({
      id: 'c1',
      unidadeNegocioId: 'u1',
    });
  });

  it('nao encontra conteudo de outra unidade nem sem unidade', async () => {
    expect(await service.getById(actor(['u1']), 'c2')).toBeNull();
    expect(await service.getById(actor(['u1']), 'c3')).toBeNull();
  });
});
