-- Allow users to read their own tenant
DROP POLICY IF EXISTS tenants_select ON public.tenants;
CREATE POLICY tenants_select ON public.tenants
  FOR SELECT
  USING (
    is_global_admin(auth.uid())
    OR (id = get_user_tenant_id(auth.uid()))
  );

-- Allow users to read their own tenant's licenses
DROP POLICY IF EXISTS tenant_licencas_select ON public.tenant_licencas;
CREATE POLICY tenant_licencas_select ON public.tenant_licencas
  FOR SELECT
  USING (
    is_global_admin(auth.uid())
    OR (tenant_id = get_user_tenant_id(auth.uid()))
  );
