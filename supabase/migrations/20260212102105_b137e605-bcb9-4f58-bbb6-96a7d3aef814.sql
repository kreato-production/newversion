
-- Add tipo_acesso column to profiles table
ALTER TABLE public.profiles ADD COLUMN tipo_acesso character varying DEFAULT 'Operacional';

-- Create usuario_equipes junction table (user -> teams they coordinate)
CREATE TABLE public.usuario_equipes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  equipe_id uuid NOT NULL REFERENCES public.equipes(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (usuario_id, equipe_id)
);

-- Enable RLS
ALTER TABLE public.usuario_equipes ENABLE ROW LEVEL SECURITY;

-- RLS policies for usuario_equipes
CREATE POLICY "auth_usuario_equipes_select" ON public.usuario_equipes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_usuario_equipes_insert" ON public.usuario_equipes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_usuario_equipes_delete" ON public.usuario_equipes FOR DELETE TO authenticated USING (true);
