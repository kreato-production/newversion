
-- =============================================
-- KREATO - ESTRUTURA COMPLETA DO BANCO DE DADOS
-- =============================================

-- ============================================
-- 1. ENUMS E TIPOS
-- ============================================

CREATE TYPE public.status_ativo AS ENUM ('Ativo', 'Inativo');
CREATE TYPE public.sexo_tipo AS ENUM ('Masculino', 'Feminino', 'Outro');
CREATE TYPE public.prioridade_tipo AS ENUM ('baixa', 'media', 'alta');
CREATE TYPE public.permission_action AS ENUM ('visible', 'invisible');
CREATE TYPE public.permission_tipo AS ENUM ('modulo', 'submodulo1', 'submodulo2', 'campo');

-- ============================================
-- 2. TABELAS DE ADMINISTRAÇÃO
-- ============================================

-- Unidades de Negócio
CREATE TABLE public.unidades_negocio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo VARCHAR(10),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(nome)
);

-- Centros de Lucro (hierárquico)
CREATE TABLE public.centros_lucro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo VARCHAR(10),
  nome VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES public.centros_lucro(id) ON DELETE SET NULL,
  status public.status_ativo DEFAULT 'Ativo',
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Perfis de Acesso
CREATE TABLE public.perfis_acesso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo VARCHAR(10),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Permissões dos Perfis
CREATE TABLE public.perfil_permissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES public.perfis_acesso(id) ON DELETE CASCADE,
  modulo VARCHAR(100) NOT NULL,
  sub_modulo1 VARCHAR(100) DEFAULT '-',
  sub_modulo2 VARCHAR(100) DEFAULT '-',
  campo VARCHAR(100) DEFAULT '-',
  acao public.permission_action DEFAULT 'visible',
  somente_leitura BOOLEAN DEFAULT FALSE,
  incluir BOOLEAN DEFAULT TRUE,
  alterar BOOLEAN DEFAULT TRUE,
  excluir BOOLEAN DEFAULT TRUE,
  tipo public.permission_tipo DEFAULT 'campo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(perfil_id, modulo, sub_modulo1, sub_modulo2, campo)
);

-- Profiles (dados adicionais dos usuários)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo_externo VARCHAR(10),
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  usuario VARCHAR(100) NOT NULL UNIQUE,
  foto_url TEXT,
  perfil_id UUID REFERENCES public.perfis_acesso(id),
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usuários x Unidades de Negócio (N:N)
CREATE TABLE public.usuario_unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES public.unidades_negocio(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(usuario_id, unidade_id)
);

-- ============================================
-- 3. TABELAS DE PARAMETRIZAÇÕES
-- ============================================

-- Tipos de Gravação/Conteúdo
CREATE TABLE public.tipos_gravacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo VARCHAR(10),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Classificações de Conteúdo
CREATE TABLE public.classificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo VARCHAR(10),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Status de Gravação
CREATE TABLE public.status_gravacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo VARCHAR(10),
  nome VARCHAR(100) NOT NULL UNIQUE,
  cor VARCHAR(7) DEFAULT '#888888',
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Status de Tarefa
CREATE TABLE public.status_tarefa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(10) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  cor VARCHAR(7) DEFAULT '#888888',
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Departamentos
CREATE TABLE public.departamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo VARCHAR(10),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Funções/Cargos
CREATE TABLE public.funcoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo VARCHAR(10),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Departamento x Funções (N:N)
CREATE TABLE public.departamento_funcoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento_id UUID NOT NULL REFERENCES public.departamentos(id) ON DELETE CASCADE,
  funcao_id UUID NOT NULL REFERENCES public.funcoes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(departamento_id, funcao_id)
);

-- Categoria de Fornecedores
CREATE TABLE public.categorias_fornecedor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo VARCHAR(10),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Classificação de Pessoas
CREATE TABLE public.classificacoes_pessoa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo VARCHAR(10),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tipos de Figurino
CREATE TABLE public.tipos_figurino (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo VARCHAR(10),
  nome VARCHAR(100) NOT NULL UNIQUE,
  status public.status_ativo DEFAULT 'Ativo',
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Materiais
CREATE TABLE public.materiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo VARCHAR(10),
  nome VARCHAR(100) NOT NULL UNIQUE,
  status public.status_ativo DEFAULT 'Ativo',
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Cargos (para recursos humanos)
CREATE TABLE public.cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo VARCHAR(10),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 4. TABELAS DE RECURSOS
-- ============================================

-- Recursos Humanos (Colaboradores)
CREATE TABLE public.recursos_humanos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo VARCHAR(10),
  nome VARCHAR(100) NOT NULL,
  sobrenome VARCHAR(100) NOT NULL,
  foto_url TEXT,
  data_nascimento DATE,
  sexo public.sexo_tipo,
  telefone VARCHAR(20),
  email VARCHAR(255),
  departamento_id UUID REFERENCES public.departamentos(id),
  funcao_id UUID REFERENCES public.funcoes(id),
  custo_hora DECIMAL(10,2) DEFAULT 0,
  data_contratacao DATE,
  status public.status_ativo DEFAULT 'Ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Escalas de Recursos Humanos
CREATE TABLE public.rh_escalas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurso_humano_id UUID NOT NULL REFERENCES public.recursos_humanos(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  data_fim DATE NOT NULL,
  hora_fim TIME NOT NULL,
  dias_semana INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 0=Dom, 1=Seg, ..., 6=Sab
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ausências de Recursos Humanos
CREATE TABLE public.rh_ausencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurso_humano_id UUID NOT NULL REFERENCES public.recursos_humanos(id) ON DELETE CASCADE,
  motivo VARCHAR(50) NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dias INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Anexos de Recursos Humanos
CREATE TABLE public.rh_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurso_humano_id UUID NOT NULL REFERENCES public.recursos_humanos(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(100),
  tamanho INTEGER,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recursos Técnicos (Equipamentos)
CREATE TABLE public.recursos_tecnicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo VARCHAR(10),
  nome VARCHAR(100) NOT NULL,
  funcao_operador_id UUID REFERENCES public.funcoes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Recursos Físicos (Espaços/Estúdios)
CREATE TABLE public.recursos_fisicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo VARCHAR(10),
  nome VARCHAR(100) NOT NULL,
  custo_hora DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Faixas de Disponibilidade de Recursos Físicos
CREATE TABLE public.rf_faixas_disponibilidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurso_fisico_id UUID NOT NULL REFERENCES public.recursos_fisicos(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  dias_semana INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pessoas (Elenco/Convidados)
CREATE TABLE public.pessoas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo VARCHAR(10),
  nome VARCHAR(100) NOT NULL,
  sobrenome VARCHAR(100) NOT NULL,
  nome_trabalho VARCHAR(100),
  foto_url TEXT,
  data_nascimento DATE,
  sexo public.sexo_tipo,
  telefone VARCHAR(20),
  email VARCHAR(255),
  classificacao_id UUID REFERENCES public.classificacoes_pessoa(id),
  documento VARCHAR(50),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  observacoes TEXT,
  status public.status_ativo DEFAULT 'Ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Fornecedores
CREATE TABLE public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo VARCHAR(10),
  nome VARCHAR(100) NOT NULL,
  categoria_id UUID REFERENCES public.categorias_fornecedor(id),
  email VARCHAR(255),
  pais VARCHAR(50),
  identificacao_fiscal VARCHAR(100),
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Serviços de Fornecedores
CREATE TABLE public.fornecedor_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  valor DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Figurinos
CREATE TABLE public.figurinos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo VARCHAR(10),
  codigo_figurino VARCHAR(20) NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  tipo_figurino_id UUID REFERENCES public.tipos_figurino(id),
  material_id UUID REFERENCES public.materiais(id),
  tamanho_peca VARCHAR(20),
  cor_predominante VARCHAR(7) DEFAULT '#000000',
  cor_secundaria VARCHAR(7) DEFAULT '#ffffff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Imagens de Figurinos
CREATE TABLE public.figurino_imagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  figurino_id UUID NOT NULL REFERENCES public.figurinos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_principal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. TABELAS DE PRODUÇÃO
-- ============================================

-- Conteúdos (Séries/Programas)
CREATE TABLE public.conteudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_externo VARCHAR(10),
  descricao VARCHAR(100) NOT NULL,
  quantidade_episodios INTEGER DEFAULT 0,
  centro_lucro_id UUID REFERENCES public.centros_lucro(id),
  unidade_negocio_id UUID REFERENCES public.unidades_negocio(id),
  tipo_conteudo_id UUID REFERENCES public.tipos_gravacao(id),
  classificacao_id UUID REFERENCES public.classificacoes(id),
  ano_producao VARCHAR(4),
  sinopse TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Gravações (Episódios/Cenas)
CREATE TABLE public.gravacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  codigo_externo VARCHAR(10),
  nome VARCHAR(100) NOT NULL,
  conteudo_id UUID REFERENCES public.conteudos(id) ON DELETE SET NULL,
  unidade_negocio_id UUID REFERENCES public.unidades_negocio(id),
  centro_lucro_id UUID REFERENCES public.centros_lucro(id),
  classificacao_id UUID REFERENCES public.classificacoes(id),
  tipo_conteudo_id UUID REFERENCES public.tipos_gravacao(id),
  status_id UUID REFERENCES public.status_gravacao(id),
  descricao TEXT,
  data_prevista DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Roteiros de Gravação
CREATE TABLE public.gravacao_roteiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gravacao_id UUID NOT NULL REFERENCES public.gravacoes(id) ON DELETE CASCADE,
  conteudo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recursos associados à Gravação
CREATE TABLE public.gravacao_recursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gravacao_id UUID NOT NULL REFERENCES public.gravacoes(id) ON DELETE CASCADE,
  recurso_humano_id UUID REFERENCES public.recursos_humanos(id) ON DELETE CASCADE,
  recurso_tecnico_id UUID REFERENCES public.recursos_tecnicos(id) ON DELETE CASCADE,
  recurso_fisico_id UUID REFERENCES public.recursos_fisicos(id) ON DELETE CASCADE,
  hora_inicio TIME,
  hora_fim TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (
    (recurso_humano_id IS NOT NULL AND recurso_tecnico_id IS NULL AND recurso_fisico_id IS NULL) OR
    (recurso_humano_id IS NULL AND recurso_tecnico_id IS NOT NULL AND recurso_fisico_id IS NULL) OR
    (recurso_humano_id IS NULL AND recurso_tecnico_id IS NULL AND recurso_fisico_id IS NOT NULL)
  )
);

-- Elenco de Gravação/Conteúdo
CREATE TABLE public.gravacao_elenco (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gravacao_id UUID REFERENCES public.gravacoes(id) ON DELETE CASCADE,
  conteudo_id UUID REFERENCES public.conteudos(id) ON DELETE CASCADE,
  pessoa_id UUID NOT NULL REFERENCES public.pessoas(id) ON DELETE CASCADE,
  personagem VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (gravacao_id IS NOT NULL OR conteudo_id IS NOT NULL)
);

-- Convidados de Gravação
CREATE TABLE public.gravacao_convidados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gravacao_id UUID NOT NULL REFERENCES public.gravacoes(id) ON DELETE CASCADE,
  pessoa_id UUID NOT NULL REFERENCES public.pessoas(id) ON DELETE CASCADE,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Figurinos de Gravação
CREATE TABLE public.gravacao_figurinos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gravacao_id UUID NOT NULL REFERENCES public.gravacoes(id) ON DELETE CASCADE,
  figurino_id UUID NOT NULL REFERENCES public.figurinos(id) ON DELETE CASCADE,
  pessoa_id UUID REFERENCES public.pessoas(id) ON DELETE SET NULL,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Terceiros de Gravação (Fornecedores contratados)
CREATE TABLE public.gravacao_terceiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gravacao_id UUID NOT NULL REFERENCES public.gravacoes(id) ON DELETE CASCADE,
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  servico_id UUID REFERENCES public.fornecedor_servicos(id) ON DELETE SET NULL,
  valor DECIMAL(10,2) DEFAULT 0,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custos de Gravação/Conteúdo
CREATE TABLE public.custos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gravacao_id UUID REFERENCES public.gravacoes(id) ON DELETE CASCADE,
  conteudo_id UUID REFERENCES public.conteudos(id) ON DELETE CASCADE,
  descricao VARCHAR(255) NOT NULL,
  valor DECIMAL(10,2) DEFAULT 0,
  data DATE,
  categoria VARCHAR(50),
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CHECK (gravacao_id IS NOT NULL OR conteudo_id IS NOT NULL)
);

-- Tarefas
CREATE TABLE public.tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gravacao_id UUID REFERENCES public.gravacoes(id) ON DELETE SET NULL,
  recurso_humano_id UUID REFERENCES public.recursos_humanos(id) ON DELETE SET NULL,
  recurso_tecnico_id UUID REFERENCES public.recursos_tecnicos(id) ON DELETE SET NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  status_id UUID REFERENCES public.status_tarefa(id),
  prioridade public.prioridade_tipo DEFAULT 'media',
  data_inicio DATE,
  data_fim DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 6. TRIGGERS PARA ATUALIZAÇÃO DE TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER update_unidades_negocio_updated_at BEFORE UPDATE ON public.unidades_negocio FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_centros_lucro_updated_at BEFORE UPDATE ON public.centros_lucro FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_perfis_acesso_updated_at BEFORE UPDATE ON public.perfis_acesso FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tipos_gravacao_updated_at BEFORE UPDATE ON public.tipos_gravacao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_classificacoes_updated_at BEFORE UPDATE ON public.classificacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_status_gravacao_updated_at BEFORE UPDATE ON public.status_gravacao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_status_tarefa_updated_at BEFORE UPDATE ON public.status_tarefa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_departamentos_updated_at BEFORE UPDATE ON public.departamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_funcoes_updated_at BEFORE UPDATE ON public.funcoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categorias_fornecedor_updated_at BEFORE UPDATE ON public.categorias_fornecedor FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_classificacoes_pessoa_updated_at BEFORE UPDATE ON public.classificacoes_pessoa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tipos_figurino_updated_at BEFORE UPDATE ON public.tipos_figurino FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_materiais_updated_at BEFORE UPDATE ON public.materiais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cargos_updated_at BEFORE UPDATE ON public.cargos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recursos_humanos_updated_at BEFORE UPDATE ON public.recursos_humanos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recursos_tecnicos_updated_at BEFORE UPDATE ON public.recursos_tecnicos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recursos_fisicos_updated_at BEFORE UPDATE ON public.recursos_fisicos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pessoas_updated_at BEFORE UPDATE ON public.pessoas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_figurinos_updated_at BEFORE UPDATE ON public.figurinos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conteudos_updated_at BEFORE UPDATE ON public.conteudos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_gravacoes_updated_at BEFORE UPDATE ON public.gravacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_gravacao_roteiros_updated_at BEFORE UPDATE ON public.gravacao_roteiros FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_custos_updated_at BEFORE UPDATE ON public.custos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tarefas_updated_at BEFORE UPDATE ON public.tarefas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 7. FUNÇÕES AUXILIARES
-- ============================================

-- Função para gerar código de gravação
CREATE OR REPLACE FUNCTION public.generate_gravacao_codigo()
RETURNS TRIGGER AS $$
DECLARE
  new_seq INTEGER;
  year_part VARCHAR(4);
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 5) AS INTEGER)), 0) + 1
  INTO new_seq
  FROM public.gravacoes
  WHERE codigo LIKE year_part || '%';
  
  NEW.codigo := year_part || LPAD(new_seq::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER generate_gravacao_codigo_trigger
BEFORE INSERT ON public.gravacoes
FOR EACH ROW
WHEN (NEW.codigo IS NULL OR NEW.codigo = '')
EXECUTE FUNCTION public.generate_gravacao_codigo();

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.unidades_negocio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centros_lucro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfil_permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_gravacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_gravacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_tarefa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departamento_funcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_fornecedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classificacoes_pessoa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_figurino ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recursos_humanos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_escalas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_ausencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recursos_tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recursos_fisicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rf_faixas_disponibilidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedor_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.figurinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.figurino_imagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conteudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gravacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gravacao_roteiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gravacao_recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gravacao_elenco ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gravacao_convidados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gravacao_figurinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gravacao_terceiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados (acesso completo ao sistema)
-- Para simplificar, todos os usuários autenticados podem ver/editar os dados
-- A lógica de permissões finas é feita a nível de aplicação via perfil_permissoes

CREATE POLICY "Authenticated users can view unidades_negocio" ON public.unidades_negocio FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert unidades_negocio" ON public.unidades_negocio FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update unidades_negocio" ON public.unidades_negocio FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete unidades_negocio" ON public.unidades_negocio FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view centros_lucro" ON public.centros_lucro FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert centros_lucro" ON public.centros_lucro FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update centros_lucro" ON public.centros_lucro FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete centros_lucro" ON public.centros_lucro FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view perfis_acesso" ON public.perfis_acesso FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert perfis_acesso" ON public.perfis_acesso FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update perfis_acesso" ON public.perfis_acesso FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete perfis_acesso" ON public.perfis_acesso FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view perfil_permissoes" ON public.perfil_permissoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert perfil_permissoes" ON public.perfil_permissoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update perfil_permissoes" ON public.perfil_permissoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete perfil_permissoes" ON public.perfil_permissoes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view usuario_unidades" ON public.usuario_unidades FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert usuario_unidades" ON public.usuario_unidades FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update usuario_unidades" ON public.usuario_unidades FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete usuario_unidades" ON public.usuario_unidades FOR DELETE TO authenticated USING (true);

-- Políticas para tabelas de parametrização (acesso completo para autenticados)
CREATE POLICY "auth_tipos_gravacao_select" ON public.tipos_gravacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_tipos_gravacao_insert" ON public.tipos_gravacao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_tipos_gravacao_update" ON public.tipos_gravacao FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_tipos_gravacao_delete" ON public.tipos_gravacao FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_classificacoes_select" ON public.classificacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_classificacoes_insert" ON public.classificacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_classificacoes_update" ON public.classificacoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_classificacoes_delete" ON public.classificacoes FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_status_gravacao_select" ON public.status_gravacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_status_gravacao_insert" ON public.status_gravacao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_status_gravacao_update" ON public.status_gravacao FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_status_gravacao_delete" ON public.status_gravacao FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_status_tarefa_select" ON public.status_tarefa FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_status_tarefa_insert" ON public.status_tarefa FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_status_tarefa_update" ON public.status_tarefa FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_status_tarefa_delete" ON public.status_tarefa FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_departamentos_select" ON public.departamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_departamentos_insert" ON public.departamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_departamentos_update" ON public.departamentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_departamentos_delete" ON public.departamentos FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_funcoes_select" ON public.funcoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_funcoes_insert" ON public.funcoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_funcoes_update" ON public.funcoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_funcoes_delete" ON public.funcoes FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_departamento_funcoes_select" ON public.departamento_funcoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_departamento_funcoes_insert" ON public.departamento_funcoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_departamento_funcoes_delete" ON public.departamento_funcoes FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_categorias_fornecedor_select" ON public.categorias_fornecedor FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_categorias_fornecedor_insert" ON public.categorias_fornecedor FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_categorias_fornecedor_update" ON public.categorias_fornecedor FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_categorias_fornecedor_delete" ON public.categorias_fornecedor FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_classificacoes_pessoa_select" ON public.classificacoes_pessoa FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_classificacoes_pessoa_insert" ON public.classificacoes_pessoa FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_classificacoes_pessoa_update" ON public.classificacoes_pessoa FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_classificacoes_pessoa_delete" ON public.classificacoes_pessoa FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_tipos_figurino_select" ON public.tipos_figurino FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_tipos_figurino_insert" ON public.tipos_figurino FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_tipos_figurino_update" ON public.tipos_figurino FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_tipos_figurino_delete" ON public.tipos_figurino FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_materiais_select" ON public.materiais FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_materiais_insert" ON public.materiais FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_materiais_update" ON public.materiais FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_materiais_delete" ON public.materiais FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_cargos_select" ON public.cargos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_cargos_insert" ON public.cargos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_cargos_update" ON public.cargos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_cargos_delete" ON public.cargos FOR DELETE TO authenticated USING (true);

-- Políticas para tabelas de recursos
CREATE POLICY "auth_recursos_humanos_select" ON public.recursos_humanos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_recursos_humanos_insert" ON public.recursos_humanos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_recursos_humanos_update" ON public.recursos_humanos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_recursos_humanos_delete" ON public.recursos_humanos FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_rh_escalas_select" ON public.rh_escalas FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_rh_escalas_insert" ON public.rh_escalas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_rh_escalas_update" ON public.rh_escalas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_rh_escalas_delete" ON public.rh_escalas FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_rh_ausencias_select" ON public.rh_ausencias FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_rh_ausencias_insert" ON public.rh_ausencias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_rh_ausencias_update" ON public.rh_ausencias FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_rh_ausencias_delete" ON public.rh_ausencias FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_rh_anexos_select" ON public.rh_anexos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_rh_anexos_insert" ON public.rh_anexos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_rh_anexos_delete" ON public.rh_anexos FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_recursos_tecnicos_select" ON public.recursos_tecnicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_recursos_tecnicos_insert" ON public.recursos_tecnicos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_recursos_tecnicos_update" ON public.recursos_tecnicos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_recursos_tecnicos_delete" ON public.recursos_tecnicos FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_recursos_fisicos_select" ON public.recursos_fisicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_recursos_fisicos_insert" ON public.recursos_fisicos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_recursos_fisicos_update" ON public.recursos_fisicos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_recursos_fisicos_delete" ON public.recursos_fisicos FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_rf_faixas_select" ON public.rf_faixas_disponibilidade FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_rf_faixas_insert" ON public.rf_faixas_disponibilidade FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_rf_faixas_update" ON public.rf_faixas_disponibilidade FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_rf_faixas_delete" ON public.rf_faixas_disponibilidade FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_pessoas_select" ON public.pessoas FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_pessoas_insert" ON public.pessoas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_pessoas_update" ON public.pessoas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_pessoas_delete" ON public.pessoas FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_fornecedores_select" ON public.fornecedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_fornecedores_insert" ON public.fornecedores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_fornecedores_update" ON public.fornecedores FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_fornecedores_delete" ON public.fornecedores FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_fornecedor_servicos_select" ON public.fornecedor_servicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_fornecedor_servicos_insert" ON public.fornecedor_servicos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_fornecedor_servicos_update" ON public.fornecedor_servicos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_fornecedor_servicos_delete" ON public.fornecedor_servicos FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_figurinos_select" ON public.figurinos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_figurinos_insert" ON public.figurinos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_figurinos_update" ON public.figurinos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_figurinos_delete" ON public.figurinos FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_figurino_imagens_select" ON public.figurino_imagens FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_figurino_imagens_insert" ON public.figurino_imagens FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_figurino_imagens_delete" ON public.figurino_imagens FOR DELETE TO authenticated USING (true);

-- Políticas para tabelas de produção
CREATE POLICY "auth_conteudos_select" ON public.conteudos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_conteudos_insert" ON public.conteudos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_conteudos_update" ON public.conteudos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_conteudos_delete" ON public.conteudos FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_gravacoes_select" ON public.gravacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_gravacoes_insert" ON public.gravacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_gravacoes_update" ON public.gravacoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_gravacoes_delete" ON public.gravacoes FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_gravacao_roteiros_select" ON public.gravacao_roteiros FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_gravacao_roteiros_insert" ON public.gravacao_roteiros FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_gravacao_roteiros_update" ON public.gravacao_roteiros FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_gravacao_roteiros_delete" ON public.gravacao_roteiros FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_gravacao_recursos_select" ON public.gravacao_recursos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_gravacao_recursos_insert" ON public.gravacao_recursos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_gravacao_recursos_update" ON public.gravacao_recursos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_gravacao_recursos_delete" ON public.gravacao_recursos FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_gravacao_elenco_select" ON public.gravacao_elenco FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_gravacao_elenco_insert" ON public.gravacao_elenco FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_gravacao_elenco_update" ON public.gravacao_elenco FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_gravacao_elenco_delete" ON public.gravacao_elenco FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_gravacao_convidados_select" ON public.gravacao_convidados FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_gravacao_convidados_insert" ON public.gravacao_convidados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_gravacao_convidados_delete" ON public.gravacao_convidados FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_gravacao_figurinos_select" ON public.gravacao_figurinos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_gravacao_figurinos_insert" ON public.gravacao_figurinos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_gravacao_figurinos_update" ON public.gravacao_figurinos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_gravacao_figurinos_delete" ON public.gravacao_figurinos FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_gravacao_terceiros_select" ON public.gravacao_terceiros FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_gravacao_terceiros_insert" ON public.gravacao_terceiros FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_gravacao_terceiros_update" ON public.gravacao_terceiros FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_gravacao_terceiros_delete" ON public.gravacao_terceiros FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_custos_select" ON public.custos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_custos_insert" ON public.custos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_custos_update" ON public.custos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_custos_delete" ON public.custos FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_tarefas_select" ON public.tarefas FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_tarefas_insert" ON public.tarefas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_tarefas_update" ON public.tarefas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_tarefas_delete" ON public.tarefas FOR DELETE TO authenticated USING (true);

-- ============================================
-- 9. ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX idx_centros_lucro_parent ON public.centros_lucro(parent_id);
CREATE INDEX idx_perfil_permissoes_perfil ON public.perfil_permissoes(perfil_id);
CREATE INDEX idx_profiles_perfil ON public.profiles(perfil_id);
CREATE INDEX idx_usuario_unidades_usuario ON public.usuario_unidades(usuario_id);
CREATE INDEX idx_usuario_unidades_unidade ON public.usuario_unidades(unidade_id);
CREATE INDEX idx_departamento_funcoes_dept ON public.departamento_funcoes(departamento_id);
CREATE INDEX idx_recursos_humanos_dept ON public.recursos_humanos(departamento_id);
CREATE INDEX idx_recursos_humanos_funcao ON public.recursos_humanos(funcao_id);
CREATE INDEX idx_rh_escalas_recurso ON public.rh_escalas(recurso_humano_id);
CREATE INDEX idx_rh_ausencias_recurso ON public.rh_ausencias(recurso_humano_id);
CREATE INDEX idx_rf_faixas_recurso ON public.rf_faixas_disponibilidade(recurso_fisico_id);
CREATE INDEX idx_pessoas_classificacao ON public.pessoas(classificacao_id);
CREATE INDEX idx_fornecedores_categoria ON public.fornecedores(categoria_id);
CREATE INDEX idx_fornecedor_servicos_fornecedor ON public.fornecedor_servicos(fornecedor_id);
CREATE INDEX idx_figurinos_tipo ON public.figurinos(tipo_figurino_id);
CREATE INDEX idx_figurino_imagens_figurino ON public.figurino_imagens(figurino_id);
CREATE INDEX idx_conteudos_unidade ON public.conteudos(unidade_negocio_id);
CREATE INDEX idx_conteudos_centro ON public.conteudos(centro_lucro_id);
CREATE INDEX idx_gravacoes_conteudo ON public.gravacoes(conteudo_id);
CREATE INDEX idx_gravacoes_status ON public.gravacoes(status_id);
CREATE INDEX idx_gravacoes_data ON public.gravacoes(data_prevista);
CREATE INDEX idx_gravacao_recursos_gravacao ON public.gravacao_recursos(gravacao_id);
CREATE INDEX idx_gravacao_elenco_gravacao ON public.gravacao_elenco(gravacao_id);
CREATE INDEX idx_gravacao_elenco_conteudo ON public.gravacao_elenco(conteudo_id);
CREATE INDEX idx_tarefas_gravacao ON public.tarefas(gravacao_id);
CREATE INDEX idx_tarefas_status ON public.tarefas(status_id);
CREATE INDEX idx_tarefas_responsavel ON public.tarefas(recurso_humano_id);
CREATE INDEX idx_custos_gravacao ON public.custos(gravacao_id);
CREATE INDEX idx_custos_conteudo ON public.custos(conteudo_id);

-- ============================================
-- 10. DADOS INICIAIS
-- ============================================

-- Status de Tarefa padrão
INSERT INTO public.status_tarefa (codigo, nome, cor) VALUES
  ('PEND', 'Pendente', '#f59e0b'),
  ('PROG', 'Em Progresso', '#3b82f6'),
  ('CONC', 'Concluída', '#22c55e'),
  ('CANC', 'Cancelada', '#ef4444');

-- Perfil Administrador padrão
INSERT INTO public.perfis_acesso (nome, descricao) VALUES
  ('Administrador', 'Acesso total ao sistema');
