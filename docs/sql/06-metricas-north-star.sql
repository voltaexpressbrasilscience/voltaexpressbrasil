-- =====================================================================================
-- 06 — Métricas da North Star e do funil (SOMENTE LEITURA: não altera nada)
-- Rode no SQL Editor (DEV para testar, produção para o número real), um bloco por vez.
-- Pré-requisitos: migrações M2 (vt_match_evento), V3 frete fechado ('fechado') e M3 (vt_localizacao.ponto).
-- Nenhum bloco devolve dado pessoal: só contagens por mês e por UF. Grupos com menos de 3 viram "Outros",
-- a mesma regra que o Hub usa para publicar (decisão D2 do Hub).
--
-- North Star: fretes de retorno conectados por mês = eventos 'fechado' em anúncios de CAMINHÃO que são a volta
-- de uma viagem anunciada pelo mesmo veículo (mesma regra do selo "Frete de retorno" do Match v3: a origem da
-- volta fica a até 50 km do destino da ida, e a volta começa até 15 dias depois do fim da ida).
-- Anúncio de carga encerrado como fechado conta no total de fretes fechados, mas não na North Star, porque o
-- banco não sabe qual caminhão levou a carga.
-- =====================================================================================

-- 1. Série mensal (últimos 12 meses): anúncios, contatos, fretes fechados e North Star
WITH meses AS (
  SELECT generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') AS mes
),
retorno AS (
  SELECT a.id
  FROM vt_anuncio a
  JOIN vt_localizacao o ON o.id = a.origem_id
  WHERE a.tipo_anuncio = 'V'
    AND EXISTS (
      SELECT 1
      FROM vt_anuncio i
      JOIN vt_localizacao idest ON idest.id = i.destino_id
      WHERE i.veiculo_id = a.veiculo_id
        AND i.id <> a.id
        AND i.tipo_anuncio = 'V'
        AND i.data_disponivel_inicio <= a.data_disponivel_inicio
        AND i.data_disponivel_fim >= a.data_disponivel_inicio - 15
        AND idest.ponto IS NOT NULL AND o.ponto IS NOT NULL
        AND ST_DWithin(idest.ponto, o.ponto, 50000)
    )
)
SELECT
  to_char(m.mes, 'YYYY-MM') AS mes,
  (SELECT count(*) FROM vt_anuncio a WHERE a.tipo_anuncio = 'V' AND date_trunc('month', a.created_at) = m.mes) AS anuncios_caminhao,
  (SELECT count(*) FROM vt_anuncio a WHERE a.tipo_anuncio = 'C' AND date_trunc('month', a.created_at) = m.mes) AS anuncios_carga,
  (SELECT count(*) FROM vt_match_evento e WHERE e.tipo = 'contato' AND date_trunc('month', e.criado_em) = m.mes) AS contatos,
  (SELECT count(*) FROM vt_match_evento e WHERE e.tipo = 'fechado' AND date_trunc('month', e.criado_em) = m.mes) AS fretes_fechados,
  (SELECT count(*) FROM vt_match_evento e JOIN retorno r ON r.id = e.anuncio_id
    WHERE e.tipo = 'fechado' AND date_trunc('month', e.criado_em) = m.mes) AS north_star_retorno_conectado
FROM meses m
ORDER BY m.mes;

-- 2. Funil do último mês fechado: exibido → contato → fechado (anúncios distintos em cada etapa)
SELECT
  to_char(date_trunc('month', now()) - interval '1 month', 'YYYY-MM') AS mes,
  count(DISTINCT e.anuncio_id) FILTER (WHERE e.tipo = 'exibido') AS anuncios_exibidos,
  count(DISTINCT e.anuncio_id) FILTER (WHERE e.tipo = 'contato') AS anuncios_com_contato,
  count(DISTINCT e.anuncio_id) FILTER (WHERE e.tipo = 'fechado') AS anuncios_fechados
FROM vt_match_evento e
WHERE e.criado_em >= date_trunc('month', now()) - interval '1 month'
  AND e.criado_em <  date_trunc('month', now());

-- 3. Liquidez hoje: anúncios ATIVOS por UF de origem e tipo (UF com menos de 3 vira "Outros")
WITH base AS (
  SELECT o.estado AS uf, a.tipo_anuncio
  FROM vt_anuncio a JOIN vt_localizacao o ON o.id = a.origem_id
  WHERE a.status = 'ATIVO'
),
por_uf AS (
  SELECT uf, count(*) AS total FROM base GROUP BY uf
)
SELECT CASE WHEN p.total >= 3 THEN b.uf ELSE 'Outros' END AS uf,
       count(*) FILTER (WHERE b.tipo_anuncio = 'V') AS caminhoes_ativos,
       count(*) FILTER (WHERE b.tipo_anuncio = 'C') AS cargas_ativas
FROM base b JOIN por_uf p ON p.uf = b.uf
GROUP BY 1
ORDER BY (count(*)) DESC;

-- 4. JSON para o Hub (data/metricas-mensais.json, issue #9 do Hub): os 12 meses do bloco 1 num objeto só.
--    Copie a célula "json" do resultado. Formato: schemas/metricas-mensais.schema.json do Hub (7.3.0);
--    rode scripts/validar_dados.py no Hub antes do commit.
WITH meses AS (
  SELECT generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') AS mes
),
retorno AS (
  SELECT a.id
  FROM vt_anuncio a
  JOIN vt_localizacao o ON o.id = a.origem_id
  WHERE a.tipo_anuncio = 'V'
    AND EXISTS (
      SELECT 1 FROM vt_anuncio i JOIN vt_localizacao idest ON idest.id = i.destino_id
      WHERE i.veiculo_id = a.veiculo_id AND i.id <> a.id AND i.tipo_anuncio = 'V'
        AND i.data_disponivel_inicio <= a.data_disponivel_inicio
        AND i.data_disponivel_fim >= a.data_disponivel_inicio - 15
        AND idest.ponto IS NOT NULL AND o.ponto IS NOT NULL
        AND ST_DWithin(idest.ponto, o.ponto, 50000)
    )
),
serie AS (
  SELECT to_char(m.mes, 'YYYY-MM') AS mes,
    (SELECT count(*) FROM vt_anuncio a WHERE date_trunc('month', a.created_at) = m.mes) AS anuncios,
    (SELECT count(*) FROM vt_match_evento e WHERE e.tipo = 'contato' AND date_trunc('month', e.criado_em) = m.mes) AS contatos,
    (SELECT count(*) FROM vt_match_evento e WHERE e.tipo = 'fechado' AND date_trunc('month', e.criado_em) = m.mes) AS fretes_fechados,
    (SELECT count(*) FROM vt_match_evento e JOIN retorno r ON r.id = e.anuncio_id
      WHERE e.tipo = 'fechado' AND date_trunc('month', e.criado_em) = m.mes) AS retorno_conectado
  FROM meses m
)
SELECT json_build_object(
  'gerado_em', to_char(now(), 'YYYY-MM-DD'),
  'fonte', 'docs/sql/06-metricas-north-star.sql (bloco 4), banco de produção da plataforma',
  'definicao_north_star', 'Fretes de retorno conectados: anúncios de caminhão que são volta de uma viagem anunciada, encerrados como fechados pela Volta Express',
  'meses', json_agg(serie ORDER BY serie.mes)
) AS json
FROM serie;

-- Fim de 06-metricas-north-star.sql
