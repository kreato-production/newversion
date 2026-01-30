-- =============================================================================
-- SECURITY FIX: Implement proper role-based access control and fix RLS policies
-- =============================================================================

-- 1. Create app_role enum for role-based access
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table for proper role management
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- 5. RLS policies for user_roles table (only admins can manage roles)
CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (public.is_admin(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Admins can insert user roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
TO authenticated 
USING (public.is_admin(auth.uid()));

-- =============================================================================
-- 6. Fix profiles table RLS - users can only see their own profile
-- =============================================================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create restrictive policy - users can only read their own profile, admins can read all
CREATE POLICY "Users can view own profile or admins view all" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- =============================================================================
-- 7. Fix custos table RLS - only authenticated users with proper access
-- =============================================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "auth_custos_select" ON public.custos;
DROP POLICY IF EXISTS "auth_custos_insert" ON public.custos;
DROP POLICY IF EXISTS "auth_custos_update" ON public.custos;
DROP POLICY IF EXISTS "auth_custos_delete" ON public.custos;

-- Create restrictive policies for custos (financial data - admin only)
CREATE POLICY "Admins can view all custos" 
ON public.custos 
FOR SELECT 
TO authenticated 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert custos" 
ON public.custos 
FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update custos" 
ON public.custos 
FOR UPDATE 
TO authenticated 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete custos" 
ON public.custos 
FOR DELETE 
TO authenticated 
USING (public.is_admin(auth.uid()));

-- =============================================================================
-- 8. Create trigger to auto-assign admin role to first user (profile creation)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count integer;
BEGIN
  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  IF user_count = 0 THEN
    -- First user gets admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Subsequent users get regular user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to assign role on profile creation
CREATE TRIGGER on_profile_created
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_role();