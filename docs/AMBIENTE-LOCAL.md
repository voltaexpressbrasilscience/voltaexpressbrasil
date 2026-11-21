# Ambiente local — Plataforma Volta Express

## Por que um projeto Supabase separado
Rodar localmente apontando para o banco de produção mistura dados de teste com anúncios reais.
Use um projeto **gratuito** de desenvolvimento (o plano free permite 2 projetos). A produção não é tocada.

## Pré-requisitos
- Node.js 20 ou superior (`node --version`)
- Git Bash
- Conta no Supabase

## 1. Criar o projeto de desenvolvimento
1. https://supabase.com/dashboard → **New project**.
2. Nome: `voltaexpress-dev` · Região: São Paulo (sa-east-1) · anote a senha do banco.

## 2. Aplicar as migrações (uma vez cada, nesta ordem)
No projeto dev: **SQL Editor → New query**. Abra cada arquivo de `supabase/migrations/`, cole e clique em **Run**:

| # | Arquivo | O que faz |
|---|---|---|
| 1 | `20260209231304_…sql` | Tabelas e políticas |
| 2 | `20260210114155_…sql` | Ajuste das políticas de inserção |
| 3 | `20260211205459_…sql` | Leitura de veículos de anúncios ativos |
| 4 | `20260211210334_…sql` | Trigger que cria o perfil no cadastro |
| 5 | `20260212135207_…sql` | Fotos (Storage) |
| 6 | `20260307220559_…sql` | `pg_cron` e função de expiração |
| 7 | `20260928120000_p1_protege_dados_usuario.sql` | **P1** — dados pessoais protegidos |
| 8 | `20260928120100_p1_1_placa_somente_logados.sql` | **P1.1** — placa só para logados |
| 9 | `20260928120200_p3_agenda_expiracao.sql` | **P3** — expiração diária |
| 10 | `20260928120300_m2_match_v2.sql` | **Match v2** — PostGIS, compatibilidade, score, interesse, painel |

A migração 10 ativa a extensão **PostGIS** sozinha. Se aparecer erro de permissão, ative em **Database → Extensions → postgis** e rode de novo.

Rode cada migração uma única vez. A 7 falha de propósito se rodada depois da 10 (a 10 altera a função de contatos).

## 3. Configurar a autenticação (somente no dev)
- **Authentication → Sign In / Providers → Email**: desligue **Confirm email**.
- **Authentication → URL Configuration**: Site URL `http://localhost:8080` · Redirect URLs `http://localhost:8080/**`.

## 4. Variáveis de ambiente
Crie `.env.development.local` na raiz (ignorado pelo Git; tem prioridade sobre o `.env` no `npm run dev`):

```
VITE_SUPABASE_URL=https://SEU-PROJETO-DEV.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA_DEV
VITE_GOOGLE_MAPS_BROWSER_KEY=SUA_CHAVE_DO_MAPS_PARA_NAVEGADOR
```

URL e chave ficam em **Project Settings → API** do projeto **dev**. A chave do Maps é opcional: sem ela, o código usa a chave antiga como reserva.

## 5. Rodar
```bash
cd /c/ambiente-projeto/veb/voltaexpress
npm install
npm run dev
```
Abra http://localhost:8080.

Outros comandos:
```bash
npm test          # 13 testes
npm run build     # build de produção
```

## 6. Rotas no mapa e preço sugerido (Google) — recomendado
Sem esta etapa a plataforma funciona, mas o Match usa o **modo cidade** (origem e destino iguais) e não mostra o preço de referência.

1. Google Cloud: ative **Directions API** e crie uma chave de **servidor** (restrinja à Directions API).
2. Rode:
```bash
npx supabase login
npx supabase secrets set GOOGLE_MAPS_API_KEY=SUA_CHAVE_SERVIDOR --project-ref SEU_REF_DEV
npx supabase functions deploy route-distance --project-ref SEU_REF_DEV
```
`SEU_REF_DEV` é o código na URL: `https://SEU_REF_DEV.supabase.co`. O deploy leva junto a pasta `_shared/`.

As funções só aceitam usuário logado e as origens `https://voltaexpress.com.br`, `https://www.voltaexpress.com.br` e `http://localhost:8080`. Para outras, defina o segredo `ALLOWED_ORIGINS` (separadas por vírgula).

## 7. Verificações rápidas
Visitante sem login não lê dados de usuários:
```bash
curl "https://SEU-PROJETO-DEV.supabase.co/rest/v1/vt_usuario?select=nome,documento" -H "apikey: SUA_CHAVE_PUBLICA_DEV"
```
Esperado: `[]`

Visitante sem login não usa o match:
```bash
curl -X POST "https://SEU-PROJETO-DEV.supabase.co/rest/v1/rpc/vt_match_cargas" -H "apikey: SUA_CHAVE_PUBLICA_DEV" -H "Content-Type: application/json" -d '{"p":{}}'
```
Esperado: erro `permission denied`.

## 8. Levar para produção (depois de validar no dev)
1. SQL Editor do projeto de **produção**: rode as migrações 7, 8, 9 e 10, nesta ordem.
2. Deploy das Edge Functions em produção (mesmos comandos, com o ref de produção).
3. Netlify: adicione `VITE_GOOGLE_MAPS_BROWSER_KEY` e publique o front (merge na `main`).
4. Google Cloud: restrinja a chave do navegador aos domínios `voltaexpress.com.br` e `localhost:8080`.

Entre o passo 1 e o 3, anúncios antigos continuam funcionando (sem rota gravada, usam o modo cidade).

## 9. Problemas comuns
| Sintoma | Causa provável |
|---|---|
| `Invalid API key` | URL e chave de projetos diferentes |
| `function vt_criar_anuncio does not exist` | Migração 10 não aplicada no projeto em uso |
| `type "geography" does not exist` | PostGIS não ativado (ver passo 2) |
| "Match pelas cidades (rota indisponível)" | Edge Function sem deploy ou sem `GOOGLE_MAPS_API_KEY` |
| Mapa não carrega | Chave do navegador não permite `localhost` |
| `duplicate key … documento` no cadastro | CPF/CNPJ repetido (campo único) |
