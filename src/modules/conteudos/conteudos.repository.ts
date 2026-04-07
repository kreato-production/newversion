import type { Conteudo, ConteudoFormOptions, ConteudoInput } from './conteudos.types';

export interface ConteudosRepository {
  list(): Promise<Conteudo[]>;
  save(input: ConteudoInput, userId?: string): Promise<void>;
  remove(id: string): Promise<void>;
  listOptions(unidadeIds?: string[]): Promise<ConteudoFormOptions>;
}
