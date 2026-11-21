-- V3.2 — Peso e volume obrigatórios no anúncio de carga também no banco (roadmap "Próximas prioridades").
-- Até a v3 a regra C2 só valia na tela (decisão X12). Agora vt_criar_anuncio recusa carga sem peso
-- ou volume maior que zero, com mensagem em português.
-- O resto da função é idêntico ao da m2 (20260928120300_m2_match_v2.sql). Anúncios que já existem não mudam.
-- Segura para rodar mais de uma vez (CREATE OR REPLACE).

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
    IF coalesce(nullif(p->>'peso_kg', '')::numeric, 0) <= 0 OR coalesce(nullif(p->>'volume_m3', '')::numeric, 0) <= 0 THEN
      RAISE EXCEPTION 'Informe o peso (kg) e o volume (m³) da carga.';
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
