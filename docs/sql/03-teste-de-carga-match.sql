-- =====================================================================================
-- 03 — Teste de carga do Match (medir onde está a performance) · SOMENTE NO PROJETO DEV
-- =====================================================================================
-- Pergunta que responde: quanto tempo o Match leva com 100, 1.000 e 5.000 anúncios ativos?
-- Hoje as funções calculam a distância de TODOS os anúncios ativos até a rota (não há pré-filtro
-- por índice). Com poucos anúncios é instantâneo; o teste mostra a partir de quando pesa.
--
-- Pré-requisito: ter rodado o 02-popular-demo.sql (usa o usuário "Transportes Cerrado (fictícia)"
-- e "Agro Planalto (fictícia)" como donos dos anúncios sintéticos).
-- Os anúncios sintéticos ficam marcados: descrição começa com "SINTÉTICO" e placa com "SIN".
-- Ordem: A (gerar) → B (medir) → anotar → C (apagar). Para outra escala, rode C e depois A com outro N.
-- Durante o teste, a tela "Oportunidades" mostra os sintéticos. Não deixe para o dia da apresentação.
-- =====================================================================================


-- -------------------------------------------------------------------------------------
-- A — Gerar N cargas e N/2 caminhões sintéticos espalhados pelo Sudeste/Centro-Oeste/Sul
-- Troque o 1000 abaixo por 100, 1000 ou 5000.
-- -------------------------------------------------------------------------------------
DO $$
DECLARE
  n int := 1000;
  u_carga uuid := (SELECT user_id FROM public.vt_usuario WHERE nome = 'Agro Planalto (fictícia)');
  u_cam   uuid := (SELECT user_id FROM public.vt_usuario WHERE nome = 'Transportes Cerrado (fictícia)');
  i int; olat float8; olng float8; dlat float8; dlng float8; v_o uuid; v_d uuid; v_m uuid; v_v uuid;
BEGIN
  IF u_carga IS NULL OR u_cam IS NULL THEN
    RAISE EXCEPTION 'Rode antes o 02-popular-demo.sql (blocos 1 e 2).';
  END IF;
  FOR i IN 1..n LOOP
    olat := -25 + random() * 10; olng := -52 + random() * 10;
    dlat := -25 + random() * 10; dlng := -52 + random() * 10;
    INSERT INTO public.vt_localizacao (cidade, estado, latitude, longitude, user_id)
      VALUES ('Sintética', 'XX', olat, olng, u_carga) RETURNING id INTO v_o;
    INSERT INTO public.vt_localizacao (cidade, estado, latitude, longitude, user_id)
      VALUES ('Sintética', 'XX', dlat, dlng, u_carga) RETURNING id INTO v_d;
    INSERT INTO public.vt_mercadoria (descricao, categoria_carga, exige_refrigeracao, peso_kg, volume_m3, user_id)
      VALUES ('SINTÉTICO ' || i, 'Carga seca', false, 1000 + random() * 12000, 5 + random() * 40, u_carga)
      RETURNING id INTO v_m;
    INSERT INTO public.vt_anuncio (user_id, tipo_anuncio, mercadoria_id, origem_id, destino_id,
        data_disponivel_inicio, data_disponivel_fim, valor_sugerido, status, distancia_km)
      VALUES (u_carga, 'C', v_m, v_o, v_d, current_date + 1, current_date + 20, 2000, 'ATIVO', 400);

    IF i % 2 = 0 THEN
      INSERT INTO public.vt_veiculo (user_id, placa, tipo_veiculo, capacidade_peso_kg, capacidade_volume_m3)
        VALUES (u_cam, 'SIN' || lpad(i::text, 4, '0'), 'Truck', 14000, 45) RETURNING id INTO v_v;
      INSERT INTO public.vt_carroceria (veiculo_id, tipo_carroceria, refrigerado) VALUES (v_v, 'Baú', false);
      INSERT INTO public.vt_localizacao (cidade, estado, latitude, longitude, user_id)
        VALUES ('Sintética', 'XX', olat, olng, u_cam) RETURNING id INTO v_o;
      INSERT INTO public.vt_localizacao (cidade, estado, latitude, longitude, user_id)
        VALUES ('Sintética', 'XX', dlat, dlng, u_cam) RETURNING id INTO v_d;
      -- Rota com um vértice a cada 5 km (parecido com a polyline resumida do Google: centenas de pontos)
      INSERT INTO public.vt_anuncio (user_id, tipo_anuncio, veiculo_id, origem_id, destino_id,
          data_disponivel_inicio, data_disponivel_fim, valor_sugerido, status, rota, distancia_km)
        VALUES (u_cam, 'V', v_v, v_o, v_d, current_date + 1, current_date + 20, 2000, 'ATIVO',
          extensions.ST_Segmentize(extensions.ST_SetSRID(extensions.ST_MakeLine(
            extensions.ST_MakePoint(olng, olat), extensions.ST_MakePoint(dlng, dlat)), 4326)::extensions.geography, 5000),
          400);
    END IF;
  END LOOP;
END $$;


-- -------------------------------------------------------------------------------------
-- B — Medir (só leitura). Roda cada busca 1 vez e mostra o tempo em milissegundos.
-- Anote: N, ms_cargas, ms_veiculos. Rode 3 vezes e fique com a mediana.
-- Referência para decidir: até ~300 ms está bom; acima de ~800 ms aplique o pré-filtro (relatório, P1).
-- -------------------------------------------------------------------------------------
WITH sessao AS MATERIALIZED (
  SELECT set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-00000000d3e0","role":"authenticated"}', true) AS s
),
t0 AS MATERIALIZED (SELECT clock_timestamp() AS t, s FROM sessao),
r1 AS MATERIALIZED (
  SELECT count(*) AS n FROM t0, public.vt_match_cargas(jsonb_build_object(
    'tipo_carroceria','Baú','capacidade_kg',14000,'capacidade_m3',45,
    'origem_cidade','Goiânia','origem_uf','GO','destino_cidade','Uberlândia','destino_uf','MG',
    'polyline','bdzdB~_ukHf}jEw`^vmcCnnTnub@owbBrw~@wprA','limite',50, '_t', t0.t::text, '_s', t0.s))
),
t1 AS MATERIALIZED (SELECT clock_timestamp() AS t FROM r1),
r2 AS MATERIALIZED (
  SELECT count(*) AS n FROM t1, sessao, public.vt_match_veiculos(jsonb_build_object(
    'categoria_carga','Carga seca','peso_kg',9000,'volume_m3',25,
    'origem_cidade','Itumbiara','origem_uf','GO','destino_cidade','Goiânia','destino_uf','GO',
    'origem_lat',-18.4093,'origem_lng',-49.2158,'destino_lat',-16.6869,'destino_lng',-49.2648,
    'limite',50, '_t', t1.t::text, '_s', sessao.s))
),
t2 AS MATERIALIZED (SELECT clock_timestamp() AS t FROM r2)
SELECT
  (SELECT count(*) FROM public.vt_anuncio WHERE status = 'ATIVO' AND tipo_anuncio = 'C') AS cargas_ativas,
  (SELECT count(*) FROM public.vt_anuncio WHERE status = 'ATIVO' AND tipo_anuncio = 'V') AS caminhoes_ativos,
  (SELECT n FROM r1) AS resultados_cargas,
  round(extract(epoch FROM (t1.t - t0.t)) * 1000) AS ms_cargas,
  (SELECT n FROM r2) AS resultados_veiculos,
  round(extract(epoch FROM (t2.t - t1.t)) * 1000) AS ms_veiculos
FROM t0, t1, t2;


-- -------------------------------------------------------------------------------------
-- C — Apagar os sintéticos (só eles)
-- Pronto quando: a última consulta mostra 0.
-- -------------------------------------------------------------------------------------
BEGIN;
DELETE FROM public.vt_anuncio a USING public.vt_mercadoria m
  WHERE a.mercadoria_id = m.id AND m.descricao LIKE 'SINTÉTICO %';
DELETE FROM public.vt_anuncio a USING public.vt_veiculo v
  WHERE a.veiculo_id = v.id AND v.placa LIKE 'SIN%';
DELETE FROM public.vt_mercadoria WHERE descricao LIKE 'SINTÉTICO %';
DELETE FROM public.vt_veiculo WHERE placa LIKE 'SIN%';
DELETE FROM public.vt_localizacao l WHERE l.cidade = 'Sintética' AND l.estado = 'XX'
  AND NOT EXISTS (SELECT 1 FROM public.vt_anuncio a WHERE a.origem_id = l.id OR a.destino_id = l.id);
COMMIT;
SELECT count(*) AS sinteticos_restantes FROM public.vt_localizacao WHERE cidade = 'Sintética';
