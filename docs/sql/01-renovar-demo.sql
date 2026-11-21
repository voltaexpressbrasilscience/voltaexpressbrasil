-- Renovar os dados de demonstração — SOMENTE NO PROJETO DEV
-- Uso: na véspera da apresentação, para os anúncios de teste não estarem vencidos.
-- O que faz: pega os anúncios dos 4 usuários de demonstração (docs/DEMONSTRACAO-V3.md), desloca todas as datas
-- para que o primeiro anúncio comece daqui a 7 dias (mantendo a distância entre eles) e reativa todos.
-- Não toca em nenhum outro usuário. Rode o bloco 1 primeiro para conferir.

-- 1. Conferir quais anúncios serão alterados (só leitura)
SELECT u.nome, a.tipo_anuncio, a.status, a.data_disponivel_inicio, a.data_disponivel_fim
FROM public.vt_anuncio a
JOIN public.vt_usuario u ON u.user_id = a.user_id
WHERE u.nome IN ('Carlos Andrade', 'Marta Ribeiro', 'Laticínios Serra Verde (fictícia)', 'Distribuidora Rota Sul (fictícia)')
ORDER BY a.data_disponivel_inicio;

-- 2. Renovar
WITH demo AS (
  SELECT a.id
  FROM public.vt_anuncio a
  JOIN public.vt_usuario u ON u.user_id = a.user_id
  WHERE u.nome IN ('Carlos Andrade', 'Marta Ribeiro', 'Laticínios Serra Verde (fictícia)', 'Distribuidora Rota Sul (fictícia)')
),
desloc AS (
  SELECT (current_date + 7) - min(a.data_disponivel_inicio) AS dias
  FROM public.vt_anuncio a JOIN demo d ON d.id = a.id
)
UPDATE public.vt_anuncio a
SET data_disponivel_inicio = a.data_disponivel_inicio + desloc.dias,
    data_disponivel_fim    = a.data_disponivel_fim + desloc.dias,
    status = 'ATIVO',
    updated_at = now()
FROM demo, desloc
WHERE a.id = demo.id;

-- 3. (Opcional) Zerar os indicadores do painel dos usuários de demonstração antes de apresentar
-- DELETE FROM public.vt_match_evento e
-- USING public.vt_usuario u
-- WHERE (e.user_id = u.user_id OR e.anuncio_id IN (SELECT id FROM public.vt_anuncio WHERE user_id = u.user_id))
--   AND u.nome IN ('Carlos Andrade', 'Marta Ribeiro', 'Laticínios Serra Verde (fictícia)', 'Distribuidora Rota Sul (fictícia)');
