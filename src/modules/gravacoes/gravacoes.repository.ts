import type { Gravacao, GravacaoInput } from './gravacoes.types';

export interface GravacoesRepository {
  list(unidadeIds?: string[]): Promise<Gravacao[]>;
  getById(id: string): Promise<Gravacao | null>;
  save(input: GravacaoInput, userId?: string): Promise<Gravacao>;
  remove(id: string): Promise<void>;
}
