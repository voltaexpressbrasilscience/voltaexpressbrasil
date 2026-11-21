-- V3 — Frete fechado: mede a conversão (North Star "fretes de retorno conectados")
-- Ao encerrar um anúncio, o dono responde "O frete foi fechado pela Volta Express?".
-- "Sim" grava um evento 'fechado' em vt_match_evento. O painel passa a mostrar os fretes fechados.
-- Segura para rodar mais de uma vez.

-- 1. Novo tipo de evento
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.vt_match_evento'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%tipo%'
  LOOP
    EXECUTE format('ALTER TABLE public.vt_match_evento DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.vt_match_evento
  ADD CONSTRAINT vt_match_evento_tipo_check CHECK (tipo IN ('exibido', 'contato', 'fechado'));

-- 2. Encerrar o anúncio informando se o frete foi fechado pela plataforma
CREATE OR REPLACE FUNCTION public.vt_encerrar_anuncio(p_anuncio UUID, p_fechado BOOLEAN DEFAULT false)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'É preciso estar logado para encerrar o anúncio.';
  END IF;

  UPDATE vt_anuncio
  SET status = 'ENCERRADO', updated_at = now()
  WHERE id = p_anuncio AND user_id = v_uid AND status IN ('ATIVO', 'PAUSADO', 'EXPIRADO');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Anúncio não encontrado ou já encerrado.';
  END IF;

  IF p_fechado THEN
    INSERT INTO vt_match_evento (user_id, anuncio_id, tipo)
    VALUES (v_uid, p_anuncio, 'fechado');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.vt_encerrar_anuncio(UUID, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vt_encerrar_anuncio(UUID, BOOLEAN) FROM anon;
GRANT EXECUTE ON FUNCTION public.vt_encerrar_anuncio(UUID, BOOLEAN) TO authenticated;

-- 3. Painel: + fretes fechados nos últimos 30 dias (demais indicadores iguais à M2)
CREATE OR REPLACE FUNCTION public.vt_meu_painel()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE WHEN auth.uid() IS NULL THEN NULL ELSE jsonb_build_object(
    'anuncios_ativos', (
      SELECT count(*) FROM vt_anuncio a
      WHERE a.user_id = auth.uid() AND a.status = 'ATIVO' AND a.data_disponivel_fim >= current_date),
    'km_anunciados', (
      SELECT coalesce(round(sum(a.distancia_km)), 0) FROM vt_anuncio a
      WHERE a.user_id = auth.uid() AND a.status = 'ATIVO' AND a.data_disponivel_fim >= current_date),
    'interesses_recebidos_30d', (
      SELECT count(*) FROM vt_match_evento e JOIN vt_anuncio a ON a.id = e.anuncio_id
      WHERE a.user_id = auth.uid() AND e.tipo = 'contato' AND e.criado_em > now() - interval '30 days'),
    'interesses_enviados_30d', (
      SELECT count(*) FROM vt_match_evento e
      WHERE e.user_id = auth.uid() AND e.tipo = 'contato' AND e.criado_em > now() - interval '30 days'),
    'exibicoes_30d', (
      SELECT count(*) FROM vt_match_evento e JOIN vt_anuncio a ON a.id = e.anuncio_id
      WHERE a.user_id = auth.uid() AND e.tipo = 'exibido' AND e.criado_em > now() - interval '30 days'),
    'fretes_fechados_30d', (
      SELECT count(*) FROM vt_match_evento e
      WHERE e.user_id = auth.uid() AND e.tipo = 'fechado' AND e.criado_em > now() - interval '30 days')
  ) END;
$$;

REVOKE ALL ON FUNCTION public.vt_meu_painel() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vt_meu_painel() FROM anon;
GRANT EXECUTE ON FUNCTION public.vt_meu_painel() TO authenticated;

-- Fim da migração V3 (frete fechado)
