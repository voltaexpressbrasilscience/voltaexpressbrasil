# Design — Plataforma Volta Express

## 1. O produto
Marketplace de dois lados **simétrico**: caminhoneiros publicam veículos e rotas, empresas publicam cargas, e os dois lados buscam. O valor está em conectar o veículo que voltaria vazio à carga que cabe no caminho dele.

## 2. Diagnóstico visual (set/2026)
| Ponto | Situação |
|---|---|
| Identidade | Visual padrão do shadcn/Lovable, sem personalidade própria |
| Marca | Paleta diferente da landing (laranja e azul em tons distintos) |
| Matching | Formulário + lista; sem mapa, sem ranking visível, sem explicação do resultado |
| Card de anúncio | Não mostra confiança (perfil, verificação) nem o motivo do match |
| Mobile | Formulários longos para quem usa o celular na estrada |
| Acessibilidade | Não auditada (meta: WCAG 2.2 AA) |

## 3. Referências de mercado (princípios, não cópia)
| Caso | Princípio | Aplicação |
|---|---|---|
| Uber | Mapa como tela principal; uma ação principal; estado em tempo real; design system | Matching com a rota desenhada e os resultados sobre o mapa |
| Airbnb | Busca primeiro; card com sinais de confiança; ranking como produto; design system | Card com perfil verificado, avaliação e "por que este match" |
| Red Bull | Narrativa visual, imagem e vídeo em tela cheia | Landing e conteúdo institucional (histórias reais de rota) |
| Fórmula 1 | Dados densos com hierarquia clara; números em destaque; movimento que informa | Painel do caminhoneiro: km vazios evitados, receita estimada, score |

## 4. Diretrizes
1. **Marca preservada:** nome e logos não mudam; tokens de cor unificados com a landing.
2. **Mobile primeiro:** alvos de toque ≥ 44 px, poucos campos, ação principal ao alcance do polegar (Lei de Fitts).
3. **Uma ação principal por tela** e menos escolhas simultâneas (Lei de Hick).
4. **Transparência do algoritmo:** todo resultado mostra o motivo ("desvio de 12 km · coleta em 2 dias · 80% da capacidade").
5. **Confiança visível:** perfil completo, documento verificado e placa verificada como selos.
6. **Movimento com propósito:** animação só para mostrar estado (buscando, encontrado, contato feito), respeitando `prefers-reduced-motion`.
7. **Acessibilidade:** contraste AA, foco visível, navegação por teclado, textos alternativos.

## 5. Plano (sujeito a aprovação)
| ID | Entrega |
|---|---|
| DS1 | Tokens unificados landing + plataforma (cores, tipografia, espaçamento, raio, sombra) |
| DS2 | Matching com mapa como tela principal: rota, marcadores e resultados em cards/bottom sheet no mobile |
| DS3 | Card de anúncio v2: sinais de confiança, score e motivo do match |
| DS4 | Painel do caminhoneiro e da empresa: indicadores estilo telemetria |
| DS5 | Revisão mobile e WCAG 2.2 AA |
| DS6 | Movimento com propósito e estados vazios, de carregamento e de erro |

## 6. Métricas de UX
- Tempo até o primeiro match útil
- Taxa de contato por match exibido
- Taxa de conclusão da criação de anúncio
- SUS (System Usability Scale) em testes com 5 caminhoneiros e 5 empresas

Referências: ver [REFERENCIAS.md](REFERENCIAS.md).

## 7. Execução (set/2026)
| ID | Status | O que foi feito | Arquivos |
|---|---|---|---|
| DS1 | ✅ | Tokens alinhados à landing: azul `#104ac8` (primária), laranja da marca `#fe5b3d` em faixas e gradientes, laranja escurecido `hsl(10 85% 46%)` em botões e textos (contraste 4,7:1), verde de sucesso e do WhatsApp escurecidos para AA | `src/index.css`, `tailwind.config.ts` |
| DS2 | ✅ | Matching com o mapa da rota pesquisada acima dos resultados, indicação do modo (rota ou cidades), datas e volume no formulário | `src/pages/Matching.tsx` |
| DS3 | ✅ | Card v2: score em destaque, "por que este match", anunciante com avatar e selo de perfil, botão "Tenho interesse" | `src/components/AnuncioCard.tsx`, `src/components/anuncio/*` |
| DS4 | ✅ | Meu painel: 4 indicadores em estilo telemetria e gestão dos anúncios | `src/pages/Painel.tsx` |
| DS5 | ✅ | Rótulos ligados aos campos, cards acessíveis por teclado, `aria-live` nos resultados, `aria-label` no menu mobile, contraste AA, `prefers-reduced-motion` | páginas e `index.css` |
| DS6 | ✅ | Esqueletos de carregamento, estados vazios com orientação, animações respeitando "reduzir movimento" | `Matching.tsx`, `Painel.tsx`, `App.tsx` |

Contrastes medidos (texto branco sobre a cor): laranja de ação 4,74 · azul primário 7,41 · verde WhatsApp 4,63 · verde sucesso 4,66 (antes: laranja 2,58 e WhatsApp 1,98).
