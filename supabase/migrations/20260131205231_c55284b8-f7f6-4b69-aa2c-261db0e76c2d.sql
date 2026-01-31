-- Add image_url column to rf_estoque_itens table
ALTER TABLE public.rf_estoque_itens
ADD COLUMN imagem_url text;

-- Create storage bucket for stock item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('estoque-itens', 'estoque-itens', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the bucket
CREATE POLICY "Anyone can view estoque-itens images"
ON storage.objects FOR SELECT
USING (bucket_id = 'estoque-itens');

CREATE POLICY "Authenticated users can upload estoque-itens images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'estoque-itens' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update estoque-itens images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'estoque-itens' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete estoque-itens images"
ON storage.objects FOR DELETE
USING (bucket_id = 'estoque-itens' AND auth.role() = 'authenticated');