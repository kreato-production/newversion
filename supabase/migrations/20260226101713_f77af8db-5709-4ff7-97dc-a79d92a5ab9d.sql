
-- Drop existing select policy
DROP POLICY IF EXISTS profiles_select ON public.profiles;

-- Recreate: global_admin sees all, any user in same tenant sees all tenant users, user sees own profile
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT
  USING (
    is_global_admin(auth.uid())
    OR (auth.uid() = id)
    OR (tenant_id = get_user_tenant_id(auth.uid()))
  );
