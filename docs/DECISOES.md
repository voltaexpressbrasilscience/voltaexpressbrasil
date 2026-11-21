# Registro de Decisões — Plataforma Volta Express

## ADR 1 — Dados de contato do anunciante por função segura (P1)
- **Contexto:** a política "Public can view active users" permitia a qualquer visitante, mesmo sem login, ler todas as colunas de `vt_usuario`.
- **Decisão:** remover a política e criar a função `vt_anunciantes(ids)` (SECURITY DEFINER), que devolve só nome, telefone e foto de quem tem anúncio ativo, e só para usuários logados. Cada usuário lê apenas o próprio perfil na tabela.
- **Consequência:** documento (CPF/CNPJ) deixa de ser exposto; o contato via WhatsApp continua funcionando. No Match v2, o telefone passa a ser liberado só após "tenho interesse".

## ADR 2 — Ambiente de desenvolvimento separado
- **Decisão:** testes locais usam um projeto Supabase gratuito `voltaexpress-dev`, com `.env.development.local`.
- **Consequência:** produção sem dados de teste; toda migração é validada no dev antes de ir para produção.

## ADR 3 — Dados de demonstração fictícios e roteiro fixo
- **Decisão:** 4 usuários e 8 anúncios fictícios (DEMONSTRACAO.md), com resultados esperados documentados.
- **Consequência:** o mesmo roteiro serve de linha de base para medir o Match v2.

## ADR 1 (atualização) — Telefone só após interesse
- A partir do Match v2, `vt_anunciantes` devolve só nome e foto. O telefone é liberado por `vt_registrar_interesse`, que registra o contato.

## ADR 4 — Placa visível só para usuários logados (P1.1)
- **Decisão:** as políticas de leitura de `vt_veiculo` e `vt_carroceria` de anúncios ativos passam a valer só para `authenticated`.
- **Consequência:** visitantes da página inicial veem o anúncio sem tipo de veículo e são convidados a entrar.

## ADR 5 — Edge Functions protegidas (P2)
- **Decisão:** CORS só para os domínios da plataforma (`ALLOWED_ORIGINS`), login obrigatório, 30 chamadas/min por usuário e validação de entrada, num módulo comum (`_shared/seguranca.ts`).
- **Consequência:** a cota do Google não fica exposta; visitantes não calculam rotas.

## ADR 6 — Expiração automática (P3)
- **Decisão:** `pg_cron` roda `expire_anuncios()` todo dia às 03:05 UTC; as consultas também ignoram anúncios com data fim no passado.

## ADR 7 — Persona define a aba inicial, não restringe (R1)
- **Decisão provisória:** caminhoneiro abre em "Veículo", empresa em "Carga"; ambos ainda podem publicar os dois tipos.
- **Pendente:** decidir se a plataforma deve restringir o tipo de anúncio pela persona.

## ADR 8 — Match no banco com PostGIS (M2)
- **Contexto:** o match no navegador ignorava carroceria, datas e sentido, e fazia até 16 chamadas ao Google por busca.
- **Decisão:** rota gravada no anúncio; funções `vt_match_cargas`/`vt_match_veiculos` com filtros obrigatórios, encaixe geográfico (raio de 30 km, ordem origem→destino), score 0–100 e motivos. Regras em tabelas editáveis (`vt_compatibilidade`, `vt_match_config`).
- **Consequência:** resultados corretos e explicáveis; anúncios antigos (sem rota) caem no modo cidade até serem republicados.

## ADR 9 — Tokens de design alinhados à landing (DS1)
- **Decisão:** a plataforma usa a paleta da landing; tons de texto e botão escurecidos para contraste AA. Logos e nome inalterados.

## ADR 7 (decisão final, v3) — Qualquer conta anuncia caminhão ou carga
- **Decisão (27/10/2026):** a persona só define a aba que abre primeiro (no Anunciar e no Match). Exemplo: o caminhoneiro que precisa mandar uma geladeira anuncia uma carga.

## ADR 10 — Persona separada do documento (v3)
- **Contexto:** o cadastro amarrava "Caminhoneiro = pessoa física" e "Empresa = pessoa jurídica", mas há motorista autônomo com CNPJ (MEI), transportadora com um caminhão ou frota, e embarcador pessoa física.
- **Decisão:** personas "Tenho caminhão" (motorista autônomo ou transportadora) e "Tenho carga" (embarcador). CPF do responsável sempre obrigatório (`vt_usuario.documento`); CNPJ opcional (`vt_usuario.cnpj`, não único). Migração `20261028120000_v3_cpf_cnpj_aceite.sql`.
- **Consequência:** contas antigas com CNPJ no `documento` têm o CNPJ copiado para a coluna nova e informam o CPF no Perfil. A validação dos dígitos ficou no roadmap.

## ADR 11 — Aceite da Política de Privacidade registrado (v3, LGPD)
- **Decisão:** aceite obrigatório na tela de cadastro; o banco grava `aceite_privacidade_em` e `versao_politica`. Página pública `/privacidade`. Contas antigas aceitam pelo Perfil.
- **Consequência:** prova do consentimento por versão. O texto precisa de revisão jurídica e dos dados da empresa (razão social, CNPJ e endereço) antes de ir para produção.

## ADR 12 — Frete fechado como medida da North Star (v3)
- **Decisão:** ao encerrar um anúncio, a pergunta "O frete foi fechado pela Volta Express?" grava o evento `fechado` em `vt_match_evento` (função `vt_encerrar_anuncio`). O painel mostra "Fretes fechados". Migração `20261028120100_v3_frete_fechado.sql`.
- **Consequência:** a plataforma passa a medir conversão, não só contato. É autodeclarado; pode ser confirmado com o outro lado no futuro.

## ADR 13 — Nenhum número sem fonte na interface (v3)
- **Decisão:** sai "centenas de motoristas e empresas". A seção ilustrativa da Home usa só a pesquisa de set/2024 (com a base de cada número e o link para o Hub), os pesos do match e um exemplo marcado como ilustrativo.

## ADR 14 — Parâmetros de negócio no banco (v3)
- **Decisão:** o valor de referência por km sai do código e é lido de `vt_match_config.valor_ref_km` (padrão R$ 6,50 para visitantes e se o banco não responder).

## ADR 15 — Mapa sem chave no código (v3)
- **Decisão:** a chave do Google Maps só vem de `VITE_GOOGLE_MAPS_BROWSER_KEY`. Sem ela, o mapa vira um cartão com o link do trajeto no Google Maps.
- **Consequência:** a chave antiga continua no histórico do Git: precisa ser restringida por domínio ou trocada.

## ADR 16 — Uma marca nos três projetos (v3)
- **Decisão:** fonte Poppins, cores e contraste da landing, termos da landing ("Tenho caminhão", "Tenho carga", "Encontrar carga", "Encontrar caminhão"), contato oficial `voltaexpressbrasil@gmail.com` e WhatsApp 5532988367667, redes `voltaexpressbrasil`.

## ADR 17 — Raio proporcional à rota (Match v3)
- **Decisão:** a faixa de busca é 5% do comprimento da rota, entre 25 e 60 km (antes: 30 km para qualquer rota). Parâmetros em `vt_match_config`.
- **Consequência:** rotas curtas ficam mais exigentes (Goiatuba, a 21 km de Goiânia–Uberlândia, ainda entra, com nota menor); rotas longas aceitam desvios maiores.

## ADR 18 — Nota neutra quando não há rota (Match v3)
- **Decisão:** sem rota calculada (modo cidade), desvio e aproveitamento valem 0,7 em vez de 1, e o motivo diz "rota não calculada".
- **Consequência:** uma busca só por cidade não tira mais a mesma nota de um encaixe conferido no mapa (91 → 75 no cenário de teste).

## ADR 19 — Pesos v3: aproveitamento 15, valor 15 (Match v3)
- **Decisão:** o aproveitamento da rota cai de 20 para 15 e o valor sobe de 10 para 15. A troca só acontece se os pesos ainda forem os padrões da v2.
- **Alternativa descartada:** manter até ter dados. Descartada porque o caso "carga curta e bem paga" aparecia mal no teste.
- **Consequência:** hipótese até a calibração com contatos e fretes fechados (`docs/sql/04-calibracao-score.sql`).

## ADR 20 — Desvio dito como é (Match v3)
- **Decisão:** o motivo mostra a distância da coleta e da entrega até a rota e a estimativa de km a mais na estrada (2 × 1,3 × distância, arredondado de 5 em 5).
- **Consequência:** o número do cartão fica maior e mais honesto. O exato exige rota com paradas (M7, próxima etapa).

## ADR 21 — Frete de retorno reconhecido (Match v3)
- **Decisão:** caminhão com outro anúncio do mesmo veículo terminando a até 50 km da origem deste é "voltando de viagem": selo, motivo e +5 pontos na busca de caminhões. O Meu painel e o aviso de publicação oferecem "Anunciar a volta".
- **Consequência:** a proposta de valor da empresa aparece na tela e passa a ser medida.

## ADR 22 — Municípios do IBGE como base de cidades (Match v3)
- **Decisão:** tabela `vt_municipio` (importada de CSV), autocompletar no match e no anúncio e preenchimento de coordenadas quando o Google não responde.
- **Alternativa descartada:** Places Autocomplete do Google (pago por uso, e o endereço completo não é necessário).
- **Consequência:** o campo continua aceitando texto livre; sem a importação, funciona como antes.

## ADR 23 — Google só quando precisa (Match v3)
- **Decisão:** o mapa desenha a rota gravada; a Edge Function guarda as rotas por 30 dias (`vt_rota_cache`, só com service role); a busca de caminhões usa as coordenadas do município quando não há rota.
- **Consequência:** menos chamadas pagas e menos dependência da chave. A migração para a Routes API fica para quando precisarmos de paradas ou pedágio.
