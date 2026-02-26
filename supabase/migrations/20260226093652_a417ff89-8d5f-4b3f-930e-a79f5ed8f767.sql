
-- ================================================
-- Migration 2: Multi-tenancy schema + RLS hardening
-- (global_admin enum already exists)
-- ================================================

-- 1) Tables
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(100) NOT NULL,
  plano varchar(20) NOT NULL DEFAULT 'Mensal',
  status varchar(20) NOT NULL DEFAULT 'Ativo',
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_licencas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE TABLE IF NOT EXISTS public.tenant_modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  modulo varchar(50) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, modulo)
);

-- updated_at for tenants
DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Columns: tenant_id on profiles and most tables (except user_roles and tenant tables)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema='public'
      AND table_type='BASE TABLE'
      AND table_name NOT IN ('tenants','tenant_licencas','tenant_modulos','user_roles')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id)', tbl);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (tenant_id)', 'idx_'||tbl||'_tenant_id', tbl);
  END LOOP;
END $$;

-- 3) Helper functions
CREATE OR REPLACE FUNCTION public.is_global_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'global_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.tenant_has_active_license(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_licencas
    WHERE tenant_id = _tenant_id
      AND data_inicio <= CURRENT_DATE
      AND data_fim >= CURRENT_DATE
  )
$$;

-- 4) Triggers for data integrity
CREATE OR REPLACE FUNCTION public.check_license_dates()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.data_fim < NEW.data_inicio THEN
    RAISE EXCEPTION 'Data fim deve ser maior ou igual à data início.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_license_dates_trigger ON public.tenant_licencas;
CREATE TRIGGER check_license_dates_trigger
BEFORE INSERT OR UPDATE ON public.tenant_licencas
FOR EACH ROW EXECUTE FUNCTION public.check_license_dates();

CREATE OR REPLACE FUNCTION public.check_license_overlap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.tenant_licencas
    WHERE tenant_id = NEW.tenant_id
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND daterange(data_inicio, data_fim, '[]') && daterange(NEW.data_inicio, NEW.data_fim, '[]')
  ) THEN
    RAISE EXCEPTION 'O período de licenciamento sobrepõe um período existente.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_license_overlap_trigger ON public.tenant_licencas;
CREATE TRIGGER check_license_overlap_trigger
BEFORE INSERT OR UPDATE ON public.tenant_licencas
FOR EACH ROW EXECUTE FUNCTION public.check_license_overlap();

-- 5) Auto-tenant assignment on inserts (best-effort; service role inserts keep explicit tenant_id)
CREATE OR REPLACE FUNCTION public.auto_set_tenant_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- If no JWT (service role), don't auto-set
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Global admin must set tenant_id explicitly
  IF public.is_global_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.get_user_tenant_id(auth.uid());
  END IF;

  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema='public'
      AND column_name='tenant_id'
      AND table_name NOT IN ('tenants','tenant_licencas','tenant_modulos','user_roles')
    GROUP BY table_name
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS auto_tenant_id ON public.%I', tbl);
    EXECUTE format('CREATE TRIGGER auto_tenant_id BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.auto_set_tenant_id()', tbl);
  END LOOP;
END $$;

-- 6) RLS: New tables (only global_admin)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_licencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_modulos ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename IN ('tenants','tenant_licencas','tenant_modulos') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

CREATE POLICY tenants_select ON public.tenants FOR SELECT TO authenticated
USING (public.is_global_admin(auth.uid()));
CREATE POLICY tenants_insert ON public.tenants FOR INSERT TO authenticated
WITH CHECK (public.is_global_admin(auth.uid()));
CREATE POLICY tenants_update ON public.tenants FOR UPDATE TO authenticated
USING (public.is_global_admin(auth.uid()));
CREATE POLICY tenants_delete ON public.tenants FOR DELETE TO authenticated
USING (public.is_global_admin(auth.uid()));

CREATE POLICY tenant_licencas_select ON public.tenant_licencas FOR SELECT TO authenticated
USING (public.is_global_admin(auth.uid()));
CREATE POLICY tenant_licencas_insert ON public.tenant_licencas FOR INSERT TO authenticated
WITH CHECK (public.is_global_admin(auth.uid()));
CREATE POLICY tenant_licencas_update ON public.tenant_licencas FOR UPDATE TO authenticated
USING (public.is_global_admin(auth.uid()));
CREATE POLICY tenant_licencas_delete ON public.tenant_licencas FOR DELETE TO authenticated
USING (public.is_global_admin(auth.uid()));

CREATE POLICY tenant_modulos_select ON public.tenant_modulos FOR SELECT TO authenticated
USING (public.is_global_admin(auth.uid()) OR tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY tenant_modulos_insert ON public.tenant_modulos FOR INSERT TO authenticated
WITH CHECK (public.is_global_admin(auth.uid()));
CREATE POLICY tenant_modulos_update ON public.tenant_modulos FOR UPDATE TO authenticated
USING (public.is_global_admin(auth.uid()));
CREATE POLICY tenant_modulos_delete ON public.tenant_modulos FOR DELETE TO authenticated
USING (public.is_global_admin(auth.uid()));

-- 7) RLS: Generic tables (tenant isolated)
DO $$
DECLARE
  tbl text;
  pol record;
BEGIN
  FOR tbl IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema='public'
      AND column_name='tenant_id'
      AND table_name NOT IN (
        'tenants','tenant_licencas','tenant_modulos',
        'profiles','programas','usuario_programas','custos'
      )
    GROUP BY table_name
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=tbl LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY tenant_%s_select ON public.%I FOR SELECT TO authenticated USING (public.is_global_admin(auth.uid()) OR tenant_id = public.get_user_tenant_id(auth.uid()))',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY tenant_%s_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_global_admin(auth.uid()) OR tenant_id = public.get_user_tenant_id(auth.uid()))',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY tenant_%s_update ON public.%I FOR UPDATE TO authenticated USING (public.is_global_admin(auth.uid()) OR tenant_id = public.get_user_tenant_id(auth.uid()))',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY tenant_%s_delete ON public.%I FOR DELETE TO authenticated USING (public.is_global_admin(auth.uid()) OR tenant_id = public.get_user_tenant_id(auth.uid()))',
      tbl, tbl
    );
  END LOOP;
END $$;

-- 8) RLS: Complex tables

-- 8.1 profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
USING (
  public.is_global_admin(auth.uid())
  OR auth.uid() = id
  OR (public.is_admin(auth.uid()) AND tenant_id = public.get_user_tenant_id(auth.uid()))
);

CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
USING (
  public.is_global_admin(auth.uid())
  OR auth.uid() = id
  OR (public.is_admin(auth.uid()) AND tenant_id = public.get_user_tenant_id(auth.uid()))
);

CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = id
  OR public.is_global_admin(auth.uid())
  OR public.is_admin(auth.uid())
);

-- 8.2 custos (admin-only) + tenant
ALTER TABLE public.custos ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='custos' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.custos', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY custos_select ON public.custos FOR SELECT TO authenticated
USING (
  public.is_global_admin(auth.uid())
  OR (public.is_admin(auth.uid()) AND tenant_id = public.get_user_tenant_id(auth.uid()))
);

CREATE POLICY custos_insert ON public.custos FOR INSERT TO authenticated
WITH CHECK (
  public.is_global_admin(auth.uid())
  OR (public.is_admin(auth.uid()) AND tenant_id = public.get_user_tenant_id(auth.uid()))
);

CREATE POLICY custos_update ON public.custos FOR UPDATE TO authenticated
USING (
  public.is_global_admin(auth.uid())
  OR (public.is_admin(auth.uid()) AND tenant_id = public.get_user_tenant_id(auth.uid()))
);

CREATE POLICY custos_delete ON public.custos FOR DELETE TO authenticated
USING (
  public.is_global_admin(auth.uid())
  OR (public.is_admin(auth.uid()) AND tenant_id = public.get_user_tenant_id(auth.uid()))
);

-- 8.3 usuario_programas: keep rules + tenant
ALTER TABLE public.usuario_programas ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='usuario_programas' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.usuario_programas', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY usuario_programas_select ON public.usuario_programas FOR SELECT TO authenticated
USING (
  public.is_global_admin(auth.uid())
  OR (tenant_id = public.get_user_tenant_id(auth.uid()) AND (auth.uid() = usuario_id OR public.is_admin(auth.uid())))
);

CREATE POLICY usuario_programas_insert ON public.usuario_programas FOR INSERT TO authenticated
WITH CHECK (
  public.is_global_admin(auth.uid())
  OR (
    public.is_admin(auth.uid())
    AND tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.get_user_tenant_id(usuario_id) = tenant_id
  )
);

CREATE POLICY usuario_programas_delete ON public.usuario_programas FOR DELETE TO authenticated
USING (
  public.is_global_admin(auth.uid())
  OR (public.is_admin(auth.uid()) AND tenant_id = public.get_user_tenant_id(auth.uid()))
);

-- 8.4 programas: keep original rule + tenant
ALTER TABLE public.programas ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='programas' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.programas', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY programas_select ON public.programas FOR SELECT TO authenticated
USING (
  public.is_global_admin(auth.uid())
  OR (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (
      public.is_admin(auth.uid())
      OR (
        public.has_programa_restrictions(auth.uid())
        AND EXISTS (
          SELECT 1 FROM public.usuario_programas up
          WHERE up.usuario_id = auth.uid() AND up.programa_id = programas.id
        )
      )
      OR (
        NOT public.has_programa_restrictions(auth.uid())
        AND public.has_unidade_restrictions(auth.uid())
        AND EXISTS (
          SELECT 1 FROM public.usuario_unidades uu
          WHERE uu.usuario_id = auth.uid() AND uu.unidade_id = programas.unidade_negocio_id
        )
      )
      OR (
        NOT public.has_programa_restrictions(auth.uid())
        AND NOT public.has_unidade_restrictions(auth.uid())
      )
    )
  )
);

CREATE POLICY programas_insert ON public.programas FOR INSERT TO authenticated
WITH CHECK (
  public.is_global_admin(auth.uid())
  OR (public.is_admin(auth.uid()) AND tenant_id = public.get_user_tenant_id(auth.uid()))
);

CREATE POLICY programas_update ON public.programas FOR UPDATE TO authenticated
USING (
  public.is_global_admin(auth.uid())
  OR (public.is_admin(auth.uid()) AND tenant_id = public.get_user_tenant_id(auth.uid()))
);

CREATE POLICY programas_delete ON public.programas FOR DELETE TO authenticated
USING (
  public.is_global_admin(auth.uid())
  OR (public.is_admin(auth.uid()) AND tenant_id = public.get_user_tenant_id(auth.uid()))
);

-- 8.5 user_roles: allow admins + global_admin
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='user_roles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY user_roles_select ON public.user_roles FOR SELECT TO authenticated
USING (
  public.is_global_admin(auth.uid())
  OR public.is_admin(auth.uid())
  OR user_id = auth.uid()
);

CREATE POLICY user_roles_insert ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.is_global_admin(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY user_roles_update ON public.user_roles FOR UPDATE TO authenticated
USING (public.is_global_admin(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY user_roles_delete ON public.user_roles FOR DELETE TO authenticated
USING (public.is_global_admin(auth.uid()) OR public.is_admin(auth.uid()));
