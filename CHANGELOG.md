# Changelog — Plataforma Volta Express

## [3.2.1] — 10/11/2026 · branch `docs/roteiro-dev-metricas` (local)
- `docs/APLICAR-NO-DEV.md`: roteiro único para aplicar no DEV as 5 migrações da v3 e v3.2, o IBGE, a demonstração e a Edge Function `route-distance`, com 8 testes no app.
- `docs/sql/00-diagnostico.sql`: 3 marcadores novos da v3.2 (peso e volume no banco, coluna do aceite dos Termos, cadastro gravando os Termos).
- `docs/sql/06-metricas-north-star.sql` (somente leitura): série mensal de anúncios, contatos, fretes fechados e North Star (fretes de retorno conectados), funil do último mês, liquidez por UF e o JSON para o Hub. Não testado em banco.

## [3.2.0] — 09/11/2026 · branch `feature/termos-validacao` (local)
### Adicionado
- Página `/termos` (Termos de Uso, rascunho para revisão do advogado; campos entre colchetes a preencher) e `VERSAO_TERMOS` em `src/lib/privacidade.ts`.
- Aceite único no cadastro: Termos de Uso e Política de Privacidade. A versão dos Termos fica nos metadados da conta (`versao_termos`).
- `src/lib/documentos.ts`: CPF e CNPJ com dígito verificador, WhatsApp celular com DDD válido; usados no Cadastro e no Perfil. 6 testes em `src/test/documentos.test.ts`.
- Migração `20261109120000_v32_peso_volume_obrigatorio.sql`: `vt_criar_anuncio` recusa carga sem peso e volume maiores que zero.
- Rodapé com links para Privacidade e Termos.
- Migração `20261110120000_v32_aceite_termos.sql`: colunas `aceite_termos_em` e `versao_termos` em `vt_usuario`, gravadas pelo `handle_new_user`; o Perfil pede o aceite dos Termos a contas antigas e só mostra esse bloco quando a coluna existe no banco.
- `src/lib/mock-data.ts` renomeado para `catalogos.ts`; lockfiles do Bun removidos (só npm).

### Verificado
- 39 testes passando, TypeScript sem erros, lint dos arquivos alterados sem erros e build. A migração **não** foi testada num banco (sem Postgres nesta máquina).

## [3.1.0] — 28/10/2026 · branch `feature/projeto` · Match v3 e mapas
Decisões: `docs/DECISOES.md` (ADR 17–23); análise da nota: `docs/MATCH-PONTUACAO-V3.md`.

### Adicionado
- Migração `20261029120000_m3_match_v3.sql`: raio proporcional, pré-filtro por índice, nota neutra no modo cidade, pesos v3, motivos com desvio estimado na estrada e "coleta no km X", selo e bônus de frete de retorno, "perto de mim", municípios do IBGE, valor por tipo de veículo, cache de rota e `vt_rota_anuncio`.
- Mapa do match com a faixa de busca e os pontos de coleta e entrega coloridos pela nota; círculo do "perto de mim".
- "Cargas perto de mim" (25, 50, 100 ou 200 km) na aba Encontrar carga.
- Cidade com sugestões do IBGE no match e no anúncio (`CidadeAutocomplete.tsx`).
- "Anunciar a volta" no Meu painel e no aviso de anúncio publicado (preenche o mesmo caminhão com origem e destino invertidos).
- Oportunidades em lista ou mapa (`MapaOportunidades.tsx`, agrupado por região).
- `src/lib/geo.ts`, `src/lib/geo-service.ts`; testes `src/test/match-v3.test.ts`.
- SQL: `docs/sql/02-popular-demo.sql` (bloco 3 com 11 testes), `03-teste-de-carga-match.sql`, `04-calibracao-score.sql`, `05-importar-municipios.sql`.

### Alterado
- Mapa desenha a rota gravada (sem nova chamada ao Google); só calcula no navegador quando o anúncio não tem rota.
- Edge Function `route-distance` com cache de 30 dias.
- Busca de caminhões usa as coordenadas do município escolhido quando o Google não calcula a rota.
- Referência de valor usa o R$/km do tipo de veículo quando cadastrado.

## [3.0.0] — 28/10/2026 · branch `feature/projeto`
Versão para demonstração a investidor. Decisões: `docs/DECISOES.md` (ADR 10–16); execução: `docs/V3-ANOTACOES.md`.

### Adicionado
- Personas "Tenho caminhão" e "Tenho carga"; CPF obrigatório e CNPJ opcional; cadastro abre com a persona por `?perfil=caminhao|carga`.
- Política de Privacidade (LGPD) em `/privacidade`; aceite obrigatório no cadastro, registrado com data e versão; aceite pelo Perfil para contas antigas.
- "Frete fechado": pergunta ao encerrar o anúncio, evento `fechado` e indicador no Meu painel.
- Home: seção "O frete de retorno, na prática" (exemplo, pesquisa e como o match decide).
- "Vence em X dias" no card e no painel; tipos de veículo "3/4" e "Carreta estendida".
- Migrações `20261028120000_v3_cpf_cnpj_aceite.sql` e `20261028120100_v3_frete_fechado.sql`.
- `src/lib/erros.ts`, `config-service.ts`, `personas.ts`, `privacidade.ts`, `links.ts`; `src/components/home/SecaoIlustrativa.tsx`; `src/pages/Privacidade.tsx`.
- Testes `src/test/v3.test.ts`; workflows `.github/workflows/qualidade.yml` e `manter-supabase-ativo.yml`.
- Imagem de compartilhamento `public/og-image.jpg`.
- Docs: `DEMONSTRACAO-V3.md`, `ROTEIRO-INVESTIDOR.md`, `TEXTOS-ANTES-DEPOIS.md`, `COMPATIBILIDADE-PARA-VALIDAR.md`, `V3-ANOTACOES.md`, `docs/sql/`.

### Alterado
- Textos de Home, menu, cadastro, anúncio, match, oportunidades, painel, perfil e 404 (lista em `TEXTOS-ANTES-DEPOIS.md`).
- Fonte Poppins e cores da landing; vermelho de erro com contraste AA; verde do WhatsApp da landing.
- Peso e volume obrigatórios no anúncio de carga.
- Valor de referência por km lido de `vt_match_config`.
- Rodapé com contato e redes oficiais.

### Removido
- Chave do Google Maps escrita no código (`RouteMap.tsx`).
- Frase "centenas de motoristas e empresas" (sem fonte); endereço de sede e link de Termos sem página.
