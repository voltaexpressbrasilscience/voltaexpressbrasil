# docs/ia: cópia versionada das regras e skills do Claude

> Pedido do Douglas em 13/11/2026 ("Sim, guardar"), a partir de uma sugestão da DG mundo: a mesma solução do repositório engenharia (#16).
> Arquitetura completa: [`../IA-ARQUITETURA.md`](../IA-ARQUITETURA.md).

## O que tem aqui
| Arquivo | Cópia de | Para quê |
|---|---|---|
| `CLAUDE-raiz.md` | `C:\veb\CLAUDE.md` | Regras de toda sessão em `C:\veb` (fonte única) |
| `skills/<nome>/SKILL.md` | `C:\veb\.claude\skills\<nome>\SKILL.md` | As 5 skills da VEB |
| `sincronizar.py` | — | Copia, confere ou restaura |

**A fonte de verdade é `C:\veb`**, porque é dali que o Claude lê. Esta pasta é o histórico e o backup: sem ela, uma troca de máquina ou uma edição errada apagaria as regras sem volta.

## Como usar
```bash
python docs/ia/sincronizar.py --conferir    # iguais? sai com 1 se não estiverem
python docs/ia/sincronizar.py               # depois de mudar uma regra ou skill: copia para cá; aí faça o commit
python docs/ia/sincronizar.py --restaurar   # máquina nova ou edição errada: devolve a C:\veb
```
- **Quando mudar uma regra ou skill:** edite em `C:\veb`, rode `sincronizar.py`, faça o commit (`docs(ia): …`) e registre no diário. A skill `veb-fechamento-do-dia` confere com `--conferir`.
- **O script nunca apaga:** se um arquivo existe só de um lado, ele avisa e você decide.

## Passo do Douglas
Numa máquina nova, depois de clonar a plataforma em `C:\veb\voltaexpress`, rode `python docs/ia/sincronizar.py --restaurar`. Isso recria o `C:\veb\CLAUDE.md` e as skills.

Ligar a pasta da máquina direto ao repositório (com link simbólico, como no engenharia#16) é opcional. Exige permissão de administrador no Windows, por isso fica com você.
