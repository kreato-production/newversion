import type { UnidadeNegocio } from './unidades.types';

type UnidadeNegocioRow = {
  id: string;
  codigo_externo: string | null;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  moeda: string | null;
  created_at: string | null;
  created_by: string | null;
};

type SaveUnidadePayload = {
  nome: string;
  descricao: string | null;
  codigo_externo: string | null;
  imagem_url: string | null;
  moeda: string;
  created_by: string | null;
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

type LegacyStorageClient = {
  from: (bucket: string) => {
    remove: (paths: string[]) => Promise<unknown>;
    upload: (
      path: string,
      file: File,
      options?: { upsert?: boolean },
    ) => Promise<{ error?: unknown }>;
    getPublicUrl: (path: string) => { data: { publicUrl: string } };
  };
};

type LegacyClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
  storage: LegacyStorageClient;
};

function createDisabledLegacyClient(): LegacyClient {
  const disabled = () => {
    throw new Error(
      'O repositório legado de unidades via Supabase foi desativado. Use a API local.',
    );
  };

  return {
    from: disabled,
    storage: {
      from: () => ({
        remove: async () => disabled(),
        upload: async () => disabled(),
        getPublicUrl: () => disabled(),
      }),
    },
  };
}

export class SupabaseUnidadesRepository implements UnidadesRepository {
  constructor(private readonly client: LegacyClient = createDisabledLegacyClient()) {}

  async list(userName: string): Promise<UnidadeNegocio[]> {
    const { data, error } = await this.client
      .from('unidades_negocio')
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;
    return ((data || []) as UnidadeNegocioRow[]).map((item) => mapDbToUnidade(item, userName));
  }

  async save(data: UnidadeNegocio, userId?: string): Promise<void> {
    const payload: SaveUnidadePayload = {
      nome: data.nome,
      descricao: data.descricao || null,
      codigo_externo: data.codigoExterno || null,
      imagem_url: data.imagem || null,
      moeda: data.moeda || 'BRL',
      created_by: userId || null,
    };

    if (data.id) {
      const { error } = await this.client
        .from('unidades_negocio')
        .upsert({ id: data.id, ...payload }, { onConflict: 'id' });

      if (error) throw error;
      return;
    }

    const { error } = await this.client.from('unidades_negocio').insert(payload);
    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from('unidades_negocio').delete().eq('id', id);

    if (error) throw error;
  }

  async uploadLogo(file: File, unidadeId: string): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const filePath = `${unidadeId}.${fileExt}`;

    await this.client.storage.from('unidades-negocio').remove([filePath]);

    const { error } = await this.client.storage
      .from('unidades-negocio')
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error('Error uploading unidade logo:', error);
      return null;
    }

    const { data } = this.client.storage.from('unidades-negocio').getPublicUrl(filePath);

    return data.publicUrl;
  }
}

export const unidadesRepository = new SupabaseUnidadesRepository();
