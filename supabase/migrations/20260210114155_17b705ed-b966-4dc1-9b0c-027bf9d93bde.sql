
-- Fix permissive INSERT on vt_localizacao: only allow authenticated users to insert
DROP POLICY "Authenticated can insert locations" ON public.vt_localizacao;
CREATE POLICY "Authenticated can insert locations" ON public.vt_localizacao FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Fix permissive INSERT on vt_mercadoria: only allow authenticated users to insert
DROP POLICY "Authenticated can insert mercadorias" ON public.vt_mercadoria;
CREATE POLICY "Authenticated can insert mercadorias" ON public.vt_mercadoria FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
