
-- Fix: Allow admins to update any profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile or admins update all"
ON public.profiles
FOR UPDATE
USING ((auth.uid() = id) OR is_admin(auth.uid()));
