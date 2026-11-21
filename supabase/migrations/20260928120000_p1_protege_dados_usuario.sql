-- P1 — Proteção dos dados pessoais de vt_usuario (LGPD)
-- Antes: a política "Public can view active users" liberava a leitura de TODAS as colunas
-- (inclusive documento CPF/CNPJ) de todos os usuários ativos para qualquer visitante, mesmo sem login.
-- Depois: cada usuário lê apenas o próprio perfil; os dados de contato de quem anuncia
-- (nome, telefone e foto — nunca o documento) ficam disponíveis só para usuários logados,
-- e só de quem tem anúncio ATIVO, pela função vt_anunciantes.

DROP POLICY IF EXISTS "Public can view active users" ON public.vt_usuario;

CREATE OR REPLACE FUNCTION public.vt_anunciantes(ids uuid[])
RETURNS TABLE (user_id uuid, nome varchar, telefone varchar, foto_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.user_id, u.nome, u.telefone, u.foto_url
  FROM public.vt_usuario u
  WHERE auth.uid() IS NOT NULL
    AND u.user_id = ANY (ids)
    AND u.ativo = true
    AND EXISTS (
      SELECT 1 FROM public.vt_anuncio a
      WHERE a.user_id = u.user_id AND a.status = 'ATIVO'
    );
$$;

REVOKE ALL ON FUNCTION public.vt_anunciantes(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.vt_anunciantes(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.vt_anunciantes(uuid[]) TO authenticated;

-- Fim da migração P1
