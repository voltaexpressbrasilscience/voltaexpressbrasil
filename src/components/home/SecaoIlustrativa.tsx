/*
 * SecaoIlustrativa.tsx — Home, logo depois de "Como funciona" (v3, T4.2).
 * Para visitantes: mostra o frete de retorno na prática, o que a pesquisa revelou e como o match decide.
 * Regra: só números com fonte. O que é exemplo leva o selo "Exemplo ilustrativo".
 *   - Exemplo: cenário V1/V2/C2/C3 do docs/DEMONSTRACAO.md (Juiz de Fora ⇄ São Paulo).
 *   - Pesquisa: formulários de set/2024, 42 respostas (16 embarcadores, 26 motoristas) — mesma base do Hub.
 *   - Pesos do match: docs/MATCH.md e vt_match_config (35/20/15/15/10/5).
 */
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Truck, Package, Check, X, ExternalLink, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LINKS } from "@/lib/links";

interface Props {
  linkCaminhao: string;
  linkCarga: string;
}

const ACHADOS = [
  { numero: "38%", texto: "dos motoristas que responderam rodam com Truck, o caminhão mais citado.", base: "10 de 26 motoristas" },
  { numero: "69%", texto: "oferecem até 14 toneladas livres: o perfil é de caminhão leve e médio.", base: "18 de 26 motoristas" },
  { numero: "63%", texto: "dos embarcadores não informaram o volume da carga. Por isso a plataforma pede peso e volume.", base: "10 de 16 embarcadores" },
];

const CRITERIOS = [
  { nome: "Desvio da rota", peso: 35 },
  { nome: "Aproveitamento da rota", peso: 20 },
  { nome: "Proximidade da data", peso: 15 },
  { nome: "Uso da capacidade", peso: 15 },
  { nome: "Valor por km", peso: 10 },
  { nome: "Perfil do anunciante", peso: 5 },
];

const Trecho = ({
  sentido,
  de,
  para,
  children,
}: {
  sentido: "ida" | "volta";
  de: string;
  para: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border border-border bg-card p-5 shadow-card">
    <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {sentido === "ida" ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : <ArrowLeft className="h-4 w-4" aria-hidden="true" />}
      {sentido === "ida" ? "Ida" : "Volta"}
    </p>
    <p className="mb-4 text-lg font-bold text-foreground">
      {de} <span className="text-muted-foreground" aria-label="para">→</span> {para}
    </p>
    {children}
  </div>
);

const SecaoIlustrativa = ({ linkCaminhao, linkCarga }: Props) => (
  <section aria-labelledby="titulo-na-pratica" className="bg-muted/50 py-16 md:py-20">
    <div className="container space-y-14">
      <header className="mx-auto max-w-2xl text-center">
        <Badge variant="outline" className="mb-4 border-primary/40 text-primary">Exemplo ilustrativo</Badge>
        <h2 id="titulo-na-pratica" className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
          O frete de retorno, na prática
        </h2>
        <p className="text-lg text-muted-foreground">
          O caminhão leva uma carga até o destino e, sem uma carga para a volta, retorna vazio. A Volta Express encontra a carga do caminho de volta.
        </p>
      </header>

      {/* 1. A ida e a volta */}
      <div className="grid gap-4 md:grid-cols-2">
        <Trecho sentido="ida" de="Juiz de Fora/MG" para="São Paulo/SP">
          <p className="flex items-start gap-2 text-sm text-foreground">
            <Package className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            Truck baú com 9 t de leite UHT paletizado.
          </p>
        </Trecho>
        <Trecho sentido="volta" de="São Paulo/SP" para="Juiz de Fora/MG">
          <div className="space-y-3 text-sm">
            <p className="flex items-start gap-2 text-muted-foreground">
              <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
              <span><strong className="text-foreground">Sem a Volta Express:</strong> volta vazio, com custo de diesel, pedágio e tempo.</span>
            </p>
            <p className="flex items-start gap-2 text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              <span><strong className="text-foreground">Com a Volta Express:</strong> o match sugere 8 t de eletrodomésticos paletizados no mesmo sentido.</span>
            </p>
            <ul className="flex flex-wrap gap-2" aria-label="Motivos do match">
              {["no sentido da viagem", "sem desvio da rota", "cabe no baú", "datas compatíveis"].map((m) => (
                <li key={m} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{m}</li>
              ))}
            </ul>
          </div>
        </Trecho>
      </div>

      {/* 2. O que o mercado nos disse */}
      <div>
        <h3 className="mb-2 text-center text-2xl font-bold text-foreground">O que o mercado nos disse</h3>
        <p className="mx-auto mb-6 max-w-2xl text-center text-muted-foreground">
          Pesquisa com 42 respostas de quem tem caminhão e de quem tem carga.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {ACHADOS.map((a) => (
            <div key={a.numero} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <p className="font-mono text-4xl font-bold tabular-nums text-primary">{a.numero}</p>
              <p className="mt-2 text-sm text-foreground">{a.texto}</p>
              <p className="mt-2 text-xs text-muted-foreground">{a.base}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 flex items-start justify-center gap-2 text-center text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Fonte: formulários de interesse da Volta Express, setembro de 2024 (16 embarcadores e 26 motoristas). Amostra pequena, sem valor estatístico.{" "}
            <a href={LINKS.hubPesquisa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary underline">
              Ver a pesquisa completa <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </span>
        </p>
      </div>

      {/* 3. Como o match decide */}
      <div className="mx-auto max-w-3xl">
        <h3 className="mb-2 text-center text-2xl font-bold text-foreground">Como o match decide</h3>
        <p className="mb-6 text-center text-muted-foreground">
          Primeiro, filtros obrigatórios: carroceria compatível, refrigeração quando a carga exige, peso e volume que cabem e datas que se encontram.
          Depois, uma nota de 0 a 100 ordena as sugestões e mostra o motivo de cada uma.
        </p>
        <ul className="space-y-3" aria-label="Peso de cada critério na nota (total 100)">
          {CRITERIOS.map((c) => (
            <li key={c.nome} className="grid grid-cols-[minmax(0,10rem)_1fr_3.5rem] items-center gap-3 text-sm">
              <span className="text-foreground">{c.nome}</span>
              <span className="h-3 overflow-hidden rounded-full bg-border" aria-hidden="true">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${(c.peso / 35) * 100}%` }} />
              </span>
              <span className="text-right font-mono font-semibold tabular-nums text-foreground">{c.peso} pts</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          A nota só organiza a lista. Quem decide negociar são vocês, direto pelo WhatsApp.{" "}
          <a href={LINKS.hubExplicacoes} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary underline">
            Entenda o match <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </p>
      </div>

      {/* 4. Chamada */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button asChild size="lg" className="min-h-12 w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto">
          <Link to={linkCaminhao}><Truck className="h-5 w-5" aria-hidden="true" />Tenho caminhão</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="min-h-12 w-full gap-2 border-primary text-primary hover:bg-primary/5 sm:w-auto">
          <Link to={linkCarga}><Package className="h-5 w-5" aria-hidden="true" />Tenho carga</Link>
        </Button>
      </div>
    </div>
  </section>
);

export default SecaoIlustrativa;
