-- P1.1 — Placa e carroceria dos veículos anunciados visíveis só para usuários logados (LGPD)
-- Antes: qualquer visitante, mesmo sem login, lia vt_veiculo (inclusive a placa) e vt_carroceria
-- de veículos com anúncio ativo. Depois: a mesma leitura exige login.

DROP POLICY IF EXISTS "Anyone can view vehicles linked to active anuncios" ON public.vt_veiculo;
DROP POLICY IF EXISTS "Authenticated can view vehicles linked to active anuncios" ON public.vt_veiculo;
CREATE POLICY "Authenticated can view vehicles linked to active anuncios"
ON public.vt_veiculo
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vt_anuncio a
    WHERE a.veiculo_id = vt_veiculo.id
      AND a.status = 'ATIVO'
  )
);

DROP POLICY IF EXISTS "Anyone can view carrocerias of active anuncio vehicles" ON public.vt_carroceria;
DROP POLICY IF EXISTS "Authenticated can view carrocerias of active anuncio vehicles" ON public.vt_carroceria;
CREATE POLICY "Authenticated can view carrocerias of active anuncio vehicles"
ON public.vt_carroceria
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vt_anuncio a
    WHERE a.veiculo_id = vt_carroceria.veiculo_id
      AND a.status = 'ATIVO'
  )
);

-- Fim da migração P1.1
