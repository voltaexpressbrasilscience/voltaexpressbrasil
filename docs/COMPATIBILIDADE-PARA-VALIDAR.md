# Compatibilidade carga × carroceria — para validar com a operação

> v3 (T3.6). **Nada aqui foi alterado no banco.** É a regra que o match usa hoje (tabela `vt_compatibilidade`,
> migração M2) e sugestões para você confirmar, corrigir ou descartar. Mudar a regra não exige deploy:
> é um `INSERT`/`DELETE` na tabela (comandos no fim).

## 1. Regra atual
Uma carga só aparece para um caminhão se a carroceria estiver na lista da categoria. Se a carga exige refrigeração,
o caminhão também precisa ser refrigerado.

| Categoria da carga | Carrocerias aceitas hoje | Você confirma? |
|---|---|---|
| Carga seca | Baú, Sider | ☐ sim ☐ não |
| Refrigerada | Baú (refrigerado) | ☐ sim ☐ não |
| Granel sólido | Graneleiro | ☐ sim ☐ não |
| Líquidos | Tanque | ☐ sim ☐ não |
| Máquinas e volumes grandes | Plataforma | ☐ sim ☐ não |
| Veículos | Cegonha | ☐ sim ☐ não |
| Mudança | Baú, Sider | ☐ sim ☐ não |

Carrocerias que o sistema conhece hoje: Baú, Sider, Graneleiro, Tanque, Plataforma, Cegonha.

## 2. Pontos para decidir (sugestões, não aplicadas)
| # | Pergunta | Por que importa | Sugestão |
|---|---|---|---|
| S1 | Carga seca paletizada e amarrada pode ir em **Plataforma** ou **Graneleiro**? | Hoje um caminhão graneleiro nunca vê carga seca, mesmo sacaria, que costuma ir assim | Incluir Graneleiro para carga seca |
| S2 | **Algodão em fardos** (2º produto mais citado na pesquisa com embarcadores) entra em qual categoria? | Não existe categoria própria; o embarcador pode escolher errado | Orientar como "Carga seca" no texto de ajuda e aceitar Sider e Graneleiro |
| S3 | Faltam carrocerias comuns no Brasil: **Caçamba, Grade baixa, Porta-contêiner, Prancha**? | Motoristas com essas carrocerias não conseguem anunciar corretamente | Incluir as que a operação considera relevantes |
| S4 | Mudança em **Plataforma** (com lona)? | Pequenas mudanças de interior | Manter só Baú e Sider |

## 3. Como aplicar depois de validar (exemplos)
```sql
-- incluir uma combinação
INSERT INTO public.vt_compatibilidade (categoria_carga, tipo_carroceria) VALUES ('Carga seca', 'Graneleiro')
ON CONFLICT DO NOTHING;
-- retirar uma combinação
DELETE FROM public.vt_compatibilidade WHERE categoria_carga = 'Mudança' AND tipo_carroceria = 'Sider';
```
Carroceria nova também precisa entrar na lista da tela (`tiposCarroceria` em `src/lib/catalogos.ts`).
