
-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to expire ads past their end date
CREATE OR REPLACE FUNCTION public.expire_anuncios()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE vt_anuncio
  SET status = 'EXPIRADO', updated_at = now()
  WHERE status = 'ATIVO'
    AND data_disponivel_fim < CURRENT_DATE;
END;
$$;
