export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cargos: {
        Row: {
          codigo_externo: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categorias_fornecedor: {
        Row: {
          codigo_externo: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      centros_lucro: {
        Row: {
          codigo_externo: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          parent_id: string | null
          status: Database["public"]["Enums"]["status_ativo"] | null
          updated_at: string | null
        }
        Insert: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          parent_id?: string | null
          status?: Database["public"]["Enums"]["status_ativo"] | null
          updated_at?: string | null
        }
        Update: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          parent_id?: string | null
          status?: Database["public"]["Enums"]["status_ativo"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "centros_lucro_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "centros_lucro"
            referencedColumns: ["id"]
          },
        ]
      }
      classificacoes: {
        Row: {
          codigo_externo: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      classificacoes_pessoa: {
        Row: {
          codigo_externo: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      conteudos: {
        Row: {
          ano_producao: string | null
          centro_lucro_id: string | null
          classificacao_id: string | null
          codigo_externo: string | null
          created_at: string | null
          created_by: string | null
          descricao: string
          id: string
          quantidade_episodios: number | null
          sinopse: string | null
          tipo_conteudo_id: string | null
          unidade_negocio_id: string | null
          updated_at: string | null
        }
        Insert: {
          ano_producao?: string | null
          centro_lucro_id?: string | null
          classificacao_id?: string | null
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao: string
          id?: string
          quantidade_episodios?: number | null
          sinopse?: string | null
          tipo_conteudo_id?: string | null
          unidade_negocio_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ano_producao?: string | null
          centro_lucro_id?: string | null
          classificacao_id?: string | null
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string
          id?: string
          quantidade_episodios?: number | null
          sinopse?: string | null
          tipo_conteudo_id?: string | null
          unidade_negocio_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conteudos_centro_lucro_id_fkey"
            columns: ["centro_lucro_id"]
            isOneToOne: false
            referencedRelation: "centros_lucro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conteudos_classificacao_id_fkey"
            columns: ["classificacao_id"]
            isOneToOne: false
            referencedRelation: "classificacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conteudos_tipo_conteudo_id_fkey"
            columns: ["tipo_conteudo_id"]
            isOneToOne: false
            referencedRelation: "tipos_gravacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conteudos_unidade_negocio_id_fkey"
            columns: ["unidade_negocio_id"]
            isOneToOne: false
            referencedRelation: "unidades_negocio"
            referencedColumns: ["id"]
          },
        ]
      }
      custos: {
        Row: {
          categoria: string | null
          conteudo_id: string | null
          created_at: string | null
          created_by: string | null
          data: string | null
          descricao: string
          gravacao_id: string | null
          id: string
          observacao: string | null
          updated_at: string | null
          valor: number | null
        }
        Insert: {
          categoria?: string | null
          conteudo_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: string | null
          descricao: string
          gravacao_id?: string | null
          id?: string
          observacao?: string | null
          updated_at?: string | null
          valor?: number | null
        }
        Update: {
          categoria?: string | null
          conteudo_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: string | null
          descricao?: string
          gravacao_id?: string | null
          id?: string
          observacao?: string | null
          updated_at?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "custos_conteudo_id_fkey"
            columns: ["conteudo_id"]
            isOneToOne: false
            referencedRelation: "conteudos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custos_gravacao_id_fkey"
            columns: ["gravacao_id"]
            isOneToOne: false
            referencedRelation: "gravacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      departamento_funcoes: {
        Row: {
          created_at: string | null
          departamento_id: string
          funcao_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          departamento_id: string
          funcao_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          departamento_id?: string
          funcao_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departamento_funcoes_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departamento_funcoes_funcao_id_fkey"
            columns: ["funcao_id"]
            isOneToOne: false
            referencedRelation: "funcoes"
            referencedColumns: ["id"]
          },
        ]
      }
      departamentos: {
        Row: {
          codigo_externo: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      figurino_imagens: {
        Row: {
          created_at: string | null
          figurino_id: string
          id: string
          is_principal: boolean | null
          url: string
        }
        Insert: {
          created_at?: string | null
          figurino_id: string
          id?: string
          is_principal?: boolean | null
          url: string
        }
        Update: {
          created_at?: string | null
          figurino_id?: string
          id?: string
          is_principal?: boolean | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "figurino_imagens_figurino_id_fkey"
            columns: ["figurino_id"]
            isOneToOne: false
            referencedRelation: "figurinos"
            referencedColumns: ["id"]
          },
        ]
      }
      figurinos: {
        Row: {
          codigo_externo: string | null
          codigo_figurino: string
          cor_predominante: string | null
          cor_secundaria: string | null
          created_at: string | null
          created_by: string | null
          descricao: string
          id: string
          material_id: string | null
          tamanho_peca: string | null
          tipo_figurino_id: string | null
          updated_at: string | null
        }
        Insert: {
          codigo_externo?: string | null
          codigo_figurino: string
          cor_predominante?: string | null
          cor_secundaria?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao: string
          id?: string
          material_id?: string | null
          tamanho_peca?: string | null
          tipo_figurino_id?: string | null
          updated_at?: string | null
        }
        Update: {
          codigo_externo?: string | null
          codigo_figurino?: string
          cor_predominante?: string | null
          cor_secundaria?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string
          id?: string
          material_id?: string | null
          tamanho_peca?: string | null
          tipo_figurino_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "figurinos_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "figurinos_tipo_figurino_id_fkey"
            columns: ["tipo_figurino_id"]
            isOneToOne: false
            referencedRelation: "tipos_figurino"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedor_servicos: {
        Row: {
          created_at: string | null
          descricao: string | null
          fornecedor_id: string
          id: string
          nome: string
          valor: number | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          fornecedor_id: string
          id?: string
          nome: string
          valor?: number | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          fornecedor_id?: string
          id?: string
          nome?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fornecedor_servicos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          categoria_id: string | null
          codigo_externo: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          email: string | null
          id: string
          identificacao_fiscal: string | null
          nome: string
          pais: string | null
          updated_at: string | null
        }
        Insert: {
          categoria_id?: string | null
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          email?: string | null
          id?: string
          identificacao_fiscal?: string | null
          nome: string
          pais?: string | null
          updated_at?: string | null
        }
        Update: {
          categoria_id?: string | null
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          email?: string | null
          id?: string
          identificacao_fiscal?: string | null
          nome?: string
          pais?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_fornecedor"
            referencedColumns: ["id"]
          },
        ]
      }
      funcoes: {
        Row: {
          codigo_externo: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gravacao_cenas: {
        Row: {
          ambiente: string | null
          capitulo: string | null
          created_at: string | null
          descricao: string | null
          figurantes: string[] | null
          gravacao_id: string
          id: string
          local_gravacao: string | null
          numero_cena: string | null
          ordem: number
          periodo: string | null
          personagens: string[] | null
          ritmo: string | null
          tempo_aproximado: string | null
          tipo_ambiente: string | null
        }
        Insert: {
          ambiente?: string | null
          capitulo?: string | null
          created_at?: string | null
          descricao?: string | null
          figurantes?: string[] | null
          gravacao_id: string
          id?: string
          local_gravacao?: string | null
          numero_cena?: string | null
          ordem?: number
          periodo?: string | null
          personagens?: string[] | null
          ritmo?: string | null
          tempo_aproximado?: string | null
          tipo_ambiente?: string | null
        }
        Update: {
          ambiente?: string | null
          capitulo?: string | null
          created_at?: string | null
          descricao?: string | null
          figurantes?: string[] | null
          gravacao_id?: string
          id?: string
          local_gravacao?: string | null
          numero_cena?: string | null
          ordem?: number
          periodo?: string | null
          personagens?: string[] | null
          ritmo?: string | null
          tempo_aproximado?: string | null
          tipo_ambiente?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gravacao_cenas_gravacao_id_fkey"
            columns: ["gravacao_id"]
            isOneToOne: false
            referencedRelation: "gravacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      gravacao_convidados: {
        Row: {
          created_at: string | null
          gravacao_id: string
          id: string
          observacao: string | null
          pessoa_id: string
        }
        Insert: {
          created_at?: string | null
          gravacao_id: string
          id?: string
          observacao?: string | null
          pessoa_id: string
        }
        Update: {
          created_at?: string | null
          gravacao_id?: string
          id?: string
          observacao?: string | null
          pessoa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gravacao_convidados_gravacao_id_fkey"
            columns: ["gravacao_id"]
            isOneToOne: false
            referencedRelation: "gravacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gravacao_convidados_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      gravacao_elenco: {
        Row: {
          conteudo_id: string | null
          created_at: string | null
          gravacao_id: string | null
          id: string
          personagem: string | null
          pessoa_id: string
        }
        Insert: {
          conteudo_id?: string | null
          created_at?: string | null
          gravacao_id?: string | null
          id?: string
          personagem?: string | null
          pessoa_id: string
        }
        Update: {
          conteudo_id?: string | null
          created_at?: string | null
          gravacao_id?: string | null
          id?: string
          personagem?: string | null
          pessoa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gravacao_elenco_conteudo_id_fkey"
            columns: ["conteudo_id"]
            isOneToOne: false
            referencedRelation: "conteudos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gravacao_elenco_gravacao_id_fkey"
            columns: ["gravacao_id"]
            isOneToOne: false
            referencedRelation: "gravacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gravacao_elenco_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      gravacao_figurinos: {
        Row: {
          created_at: string | null
          figurino_id: string
          gravacao_id: string
          id: string
          observacao: string | null
          pessoa_id: string | null
        }
        Insert: {
          created_at?: string | null
          figurino_id: string
          gravacao_id: string
          id?: string
          observacao?: string | null
          pessoa_id?: string | null
        }
        Update: {
          created_at?: string | null
          figurino_id?: string
          gravacao_id?: string
          id?: string
          observacao?: string | null
          pessoa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gravacao_figurinos_figurino_id_fkey"
            columns: ["figurino_id"]
            isOneToOne: false
            referencedRelation: "figurinos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gravacao_figurinos_gravacao_id_fkey"
            columns: ["gravacao_id"]
            isOneToOne: false
            referencedRelation: "gravacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gravacao_figurinos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      gravacao_recursos: {
        Row: {
          created_at: string | null
          gravacao_id: string
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          recurso_fisico_id: string | null
          recurso_humano_id: string | null
          recurso_tecnico_id: string | null
        }
        Insert: {
          created_at?: string | null
          gravacao_id: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          recurso_fisico_id?: string | null
          recurso_humano_id?: string | null
          recurso_tecnico_id?: string | null
        }
        Update: {
          created_at?: string | null
          gravacao_id?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          recurso_fisico_id?: string | null
          recurso_humano_id?: string | null
          recurso_tecnico_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gravacao_recursos_gravacao_id_fkey"
            columns: ["gravacao_id"]
            isOneToOne: false
            referencedRelation: "gravacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gravacao_recursos_recurso_fisico_id_fkey"
            columns: ["recurso_fisico_id"]
            isOneToOne: false
            referencedRelation: "recursos_fisicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gravacao_recursos_recurso_humano_id_fkey"
            columns: ["recurso_humano_id"]
            isOneToOne: false
            referencedRelation: "recursos_humanos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gravacao_recursos_recurso_tecnico_id_fkey"
            columns: ["recurso_tecnico_id"]
            isOneToOne: false
            referencedRelation: "recursos_tecnicos"
            referencedColumns: ["id"]
          },
        ]
      }
      gravacao_roteiros: {
        Row: {
          conteudo: string | null
          created_at: string | null
          gravacao_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          conteudo?: string | null
          created_at?: string | null
          gravacao_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          conteudo?: string | null
          created_at?: string | null
          gravacao_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gravacao_roteiros_gravacao_id_fkey"
            columns: ["gravacao_id"]
            isOneToOne: false
            referencedRelation: "gravacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      gravacao_terceiros: {
        Row: {
          created_at: string | null
          fornecedor_id: string
          gravacao_id: string
          id: string
          observacao: string | null
          servico_id: string | null
          valor: number | null
        }
        Insert: {
          created_at?: string | null
          fornecedor_id: string
          gravacao_id: string
          id?: string
          observacao?: string | null
          servico_id?: string | null
          valor?: number | null
        }
        Update: {
          created_at?: string | null
          fornecedor_id?: string
          gravacao_id?: string
          id?: string
          observacao?: string | null
          servico_id?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gravacao_terceiros_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gravacao_terceiros_gravacao_id_fkey"
            columns: ["gravacao_id"]
            isOneToOne: false
            referencedRelation: "gravacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gravacao_terceiros_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "fornecedor_servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      gravacoes: {
        Row: {
          centro_lucro_id: string | null
          classificacao_id: string | null
          codigo: string
          codigo_externo: string | null
          conteudo_id: string | null
          created_at: string | null
          created_by: string | null
          data_prevista: string | null
          descricao: string | null
          id: string
          nome: string
          status_id: string | null
          tipo_conteudo_id: string | null
          unidade_negocio_id: string | null
          updated_at: string | null
        }
        Insert: {
          centro_lucro_id?: string | null
          classificacao_id?: string | null
          codigo: string
          codigo_externo?: string | null
          conteudo_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_prevista?: string | null
          descricao?: string | null
          id?: string
          nome: string
          status_id?: string | null
          tipo_conteudo_id?: string | null
          unidade_negocio_id?: string | null
          updated_at?: string | null
        }
        Update: {
          centro_lucro_id?: string | null
          classificacao_id?: string | null
          codigo?: string
          codigo_externo?: string | null
          conteudo_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_prevista?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          status_id?: string | null
          tipo_conteudo_id?: string | null
          unidade_negocio_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gravacoes_centro_lucro_id_fkey"
            columns: ["centro_lucro_id"]
            isOneToOne: false
            referencedRelation: "centros_lucro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gravacoes_classificacao_id_fkey"
            columns: ["classificacao_id"]
            isOneToOne: false
            referencedRelation: "classificacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gravacoes_conteudo_id_fkey"
            columns: ["conteudo_id"]
            isOneToOne: false
            referencedRelation: "conteudos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gravacoes_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "status_gravacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gravacoes_tipo_conteudo_id_fkey"
            columns: ["tipo_conteudo_id"]
            isOneToOne: false
            referencedRelation: "tipos_gravacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gravacoes_unidade_negocio_id_fkey"
            columns: ["unidade_negocio_id"]
            isOneToOne: false
            referencedRelation: "unidades_negocio"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais: {
        Row: {
          codigo_externo: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          status: Database["public"]["Enums"]["status_ativo"] | null
          updated_at: string | null
        }
        Insert: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          status?: Database["public"]["Enums"]["status_ativo"] | null
          updated_at?: string | null
        }
        Update: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["status_ativo"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      perfil_permissoes: {
        Row: {
          acao: Database["public"]["Enums"]["permission_action"] | null
          alterar: boolean | null
          campo: string | null
          created_at: string | null
          excluir: boolean | null
          id: string
          incluir: boolean | null
          modulo: string
          perfil_id: string
          somente_leitura: boolean | null
          sub_modulo1: string | null
          sub_modulo2: string | null
          tipo: Database["public"]["Enums"]["permission_tipo"] | null
        }
        Insert: {
          acao?: Database["public"]["Enums"]["permission_action"] | null
          alterar?: boolean | null
          campo?: string | null
          created_at?: string | null
          excluir?: boolean | null
          id?: string
          incluir?: boolean | null
          modulo: string
          perfil_id: string
          somente_leitura?: boolean | null
          sub_modulo1?: string | null
          sub_modulo2?: string | null
          tipo?: Database["public"]["Enums"]["permission_tipo"] | null
        }
        Update: {
          acao?: Database["public"]["Enums"]["permission_action"] | null
          alterar?: boolean | null
          campo?: string | null
          created_at?: string | null
          excluir?: boolean | null
          id?: string
          incluir?: boolean | null
          modulo?: string
          perfil_id?: string
          somente_leitura?: boolean | null
          sub_modulo1?: string | null
          sub_modulo2?: string | null
          tipo?: Database["public"]["Enums"]["permission_tipo"] | null
        }
        Relationships: [
          {
            foreignKeyName: "perfil_permissoes_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis_acesso"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis_acesso: {
        Row: {
          codigo_externo: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pessoas: {
        Row: {
          cep: string | null
          cidade: string | null
          classificacao_id: string | null
          codigo_externo: string | null
          created_at: string | null
          created_by: string | null
          data_nascimento: string | null
          documento: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          foto_url: string | null
          id: string
          nome: string
          nome_trabalho: string | null
          observacoes: string | null
          sexo: Database["public"]["Enums"]["sexo_tipo"] | null
          sobrenome: string
          status: Database["public"]["Enums"]["status_ativo"] | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          classificacao_id?: string | null
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          data_nascimento?: string | null
          documento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          nome_trabalho?: string | null
          observacoes?: string | null
          sexo?: Database["public"]["Enums"]["sexo_tipo"] | null
          sobrenome: string
          status?: Database["public"]["Enums"]["status_ativo"] | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          classificacao_id?: string | null
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          data_nascimento?: string | null
          documento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          nome_trabalho?: string | null
          observacoes?: string | null
          sexo?: Database["public"]["Enums"]["sexo_tipo"] | null
          sobrenome?: string
          status?: Database["public"]["Enums"]["status_ativo"] | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pessoas_classificacao_id_fkey"
            columns: ["classificacao_id"]
            isOneToOne: false
            referencedRelation: "classificacoes_pessoa"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          codigo_externo: string | null
          created_at: string | null
          descricao: string | null
          email: string
          foto_url: string | null
          id: string
          nome: string
          perfil_id: string | null
          updated_at: string | null
          usuario: string
        }
        Insert: {
          codigo_externo?: string | null
          created_at?: string | null
          descricao?: string | null
          email: string
          foto_url?: string | null
          id: string
          nome: string
          perfil_id?: string | null
          updated_at?: string | null
          usuario: string
        }
        Update: {
          codigo_externo?: string | null
          created_at?: string | null
          descricao?: string | null
          email?: string
          foto_url?: string | null
          id?: string
          nome?: string
          perfil_id?: string | null
          updated_at?: string | null
          usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis_acesso"
            referencedColumns: ["id"]
          },
        ]
      }
      recursos_fisicos: {
        Row: {
          codigo_externo: string | null
          created_at: string | null
          created_by: string | null
          custo_hora: number | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          custo_hora?: number | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          custo_hora?: number | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      recursos_humanos: {
        Row: {
          codigo_externo: string | null
          created_at: string | null
          created_by: string | null
          custo_hora: number | null
          data_contratacao: string | null
          data_nascimento: string | null
          departamento_id: string | null
          email: string | null
          foto_url: string | null
          funcao_id: string | null
          id: string
          nome: string
          sexo: Database["public"]["Enums"]["sexo_tipo"] | null
          sobrenome: string
          status: Database["public"]["Enums"]["status_ativo"] | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          custo_hora?: number | null
          data_contratacao?: string | null
          data_nascimento?: string | null
          departamento_id?: string | null
          email?: string | null
          foto_url?: string | null
          funcao_id?: string | null
          id?: string
          nome: string
          sexo?: Database["public"]["Enums"]["sexo_tipo"] | null
          sobrenome: string
          status?: Database["public"]["Enums"]["status_ativo"] | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          custo_hora?: number | null
          data_contratacao?: string | null
          data_nascimento?: string | null
          departamento_id?: string | null
          email?: string | null
          foto_url?: string | null
          funcao_id?: string | null
          id?: string
          nome?: string
          sexo?: Database["public"]["Enums"]["sexo_tipo"] | null
          sobrenome?: string
          status?: Database["public"]["Enums"]["status_ativo"] | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recursos_humanos_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recursos_humanos_funcao_id_fkey"
            columns: ["funcao_id"]
            isOneToOne: false
            referencedRelation: "funcoes"
            referencedColumns: ["id"]
          },
        ]
      }
      recursos_tecnicos: {
        Row: {
          codigo_externo: string | null
          created_at: string | null
          created_by: string | null
          funcao_operador_id: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          funcao_operador_id?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          funcao_operador_id?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recursos_tecnicos_funcao_operador_id_fkey"
            columns: ["funcao_operador_id"]
            isOneToOne: false
            referencedRelation: "funcoes"
            referencedColumns: ["id"]
          },
        ]
      }
      rf_faixas_disponibilidade: {
        Row: {
          created_at: string | null
          data_fim: string
          data_inicio: string
          dias_semana: number[] | null
          hora_fim: string
          hora_inicio: string
          id: string
          recurso_fisico_id: string
        }
        Insert: {
          created_at?: string | null
          data_fim: string
          data_inicio: string
          dias_semana?: number[] | null
          hora_fim: string
          hora_inicio: string
          id?: string
          recurso_fisico_id: string
        }
        Update: {
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          dias_semana?: number[] | null
          hora_fim?: string
          hora_inicio?: string
          id?: string
          recurso_fisico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rf_faixas_disponibilidade_recurso_fisico_id_fkey"
            columns: ["recurso_fisico_id"]
            isOneToOne: false
            referencedRelation: "recursos_fisicos"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_anexos: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          recurso_humano_id: string
          tamanho: number | null
          tipo: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          recurso_humano_id: string
          tamanho?: number | null
          tipo?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          recurso_humano_id?: string
          tamanho?: number | null
          tipo?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "rh_anexos_recurso_humano_id_fkey"
            columns: ["recurso_humano_id"]
            isOneToOne: false
            referencedRelation: "recursos_humanos"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_ausencias: {
        Row: {
          created_at: string | null
          data_fim: string
          data_inicio: string
          dias: number
          id: string
          motivo: string
          recurso_humano_id: string
        }
        Insert: {
          created_at?: string | null
          data_fim: string
          data_inicio: string
          dias?: number
          id?: string
          motivo: string
          recurso_humano_id: string
        }
        Update: {
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          dias?: number
          id?: string
          motivo?: string
          recurso_humano_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rh_ausencias_recurso_humano_id_fkey"
            columns: ["recurso_humano_id"]
            isOneToOne: false
            referencedRelation: "recursos_humanos"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_escalas: {
        Row: {
          created_at: string | null
          data_fim: string
          data_inicio: string
          dias_semana: number[] | null
          hora_fim: string
          hora_inicio: string
          id: string
          recurso_humano_id: string
        }
        Insert: {
          created_at?: string | null
          data_fim: string
          data_inicio: string
          dias_semana?: number[] | null
          hora_fim: string
          hora_inicio: string
          id?: string
          recurso_humano_id: string
        }
        Update: {
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          dias_semana?: number[] | null
          hora_fim?: string
          hora_inicio?: string
          id?: string
          recurso_humano_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rh_escalas_recurso_humano_id_fkey"
            columns: ["recurso_humano_id"]
            isOneToOne: false
            referencedRelation: "recursos_humanos"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos: {
        Row: {
          codigo_externo: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      status_gravacao: {
        Row: {
          codigo_externo: string | null
          cor: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          codigo_externo?: string | null
          cor?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          codigo_externo?: string | null
          cor?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      status_tarefa: {
        Row: {
          codigo: string
          cor: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          codigo: string
          cor?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          codigo?: string
          cor?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tarefas: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          gravacao_id: string | null
          id: string
          observacoes: string | null
          prioridade: Database["public"]["Enums"]["prioridade_tipo"] | null
          recurso_humano_id: string | null
          recurso_tecnico_id: string | null
          status_id: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          gravacao_id?: string | null
          id?: string
          observacoes?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_tipo"] | null
          recurso_humano_id?: string | null
          recurso_tecnico_id?: string | null
          status_id?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          gravacao_id?: string | null
          id?: string
          observacoes?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_tipo"] | null
          recurso_humano_id?: string | null
          recurso_tecnico_id?: string | null
          status_id?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_gravacao_id_fkey"
            columns: ["gravacao_id"]
            isOneToOne: false
            referencedRelation: "gravacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_recurso_humano_id_fkey"
            columns: ["recurso_humano_id"]
            isOneToOne: false
            referencedRelation: "recursos_humanos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_recurso_tecnico_id_fkey"
            columns: ["recurso_tecnico_id"]
            isOneToOne: false
            referencedRelation: "recursos_tecnicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "status_tarefa"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_figurino: {
        Row: {
          codigo_externo: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          status: Database["public"]["Enums"]["status_ativo"] | null
          updated_at: string | null
        }
        Insert: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          status?: Database["public"]["Enums"]["status_ativo"] | null
          updated_at?: string | null
        }
        Update: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["status_ativo"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tipos_gravacao: {
        Row: {
          codigo_externo: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      unidades_negocio: {
        Row: {
          codigo_externo: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          codigo_externo?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuario_unidades: {
        Row: {
          created_at: string | null
          id: string
          unidade_id: string
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          unidade_id: string
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          unidade_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuario_unidades_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades_negocio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_unidades_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      permission_action: "visible" | "invisible"
      permission_tipo: "modulo" | "submodulo1" | "submodulo2" | "campo"
      prioridade_tipo: "baixa" | "media" | "alta"
      sexo_tipo: "Masculino" | "Feminino" | "Outro"
      status_ativo: "Ativo" | "Inativo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      permission_action: ["visible", "invisible"],
      permission_tipo: ["modulo", "submodulo1", "submodulo2", "campo"],
      prioridade_tipo: ["baixa", "media", "alta"],
      sexo_tipo: ["Masculino", "Feminino", "Outro"],
      status_ativo: ["Ativo", "Inativo"],
    },
  },
} as const
