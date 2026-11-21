# Pontuação do Match (0 a 100) — análise da v3

> 28/10/2026 · migração `supabase/migrations/20261029120000_m3_match_v3.sql` · branch `feature/projeto`.
> Os números das seções 4 e 5 saíram das funções reais do banco (`vt_match_cargas` e `vt_match_veiculos`) rodando sobre os dados de `docs/sql/02-popular-demo.sql`, num Postgres 16 de teste com a geografia simulada (não é o PostGIS real; diferença esperada de até 1 ponto).

## 1. Resumo
| Pergunta | Resposta |
|---|---|
| A nota ordena bem? | Sim, nos 13 cenários de teste o melhor encaixe sempre ficou em primeiro, e os casos que não servem (fora da rota, sentido errado, carroceria, peso, data) nem aparecem. |
| O que estava distorcido na v2? | (1) Sem rota calculada, a nota de desvio e de aproveitamento era a máxima, e uma busca "só por cidade" tirava 91, igual a uma rota conferida. (2) Carga curta e bem paga perdia muito (peso 20 no aproveitamento, 10 no valor). (3) O raio era fixo em 30 km. (4) O "desvio de X km" era em linha reta e parecia menor do que é. |
| O que a v3 muda | Modo cidade com nota neutra (0,7), raio proporcional à rota (5%, entre 25 e 60 km), pesos de aproveitamento e valor iguais (15 e 15), +5 pontos para caminhão em frete de retorno e motivos honestos ("≈ 30 km a mais na estrada", "coleta no km 191 da sua rota"). |
| Efeito nos números | Encaixes reais mudam de −3 a +4 pontos; busca sem rota cai de 91 para 75; caminhão voltando de viagem sobe 6 a 7 pontos. |
| Os pesos estão certos? | Ainda são hipótese. A régua para confirmar é a taxa de contato e de frete fechado por faixa de nota: `docs/sql/04-calibracao-score.sql` (seção 6). |

## 2. Como a nota é calculada (v3)
Primeiro passam os **filtros obrigatórios** (ativo, de outra pessoa, carroceria compatível, refrigeração, peso e volume, datas que se cruzam, encaixe geográfico no sentido certo). Só quem passa recebe nota.

Nota = soma de (peso × critério de 0 a 1) ÷ soma dos pesos × 100. No match de caminhões, +5 se for frete de retorno (limite 100).

| Critério | Peso v3 | Mede | Cálculo (0 a 1) | Quanto vale na prática |
|---|---|---|---|---|
| Desvio | 35 | Distância da coleta e da entrega até a rota | 1 − (dist. coleta + dist. entrega) ÷ (2 × raio) | Raio 25 km: **0,7 ponto por km** fora da rota. Raio 42 km (rota de ~840 km): 0,42/km. Raio 60 km: 0,29/km |
| Aproveitamento | 15 | Quanto da rota a carga percorre | fração da rota entre coleta e entrega | **1,5 ponto a cada 10%** da rota |
| Data | 15 | Quanto falta para a coleta | 1 − dias de espera ÷ 30 | **0,5 ponto por dia** de espera |
| Capacidade | 15 | Quanto a carga enche o caminhão | média de peso÷capacidade e volume÷capacidade | **1,5 ponto a cada 10%** de ocupação |
| Valor | 15 | R$/km comparado com a referência | Cargas: (R$/km ÷ referência) ÷ 1,5 · Caminhões: referência ÷ (R$/km) | Cargas: **1,5 ponto por R$ 1/km**, até R$ 9,75/km (1,5 × R$ 6,50) |
| Anunciante | 5 | Perfil com foto | foto = 1; sem foto = 0,6 | 2 pontos |
| Frete de retorno | +5 | Caminhão voltando de uma viagem anunciada (só na busca de caminhões) | bônus | +5 |

**Quando falta um dado** (capacidade, valor), o critério vale 0,5 (neutro): não pune nem premia.
**Modo cidade** (sem rota calculada): desvio e aproveitamento valem 0,7. Teto prático ~85, e o motivo avisa "rota não calculada".
**Referência de valor:** R$ 6,50/km, ou o valor do tipo de veículo em `vt_valor_referencia` quando você preencher (calculadora da ANTT).

## 3. O que mudou da v2 para a v3
| Item | v2 | v3 | Por quê |
|---|---|---|---|
| Raio da faixa | 30 km fixo | 5% da rota, entre 25 e 60 km | 30 km era 10% de Goiânia–Uberlândia e 3,5% de Recife–Salvador |
| Modo cidade | desvio = 1, aproveitamento = 1 | 0,7 e 0,7 | Sem rota, não sabemos se o caminho bate; a nota não pode parecer conferida |
| Pesos aproveitamento / valor | 20 / 10 | 15 / 15 | Carga curta e bem paga deixava de aparecer bem; a decisão do motorista é muito ligada ao valor |
| Frete de retorno | não existia | +5 e selo "Frete de retorno" | É a proposta de valor da empresa; caminhão voltando tende a aceitar melhor preço |
| Texto do desvio | "desvio de 21 km" | "coleta e entrega a 21 km da sua rota (≈ 55 km a mais na estrada)" | O desvio real é ida e volta, por estrada (2 × 1,3 × distância) |
| Onde a carga entra | — | "coleta no km 191 da sua rota" | Motivo concreto para o motorista |
| Perto de mim | não existia | coleta a até 25/50/100/200 km da posição | Motorista parado procurando carga |

Os pesos só mudaram sozinhos porque ainda estavam no padrão da v2. Se alguém já tivesse ajustado à mão, a migração não sobrescreveria (`versao_pesos`).

## 4. Antes × depois nos cenários de demonstração
| # | Busca | Resultado | v2 | v3 | Leitura |
|---|---|---|---|---|---|
| 1 | Truck Goiânia → Uberlândia | Sementes (mesma rota inteira) | 91 | **90** | Encaixe perfeito continua no topo |
| 1 | | Fertilizante (embarca em Itumbiara, km 191) | 79 | **80** | Carga de 38% da rota, bem paga: sobe 1 |
| 1 | | Embalagens (Goiatuba, 21 km fora) | 63 | **61** | Raio menor (25 km) pesa mais no desvio; motivo diz "≈ 55 km a mais" |
| 2 | Volta Uberlândia → Goiânia | Leite UHT (volta inteira) | 92 | **91** | |
| 2 | | Ração (Itumbiara → Goiânia) | 79 | **78** | |
| 3 | Carreta refrigerada Brasília → Ribeirão Preto | Frango congelado | 77 | **78** | |
| 3 | | Peças agrícolas | 72 | **74** | |
| 4 | Toco Recife → Salvador | Bebidas (Aracaju, 11 km fora) | 74 | **74** | Raio 35 km (rota longa) |
| 5 | Volta Salvador → Recife | Calçados | 84 | **81** | Usa 87% da rota; perde no peso menor do aproveitamento |
| 6 | Truck Goiânia → Uberlândia **sem Google** | Sementes | **91** | **75** | Correção principal: sem rota a nota não iguala a de uma rota conferida |
| 7 | Empresa: ração Itumbiara → Goiânia | Truck voltando Uberlândia → Goiânia | 84 | **91** | +5 de frete de retorno e valor mais pesado |
| 8 | Empresa: frango Catalão → Uberaba | Carreta refrigerada | 80 | **84** | Preço do caminhão abaixo da referência conta mais |
| 10 | Empresa: calçados Alagoinhas → Recife | Toco voltando Salvador → Recife | 90 | **96** | Frete de retorno |
| 11 | Perto de mim (Goiânia, 50 km) | Sementes | — | **81** | Novo |
| 12 | Empresa: Alagoinhas → Recife **sem coordenadas** | — | nenhum | nenhum | Sem Google e sem cidade escolhida na lista, o modo cidade exige a mesma origem e destino. Com o autocompletar do IBGE, a busca manda as coordenadas e volta a dar o Toco (caso 10) |

Os casos de controle continuam fora nas duas versões: carga a 51 km da rota, carroceria incompatível, 28 t num Truck de 14 t, sentido contrário e data fora da janela.

## 5. Como ler a nota
| Faixa (selo no card) | Nota | Significado prático | Exemplos |
|---|---|---|---|
| Ótimo encaixe | 75 a 100 | No caminho (ou quase), boa parte da rota, logo, bom valor | Sementes 90, Leite 91, Truck voltando 91 |
| Bom encaixe | 55 a 74 | Vale a ligação: desvio moderado, trecho curto ou valor baixo | Peças 74, Bebidas 74, Embalagens 61 |
| Encaixe parcial | abaixo de 55 | Serve só se nada melhor aparecer | Desvio no limite da faixa, coleta daqui a semanas |

A faixa não mudou; a v3 só muda o que entra nela. Uma busca sem rota chega no máximo a ~85; o motivo "rota não calculada" deixa claro que é estimativa.

## 6. Como calibrar com dados reais (Q9)
1. Depois de ~2 semanas de uso real (ou ~50 contatos), rode `docs/sql/04-calibracao-score.sql` no projeto de produção.
2. **Bloco A:** a taxa de contato precisa subir de "Encaixe parcial" para "Ótimo encaixe". Se as faixas tiverem taxas parecidas, a nota não está diferenciando.
3. **Bloco B:** o mesmo para frete fechado (a medida que importa para o negócio).
4. Ajuste um peso por vez e meça de novo. Exemplos (rodar no SQL Editor):
```sql
-- valor pesa mais, aproveitamento menos
UPDATE vt_match_config SET peso_valor = 20, peso_aproveitamento = 10, versao_pesos = 'ajuste-1' WHERE id = 1;
-- raio maior para rotas curtas
UPDATE vt_match_config SET raio_min_km = 30 WHERE id = 1;
-- modo cidade mais conservador
UPDATE vt_match_config SET nota_modo_cidade = 0.6 WHERE id = 1;
```
5. Meta da operação: dos 5 primeiros cartões de uma busca, pelo menos 4 serem "eu ligaria" (precisão@5 ≥ 0,8). Uma revisão manual de 20 buscas reais já dá o número.

## 7. Limites
- A geografia dos testes é simulada (distâncias por haversine, a mesma ordem de grandeza do PostGIS). As notas no Supabase podem diferir em até 1 ponto.
- No app, a rota da busca vem do Google e não é idêntica às rotas aproximadas do script de demonstração: as notas podem mudar alguns pontos, mas a ordem e quem entra/sai não mudam nos cenários testados.
- O desvio "na estrada" é estimado (fator 1,3 sobre a linha reta, ida e volta). O exato precisa de uma rota com paradas no Google (M7, próxima etapa).
