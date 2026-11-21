-- V3.2 — Registro do aceite dos Termos de Uso (LGPD e prova do contrato de uso)
-- O cadastro tem um aceite único: Termos de Uso + Política de Privacidade (src/pages/Cadastro.tsx).
-- Até esta migração, a versão dos Termos ficava só nos metadados da conta (auth.users).
-- Agora vt_usuario guarda a data e a versão aceitas, como já faz com a Política de Privacidade.
-- Contas antigas ficam com o campo vazio; a tela de Perfil pede o aceite a elas.
-- Segura para rodar mais de uma vez (IF NOT EXISTS / CREATE OR REPLACE).

-- 1. Novas colunas
ALTER TABLE public.vt_usuario
  ADD COLUMN IF NOT EXISTS aceite_termos_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS versao_termos VARCHAR(20);

COMMENT ON COLUMN public.vt_usuario.aceite_termos_em IS 'Data e hora em que o usuário aceitou os Termos de Uso.';
COMMENT ON COLUMN public.vt_usuario.versao_termos IS 'Versão dos Termos de Uso aceita (ex.: 2026-11-09).';

-- 2. Contas criadas depois do aceite único (v3.2) que já têm a versão nos metadados: copia para a tabela.
UPDATE public.vt_usuario u
SET aceite_termos_em = coalesce(u.aceite_privacidade_em, a.created_at),
    versao_termos = a.raw_user_meta_data->>'versao_termos'
FROM auth.users a
WHERE a.id = u.user_id
  AND u.versao_termos IS NULL
  AND coalesce(a.raw_user_meta_data->>'versao_termos', '') <> '';

-- 3. Criação do perfil no cadastro: grava também o aceite dos Termos.
--    Igual à versão da v3 (20261028120000_v3_cpf_cnpj_aceite.sql), com as duas colunas novas.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.vt_usuario (
    user_id, nome, tipo_usuario, documento, telefone, cnpj, aceite_privacidade_em, versao_politica,
    aceite_termos_em, versao_termos
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'C'),
    COALESCE(NEW.raw_user_meta_data->>'documento', ''),
    COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
    NULLIF(NEW.raw_user_meta_data->>'cnpj', ''),
    CASE WHEN NEW.raw_user_meta_data->>'aceite_privacidade' = 'true' THEN now() END,
    NULLIF(NEW.raw_user_meta_data->>'versao_politica', ''),
    CASE WHEN COALESCE(NEW.raw_user_meta_data->>'versao_termos', '') <> '' THEN now() END,
    NULLIF(NEW.raw_user_meta_data->>'versao_termos', '')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    nome = EXCLUDED.nome,
    tipo_usuario = EXCLUDED.tipo_usuario,
    documento = EXCLUDED.documento,
    telefone = EXCLUDED.telefone,
    cnpj = EXCLUDED.cnpj,
    aceite_privacidade_em = EXCLUDED.aceite_privacidade_em,
    versao_politica = EXCLUDED.versao_politica,
    aceite_termos_em = EXCLUDED.aceite_termos_em,
    versao_termos = EXCLUDED.versao_termos;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fim da migração V3.2 (aceite dos Termos)
