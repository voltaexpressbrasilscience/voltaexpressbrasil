
-- Create a trigger function to auto-create vt_usuario profile on signup
-- This uses the raw_user_meta_data from the auth.users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.vt_usuario (user_id, nome, tipo_usuario, documento, telefone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'C'),
    COALESCE(NEW.raw_user_meta_data->>'documento', ''),
    COALESCE(NEW.raw_user_meta_data->>'telefone', '')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    nome = EXCLUDED.nome,
    tipo_usuario = EXCLUDED.tipo_usuario,
    documento = EXCLUDED.documento,
    telefone = EXCLUDED.telefone;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add unique constraint on user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vt_usuario_user_id_key'
  ) THEN
    ALTER TABLE public.vt_usuario ADD CONSTRAINT vt_usuario_user_id_key UNIQUE (user_id);
  END IF;
END $$;
