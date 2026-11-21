# 🚛 Volta Express Brasil

Conectando inteligência logística à estrada. Uma plataforma bimodal para otimização de fretes, conectando transportadores e embarcadores em uma solução única e eficiente.

## 🎯 O Produto

O Volta Express Brasil é a plataforma definitiva para maximizar a eficiência no transporte de cargas nacional. Atuamos em duas frentes estratégicas:

### 🛣️ Para o Caminhoneiro

Fim da Viagem Vazia: Conexão direta com as cargas mais lucrativas do Brasil.
Inteligência de Rotas: Planejamento preciso para transformar tempo em faturamento real.
Negociação Direta: Total controle sobre seus ganhos e agendas.

### 📦 Para o Embarcador

Logística Inteligente: Conexão rápida com uma frota verificada em poucos cliques.
Visibilidade Total: Anúncios intuitivos e acompanhamento transparente de cada etapa do frete.
Segurança e Agilidade: Parceiro estratégico para garantir que a mercadoria chegue no tempo certo.

## 🛠️ Stack Tecnológica (learnTECH Ecosystem)

Este projeto foi desenvolvido utilizando padrões de engenharia de software de alta performance:

- Frontend: React.js + TypeScript
- Build Tool: Vite (Performance ultra-rápida)
- UI/UX: Tailwind CSS + shadcn/ui (Componentes acessíveis e modernos)
- Backend & Auth: Supabase (PostgreSQL + Edge Functions)
- State Management: TanStack Query v5
- Forms & Validation: React Hook Form + Zod

### 🚀 Como Executar o Projeto Localmente

Como este projeto integra o currículo da byteclass, siga os passos abaixo para rodar o ambiente de desenvolvimento:

1. Clone o repositório:

````git bash
git clone https://github.com/douglasabnovato/volta-express-brasil.git
cd volta-express-brasil
````

2. Instale as dependências:

````git bash
npm install
````

O projeto usa só npm (`package-lock.json`).

3. Configuração de Variáveis de Ambiente:

Crie um arquivo .env na raiz e adicione suas chaves do Supabase:

````.env
VITE_SUPABASE_URL=seu_projeto_url
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
VITE_GOOGLE_MAPS_BROWSER_KEY=sua_chave_do_maps_para_navegador
````

Inicie o servidor:

````git bash
npm run dev
````

### 📚 Documentação

| Documento | Conteúdo |
|---|---|
| [docs/RELATORIO.md](docs/RELATORIO.md) | Diagnóstico, o que mudou e notas |
| [docs/ARQUITETURA.md](docs/ARQUITETURA.md) | Arquitetura atual |
| [docs/MATCH.md](docs/MATCH.md) | Match v2: regras, score e testes |
| [docs/AMBIENTE-LOCAL.md](docs/AMBIENTE-LOCAL.md) | Como rodar localmente e levar para produção |
| [docs/APLICAR-NO-DEV.md](docs/APLICAR-NO-DEV.md) | **v3.2:** roteiro único para aplicar as migrações v3 e v3.2 no DEV e testar |
| [docs/DEMONSTRACAO.md](docs/DEMONSTRACAO.md) | Usuários e anúncios de teste com resultados esperados |
| [docs/DEMONSTRACAO-V3.md](docs/DEMONSTRACAO-V3.md) | **v3:** demonstração com datas relativas (não vencem) |
| [docs/ROTEIRO-INVESTIDOR.md](docs/ROTEIRO-INVESTIDOR.md) | **v3:** roteiro de 7 minutos Hub → landing → plataforma |
| [docs/V3-ANOTACOES.md](docs/V3-ANOTACOES.md) | **v3:** decisões tomadas na execução e o que falta fazer |
| [docs/TEXTOS-ANTES-DEPOIS.md](docs/TEXTOS-ANTES-DEPOIS.md) | **v3:** textos da interface antes e depois |
| [docs/COMPATIBILIDADE-PARA-VALIDAR.md](docs/COMPATIBILIDADE-PARA-VALIDAR.md) | **v3:** regra carga × carroceria para validar |
| [docs/sql/](docs/sql/) | **v3:** diagnóstico do banco (só leitura) e renovação da demonstração |
| [docs/STATUS-MVP.md](docs/STATUS-MVP.md) | Status atual, o que falta para o MVP e issues a criar |
| [docs/ROADMAP.md](docs/ROADMAP.md) · [docs/DESIGN.md](docs/DESIGN.md) · [docs/DECISOES.md](docs/DECISOES.md) · [docs/REFERENCIAS.md](docs/REFERENCIAS.md) | Plano, design, decisões e referências |

### 📍 Status e próximos passos (06/11/2026)

- **Feito:** v3.1.0 em `main` — match v3 com mapas, personas, LGPD com aceite, frete fechado, Meu painel e CI de qualidade.
- **Falta para o MVP:** segurança do repositório (`.env` e chave do Maps), migrações v3/m3 no dev e na produção, revisão jurídica da Privacidade, Termos de Uso, validação de CPF/CNPJ e teste no celular.
- Detalhes, critérios de pronto e a lista de issues em [docs/STATUS-MVP.md](docs/STATUS-MVP.md).

**Issues a criar (manualmente):**
1. Segurança: tirar `.env` do Git e restringir a chave do Google Maps
2. Segurança: remover credencial da URL do remoto e revogar o token
3. Banco dev: aplicar migrações v3/m3, IBGE e `route-distance`
4. QA: roteiro DEMONSTRACAO-V3 e teste no celular
5. LGPD: dados da empresa e revisão jurídica da Política de Privacidade
6. LGPD: página de Termos de Uso com aceite
7. Cadastro: validar CPF, CNPJ e telefone
8. Banco: exigir peso e volume em `vt_criar_anuncio`
9. Operação: validar a tabela de compatibilidade carga × carroceria
10. CI: configurar segredos do Supabase no GitHub Actions
11. Produção: migrações v3/m3, variável do Maps no Netlify e publicação
12. Pós-MVP: métricas mensais da plataforma para o Hub

### 📈 Ecossistema de Hospedagem

Este projeto é uma plataforma de logística que se apresenta como uma inteligente solução.

- [x] Código desenvolvido no Github
- [x] Projeto hospedado no Netlify
- [x] O Domínio é da GoDaddy 
- [x] https://voltaexpress.com.br/

### 🚀 Documentar funcionalidades

- telas
- funcionalidades
- ferramentas 

### 🚀 Workflow

- main: em produção
- mvp-1: para testar e consolidar versão
- feature/hospedar: funcionalidade de hospedagem
- feature/reset-senha: funcionalidade de reset de senha para o domínio oficial
- feature/design: ajudar cores, fonts, imagens e copy conforme o oficial
- hotfix/hospedar: erro no netlify
- doc/documentacao: tirar print, fazer um qa final e mostrar no readme

### 🚀 Versão 2 - Design - branch: feature/design

- adequar estilização com a aparência da lp

por Volta Express Brasil - @voltaexpressbrasil
