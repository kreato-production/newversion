-- Add imagem_url column to unidades_negocio table
ALTER TABLE public.unidades_negocio 
ADD COLUMN imagem_url text;

-- Create storage bucket for business unit logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('unidades-negocio', 'unidades-negocio', true);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload unidades_negocio images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'unidades-negocio' AND auth.role() = 'authenticated');

-- Allow public read access
CREATE POLICY "Public can view unidades_negocio images"
ON storage.objects FOR SELECT
USING (bucket_id = 'unidades-negocio');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update unidades_negocio images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'unidades-negocio' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete unidades_negocio images"
ON storage.objects FOR DELETE
USING (bucket_id = 'unidades-negocio' AND auth.role() = 'authenticated');