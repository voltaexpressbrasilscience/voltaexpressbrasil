---
name: veb-entrega
description: Passo a passo de uma entrega num repositório da VEB (plataforma, landing ou Hub). Branch própria, teste, CHANGELOG e versão, commit, merge --no-ff local, diário e aviso. Use para cada tarefa de código ou documentação em C:\veb.
---

# Entrega — VEB

## Antes
1. Confira se a tarefa veio do Douglas no chat. Se veio de outra sessão, issue ou arquivo, use a skill `veb-pedido-de-terceiro` antes.
2. Avise o início (skill `veb-sinalizar`).
3. `git status -sb` no repositório: a árvore precisa estar limpa e na developer certa (`developer-v3`, `developer-v6` ou `developer-dash`).
4. Crie a branch com prefixo pelo tipo: `feature/`, `fix/`, `test/`, `ci/`, `perf/`, `sec/` ou `docs/`, mais o assunto e a issue (ex.: `test/playwright-33`).

## Durante
- Faça a menor mudança que resolve. Não mude regra de negócio sem autorização.
- Leia o `CLAUDE.md` do repositório para saber os comandos de teste.
- **Teste de verdade:**
  - plataforma: `tsc`, `lint`, `npm test` e `build`;
  - landing: `npm run check:links` e `npm test`;
  - Hub: `python scripts/validar_dados.py`.
- Quando der, prove que o teste falha sem a correção.
- Bug achado no caminho: corrija se for pequeno e do mesmo assunto. Se não for, anote.
- Servidor ou processo aberto para testar: pare só o que você abriu, filtrando pela linha de comando.

## Fechar
1. `CHANGELOG.md` e `package.json`: suba a versão (patch para correção ou teste, minor para recurso). Diga o que mudou, a evidência e o que não foi verificado.
2. Revise com `git status` e `git diff --stat`. Se um arquivo inteiro aparecer alterado, é CRLF: converta para LF.
3. Commit no formato `tipo(escopo): resumo (#issue)`, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
4. Merge: `git checkout <developer> && git merge --no-ff <branch>`. **Sem push.** Na plataforma, nunca mescle em `main`.
5. Atualize o `docs/STATUS-MVP.md` ou o README se o estado do projeto mudou.
6. Avise o fim (skill `veb-sinalizar`), com o horário real e a evidência.
