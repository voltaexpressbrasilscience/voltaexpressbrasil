# Demonstração — Plataforma Volta Express (v3)

> Somente no projeto **dev**. Todos os nomes, documentos e telefones são **fictícios**.
> Substitui as datas fixas do `DEMONSTRACAO.md` (que venceram em outubro) por **datas relativas ao dia D**,
> o dia em que você cria os anúncios. O `DEMONSTRACAO.md` original não foi alterado: ele tem edições suas sem commit.
> E-mails: use o seu Gmail com "+" (ex.: `seu.email+veb-carlos@gmail.com`). Senhas: escolha uma de teste (mín. 6).

## 0. Antes de começar
1. Migrações aplicadas no dev, incluindo as duas da v3 (`docs/sql/00-diagnostico.sql` confirma).
2. `npm run dev` e http://localhost:8080 abertos.
3. Na véspera da apresentação, se os anúncios já existirem: `docs/sql/01-renovar-demo.sql` (move as datas e reativa).

## 1. Usuários (tela **Criar conta**)
| # | Persona | Nome | CPF (fictício) | CNPJ (fictício) | WhatsApp |
|---|---|---|---|---|---|
| U1 | Tenho caminhão | Carlos Andrade | 111.111.111-11 | — (autônomo) | 32 99000-0001 |
| U2 | Tenho caminhão | Marta Ribeiro | 222.222.222-22 | 22.333.444/0001-55 (transportadora) | 32 99000-0002 |
| U3 | Tenho carga | Laticínios Serra Verde (fictícia) | 333.333.333-33 | 11.111.111/0001-11 | 32 99000-0003 |
| U4 | Tenho carga | Distribuidora Rota Sul (fictícia) | 444.444.444-44 | 22.222.222/0001-22 | 32 99000-0004 |

Marque "Li e aceito a Política de Privacidade" em todos. Para testar o WhatsApp de verdade, use o seu celular em um deles.
Os nomes precisam ser **exatamente** estes: o script de renovação procura por eles.

## 2. Caminhões (login de U1 e U2 → **Anunciar**, aba "Tenho caminhão")
D = dia em que você cria os anúncios. Ex.: criando em 04/11/2026, "D+7" = 11/11/2026.

| # | Dono | Placa | Tipo | Capacidade (kg) | Volume (m³) | Carroceria | Refrigerado | Origem | Destino | Início | Fim | Valor (R$) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| V1 | Carlos | TST1A23 | Truck | 14000 | 45 | Baú | Não | Juiz de Fora / MG | São Paulo / SP | D+7 | D+12 | 3200 |
| V2 | Carlos | TST1A23 | Truck | 14000 | 45 | Baú | Não | São Paulo / SP | Juiz de Fora / MG | D+13 | D+17 | 2800 |
| V3 | Marta | TST2B34 | Carreta | 26000 | 80 | Baú | Sim | Belo Horizonte / MG | Rio de Janeiro / RJ | D+8 | D+11 | 4500 |
| V4 | Marta | TST2B34 | Carreta | 26000 | 80 | Baú | Sim | Rio de Janeiro / RJ | Belo Horizonte / MG | D+12 | D+16 | 3900 |

## 3. Cargas (login de U3 e U4 → **Anunciar**, aba "Tenho carga")
Peso e volume agora são obrigatórios.

| # | Dono | Descrição | Categoria | Refrigeração | Peso (kg) | Volume (m³) | Origem | Destino | Início | Fim | Valor (R$) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| C1 | Serra Verde | Queijos e iogurtes | Refrigerada | Sim (automático) | 12000 | 30 | Juiz de Fora / MG | Rio de Janeiro / RJ | D+9 | D+11 | 2600 |
| C2 | Serra Verde | Leite UHT paletizado | Carga seca | Não | 9000 | 25 | Juiz de Fora / MG | São Paulo / SP | D+8 | D+12 | 3000 |
| C3 | Rota Sul | Eletrodomésticos paletizados | Carga seca | Não | 8000 | 40 | São Paulo / SP | Juiz de Fora / MG | D+14 | D+17 | 2700 |
| C4 | Rota Sul | Bobinas de aço | Máquinas e volumes grandes | Não | 24000 | 20 | Curitiba / PR | Porto Alegre / RS | D+22 | D+27 | 5500 |

C4 é o **caso de controle**: não combina com nenhum caminhão (carroceria, região e data).

## 4. Roteiro e resultados esperados
"Com Google" = função de rotas publicada e chave do Google configurada (modo rota). "Sem Google" = modo cidade.

| Passo | Login | Tela e preenchimento | Esperado com Google | Esperado sem Google | O que demonstra |
|---|---|---|---|---|---|
| 1 | — (visitante) | **Home** | Seção "O frete de retorno, na prática" e "Anúncios ativos agora" sem contato | igual | Proposta de valor e proteção do contato |
| 2 | Carlos | **Oportunidades** | 8 anúncios, com "Vence em X dias" | igual | Vitrine com validade |
| 3 | Carlos | **Match de frete → Encontrar carga**: Baú · 14000 · Juiz de Fora/MG → São Paulo/SP | só **C2**, com motivos ("desvio de 0 km · usa 100% da sua rota…") | só C2 | Nada no sentido errado |
| 4 | Carlos | Baú · 14000 · São Paulo/SP → Juiz de Fora/MG | só **C3** | só C3 | **Frete de retorno**: a volta cheia |
| 5 | Marta | Baú · Refrigerado · 26000 · Belo Horizonte/MG → Rio de Janeiro/RJ | só **C1** (Juiz de Fora fica no caminho) | nenhum | Encaixe no caminho, não só cidades iguais |
| 6 | Marta | Baú · Refrigerado · 26000 · sem cidades | C1, C2, C3 nesta ordem | igual | Bobinas (C4) nunca aparecem para baú |
| 7 | Carlos | Baú · **sem** refrigerado · sem cidades | C2 e C3 (C1 exige frio) | igual | Refrigeração obrigatória |
| 8 | Rota Sul | **Encontrar caminhão** (abre sozinha para quem tem carga): Carga seca · 8000 · 40 · São Paulo/SP → Juiz de Fora/MG | só **V2** | só V2 | O lado da carga também acha o caminhão certo |
| 9 | Serra Verde | Refrigerada · 12000 · Juiz de Fora/MG → Rio de Janeiro/RJ | só **V3** | nenhum | Carga no meio da rota do caminhão |
| 10 | Carlos | No card de C2: **Tenho interesse** | Abre o WhatsApp da Serra Verde | igual | Telefone só depois do interesse (registrado) |
| 11 | Serra Verde | **Meu painel** | "Interesses recebidos: 1"; C1 e C2 com "Vence em X dias" | igual | Indicadores |
| 12 | Serra Verde | Encerrar C2 → "Sim, fechamos o frete" | Indicador "Fretes fechados: 1" | igual | **North Star**: viagens que deixaram de rodar vazias |
| 13 | — | `/privacidade` e o Perfil de qualquer usuário | Política completa; Perfil com CPF oculto e data do aceite | igual | LGPD |

As notas exatas podem variar alguns pontos conforme a data do dia (proximidade da coleta).
