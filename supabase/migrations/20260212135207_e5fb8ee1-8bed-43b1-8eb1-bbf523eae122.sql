
-- Add foto_url and foto_veiculo_url columns to vt_usuario
ALTER TABLE public.vt_usuario 
ADD COLUMN IF NOT EXISTS foto_url TEXT,
ADD COLUMN IF NOT EXISTS foto_veiculo_url TEXT;

-- Create storage bucket for user photos
INSERT INTO storage.buckets (id, name, public) VALUES ('user-photos', 'user-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view user photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-photos');

CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
