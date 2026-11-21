-- M2 — Match v2: o "cérebro" da plataforma
-- Especificação: docs/MATCH.md
-- 1. PostGIS e novas colunas: rota do anúncio, coordenadas, categoria e refrigeração da carga, dono dos registros.
-- 2. Tabelas de regra de negócio: compatibilidade carga × carroceria e configuração do score (ajustáveis sem deploy).
-- 3. vt_criar_anuncio: criação transacional do anúncio, reaproveitando o veículo pela placa.
-- 4. vt_match_cargas e vt_match_veiculos: filtros obrigatórios, encaixe na rota, score 0–100 e motivos.
-- 5. vt_registrar_interesse: o telefone só é liberado depois do "tenho interesse", que fica registrado.
-- 6. vt_meu_painel: indicadores do usuário.

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

ALTER TABLE public.vt_anuncio
  ADD COLUMN IF NOT EXISTS rota extensions.geography(LineString, 4326),
  ADD COLUMN IF NOT EXISTS distancia_km NUMERIC(10,1);

ALTER TABLE public.vt_mercadoria
  ADD COLUMN IF NOT EXISTS categoria_carga VARCHAR(40),
  ADD COLUMN IF NOT EXISTS exige_refrigeracao BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

ALTER TABLE public.vt_localizacao
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS idx_vt_anuncio_rota ON public.vt_anuncio USING GIST (rota);
CREATE INDEX IF NOT EXISTS idx_vt_anuncio_ativo_tipo_fim ON public.vt_anuncio (tipo_anuncio, data_disponivel_fim) WHERE status = 'ATIVO';
CREATE INDEX IF NOT EXISTS idx_vt_veiculo_user_placa ON public.vt_veiculo (user_id, upper(placa));

CREATE TABLE IF NOT EXISTS public.vt_compatibilidade (
  categoria_carga VARCHAR(40) NOT NULL,
  tipo_carroceria VARCHAR(50) NOT NULL,
  PRIMARY KEY (categoria_carga, tipo_carroceria)
);
ALTER TABLE public.vt_compatibilidade ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can read compatibilidade" ON public.vt_compatibilidade;
CREATE POLICY "Authenticated can read compatibilidade" ON public.vt_compatibilidade FOR SELECT TO authenticated USING (true);

INSERT INTO public.vt_compatibilidade (categoria_carga, tipo_carroceria) VALUES
  ('Carga seca', 'Baú'), ('Carga seca', 'Sider'),
  ('Refrigerada', 'Baú'),
  ('Granel sólido', 'Graneleiro'),
  ('Líquidos', 'Tanque'),
  ('Máquinas e volumes grandes', 'Plataforma'),
  ('Veículos', 'Cegonha'),
  ('Mudança', 'Baú'), ('Mudança', 'Sider')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.vt_match_config (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  raio_km NUMERIC NOT NULL DEFAULT 30,
  janela_dias INTEGER NOT NULL DEFAULT 30,
  valor_ref_km NUMERIC NOT NULL DEFAULT 6.5,
  peso_desvio NUMERIC NOT NULL DEFAULT 35,
  peso_aproveitamento NUMERIC NOT NULL DEFAULT 20,
  peso_data NUMERIC NOT NULL DEFAULT 15,
  peso_capacidade NUMERIC NOT NULL DEFAULT 15,
  peso_valor NUMERIC NOT NULL DEFAULT 10,
  peso_anunciante NUMERIC NOT NULL DEFAULT 5
);
ALTER TABLE public.vt_match_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can read match config" ON public.vt_match_config;
CREATE POLICY "Authenticated can read match config" ON public.vt_match_config FOR SELECT TO authenticated USING (true);
INSERT INTO public.vt_match_config (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.vt_match_evento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  anuncio_id UUID NOT NULL REFERENCES public.vt_anuncio(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('exibido', 'contato')),
  score SMALLINT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vt_match_evento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own match events" ON public.vt_match_evento;
CREATE POLICY "Users can insert own match events" ON public.vt_match_evento FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tipo = 'exibido');
DROP POLICY IF EXISTS "Users can view own match events" ON public.vt_match_evento;
CREATE POLICY "Users can view own match events" ON public.vt_match_evento FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_vt_match_evento_anuncio ON public.vt_match_evento (anuncio_id, tipo, criado_em);
CREATE INDEX IF NOT EXISTS idx_vt_match_evento_user ON public.vt_match_evento (user_id, tipo, criado_em);

CREATE OR REPLACE FUNCTION public.vt_norm(t TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT lower(extensions.unaccent(trim(coalesce(t, ''))));
$$;

CREATE OR REPLACE FUNCTION public.vt_criar_anuncio(p JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_tipo TEXT := upper(coalesce(p->>'tipo', ''));
  v_inicio DATE := (p->>'data_inicio')::date;
  v_fim DATE := (p->>'data_fim')::date;
  v_placa TEXT := upper(regexp_replace(coalesce(p->>'placa', ''), '[^A-Za-z0-9]', '', 'g'));
  v_veiculo UUID;
  v_mercadoria UUID;
  v_origem UUID;
  v_destino UUID;
  v_anuncio UUID;
  v_rota geography;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'É preciso estar logado para anunciar.';
  END IF;
  IF v_tipo NOT IN ('V', 'C') THEN
    RAISE EXCEPTION 'Tipo de anúncio inválido.';
  END IF;
  IF coalesce(p->>'origem_cidade', '') = '' OR coalesce(p->>'origem_uf', '') = ''
     OR coalesce(p->>'destino_cidade', '') = '' OR coalesce(p->>'destino_uf', '') = '' THEN
    RAISE EXCEPTION 'Informe cidade e UF de origem e de destino.';
  END IF;
  IF v_inicio IS NULL OR v_fim IS NULL OR v_fim < v_inicio THEN
    RAISE EXCEPTION 'A data fim deve ser igual ou posterior à data início.';
  END IF;
  IF v_fim < current_date THEN
    RAISE EXCEPTION 'A data fim já passou.';
  END IF;

  IF v_tipo = 'V' THEN
    IF v_placa = '' OR coalesce(p->>'tipo_veiculo', '') = '' THEN
      RAISE EXCEPTION 'Informe a placa e o tipo do veículo.';
    END IF;
    SELECT v.id INTO v_veiculo
    FROM vt_veiculo v
    WHERE v.user_id = v_uid AND upper(regexp_replace(v.placa, '[^A-Za-z0-9]', '', 'g')) = v_placa
    ORDER BY v.created_at DESC
    LIMIT 1;

    IF v_veiculo IS NULL THEN
      INSERT INTO vt_veiculo (user_id, placa, tipo_veiculo, capacidade_peso_kg, capacidade_volume_m3)
      VALUES (v_uid, v_placa, p->>'tipo_veiculo', (p->>'capacidade_kg')::numeric, (p->>'capacidade_m3')::numeric)
      RETURNING id INTO v_veiculo;
    ELSE
      UPDATE vt_veiculo
      SET tipo_veiculo = p->>'tipo_veiculo',
          capacidade_peso_kg = (p->>'capacidade_kg')::numeric,
          capacidade_volume_m3 = (p->>'capacidade_m3')::numeric,
          ativo = true
      WHERE id = v_veiculo;
    END IF;

    IF coalesce(p->>'tipo_carroceria', '') <> '' THEN
      UPDATE vt_carroceria
      SET tipo_carroceria = p->>'tipo_carroceria',
          refrigerado = coalesce((p->>'refrigerado')::boolean, false)
      WHERE veiculo_id = v_veiculo;
      IF NOT FOUND THEN
        INSERT INTO vt_carroceria (veiculo_id, tipo_carroceria, refrigerado)
        VALUES (v_veiculo, p->>'tipo_carroceria', coalesce((p->>'refrigerado')::boolean, false));
      END IF;
    END IF;
  ELSE
    IF coalesce(p->>'descricao', '') = '' THEN
      RAISE EXCEPTION 'Informe a descrição da mercadoria.';
    END IF;
    INSERT INTO vt_mercadoria (descricao, tipo_mercadoria, categoria_carga, exige_refrigeracao, peso_kg, volume_m3, user_id)
    VALUES (
      p->>'descricao',
      nullif(p->>'tipo_mercadoria', ''),
      nullif(p->>'categoria_carga', ''),
      coalesce((p->>'exige_refrigeracao')::boolean, false),
      (p->>'peso_kg')::numeric,
      (p->>'volume_m3')::numeric,
      v_uid
    )
    RETURNING id INTO v_mercadoria;
  END IF;

  INSERT INTO vt_localizacao (cidade, estado, latitude, longitude, user_id)
  VALUES (trim(p->>'origem_cidade'), upper(trim(p->>'origem_uf')), (p->>'origem_lat')::numeric, (p->>'origem_lng')::numeric, v_uid)
  RETURNING id INTO v_origem;

  INSERT INTO vt_localizacao (cidade, estado, latitude, longitude, user_id)
  VALUES (trim(p->>'destino_cidade'), upper(trim(p->>'destino_uf')), (p->>'destino_lat')::numeric, (p->>'destino_lng')::numeric, v_uid)
  RETURNING id INTO v_destino;

  IF coalesce(p->>'polyline', '') <> '' THEN
    v_rota := ST_LineFromEncodedPolyline(p->>'polyline')::geography;
  END IF;

  INSERT INTO vt_anuncio (
    user_id, tipo_anuncio, veiculo_id, mercadoria_id, origem_id, destino_id,
    data_disponivel_inicio, data_disponivel_fim, valor_sugerido, rota, distancia_km
  ) VALUES (
    v_uid, v_tipo, v_veiculo, v_mercadoria, v_origem, v_destino,
    v_inicio, v_fim, (p->>'valor')::numeric, v_rota, (p->>'distancia_km')::numeric
  )
  RETURNING id INTO v_anuncio;

  RETURN v_anuncio;
END;
$$;

REVOKE ALL ON FUNCTION public.vt_criar_anuncio(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vt_criar_anuncio(JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.vt_criar_anuncio(JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.vt_match_cargas(p JSONB)
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
  created_at TIMESTAMPTZ
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
      vt_norm(p->>'origem_cidade') AS o_cid,
      upper(trim(coalesce(p->>'origem_uf', ''))) AS o_uf,
      vt_norm(p->>'destino_cidade') AS d_cid,
      upper(trim(coalesce(p->>'destino_uf', ''))) AS d_uf,
      coalesce((p->>'data_inicio')::date, current_date) AS j_ini,
      coalesce((p->>'data_fim')::date, current_date + (SELECT janela_dias FROM cfg)) AS j_fim,
      CASE WHEN coalesce(p->>'polyline', '') <> ''
        THEN ST_LineFromEncodedPolyline(p->>'polyline') END AS rota,
      least(greatest(coalesce((p->>'limite')::int, 20), 1), 50) AS limite,
      greatest(coalesce((p->>'deslocamento')::int, 0), 0) AS deslocamento
  ),
  base AS (
    SELECT
      a.id, a.valor_sugerido, a.data_disponivel_inicio, a.data_disponivel_fim, a.created_at, a.distancia_km,
      m.descricao, m.categoria_carga, m.exige_refrigeracao, m.peso_kg, m.volume_m3,
      o.cidade AS oc, o.estado AS ouf, d.cidade AS dc, d.estado AS duf,
      CASE WHEN o.latitude IS NOT NULL AND o.longitude IS NOT NULL
        THEN ST_SetSRID(ST_MakePoint(o.longitude, o.latitude), 4326) END AS op,
      CASE WHEN d.latitude IS NOT NULL AND d.longitude IS NOT NULL
        THEN ST_SetSRID(ST_MakePoint(d.longitude, d.latitude), 4326) END AS dp,
      u.nome, u.foto_url
    FROM vt_anuncio a
    JOIN vt_mercadoria m ON m.id = a.mercadoria_id
    JOIN vt_localizacao o ON o.id = a.origem_id
    JOIN vt_localizacao d ON d.id = a.destino_id
    LEFT JOIN vt_usuario u ON u.user_id = a.user_id
    WHERE auth.uid() IS NOT NULL
      AND a.tipo_anuncio = 'C'
      AND a.status = 'ATIVO'
      AND a.data_disponivel_fim >= current_date
      AND a.user_id <> auth.uid()
  ),
  geo AS (
    SELECT
      b.*,
      e.*,
      CASE
        WHEN e.rota IS NOT NULL AND b.op IS NOT NULL AND b.dp IS NOT NULL THEN 'rota'
        WHEN e.o_cid <> '' AND e.d_cid <> '' THEN 'cidade'
        WHEN e.o_cid <> '' OR e.d_cid <> '' OR e.o_uf <> '' OR e.d_uf <> '' THEN 'parcial'
        ELSE 'livre'
      END AS modo,
      CASE WHEN e.rota IS NOT NULL AND b.op IS NOT NULL
        THEN ST_Distance(e.rota::geography, b.op::geography) / 1000 END AS dist_o,
      CASE WHEN e.rota IS NOT NULL AND b.dp IS NOT NULL
        THEN ST_Distance(e.rota::geography, b.dp::geography) / 1000 END AS dist_d,
      CASE WHEN e.rota IS NOT NULL AND b.op IS NOT NULL
        THEN ST_LineLocatePoint(e.rota, b.op) END AS pos_o,
      CASE WHEN e.rota IS NOT NULL AND b.dp IS NOT NULL
        THEN ST_LineLocatePoint(e.rota, b.dp) END AS pos_d,
      coalesce(b.distancia_km,
        CASE WHEN b.op IS NOT NULL AND b.dp IS NOT NULL
          THEN ST_Distance(b.op::geography, b.dp::geography) / 1000 * 1.25 END) AS km_trecho
    FROM base b CROSS JOIN entrada e
  ),
  filtrado AS (
    SELECT g.*
    FROM geo g, cfg c
    WHERE (g.categoria_carga IS NULL OR g.carroceria IS NULL OR EXISTS (
            SELECT 1 FROM vt_compatibilidade k
            WHERE k.categoria_carga = g.categoria_carga AND k.tipo_carroceria = g.carroceria))
      AND (NOT g.exige_refrigeracao OR g.refrigerado)
      AND (g.cap_kg IS NULL OR g.peso_kg IS NULL OR g.peso_kg <= g.cap_kg)
      AND (g.cap_m3 IS NULL OR g.volume_m3 IS NULL OR g.volume_m3 <= g.cap_m3)
      AND g.data_disponivel_inicio <= g.j_fim
      AND g.data_disponivel_fim >= g.j_ini
      AND CASE g.modo
        WHEN 'rota' THEN g.dist_o <= c.raio_km AND g.dist_d <= c.raio_km AND g.pos_o < g.pos_d
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
      CASE f.modo
        WHEN 'rota' THEN greatest(0, 1 - (f.dist_o + f.dist_d) / (2 * c.raio_km))
        WHEN 'cidade' THEN 1
        ELSE 0.5
      END AS s_desvio,
      CASE f.modo
        WHEN 'rota' THEN greatest(0, least(1, f.pos_d - f.pos_o))
        WHEN 'cidade' THEN 1
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
          THEN least(1, (f.valor_sugerido / f.km_trecho) / c.valor_ref_km / 1.5)
        ELSE 0.5
      END AS s_valor,
      CASE WHEN f.foto_url IS NOT NULL THEN 1 ELSE 0.6 END AS s_anun,
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
      CASE x.modo
        WHEN 'rota' THEN 'desvio de ' || round(x.dist_o + x.dist_d)::text || ' km'
        WHEN 'cidade' THEN 'mesma origem e destino'
      END,
      CASE WHEN x.modo = 'rota' THEN 'usa ' || round(x.s_aprov * 100)::text || '% da sua rota' END,
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
    CASE WHEN x.modo = 'rota' THEN round((x.dist_o + x.dist_d)::numeric, 1) END AS desvio_km,
    x.oc::text, x.ouf::text, x.dc::text, x.duf::text,
    x.descricao::text, x.categoria_carga::text, x.exige_refrigeracao,
    x.peso_kg, x.volume_m3, x.valor_sugerido,
    x.data_disponivel_inicio, x.data_disponivel_fim,
    coalesce(x.nome, 'Usuário')::text, x.foto_url, x.created_at
  FROM pontuado x
  ORDER BY 2 DESC, x.data_disponivel_inicio, x.created_at DESC
  LIMIT (SELECT limite FROM entrada)
  OFFSET (SELECT deslocamento FROM entrada);
$$;

REVOKE ALL ON FUNCTION public.vt_match_cargas(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vt_match_cargas(JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.vt_match_cargas(JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.vt_match_veiculos(p JSONB)
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
  created_at TIMESTAMPTZ
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
      CASE WHEN p ? 'origem_lat' AND p ? 'origem_lng'
        THEN ST_SetSRID(ST_MakePoint((p->>'origem_lng')::float8, (p->>'origem_lat')::float8), 4326) END AS cop,
      CASE WHEN p ? 'destino_lat' AND p ? 'destino_lng'
        THEN ST_SetSRID(ST_MakePoint((p->>'destino_lng')::float8, (p->>'destino_lat')::float8), 4326) END AS cdp,
      coalesce((p->>'data_inicio')::date, current_date) AS j_ini,
      coalesce((p->>'data_fim')::date, current_date + (SELECT janela_dias FROM cfg)) AS j_fim,
      least(greatest(coalesce((p->>'limite')::int, 20), 1), 50) AS limite,
      greatest(coalesce((p->>'deslocamento')::int, 0), 0) AS deslocamento
  ),
  base AS (
    SELECT
      a.id, a.valor_sugerido, a.data_disponivel_inicio, a.data_disponivel_fim, a.created_at, a.distancia_km,
      a.rota::geometry AS rota,
      v.tipo_veiculo, v.capacidade_peso_kg, v.capacidade_volume_m3,
      k.tipo_carroceria, coalesce(k.refrigerado, false) AS refrigerado,
      o.cidade AS oc, o.estado AS ouf, d.cidade AS dc, d.estado AS duf,
      u.nome, u.foto_url
    FROM vt_anuncio a
    JOIN vt_veiculo v ON v.id = a.veiculo_id
    LEFT JOIN LATERAL (
      SELECT c.tipo_carroceria, c.refrigerado FROM vt_carroceria c WHERE c.veiculo_id = v.id LIMIT 1
    ) k ON true
    JOIN vt_localizacao o ON o.id = a.origem_id
    JOIN vt_localizacao d ON d.id = a.destino_id
    LEFT JOIN vt_usuario u ON u.user_id = a.user_id
    WHERE auth.uid() IS NOT NULL
      AND a.tipo_anuncio = 'V'
      AND a.status = 'ATIVO'
      AND a.data_disponivel_fim >= current_date
      AND a.user_id <> auth.uid()
  ),
  geo AS (
    SELECT
      b.*,
      e.*,
      CASE
        WHEN b.rota IS NOT NULL AND e.cop IS NOT NULL AND e.cdp IS NOT NULL THEN 'rota'
        WHEN e.o_cid <> '' AND e.d_cid <> '' THEN 'cidade'
        WHEN e.o_cid <> '' OR e.d_cid <> '' OR e.o_uf <> '' OR e.d_uf <> '' THEN 'parcial'
        ELSE 'livre'
      END AS modo,
      CASE WHEN b.rota IS NOT NULL AND e.cop IS NOT NULL
        THEN ST_Distance(b.rota::geography, e.cop::geography) / 1000 END AS dist_o,
      CASE WHEN b.rota IS NOT NULL AND e.cdp IS NOT NULL
        THEN ST_Distance(b.rota::geography, e.cdp::geography) / 1000 END AS dist_d,
      CASE WHEN b.rota IS NOT NULL AND e.cop IS NOT NULL
        THEN ST_LineLocatePoint(b.rota, e.cop) END AS pos_o,
      CASE WHEN b.rota IS NOT NULL AND e.cdp IS NOT NULL
        THEN ST_LineLocatePoint(b.rota, e.cdp) END AS pos_d,
      coalesce(b.distancia_km,
        CASE WHEN b.rota IS NOT NULL THEN ST_Length(b.rota::geography) / 1000 END) AS km_rota
    FROM base b CROSS JOIN entrada e
  ),
  filtrado AS (
    SELECT g.*
    FROM geo g, cfg c
    WHERE (g.categoria IS NULL OR g.tipo_carroceria IS NULL OR EXISTS (
            SELECT 1 FROM vt_compatibilidade k
            WHERE k.categoria_carga = g.categoria AND k.tipo_carroceria = g.tipo_carroceria))
      AND (NOT g.exige_frio OR g.refrigerado)
      AND (g.peso IS NULL OR g.capacidade_peso_kg IS NULL OR g.peso <= g.capacidade_peso_kg)
      AND (g.volume IS NULL OR g.capacidade_volume_m3 IS NULL OR g.volume <= g.capacidade_volume_m3)
      AND g.data_disponivel_inicio <= g.j_fim
      AND g.data_disponivel_fim >= g.j_ini
      AND CASE g.modo
        WHEN 'rota' THEN g.dist_o <= c.raio_km AND g.dist_d <= c.raio_km AND g.pos_o < g.pos_d
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
      CASE f.modo
        WHEN 'rota' THEN greatest(0, 1 - (f.dist_o + f.dist_d) / (2 * c.raio_km))
        WHEN 'cidade' THEN 1
        ELSE 0.5
      END AS s_desvio,
      CASE f.modo
        WHEN 'rota' THEN greatest(0, least(1, f.pos_d - f.pos_o))
        WHEN 'cidade' THEN 1
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
          THEN least(1, c.valor_ref_km / (f.valor_sugerido / f.km_rota))
        ELSE 0.5
      END AS s_valor,
      CASE WHEN f.foto_url IS NOT NULL THEN 1 ELSE 0.6 END AS s_anun,
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
      CASE x.modo
        WHEN 'rota' THEN 'desvio de ' || round(x.dist_o + x.dist_d)::text || ' km'
        WHEN 'cidade' THEN 'mesma origem e destino'
      END,
      CASE WHEN x.modo = 'rota' THEN 'sua carga ocupa ' || round(x.s_aprov * 100)::text || '% da rota do veículo' END,
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
    CASE WHEN x.modo = 'rota' THEN round((x.dist_o + x.dist_d)::numeric, 1) END AS desvio_km,
    x.oc::text, x.ouf::text, x.dc::text, x.duf::text,
    x.tipo_veiculo::text, x.tipo_carroceria::text, x.refrigerado,
    x.capacidade_peso_kg, x.capacidade_volume_m3, x.valor_sugerido,
    x.data_disponivel_inicio, x.data_disponivel_fim,
    coalesce(x.nome, 'Usuário')::text, x.foto_url, x.created_at
  FROM pontuado x
  ORDER BY 2 DESC, x.data_disponivel_inicio, x.created_at DESC
  LIMIT (SELECT limite FROM entrada)
  OFFSET (SELECT deslocamento FROM entrada);
$$;

REVOKE ALL ON FUNCTION public.vt_match_veiculos(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vt_match_veiculos(JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.vt_match_veiculos(JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.vt_registrar_interesse(p_anuncio UUID, p_score INTEGER DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_dono UUID;
  v_telefone TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'É preciso estar logado para ver o contato.';
  END IF;

  SELECT a.user_id INTO v_dono
  FROM vt_anuncio a
  WHERE a.id = p_anuncio AND a.status = 'ATIVO' AND a.data_disponivel_fim >= current_date;

  IF v_dono IS NULL THEN
    RAISE EXCEPTION 'Anúncio não encontrado ou encerrado.';
  END IF;

  SELECT u.telefone INTO v_telefone FROM vt_usuario u WHERE u.user_id = v_dono AND u.ativo = true;

  IF v_dono <> v_uid AND NOT EXISTS (
    SELECT 1 FROM vt_match_evento e
    WHERE e.user_id = v_uid AND e.anuncio_id = p_anuncio AND e.tipo = 'contato'
      AND e.criado_em > now() - interval '30 minutes'
  ) THEN
    INSERT INTO vt_match_evento (user_id, anuncio_id, tipo, score)
    VALUES (v_uid, p_anuncio, 'contato', p_score);
  END IF;

  RETURN coalesce(v_telefone, '');
END;
$$;

REVOKE ALL ON FUNCTION public.vt_registrar_interesse(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vt_registrar_interesse(UUID, INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.vt_registrar_interesse(UUID, INTEGER) TO authenticated;

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
      WHERE a.user_id = auth.uid() AND e.tipo = 'exibido' AND e.criado_em > now() - interval '30 days')
  ) END;
$$;

REVOKE ALL ON FUNCTION public.vt_meu_painel() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vt_meu_painel() FROM anon;
GRANT EXECUTE ON FUNCTION public.vt_meu_painel() TO authenticated;

DROP FUNCTION IF EXISTS public.vt_anunciantes(UUID[]);
CREATE FUNCTION public.vt_anunciantes(ids UUID[])
RETURNS TABLE (user_id UUID, nome VARCHAR, foto_url TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.user_id, u.nome, u.foto_url
  FROM public.vt_usuario u
  WHERE auth.uid() IS NOT NULL
    AND u.user_id = ANY (ids)
    AND u.ativo = true
    AND EXISTS (
      SELECT 1 FROM public.vt_anuncio a
      WHERE a.user_id = u.user_id AND a.status = 'ATIVO'
    );
$$;

REVOKE ALL ON FUNCTION public.vt_anunciantes(UUID[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vt_anunciantes(UUID[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.vt_anunciantes(UUID[]) TO authenticated;

-- Fim da migração M2
