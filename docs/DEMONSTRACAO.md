# Dados de Demonstração — Plataforma Volta Express (Match v2)

> Somente no projeto **dev**. Todos os nomes, documentos e telefones são **fictícios**.
> E-mails: use o seu Gmail com "+" (ex.: `seu.email+veb-carlos@gmail.com`); com "Confirm email" desligado, nenhuma mensagem é enviada.

## 1. Usuários (tela **Cadastro**)
| # | Tipo de usuário | Nome | E-mail | CPF/CNPJ (fictício) | WhatsApp (fictício) | Senha |
|---|---|---|---|---|---|---|
| U1 | Caminhoneiro | Carlos Andrade | pedep79925@caps7.com | 020.851.608-59 | 1832462553 | 79925@caps7 |
| U2 | Caminhoneiro | Marta Ribeiro | seu.email+veb-marta@gmail.com | 222.222.222-22 | 5532990000002 | Teste@123 |
| U3 | Empresa | Laticínios Serra Verde (fictícia) | seu.email+veb-serraverde@gmail.com | 11.111.111/0001-11 | 5532990000003 | Teste@123 |
| U4 | Empresa | Distribuidora Rota Sul (fictícia) | seu.email+veb-rotasul@gmail.com | 22.222.222/0001-22 | 5532990000004 | Teste@123 |

Para testar o WhatsApp de verdade, use o seu celular em um dos usuários.

## 2. Anúncios de veículo (login de U1 e U2 → **Criar Anúncio**, aba Veículo já selecionada)
| # | Dono | Placa | Tipo | Capacidade (kg) | Volume (m³) | Carroceria | Refrigerado | Origem | Destino | Início | Fim | Valor (R$) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| V1 | Carlos | TST1A23 | Truck | 14000 | 45 | Baú | Não | Juiz de Fora / MG | São Paulo / SP | 05/10/2026 | 10/10/2026 | 3200 |
| V2 | Carlos | TST1A23 | Truck | 14000 | 45 | Baú | Não | São Paulo / SP | Juiz de Fora / MG | 11/10/2026 | 15/10/2026 | 2800 |
| V3 | Marta | TST2B34 | Carreta | 26000 | 80 | Baú | Sim | Belo Horizonte / MG | Rio de Janeiro / RJ | 06/10/2026 | 09/10/2026 | 4500 |
| V4 | Marta | TST2B34 | Carreta | 26000 | 80 | Baú | Sim | Rio de Janeiro / RJ | Belo Horizonte / MG | 10/10/2026 | 14/10/2026 | 3900 |

Espere aparecer "Rota calculada: … km" antes de publicar (só com o Google configurado). A mesma placa gera **um** veículo só.

## 3. Anúncios de carga (login de U3 e U4 → **Criar Anúncio**, aba Carga já selecionada)
| # | Dono | Descrição | Categoria | Exige refrigeração | Peso (kg) | Volume (m³) | Origem | Destino | Início | Fim | Valor (R$) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| C1 | Serra Verde | Queijos e iogurtes | Refrigerada | Sim (automático) | 12000 | 30 | Juiz de Fora / MG | Rio de Janeiro / RJ | 07/10/2026 | 09/10/2026 | 2600 |
| C2 | Serra Verde | Leite UHT paletizado | Carga seca | Não | 9000 | 25 | Juiz de Fora / MG | São Paulo / SP | 06/10/2026 | 10/10/2026 | 3000 |
| C3 | Rota Sul | Eletrodomésticos paletizados | Carga seca | Não | 8000 | 40 | São Paulo / SP | Juiz de Fora / MG | 12/10/2026 | 15/10/2026 | 2700 |
| C4 | Rota Sul | Bobinas de aço | Máquinas e volumes grandes | Não | 24000 | 20 | Curitiba / PR | Porto Alegre / RS | 20/10/2026 | 25/10/2026 | 5500 |

C4 é o **caso de controle**: não combina com nenhum veículo (carroceria, região e data).

## 4. Roteiro e resultados esperados (Match v2)
"Com Google" = etapa 6 do AMBIENTE-LOCAL feita (modo rota). "Sem Google" = modo cidade.

| Passo | Login | Tela e preenchimento | Esperado com Google | Esperado sem Google | O que demonstra |
|---|---|---|---|---|---|
| 1 | Carlos | **Buscar** | 8 anúncios com nome do anunciante e botão "Tenho interesse" | igual | P1: dados de contato protegidos |
| 2 | Carlos | **Matching → Buscar cargas**: Baú · 14000 · Juiz de Fora/MG → São Paulo/SP | só **C2** (~84), motivos "desvio de 0 km · usa 100% da sua rota…" | só C2 | M3: nada no sentido errado |
| 3 | Carlos | Baú · 14000 · São Paulo/SP → Juiz de Fora/MG | só **C3** (frete de retorno) | só C3 | Negócio: a viagem de volta cheia |
| 4 | Marta | Baú · Refrigerado · 26000 · Belo Horizonte/MG → Rio de Janeiro/RJ | só **C1** (Juiz de Fora fica no caminho) | nenhum (cidades diferentes) | Encaixe no caminho, não só origem/destino iguais |
| 5 | Marta | Baú · Refrigerado · 26000 · sem cidades | C1, C2, C3 nesta ordem | igual | M1/M2: bobinas (C4) nunca aparecem para baú |
| 6 | Carlos | Baú · **sem** refrigerado · sem cidades | C2 e C3 (C1 exige frio) | igual | Refrigeração obrigatória |
| 7 | Rota Sul | **Buscar veículos**: Carga seca · 8000 · 40 · São Paulo/SP → Juiz de Fora/MG | só **V2** (V1 é sentido contrário) | só V2 | M7: lógica da empresa corrigida |
| 8 | Serra Verde | Refrigerada · 12000 · Juiz de Fora/MG → Rio de Janeiro/RJ | só **V3** | nenhum | Carga no meio da rota do veículo |
| 9 | Carlos | No card de C2: **Tenho interesse** | Abre o WhatsApp da Serra Verde | igual | Telefone só após interesse (registrado) |
| 10 | Serra Verde | **Meu painel** | "Interesses recebidos: 1"; C1 e C2 listados; pausar C1 e ver que some do Matching da Marta | igual | M12 e P11 |
| 11 | — | `curl` do AMBIENTE-LOCAL, item 7 | `[]` e `permission denied` | igual | Visitante sem acesso |

Os scores exatos podem variar alguns pontos pela data do dia (proximidade da coleta).

## 5. Linha de base (antes do Match v2)
Com o algoritmo antigo, os passos 2, 3 e 7 mostravam também anúncios no sentido contrário, e o passo 5 mostrava as bobinas de aço para um baú refrigerado. É a comparação para a diretoria.

Criando :

| U3 | Empresa | Laticínios Serra Verde (fictícia) |   
gofifex843@hudzer.com
82.086.404/0001-04
6638212311
ex843@hudz

