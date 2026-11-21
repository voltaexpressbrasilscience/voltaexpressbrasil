# Roteiro de apresentação para investidor (v3)

Duração: **7 minutos** + perguntas. Ordem: **Hub → landing → plataforma**. A história é uma só:
*o caminhão que voltaria vazio leva a sua carga* (frete de retorno).

## Véspera (30 min)
| # | Checagem | Pronto quando |
|---|---|---|
| 1 | Rodar `docs/sql/01-renovar-demo.sql` no projeto **dev** | Os 8 anúncios de demonstração estão ativos e vencem daqui a 1 a 4 semanas |
| 2 | Entrar com as 4 contas da `DEMONSTRACAO-V3.md` | As 4 entram sem erro |
| 3 | Fazer os passos 3, 4 e 12 do roteiro da demonstração | C2, C3 e "Fretes fechados" aparecem como esperado |
| 4 | Abrir as 3 abas no navegador, já logado com o Carlos na plataforma | Nada para carregar na hora |
| 5 | Plano B pronto: capturas de tela dos passos 3, 4 e 12 (ou um vídeo de 1 min) num slide | Se a internet cair, a história continua |
| 6 | Celular carregado com o link da Home aberto | Para mostrar que funciona no celular |

## Roteiro (7 min)
| Tempo | Onde | O que mostrar | O que dizer |
|---|---|---|---|
| 0:00–1:30 | **Hub** → Visão geral | Números com fonte, North Star | "Tudo aqui tem fonte e data. Nossa métrica principal é frete de retorno conectado." |
| 1:30–2:30 | **Hub** → Pesquisa | 42 respostas, descompasso GO/MG/SP, 63% sem volume | "Ouvimos os dois lados antes de construir. O que aprendemos virou regra do produto." |
| 2:30–3:15 | **Landing** (voltaexpressbrasil.com.br) | Home e as duas portas: Tenho caminhão / Tenho carga | "Duas personas, uma entrada para cada." |
| 3:15–4:00 | **Plataforma** → Home | Seção "O frete de retorno, na prática" | "Este é o problema: a volta vazia. E esta é a solução." |
| 4:00–5:30 | **Plataforma** → Match de frete (Carlos) | Passo 3 (ida: C2) e passo 4 (volta: C3) | "O match usa a rota real, no sentido certo, e explica o porquê. Na volta, ele encontra a carga que paga o retorno." |
| 5:30–6:15 | Card de C2 → **Tenho interesse** | Abre o WhatsApp | "A negociação é direta. O contato só aparece para quem demonstra interesse, e isso fica registrado." |
| 6:15–7:00 | **Meu painel** (Serra Verde) | Encerrar → "Sim, fechamos o frete" → indicador sobe | "Cada frete fechado alimenta a nossa North Star. É assim que vamos medir tração." |

## Perguntas prováveis (respostas com base no que existe)
| Pergunta | Resposta |
|---|---|
| Quantos usuários vocês têm? | Responder com o número real do banco de produção (bloco 6 do `docs/sql/00-diagnostico.sql`). Não arredondar para cima. |
| Como ganham dinheiro? | Hoje o cadastro é gratuito, para formar a base dos dois lados. O modelo de receita entra depois da tração (ver Hub). |
| O que impede o motorista de negociar por fora? | O valor está em achar a carga do retorno; o contato direto é parte do produto. A conversão é medida pelo "frete fechado". |
| E a LGPD? | Política publicada, aceite registrado, CPF nunca exibido, telefone só depois do interesse. |

## Atenção
- Faça a demonstração no projeto **dev** (dados fictícios). Não crie dados de teste em produção.
- Se o mapa não aparecer, a tela mostra o botão "Ver trajeto no Google Maps": siga em frente, o match funciona igual.
