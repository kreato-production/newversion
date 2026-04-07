import type { Gravacao, GravacaoInput } from './gravacoes.types';

export interface GravacoesRepository {
  list(unidadeIds?: string[]): Promise<Gravacao[]>;
  save(input: GravacaoInput, userId?: string): Promise<void>;
  remove(id: string): Promise<void>;
}
