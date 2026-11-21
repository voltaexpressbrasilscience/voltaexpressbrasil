---
name: veb-fechamento-do-dia
description: Fecha o dia de trabalho da VEB. Confere que tudo está commitado e mesclado localmente, roda os testes, grava o fechamento no diário e manda o relatório ao Douglas e à DG mundo. Use no fim do dia ou quando o plano do dia terminar.
---

# Fechamento do dia — VEB

## 1. Conferir o estado
Para cada repositório, rode `git status -sb`:
- nada pode ficar sem commit;
- as branches de trabalho do dia precisam estar mescladas (`git branch --merged <developer>`);
- anote quantos commits a developer está à frente da origem.

Rode os testes do que mudou no dia:
- landing: `npm run check:links` e `npm test`;
- Hub: `validar_dados.py`;
- plataforma: `tsc`, `lint`, `test` e `build`.

Confira também que nenhum servidor aberto por você ficou rodando.

## 2. Diário
Acrescente `## Fechamento do dia (HHhMM)` ao `voltaexpress/docs/diario/dia-AAAA-MM-DD.md`:
- **Plano:** quantas tarefas foram cumpridas, de quantas, e o motivo das que ficaram.
- **Qualidade:** números dos testes, bugs achados e corrigidos.
- **Não verificado:** o que só dá para conferir depois do push (CI, deploy, prévia de compartilhamento).
- **Com o Douglas:** push, S1–S10, banco, decisões, issues para fechar.

Faça o commit local direto na `developer-v3` (exceção do diário).

## 3. Avisar
Use a skill `veb-sinalizar`:
- **Douglas:** relatório no chat, com uma tabela das tarefas (início, fim e evidência) e o que é dele;
- **DG mundo:** de 5 a 7 linhas, no formato `VEB dd/mm`.

## 4. Cópia versionada das regras
Rode `python docs/ia/sincronizar.py --conferir` na plataforma. Se a regra ou a skill mudou hoje, rode sem `--conferir` e faça o commit `docs(ia): …` direto na `developer-v3`, junto com o diário.

## 5. Memória
- Se o Douglas deu uma regra nova durante o dia, coloque no `C:\veb\CLAUDE.md`, que é a fonte única, e registre no diário.
- Não crie memória que repita o que já está no `CLAUDE.md`.
