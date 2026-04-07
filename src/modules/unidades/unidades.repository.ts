import type { UnidadeNegocio } from './unidades.types';

type UnidadeNegocioRow = {
  id: string;
  codigo_externo: string | null;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  moeda: string | null;
  created_at: string | null;
};

function formatDate(date: string | null): string {
  return date ? new Date(date).toLocaleDateString('pt-BR') : '';
}

export function mapDbToUnidade(db: UnidadeNegocioRow, userName: string): UnidadeNegocio {
  return {
    id: db.id,
    codigoExterno: db.codigo_externo || '',
    nome: db.nome,
    descricao: db.descricao || '',
    imagem: db.imagem_url || '',
    moeda: db.moeda || 'BRL',
    dataCadastro: formatDate(db.created_at),
    usuarioCadastro: userName,
  };
}

export interface UnidadesRepository {
  list(userName: string): Promise<UnidadeNegocio[]>;
  save(data: UnidadeNegocio, userId?: string): Promise<void>;
  remove(id: string): Promise<void>;
  uploadLogo(file: File, unidadeId: string): Promise<string | null>;
}
