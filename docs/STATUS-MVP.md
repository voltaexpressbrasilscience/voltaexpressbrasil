# Status e caminho até o MVP — Plataforma Volta Express

> Atualizado em 06/11/2026. Fonte: `docs/ROADMAP.md`, `docs/V3-ANOTACOES.md` (V1–V16), `CHANGELOG.md` e o estado do repositório.
> **MVP** aqui é: a plataforma em produção aceitando cadastros e anúncios reais, com segurança e LGPD resolvidas e o match v3 funcionando com dados reais.

## Onde estamos
| Item | Situação |
|---|---|
| Código | v3.1.0 (match v3 e mapas) em `main`, igual a `feature/projeto` e `developer-v3` (commit `bce1e3a`, 28/10/2026) |
| GitHub | Repositório privado `VoltaExpress/voltaexpress`; CI `qualidade.yml` (TypeScript, lint, testes, build) e `manter-supabase-ativo.yml` |
| Hospedagem | Netlify, domínio `voltaexpress.com.br` (GoDaddy). Não verificado nesta revisão |
| Documentação | `docs/` completa: arquitetura, match, decisões, roadmap, demonstração v3, roteiro do investidor |

## O que já foi feito
- **Segurança e base (Fase 1):** usuários sem leitura pública, contato por função segura, Edge Functions com CORS, login e limite; expiração diária de anúncios; criação de anúncio em transação.
- **Match (Fases 2 e v3):** PostGIS, rota no sentido certo, score 0–100 com motivos, raio proporcional, frete de retorno, "perto de mim", municípios do IBGE, cache de rota.
- **Produto (Fase 3 e v3):** Meu painel com pausar, reativar e encerrar; frete fechado; "Anunciar a volta"; oportunidades em lista e mapa; telefone só após "Tenho interesse".
- **v3 para investidor:** personas, CPF obrigatório e CNPJ opcional, Política de Privacidade com aceite registrado, Home do frete de retorno, identidade única com landing e Hub, erros em português, CI de qualidade.

## O que falta para o MVP
Em ordem de prioridade. Cada linha vira uma issue (ver a seção seguinte).

| # | Tarefa | Origem | Pronto quando |
|---|---|---|---|
| 1 | Tirar o `.env` do Git (`git rm --cached .env`) e restringir ou trocar a chave antiga do Google Maps | V2, V3 | `git ls-files .env` vazio; chave restrita aos domínios oficiais |
| 2 | Trocar a URL do remoto por uma sem credencial e revogar o token antigo | B0.0 do Hub | `git remote get-url origin` sem token |
| 3 | Aplicar as migrações v3 e m3 no **dev**, importar os municípios do IBGE, publicar a Edge Function `route-distance` | V4, V11, V12, V14 | Diagnóstico `docs/sql/00-diagnostico.sql` com todas as linhas `true` |
| 4 | Rodar o roteiro `docs/DEMONSTRACAO-V3.md` e o teste no celular (360 px) | V16 | Os 13 passos batem, sem rolagem lateral |
| 5 | Dados da empresa na Política de Privacidade e revisão jurídica | V5 | Sem campos entre colchetes em `src/pages/Privacidade.tsx`; parecer do advogado |
| 6 | ✅ Código (v3.2, local) · 🔄 advogado e dados da empresa. Página de Termos de Uso com aceite junto da Privacidade | Roadmap | Rota `/termos` e aceite registrado |
| 7 | ✅ Feito (v3.2, local). Validar CPF, CNPJ (dígito verificador) e telefone com DDD | Roadmap | Cadastro e Perfil recusam documento inválido |
| 8 | ✅ Migração escrita (v3.2, local) · 🔄 aplicar no dev. Exigir peso e volume também em `vt_criar_anuncio` | Roadmap | Função recusa anúncio de carga sem peso/volume |
| 9 | Validar a tabela de compatibilidade carga × carroceria | V6 | `docs/COMPATIBILIDADE-PARA-VALIDAR.md` respondido |
| 10 | Configurar os segredos do GitHub Actions (`SUPABASE_URL`, `SUPABASE_ANON_KEY` e os de dev) | V8 | Workflow `manter-supabase-ativo` roda sem pular |
| 11 | Produção: aplicar as migrações v3/m3, configurar `VITE_GOOGLE_MAPS_BROWSER_KEY` no Netlify e publicar | V1, Roadmap | Cadastro e anúncio reais funcionando em `voltaexpress.com.br` |

**Depois do MVP:** métricas para o Hub (anúncios, matches, contatos, fretes fechados por mês), match proativo por e-mail, preço de referência por tipo de veículo (ANTT), perfil verificado, precision@5 ≥ 0,8, bundle < 500 KB.

## Issues para criar (manualmente)
Sugestão de títulos e rótulos. Copie a coluna "Pronto quando" da tabela acima para o corpo da issue.

| # | Título | Rótulo |
|---|---|---|
| 1 | Segurança: tirar `.env` do Git e restringir a chave do Google Maps | `bug` |
| 2 | Segurança: remover credencial da URL do remoto e revogar o token | `bug` |
| 3 | Banco dev: aplicar migrações v3/m3, IBGE e `route-distance` | `enhancement` |
| 4 | QA: roteiro DEMONSTRACAO-V3 e teste no celular | `enhancement` |
| 5 | LGPD: dados da empresa e revisão jurídica da Política de Privacidade | `documentation` |
| 6 | LGPD: página de Termos de Uso com aceite | `enhancement` |
| 7 | Cadastro: validar CPF, CNPJ e telefone | `enhancement` |
| 8 | Banco: exigir peso e volume em `vt_criar_anuncio` | `enhancement` |
| 9 | Operação: validar a tabela de compatibilidade carga × carroceria | `question` |
| 10 | CI: configurar segredos do Supabase no GitHub Actions | `enhancement` |
| 11 | Produção: migrações v3/m3, variável do Maps no Netlify e publicação | `enhancement` |
| 12 | Pós-MVP: métricas mensais da plataforma para o Hub | `enhancement` |
| 13 | ✅ Código local (migração `20261110120000_v32_aceite_termos.sql` + Perfil) · 🔄 aplicar no dev. LGPD: coluna `versao_termos` em `vt_usuario` e aceite dos Termos no Perfil para contas antigas | `enhancement` |
| 15 | Pós-MVP: consultas da North Star prontas em `docs/sql/06-metricas-north-star.sql` (somente leitura; falta rodar e criar o schema no Hub, issue Hub #9) | `enhancement` |
| 14 | Roteiro único em `docs/APLICAR-NO-DEV.md`. Banco: aplicar no dev as migrações `20261109120000_v32_peso_volume_obrigatorio.sql` e `20261110120000_v32_aceite_termos.sql`; testar um anúncio de carga sem peso e um cadastro novo | `enhancement` |
