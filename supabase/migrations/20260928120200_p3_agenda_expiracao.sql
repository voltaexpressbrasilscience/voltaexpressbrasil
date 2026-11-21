-- P3 — Agendamento diário da expiração de anúncios
-- A função public.expire_anuncios() já existia, mas nunca era executada.
-- Roda todo dia às 03:05 UTC (00:05 em Brasília) e marca como EXPIRADO o anúncio ATIVO com data fim no passado.
-- cron.schedule com o mesmo nome atualiza o agendamento, então a migração pode ser executada mais de uma vez.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('vt-expira-anuncios', '5 3 * * *', 'SELECT public.expire_anuncios()');
  ELSE
    RAISE NOTICE 'pg_cron não está instalado; rode a migração 20260307220559 antes desta.';
  END IF;
END $$;

-- Fim da migração P3
