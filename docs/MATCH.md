# Especificação — Match (v2 em set/2026; v3 em out/2026)

> **Match v3** (migração `20261029120000_m3_match_v3.sql`): resumo na seção 11 e análise da nota em [MATCH-PONTUACAO-V3.md](MATCH-PONTUACAO-V3.md). As seções 1 a 10 descrevem a v2 e continuam válidas, exceto onde a seção 11 diz o contrário.

## 1. Objetivo
Conectar cada veículo com rota disponível às cargas que cabem no caminho dele, **no sentido certo e na data certa**, ordenadas pelo melhor aproveitamento. Objetivo de negócio: eliminar a viagem vazia (frete de retorno).

## 2. Regras de negócio preservadas
- Duas personas: caminhoneiro anuncia veículo e rota (`V`); empresa anuncia carga (`C`).
- Negociação direta entre as partes, via WhatsApp.
- A plataforma sugere e registra; não intermedeia pagamento.

## 3. Onde está o código
| Peça | Arquivo |
|---|---|
| Banco (tabelas, funções, regras) | `supabase/migrations/20260928120300_m2_match_v2.sql` |
| Criação do anúncio com rota | `vt_criar_anuncio(p jsonb)` · `src/lib/anuncio-service.ts` |
| Match motorista → cargas | `vt_match_cargas(p jsonb)` · `src/lib/matching-service.ts` |
| Match empresa → veículos | `vt_match_veiculos(p jsonb)` · `src/lib/matching-service.ts` |
| Contato com registro | `vt_registrar_interesse(p_anuncio, p_score)` · `src/hooks/use-interesse.ts` |
| Rota (Google) | Edge Function `route-distance` · `src/lib/rota-service.ts` |
| Tela | `src/pages/Matching.tsx`, `src/components/AnuncioCard.tsx` |

## 4. Modelo de dados (novidades)
| Tabela / coluna | Uso |
|---|---|
| `vt_anuncio.rota` (PostGIS `geography LineString`) e `distancia_km` | Rota gravada na criação do anúncio (polyline do Google) |
| `vt_localizacao.latitude/longitude` | Agora preenchidas (antes vazias) |
| `vt_mercadoria.categoria_carga`, `exige_refrigeracao` | Exigências da carga |
| `vt_compatibilidade` | Categoria de carga × carroceria (regra de negócio editável) |
| `vt_match_config` | Pesos do score, raio (30 km), janela (30 dias), referência R$ 6,50/km |
| `vt_match_evento` | `exibido` e `contato` — base do funil e das métricas do Hub |

## 5. Etapa 1 — Filtros obrigatórios
1. Anúncio `ATIVO` e `data_fim >= hoje`.
2. Anúncio de outro usuário.
3. Carroceria compatível com a categoria da carga (`vt_compatibilidade`).
4. Refrigeração, quando a carga exige.
5. Peso ≤ capacidade de peso; volume ≤ capacidade de volume.
6. Janelas de data sobrepostas (sem datas: hoje até +30 dias).

### Compatibilidade inicial (PROPOSTA — validar com a operação)
| Categoria da carga | Carrocerias aceitas |
|---|---|
| Carga seca | Baú, Sider |
| Refrigerada | Baú (com refrigeração) |
| Granel sólido | Graneleiro |
| Líquidos | Tanque |
| Máquinas e volumes grandes | Plataforma |
| Veículos | Cegonha |
| Mudança | Baú, Sider |

Para mudar: editar a tabela `vt_compatibilidade` no Supabase (Table Editor). Não precisa de deploy.

## 6. Etapa 2 — Encaixe geográfico (três modos)
| Modo | Quando | Regra |
|---|---|---|
| **rota** | Há rota (Google) e coordenadas | Origem e destino da carga a até **R km** da rota do veículo, e a origem **antes** do destino na rota (`ST_LineLocatePoint`) |
| **cidade** | Sem rota, mas com cidade de origem e de destino | Mesma cidade de origem e de destino (sem acento, sem maiúsculas) |
| **parcial / livre** | Só UF, só uma cidade ou nada | Filtra pelo que foi informado; o score de rota fica neutro |

## 7. Etapa 3 — Score (0 a 100)
| Componente | Peso | Cálculo (0 a 1) |
|---|---|---|
| Desvio | 35 | 1 − desvio ÷ (2 × R) |
| Aproveitamento da rota | 20 | fração da rota usada pela carga |
| Proximidade de data | 15 | 1 − dias até a coleta ÷ 30 |
| Uso de capacidade | 15 | média de peso÷capacidade e volume÷capacidade |
| Valor por km | 10 | Cargas: (R$/km ÷ 6,50) ÷ 1,5 · Veículos: 6,50 ÷ (R$/km) |
| Anunciante | 5 | perfil com foto = 1; sem foto = 0,6 |

Cada resultado traz **motivos** em texto: "desvio de 12 km · usa 37% da sua rota · coleta em 2 dia(s) · 80% da capacidade · R$ 6,14/km".

## 8. Privacidade
- Funções de match só para usuários logados; visitantes recebem `permission denied`.
- O telefone não vem no resultado: só é liberado por `vt_registrar_interesse`, que grava o evento `contato` (um por pessoa a cada 30 minutos).
- `vt_anunciantes` devolve só nome e foto.

## 9. Resultado dos testes (Postgres 16 + PostGIS 3.4, dados de DEMONSTRACAO.md)
| Caso | Esperado | Obtido |
|---|---|---|
| Carlos JF→SP, com rota | só C2 | ✅ C2 (score 84) |
| Carlos JF→SP, sem Google | só C2 | ✅ C2 |
| Carlos SP→JF (retorno) | só C3 | ✅ C3 (83) |
| Marta BH→RJ refrigerado, com rota | só C1 (JF fica no caminho) | ✅ C1 (72) |
| Marta sem cidades | C1, C2, C3 (C4 incompatível) | ✅ C1 57 · C2 53 · C3 50 |
| Baú não refrigerado não recebe carga refrigerada | C2, C3 | ✅ |
| Rota Sul busca veículo SP→JF | só V2 (V1 é sentido contrário) | ✅ V2 (87) |
| Serra Verde, carga refrigerada JF→RJ | só V3 | ✅ V3 (68) |
| Bobinas de aço (C4) | nenhum veículo | ✅ |
| Janela em novembro | nenhum | ✅ |
| Dono não vê o próprio anúncio | ✅ | ✅ |
| Visitante chama o match | negado | ✅ `permission denied` |
| Mesma placa em dois anúncios | 1 veículo | ✅ reaproveitado |

## 10. Próximas evoluções
- Match proativo: ao criar anúncio, gravar as melhores sugestões e avisar por e-mail.
- Ajustar pesos com dados reais (taxa de contato e de fechamento por faixa de score).
- Precision@5 em conjunto de pares avaliado pela operação (meta ≥ 0,8).

## 11. Match v3 (out/2026)
| Peça | O que mudou | Onde |
|---|---|---|
| Raio | Proporcional: 5% da rota, entre 25 e 60 km (`raio_pct`, `raio_min_km`, `raio_max_km`). `raio_pct = 0` volta ao raio fixo | `vt_raio_km()` |
| Desempenho | Pré-filtro por índice: `ST_DWithin` em `vt_localizacao.ponto` (nova coluna calculada + GIST) e em `vt_anuncio.rota` (índice que já existia e não era usado) | funções de match |
| Modo cidade | Desvio e aproveitamento valem `nota_modo_cidade` (0,7) em vez de 1; motivo "rota não calculada" | funções de match |
| Pesos | Aproveitamento 20 → 15, valor 10 → 15 (`versao_pesos = 'v3'`) | `vt_match_config` |
| Motivos | "coleta e entrega a X km da sua rota (≈ Y km a mais na estrada)", "coleta no km X da sua rota", "caminhão voltando de viagem (frete de retorno)" | funções de match |
| Frete de retorno | Caminhão que tem outro anúncio do mesmo veículo terminando a até 50 km da origem deste: selo e +5 (`bonus_retorno`) | `vt_match_veiculos` |
| Perto de mim | `perto_lat`, `perto_lng`, `perto_km` (5 a 300; padrão 50): coleta a até X km da posição | `vt_match_cargas` |
| Novas colunas no resultado | `modo`, `raio_km`, `km_coleta`, `desvio_estrada_km`, `origem_lat/lng`, `destino_lat/lng` e, nos caminhões, `frete_retorno` | as duas funções |
| Municípios IBGE | `vt_uf`, `vt_municipio`, `vt_buscar_municipios(q, uf)`; gatilho preenche latitude/longitude de `vt_localizacao` quando faltam | importação: `docs/sql/05-importar-municipios.sql` |
| Valor por tipo de veículo | `vt_valor_referencia` (vazio = R$ 6,50 geral) | preencher com a calculadora da ANTT |
| Cache de rota | `vt_rota_cache` (30 dias), lido e gravado só pela Edge Function `route-distance` (service role) | `supabase/functions/route-distance` |
| Mapa | `vt_rota_anuncio(id)` devolve a rota gravada; o mapa não pede outra ao Google | `RouteMap.tsx`, `AnuncioDetailDialog.tsx` |

### Testes do Match v3 (Postgres 16 com geografia simulada)
`docs/sql/02-popular-demo.sql`, bloco 3: **11 de 11** buscas com o resultado esperado (ida, volta, refrigerada, Nordeste, sem Google, três buscas de empresa com selo de retorno, controle fora da rota e perto de mim). Também conferidos: autocompletar ("sao jo" → São José dos Campos/SP), gatilho do IBGE, rota gravada para o mapa, pesos e raios (`vt_raio_km(340) = 25`, `vt_raio_km(840) = 42`, `vt_raio_km(2000) = 60`).
