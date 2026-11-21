# Estratégia — VEB como plataforma de prateleira

> 09/11/2026. Versão para leitura e comentários: Claude Doc "VEB — Plataformas, mercado e próximos passos" (https://claude.ai/artifact/AXLCVqShV39Pus6nqpF6bC).
> Este arquivo é a cópia de referência no repositório, para retomar o trabalho sem depender da conversa.

## 1. Resumo
- As três plataformas (plataforma, landing, Hub) têm código pronto para demonstração, mas nenhuma está pronta para clientes reais. Faltam 27 itens (11 + 8 + 8), quase todos de segurança, LGPD e publicação. Ver `docs/STATUS-MVP.md` de cada repositório.
- Cerca de 35% dos caminhões voltam vazios no Brasil. A dor é real, mas o mural aberto de fretes já tem dono (Frete.com: 615 mil caminhoneiros).
- **Recomendação:** vender o match de frete de retorno como produto pronto, com a marca do cliente ("VEB Rede"), para cooperativas, associações e transportadoras que já têm a rede de caminhões e cargas. O cliente traz a liquidez; a VEB cobra assinatura.

## 2. Desafios por plataforma
| Plataforma | Mais urgente | Depois |
|---|---|---|
| Plataforma | `.env` rastreado no git desde fev/2026 (todas as branches) e token na URL do remote | Termos de Uso, validar CPF/CNPJ/telefone, peso e volume no banco, migrações v3/m3 no dev e em produção, segredos do GitHub Actions |
| Landing | HTTPS não forçado; depoimentos fictícios apresentados como reais | CTAs com `/cadastro?perfil=`, links legais no rodapé, medição do funil |
| Hub | Planilhas com dados pessoais de terceiros, pitch e prints no repositório público e no histórico (B0) | North Star com dados reais, acervo histórico curado |

Riscos mais caros: (1) dados pessoais públicos no Hub (LGPD, art. 48); (2) `.env` e token no git, que também contaminam o `push --mirror` da migração de contas; (3) liquidez: sem densidade numa rota, o match devolve zero.

## 3. Mercado (números com fonte)
| Indicador | Número | Fonte |
|---|---|---|
| Caminhões que voltam vazios | ~35% (mercado cita 38%) | EPL/DNIT no PNL 2035, via ENAP (2021); Mundo Logística (27/05/2026) |
| Perda anual com ociosidade | R$ 100–200 bi sobre R$ 600–800 bi | Estimativa do CEO da LogShare (Mundo Logística, 27/05/2026) |
| Transportadores RNTRC | 816,8 mil autônomos; 319,3 mil empresas | CNT/ANTT (Agência Infra, 13/07/2026) |
| Quem move a carga (TKU) | Empresas 68,45%; autônomos 12% | Mesma fonte |
| Frete spot 3º tri 2026 | R$ 0,396/t·km (+13% a/a; −5,2% t/t) | IFP Frete.com (DGABC, 23/10/2026) |
| Diesel S-10 | R$ 7,01/l (+15,1% a/a) | Mesma fonte |
| Fretes publicados | −18% a/a | Mesma fonte |
| Estados nos fretes | SP 21,83%, MG 18,13%, GO 11,04% | Mesma fonte |
| Dificuldade para contratar motorista | 88% das empresas | NTC&Logística (Diário do Transporte, 03/03/2026) |
| Frete abaixo do custo; prazo para receber | 10,1%; 47,6 dias | Mesma fonte |

Leitura: começar por uma região densa (corredor JF–BH–RJ, MG é o 2º estado em fretes); o público natural é o autônomo e a pequena transportadora; o argumento que vende é "pague o diesel da volta".

## 4. Cases
| Case | Modelo | Lição para a VEB |
|---|---|---|
| Frete.com (Fretebras + CargoX) | Mural aberto + pagamento, crédito, documentos | O mural aberto já tem dono; nicho é o caminho |
| LogShare | Preenche a volta de frotas de grandes embarcadores (R$ 12 mi seed, 2024) | Concorrente mais próximo; vende como economia + ESG |
| nstech | Consolidador de SaaS logístico (ARR R$ 400 mi, 45 mil clientes, 2021) | Software de prateleira é ativo comprado por consolidadores |
| Freto (Edenred/Repom) | Marketplace com compliance do motorista | Verificar motorista é requisito, não diferencial |
| Trucker Tools | Load board privado white-label ligado ao TMS do cliente | Modelo mais próximo da "prateleira" |
| Convoy | Corretora digital com ativos; US$ 3,8 bi em 2022, fechou em out/2023 | Ativo próprio e contrato longo quebram no ciclo de baixa |
| Uber Freight | Corretagem + gestão de transporte terceirizada | O match atrai; o serviço recorrente paga |

## 5. Ofertas
| Oferta | Para quem | Cobrança (hipótese a validar) |
|---|---|---|
| VEB Pública (hoje) | Autônomo e pequeno embarcador | Grátis no início; depois destaque ou plano pro |
| VEB Rede (prateleira) | Cooperativas, associações, transportadoras com agregados, embarcadores com frota dedicada | Implantação + mensalidade por faixa de membros ativos |
| VEB Dados e API (depois) | TMS, ERPs, embarcadores grandes | Por chamada ou contrato anual |

Fora do escopo por agora: pagamento de frete, crédito e corretagem com responsabilidade sobre a carga. Entram por parceria.

## 6. O que construir para virar prateleira
| Capacidade | O que construir | Esforço |
|---|---|---|
| Multi-inquilino | `organizacao_id` em usuário, anúncio e evento; RLS por organização | Alto |
| Marca do cliente | Logo, cores e domínio por organização, lidos do banco | Médio |
| Painel do gestor | Convites, aprovação de membros, anúncios da rede, indicadores | Médio |
| Métricas de valor | Km vazio evitado, fretes fechados, R$ e CO₂ por mês (sobre `vt_match_evento`) | Médio |
| Verificação | CPF, CNPJ, placa e RNTRC | Médio |
| Contrato e LGPD | Termos, contrato SaaS, acordo de tratamento de dados (cliente controlador, VEB operadora) | Baixo, com advogado |
| Operação | Plano pago, backup, alertas, SLA | Baixo a médio |

## 7. Roteiro
| Fase | Quando | Entregas | Portão para a próxima |
|---|---|---|---|
| 0 · Proteger | nov/2026, 2 semanas | `.env`/token fora do git; B0 do Hub; migrações, Termos e HTTPS | Produção no ar: cadastro real funciona e nenhum dado pessoal no GitHub |
| 1 · Provar | dez/2026 a jan/2027 | Piloto grátis no corredor JF–BH–RJ com 1 rede parceira; North Star no Hub | Tese provada: fretes de retorno fechados e medidos |
| 2 · Empacotar | fev a abr/2027 | Multi-inquilino, marca e painel do gestor, km vazio evitado, contrato SaaS | 1º cliente pago |
| 3 · Escalar | a partir de mai/2027 | 3 a 5 redes pagantes, API, parceria de pagamento e crédito, Fase 2 do Critt | — |

Decisões do fundador: confirmar a direção "VEB Rede" para 2027; escolher a primeira rede parceira; definir a faixa de preço a testar.

## 8. Fontes (abertas em 09/11/2026)
- ENAP / Ministério da Economia — Desafio frete de retorno (2021): https://repositorio.enap.gov.br:443/bitstream/1/6348/4/Desafios%20-%20NI%20Frete%20de%20retorno.pdf
- Mundo Logística — Custo do caminhão vazio (27/05/2026): https://mundologistica.com.br/noticias/custo-caminhao-vazio-ociosidade-gera-perdas-bilionarias-transporte
- Agência Infra — CNT: empresas respondem por 68% das cargas (13/07/2026): https://agenciainfra.com/blog/empresas-respondem-por-68-das-cargas-nas-rodovias-brasileiras-diz-cnt/
- Agência Infra — Preço médio do frete sobe 20% (14/07/2026): https://agenciainfra.com/blog/preco-medio-do-frete-rodoviario-sobe-20-diz-relatorio-da-frete-com/
- DGABC — IFP 3º tri 2026 (23/10/2026): https://www.dgabc.com.br/Noticia/4354464/ifp-preco-do-frete-sobe-13-no-3-tri-ante-3-tri-de-2025-mas-cai-5-2-ante-2-tri-de-2026
- Diário do Transporte — Pesquisa NTC&Logística (03/03/2026): https://diariodotransporte.com.br/2026/03/03/escassez-de-motoristas-deixa-frota-de-caminhoes-ociosa-e-pressiona-rentabilidade-do-transporte-de-cargas/
- Mundo Logística — Frete.com vira unicórnio (12/11/2021): https://mundologistica.com.br/noticias/novo-unicornio-brasileiro-fretecom-recebe-aporte-de-r$-114-bi
- Startupi — LogShare capta R$ 12 milhões (17/06/2024): https://startupi.com.br/logshare-recebe-investimento-de-r-12-milhoes/
- Mundo Logística — nstech compra a e-Frete (17/09/2021): https://mundologistica.com.br/noticias/nstech-anuncia-aquisicao-da-plataforma-e-frete
- Mundo Logística — Edenred lança o Freto (29/03/2019): https://mundologistica.com.br/noticias/edenred-brasil-lanca-plataforma-digital-de-frete
- Trucker Tools — Private Load Board: https://truckertools.com/?p=23902
- FreightWaves — Cofundador da Convoy sobre a queda: https://www.freightwaves.com/news/convoy-co-founder-reflects-on-digital-brokerages-rise-and-fall
- GoFreight — Corretagem digital depois da Convoy (2026): https://gofreight.com/blog/digital-freight-brokerage
