-- M3 — Match v3: precisão, honestidade dos motivos e geolocalização
-- Especificação: docs/MATCH.md (seção "Match v3") e docs/MATCH-PONTUACAO-V3.md
-- 1. Configuração nova (raio proporcional, fator de estrada, nota do modo cidade, bônus de retorno) e pesos v3.
-- 2. Base de municípios do IBGE (vt_uf, vt_municipio) + busca para autocompletar (vt_buscar_municipios).
-- 3. vt_localizacao.ponto (coluna calculada + índice) e preenchimento de coordenadas pelo IBGE quando faltam.
-- 4. Valor de referência por tipo de veículo (vt_valor_referencia; vazio = usa vt_match_config.valor_ref_km).
-- 5. Cache de rotas do Google (vt_rota_cache; só a Edge Function, com service role, lê e grava).
-- 6. vt_match_cargas e vt_match_veiculos v3: pré-filtro por índice, raio proporcional, desvio estimado na estrada,
--    "coleta no km X", modo "perto de mim", selo e bônus de frete de retorno, coordenadas para o mapa.
-- 7. vt_rota_anuncio: devolve a rota gravada (polyline) para o mapa desenhar sem chamar o Google.
-- Idempotente: pode ser executada mais de uma vez.

-- =====================================================================================
-- 1. Configuração
-- =====================================================================================
ALTER TABLE public.vt_match_config
  ADD COLUMN IF NOT EXISTS raio_min_km NUMERIC NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS raio_max_km NUMERIC NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS raio_pct NUMERIC NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS fator_estrada NUMERIC NOT NULL DEFAULT 1.3,
  ADD COLUMN IF NOT EXISTS nota_modo_cidade NUMERIC NOT NULL DEFAULT 0.7,
  ADD COLUMN IF NOT EXISTS bonus_retorno NUMERIC NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS perto_km_padrao NUMERIC NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS versao_pesos TEXT NOT NULL DEFAULT 'v2';

COMMENT ON COLUMN public.vt_match_config.raio_km IS 'Raio fixo (km). Usado só quando raio_pct = 0.';
COMMENT ON COLUMN public.vt_match_config.raio_pct IS 'Raio proporcional: % do comprimento da rota, entre raio_min_km e raio_max_km. 0 = usa raio_km fixo.';
COMMENT ON COLUMN public.vt_match_config.fator_estrada IS 'Estrada ÷ linha reta. Desvio na estrada ≈ 2 × fator × (distância da coleta + da entrega até a rota).';
COMMENT ON COLUMN public.vt_match_config.nota_modo_cidade IS 'Nota (0–1) de desvio e aproveitamento quando não há rota calculada (modo cidade).';
COMMENT ON COLUMN public.vt_match_config.bonus_retorno IS 'Pontos somados (até 100) quando o caminhão está voltando de uma viagem anunciada.';

-- Pesos v3: aproveitamento 20 → 15 e valor 10 → 15 (carga curta e bem paga deixa de ser punida).
-- Só muda se os pesos ainda forem os padrões da v2 (não sobrescreve um ajuste feito à mão).
UPDATE public.vt_match_config
SET peso_aproveitamento = 15, peso_valor = 15, versao_pesos = 'v3'
WHERE id = 1 AND versao_pesos = 'v2'
  AND peso_desvio = 35 AND peso_aproveitamento = 20 AND peso_data = 15
  AND peso_capacidade = 15 AND peso_valor = 10 AND peso_anunciante = 5;

-- Raio da busca para uma rota de "km" quilômetros.
CREATE OR REPLACE FUNCTION public.vt_raio_km(km NUMERIC)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN c.raio_pct > 0 AND km IS NOT NULL AND km > 0
      THEN least(c.raio_max_km, greatest(c.raio_min_km, km * c.raio_pct / 100))
    ELSE c.raio_km
  END
  FROM vt_match_config c WHERE c.id = 1;
$$;

-- Maior raio possível (limite do pré-filtro por índice).
CREATE OR REPLACE FUNCTION public.vt_raio_teto()
RETURNS NUMERIC
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE WHEN c.raio_pct > 0 THEN greatest(c.raio_max_km, c.raio_min_km) ELSE c.raio_km END
  FROM vt_match_config c WHERE c.id = 1;
$$;

-- =====================================================================================
-- 2. Municípios do IBGE
-- Importação: docs/sql/05-importar-municipios.sql (CSV pelo Table Editor do Supabase).
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.vt_uf (
  codigo_uf SMALLINT PRIMARY KEY,
  uf CHAR(2) NOT NULL UNIQUE,
  nome TEXT NOT NULL
);
ALTER TABLE public.vt_uf ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read uf" ON public.vt_uf;
CREATE POLICY "Anyone can read uf" ON public.vt_uf FOR SELECT USING (true);

INSERT INTO public.vt_uf (codigo_uf, uf, nome) VALUES
  (11,'RO','Rondônia'),(12,'AC','Acre'),(13,'AM','Amazonas'),(14,'RR','Roraima'),(15,'PA','Pará'),
  (16,'AP','Amapá'),(17,'TO','Tocantins'),(21,'MA','Maranhão'),(22,'PI','Piauí'),(23,'CE','Ceará'),
  (24,'RN','Rio Grande do Norte'),(25,'PB','Paraíba'),(26,'PE','Pernambuco'),(27,'AL','Alagoas'),
  (28,'SE','Sergipe'),(29,'BA','Bahia'),(31,'MG','Minas Gerais'),(32,'ES','Espírito Santo'),
  (33,'RJ','Rio de Janeiro'),(35,'SP','São Paulo'),(41,'PR','Paraná'),(42,'SC','Santa Catarina'),
  (43,'RS','Rio Grande do Sul'),(50,'MS','Mato Grosso do Sul'),(51,'MT','Mato Grosso'),
  (52,'GO','Goiás'),(53,'DF','Distrito Federal')
ON CONFLICT (codigo_uf) DO NOTHING;

-- Mesmas colunas do arquivo municipios.csv (código IBGE, nome, latitude, longitude, capital, código da UF, ...).
CREATE TABLE IF NOT EXISTS public.vt_municipio (
  codigo_ibge INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  latitude NUMERIC(9,6) NOT NULL,
  longitude NUMERIC(9,6) NOT NULL,
  capital SMALLINT NOT NULL DEFAULT 0,
  codigo_uf SMALLINT NOT NULL REFERENCES public.vt_uf(codigo_uf),
  siafi_id TEXT,
  ddd SMALLINT,
  fuso_horario TEXT
);
ALTER TABLE public.vt_municipio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read municipios" ON public.vt_municipio;
CREATE POLICY "Anyone can read municipios" ON public.vt_municipio FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS idx_vt_municipio_uf ON public.vt_municipio (codigo_uf);

-- Autocompletar: começa com o texto digitado (sem acento/maiúscula); depois, contém. Capitais primeiro.
CREATE OR REPLACE FUNCTION public.vt_buscar_municipios(q TEXT, p_uf TEXT DEFAULT NULL, p_limite INTEGER DEFAULT 8)
RETURNS TABLE (codigo_ibge INTEGER, nome TEXT, uf TEXT, latitude NUMERIC, longitude NUMERIC)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  WITH t AS (SELECT vt_norm(q) AS q, upper(trim(coalesce(p_uf, ''))) AS uf)
  SELECT m.codigo_ibge, m.nome, u.uf::text, m.latitude, m.longitude
  FROM vt_municipio m
  JOIN vt_uf u ON u.codigo_uf = m.codigo_uf, t
  WHERE length(t.q) >= 2
    AND (t.uf = '' OR u.uf = t.uf)
    AND vt_norm(m.nome) LIKE '%' || t.q || '%'
  ORDER BY (vt_norm(m.nome) LIKE t.q || '%') DESC, m.capital DESC, length(m.nome), m.nome
  LIMIT least(greatest(coalesce(p_limite, 8), 1), 20);
$$;
REVOKE ALL ON FUNCTION public.vt_buscar_municipios(TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vt_buscar_municipios(TEXT, TEXT, INTEGER) TO anon, authenticated;

-- =====================================================================================
-- 3. Ponto pronto e indexado + coordenadas pelo IBGE quando o Google não respondeu
-- =====================================================================================
ALTER TABLE public.vt_localizacao
  ADD COLUMN IF NOT EXISTS ponto extensions.geography(Point, 4326)
  GENERATED ALWAYS AS (
    CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL
      THEN extensions.ST_SetSRID(extensions.ST_MakePoint(longitude::float8, latitude::float8), 4326)::extensions.geography
    END
  ) STORED;
CREATE INDEX IF NOT EXISTS idx_vt_localizacao_ponto ON public.vt_localizacao USING GIST (ponto);

CREATE OR REPLACE FUNCTION public.vt_localizacao_coordenadas_ibge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.latitude IS NULL OR NEW.longitude IS NULL THEN
    SELECT m.latitude, m.longitude INTO NEW.latitude, NEW.longitude
    FROM vt_municipio m JOIN vt_uf u ON u.codigo_uf = m.codigo_uf
    WHERE u.uf = upper(trim(NEW.estado)) AND vt_norm(m.nome) = vt_norm(NEW.cidade)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS vt_localizacao_coordenadas_ibge ON public.vt_localizacao;
CREATE TRIGGER vt_localizacao_coordenadas_ibge
  BEFORE INSERT OR UPDATE OF cidade, estado, latitude, longitude ON public.vt_localizacao
  FOR EACH ROW EXECUTE FUNCTION public.vt_localizacao_coordenadas_ibge();

-- =====================================================================================
-- 4. Valor de referência por tipo de veículo (preencha com a calculadora oficial da ANTT)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.vt_valor_referencia (
  tipo_veiculo VARCHAR(50) PRIMARY KEY,
  valor_ref_km NUMERIC CHECK (valor_ref_km IS NULL OR valor_ref_km > 0),
  fonte TEXT,
  atualizado_em DATE
);
ALTER TABLE public.vt_valor_referencia ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read valor referencia" ON public.vt_valor_referencia;
CREATE POLICY "Anyone can read valor referencia" ON public.vt_valor_referencia FOR SELECT USING (true);
INSERT INTO public.vt_valor_referencia (tipo_veiculo) VALUES
  ('VUC'), ('3/4'), ('Toco'), ('Truck'), ('Bitruck'), ('Carreta'), ('Carreta estendida')
ON CONFLICT (tipo_veiculo) DO NOTHING;
COMMENT ON TABLE public.vt_valor_referencia IS 'R$/km de referência por tipo de veículo. Vazio = usa vt_match_config.valor_ref_km. Fonte sugerida: calculadora do piso mínimo da ANTT.';

-- =====================================================================================
-- 5. Cache de rotas (Edge Function route-distance)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.vt_rota_cache (
  chave TEXT PRIMARY KEY,
  distancia_km NUMERIC(10,1) NOT NULL,
  duracao_texto TEXT,
  polyline TEXT NOT NULL,
  origem_lat NUMERIC(9,6) NOT NULL,
  origem_lng NUMERIC(9,6) NOT NULL,
  destino_lat NUMERIC(9,6) NOT NULL,
  destino_lng NUMERIC(9,6) NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Sem políticas: ninguém lê pela API pública; só a Edge Function (service role).
ALTER TABLE public.vt_rota_cache ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- 6a. Match motorista → cargas (v3)
-- =====================================================================================
DROP FUNCTION IF EXISTS public.vt_match_cargas(JSONB);
CREATE FUNCTION public.vt_match_cargas(p JSONB)
RETURNS TABLE (
  anuncio_id UUID,
  score INTEGER,
  motivos TEXT[],
  desvio_km NUMERIC,
  origem_cidade TEXT,
  origem_estado TEXT,
  destino_cidade TEXT,
  destino_estado TEXT,
  descricao_mercadoria TEXT,
  categoria_carga TEXT,
  exige_refrigeracao BOOLEAN,
  peso_kg NUMERIC,
  volume_m3 NUMERIC,
  valor_sugerido NUMERIC,
  data_inicio DATE,
  data_fim DATE,
  nome_usuario TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ,
  modo TEXT,
  raio_km NUMERIC,
  km_coleta NUMERIC,
  desvio_estrada_km NUMERIC,
  origem_lat NUMERIC,
  origem_lng NUMERIC,
  destino_lat NUMERIC,
  destino_lng NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  WITH cfg AS (
    SELECT * FROM vt_match_config WHERE id = 1
  ),
  entrada AS (
    SELECT
      nullif(p->>'tipo_carroceria', '') AS carroceria,
      coalesce((p->>'refrigerado')::boolean, false) AS refrigerado,
      (p->>'capacidade_kg')::numeric AS cap_kg,
      (p->>'capacidade_m3')::numeric AS cap_m3,
      nullif(p->>'tipo_veiculo', '') AS tipo_veiculo,
      vt_norm(p->>'origem_cidade') AS o_cid,
      upper(trim(coalesce(p->>'origem_uf', ''))) AS o_uf,
      vt_norm(p->>'destino_cidade') AS d_cid,
      upper(trim(coalesce(p->>'destino_uf', ''))) AS d_uf,
      coalesce((p->>'data_inicio')::date, current_date) AS j_ini,
      coalesce((p->>'data_fim')::date, current_date + (SELECT janela_dias FROM cfg)) AS j_fim,
      CASE WHEN coalesce(p->>'polyline', '') <> ''
        THEN ST_LineFromEncodedPolyline(p->>'polyline') END AS rota,
      CASE WHEN coalesce(p->>'perto_lat', '') <> '' AND coalesce(p->>'perto_lng', '') <> ''
        THEN ST_SetSRID(ST_MakePoint((p->>'perto_lng')::float8, (p->>'perto_lat')::float8), 4326) END AS perto,
      least(greatest(coalesce((p->>'perto_km')::numeric, (SELECT perto_km_padrao FROM cfg)), 5), 300) AS perto_km,
      least(greatest(coalesce((p->>'limite')::int, 20), 1), 50) AS limite,
      greatest(coalesce((p->>'deslocamento')::int, 0), 0) AS deslocamento
  ),
  param AS (
    SELECT
      e.*,
      CASE WHEN e.rota IS NOT NULL THEN ST_Length(e.rota::geography) / 1000 END AS km_busca,
      vt_raio_km(CASE WHEN e.rota IS NOT NULL THEN (ST_Length(e.rota::geography) / 1000)::numeric END) AS raio,
      coalesce(
        (SELECT r.valor_ref_km FROM vt_valor_referencia r WHERE r.tipo_veiculo = e.tipo_veiculo),
        (SELECT valor_ref_km FROM cfg)
      ) AS ref_km
    FROM entrada e
  ),
  base AS (
    SELECT
      a.id, a.valor_sugerido, a.data_disponivel_inicio, a.data_disponivel_fim, a.created_at, a.distancia_km,
      m.descricao, m.categoria_carga, m.exige_refrigeracao, m.peso_kg, m.volume_m3,
      o.cidade AS oc, o.estado AS ouf, d.cidade AS dc, d.estado AS duf,
      o.latitude AS olat, o.longitude AS olng, d.latitude AS dlat, d.longitude AS dlng,
      o.ponto AS op, d.ponto AS dp,
      u.nome, u.foto_url
    FROM param pr
    JOIN vt_anuncio a ON a.tipo_anuncio = 'C'
    JOIN vt_mercadoria m ON m.id = a.mercadoria_id
    JOIN vt_localizacao o ON o.id = a.origem_id
    JOIN vt_localizacao d ON d.id = a.destino_id
    LEFT JOIN vt_usuario u ON u.user_id = a.user_id
    WHERE auth.uid() IS NOT NULL
      AND a.status = 'ATIVO'
      AND a.data_disponivel_fim >= current_date
      AND a.user_id <> auth.uid()
      -- Pré-filtro por índice (idx_vt_localizacao_ponto): só calcula distância do que está perto.
      AND (pr.perto IS NULL OR ST_DWithin(o.ponto, pr.perto::geography, pr.perto_km * 1000))
      AND (pr.perto IS NOT NULL OR pr.rota IS NULL OR o.ponto IS NULL
           OR ST_DWithin(o.ponto, pr.rota::geography, pr.raio * 1000))
  ),
  geo AS (
    SELECT
      b.*,
      pr.*,
      CASE
        WHEN pr.perto IS NOT NULL THEN 'perto'
        WHEN pr.rota IS NOT NULL AND b.op IS NOT NULL AND b.dp IS NOT NULL THEN 'rota'
        WHEN pr.o_cid <> '' AND pr.d_cid <> '' THEN 'cidade'
        WHEN pr.o_cid <> '' OR pr.d_cid <> '' OR pr.o_uf <> '' OR pr.d_uf <> '' THEN 'parcial'
        ELSE 'livre'
      END AS modo_calc,
      CASE WHEN pr.perto IS NOT NULL THEN ST_Distance(b.op, pr.perto::geography) / 1000 END AS dist_perto,
      CASE WHEN pr.rota IS NOT NULL AND b.op IS NOT NULL
        THEN ST_Distance(pr.rota::geography, b.op) / 1000 END AS dist_o,
      CASE WHEN pr.rota IS NOT NULL AND b.dp IS NOT NULL
        THEN ST_Distance(pr.rota::geography, b.dp) / 1000 END AS dist_d,
      CASE WHEN pr.rota IS NOT NULL AND b.op IS NOT NULL
        THEN ST_LineLocatePoint(pr.rota, b.op::geometry) END AS pos_o,
      CASE WHEN pr.rota IS NOT NULL AND b.dp IS NOT NULL
        THEN ST_LineLocatePoint(pr.rota, b.dp::geometry) END AS pos_d,
      coalesce(b.distancia_km,
        CASE WHEN b.op IS NOT NULL AND b.dp IS NOT NULL
          THEN ST_Distance(b.op, b.dp) / 1000 * 1.25 END) AS km_trecho
    FROM base b CROSS JOIN param pr
  ),
  filtrado AS (
    SELECT g.*
    FROM geo g
    WHERE (g.categoria_carga IS NULL OR g.carroceria IS NULL OR EXISTS (
            SELECT 1 FROM vt_compatibilidade k
            WHERE k.categoria_carga = g.categoria_carga AND k.tipo_carroceria = g.carroceria))
      AND (NOT g.exige_refrigeracao OR g.refrigerado)
      AND (g.cap_kg IS NULL OR g.peso_kg IS NULL OR g.peso_kg <= g.cap_kg)
      AND (g.cap_m3 IS NULL OR g.volume_m3 IS NULL OR g.volume_m3 <= g.cap_m3)
      AND g.data_disponivel_inicio <= g.j_fim
      AND g.data_disponivel_fim >= g.j_ini
      AND CASE g.modo_calc
        WHEN 'perto' THEN g.dist_perto <= g.perto_km
        WHEN 'rota' THEN g.dist_o <= g.raio AND g.dist_d <= g.raio AND g.pos_o < g.pos_d
        WHEN 'cidade' THEN vt_norm(g.oc) = g.o_cid AND vt_norm(g.dc) = g.d_cid
                       AND (g.o_uf = '' OR upper(trim(g.ouf)) = g.o_uf)
                       AND (g.d_uf = '' OR upper(trim(g.duf)) = g.d_uf)
        WHEN 'parcial' THEN (g.o_cid = '' OR vt_norm(g.oc) = g.o_cid)
                        AND (g.d_cid = '' OR vt_norm(g.dc) = g.d_cid)
                        AND (g.o_uf = '' OR upper(trim(g.ouf)) = g.o_uf)
                        AND (g.d_uf = '' OR upper(trim(g.duf)) = g.d_uf)
        ELSE true
      END
  ),
  pontuado AS (
    SELECT
      f.*,
      CASE f.modo_calc
        WHEN 'rota' THEN greatest(0, 1 - (f.dist_o + f.dist_d) / (2 * f.raio))
        WHEN 'perto' THEN greatest(0, 1 - f.dist_perto / f.perto_km)
        WHEN 'cidade' THEN c.nota_modo_cidade
        ELSE 0.5
      END AS s_desvio,
      CASE f.modo_calc
        WHEN 'rota' THEN greatest(0, least(1, f.pos_d - f.pos_o))
        WHEN 'cidade' THEN c.nota_modo_cidade
        ELSE 0.5
      END AS s_aprov,
      1 - least(1, greatest(0, f.data_disponivel_inicio - greatest(f.j_ini, current_date))::numeric / c.janela_dias) AS s_data,
      CASE
        WHEN f.cap_kg > 0 AND f.peso_kg IS NOT NULL AND f.cap_m3 > 0 AND f.volume_m3 IS NOT NULL
          THEN least(1, (f.peso_kg / f.cap_kg + f.volume_m3 / f.cap_m3) / 2)
        WHEN f.cap_kg > 0 AND f.peso_kg IS NOT NULL THEN least(1, f.peso_kg / f.cap_kg)
        WHEN f.cap_m3 > 0 AND f.volume_m3 IS NOT NULL THEN least(1, f.volume_m3 / f.cap_m3)
        ELSE 0.5
      END AS s_cap,
      CASE
        WHEN f.valor_sugerido > 0 AND f.km_trecho > 0
          THEN least(1, (f.valor_sugerido / f.km_trecho) / f.ref_km / 1.5)
        ELSE 0.5
      END AS s_valor,
      CASE WHEN f.foto_url IS NOT NULL THEN 1 ELSE 0.6 END AS s_anun,
      CASE WHEN f.modo_calc = 'rota'
        THEN round(2 * c.fator_estrada * (f.dist_o + f.dist_d) / 5) * 5 END AS desvio_estrada,
      CASE WHEN f.modo_calc = 'rota' THEN round(f.pos_o * f.km_busca) END AS km_coleta_calc,
      c.peso_desvio, c.peso_aproveitamento, c.peso_data, c.peso_capacidade, c.peso_valor, c.peso_anunciante
    FROM filtrado f, cfg c
  )
  SELECT
    x.id,
    round(
      (x.peso_desvio * x.s_desvio + x.peso_aproveitamento * x.s_aprov + x.peso_data * x.s_data
       + x.peso_capacidade * x.s_cap + x.peso_valor * x.s_valor + x.peso_anunciante * x.s_anun)
      * 100 / nullif(x.peso_desvio + x.peso_aproveitamento + x.peso_data + x.peso_capacidade + x.peso_valor + x.peso_anunciante, 0)
    )::int AS score,
    array_remove(ARRAY[
      CASE x.modo_calc
        WHEN 'rota' THEN CASE
          WHEN x.dist_o + x.dist_d < 2 THEN 'no caminho da sua rota'
          ELSE 'coleta e entrega a ' || round(x.dist_o + x.dist_d)::text || ' km da sua rota (≈ '
               || x.desvio_estrada::text || ' km a mais na estrada)'
        END
        WHEN 'perto' THEN CASE WHEN x.dist_perto < 1 THEN 'coleta a menos de 1 km de você'
                               ELSE 'coleta a ' || round(x.dist_perto)::text || ' km de você' END
        WHEN 'cidade' THEN 'mesma origem e destino (rota não calculada)'
      END,
      CASE WHEN x.modo_calc = 'rota' AND x.km_coleta_calc > 0
        THEN 'coleta no km ' || x.km_coleta_calc::text || ' da sua rota' END,
      CASE WHEN x.modo_calc = 'rota' THEN 'usa ' || round(x.s_aprov * 100)::text || '% da sua rota' END,
      CASE
        WHEN x.data_disponivel_inicio <= current_date THEN 'coleta disponível hoje'
        ELSE 'coleta em ' || (x.data_disponivel_inicio - current_date)::text || ' dia(s)'
      END,
      CASE WHEN x.cap_kg > 0 AND x.peso_kg IS NOT NULL
        THEN round(x.peso_kg / x.cap_kg * 100)::text || '% da capacidade' END,
      CASE WHEN x.valor_sugerido > 0 AND x.km_trecho > 0
        THEN 'R$ ' || replace(to_char(x.valor_sugerido / x.km_trecho, 'FM9990D00'), '.', ',') || '/km' END,
      CASE WHEN x.exige_refrigeracao THEN 'exige refrigeração' END
    ], NULL) AS motivos,
    CASE WHEN x.modo_calc = 'rota' THEN round((x.dist_o + x.dist_d)::numeric, 1) END AS desvio_km,
    x.oc::text, x.ouf::text, x.dc::text, x.duf::text,
    x.descricao::text, x.categoria_carga::text, x.exige_refrigeracao,
    x.peso_kg, x.volume_m3, x.valor_sugerido,
    x.data_disponivel_inicio, x.data_disponivel_fim,
    coalesce(x.nome, 'Usuário')::text, x.foto_url, x.created_at,
    x.modo_calc,
    CASE x.modo_calc WHEN 'rota' THEN round(x.raio) WHEN 'perto' THEN round(x.perto_km) END,
    x.km_coleta_calc,
    x.desvio_estrada,
    x.olat, x.olng, x.dlat, x.dlng
  FROM pontuado x
  ORDER BY 2 DESC, x.data_disponivel_inicio, x.created_at DESC
  LIMIT (SELECT limite FROM entrada)
  OFFSET (SELECT deslocamento FROM entrada);
$$;

REVOKE ALL ON FUNCTION public.vt_match_cargas(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vt_match_cargas(JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.vt_match_cargas(JSONB) TO authenticated;

-- =====================================================================================
-- 6b. Match empresa → caminhões (v3)
-- =====================================================================================
DROP FUNCTION IF EXISTS public.vt_match_veiculos(JSONB);
CREATE FUNCTION public.vt_match_veiculos(p JSONB)
RETURNS TABLE (
  anuncio_id UUID,
  score INTEGER,
  motivos TEXT[],
  desvio_km NUMERIC,
  origem_cidade TEXT,
  origem_estado TEXT,
  destino_cidade TEXT,
  destino_estado TEXT,
  tipo_veiculo TEXT,
  tipo_carroceria TEXT,
  refrigerado BOOLEAN,
  capacidade_peso_kg NUMERIC,
  capacidade_volume_m3 NUMERIC,
  valor_sugerido NUMERIC,
  data_inicio DATE,
  data_fim DATE,
  nome_usuario TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ,
  modo TEXT,
  raio_km NUMERIC,
  km_coleta NUMERIC,
  desvio_estrada_km NUMERIC,
  frete_retorno BOOLEAN,
  origem_lat NUMERIC,
  origem_lng NUMERIC,
  destino_lat NUMERIC,
  destino_lng NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  WITH cfg AS (
    SELECT * FROM vt_match_config WHERE id = 1
  ),
  entrada AS (
    SELECT
      nullif(p->>'categoria_carga', '') AS categoria,
      coalesce((p->>'exige_refrigeracao')::boolean, false) AS exige_frio,
      (p->>'peso_kg')::numeric AS peso,
      (p->>'volume_m3')::numeric AS volume,
      vt_norm(p->>'origem_cidade') AS o_cid,
      upper(trim(coalesce(p->>'origem_uf', ''))) AS o_uf,
      vt_norm(p->>'destino_cidade') AS d_cid,
      upper(trim(coalesce(p->>'destino_uf', ''))) AS d_uf,
      CASE WHEN coalesce(p->>'origem_lat', '') <> '' AND coalesce(p->>'origem_lng', '') <> ''
        THEN ST_SetSRID(ST_MakePoint((p->>'origem_lng')::float8, (p->>'origem_lat')::float8), 4326) END AS cop,
      CASE WHEN coalesce(p->>'destino_lat', '') <> '' AND coalesce(p->>'destino_lng', '') <> ''
        THEN ST_SetSRID(ST_MakePoint((p->>'destino_lng')::float8, (p->>'destino_lat')::float8), 4326) END AS cdp,
      coalesce((p->>'data_inicio')::date, current_date) AS j_ini,
      coalesce((p->>'data_fim')::date, current_date + (SELECT janela_dias FROM cfg)) AS j_fim,
      vt_raio_teto() AS teto,
      least(greatest(coalesce((p->>'limite')::int, 20), 1), 50) AS limite,
      greatest(coalesce((p->>'deslocamento')::int, 0), 0) AS deslocamento
  ),
  base AS (
    SELECT
      a.id, a.valor_sugerido, a.data_disponivel_inicio, a.data_disponivel_fim, a.created_at,
      a.rota::geometry AS rota,
      coalesce(a.distancia_km, CASE WHEN a.rota IS NOT NULL THEN (ST_Length(a.rota) / 1000)::numeric END) AS km_rota,
      v.tipo_veiculo, v.capacidade_peso_kg, v.capacidade_volume_m3,
      k.tipo_carroceria, coalesce(k.refrigerado, false) AS refrigerado,
      o.cidade AS oc, o.estado AS ouf, d.cidade AS dc, d.estado AS duf,
      o.latitude AS olat, o.longitude AS olng, d.latitude AS dlat, d.longitude AS dlng,
      coalesce(r.valor_ref_km, (SELECT valor_ref_km FROM cfg)) AS ref_km,
      EXISTS (
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
      ) AS retorno,
      u.nome, u.foto_url
    FROM entrada e
    JOIN vt_anuncio a ON a.tipo_anuncio = 'V'
    JOIN vt_veiculo v ON v.id = a.veiculo_id
    LEFT JOIN LATERAL (
      SELECT c.tipo_carroceria, c.refrigerado FROM vt_carroceria c WHERE c.veiculo_id = v.id LIMIT 1
    ) k ON true
    JOIN vt_localizacao o ON o.id = a.origem_id
    JOIN vt_localizacao d ON d.id = a.destino_id
    LEFT JOIN vt_valor_referencia r ON r.tipo_veiculo = v.tipo_veiculo
    LEFT JOIN vt_usuario u ON u.user_id = a.user_id
    WHERE auth.uid() IS NOT NULL
      AND a.status = 'ATIVO'
      AND a.data_disponivel_fim >= current_date
      AND a.user_id <> auth.uid()
      -- Pré-filtro por índice (idx_vt_anuncio_rota): a rota passa perto da coleta.
      AND (e.cop IS NULL OR a.rota IS NULL OR ST_DWithin(a.rota, e.cop::geography, e.teto * 1000))
  ),
  geo AS (
    SELECT
      b.*,
      e.*,
      vt_raio_km(b.km_rota) AS raio,
      CASE
        WHEN b.rota IS NOT NULL AND e.cop IS NOT NULL AND e.cdp IS NOT NULL THEN 'rota'
        WHEN e.o_cid <> '' AND e.d_cid <> '' THEN 'cidade'
        WHEN e.o_cid <> '' OR e.d_cid <> '' OR e.o_uf <> '' OR e.d_uf <> '' THEN 'parcial'
        ELSE 'livre'
      END AS modo_calc,
      CASE WHEN b.rota IS NOT NULL AND e.cop IS NOT NULL
        THEN ST_Distance(b.rota::geography, e.cop::geography) / 1000 END AS dist_o,
      CASE WHEN b.rota IS NOT NULL AND e.cdp IS NOT NULL
        THEN ST_Distance(b.rota::geography, e.cdp::geography) / 1000 END AS dist_d,
      CASE WHEN b.rota IS NOT NULL AND e.cop IS NOT NULL
        THEN ST_LineLocatePoint(b.rota, e.cop) END AS pos_o,
      CASE WHEN b.rota IS NOT NULL AND e.cdp IS NOT NULL
        THEN ST_LineLocatePoint(b.rota, e.cdp) END AS pos_d
    FROM base b CROSS JOIN entrada e
  ),
  filtrado AS (
    SELECT g.*
    FROM geo g
    WHERE (g.categoria IS NULL OR g.tipo_carroceria IS NULL OR EXISTS (
            SELECT 1 FROM vt_compatibilidade k
            WHERE k.categoria_carga = g.categoria AND k.tipo_carroceria = g.tipo_carroceria))
      AND (NOT g.exige_frio OR g.refrigerado)
      AND (g.peso IS NULL OR g.capacidade_peso_kg IS NULL OR g.peso <= g.capacidade_peso_kg)
      AND (g.volume IS NULL OR g.capacidade_volume_m3 IS NULL OR g.volume <= g.capacidade_volume_m3)
      AND g.data_disponivel_inicio <= g.j_fim
      AND g.data_disponivel_fim >= g.j_ini
      AND CASE g.modo_calc
        WHEN 'rota' THEN g.dist_o <= g.raio AND g.dist_d <= g.raio AND g.pos_o < g.pos_d
        WHEN 'cidade' THEN vt_norm(g.oc) = g.o_cid AND vt_norm(g.dc) = g.d_cid
                       AND (g.o_uf = '' OR upper(trim(g.ouf)) = g.o_uf)
                       AND (g.d_uf = '' OR upper(trim(g.duf)) = g.d_uf)
        WHEN 'parcial' THEN (g.o_cid = '' OR vt_norm(g.oc) = g.o_cid)
                        AND (g.d_cid = '' OR vt_norm(g.dc) = g.d_cid)
                        AND (g.o_uf = '' OR upper(trim(g.ouf)) = g.o_uf)
                        AND (g.d_uf = '' OR upper(trim(g.duf)) = g.d_uf)
        ELSE true
      END
  ),
  pontuado AS (
    SELECT
      f.*,
      CASE f.modo_calc
        WHEN 'rota' THEN greatest(0, 1 - (f.dist_o + f.dist_d) / (2 * f.raio))
        WHEN 'cidade' THEN c.nota_modo_cidade
        ELSE 0.5
      END AS s_desvio,
      CASE f.modo_calc
        WHEN 'rota' THEN greatest(0, least(1, f.pos_d - f.pos_o))
        WHEN 'cidade' THEN c.nota_modo_cidade
        ELSE 0.5
      END AS s_aprov,
      1 - least(1, greatest(0, f.data_disponivel_inicio - greatest(f.j_ini, current_date))::numeric / c.janela_dias) AS s_data,
      CASE
        WHEN f.capacidade_peso_kg > 0 AND f.peso IS NOT NULL AND f.capacidade_volume_m3 > 0 AND f.volume IS NOT NULL
          THEN least(1, (f.peso / f.capacidade_peso_kg + f.volume / f.capacidade_volume_m3) / 2)
        WHEN f.capacidade_peso_kg > 0 AND f.peso IS NOT NULL THEN least(1, f.peso / f.capacidade_peso_kg)
        WHEN f.capacidade_volume_m3 > 0 AND f.volume IS NOT NULL THEN least(1, f.volume / f.capacidade_volume_m3)
        ELSE 0.5
      END AS s_cap,
      CASE
        WHEN f.valor_sugerido > 0 AND f.km_rota > 0
          THEN least(1, f.ref_km / (f.valor_sugerido / f.km_rota))
        ELSE 0.5
      END AS s_valor,
      CASE WHEN f.foto_url IS NOT NULL THEN 1 ELSE 0.6 END AS s_anun,
      CASE WHEN f.modo_calc = 'rota'
        THEN round(2 * c.fator_estrada * (f.dist_o + f.dist_d) / 5) * 5 END AS desvio_estrada,
      CASE WHEN f.modo_calc = 'rota' THEN round(f.pos_o * f.km_rota) END AS km_coleta_calc,
      c.peso_desvio, c.peso_aproveitamento, c.peso_data, c.peso_capacidade, c.peso_valor, c.peso_anunciante,
      c.bonus_retorno
    FROM filtrado f, cfg c
  )
  SELECT
    x.id,
    least(100, round(
      (x.peso_desvio * x.s_desvio + x.peso_aproveitamento * x.s_aprov + x.peso_data * x.s_data
       + x.peso_capacidade * x.s_cap + x.peso_valor * x.s_valor + x.peso_anunciante * x.s_anun)
      * 100 / nullif(x.peso_desvio + x.peso_aproveitamento + x.peso_data + x.peso_capacidade + x.peso_valor + x.peso_anunciante, 0)
      + CASE WHEN x.retorno THEN x.bonus_retorno ELSE 0 END
    ))::int AS score,
    array_remove(ARRAY[
      CASE WHEN x.retorno THEN 'caminhão voltando de viagem (frete de retorno)' END,
      CASE x.modo_calc
        WHEN 'rota' THEN CASE
          WHEN x.dist_o + x.dist_d < 2 THEN 'no caminho do caminhão'
          ELSE 'coleta e entrega a ' || round(x.dist_o + x.dist_d)::text || ' km da rota do caminhão (≈ '
               || x.desvio_estrada::text || ' km a mais na estrada)'
        END
        WHEN 'cidade' THEN 'mesma origem e destino (rota não calculada)'
      END,
      CASE WHEN x.modo_calc = 'rota' AND x.km_coleta_calc > 0
        THEN 'coleta no km ' || x.km_coleta_calc::text || ' da rota do caminhão' END,
      CASE WHEN x.modo_calc = 'rota' THEN 'sua carga ocupa ' || round(x.s_aprov * 100)::text || '% da rota do veículo' END,
      CASE
        WHEN x.data_disponivel_inicio <= current_date THEN 'disponível hoje'
        ELSE 'disponível em ' || (x.data_disponivel_inicio - current_date)::text || ' dia(s)'
      END,
      CASE WHEN x.capacidade_peso_kg > 0 AND x.peso IS NOT NULL
        THEN 'usa ' || round(x.peso / x.capacidade_peso_kg * 100)::text || '% da capacidade' END,
      CASE WHEN x.valor_sugerido > 0 AND x.km_rota > 0
        THEN 'R$ ' || replace(to_char(x.valor_sugerido / x.km_rota, 'FM9990D00'), '.', ',') || '/km' END,
      CASE WHEN x.refrigerado THEN 'refrigerado' END
    ], NULL) AS motivos,
    CASE WHEN x.modo_calc = 'rota' THEN round((x.dist_o + x.dist_d)::numeric, 1) END AS desvio_km,
    x.oc::text, x.ouf::text, x.dc::text, x.duf::text,
    x.tipo_veiculo::text, x.tipo_carroceria::text, x.refrigerado,
    x.capacidade_peso_kg, x.capacidade_volume_m3, x.valor_sugerido,
    x.data_disponivel_inicio, x.data_disponivel_fim,
    coalesce(x.nome, 'Usuário')::text, x.foto_url, x.created_at,
    x.modo_calc,
    CASE WHEN x.modo_calc = 'rota' THEN round(x.raio) END,
    x.km_coleta_calc,
    x.desvio_estrada,
    x.retorno,
    x.olat, x.olng, x.dlat, x.dlng
  FROM pontuado x
  ORDER BY 2 DESC, x.data_disponivel_inicio, x.created_at DESC
  LIMIT (SELECT limite FROM entrada)
  OFFSET (SELECT deslocamento FROM entrada);
$$;

REVOKE ALL ON FUNCTION public.vt_match_veiculos(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vt_match_veiculos(JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.vt_match_veiculos(JSONB) TO authenticated;

-- =====================================================================================
-- 7. Rota gravada do anúncio (para o mapa, sem chamar o Google)
-- =====================================================================================
CREATE OR REPLACE FUNCTION public.vt_rota_anuncio(p_anuncio UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT ST_AsEncodedPolyline(a.rota::geometry)
  FROM vt_anuncio a
  WHERE a.id = p_anuncio
    AND a.rota IS NOT NULL
    AND (a.status = 'ATIVO' OR a.user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.vt_rota_anuncio(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vt_rota_anuncio(UUID) TO anon, authenticated;

-- Fim da migração M3 (Match v3)
