# Aplicar a v3 e a v3.2 no Supabase DEV — roteiro único

> 10/11/2026. Junta num só lugar os passos V4, V11–V14 e V16 de `docs/V3-ANOTACOES.md` e as 2 migrações da v3.2.
> **Só no projeto DEV.** Produção vem depois, com o mesmo roteiro, quando o DEV passar inteiro.
> Nenhum passo pede chave ou senha neste arquivo. As contas de teste estão em `docs/DEMONSTRACAO-V3.md`.

## Antes de começar (5 min)
1. Supabase → projeto **DEV** (confira o nome no topo da tela) → SQL Editor.
2. Rode `docs/sql/00-diagnostico.sql`, **bloco 3**, e anote o que está `false`. Ele diz de qual passo abaixo você começa.

O SQL Editor mostra só o resultado do último comando: cole e rode um arquivo por vez.

## Ordem
| # | O que | Arquivo | Pronto quando (diagnóstico, bloco 3) |
|---|---|---|---|
| 1 | CPF, CNPJ e aceite da Privacidade | `supabase/migrations/20261028120000_v3_cpf_cnpj_aceite.sql` | `M11: vt_usuario.cnpj` e `M11: aceite_privacidade` = `true` |
| 2 | Frete fechado | `supabase/migrations/20261028120100_v3_frete_fechado.sql` | `M12: evento fechado` = `true` |
| 3 | Match v3 | `supabase/migrations/20261029120000_m3_match_v3.sql` | as 4 linhas `M3` = `true` |
| 4 | Peso e volume obrigatórios no banco | `supabase/migrations/20261109120000_v32_peso_volume_obrigatorio.sql` | `V3.2: peso e volume no banco` = `true` |
| 5 | Aceite dos Termos de Uso | `supabase/migrations/20261110120000_v32_aceite_termos.sql` | `V3.2: aceite dos Termos` e `V3.2: cadastro grava Termos` = `true` |
| 6 | Municípios do IBGE | `docs/sql/05-importar-municipios.sql` (baixar o CSV, importar pelo Table Editor, blocos A, B e C) | bloco A mostra ~5.570 municípios |
| 7 | Dados de demonstração | `docs/sql/02-popular-demo.sql`, blocos 0 → 1 → 2 → 3 | bloco 3: 11 linhas com `ok = true` |
| 8 | Edge Function `route-distance` | `npx supabase functions deploy route-distance --project-ref <ref do DEV>` ou pelo painel (Edge Functions → colar `supabase/functions/route-distance/index.ts` → Deploy) | buscar a mesma rota 2 vezes gera 1 linha em `vt_rota_cache` |

Todas as migrações podem rodar mais de uma vez sem erro (`IF NOT EXISTS` / `CREATE OR REPLACE`). Se um passo falhar, pare e anote a mensagem: os seguintes dependem dele.

## Teste no app (20 min)
Com `VITE_GOOGLE_MAPS_BROWSER_KEY` no `.env.development.local` e `npm run dev` (http://localhost:8080):

| # | Teste | Esperado |
|---|---|---|
| T1 | Roteiro `docs/DEMONSTRACAO-V3.md` (13 passos) | Todos batem |
| T2 | Roteiro do Match v3 em `docs/V3-ANOTACOES.md` (7 passos, logado como Carlos) | Todos batem |
| T3 | Criar conta com CPF `111.111.111-11` | "CPF inválido. Confira os 11 números." e a conta não é criada |
| T4 | Criar conta nova válida (e-mail de teste com "+", ex.: `seuemail+teste1@gmail.com`) | Conta criada. No Table Editor, `vt_usuario` da conta tem `aceite_privacidade_em`, `aceite_termos_em` e `versao_termos = 2026-11-09` |
| T5 | Perfil de uma conta antiga (U1 a U4) | Aparece a caixa "Li e aceito os Termos de Uso"; marcar e salvar grava a data |
| T6 | Anunciar carga com peso e volume | Anúncio criado. A recusa sem peso já está coberta pela tela e pelo diagnóstico (`V3.2: peso e volume no banco`); no SQL Editor a função pede login antes (`auth.uid()` vazio) |
| T7 | `/termos` e `/privacidade` | As duas abrem, com os links no rodapé |
| T8 | Celular (DevTools, 360 px): Home, Criar conta, Anunciar, Match, Meu painel, Perfil | Sem rolagem lateral |

## Depois do DEV
- Marque no `docs/STATUS-MVP.md` os itens 3, 4 e 14 como feitos, com a data.
- Produção: mesmo roteiro (passos 1 a 6 e 8; **o 7 não**, porque cria dados fictícios). Antes, preencha os dados da empresa na Privacidade e nos Termos (item 5 do STATUS-MVP) e configure `VITE_GOOGLE_MAPS_BROWSER_KEY` no Netlify.
