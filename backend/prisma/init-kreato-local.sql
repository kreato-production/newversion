CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_status') THEN
    CREATE TYPE tenant_status AS ENUM ('ATIVO', 'BLOQUEADO', 'INATIVO');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('GLOBAL_ADMIN', 'TENANT_ADMIN', 'USER');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('ATIVO', 'INATIVO', 'BLOQUEADO');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status tenant_status NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NULL,
  codigo_externo TEXT NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  usuario TEXT NOT NULL UNIQUE,
  password_hash TEXT NULL,
  foto_url TEXT NULL,
  perfil TEXT NULL,
  descricao TEXT NULL,
  role user_role NOT NULL DEFAULT 'USER',
  status user_status NOT NULL DEFAULT 'ATIVO',
  tipo_acesso TEXT NOT NULL DEFAULT 'Operacional',
  recurso_humano_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_users_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ NULL,
  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

CREATE TABLE IF NOT EXISTS tenant_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_tenant_licenses_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tenant_licenses_tenant_id ON tenant_licenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_licenses_periodo ON tenant_licenses(data_inicio, data_fim);

CREATE TABLE IF NOT EXISTS unidades_negocio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  codigo_externo TEXT NULL,
  nome TEXT NOT NULL,
  descricao TEXT NULL,
  imagem_url TEXT NULL,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  created_by_name TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_unidades_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_unidades_negocio_tenant_id ON unidades_negocio(tenant_id);

CREATE TABLE IF NOT EXISTS equipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  codigo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_equipes_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE RESTRICT,
  CONSTRAINT uq_equipes_tenant_codigo UNIQUE (tenant_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_equipes_tenant_id ON equipes(tenant_id);

CREATE TABLE IF NOT EXISTS programas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  codigo_externo TEXT NULL,
  nome TEXT NOT NULL,
  descricao TEXT NULL,
  unidade_negocio_id UUID NULL,
  created_by_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_programas_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_programas_unidade_negocio
    FOREIGN KEY (unidade_negocio_id)
    REFERENCES unidades_negocio(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_programas_tenant_id ON programas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_programas_unidade_negocio_id ON programas(unidade_negocio_id);

CREATE TABLE IF NOT EXISTS gravacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  codigo TEXT NOT NULL,
  codigo_externo TEXT NULL,
  nome TEXT NOT NULL,
  descricao TEXT NULL,
  unidade_negocio_id UUID NULL,
  centro_lucro TEXT NULL,
  classificacao TEXT NULL,
  tipo_conteudo TEXT NULL,
  status TEXT NULL,
  data_prevista TIMESTAMPTZ NULL,
  conteudo_id TEXT NULL,
  orcamento NUMERIC(12,2) NOT NULL DEFAULT 0,
  programa_id UUID NULL,
  created_by_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_gravacoes_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_gravacoes_unidade_negocio
    FOREIGN KEY (unidade_negocio_id)
    REFERENCES unidades_negocio(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_gravacoes_programa
    FOREIGN KEY (programa_id)
    REFERENCES programas(id)
    ON DELETE SET NULL,
  CONSTRAINT uq_gravacoes_tenant_codigo UNIQUE (tenant_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_gravacoes_tenant_id ON gravacoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gravacoes_unidade_negocio_id ON gravacoes(unidade_negocio_id);
CREATE INDEX IF NOT EXISTS idx_gravacoes_programa_id ON gravacoes(programa_id);

CREATE TABLE IF NOT EXISTS turnos (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL,
  nome TEXT NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  dias_semana JSONB NOT NULL DEFAULT '{}'::jsonb,
  pessoas_por_dia JSONB NOT NULL DEFAULT '{}'::jsonb,
  cor TEXT NOT NULL DEFAULT '#3B82F6',
  sigla TEXT NULL,
  folgas_por_semana INTEGER NOT NULL DEFAULT 0,
  folga_especial TEXT NULL,
  descricao TEXT NULL,
  dias_trabalhados INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NULL,
  CONSTRAINT fk_turnos_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_turnos_tenant_id ON turnos(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS turnos_tenant_nome_key ON turnos (tenant_id, LOWER(nome));

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenants_updated_at ON tenants;
CREATE TRIGGER trg_tenants_updated_at
BEFORE UPDATE ON tenants
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_tenant_licenses_updated_at ON tenant_licenses;
CREATE TRIGGER trg_tenant_licenses_updated_at
BEFORE UPDATE ON tenant_licenses
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_unidades_negocio_updated_at ON unidades_negocio;
CREATE TRIGGER trg_unidades_negocio_updated_at
BEFORE UPDATE ON unidades_negocio
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_equipes_updated_at ON equipes;
CREATE TRIGGER trg_equipes_updated_at
BEFORE UPDATE ON equipes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_programas_updated_at ON programas;
CREATE TRIGGER trg_programas_updated_at
BEFORE UPDATE ON programas
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_gravacoes_updated_at ON gravacoes;
CREATE TRIGGER trg_gravacoes_updated_at
BEFORE UPDATE ON gravacoes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_turnos_updated_at ON turnos;
CREATE TRIGGER trg_turnos_updated_at
BEFORE UPDATE ON turnos
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
