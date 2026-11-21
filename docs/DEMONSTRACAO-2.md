# Dados e Roteiro de Demonstração — Volta Express Brasil

> **Ambiente:** projeto `dev`
> **Objetivo:** demonstrar o funcionamento da plataforma Volta Express Brasil e validar o comportamento do **Match v2**.
> **Dados:** todos os nomes, documentos e telefones utilizados neste roteiro são fictícios.
> **Google Maps:** quando configurado, o sistema utiliza o modo de rota; sem Google Maps, os testes de matching funcionam pelo modo cidade.

---

# 1. Objetivo da demonstração

A demonstração deve apresentar a plataforma como um fluxo completo:

```text
Cadastro
   ↓
Login
   ↓
Criação de anúncio
   ↓
Busca
   ↓
Matching
   ↓
Análise de compatibilidade
   ↓
Interesse
   ↓
Liberação do contato
   ↓
Painel
```

Durante a demonstração serão apresentados:

* cadastro de caminhoneiros;
* cadastro de empresas;
* criação de anúncios de veículos;
* criação de anúncios de cargas;
* cálculo de rota;
* busca de anúncios;
* matching entre veículos e cargas;
* compatibilidade de carroceria;
* compatibilidade de refrigeração;
* capacidade de peso;
* capacidade de volume;
* datas disponíveis;
* direção da rota;
* encaixe de uma carga no caminho do veículo;
* proteção dos dados de contato;
* registro de interesse;
* painel do anunciante;
* pausa de anúncio;
* comportamento de anúncios incompatíveis.

---

# 2. Preparação do ambiente

Antes de iniciar a demonstração:

## 2.1 Aplicação

Abrir a aplicação Volta Express.

Confirmar:

* aplicação carregando normalmente;
* login funcionando;
* cadastro funcionando;
* Supabase conectado;
* anúncios carregando;
* Matching acessível;
* Painel acessível.

---

## 2.2 Google Maps

Se o Google Maps estiver configurado:

* a plataforma deverá calcular a rota;
* deverá aparecer a distância da rota;
* o matching poderá utilizar o modo **rota**.

Se o Google Maps não estiver configurado:

* a demonstração continuará funcionando;
* o matching utilizará o modo **cidade**, quando aplicável.

> A ausência do Google Maps não impede a demonstração dos demais recursos.

---

# 3. Usuários de demonstração

Os usuários abaixo devem ser criados pela própria tela **Cadastro**.

## 3.1 Caminhoneiro — U1

| Campo    | Valor                            |
| -------- | -------------------------------- |
| Tipo     | Caminhoneiro                     |
| Nome     | Carlos Andrade                   |
| E-mail   | `seu.email+veb-carlos@gmail.com` |
| CPF      | `020.851.608-59`                 |
| WhatsApp | `1832462553`                     |
| Senha    | `79925@caps7`                    |

---

## 3.2 Caminhoneiro — U2

| Campo    | Valor                           |
| -------- | ------------------------------- |
| Tipo     | Caminhoneiro                    |
| Nome     | Marta Ribeiro                   |
| E-mail   | `seu.email+veb-marta@gmail.com` |
| CPF      | `222.222.222-22`                |
| WhatsApp | `5532990000002`                 |
| Senha    | `Teste@123`                     |

---

## 3.3 Empresa — U3

| Campo    | Valor                                |
| -------- | ------------------------------------ |
| Tipo     | Empresa                              |
| Nome     | Laticínios Serra Verde               |
| E-mail   | `seu.email+veb-serraverde@gmail.com` |
| CNPJ     | `11.111.111/0001-11`                 |
| WhatsApp | `5532990000003`                      |
| Senha    | `Teste@123`                          |

---

## 3.4 Empresa — U4

| Campo    | Valor                             |
| -------- | --------------------------------- |
| Tipo     | Empresa                           |
| Nome     | Distribuidora Rota Sul            |
| E-mail   | `seu.email+veb-rotasul@gmail.com` |
| CNPJ     | `22.222.222/0001-22`              |
| WhatsApp | `5532990000004`                   |
| Senha    | `Teste@123`                       |

> **WhatsApp real:** se quiser demonstrar a abertura do WhatsApp de verdade, substitua o telefone de um dos usuários por um número controlado por você.

---

# 4. Cenário de anúncios

A demonstração utilizará:

* 2 caminhoneiros;
* 2 empresas;
* 4 anúncios de veículos;
* 4 anúncios de cargas.

---

# 5. Anúncios de veículos

Os anúncios abaixo devem ser criados pelos usuários **U1 e U2**.

## 5.1 Carlos Andrade

### V1 — Juiz de Fora → São Paulo

| Campo       | Valor             |
| ----------- | ----------------- |
| Dono        | Carlos Andrade    |
| Placa       | `TST1A23`         |
| Tipo        | Truck             |
| Capacidade  | 14.000 kg         |
| Volume      | 45 m³             |
| Carroceria  | Baú               |
| Refrigerado | Não               |
| Origem      | Juiz de Fora / MG |
| Destino     | São Paulo / SP    |
| Início      | 05/10/2026        |
| Fim         | 10/10/2026        |
| Valor       | R$ 3.200          |

---

### V2 — São Paulo → Juiz de Fora

| Campo       | Valor             |
| ----------- | ----------------- |
| Dono        | Carlos Andrade    |
| Placa       | `TST1A23`         |
| Tipo        | Truck             |
| Capacidade  | 14.000 kg         |
| Volume      | 45 m³             |
| Carroceria  | Baú               |
| Refrigerado | Não               |
| Origem      | São Paulo / SP    |
| Destino     | Juiz de Fora / MG |
| Início      | 11/10/2026        |
| Fim         | 15/10/2026        |
| Valor       | R$ 2.800          |

> **Importante:** V1 e V2 utilizam a mesma placa.
> O sistema deve reutilizar o mesmo veículo cadastrado para a placa `TST1A23`.

---

# 6. Anúncios de veículo — Marta

### V3 — Belo Horizonte → Rio de Janeiro

| Campo       | Valor               |
| ----------- | ------------------- |
| Dono        | Marta Ribeiro       |
| Placa       | `TST2B34`           |
| Tipo        | Carreta             |
| Capacidade  | 26.000 kg           |
| Volume      | 80 m³               |
| Carroceria  | Baú                 |
| Refrigerado | Sim                 |
| Origem      | Belo Horizonte / MG |
| Destino     | Rio de Janeiro / RJ |
| Início      | 06/10/2026          |
| Fim         | 09/10/2026          |
| Valor       | R$ 4.500            |

---

### V4 — Rio de Janeiro → Belo Horizonte

| Campo       | Valor               |
| ----------- | ------------------- |
| Dono        | Marta Ribeiro       |
| Placa       | `TST2B34`           |
| Tipo        | Carreta             |
| Capacidade  | 26.000 kg           |
| Volume      | 80 m³               |
| Carroceria  | Baú                 |
| Refrigerado | Sim                 |
| Origem      | Rio de Janeiro / RJ |
| Destino     | Belo Horizonte / MG |
| Início      | 10/10/2026          |
| Fim         | 14/10/2026          |
| Valor       | R$ 3.900            |

---

# 7. Anúncios de carga

Os anúncios abaixo devem ser criados pelos usuários **U3 e U4**.

---

## 7.1 Laticínios Serra Verde

### C1 — Queijos e iogurtes

| Campo        | Valor                  |
| ------------ | ---------------------- |
| Dono         | Laticínios Serra Verde |
| Descrição    | Queijos e iogurtes     |
| Categoria    | Refrigerada            |
| Refrigeração | Sim                    |
| Peso         | 12.000 kg              |
| Volume       | 30 m³                  |
| Origem       | Juiz de Fora / MG      |
| Destino      | Rio de Janeiro / RJ    |
| Início       | 07/10/2026             |
| Fim          | 09/10/2026             |
| Valor        | R$ 2.600               |

---

### C2 — Leite UHT paletizado

| Campo        | Valor                  |
| ------------ | ---------------------- |
| Dono         | Laticínios Serra Verde |
| Descrição    | Leite UHT paletizado   |
| Categoria    | Carga seca             |
| Refrigeração | Não                    |
| Peso         | 9.000 kg               |
| Volume       | 25 m³                  |
| Origem       | Juiz de Fora / MG      |
| Destino      | São Paulo / SP         |
| Início       | 06/10/2026             |
| Fim          | 10/10/2026             |
| Valor        | R$ 3.000               |

---

# 8. Distribuidora Rota Sul

### C3 — Eletrodomésticos paletizados

| Campo        | Valor                        |
| ------------ | ---------------------------- |
| Dono         | Distribuidora Rota Sul       |
| Descrição    | Eletrodomésticos paletizados |
| Categoria    | Carga seca                   |
| Refrigeração | Não                          |
| Peso         | 8.000 kg                     |
| Volume       | 40 m³                        |
| Origem       | São Paulo / SP               |
| Destino      | Juiz de Fora / MG            |
| Início       | 12/10/2026                   |
| Fim          | 15/10/2026                   |
| Valor        | R$ 2.700                     |

---

### C4 — Bobinas de aço

| Campo        | Valor                      |
| ------------ | -------------------------- |
| Dono         | Distribuidora Rota Sul     |
| Descrição    | Bobinas de aço             |
| Categoria    | Máquinas e volumes grandes |
| Refrigeração | Não                        |
| Peso         | 24.000 kg                  |
| Volume       | 20 m³                      |
| Origem       | Curitiba / PR              |
| Destino      | Porto Alegre / RS          |
| Início       | 20/10/2026                 |
| Fim          | 25/10/2026                 |
| Valor        | R$ 5.500                   |

### C4 — caso de controle

C4 será utilizado propositalmente para demonstrar um cenário no qual não deverá aparecer veículo compatível.

---

# 9. Ordem de criação dos anúncios

Para executar manualmente:

## Etapa A — Carlos

Login:

```text
seu.email+veb-carlos@gmail.com
```

Senha:

```text
79925@caps7
```

Criar:

1. V1
2. V2

---

## Etapa B — Marta

Logout.

Login:

```text
seu.email+veb-marta@gmail.com
```

Senha:

```text
Teste@123
```

Criar:

3. V3
4. V4

---

## Etapa C — Serra Verde

Logout.

Login:

```text
seu.email+veb-serraverde@gmail.com
```

Senha:

```text
Teste@123
```

Criar:

5. C1
6. C2

---

## Etapa D — Rota Sul

Logout.

Login:

```text
seu.email+veb-rotasul@gmail.com
```

Senha:

```text
Teste@123
```

Criar:

7. C3
8. C4

---

# 10. Validação dos anúncios

Depois de criar todos os anúncios, entrar em **Buscar**.

O objetivo é confirmar que a plataforma está apresentando os anúncios disponíveis.

Devem existir:

```text
V1
V2
V3
V4

C1
C2
C3
C4
```

Ao visualizar um anúncio de outro usuário:

* nome do anunciante pode aparecer;
* dados necessários à negociação podem aparecer conforme a regra da aplicação;
* telefone não deve ficar exposto simplesmente na listagem.

---

# 11. Roteiro principal de Matching

Agora começa a demonstração do **Match v2**.

---

## TESTE 1 — Carlos busca uma carga

### Login

```text
Carlos Andrade
```

### Tela

**Matching → Buscar cargas**

### Informar

```text
Carroceria: Baú

Capacidade: 14.000 kg

Origem: Juiz de Fora / MG

Destino: São Paulo / SP
```

### Resultado esperado

```text
C2 — Leite UHT paletizado
```

O sistema deve considerar:

* carroceria compatível;
* carga seca;
* capacidade de peso;
* volume;
* período;
* origem;
* destino;
* direção da rota.

### O que demonstrar

**A direção importa.**

A rota:

```text
Juiz de Fora
      ↓
São Paulo
```

não deve ser tratada como equivalente a:

```text
São Paulo
      ↓
Juiz de Fora
```

---

# 12. TESTE 2 — Carlos procura o frete de retorno

Alterar:

```text
Origem: São Paulo / SP

Destino: Juiz de Fora / MG
```

### Resultado esperado

```text
C3 — Eletrodomésticos paletizados
```

### O que demonstrar

O caminhoneiro pode utilizar a plataforma para encontrar uma carga para o **retorno da viagem**.

---

# 13. TESTE 3 — Marta procura carga refrigerada

Login:

```text
Marta Ribeiro
```

### Matching → Buscar cargas

Preencher:

```text
Carroceria: Baú

Refrigerado: Sim

Capacidade: 26.000 kg

Origem: Belo Horizonte / MG

Destino: Rio de Janeiro / RJ
```

### Resultado esperado

```text
C1 — Queijos e iogurtes
```

### O que demonstrar

A carga:

```text
Juiz de Fora → Rio de Janeiro
```

pode estar **no caminho** da rota:

```text
Belo Horizonte → Rio de Janeiro
```

Isso demonstra a lógica de rota do Match v2.

---

# 14. TESTE 4 — Buscar sem informar cidades

Ainda como Marta:

```text
Carroceria: Baú

Refrigerado: Sim

Capacidade: 26.000 kg
```

Não informar origem/destino.

### Resultado esperado

Os resultados compatíveis devem aparecer conforme:

* categoria;
* carroceria;
* refrigeração;
* capacidade;
* data;
* demais critérios do algoritmo.

O objetivo deste teste é demonstrar o matching sem restringir a busca a uma cidade específica.

---

# 15. TESTE 5 — Refrigeração

Agora utilizar:

```text
Carroceria: Baú

Refrigerado: Não
```

### O que demonstrar

A carga C1 exige refrigeração.

Portanto:

```text
C1
```

não deve ser considerada compatível com um veículo não refrigerado.

O objetivo é demonstrar que:

```text
exige_refrigeracao = true
```

é uma restrição real do matching.

---

# 16. TESTE 6 — Empresa procura veículo

Login:

```text
Distribuidora Rota Sul
```

### Matching → Buscar veículos

Informar:

```text
Categoria: Carga seca

Peso: 8.000 kg

Volume: 40 m³

Origem: São Paulo / SP

Destino: Juiz de Fora / MG
```

### Resultado esperado

```text
V2 — Carlos
```

### V1 não deve aparecer

Porque V1 possui direção:

```text
Juiz de Fora → São Paulo
```

enquanto a carga C3 possui:

```text
São Paulo → Juiz de Fora
```

### O que demonstrar

Esse é um dos testes principais do Match v2:

**a direção da rota é considerada.**

---

# 17. TESTE 7 — Serra Verde procura veículo

Login:

```text
Laticínios Serra Verde
```

### Matching → Buscar veículos

Informar:

```text
Categoria: Refrigerada

Refrigeração: Sim

Peso: 12.000 kg

Origem: Juiz de Fora / MG

Destino: Rio de Janeiro / RJ
```

### Resultado esperado

```text
V3 — Marta
```

### O que demonstrar

A carga:

```text
Juiz de Fora → Rio de Janeiro
```

pode ser atendida por um veículo que esteja realizando:

```text
Belo Horizonte → Rio de Janeiro
```

porque Juiz de Fora está no caminho considerado pela rota.

---

# 18. TESTE 8 — Caso sem compatibilidade

Utilizar a carga:

```text
C4 — Bobinas de aço
```

Características:

```text
Categoria:
Máquinas e volumes grandes

Peso:
24.000 kg

Origem:
Curitiba / PR

Destino:
Porto Alegre / RS
```

### Resultado esperado

Não encontrar veículo compatível no conjunto de demonstração.

### O que demonstrar

O sistema não deve apresentar simplesmente qualquer caminhão.

O matching considera múltiplos critérios:

```text
Categoria
   +
Carroceria
   +
Refrigeração
   +
Peso
   +
Volume
   +
Data
   +
Rota
```

---

# 19. TESTE 9 — Interesse

Voltar para o usuário Carlos.

Encontrar:

```text
C2 — Leite UHT paletizado
```

No card do anúncio:

**Tenho interesse**

Executar a ação.

### Resultado esperado

1. O interesse é registrado.
2. O proprietário do anúncio é identificado.
3. O contato é liberado pelo fluxo apropriado.
4. O WhatsApp pode ser aberto.
5. O evento fica registrado.

### O que demonstrar

O telefone não precisa estar exposto previamente na busca.

O contato acontece através do fluxo:

```text
Usuário
   ↓
Anúncio
   ↓
Tenho interesse
   ↓
Registrar interesse
   ↓
Contato
```

---

# 20. TESTE 10 — Painel da empresa

Entrar como:

```text
Laticínios Serra Verde
```

Abrir:

**Meu Painel**

Verificar:

```text
Meus anúncios
Interesses recebidos
Interesses enviados
```

Após o interesse realizado por Carlos, verificar:

```text
Interesses recebidos: 1
```

O anúncio correspondente deve aparecer associado ao interesse.

---

# 21. TESTE 11 — Pausar anúncio

Ainda como Serra Verde:

1. localizar C1;
2. pausar o anúncio;
3. voltar para Matching;
4. executar novamente a busca da Marta.

### Resultado esperado

C1 deixa de aparecer como anúncio ativo.

### O que demonstrar

O matching trabalha somente com anúncios elegíveis/ativos.

Fluxo:

```text
Anúncio ativo
      ↓
Pode aparecer no Matching

Anúncio pausado
      ↓
Não aparece no Matching
```

---

# 22. TESTE 12 — Segurança

Executar o teste previsto no ambiente local.

O objetivo é confirmar que uma requisição não autenticada não consegue acessar diretamente os dados protegidos.

Resultado esperado:

```text
[]
```

ou:

```text
permission denied
```

conforme o endpoint/teste utilizado.

### O que demonstrar

A aplicação não depende apenas da interface para proteger os dados.

Existe proteção também no backend/banco.

---

# 23. Matriz final da demonstração

| #  | Usuário     | Ação                       | Resultado esperado             |
| -- | ----------- | -------------------------- | ------------------------------ |
| 1  | Carlos      | Buscar                     | Visualiza anúncios disponíveis |
| 2  | Carlos      | Buscar carga JF → SP       | C2                             |
| 3  | Carlos      | Buscar carga SP → JF       | C3                             |
| 4  | Marta       | Buscar refrigerada BH → RJ | C1                             |
| 5  | Marta       | Buscar Baú + refrigerado   | Cargas compatíveis             |
| 6  | Carlos      | Baú não refrigerado        | C1 não deve aparecer           |
| 7  | Rota Sul    | Buscar veículo SP → JF     | V2                             |
| 8  | Serra Verde | Buscar veículo JF → RJ     | V3                             |
| 9  | Carlos      | Interesse em C2            | Contato/WhatsApp               |
| 10 | Serra Verde | Painel                     | Interesse recebido             |
| 11 | Serra Verde | Pausar C1                  | C1 sai do Matching             |
| 12 | Visitante   | Acesso protegido           | Acesso negado/sem dados        |

---

# 24. O que cada teste comprova

| Funcionalidade        | Teste                |
| --------------------- | -------------------- |
| Cadastro              | Usuários U1–U4       |
| Login                 | Todos os fluxos      |
| Anúncio de veículo    | V1–V4                |
| Reutilização da placa | V1/V2 e V3/V4        |
| Anúncio de carga      | C1–C4                |
| Google Maps           | Criação dos anúncios |
| Distância             | V1–V4                |
| Matching de carga     | Testes 1–5           |
| Matching de veículo   | Testes 6–7           |
| Direção da rota       | Testes 2 e 6         |
| Encaixe no caminho    | Testes 3 e 7         |
| Refrigeração          | Testes 4–5           |
| Capacidade            | Testes 1, 4, 6 e 7   |
| Categoria/carrocaria  | Testes de matching   |
| Sem compatibilidade   | C4                   |
| Interesse             | Teste 9              |
| Proteção de contato   | Teste 9              |
| Painel                | Teste 10             |
| Pausar anúncio        | Teste 11             |
| Segurança backend     | Teste 12             |

---

# 25. Comparação com o comportamento anterior ao Match v2

O objetivo da comparação histórica é mostrar a evolução do algoritmo.

No comportamento anterior, os testes relacionados à direção da rota poderiam apresentar anúncios no sentido contrário.

Exemplo:

```text
Busca:
São Paulo → Juiz de Fora
```

poderia apresentar:

```text
Juiz de Fora → São Paulo
```

O Match v2 passou a considerar a **ordem dos pontos da rota**.

Outro caso é a compatibilidade de carroceria.

A carga de:

```text
Bobinas de aço
```

não deve ser apresentada como compatível simplesmente porque existe capacidade de peso.

A compatibilidade precisa considerar a relação entre:

```text
Categoria da carga
        ↓
Carroceria disponível
```

---

# 26. Critério para considerar a demonstração concluída

A demonstração estará concluída quando for possível executar, sem intervenção manual no banco:

```text
[✓] Cadastro
[✓] Login
[✓] Criar veículo
[✓] Criar carga
[✓] Calcular rota
[✓] Buscar anúncios
[✓] Encontrar match
[✓] Rejeitar incompatibilidade
[✓] Respeitar direção
[✓] Considerar rota intermediária
[✓] Considerar refrigeração
[✓] Considerar capacidade
[✓] Registrar interesse
[✓] Liberar contato
[✓] Visualizar painel
[✓] Pausar anúncio
[✓] Remover anúncio pausado do Matching
[✓] Bloquear acesso não autenticado
```

---

# 27. Ordem recomendada para apresentação

Para uma apresentação para alguém que nunca viu a plataforma, seguir esta sequência:

### BLOCO 1 — Apresentação

```text
Landing
   ↓
Entrar
```

### BLOCO 2 — Oferta

```text
Caminhoneiro
   ↓
Criar anúncio de veículo
```

### BLOCO 3 — Demanda

```text
Empresa
   ↓
Criar anúncio de carga
```

### BLOCO 4 — Descoberta

```text
Buscar
```

### BLOCO 5 — Inteligência

```text
Matching
   ↓
Compatibilidade
   ↓
Score
   ↓
Motivos
```

### BLOCO 6 — Negociação

```text
Tenho interesse
   ↓
Contato
   ↓
WhatsApp
```

### BLOCO 7 — Gestão

```text
Meu painel
   ↓
Interesses
   ↓
Anúncios
   ↓
Pausar
```

### BLOCO 8 — Segurança

```text
Usuário não autenticado
   ↓
Dados protegidos
```

---

# 28. Resultado final que a demonstração deve transmitir

A demonstração deve permitir acompanhar este ciclo:

```text
EMPRESA
  │
  │ publica uma carga
  ▼
VT_ANUNCIO
  │
  ▼
MATCH V2
  │
  ├── categoria
  ├── carroceria
  ├── refrigeração
  ├── peso
  ├── volume
  ├── data
  ├── distância
  └── direção da rota
  │
  ▼
CAMINHONEIRO
  │
  │ demonstra interesse
  ▼
VT_REGISTRAR_INTERESSE
  │
  ▼
CONTATO
  │
  ▼
WHATSAPP
```

Esse é o **roteiro operacional da demonstração do Volta Express**.
