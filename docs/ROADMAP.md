# Roadmap — Volta Express Brasil

Legenda: ✅ feito (código pronto e testado) · 🔄 depende de você · ⬜ a fazer

## Princípios
- Preservar o negócio: duas personas, anúncio V/C, negociação direta via WhatsApp.
- Custo zero ou mínimo: Supabase free + Netlify/GitHub Pages.
- Cada fase entrega valor mensurável e alimenta o Hub.

## Fase 1 — Segurança e base
- [x] **P1** — `vt_usuario` sem leitura pública; contatos por função segura.
- [x] **P1.1** — placa e carroceria de terceiros só para usuários logados.
- [x] **P2** — Edge Functions com CORS restrito, login obrigatório, limite de chamadas e validação; chave do Maps do navegador via `.env`.
- [x] **P3** — `expire_anuncios()` agendada no `pg_cron` (diária).
- [x] **P4/P5** — criação de anúncio numa transação (`vt_criar_anuncio`) e veículo reaproveitado pela placa.
- [x] **R1** — aba inicial de "Criar anúncio" segue a persona do cadastro (as duas continuam liberadas).
- [x] Testes unitários e de componente (13) + testes SQL do match (13 casos).
- [ ] 🔄 Aplicar as migrações no projeto **dev**, testar com DEMONSTRACAO.md e depois em **produção**.
- [ ] 🔄 Configurar `VITE_GOOGLE_MAPS_BROWSER_KEY` no Netlify e restringir as chaves no Google Cloud.
- [x] Monitoramento para evitar a pausa do Supabase free: `.github/workflows/manter-supabase-ativo.yml` (v3). 🔄 Configurar os segredos no GitHub.
- [x] Decisão R1 definitiva (v3): não restringe; a persona só define a aba inicial.

## Fase 2 — Match v2 (o cérebro)
- [x] PostGIS; rota e coordenadas gravadas na criação do anúncio.
- [x] Categoria da carga, exigência de refrigeração e tabela de compatibilidade.
- [x] `vt_match_cargas` e `vt_match_veiculos`: filtros, encaixe na rota no sentido certo, score 0–100 e motivos.
- [x] Sem baixar a base inteira no navegador; nenhuma chamada extra ao Google na busca além da rota digitada.
- [x] `vt_match_evento` (exibido/contato) e pesos configuráveis.
- [ ] 🔄 Validar a tabela de compatibilidade com a operação: perguntas em `docs/COMPATIBILIDADE-PARA-VALIDAR.md`.
- [ ] ⬜ Conjunto de pares avaliados pela operação (meta precision@5 ≥ 0,8).

## Fase 3 — Produto e conversão
- [x] "Meu painel": indicadores e pausar/reativar/encerrar anúncios.
- [x] Card v2 com score, motivos e anunciante; telefone só após "Tenho interesse".
- [x] Code-splitting por rota (bundle inicial 910 KB → 684 KB) e mapa carregado sob demanda.
- [ ] ⬜ Match proativo com aviso por e-mail.
- [ ] ⬜ Preço sugerido por tipo de veículo/eixos, com referência do piso mínimo da ANTT.
- [ ] ⬜ Perfil verificado (documento e placa).

## Fase 4 — Dados e diretoria
- [ ] ⬜ Views de métricas (liquidez, funil, North Star) sobre `vt_match_evento`.
- [ ] ⬜ Exportação mensal para o Hub (`data/metricas-mensais.json`).
- [ ] ⬜ Ajuste dos pesos do score com dados reais.

## Metas de saída
| Indicador | Antes | Agora (código) | Meta |
|---|---|---|---|
| Chamadas ao Google por busca | até 16 | 1 (rota digitada) | 0–1 |
| Resultados no sentido errado | possíveis | 0 nos testes | 0 |
| Dados pessoais expostos | CPF/CNPJ e telefone | telefone só após interesse | idem |
| Testes | 1 exemplo | 13 front + 13 SQL | cobertura ≥ 80% do match |
| Bundle inicial | 910 KB | 684 KB | < 500 KB |

## Versão 3 — Demo para investidor (out/2026)
- [x] Personas "Tenho caminhão" e "Tenho carga"; CPF obrigatório e CNPJ opcional (migração v3).
- [x] Política de Privacidade (LGPD) em `/privacidade`, aceite obrigatório e registrado. 🔄 Revisão jurídica e dados da empresa.
- [x] Frete fechado ao encerrar o anúncio, com indicador no painel (migração v3).
- [x] Home com a tese do frete de retorno e a seção ilustrativa (pesquisa, match e exemplo).
- [x] Identidade única com a landing e o Hub (fonte, cores, contato, redes); imagem de compartilhamento.
- [x] Erros em português claro; R$/km lido do banco; mapa sem chave no código.
- [x] Demonstração com datas relativas e roteiro para investidor.
- [x] CI de qualidade (TypeScript, lint, testes e build) em `.github/workflows/qualidade.yml`.

## Próximas prioridades (depois da v3)
- [x] **Validar CPF/CNPJ** (dígito verificador) e o telefone com DDD no cadastro e no Perfil — prioridade definida em 27/10/2026. Feito na v3.2 (`src/lib/documentos.ts`).
- [x] **Termos de Uso** como página da plataforma, com aceite junto da Política de Privacidade. Feito na v3.2 (`/termos`). 🔄 Revisão jurídica e dados da empresa.
- [x] Exigir peso e volume também na função do banco (`vt_criar_anuncio`), além da tela. Migração da v3.2. 🔄 Aplicar no dev e em produção.
- [ ] ⬜ Métricas da plataforma para o Hub (anúncios ativos, matches, contatos, fretes fechados por mês).
- [x] Remover os lockfiles do Bun (`bun.lock`, `bun.lockb`) e usar só npm (10/11/2026).
- [x] Renomear `src/lib/mock-data.ts` para `catalogos.ts` (o arquivo guarda listas reais, não dados falsos) (10/11/2026).

