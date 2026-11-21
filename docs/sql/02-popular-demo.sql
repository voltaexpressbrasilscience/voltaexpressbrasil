-- =====================================================================================
-- 02 — Popular o banco com cenários de match para demonstração · SOMENTE NO PROJETO DEV
-- =====================================================================================
-- O que faz: cria 4 anunciantes fictícios (U5 a U8) e 19 anúncios (5 de caminhão, 14 de carga) em dois corredores
-- (Centro-Oeste/Triângulo Mineiro e Nordeste/BR-101), com rota e coordenadas gravadas.
-- Assim o Match funciona em modo "rota" mesmo sem chamar o Google na criação.
--
-- Não mexe nos usuários U1 a U4 do roteiro v3 (docs/DEMONSTRACAO-V3.md): as cidades daqui
-- não cruzam as rotas JF/SP/RJ/BH/Curitiba/POA, então os resultados esperados do roteiro não mudam.
--
-- Telefone de todos os anunciantes fictícios = WhatsApp da empresa (32 98836-7667). Assim o
-- "Tenho interesse" da demonstração nunca abre conversa com um número de terceiro.
--
-- Datas relativas (D+N = hoje + N dias). Rode de novo na véspera da apresentação: o bloco 2
-- apaga e recria os anúncios desses 4 usuários.
--
-- Como rodar: Supabase (projeto DEV) → SQL Editor → cole UM bloco por vez → Run.
-- Ordem: 0 → 1 (só na primeira vez) → 2 → 3. O bloco 4 desfaz tudo.
-- Rotas: traçado aproximado pelas cidades das rodovias (BR-153/BR-452, BR-050, BR-101),
-- não é o traçado exato do Google. Distâncias (km) são aproximadas.
-- =====================================================================================


-- -------------------------------------------------------------------------------------
-- BLOCO 0 — Conferir antes (só leitura)
-- Pronto quando: postgis = true, as 3 funções = true, e a coluna "documento_em_uso" = 0.
-- -------------------------------------------------------------------------------------
SELECT
  EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis')                      AS postgis,
  to_regprocedure('public.vt_match_cargas(jsonb)') IS NOT NULL                        AS fn_match_cargas,
  to_regprocedure('public.vt_match_veiculos(jsonb)') IS NOT NULL                      AS fn_match_veiculos,
  to_regprocedure('public.vt_criar_anuncio(jsonb)') IS NOT NULL                       AS fn_criar_anuncio,
  (SELECT count(*) FROM public.vt_usuario
    WHERE documento IN ('55555555555','66666666666','77777777777','88888888888')
      AND nome NOT IN ('Transportes Cerrado (fictícia)','José Ferreira (fictício)',
                       'Agro Planalto (fictícia)','Atacadão Litoral (fictícia)'))    AS documento_em_uso,
  (SELECT count(*) FROM public.vt_usuario
    WHERE nome IN ('Transportes Cerrado (fictícia)','José Ferreira (fictício)',
                   'Agro Planalto (fictícia)','Atacadão Litoral (fictícia)'))        AS usuarios_demo_ja_criados,
  (SELECT count(*) FROM public.vt_anuncio WHERE status = 'ATIVO')                     AS anuncios_ativos,
  (SELECT count(*) FROM public.vt_anuncio WHERE status = 'ATIVO' AND rota IS NULL)    AS ativos_sem_rota;


-- -------------------------------------------------------------------------------------
-- BLOCO 1 — Criar os 4 anunciantes fictícios (só na primeira vez)
-- Caminho B do relatório: grava direto em auth.users, SEM senha (essas contas não fazem login;
-- só "donas" dos anúncios). O gatilho handle_new_user cria o perfil em vt_usuario.
-- Se preferir o caminho A (cadastro pela tela /cadastro), pule este bloco e use os MESMOS nomes,
-- CPFs e tipo de perfil da lista abaixo.
-- Pronto quando: o bloco 0 mostra usuarios_demo_ja_criados = 4.
-- -------------------------------------------------------------------------------------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
SELECT
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  u.email, '', now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'nome', u.nome, 'tipo_usuario', u.tipo, 'documento', u.cpf, 'telefone', '32988367667',
    'cnpj', u.cnpj, 'aceite_privacidade', 'true', 'versao_politica', '2026-10-28'
  ),
  now(), now(), '', '', '', ''
FROM (VALUES
  ('demo-u5@veb-demo.invalid', 'Transportes Cerrado (fictícia)', 'C', '55555555555', '55555555000155'),
  ('demo-u6@veb-demo.invalid', 'José Ferreira (fictício)',       'C', '66666666666', ''),
  ('demo-u7@veb-demo.invalid', 'Agro Planalto (fictícia)',       'E', '77777777777', '77777777000177'),
  ('demo-u8@veb-demo.invalid', 'Atacadão Litoral (fictícia)',    'E', '88888888888', '88888888000188')
) AS u(email, nome, tipo, cpf, cnpj)
WHERE NOT EXISTS (SELECT 1 FROM auth.users a WHERE a.email = u.email);


-- -------------------------------------------------------------------------------------
-- BLOCO 2 — Popular (apaga e recria os anúncios de U5 a U8)
-- Pronto quando: a última linha mostra veiculos = 5 e cargas = 14.
-- -------------------------------------------------------------------------------------
BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.demo_uid(p_nome text) RETURNS uuid
LANGUAGE plpgsql AS $f$
DECLARE v uuid;
BEGIN
  SELECT user_id INTO v FROM public.vt_usuario WHERE nome = p_nome;
  IF v IS NULL THEN
    RAISE EXCEPTION 'Usuário de demonstração "%" não existe. Rode o bloco 1 (ou cadastre pela tela).', p_nome;
  END IF;
  RETURN v;
END $f$;

CREATE OR REPLACE FUNCTION pg_temp.demo_loc(p_uid uuid, p_cidade text, p_uf text, p_lat numeric, p_lng numeric)
RETURNS uuid LANGUAGE sql AS $f$
  INSERT INTO public.vt_localizacao (cidade, estado, latitude, longitude, user_id)
  VALUES (p_cidade, p_uf, p_lat, p_lng, p_uid) RETURNING id
$f$;

-- Anúncio de caminhão. O veículo é reaproveitado pela placa (mesmo caminhão na ida e na volta).
CREATE OR REPLACE FUNCTION pg_temp.demo_veiculo(
  p_dono text, p_placa text, p_tipo text, p_carroceria text, p_frio boolean, p_kg numeric, p_m3 numeric,
  p_oc text, p_ouf text, p_olat numeric, p_olng numeric,
  p_dc text, p_duf text, p_dlat numeric, p_dlng numeric,
  p_ini int, p_fim int, p_valor numeric, p_km numeric, p_wkt text
) RETURNS uuid LANGUAGE plpgsql AS $f$
DECLARE v_uid uuid := pg_temp.demo_uid(p_dono); v_vei uuid; v_id uuid;
BEGIN
  SELECT id INTO v_vei FROM public.vt_veiculo WHERE user_id = v_uid AND placa = p_placa;
  IF v_vei IS NULL THEN
    INSERT INTO public.vt_veiculo (user_id, placa, tipo_veiculo, capacidade_peso_kg, capacidade_volume_m3)
    VALUES (v_uid, p_placa, p_tipo, p_kg, p_m3) RETURNING id INTO v_vei;
    INSERT INTO public.vt_carroceria (veiculo_id, tipo_carroceria, refrigerado) VALUES (v_vei, p_carroceria, p_frio);
  END IF;
  INSERT INTO public.vt_anuncio (
    user_id, tipo_anuncio, veiculo_id, origem_id, destino_id,
    data_disponivel_inicio, data_disponivel_fim, valor_sugerido, status, rota, distancia_km
  ) VALUES (
    v_uid, 'V', v_vei,
    pg_temp.demo_loc(v_uid, p_oc, p_ouf, p_olat, p_olng),
    pg_temp.demo_loc(v_uid, p_dc, p_duf, p_dlat, p_dlng),
    current_date + p_ini, current_date + p_fim, p_valor, 'ATIVO',
    extensions.ST_GeogFromText('SRID=4326;' || p_wkt), p_km
  ) RETURNING id INTO v_id;
  RETURN v_id;
END $f$;

-- Anúncio de carga.
CREATE OR REPLACE FUNCTION pg_temp.demo_carga(
  p_dono text, p_desc text, p_tipo text, p_categoria text, p_frio boolean, p_kg numeric, p_m3 numeric,
  p_oc text, p_ouf text, p_olat numeric, p_olng numeric,
  p_dc text, p_duf text, p_dlat numeric, p_dlng numeric,
  p_ini int, p_fim int, p_valor numeric, p_km numeric
) RETURNS uuid LANGUAGE plpgsql AS $f$
DECLARE v_uid uuid := pg_temp.demo_uid(p_dono); v_mer uuid; v_id uuid;
BEGIN
  INSERT INTO public.vt_mercadoria (descricao, tipo_mercadoria, categoria_carga, exige_refrigeracao, peso_kg, volume_m3, user_id)
  VALUES (p_desc, p_tipo, p_categoria, p_frio, p_kg, p_m3, v_uid) RETURNING id INTO v_mer;
  INSERT INTO public.vt_anuncio (
    user_id, tipo_anuncio, mercadoria_id, origem_id, destino_id,
    data_disponivel_inicio, data_disponivel_fim, valor_sugerido, status, distancia_km
  ) VALUES (
    v_uid, 'C', v_mer,
    pg_temp.demo_loc(v_uid, p_oc, p_ouf, p_olat, p_olng),
    pg_temp.demo_loc(v_uid, p_dc, p_duf, p_dlat, p_dlng),
    current_date + p_ini, current_date + p_fim, p_valor, 'ATIVO', p_km
  ) RETURNING id INTO v_id;
  RETURN v_id;
END $f$;

-- Limpa a rodada anterior (só dos 4 usuários de demonstração; eventos caem em cascata).
CREATE TEMP TABLE demo_usuarios ON COMMIT DROP AS
  SELECT pg_temp.demo_uid(n) AS user_id
  FROM unnest(ARRAY['Transportes Cerrado (fictícia)','José Ferreira (fictício)',
                    'Agro Planalto (fictícia)','Atacadão Litoral (fictícia)']) AS n;
DELETE FROM public.vt_anuncio     WHERE user_id IN (SELECT user_id FROM demo_usuarios);
DELETE FROM public.vt_mercadoria  WHERE user_id IN (SELECT user_id FROM demo_usuarios);
DELETE FROM public.vt_localizacao WHERE user_id IN (SELECT user_id FROM demo_usuarios);
DELETE FROM public.vt_veiculo     WHERE user_id IN (SELECT user_id FROM demo_usuarios);

-- ===== Caminhões =====================================================================
-- V5 · ida: Truck baú 14 t / 45 m³ · Goiânia → Uberlândia (BR-153 / BR-452) · D+2 a D+5
SELECT pg_temp.demo_veiculo('Transportes Cerrado (fictícia)', 'DEM5A01', 'Truck', 'Baú', false, 14000, 45,
  'Goiânia', 'GO', -16.6869, -49.2648, 'Uberlândia', 'MG', -18.9186, -48.2772, 2, 5, 2200, 340,
  'LINESTRING(-49.2648 -16.6869, -49.1058 -17.7311, -49.2158 -18.4093, -48.705 -18.5921, -48.2772 -18.9186)');
-- V6 · VOLTA do mesmo caminhão (frete de retorno) · Uberlândia → Goiânia · D+6 a D+10
SELECT pg_temp.demo_veiculo('Transportes Cerrado (fictícia)', 'DEM5A01', 'Truck', 'Baú', false, 14000, 45,
  'Uberlândia', 'MG', -18.9186, -48.2772, 'Goiânia', 'GO', -16.6869, -49.2648, 6, 10, 2200, 340,
  'LINESTRING(-48.2772 -18.9186, -48.705 -18.5921, -49.2158 -18.4093, -49.1058 -17.7311, -49.2648 -16.6869)');
-- V7 · Carreta baú REFRIGERADA 26 t / 80 m³ · Brasília → Ribeirão Preto (BR-050) · D+3 a D+8
SELECT pg_temp.demo_veiculo('Transportes Cerrado (fictícia)', 'DEM5C03', 'Carreta', 'Baú', true, 26000, 80,
  'Brasília', 'DF', -15.7939, -47.8828, 'Ribeirão Preto', 'SP', -21.1775, -47.8103, 3, 8, 4700, 720,
  'LINESTRING(-47.8828 -15.7939, -47.6131 -16.7676, -47.9442 -18.1661, -48.1934 -18.6456, -48.2772 -18.9186, -47.9381 -19.7472, -47.7466 -20.0383, -47.8103 -21.1775)');
-- V8 · ida: Toco baú 6 t / 30 m³ (autônomo) · Recife → Salvador (BR-101) · D+1 a D+4
SELECT pg_temp.demo_veiculo('José Ferreira (fictício)', 'DEM6D04', 'Toco', 'Baú', false, 6000, 30,
  'Recife', 'PE', -8.0476, -34.8770, 'Salvador', 'BA', -12.9777, -38.5016, 1, 4, 5200, 840,
  'LINESTRING(-34.877 -8.0476, -35.5917 -8.6831, -36.0939 -9.7811, -36.8442 -10.2116, -37.126 -10.855, -37.4382 -11.2659, -37.9447 -11.7942, -38.4192 -12.1356, -38.5016 -12.9777)');
-- V9 · VOLTA do mesmo Toco · Salvador → Recife · D+7 a D+10
SELECT pg_temp.demo_veiculo('José Ferreira (fictício)', 'DEM6D04', 'Toco', 'Baú', false, 6000, 30,
  'Salvador', 'BA', -12.9777, -38.5016, 'Recife', 'PE', -8.0476, -34.8770, 7, 10, 5200, 840,
  'LINESTRING(-38.5016 -12.9777, -38.4192 -12.1356, -37.9447 -11.7942, -37.4382 -11.2659, -37.126 -10.855, -36.8442 -10.2116, -36.0939 -9.7811, -35.5917 -8.6831, -34.877 -8.0476)');

-- ===== Cargas · Centro-Oeste (Agro Planalto) ============================================
-- C6 · encaixe perfeito na ida do V5 (mesma origem e destino)
SELECT pg_temp.demo_carga('Agro Planalto (fictícia)', 'Sementes de soja em big bag', 'Sementes', 'Carga seca', false, 10000, 35,
  'Goiânia', 'GO', -16.6869, -49.2648, 'Uberlândia', 'MG', -18.9186, -48.2772, 2, 4, 2300, 340);
-- C5 · pega o caminhão no meio da rota (Itumbiara)
SELECT pg_temp.demo_carga('Agro Planalto (fictícia)', 'Fertilizante ensacado', 'Insumos agrícolas', 'Carga seca', false, 12000, 30,
  'Itumbiara', 'GO', -18.4093, -49.2158, 'Uberlândia', 'MG', -18.9186, -48.2772, 3, 6, 900, 130);
-- C19 · desvio moderado (Goiatuba, ~20 km da rota)
SELECT pg_temp.demo_carga('Agro Planalto (fictícia)', 'Embalagens plásticas', 'Embalagens', 'Carga seca', false, 6000, 30,
  'Goiatuba', 'GO', -18.0125, -49.3547, 'Uberlândia', 'MG', -18.9186, -48.2772, 4, 7, 1000, 190);
-- C20 · CONTROLE: longe da rota (Caldas Novas, ~50 km) → não deve aparecer
SELECT pg_temp.demo_carga('Agro Planalto (fictícia)', 'Água mineral em fardos', 'Bebidas', 'Carga seca', false, 12000, 25,
  'Caldas Novas', 'GO', -17.7441, -48.6252, 'Uberlândia', 'MG', -18.9186, -48.2772, 3, 6, 1100, 200);
-- C7 · CONTROLE: granel exige graneleiro → não aparece para baú
SELECT pg_temp.demo_carga('Agro Planalto (fictícia)', 'Milho a granel', 'Grãos', 'Granel sólido', false, 13000, 20,
  'Goiânia', 'GO', -16.6869, -49.2648, 'Uberlândia', 'MG', -18.9186, -48.2772, 2, 5, 2100, 340);
-- C14 · CONTROLE: 28 t não cabe no Truck de 14 t
SELECT pg_temp.demo_carga('Agro Planalto (fictícia)', 'Bobinas de aço', 'Siderurgia', 'Carga seca', false, 28000, 40,
  'Goiânia', 'GO', -16.6869, -49.2648, 'Uberlândia', 'MG', -18.9186, -48.2772, 2, 6, 3900, 340);
-- C10 · FRETE DE RETORNO: encaixe perfeito na volta do V6
SELECT pg_temp.demo_carga('Agro Planalto (fictícia)', 'Leite UHT em paletes', 'Laticínios', 'Carga seca', false, 12000, 40,
  'Uberlândia', 'MG', -18.9186, -48.2772, 'Goiânia', 'GO', -16.6869, -49.2648, 6, 10, 2100, 340);
-- C11 · volta, trecho parcial; CONTROLE de sentido para a ida (V5)
SELECT pg_temp.demo_carga('Agro Planalto (fictícia)', 'Ração animal ensacada', 'Ração', 'Carga seca', false, 9000, 25,
  'Itumbiara', 'GO', -18.4093, -49.2158, 'Goiânia', 'GO', -16.6869, -49.2648, 7, 9, 1000, 205);
-- C9 · refrigerada: só a carreta refrigerada (V7) serve
SELECT pg_temp.demo_carga('Agro Planalto (fictícia)', 'Frango congelado', 'Alimentos', 'Refrigerada', true, 20000, 60,
  'Catalão', 'GO', -18.1661, -47.9442, 'Uberaba', 'MG', -19.7472, -47.9381, 4, 7, 1500, 230);
-- C8 · trecho final da rota do V7
SELECT pg_temp.demo_carga('Agro Planalto (fictícia)', 'Peças agrícolas', 'Máquinas (peças)', 'Carga seca', false, 15000, 40,
  'Uberaba', 'MG', -19.7472, -47.9381, 'Ribeirão Preto', 'SP', -21.1775, -47.8103, 5, 8, 1200, 180);

-- ===== Cargas · Nordeste (Atacadão Litoral) =============================================
-- C15 · ida do Toco, trecho Recife → Aracaju (~10 km da BR-101)
SELECT pg_temp.demo_carga('Atacadão Litoral (fictícia)', 'Bebidas em fardos', 'Bebidas', 'Carga seca', false, 5000, 20,
  'Recife', 'PE', -8.0476, -34.8770, 'Aracaju', 'SE', -10.9472, -37.0731, 1, 3, 2100, 500);
-- C16 · CONTROLE: Garanhuns fica fora da BR-101 → não aparece
SELECT pg_temp.demo_carga('Atacadão Litoral (fictícia)', 'Cosméticos', 'Higiene e beleza', 'Carga seca', false, 3000, 12,
  'Recife', 'PE', -8.0476, -34.8770, 'Garanhuns', 'PE', -8.8903, -36.4966, 1, 3, 900, 230);
-- C17 · FRETE DE RETORNO do Toco (V9)
SELECT pg_temp.demo_carga('Atacadão Litoral (fictícia)', 'Calçados em caixas', 'Calçados', 'Carga seca', false, 4000, 18,
  'Alagoinhas', 'BA', -12.1356, -38.4192, 'Recife', 'PE', -8.0476, -34.8770, 7, 9, 2600, 720);
-- C18 · CONTROLE de data: só em D+20 (fora da janela da volta, D+7 a D+10)
SELECT pg_temp.demo_carga('Atacadão Litoral (fictícia)', 'Material de construção', 'Construção', 'Carga seca', false, 5500, 25,
  'Aracaju', 'SE', -10.9472, -37.0731, 'Recife', 'PE', -8.0476, -34.8770, 20, 25, 2000, 500);

SELECT
  count(*) FILTER (WHERE tipo_anuncio = 'V') AS veiculos,
  count(*) FILTER (WHERE tipo_anuncio = 'C') AS cargas,
  count(*) FILTER (WHERE tipo_anuncio = 'V' AND rota IS NULL) AS veiculos_sem_rota
FROM public.vt_anuncio WHERE user_id IN (SELECT user_id FROM demo_usuarios);

COMMIT;


-- -------------------------------------------------------------------------------------
-- BLOCO 3 — Conferir o Match automaticamente (só leitura; não grava nada)
-- Simula um usuário logado qualquer (que não é dono de nenhum anúncio) e roda 11 buscas.
-- As buscas de carga mandam a rota já codificada (polyline), então NÃO dependem do Google.
-- Requer a migração M3 (Match v3: selo de frete de retorno e "perto de mim").
-- Pronto quando: a coluna "ok" = true nas 11 linhas. Só considera anúncios de U5 a U8.
-- -------------------------------------------------------------------------------------
WITH sessao AS MATERIALIZED (
  SELECT set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-00000000d3e0","role":"authenticated"}', true) AS s
),
demo AS (
  SELECT user_id FROM public.vt_usuario
  WHERE nome IN ('Transportes Cerrado (fictícia)','José Ferreira (fictício)',
                 'Agro Planalto (fictícia)','Atacadão Litoral (fictícia)')
),
casos (ordem, teste, tipo, p, esperado) AS (VALUES
  (1, 'Ida Goiânia→Uberlândia (rota)', 'carga', jsonb_build_object(
      'tipo_carroceria','Baú','refrigerado',false,'capacidade_kg',14000,'capacidade_m3',45,
      'origem_cidade','Goiânia','origem_uf','GO','destino_cidade','Uberlândia','destino_uf','MG',
      'data_inicio',current_date+2,'data_fim',current_date+5,
      'polyline','bdzdB~_ukHf}jEw`^vmcCnnTnub@owbBrw~@wprA'),
    ARRAY['Sementes de soja em big bag','Fertilizante ensacado','Embalagens plásticas']),
  (2, 'Volta Uberlândia→Goiânia (rota)', 'carga', jsonb_build_object(
      'tipo_carroceria','Baú','refrigerado',false,'capacidade_kg',14000,'capacidade_m3',45,
      'origem_cidade','Uberlândia','origem_uf','MG','destino_cidade','Goiânia','destino_uf','GO',
      'data_inicio',current_date+6,'data_fim',current_date+10,
      'polyline','f`nrBncteHsw~@vprAoub@nwbBwmcConTg}jEv`^'),
    ARRAY['Leite UHT em paletes','Ração animal ensacada']),
  (3, 'Carreta refrigerada Brasília→Ribeirão Preto', 'carga', jsonb_build_object(
      'tipo_carroceria','Baú','refrigerado',true,'capacidade_kg',26000,'capacidade_m3',80,
      'origem_cidade','Brasília','origem_uf','DF','destino_cidade','Ribeirão Preto','destino_uf','SP',
      'data_inicio',current_date+3,'data_fim',current_date+8,
      'polyline','zvk_BnbgcHrd}Dsts@rcpGjt_Azs|Anto@fit@vjOvy`DkfaAjzw@{kd@~n}EbmK'),
    ARRAY['Frango congelado','Peças agrícolas']),
  (4, 'Toco Recife→Salvador (rota)', 'carga', jsonb_build_object(
      'tipo_carroceria','Baú','refrigerado',false,'capacidade_kg',6000,'capacidade_m3',30,
      'origem_cidade','Recife','origem_uf','PE','destino_cidade','Salvador','destino_uf','BA',
      'data_inicio',current_date+1,'data_fim',current_date+4,
      'polyline','nxbp@f|zsEzb{BzqjCnmuEvaaBrasAjpqCft|Bf`v@bgoAf~{@zdfBr|aBvtaArt{AbncD~aO'),
    ARRAY['Bebidas em fardos']),
  (5, 'Volta Salvador→Recife (rota)', 'carga', jsonb_build_object(
      'tipo_carroceria','Baú','refrigerado',false,'capacidade_kg',6000,'capacidade_m3',30,
      'origem_cidade','Salvador','origem_uf','BA','destino_cidade','Recife','destino_uf','PE',
      'data_inicio',current_date+7,'data_fim',current_date+10,
      'polyline','ruenA~y~iFcncD_bOwtaAst{A{dfBs|aBcgoAg~{@gt|Bg`v@sasAkpqComuEwaaB{b{B{qjC'),
    ARRAY['Calçados em caixas']),
  (6, 'Ida Goiânia→Uberlândia SEM Google (cidade)', 'carga', jsonb_build_object(
      'tipo_carroceria','Baú','refrigerado',false,'capacidade_kg',14000,'capacidade_m3',45,
      'origem_cidade','Goiânia','origem_uf','GO','destino_cidade','Uberlândia','destino_uf','MG',
      'data_inicio',current_date+2,'data_fim',current_date+5),
    ARRAY['Sementes de soja em big bag']),
  (7, 'Empresa: ração Itumbiara→Goiânia', 'veiculo', jsonb_build_object(
      'categoria_carga','Carga seca','exige_refrigeracao',false,'peso_kg',9000,'volume_m3',25,
      'origem_cidade','Itumbiara','origem_uf','GO','destino_cidade','Goiânia','destino_uf','GO',
      'data_inicio',current_date+7,'data_fim',current_date+9,
      'origem_lat',-18.4093,'origem_lng',-49.2158,'destino_lat',-16.6869,'destino_lng',-49.2648),
    ARRAY['DEM5A01 Uberlândia→Goiânia (retorno)']),
  (8, 'Empresa: frango Catalão→Uberaba (frio)', 'veiculo', jsonb_build_object(
      'categoria_carga','Refrigerada','exige_refrigeracao',true,'peso_kg',20000,'volume_m3',60,
      'origem_cidade','Catalão','origem_uf','GO','destino_cidade','Uberaba','destino_uf','MG',
      'data_inicio',current_date+4,'data_fim',current_date+7,
      'origem_lat',-18.1661,'origem_lng',-47.9442,'destino_lat',-19.7472,'destino_lng',-47.9381),
    ARRAY['DEM5C03 Brasília→Ribeirão Preto']),
  (9, 'Empresa: Recife→Garanhuns (fora da rota)', 'veiculo', jsonb_build_object(
      'categoria_carga','Carga seca','exige_refrigeracao',false,'peso_kg',3000,'volume_m3',12,
      'origem_cidade','Recife','origem_uf','PE','destino_cidade','Garanhuns','destino_uf','PE',
      'data_inicio',current_date+1,'data_fim',current_date+3,
      'origem_lat',-8.0476,'origem_lng',-34.8770,'destino_lat',-8.8903,'destino_lng',-36.4966),
    ARRAY[]::text[]),
  (10, 'Empresa: calçados Alagoinhas→Recife', 'veiculo', jsonb_build_object(
      'categoria_carga','Carga seca','exige_refrigeracao',false,'peso_kg',4000,'volume_m3',18,
      'origem_cidade','Alagoinhas','origem_uf','BA','destino_cidade','Recife','destino_uf','PE',
      'data_inicio',current_date+7,'data_fim',current_date+9,
      'origem_lat',-12.1356,'origem_lng',-38.4192,'destino_lat',-8.0476,'destino_lng',-34.8770),
    ARRAY['DEM6D04 Salvador→Recife (retorno)']),
  (11, 'Perto de mim: em Goiânia, raio de 50 km', 'carga', jsonb_build_object(
      'tipo_carroceria','Baú','refrigerado',false,'capacidade_kg',14000,'capacidade_m3',45,
      'perto_lat',-16.6869,'perto_lng',-49.2648,'perto_km',50),
    ARRAY['Sementes de soja em big bag'])
),
resultado AS (
  SELECT c.ordem, c.teste, c.esperado,
    CASE c.tipo
      WHEN 'carga' THEN (
        SELECT coalesce(array_agg(r.descricao_mercadoria ORDER BY r.score DESC, r.data_inicio), ARRAY[]::text[])
        FROM public.vt_match_cargas(c.p || jsonb_build_object('_sessao', s.s)) r
        JOIN public.vt_anuncio a ON a.id = r.anuncio_id
        WHERE a.user_id IN (SELECT user_id FROM demo))
      ELSE (
        SELECT coalesce(array_agg(v.placa || ' ' || r.origem_cidade || '→' || r.destino_cidade
                                  || CASE WHEN r.frete_retorno THEN ' (retorno)' ELSE '' END
                                  ORDER BY r.score DESC, r.data_inicio), ARRAY[]::text[])
        FROM public.vt_match_veiculos(c.p || jsonb_build_object('_sessao', s.s)) r
        JOIN public.vt_anuncio a ON a.id = r.anuncio_id
        JOIN public.vt_veiculo v ON v.id = a.veiculo_id
        WHERE a.user_id IN (SELECT user_id FROM demo))
    END AS obtido,
    CASE c.tipo
      WHEN 'carga' THEN (
        SELECT string_agg(r.score::text || ' (' || array_to_string(r.motivos, '; ') || ')', ' | ' ORDER BY r.score DESC)
        FROM public.vt_match_cargas(c.p || jsonb_build_object('_sessao', s.s)) r
        JOIN public.vt_anuncio a ON a.id = r.anuncio_id
        WHERE a.user_id IN (SELECT user_id FROM demo))
      ELSE (
        SELECT string_agg(r.score::text || ' (' || array_to_string(r.motivos, '; ') || ')', ' | ' ORDER BY r.score DESC)
        FROM public.vt_match_veiculos(c.p || jsonb_build_object('_sessao', s.s)) r
        JOIN public.vt_anuncio a ON a.id = r.anuncio_id
        WHERE a.user_id IN (SELECT user_id FROM demo))
    END AS scores_e_motivos
  FROM casos c CROSS JOIN sessao s
)
SELECT ordem, teste, obtido = esperado AS ok, esperado, obtido, scores_e_motivos
FROM resultado
ORDER BY ordem;


-- -------------------------------------------------------------------------------------
-- BLOCO 4 — Desfazer tudo (apaga U5 a U8 e, em cascata, os anúncios, veículos e eventos deles)
-- Só rode se quiser remover os dados de demonstração deste arquivo.
-- -------------------------------------------------------------------------------------
-- DELETE FROM auth.users
-- WHERE email IN ('demo-u5@veb-demo.invalid','demo-u6@veb-demo.invalid',
--                 'demo-u7@veb-demo.invalid','demo-u8@veb-demo.invalid');
