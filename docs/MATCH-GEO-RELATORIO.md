# Relatório — dados de demonstração, desempenho do Match e geolocalização

> 27/10/2026 · plataforma `voltaexpress`, branch `feature/projeto` · somente projeto **DEV**.
> Arquivos novos: `docs/sql/02-popular-demo.sql` e `docs/sql/03-teste-de-carga-match.sql`.
> Nada foi aplicado no banco e nenhuma regra, fluxo ou texto da plataforma foi alterado. O que muda regra está marcado **(precisa da sua autorização)**.
>
> **Atualização 28/10/2026:** você autorizou os itens. Implementados na migração M3 e no front: P1, P2, Q1, Q2, Q3, Q5, Q6 (estrutura), Q7, Q8, G1, M1–M6. Ficam para a próxima etapa: M7 (desvio exato pelo Google), M8 (alerta — escolher o canal), M9–M11 e G3 (Routes API). Ver `docs/MATCH.md` seção 11 e `docs/MATCH-PONTUACAO-V3.md`.

## 1. Resumo
| Pergunta | Resposta curta |
|---|---|
| Como popular o banco? | Script `02-popular-demo.sql`: 4 anunciantes fictícios, 19 anúncios (5 caminhões, 14 cargas) em 2 corredores, com rota e coordenadas gravadas. Bloco 3 confere sozinho 10 buscas (`ok = true`). |
| O roteiro v3 (U1 a U4) muda? | Não. As cidades novas não cruzam JF/SP/RJ/BH/Curitiba/POA. |
| Onde está o gargalo de desempenho? | Hoje, em nenhum lugar visível: com dezenas de anúncios o banco responde em milissegundos. O que pesa é a chamada ao Google a cada busca. O banco só vira problema com milhares de anúncios, porque não há pré-filtro por índice (P1). O `03` mede isso. |
| Onde está a qualidade a ajustar? | 9 pontos (Q1 a Q9). Os 3 que mais afetam a demonstração: o "desvio" mostrado é menor que o real (Q1), o raio é fixo em 30 km (Q2), e ida e volta não estão ligadas (Q5), mesmo sendo o centro do pitch. |
| O que aprender de geolocalização? | (1) Base de municípios do IBGE com coordenadas: autocompletar cidade sem custo e sem erro de digitação. (2) Funções PostGIS que já temos e não usamos. (3) A Routes API, que substitui a Directions (legado). (4) Piso ANTT por eixo. |

## 2. Popular o banco para a demonstração

### 2.1 Diagnóstico
- `vt_criar_anuncio` exige `auth.uid()`: não roda pelo SQL Editor.
- `documento` em `vt_usuario` é **único** e o gatilho grava `''` quando falta. Por isso, criar 2 usuários pelo painel do Supabase (Authentication → Add user) **falha no segundo**: os dois teriam documento vazio.
- Sem a chave do Google na Edge Function, o anúncio fica sem rota e só aparece em busca por cidade exata. O script grava a rota direto, e assim a demonstração não depende do Google na criação.

### 2.2 Recomendação: caminho B (script), com o A como alternativa
| Caminho | Como | Prós | Contras |
|---|---|---|---|
| **B (recomendado)** | Bloco 1 grava os 4 usuários em `auth.users` **sem senha** | 1 clique, repetível, CPF e perfil corretos | Essas contas não fazem login (nem precisam: só são donas dos anúncios). Se o Supabase negar permissão em `auth.users`, use o A. |
| A | Cadastrar os 4 pela tela `/cadastro` com Gmail "+", usando exatamente os nomes e CPFs do bloco 1 | 100% pelo fluxo oficial | ~10 min, e a confirmação de e-mail chega na sua caixa |

Depois, em qualquer um dos caminhos, o bloco 2 popula o banco e o bloco 3 confere.

### 2.3 Cenários (cada um mostra uma regra do Match)
| Corredor | Anúncio | O que demonstra |
|---|---|---|
| Centro-Oeste | Truck baú 14 t · Goiânia → Uberlândia (D+2 a D+5) e **a volta do mesmo caminhão** (D+6 a D+10) | Frete de retorno: ida e volta carregadas |
| | Sementes Goiânia → Uberlândia | Encaixe perfeito (nota ~91) |
| | Fertilizante Itumbiara → Uberlândia | Pega a carga no meio da rota (~79) |
| | Embalagens Goiatuba → Uberlândia | Desvio moderado de ~20 km (~63) |
| | Água mineral Caldas Novas → Uberlândia | **Controle:** a ~50 km da rota, não aparece |
| | Milho a granel | **Controle:** carroceria incompatível (baú × granel) |
| | Bobinas de aço 28 t | **Controle:** não cabe no Truck de 14 t |
| | Leite UHT Uberlândia → Goiânia | Encaixe perfeito **na volta** (~92) |
| | Ração Itumbiara → Goiânia | Volta parcial; **controle de sentido** para a ida |
| | Carreta baú refrigerada Brasília → Ribeirão Preto + frango congelado e peças agrícolas | Refrigeração obrigatória; trechos parciais |
| Nordeste | Toco baú 6 t (autônomo) Recife → Salvador e volta | Frete de retorno no Nordeste |
| | Bebidas Recife → Aracaju | Desvio de ~10 km (Aracaju fica fora da BR-101) |
| | Cosméticos Recife → Garanhuns | **Controle:** fora da rota |
| | Calçados Alagoinhas → Recife | Encaixe na volta (~84) |
| | Material de construção, só em D+20 | **Controle de data** (fora da janela da volta) |

As notas (~) foram calculadas com a fórmula do banco. No app, a rota da **busca** vem do Google e pode variar alguns pontos. O bloco 3 usa a rota já codificada e não depende do Google.

**Telefone:** todos os anunciantes fictícios usam o WhatsApp da empresa (32 98836-7667). O "Tenho interesse" da demonstração nunca abre conversa com número de terceiro.

### 2.4 Roteiro no app (logado como Carlos, U1)
| # | Tela | Preencher | Esperado |
|---|---|---|---|
| 1 | Match de frete → Encontrar carga | Goiânia/GO → Uberlândia/MG · hoje+2 a hoje+5 · Baú · 14.000 kg · 45 m³ | 3 cartões, nesta ordem: Sementes, Fertilizante, Embalagens |
| 2 | Encontrar carga | Uberlândia/MG → Goiânia/GO · hoje+6 a hoje+10 · mesmo caminhão | Leite UHT e Ração: **a volta também carrega** |
| 3 | Encontrar caminhão | Carga seca · 9.000 kg · 25 m³ · Itumbiara/GO → Goiânia/GO · hoje+7 a hoje+9 | Só o Truck da volta (o da ida está no sentido errado) |
| 4 | Encontrar caminhão | Refrigerada (exige frio) · 20.000 kg · Catalão/GO → Uberaba/MG · hoje+4 a hoje+7 | Só a carreta refrigerada |
| 5 | Encontrar carga | Recife/PE → Salvador/BA · hoje+1 a hoje+4 · Baú · 6.000 kg · 30 m³ | Bebidas; Cosméticos (Garanhuns) não aparece |
| 6 | Oportunidades (sem login) | — | 19 anúncios novos + os do roteiro v3 |

Pronto quando: os 6 passos batem com a tabela. Se o passo 1 mostrar só "Sementes", a busca caiu no modo **cidade**, porque a Edge Function não tem a chave do Google no DEV. Isso é o comportamento esperado sem chave (o bloco 3, teste 6, prova).

## 3. Desempenho

### 3.1 Diagnóstico
| # | Achado | Impacto hoje | Impacto com milhares de anúncios |
|---|---|---|---|
| P1 | As duas funções calculam `ST_Distance` (geography) e `ST_LineLocatePoint` para **todos** os anúncios ativos, porque não há pré-filtro. O índice GIST `idx_vt_anuncio_rota` existe, mas nunca é usado: nenhuma condição `ST_DWithin`/`&&` está no `WHERE`. | Nenhum (dezenas de linhas) | O tempo cresce na proporção de N × vértices da rota. É o primeiro gargalo do banco. |
| P2 | Cada busca chama o Google (`route-distance`), mesmo que a mesma origem→destino tenha sido calculada minutos antes | Latência de rede (centenas de ms) e consumo de cota | Custo após a cota grátis |
| P3 | `vt_localizacao` guarda latitude/longitude em `numeric` e monta o ponto a cada busca; não há coluna de ponto nem índice | Nenhum | Impede o pré-filtro das cargas |
| P4 | Polyline "overview" do Google é simplificada (erro de poucos km) | Aceitável para raio de 30 km | Aceitável |

### 3.2 Recomendação
1. **Medir antes de mexer:** `03-teste-de-carga-match.sql` com N = 100, 1.000 e 5.000. Critério: até ~300 ms está bom; acima de ~800 ms, aplicar o item 2.
2. **Pré-filtro por índice (P1/P3).** Não muda nenhum resultado (mesmo raio), só evita calcular distância do que está longe. Esboço da migração:
```sql
-- vt_localizacao: ponto pronto e indexado
ALTER TABLE public.vt_localizacao
  ADD COLUMN ponto extensions.geography(Point, 4326)
  GENERATED ALWAYS AS (CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL
    THEN extensions.ST_SetSRID(extensions.ST_MakePoint(longitude::float8, latitude::float8), 4326)::extensions.geography END) STORED;
CREATE INDEX idx_vt_localizacao_ponto ON public.vt_localizacao USING GIST (ponto);

-- vt_match_veiculos, no WHERE do bloco "base" (usa o índice que já existe em vt_anuncio.rota):
--   AND (e.cop IS NULL OR ST_DWithin(a.rota, e.cop::geography, cfg.raio_km * 1000))
-- vt_match_cargas, no WHERE do bloco "base" (usa o índice novo):
--   AND (e.rota IS NULL OR ST_DWithin(o.ponto, e.rota::geography, cfg.raio_km * 1000))
```
   Para isso, `entrada` e `cfg` precisam entrar no `FROM` de `base`. É uma reescrita pequena, que eu faço e testo junto com as funções quando você autorizar e o `03` mostrar necessidade.
3. **Cache de rota (P2):** tabela `vt_rota_cache (origem_norm, destino_norm, polyline, km, criado_em)`. A Edge Function consulta o cache antes do Google e guarda por 30 dias. Isso economiza cota e deixa a busca repetida instantânea. É mudança técnica, sem regra nova.

## 4. Qualidade do Match
| # | O que acontece hoje | Exemplo na demo | Proposta | Autorização |
|---|---|---|---|---|
| Q1 | "Desvio de X km" = soma das distâncias **em linha reta** da origem e do destino até a rota. O caminhão vai e volta por estrada, então o desvio real é ~2 × 1,3 × X. | Embalagens: "desvio de 21 km"; na prática, ~55 km rodados a mais | Trocar o texto para "a 21 km da sua rota" (honesto e sem cálculo novo) ou estimar "≈ 55 km a mais" | **Sim** (texto) |
| Q2 | Raio fixo de 30 km para qualquer rota | 30 km é 10% de Goiânia–Uberlândia e 3,5% de Recife–Salvador | Raio proporcional: `entre 20 e 60 km, 5% da rota` | **Sim** (regra) |
| Q3 | No modo cidade, desvio e aproveitamento valem nota máxima | Sem Google, toda carga "mesma cidade" ganha 100% em desvio e aproveitamento, sem saber se o caminho bate; a nota parece tão boa quanto a de uma rota conferida | Nota neutra (0,7) no modo cidade e selo "sem rota calculada" | **Sim** (regra) |
| Q4 | Carga curta perde pontos de aproveitamento (peso 20) | Fertilizante usa 38% da rota → 79, mesmo sem desvio | Manter até ter dados (Q9) e então recalibrar | Não, só observar |
| Q5 | Ida e volta são anúncios soltos; nada convida a anunciar a volta | O pitch é frete de retorno, mas a plataforma não "vê" o retorno | Depois de publicar a ida: botão "Anunciar a volta" (origem/destino invertidos, datas após a ida). No Match, selo "frete de retorno" quando a carga está na volta de um caminhão que já tem ida. | **Sim** (fluxo) |
| Q6 | Referência única de R$ 6,50/km para todo veículo | VUC e carreta comparados pelo mesmo valor | Tabela `vt_piso_referencia` por tipo de veículo e tipo de carga, com valores tirados da calculadora oficial da ANTT (você preenche). Texto: "referência", nunca "preço justo". | **Sim** (regra) |
| Q7 | Anúncio criado quando o Google falhou fica sem rota e some do modo rota | Bloco 0 mostra `ativos_sem_rota` | Recalcular a rota depois (tarefa agendada) ou usar coordenadas do IBGE (seção 5) | Não (técnico) |
| Q8 | Cidade digitada livre: "S. J. dos Campos" ≠ "São José dos Campos" no modo cidade | Erro de digitação = zero resultado | Autocompletar com a lista do IBGE (seção 5) | **Sim** (campo do formulário) |
| Q9 | Os pesos (35/20/15/15/10/5) são hipótese, sem calibração | — | Medir com `vt_match_evento`: taxa de contato e de "frete fechado" por faixa de nota. Métrica: **precisão@5** = dos 5 primeiros cartões, quantos recebem contato. Recalibrar com ~50 fretes fechados. | Não (medição) |

## 5. Geolocalização: o que temos e o que aprender

### 5.1 Hoje
| Peça | O que faz |
|---|---|
| `route-distance` (Directions API) | Polyline, km, duração e coordenadas de origem/destino |
| `route-cities` | Legado, não usada pelo Match v2 |
| PostGIS no banco | `rota` como `geography LineString`, `ST_Distance`, `ST_LineLocatePoint`, `ST_LineFromEncodedPolyline` |
| Mapa no front | Maps JavaScript API com chave por variável de ambiente; sem chave, cartão com link do Google Maps |

### 5.2 O que vale aprender, em ordem de retorno
| # | Tema | Para quê | Custo | Esforço |
|---|---|---|---|---|
| G1 | **Base de municípios do IBGE** (5.570 municípios com código IBGE, UF, latitude e longitude; há versões prontas em CSV/SQL no GitHub, ex.: `kelvins/municipios-brasileiros`) | Autocompletar cidade (Q8), coordenadas sem Google (Q7), busca por cidade **com raio** em vez de nome exato, mapa de oferta × demanda por região para o Hub | Zero | Baixo: 1 tabela + 1 índice + 1 componente |
| G2 | **PostGIS que já temos:** `ST_DWithin` (pré-filtro com índice), `ST_LineSubstring` (km reais do trecho que a carga usa), `ST_ClosestPoint` (ponto de encontro na rota), `ST_Simplify` (rota mais leve) | Desempenho (P1) e motivos mais precisos ("carrega no km 180 da sua rota") | Zero | Baixo |
| G3 | **Routes API** (Compute Routes): substitui a Directions API, que o Google classificou como legado em 03/2025 (sem recursos novos) | Paradas intermediárias, pedágio e trajetos alternativos. Migrar quando precisar de um desses recursos; a Directions continua funcionando para quem já usa. | Mesma faixa: 10 mil chamadas grátis/mês no nível Essentials, depois US$ 5 por mil. Recursos avançados (ex.: pedágio) entram no nível Pro (5 mil grátis, US$ 10 por mil). | Médio: só a Edge Function muda |
| G4 | Places Autocomplete (Google) | Alternativa ao G1 com endereço completo (rua) | 10 mil grátis/mês, depois US$ 2,83 por mil | Médio. Para cidade, o G1 resolve sem custo. |
| G5 | Roteamento de caminhão (altura, peso, eixos) | O Google não tem perfil de caminhão. Alternativas: OpenRouteService (perfil `driving-hgv`), HERE, TomTom. | Varia | Só na fase de operação |
| G6 | **Piso mínimo ANTT** | Referência de valor por eixo e tipo de carga (Q6). Fórmula: km × CCD + CC (custo de carga e descarga). Segundo fonte secundária, a norma vigente é a Resolução ANTT nº 6.076/2026 (20/01/2026), com coeficientes atualizados por portaria. **Confirme na calculadora oficial antes de usar.** | Zero | Baixo (tabela preenchida por você) |

**Cota e custo hoje:** com 10 mil rotas grátis por mês, a fase de demonstração e piloto não paga Google. O cache (P2) multiplica essa folga.

## 6. Plano
| Quando | Tarefa | Quem | Pronto quando |
|---|---|---|---|
| Amanhã | Rodar `02-popular-demo.sql` (blocos 0 → 1 → 2 → 3) no DEV | Você | Bloco 3 com 10 linhas `ok = true` |
| Amanhã | Roteiro no app (seção 2.4) | Você | 6 passos batem |
| Amanhã | Ler Q1–Q9 e marcar sim/não em cada autorização | Você | Lista devolvida para mim |
| Amanhã (opcional) | `03-teste-de-carga-match.sql` com N = 1.000 | Você | Tempos anotados (ms_cargas, ms_veiculos) |
| Próxima etapa | G1 (IBGE) + Q8 (autocompletar) + Q7 (coordenadas de fallback) | Eu, após autorização | Busca por cidade digitada errado deixa de zerar |
| Próxima etapa | P1 (pré-filtro) se o `03` passar de ~800 ms; P2 (cache de rota) | Eu | Mesmos resultados do bloco 3, tempo menor |
| Próxima etapa | Q1, Q2, Q3, Q5, Q6 conforme suas respostas | Eu | Bloco 3 atualizado com os novos esperados |
| Depois | G3 (Routes API), quando precisar de paradas ou pedágio | Eu | Edge Function nova com o mesmo contrato |

## 7. Passo a passo para amanhã (DEV)
1. Supabase → projeto **DEV** → SQL Editor. Confirme o nome do projeto no topo da tela antes de rodar.
2. Abra `docs/sql/02-popular-demo.sql` e rode **um bloco por vez**:
   - **Bloco 0:** `postgis` e as 3 funções `true`; `documento_em_uso = 0`.
   - **Bloco 1** (só na primeira vez). Se der *permission denied*, cadastre os 4 pela tela (caminho A) e siga.
   - Bloco 0 de novo: `usuarios_demo_ja_criados = 4`.
   - **Bloco 2:** a última linha mostra `veiculos = 5`, `cargas = 14`, `veiculos_sem_rota = 0`.
   - **Bloco 3:** 10 linhas, todas com `ok = true`. Se alguma vier `false`, copie a linha inteira (colunas `esperado`, `obtido` e `scores_e_motivos`) e me mande.
3. `npm run dev`, logue como Carlos e siga a seção 2.4.
4. (Opcional) `docs/sql/03-teste-de-carga-match.sql`: A com N = 1000, depois B 3 vezes, anote, depois C. Termine com `sinteticos_restantes = 0`.
5. Na véspera da apresentação: rode o bloco 2 de novo. Ele recria tudo com as datas a partir de hoje, como o `01-renovar-demo.sql` faz para U1–U4.

## 8. Limites desta análise
- Sem PostGIS neste ambiente: os blocos 1, 2 e 4 foram executados num PostgreSQL 16 de teste, com a rota simulada (criação, repetição idempotente e limpeza em cascata OK). O bloco 3 e o `03` **não** foram executados. As notas esperadas vêm da mesma fórmula, recalculada em Python com distâncias geodésicas.
- As rotas do script passam pelas cidades das rodovias, não pelo traçado exato do Google.
- Os preços do Google são do nível de entrada, em dólar, consultados em 27/10/2026. Os coeficientes da ANTT não foram copiados: precisam vir da calculadora oficial.

## Fontes
- [Google Maps Platform — tabela de preços](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Google — mudanças de 1º/03/2025 (serviços legados, cota grátis por SKU)](https://developers.google.com/maps/billing-and-pricing/march-2025)
- [Google — migrar da Directions API para a Routes API](https://developers.google.com/maps/documentation/routes/migrate-routes)
- [Contmatic — Tabela de frete ANTT 2026 (Resolução 6.076/2026, fórmula)](https://simplifique.contmatic.com.br/blogs/como-consultar-e-calcular-tabela-frete-antt-2026)
- [Calculadora oficial do piso mínimo — ANTT](https://calculadorafrete.antt.gov.br)
- [Municípios brasileiros com coordenadas (kelvins)](https://awesome.ecosyste.ms/projects/github.com%2Fkelvins%2FMunicipios-Brasileiros)
