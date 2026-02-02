-- Add status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status VARCHAR(10) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo'));