-- V3 — Cadastro: CPF sempre, CNPJ quando houver, e registro do aceite da Política de Privacidade (LGPD)
-- Regra de negócio (decisão de 27/10/2026):
--   * A persona não define mais o tipo de documento. "Tenho caminhão" (motorista autônomo ou transportadora)
--     e "Tenho carga" (embarcador) informam o CPF do responsável; o CNPJ é opcional, para quem tiver.
--   * vt_usuario.documento passa a guardar o CPF. O CNPJ vai para a nova coluna vt_usuario.cnpj.
--   * O aceite da Política de Privacidade é obrigatório na tela de cadastro e fica registrado
--     (data/hora e versão da política), como prova do consentimento.
-- Segura para rodar mais de uma vez (IF NOT EXISTS / CREATE OR REPLACE).

-- 1. Novas colunas
ALTER TABLE public.vt_usuario
  ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18),
  ADD COLUMN IF NOT EXISTS aceite_privacidade_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS versao_politica VARCHAR(20);

COMMENT ON COLUMN public.vt_usuario.documento IS 'CPF do responsável pela conta (obrigatório a partir da v3).';
COMMENT ON COLUMN public.vt_usuario.cnpj IS 'CNPJ opcional (motorista autônomo com MEI, transportadora ou empresa). Não é único: uma transportadora pode ter vários usuários.';
COMMENT ON COLUMN public.vt_usuario.aceite_privacidade_em IS 'Data e hora em que o usuário aceitou a Política de Privacidade.';
COMMENT ON COLUMN public.vt_usuario.versao_politica IS 'Versão da Política de Privacidade aceita (ex.: 2026-10-28).';

-- 2. Contas antigas que cadastraram CNPJ no campo documento: copia para a coluna cnpj.
--    O campo documento não é alterado (não há como saber o CPF); a tela de Perfil pede o CPF a essas contas.
UPDATE public.vt_usuario
SET cnpj = documento
WHERE cnpj IS NULL
  AND length(regexp_replace(documento, '\D', '', 'g')) = 14;

-- 3. Criação do perfil no cadastro: passa a gravar CNPJ e aceite vindos do formulário.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.vt_usuario (
    user_id, nome, tipo_usuario, documento, telefone, cnpj, aceite_privacidade_em, versao_politica
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'C'),
    COALESCE(NEW.raw_user_meta_data->>'documento', ''),
    COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
    NULLIF(NEW.raw_user_meta_data->>'cnpj', ''),
    CASE WHEN NEW.raw_user_meta_data->>'aceite_privacidade' = 'true' THEN now() END,
    NULLIF(NEW.raw_user_meta_data->>'versao_politica', '')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    nome = EXCLUDED.nome,
    tipo_usuario = EXCLUDED.tipo_usuario,
    documento = EXCLUDED.documento,
    telefone = EXCLUDED.telefone,
    cnpj = EXCLUDED.cnpj,
    aceite_privacidade_em = EXCLUDED.aceite_privacidade_em,
    versao_politica = EXCLUDED.versao_politica;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fim da migração V3 (CPF, CNPJ e aceite)
