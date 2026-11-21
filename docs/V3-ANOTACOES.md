# Versão 3 — anotações de execução (para revisão do Douglas)

Trabalho feito sem supervisão, na branch `feature/projeto`. Aqui ficam as decisões tomadas no caminho
e o que depende de você. O resumo final está no fim deste arquivo.

## Decisões tomadas durante a execução
| # | Tarefa | Decisão | Por quê | Como desfazer |
|---|---|---|---|---|
| X1 | T1.1 | Sem a variável `VITE_GOOGLE_MAPS_BROWSER_KEY`, o mapa vira um cartão com o trajeto e o botão "Ver trajeto no Google Maps" (link sem chave) | Tirar a chave do código não pode quebrar a demonstração | Configurar a variável: o mapa volta a aparecer |
| X2 | T1.3 | Erros técnicos traduzidos num lugar só (`src/lib/erros.ts`); mensagens que o banco já escreve em português são mantidas | Um único ponto para manter os textos de erro | Editar a lista `TRADUCOES` |
| X3 | T1.4 | A referência do frete passa a ser `distância × valor_ref_km` do banco (`vt_match_config`), calculada na tela. O valor da Edge Function deixa de ser usado; visitante sem login vê o padrão R$ 6,50 | Muda o valor sem deploy e sem republicar a Edge Function | `UPDATE vt_match_config SET valor_ref_km = … WHERE id = 1;` |
| X4 | T2.1 | CNPJ **não é único** no banco | Uma transportadora pode ter vários usuários (motoristas, escritório) com o mesmo CNPJ | Índice único em `vt_usuario(cnpj)` |
| X5 | T2.1 | Contas antigas com CNPJ no campo `documento`: o valor é **copiado** para `cnpj`; o `documento` não muda. A tela Perfil pede o CPF a essas contas | Não há como inventar o CPF; a regra nova pede CPF sempre | — |
| X6 | T2.1 | O aceite é **obrigatório na tela**, não no banco (o banco só registra data e versão) | Bloquear no banco quebraria contas criadas por outros meios (painel do Supabase) e o cadastro inteiro se algo falhar | — |
| X7 | T2.2 | CPF, CNPJ e WhatsApp são gravados **só com números** (sem pontos e traços) | Evita CPF duplicado escrito de formas diferentes e o link do WhatsApp sempre funciona. Não é validação de dígito (essa ficou no roadmap) | — |
| X8 | T2.2 | `/cadastro?perfil=caminhao` e `/cadastro?perfil=carga` já abrem com a persona marcada | Os botões da Home e da landing levam a pessoa direto ao perfil certo | — |
| X9 | T2.4 | O Perfil mostra o CPF parcialmente oculto (`***.456.789-**`), permite editar CNPJ e WhatsApp, e pede o aceite da política a quem criou a conta antes da v3 | Proteção do dado na tela e regularização das contas antigas | — |
| X10 | T2.3 | A política cita como operadores Supabase, Netlify e Google, e WhatsApp como canal externo; retenção de 6 meses para registros de acesso (Marco Civil); resposta a pedidos em até 15 dias | São os serviços que a plataforma usa hoje e os prazos da lei | Editar `src/pages/Privacidade.tsx` e trocar a versão em `src/lib/privacidade.ts` |
| X11 | T3.1 | Lista de veículos em ordem de tamanho: VUC, 3/4, Toco, Truck, Bitruck, Carreta, Carreta estendida | Fica mais fácil achar o próprio caminhão | `tiposVeiculo` em `src/lib/catalogos.ts` (antes `mock-data.ts`) |
| X12 | T3.2 | Peso e volume obrigatórios **na tela** de anúncio de carga, com dica de estimativa (palete PBR) | Regra C2 aprovada; a função do banco não foi alterada, para não quebrar anúncios criados por outros meios | — |
| X13 | T3.5 | Se a migração "frete fechado" ainda não estiver aplicada, o botão Encerrar funciona do jeito antigo (só não registra o "fechado") | A demo não quebra se você esquecer de aplicar a migração | — |
| X14 | T3.5 | Também é possível encerrar um anúncio **expirado**, para informar um frete fechado depois do vencimento | Sem isso, fretes fechados no último dia se perderiam | — |
| X15 | T3.4 | Menu: "Oportunidades", "Match de frete", "Anunciar", "Meu painel". Match: abas "Encontrar carga" e "Encontrar caminhão"; a aba abre pela persona do cadastro ou por `?aba=carga`/`?aba=caminhao` | Mesmos termos da landing (A3/A4) | Textos em `Header.tsx` e `Matching.tsx` |
| X16 | T3.6 | Tabela de compatibilidade **não alterada**; perguntas em `docs/COMPATIBILIDADE-PARA-VALIDAR.md` | É regra de operação, precisa da sua validação | — |
| X17 | T4.1 | Hero: "O caminhão que voltaria vazio leva a sua carga." Botões "Tenho caminhão · Encontrar carga" e "Tenho carga · Encontrar caminhão": o visitante vai ao cadastro com a persona marcada e o usuário logado vai ao match na aba certa. A frase "centenas de motoristas" saiu | Tese do frete de retorno (A1) e nenhuma afirmação sem fonte (A2) | `src/pages/Index.tsx` |
| X18 | T4.2 | Seção ilustrativa com 3 blocos: a ida e a volta Juiz de Fora ⇄ São Paulo (selo "Exemplo ilustrativo"), 3 achados da pesquisa (38%, 69%, 63%, com a base de cada um e o link para o Hub) e os pesos do match | Só números com fonte; o que é exemplo está marcado | `src/components/home/SecaoIlustrativa.tsx` |
| X19 | T4.2 | O bloco "Anúncios ativos agora" só aparece quando há anúncios | Uma vitrine vazia na frente do investidor passa a impressão errada | — |
| X20 | T4.3 | Fonte Poppins (a mesma da landing e do Hub); verde do WhatsApp `#15803d`; vermelho de erro mais escuro (3,8:1 → 6:1 com branco) | Uma marca só e contraste AA | Tokens em `src/index.css` e `tailwind.config.ts` |
| X21 | T4.4 | Rodapé sem o endereço "Sede: Belo Horizonte" e sem o link "Termos de Uso" | O endereço não foi confirmado e a página de Termos ainda não existe (roadmap) | Voltam quando você confirmar o endereço e houver Termos |
| X22 | T4.5 | Imagem de compartilhamento `public/og-image.jpg` (1200×630) e títulos novos; endereço absoluto `https://voltaexpress.com.br/og-image.jpg` | O WhatsApp e o LinkedIn só mostram prévia com endereço completo | `index.html` |
| X23 | T4.6 | Revisão de celular **pelo código**, não por captura de tela: botões principais com no mínimo 44–48 px, botões em coluna no celular, menu com alvo de 44 px | Não deu para gerar o build aqui (sem acesso ao registro do npm e com o disco lento para copiar o `node_modules`) | Você confere no passo de teste no celular |
| X24 | T5.1 | Roteiro novo em `docs/DEMONSTRACAO-V3.md` (datas D+N) e o `DEMONSTRACAO.md` original **não foi tocado** | O original tem edições suas ainda sem commit | — |
| X25 | T5.1 | Script `docs/sql/01-renovar-demo.sql`: move as datas dos anúncios dos 4 usuários de demonstração (pelo nome) e reativa | Na véspera da apresentação, a demo nunca está vencida | Só roda no dev; o bloco 1 mostra antes o que muda |
| X26 | T5.2 | Workflow que consulta o Supabase 2x por semana com a chave **pública**; sem os segredos configurados, ele só pula | Evita a pausa do plano gratuito sem expor chave de servidor | Apagar o arquivo do workflow |
| X27 | T5.2 | Workflow de qualidade (TypeScript, lint, testes, build) em todo push e PR. O lint não bloqueia, por causa dos 2 erros conhecidos do shadcn | Era o item F2.3 do plano anterior; não muda nada no produto | Apagar `.github/workflows/qualidade.yml` |
| X28 | T5.3 | A demonstração logada é no projeto **dev**; em produção só a Home pública | Não criar dados falsos em produção | — |
| X29 | T6.1 | Landing: e-mail `voltaexpressbrasil@gmail.com` e as redes X e TikTok nas 3 páginas; `CHANGELOG` 7.0.1. **A landing estava na branch `main`** quando editei | Não troco de branch por você (o Git deixa arquivos de trava que eu não consigo apagar) | Antes do commit: `git checkout v6.3-incubacao` (as mudanças vão junto) |
| X30 | T6.2 | Hub: canais oficiais (Plataforma, landing, WhatsApp, Instagram, Facebook, YouTube, X, TikTok, GitHub) e marco "Plataforma v3"; catálogo e jornada regerados; validação OK. O e-mail ficou fora porque o schema do Hub só aceita links `https://` | Contatos iguais nos 3 projetos | `data/curadoria.json`, `data/marcos.json` |
| X31 | T6.2 | `__pycache__/` entrou no `.gitignore` do Hub (2 arquivos `.pyc` foram commitados no último push) | Arquivo gerado não vai para o repositório | — |

## O que você precisa fazer
| # | Ação | Quando |
|---|---|---|
| V1 | Pôr `VITE_GOOGLE_MAPS_BROWSER_KEY=<chave do navegador>` no `.env.development.local` e nas variáveis do Netlify | Antes de testar o mapa |
| V2 | No Google Cloud, **restringir** a chave antiga (estava no código e continua no histórico do Git) aos domínios `voltaexpress.com.br`, `www.voltaexpress.com.br` e `localhost:8080`, ou trocá-la por uma nova | Antes da demo |
| V3 | Tirar o `.env` do Git (o arquivo continua no seu disco): `git rm --cached .env` e commit. Antes, confira que ele só tem variáveis `VITE_` (veja a seção "Comandos") | No commit da etapa 1 |
| V4 | Aplicar no projeto **dev** as migrações `20261028120000_v3_cpf_cnpj_aceite.sql` e `20261028120100_v3_frete_fechado.sql` (SQL Editor, nesta ordem). Testadas aqui num Postgres 16 com o esquema da plataforma: rodam 2 vezes sem erro | Antes de testar cadastro e painel |
| V5 | Preencher **razão social, CNPJ e endereço** em `src/pages/Privacidade.tsx` (campos entre colchetes) e pedir **revisão de um advogado** antes de publicar em produção | Antes do merge na `main` |
| V6 | Validar `docs/COMPATIBILIDADE-PARA-VALIDAR.md` (marcar sim/não e responder S1–S4) | Quando puder; não bloqueia a demo |
| V7 | Apagar `node_modules/.cache/claude-nm.tgz` (arquivo vazio que sobrou de uma tentativa de build) | Quando quiser |
| V8 | Configurar no GitHub (Settings → Secrets → Actions) `SUPABASE_URL` e `SUPABASE_ANON_KEY` (produção) e, se quiser, `SUPABASE_DEV_URL` e `SUPABASE_DEV_ANON_KEY` | Depois do push |
| V9 | Revisar `docs/TEXTOS-ANTES-DEPOIS.md` e me dizer os números que quer mudar | Antes do merge na `main` |
| V10 | Hub: `git rm -r --cached scripts/__pycache__` antes do próximo commit | No commit do Hub |

## Match v3 e mapas (28/10) — o que você precisa fazer
Detalhes: `docs/MATCH.md` (seção 11) e `docs/MATCH-PONTUACAO-V3.md`. Nenhuma ação abaixo toca na produção.

| # | Ação | Pronto quando |
|---|---|---|
| V11 | No **DEV**, depois de V4: SQL Editor → colar e rodar `supabase/migrations/20261029120000_m3_match_v3.sql` | `docs/sql/00-diagnostico.sql`, bloco 3: as 4 linhas "M3" com `true` |
| V12 | Importar os municípios do IBGE: `docs/sql/05-importar-municipios.sql` (baixar o CSV, importar pelo Table Editor, rodar os blocos A, B e C) | Bloco A: ~5.570 municípios e o teste mostra "São José dos Campos / SP" |
| V13 | Popular e conferir: `docs/sql/02-popular-demo.sql`, blocos 0 → 1 → 2 → 3 | Bloco 3: 11 linhas com `ok = true` |
| V14 | Publicar a Edge Function `route-distance` (cache de rota). Pelo painel do Supabase (Edge Functions → route-distance → colar o novo `index.ts` → Deploy) ou `supabase functions deploy route-distance`. A chave de serviço já existe dentro da função; não copie nenhuma chave | Buscar a mesma rota duas vezes: na tabela `vt_rota_cache` aparece 1 linha |
| V15 | (Opcional) Preencher `vt_valor_referencia` com o R$/km de cada tipo de veículo, tirado da calculadora oficial da ANTT | O detalhe do anúncio mostra "Referência da plataforma (R$ X/km)" com o valor do tipo |
| V16 | Testar no app (com `VITE_GOOGLE_MAPS_BROWSER_KEY` no `.env.development.local`): roteiro abaixo | Os 7 passos batem |

**Roteiro no app (logado como Carlos):**
1. Match de frete → Encontrar carga → digite "goia" na origem: aparece "Goiânia GO" (se V12 foi feito). Escolha; a UF se preenche sozinha.
2. Goiânia/GO → Uberlândia/MG, hoje+2 a hoje+5, Baú, 14.000 kg, 45 m³ → mapa com a rota, a faixa laranja clara de 25 km e 3 pontos de coleta com a nota; Caldas Novas não aparece. O cartão do Fertilizante diz "coleta no km ~200 da sua rota"; o das Embalagens mostra quantos km a mais na estrada (o número depende do traçado do Google).
3. "Cargas perto de mim" (o navegador pede a localização): a busca mostra o círculo e as cargas a até 50 km de onde você está. Fora de Goiás/Nordeste, o resultado esperado é "nenhuma"; amplie para 200 km para testar.
4. Encontrar caminhão → Carga seca, 9.000 kg, 25 m³, Itumbiara/GO → Goiânia/GO, hoje+7 a hoje+9 → o Truck voltando aparece com o selo verde **Frete de retorno** e nota ~91.
5. Meu painel → num anúncio de caminhão, **Anunciar a volta** → o formulário abre preenchido com o mesmo caminhão, origem e destino invertidos e datas após a ida.
6. Publique um anúncio de caminhão → o aviso oferece **Anunciar a volta** por 10 segundos.
7. Oportunidades → **Mapa**: pontos azuis (caminhões) e laranja (cargas), agrupados por região; clique abre o detalhe, com a rota desenhada sem "Calculando melhor trajeto...".

## Passo a passo para amanhã

### A. Plataforma (`C:\veb\voltaexpress`, branch `feature/projeto`) — cerca de 1h
1. **Conferir o `.env`** (mostra só os nomes, nunca os valores):
   ```bash
   cd /c/veb/voltaexpress
   grep -ho '^[A-Z_]*=' .env .env.development.local
   ```
   Pronto quando: só aparecem nomes que começam com `VITE_`. Se aparecer `SERVICE_ROLE` ou outro nome, pare e me avise.
2. **Banco dev** (Supabase → SQL Editor):
   - rode os blocos 1 a 3 de `docs/sql/00-diagnostico.sql`, um de cada vez;
   - aplique `supabase/migrations/20261028120000_v3_cpf_cnpj_aceite.sql` e depois `20261028120100_v3_frete_fechado.sql`;
   - rode de novo o bloco 3 do diagnóstico. Pronto quando: as linhas M11 e M12 aparecem como `true`.
3. **Mapa:** coloque `VITE_GOOGLE_MAPS_BROWSER_KEY=...` no `.env.development.local` (V1).
4. **Verificação automática:**
   ```bash
   npm install
   npm test                                 # esperado: todos passando (os 13 de antes + 6 novos)
   npx tsc --noEmit -p tsconfig.app.json    # esperado: nenhuma saída
   npm run lint                             # esperado: 2 erros, os conhecidos de src/components/ui
   npm run build                            # esperado: "built in …"
   npm run dev                              # abra http://localhost:8080
   ```
5. **Teste manual:** siga `docs/DEMONSTRACAO-V3.md` (13 passos) e confira no celular (`Ctrl+Shift+M`, 360 px): Home, Criar conta, Anunciar, Match e Meu painel, sem rolagem lateral.
6. **Revisões:** `docs/TEXTOS-ANTES-DEPOIS.md` (V9) e `docs/COMPATIBILIDADE-PARA-VALIDAR.md` (V6).
7. **Commit e push:**
   ```bash
   git rm --cached .env
   git add -A
   git status            # .env como "D"; docs/DEMONSTRACAO.md é a sua edição antiga — decida se entra
   git commit -m "feat(v3): personas, LGPD, frete fechado, Home do frete de retorno e identidade unificada"
   git push origin feature/projeto
   ```
8. Depois do ensaio: `feature/projeto` → `developer-v3` → `main`. **Antes da `main`:** aplicar as migrações v3 na produção, preencher os dados da empresa e passar a política pelo advogado (V5), e configurar os segredos do GitHub (V8).

### B. Landing (`C:\veb\voltaexpressbrasil`) — 10 min
```bash
cd /c/veb/voltaexpressbrasil
git checkout v6.3-incubacao        # as 4 mudanças vão junto
git add index.html quero-carregar/index.html quero-transportar/index.html CHANGELOG.md
git commit -m "chore(landing): contato e redes oficiais (7.0.1)"
git push origin v6.3-incubacao
# depois: developer-v6 → main, como da última vez
```

### C. Hub (`C:\veb\voltaexpressbrasil-hub`) — 10 min
```bash
cd /c/veb/voltaexpressbrasil-hub
python scripts/validar_dados.py    # "dados válidos: ..."
git rm -r --cached scripts/__pycache__
git add -A
git commit -m "chore(hub): canais oficiais, marco Plataforma v3 e .gitignore do Python"
git push origin main
```
