-- =====================================================================================
-- 05 — Importar os municípios do IBGE (autocompletar cidade e coordenadas sem Google)
-- Rode DEPOIS da migração M3 (20261029120000_m3_match_v3.sql). Primeiro no DEV.
-- =====================================================================================
-- Fonte sugerida: arquivo municipios.csv do projeto aberto "municipios-brasileiros" (kelvins),
-- que reúne os 5.570 municípios com código IBGE, latitude e longitude.
-- Cabeçalho esperado: codigo_ibge,nome,latitude,longitude,capital,codigo_uf,siafi_id,ddd,fuso_horario
--
-- Passo a passo:
-- 1. Baixe o municipios.csv no navegador (pasta "csv" do projeto).
-- 2. Supabase → Table Editor → tabela vt_municipio → Insert → "Import data from CSV" → selecione o arquivo.
--    As colunas têm os mesmos nomes do cabeçalho. Confirme a importação.
--    Se o cabeçalho do arquivo for diferente, ajuste os nomes no próprio CSV antes de importar.
-- 3. Rode os blocos abaixo, um de cada vez.
-- =====================================================================================

-- BLOCO A — Conferir a importação (só leitura)
-- Pronto quando: municipios = 5570 (ou muito perto), ufs_sem_municipio = 0 e o teste mostra "São José dos Campos / SP".
SELECT
  (SELECT count(*) FROM public.vt_municipio) AS municipios,
  (SELECT count(*) FROM public.vt_uf u WHERE NOT EXISTS (SELECT 1 FROM public.vt_municipio m WHERE m.codigo_uf = u.codigo_uf)) AS ufs_sem_municipio,
  (SELECT string_agg(nome || ' / ' || uf, ', ') FROM public.vt_buscar_municipios('sao jose dos c')) AS teste_autocompletar;

-- BLOCO B — Completar as coordenadas de localizações antigas que ficaram sem latitude/longitude
-- (anúncios criados quando o Google não respondeu). Mostra quantas foram completadas.
WITH alvo AS (
  SELECT l.id, m.latitude, m.longitude
  FROM public.vt_localizacao l
  JOIN public.vt_uf u ON u.uf = upper(trim(l.estado))
  JOIN public.vt_municipio m ON m.codigo_uf = u.codigo_uf AND public.vt_norm(m.nome) = public.vt_norm(l.cidade)
  WHERE l.latitude IS NULL OR l.longitude IS NULL
)
UPDATE public.vt_localizacao l
SET latitude = a.latitude, longitude = a.longitude
FROM alvo a
WHERE l.id = a.id
RETURNING l.cidade, l.estado;

-- BLOCO C — O que ainda ficou sem coordenada (cidade escrita errado, por exemplo). Só leitura.
SELECT l.cidade, l.estado, count(*) AS vezes
FROM public.vt_localizacao l
WHERE l.latitude IS NULL OR l.longitude IS NULL
GROUP BY 1, 2
ORDER BY 3 DESC;
