-- Allow reading vehicles that are linked to active anuncios (for search display)
CREATE POLICY "Anyone can view vehicles linked to active anuncios"
ON public.vt_veiculo
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM vt_anuncio a
    WHERE a.veiculo_id = vt_veiculo.id
    AND a.status = 'ATIVO'
  )
);

-- Allow reading carrocerias for vehicles linked to active anuncios
CREATE POLICY "Anyone can view carrocerias of active anuncio vehicles"
ON public.vt_carroceria
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM vt_anuncio a
    WHERE a.veiculo_id = vt_carroceria.veiculo_id
    AND a.status = 'ATIVO'
  )
);