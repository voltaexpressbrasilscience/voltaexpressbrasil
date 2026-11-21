-- Diagnóstico do banco — Volta Express (SOMENTE LEITURA: não altera nada)
-- Rode no SQL Editor do projeto dev e depois no de produção.
-- O SQL Editor mostra só o resultado do ÚLTIMO comando: selecione um bloco por vez e clique em Run.
-- Nenhum bloco devolve dado pessoal: só nomes de objetos e contagens.

-- 1. Extensões necessárias (esperado: postgis, unaccent, pg_cron, pg_net)
SELECT extname, extversion FROM pg_extension
WHERE extname IN ('postgis', 'unaccent', 'pg_cron', 'pg_net')
ORDER BY extname;

-- 2. Funções da plataforma (esperado após as migrações 1–10: as 9 abaixo)
SELECT p.proname AS funcao,
       CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END AS seguranca
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('handle_new_user', 'expire_anuncios', 'vt_norm', 'vt_criar_anuncio',
                    'vt_match_cargas', 'vt_match_veiculos', 'vt_registrar_interesse',
                    'vt_meu_painel', 'vt_anunciantes',
                    -- novas da v3 (migrações 11 e 12):
                    'vt_encerrar_anuncio',
                    -- novas do Match v3 (migração M3):
                    'vt_raio_km', 'vt_raio_teto', 'vt_buscar_municipios', 'vt_rota_anuncio',
                    'vt_localizacao_coordenadas_ibge')
ORDER BY 1;

-- 3. Tabelas e colunas que indicam cada migração
SELECT 'M2: vt_anuncio.rota'            AS marcador, EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vt_anuncio'    AND column_name='rota')               AS aplicado
UNION ALL SELECT 'M2: vt_compatibilidade',  EXISTS (SELECT 1 FROM information_schema.tables  WHERE table_schema='public' AND table_name='vt_compatibilidade')
UNION ALL SELECT 'M2: vt_match_config',     EXISTS (SELECT 1 FROM information_schema.tables  WHERE table_schema='public' AND table_name='vt_match_config')
UNION ALL SELECT 'M2: vt_match_evento',     EXISTS (SELECT 1 FROM information_schema.tables  WHERE table_schema='public' AND table_name='vt_match_evento')
UNION ALL SELECT 'M11: vt_usuario.cnpj',    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vt_usuario'    AND column_name='cnpj')
UNION ALL SELECT 'M11: aceite_privacidade', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vt_usuario'    AND column_name='aceite_privacidade_em')
UNION ALL SELECT 'M12: evento fechado',     EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vt_match_evento_tipo_check' AND pg_get_constraintdef(oid) LIKE '%fechado%')
UNION ALL SELECT 'M3: vt_localizacao.ponto', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vt_localizacao' AND column_name='ponto')
UNION ALL SELECT 'M3: vt_municipio',         EXISTS (SELECT 1 FROM information_schema.tables  WHERE table_schema='public' AND table_name='vt_municipio')
UNION ALL SELECT 'M3: vt_rota_cache',        EXISTS (SELECT 1 FROM information_schema.tables  WHERE table_schema='public' AND table_name='vt_rota_cache')
UNION ALL SELECT 'M3: pesos v3',             EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vt_match_config' AND column_name='versao_pesos')
-- novas da v3.2 (migrações 20261109120000 e 20261110120000):
UNION ALL SELECT 'V3.2: peso e volume no banco', EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname='public' AND p.proname='vt_criar_anuncio' AND p.prosrc LIKE '%Informe o peso%')
UNION ALL SELECT 'V3.2: aceite dos Termos',      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vt_usuario'    AND column_name='aceite_termos_em')
UNION ALL SELECT 'V3.2: cadastro grava Termos',  EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname='public' AND p.proname='handle_new_user' AND p.prosrc LIKE '%versao_termos%');

-- 4. P1: visitante não pode ler vt_usuario (esperado: nenhuma política com "Public can view")
SELECT policyname, cmd, roles FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'vt_usuario' ORDER BY 1;

-- 5. Agendamento da expiração (esperado: vt-expira-anuncios, '5 3 * * *')
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'vt-expira-anuncios';

-- 6. Volume de dados (só contagens)
SELECT
  (SELECT count(*) FROM public.vt_usuario)                                   AS usuarios,
  (SELECT count(*) FROM public.vt_usuario WHERE tipo_usuario = 'C')          AS tenho_caminhao,
  (SELECT count(*) FROM public.vt_usuario WHERE tipo_usuario = 'E')          AS tenho_carga,
  (SELECT count(*) FROM public.vt_usuario WHERE length(regexp_replace(documento, '\D', '', 'g')) = 14) AS documento_com_14_digitos_cnpj,
  (SELECT count(*) FROM public.vt_anuncio WHERE status = 'ATIVO')            AS anuncios_ativos,
  (SELECT count(*) FROM public.vt_anuncio WHERE status = 'ATIVO' AND rota IS NOT NULL) AS ativos_com_rota;

-- 7. Tipos de veículo e carroceria já usados (para conferir a lista da tela)
SELECT 'veiculo' AS campo, tipo_veiculo AS valor, count(*) FROM public.vt_veiculo GROUP BY 2
UNION ALL
SELECT 'carroceria', tipo_carroceria, count(*) FROM public.vt_carroceria GROUP BY 2
ORDER BY 1, 3 DESC;
