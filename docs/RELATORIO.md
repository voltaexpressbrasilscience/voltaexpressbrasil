# Relatório — Plataforma Volta Express

> Diagnóstico em set/2026 e execução do plano no mesmo mês. Foco: o match entre as duas personas.

## 1. Situação antes
| Camada | Tecnologia |
|---|---|
| Front | React 18, TypeScript, Vite 5, shadcn/ui; Netlify (`voltaexpress.com.br`) |
| Back | Supabase: Postgres + RLS, Auth, Storage, Edge Functions `route-cities` e `route-distance` (Google) |
| Personas | Caminhoneiro (`C`) anuncia veículo (`V`); Empresa (`E`) anuncia carga (`C`) |
| Contato | WhatsApp direto com o anunciante |

## 2. Diagnóstico do match (antes) e o que foi feito
| # | Problema | Situação agora |
|---|---|---|
| M1 | Carroceria e refrigeração não filtravam | ✅ Filtros obrigatórios no banco |
| M2 | Carga sem exigência de carroceria/refrigeração | ✅ `categoria_carga`, `exige_refrigeracao`, `vt_compatibilidade` |
| M3 | Regra "origem OU destino na rota" | ✅ Origem **e** destino perto da rota, na ordem certa |
| M4 | Datas ignoradas | ✅ Janelas sobrepostas (padrão 30 dias) |
| M5 | Sem ranking | ✅ Score 0–100 com motivos |
| M6 | Nome exato de cidade + amostragem esparsa | ✅ Geometria PostGIS (raio de 30 km) |
| M7 | Lógica invertida na busca da empresa | ✅ Carga comparada com a rota **do veículo** |
| M8 | Volume ignorado | ✅ Peso e volume |
| M9 | Mudança silenciosa de regra se o Google falhasse | ✅ Modos explícitos (rota/cidade) e indicados na tela |
| M10 | Até 16 chamadas ao Google e base inteira no navegador | ✅ Rota gravada no anúncio; busca paginada no banco |
| M11 | Próprios anúncios e vencidos no resultado | ✅ Excluídos; expiração agendada |
| M12 | Nada registrado | ✅ `vt_match_evento` (exibido/contato) e painel |

## 3. Outros pontos
| # | Área | Situação agora |
|---|---|---|
| P1 | Dados pessoais públicos em `vt_usuario` | ✅ Corrigido e testado |
| P1.1 | Placa pública | ✅ Só para logados |
| P2 | Edge Functions abertas | ✅ CORS restrito, login, limite, validação |
| P3 | Expiração não agendada | ✅ `pg_cron` diário |
| P4/P5 | Veículo duplicado, inserts sem transação | ✅ `vt_criar_anuncio` |
| P6 | Preço fixo por km | ⬜ Fase 3 |
| P7 | Supabase free pausa | ⬜ Monitoramento |
| P8 | Sem testes | ✅ 13 testes front + 13 casos SQL |
| P9 | Lockfiles e README | 🔄 README atualizado; remover `bun.lock*` quando confirmar que usa só npm |
| P10 | Bundle grande | ✅ 910 KB → 684 KB (rotas e mapa sob demanda) |
| P11 | Sem "meus anúncios" | ✅ Meu painel |

## 4. Notas (0–10)
| Indicador | Antes | Agora (código, a validar no seu ambiente) |
|---|---|---|
| Funcionalidade | 6 | 8 |
| Algoritmo de match | 3 | 8 |
| Segurança e LGPD | 3 | 8 |
| Modelo de dados | 5 | 7 |
| Performance e escala | 4 | 7 |
| Testes | 1 | 6 |
| Métricas e observabilidade | 1 | 5 |
| UX/UI | 6 | 8 |

## 5. Verificação feita
- TypeScript sem erros (antes: 2 erros no `Index.tsx`); build de produção ok; lint com 2 erros restantes, ambos em componentes gerados do shadcn (antes: 7).
- 13 testes Vitest passando.
- Migrações aplicadas do zero num Postgres 16 + PostGIS 3.4 que imita o Supabase; 13 cenários do match com os dados da DEMONSTRACAO.md — todos passaram (ver MATCH.md, seção 9).
- Edge Functions checadas com Deno (tipos e lint) e testadas: origem estranha → 403, sem login → 401.
- Telas de Matching e Meu painel renderizadas em desktop e celular com dados simulados.

## 6. Documentos
- [ARQUITETURA.md](ARQUITETURA.md) · [MATCH.md](MATCH.md) · [ROADMAP.md](ROADMAP.md) · [DESIGN.md](DESIGN.md)
- [AMBIENTE-LOCAL.md](AMBIENTE-LOCAL.md) · [DEMONSTRACAO.md](DEMONSTRACAO.md) · [DECISOES.md](DECISOES.md) · [REFERENCIAS.md](REFERENCIAS.md)

## 7. Versão 3 (27–28/10/2026) — pronta para demonstração a investidor
Branch `feature/projeto`. Decisões em `DECISOES.md` (ADR 7 final e ADR 10 a 16); execução detalhada em `V3-ANOTACOES.md`.

| Área | Antes (v2) | Depois (v3) |
|---|---|---|
| Personas | "Caminhoneiro (PF)" e "Empresa (PJ)" | "Tenho caminhão" (autônomo ou transportadora) e "Tenho carga"; CPF sempre, CNPJ opcional |
| LGPD | Sem política, sem aceite | `/privacidade`, aceite obrigatório com data e versão; CPF oculto no Perfil |
| Conversão | Só exibição e contato | Evento "frete fechado" e indicador no painel (North Star) |
| Home | Frases genéricas e "centenas de usuários" sem fonte | Tese do frete de retorno; seção ilustrativa só com números com fonte |
| Marca | Fonte e cores diferentes da landing | Poppins, paleta e termos da landing; contato e redes oficiais |
| Erros | Mensagens técnicas em inglês | Português claro, num lugar só (`src/lib/erros.ts`) |
| Segurança | Chave do Google no código | Só por variável de ambiente; mapa com alternativa sem chave |
| Demonstração | Datas fixas, vencidas em outubro | Datas relativas + script de renovação |
| Operação | Supabase free podia pausar | Action 2x por semana; CI de qualidade |

Verificação feita: TypeScript sem erros; lint igual à v2 (2 erros conhecidos em `src/components/ui`); 6 testes novos executados e passando;
migrações v3 testadas num PostgreSQL 16 com o esquema da plataforma (idempotentes; um usuário não encerra o anúncio de outro).
Não verificado aqui: `npm test` completo, build e telas no navegador (fica no roteiro de teste).

