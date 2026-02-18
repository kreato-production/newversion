
-- Fix permissive RLS policies introduced for Programas

-- Helper functions
CREATE OR REPLACE FUNCTION public.has_unidade_restrictions(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuario_unidades uu
    WHERE uu.usuario_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.has_programa_restrictions(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuario_programas up
    WHERE up.usuario_id = _user_id
  )
$$;

-- PROGRAMAS policies
DROP POLICY IF EXISTS auth_programas_select ON public.programas;
DROP POLICY IF EXISTS auth_programas_insert ON public.programas;
DROP POLICY IF EXISTS auth_programas_update ON public.programas;
DROP POLICY IF EXISTS auth_programas_delete ON public.programas;

-- SELECT:
-- - Admin: all
-- - If user has explicit programa restrictions: only those programs
-- - Else if user has unidade restrictions: only programs in their unidades
-- - Else: all
CREATE POLICY "auth_programas_select"
ON public.programas
FOR SELECT
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR (
    public.has_programa_restrictions(auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.usuario_programas up
      WHERE up.usuario_id = auth.uid()
        AND up.programa_id = programas.id
    )
  )
  OR (
    NOT public.has_programa_restrictions(auth.uid())
    AND public.has_unidade_restrictions(auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.usuario_unidades uu
      WHERE uu.usuario_id = auth.uid()
        AND uu.unidade_id = programas.unidade_negocio_id
    )
  )
  OR (
    NOT public.has_programa_restrictions(auth.uid())
    AND NOT public.has_unidade_restrictions(auth.uid())
  )
);

-- Only admins can manage master data
CREATE POLICY "auth_programas_insert"
ON public.programas
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "auth_programas_update"
ON public.programas
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "auth_programas_delete"
ON public.programas
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- USUARIO_PROGRAMAS policies
DROP POLICY IF EXISTS auth_usuario_programas_select ON public.usuario_programas;
DROP POLICY IF EXISTS auth_usuario_programas_insert ON public.usuario_programas;
DROP POLICY IF EXISTS auth_usuario_programas_delete ON public.usuario_programas;

-- User can read their own links; admin can read all
CREATE POLICY "auth_usuario_programas_select"
ON public.usuario_programas
FOR SELECT
TO authenticated
USING (
  (auth.uid() = usuario_id)
  OR public.is_admin(auth.uid())
);

-- Only admins can write links
CREATE POLICY "auth_usuario_programas_insert"
ON public.usuario_programas
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "auth_usuario_programas_delete"
ON public.usuario_programas
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));
