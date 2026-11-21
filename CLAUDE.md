# Plataforma Volta Express — instruções para o Claude

> As regras gerais da VEB estão em `C:\veb\CLAUDE.md`, fora do repositório. Arquitetura de IA: `docs/IA-ARQUITETURA.md`.

## Branches
- Trabalhe em `developer-v3`, criando uma branch por entrega (`feature/…`, `fix/…`, `docs/…`) e com `merge --no-ff`.
- **Nunca mescle em `main`:** produção depende de migrações que ainda não foram aplicadas no banco.
- Só local: sem push.

## Comandos
```bash
npm run dev                         # Vite, http://localhost:8080
npx tsc --noEmit -p tsconfig.app.json
npm run lint
npm test                            # Vitest
npm run build
```
O CI (`.github/workflows/qualidade.yml`) roda esses 4 passos depois do `npm ci`. Antes de cada merge, rode os 4 localmente.

## Cuidados
- **`.env`:** nunca leia nem mostre o arquivo, nem os nomes ou valores das variáveis. As chaves do Supabase e do Maps são segredos.
- **SQL em `supabase/` e `docs/sql/`:** quem aplica no banco é o Douglas (roteiro em `docs/APLICAR-NO-DEV.md`). Você escreve o SQL, revisa e marca como "não testado em banco".
- **Regras do match e do negócio** (`docs/MATCH-PONTUACAO-V3.md`, `docs/DECISOES.md`): mudar só com autorização.
- **Diário do dia:** `docs/diario/dia-AAAA-MM-DD.md`.
