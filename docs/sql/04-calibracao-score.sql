-- =====================================================================================
-- 04 — Calibração da nota do Match (Q9) · só leitura · rode no projeto de PRODUÇÃO quando houver uso real
-- =====================================================================================
-- Pergunta: as notas altas recebem mais contato? Se sim, a nota está ordenando bem.
-- Use depois de ~2 semanas de uso real (ou ~50 contatos). Detalhes: docs/MATCH-PONTUACAO-V3.md, seção 6.

-- BLOCO A — Taxa de contato por faixa de nota (últimos 90 dias)
-- Leitura: "taxa_contato" deve subir de "Encaixe parcial" para "Ótimo encaixe". Se não subir, os pesos precisam de ajuste.
WITH ev AS (
  SELECT e.*,
    CASE WHEN e.score >= 75 THEN '3. Ótimo encaixe (75+)'
         WHEN e.score >= 55 THEN '2. Bom encaixe (55–74)'
         ELSE '1. Encaixe parcial (<55)' END AS faixa
  FROM public.vt_match_evento e
  WHERE e.criado_em > now() - interval '90 days' AND e.score IS NOT NULL
)
SELECT faixa,
  count(*) FILTER (WHERE tipo = 'exibido') AS exibicoes,
  count(*) FILTER (WHERE tipo = 'contato') AS contatos,
  round(100.0 * count(*) FILTER (WHERE tipo = 'contato') / nullif(count(*) FILTER (WHERE tipo = 'exibido'), 0), 1) AS taxa_contato_pct
FROM ev
GROUP BY faixa
ORDER BY faixa;

-- BLOCO B — Fretes fechados por faixa da nota do contato (anúncios encerrados com "fechamos o frete")
SELECT
  CASE WHEN c.score >= 75 THEN '3. Ótimo encaixe (75+)'
       WHEN c.score >= 55 THEN '2. Bom encaixe (55–74)'
       ELSE '1. Encaixe parcial (<55)' END AS faixa,
  count(DISTINCT c.anuncio_id) AS anuncios_com_contato,
  count(DISTINCT f.anuncio_id) AS fechados,
  round(100.0 * count(DISTINCT f.anuncio_id) / nullif(count(DISTINCT c.anuncio_id), 0), 1) AS taxa_fechamento_pct
FROM public.vt_match_evento c
LEFT JOIN public.vt_match_evento f ON f.anuncio_id = c.anuncio_id AND f.tipo = 'fechado'
WHERE c.tipo = 'contato' AND c.score IS NOT NULL AND c.criado_em > now() - interval '180 days'
GROUP BY 1
ORDER BY 1;

-- BLOCO C — Pesos e parâmetros em uso (para anotar junto com o resultado)
SELECT versao_pesos, peso_desvio, peso_aproveitamento, peso_data, peso_capacidade, peso_valor, peso_anunciante,
       bonus_retorno, raio_pct, raio_min_km, raio_max_km, nota_modo_cidade, fator_estrada, valor_ref_km
FROM public.vt_match_config WHERE id = 1;
