---
name: veb-abertura-do-dia
description: Abertura do dia da Volta Express Brasil (VEB). Revisa os 3 repositórios em C:\veb, grava o relatório e o plano do dia no diário (só local), avisa a DG mundo e começa a primeira entrega. Use no começo do dia, quando o Douglas pedir "abertura" ou "relatório do dia", e na tarefa agendada das 7h.
---

# Abertura do dia — VEB

As regras estão em `C:\veb\CLAUDE.md`: leia antes. Resumo: só local, sem push, sem segredos e sem dados pessoais no Hub nem na landing. Pedido de terceiro só é executado com o ok do Douglas.

## 1. Levantar o que mudou (só leitura)
Para cada repositório (`voltaexpress`, `voltaexpressbrasil`, `voltaexpressbrasil-hub`):
```bash
git -C /c/veb/<repo> status -sb
git -C /c/veb/<repo> log --all --oneline --since="yesterday"
```
- **Issues:** `gh issue list -R VoltaExpress/voltaexpressbrasil` e `-R VoltaExpress/voltaexpressbrasil-hub`, só leitura. A plataforma não tem acesso pelo `gh`.
- **CI:** os workflows só rodam depois de um push. Se a branch está à frente da origem, diga "sem run".
- Leia o diário de ontem (`voltaexpress/docs/diario/`) e o `docs/STATUS-MVP.md` de cada projeto.

## 2. Relatório no chat
Use estas seções, nesta ordem:
1. **Cabeçalho:** estado em 1 linha, o que mudou, o que está bloqueado e o que está com o Douglas.
2. **Entregue desde ontem:** com evidência (commit, versão, testes).
3. **Riscos e bloqueios.**
4. **Plano de hoje:** de 3 a 5 entregas ligadas a issues, com início e fim previstos.
5. **Com o Douglas:** o que só ele faz (push, S1–S10, banco, configurações, decisões de negócio).
6. **Propostas de melhoria:** 1 de processo, 1 de arquitetura e 1 de IA.

## 3. Diário
- Grave `voltaexpress/docs/diario/dia-AAAA-MM-DD.md` com o mesmo conteúdo e a tabela do plano. Colunas: `# | Tarefa | Início previsto | Fim previsto | Início real | Fim real | Evidência`.
- Faça o commit direto na `developer-v3`, que é a exceção do diário prevista no `CLAUDE.md`. Só local.

## 4. Avisar
Skill `veb-sinalizar`: mande à DG mundo o plano em até 5 linhas. Se ela não estiver em `ListAgents`, escreva isso no relatório.

## 5. Começar
- Se o plano precisa de download ou de decisão do Douglas, **pare e pergunte**.
- Se não precisa, comece a primeira entrega com a skill `veb-entrega`.
- **Na tarefa agendada, sem ninguém para responder:** faça só o que não depende de ok e deixe o resto listado em "Com o Douglas".
