/*
 * Matching.tsx — tela do Match (DS2; v3).
 * O caminhoneiro informa veículo e rota e recebe cargas; a empresa informa a carga e recebe veículos.
 * Resultados ordenados pelo score (0–100), com o motivo de cada match e o mapa da rota pesquisada.
 * v3: cidade com sugestões do IBGE (M3), mapa com a faixa de busca e os resultados (M2), "perto de mim" (M5).
 */
import { lazy, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Search, MapPin, Loader2, Zap, Package, Route, Info, LocateFixed } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnuncioCard from "@/components/AnuncioCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { tiposCarroceria, categoriasCarga, estados } from "@/lib/catalogos";
import { hojeISO } from "@/lib/anuncio-service";
import { buscarCargasCompativeis, buscarCargasPerto, buscarVeiculosCompativeis, type ResultadoMatch } from "@/lib/matching-service";
import { mensagemErro } from "@/lib/erros";
import { posicaoAtual } from "@/lib/geo-service";
import { pontoDe, type Ponto } from "@/lib/geo";
import type { AnuncioCompleto } from "@/lib/anuncio-service";
import CidadeAutocomplete from "@/components/CidadeAutocomplete";
import type { PontoMapa } from "@/components/RouteMap";

const RouteMap = lazy(() => import("@/components/RouteMap"));

interface Trajeto {
  origemCidade: string;
  origemEstado: string;
  destinoCidade: string;
  destinoEstado: string;
  dataInicio: string;
  dataFim: string;
  /** v3: coordenadas do município escolhido na lista do IBGE (null se digitado à mão). */
  origemPonto: Ponto | null;
  destinoPonto: Ponto | null;
}

const LADOS = [
  { lado: "origem", cidade: "origemCidade", uf: "origemEstado", ponto: "origemPonto" },
  { lado: "destino", cidade: "destinoCidade", uf: "destinoEstado", ponto: "destinoPonto" },
] as const;

const TRAJETO_VAZIO: Trajeto = {
  origemCidade: "", origemEstado: "all", destinoCidade: "", destinoEstado: "all", dataInicio: "", dataFim: "",
  origemPonto: null, destinoPonto: null,
};

/* Raios do "perto de mim" (km). */
const RAIOS_PERTO = [25, 50, 100, 200];

/* Pontos do mapa a partir dos resultados (coleta = origem do anúncio; entrega = destino). */
function pontosDoMapa(anuncios: AnuncioCompleto[]): PontoMapa[] {
  return anuncios.flatMap((a) => {
    const coleta = pontoDe(a.origem_lat, a.origem_lng);
    if (!coleta) return [];
    const rotulo = `${a.descricao_mercadoria ?? a.tipo_veiculo ?? "Anúncio"} · ${a.origem_cidade} → ${a.destino_cidade}`;
    return [{ id: a.id, coleta, entrega: pontoDe(a.destino_lat, a.destino_lng), score: a.score, rotulo }];
  });
}

/* Converte o trajeto do formulário no formato dos serviços (UF "all" vira vazio). */
function paraCriterio(t: Trajeto) {
  return {
    origemCidade: t.origemCidade || undefined,
    origemEstado: t.origemEstado !== "all" ? t.origemEstado : undefined,
    destinoCidade: t.destinoCidade || undefined,
    destinoEstado: t.destinoEstado !== "all" ? t.destinoEstado : undefined,
    dataInicio: t.dataInicio || undefined,
    dataFim: t.dataFim || undefined,
    origemPonto: t.origemPonto,
    destinoPonto: t.destinoPonto,
  };
}

/* Converte o texto do campo numérico em número ou undefined. */
const numero = (v: string) => (v ? Number(v) : undefined);

/* Campos de trajeto e datas, compartilhados pelas duas personas. */
const CamposTrajeto = ({ prefixo, valor, onChange }: { prefixo: string; valor: Trajeto; onChange: (t: Trajeto) => void }) => {
  const set = (k: keyof Trajeto) => (v: string) => onChange({ ...valor, [k]: v });
  const hoje = hojeISO();
  return (
    <>
      {LADOS.map(({ lado, cidade, uf, ponto }) => (
        <div key={lado} className="grid grid-cols-[1fr_96px] gap-2">
          <div>
            <Label htmlFor={`${prefixo}-${lado}-cidade`} className="text-xs text-muted-foreground">
              Cidade de {lado}
            </Label>
            <CidadeAutocomplete
              id={`${prefixo}-${lado}-cidade`}
              placeholder={lado === "origem" ? "Ex.: Juiz de Fora" : "Ex.: São Paulo"}
              className="mt-1"
              value={valor[cidade]}
              uf={valor[uf]}
              onTextoChange={(t) => onChange({ ...valor, [cidade]: t, [ponto]: null })}
              onEscolher={(m) => onChange({ ...valor, [cidade]: m.nome, [uf]: m.uf, [ponto]: { lat: m.lat, lng: m.lng } })}
            />
          </div>
          <div>
            <Label htmlFor={`${prefixo}-${lado}-uf`} className="text-xs text-muted-foreground">UF</Label>
            <Select value={valor[uf]} onValueChange={(v) => onChange({ ...valor, [uf]: v, [ponto]: null })}>
              <SelectTrigger id={`${prefixo}-${lado}-uf`} className="mt-1"><SelectValue placeholder="UF" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {estados.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor={`${prefixo}-inicio`} className="text-xs text-muted-foreground">Disponível de</Label>
          <Input id={`${prefixo}-inicio`} type="date" min={hoje} className="mt-1" value={valor.dataInicio} onChange={(e) => set("dataInicio")(e.target.value)} />
        </div>
        <div>
          <Label htmlFor={`${prefixo}-fim`} className="text-xs text-muted-foreground">até</Label>
          <Input id={`${prefixo}-fim`} type="date" min={valor.dataInicio || hoje} className="mt-1" value={valor.dataFim} onChange={(e) => set("dataFim")(e.target.value)} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Sem datas, consideramos os próximos 30 dias.</p>
    </>
  );
};

/* Página de Matching com as duas abas (motorista e empresa). */
const MatchingPage = () => {
  // v3: a aba abre pela persona do cadastro (Tenho carga → Encontrar caminhão) ou por ?aba=caminhao|carga.
  const { user } = useAuth();
  const [params] = useSearchParams();
  const abaUrl = params.get("aba");
  const [tab, setTab] = useState(abaUrl === "caminhao" ? "empresa" : "motorista");
  useEffect(() => {
    if (!user || abaUrl) return;
    supabase
      .from("vt_usuario")
      .select("tipo_usuario")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.tipo_usuario === "E") setTab("empresa");
      });
  }, [user, abaUrl]);

  const [tipoCarroceria, setTipoCarroceria] = useState("");
  const [capacidadePeso, setCapacidadePeso] = useState("");
  const [capacidadeVolume, setCapacidadeVolume] = useState("");
  const [refrigerado, setRefrigerado] = useState(false);
  const [trajetoM, setTrajetoM] = useState<Trajeto>(TRAJETO_VAZIO);

  const [categoriaCarga, setCategoriaCarga] = useState("");
  const [pesoKg, setPesoKg] = useState("");
  const [volumeM3, setVolumeM3] = useState("");
  const [refrigeradoE, setRefrigeradoE] = useState(false);
  const [trajetoE, setTrajetoE] = useState<Trajeto>(TRAJETO_VAZIO);

  const [raioPerto, setRaioPerto] = useState("50");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoMatch | null>(null);
  const [trajetoPesquisado, setTrajetoPesquisado] = useState<Trajeto | null>(null);

  const avisar = (r: ResultadoMatch, rotulo: string) => {
    const n = r.anuncios.length;
    toast[n ? "success" : "info"](n ? `${n} ${rotulo} compatível(is)` : `Nenhum(a) ${rotulo} compatível agora`);
  };

  const handleSearchMotorista = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipoCarroceria) {
      toast.error("Selecione o tipo de carroceria");
      return;
    }
    setLoading(true);
    setTrajetoPesquisado(trajetoM);
    try {
      const r = await buscarCargasCompativeis({
        tipoCarroceria,
        refrigerado,
        capacidadePeso: numero(capacidadePeso),
        capacidadeVolume: numero(capacidadeVolume),
        ...paraCriterio(trajetoM),
      });
      setResultado(r);
      avisar(r, "carga(s)");
    } catch (err) {
      toast.error("Não foi possível buscar cargas", { description: mensagemErro(err) });
    } finally {
      setLoading(false);
    }
  };

  /* M5: cargas com coleta perto da posição atual do motorista. */
  const handlePerto = async () => {
    if (!tipoCarroceria) {
      toast.error("Selecione o tipo de carroceria");
      return;
    }
    setLoading(true);
    setTrajetoPesquisado(null);
    try {
      const ponto = await posicaoAtual();
      const r = await buscarCargasPerto(
        {
          tipoCarroceria,
          refrigerado,
          capacidadePeso: numero(capacidadePeso),
          capacidadeVolume: numero(capacidadeVolume),
          dataInicio: trajetoM.dataInicio || undefined,
          dataFim: trajetoM.dataFim || undefined,
        },
        ponto,
        Number(raioPerto),
      );
      setResultado(r);
      avisar(r, "carga(s)");
    } catch (err) {
      toast.error("Não foi possível buscar cargas perto de você", { description: mensagemErro(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoriaCarga) {
      toast.error("Selecione a categoria da carga");
      return;
    }
    setLoading(true);
    setTrajetoPesquisado(trajetoE);
    try {
      const r = await buscarVeiculosCompativeis({
        descricaoMercadoria: categoriaCarga,
        categoriaCarga,
        refrigerado: refrigeradoE,
        pesoKg: numero(pesoKg),
        volumeM3: numero(volumeM3),
        ...paraCriterio(trajetoE),
      });
      setResultado(r);
      avisar(r, "veículo(s)");
    } catch (err) {
      toast.error("Não foi possível buscar caminhões", { description: mensagemErro(err) });
    } finally {
      setLoading(false);
    }
  };

  const temTrajeto =
    !!trajetoPesquisado &&
    !!trajetoPesquisado.origemCidade &&
    !!trajetoPesquisado.destinoCidade &&
    trajetoPesquisado.origemEstado !== "all" &&
    trajetoPesquisado.destinoEstado !== "all";
  const ehPerto = resultado?.modo === "perto";
  const temMapa = temTrajeto || ehPerto;

  /* Texto do cabeçalho do mapa: como o match foi feito (Q3: no modo cidade, a nota é estimada). */
  const textoModo = (r: ResultadoMatch) => {
    if (r.modo === "perto") return `Coleta a até ${r.raioKm} km de você`;
    if (r.modo === "rota") {
      const partes = ["Match pela rota"];
      if (r.rota?.distanciaKm) partes.push(`${r.rota.distanciaKm.toLocaleString("pt-BR")} km`);
      if (r.raioKm) partes.push(`faixa de ${r.raioKm} km`);
      return partes.join(" · ");
    }
    return "Match pelas cidades (rota indisponível; notas estimadas)";
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30 py-8">
        <div className="container">
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <Zap className="h-5 w-5 text-accent" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Match de frete</h1>
            </div>
            <p className="text-muted-foreground">
              Quem tem caminhão encontra cargas no caminho. Quem tem carga encontra caminhões que já vão para lá.
              Sempre no sentido e na data certos, com o motivo de cada sugestão.
            </p>
          </div>

          <Tabs value={tab} onValueChange={(v) => { setTab(v); setResultado(null); setTrajetoPesquisado(null); }}>
            <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="motorista" className="gap-2"><Truck className="h-4 w-4" aria-hidden="true" />Encontrar carga</TabsTrigger>
              <TabsTrigger value="empresa" className="gap-2"><Package className="h-4 w-4" aria-hidden="true" />Encontrar caminhão</TabsTrigger>
            </TabsList>

            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
              <div>
                <TabsContent value="motorista" className="mt-0">
                  <Card className="border-border shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg"><Truck className="h-5 w-5 text-accent" aria-hidden="true" />Meu caminhão e minha rota</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSearchMotorista} className="space-y-4">
                        <div>
                          <Label htmlFor="m-carroceria" className="text-xs text-muted-foreground">Tipo de carroceria</Label>
                          <Select value={tipoCarroceria} onValueChange={setTipoCarroceria}>
                            <SelectTrigger id="m-carroceria" className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>{tiposCarroceria.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="m-peso" className="text-xs text-muted-foreground">Capacidade (kg)</Label>
                            <Input id="m-peso" type="number" min={0} inputMode="numeric" placeholder="14000" className="mt-1" value={capacidadePeso} onChange={(e) => setCapacidadePeso(e.target.value)} />
                          </div>
                          <div>
                            <Label htmlFor="m-volume" className="text-xs text-muted-foreground">Volume (m³)</Label>
                            <Input id="m-volume" type="number" min={0} inputMode="decimal" placeholder="45" className="mt-1" value={capacidadeVolume} onChange={(e) => setCapacidadeVolume(e.target.value)} />
                          </div>
                        </div>
                        <CamposTrajeto prefixo="m" valor={trajetoM} onChange={setTrajetoM} />
                        <div className="flex items-center justify-between rounded-lg border border-border p-3">
                          <Label htmlFor="m-frio" className="text-xs text-muted-foreground">Veículo refrigerado</Label>
                          <Switch id="m-frio" checked={refrigerado} onCheckedChange={setRefrigerado} />
                        </div>
                        <Button type="submit" className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
                          {loading ? "Buscando..." : "Encontrar cargas"}
                        </Button>
                        <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
                          <p className="text-xs text-muted-foreground">Parado e procurando carga? Use a sua localização atual.</p>
                          <div className="grid grid-cols-[96px_1fr] gap-2">
                            <div>
                              <Label htmlFor="m-raio-perto" className="sr-only">Raio da busca</Label>
                              <Select value={raioPerto} onValueChange={setRaioPerto}>
                                <SelectTrigger id="m-raio-perto" aria-label="Raio da busca"><SelectValue /></SelectTrigger>
                                <SelectContent>{RAIOS_PERTO.map((r) => <SelectItem key={r} value={String(r)}>{r} km</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <Button type="button" variant="outline" className="gap-2" disabled={loading} onClick={handlePerto}>
                              <LocateFixed className="h-4 w-4" aria-hidden="true" />Cargas perto de mim
                            </Button>
                          </div>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="empresa" className="mt-0">
                  <Card className="border-border shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg"><Package className="h-5 w-5 text-accent" aria-hidden="true" />Minha carga</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSearchEmpresa} className="space-y-4">
                        <div>
                          <Label htmlFor="e-categoria" className="text-xs text-muted-foreground">Categoria da carga</Label>
                          <Select value={categoriaCarga} onValueChange={(v) => { setCategoriaCarga(v); if (v === "Refrigerada") setRefrigeradoE(true); }}>
                            <SelectTrigger id="e-categoria" className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>{categoriasCarga.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="e-peso" className="text-xs text-muted-foreground">Peso (kg)</Label>
                            <Input id="e-peso" type="number" min={0} inputMode="numeric" placeholder="8000" className="mt-1" value={pesoKg} onChange={(e) => setPesoKg(e.target.value)} />
                          </div>
                          <div>
                            <Label htmlFor="e-volume" className="text-xs text-muted-foreground">Volume (m³)</Label>
                            <Input id="e-volume" type="number" min={0} inputMode="decimal" placeholder="40" className="mt-1" value={volumeM3} onChange={(e) => setVolumeM3(e.target.value)} />
                          </div>
                        </div>
                        <CamposTrajeto prefixo="e" valor={trajetoE} onChange={setTrajetoE} />
                        <div className="flex items-center justify-between rounded-lg border border-border p-3">
                          <Label htmlFor="e-frio" className="text-xs text-muted-foreground">Exige refrigeração</Label>
                          <Switch id="e-frio" checked={refrigeradoE} onCheckedChange={setRefrigeradoE} />
                        </div>
                        <Button type="submit" className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
                          {loading ? "Buscando..." : "Encontrar veículos"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>

              <section aria-live="polite" aria-busy={loading} className="space-y-4">
                {temMapa && !loading && (
                  <Card className="overflow-hidden border-border shadow-card">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 text-sm">
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        {ehPerto ? (
                          <><LocateFixed className="h-4 w-4 text-accent" aria-hidden="true" />Perto de você</>
                        ) : trajetoPesquisado ? (
                          <>
                            <Route className="h-4 w-4 text-accent" aria-hidden="true" />
                            {trajetoPesquisado.origemCidade}/{trajetoPesquisado.origemEstado} → {trajetoPesquisado.destinoCidade}/{trajetoPesquisado.destinoEstado}
                          </>
                        ) : null}
                      </span>
                      {resultado && <span className="text-xs text-muted-foreground">{textoModo(resultado)}</span>}
                    </div>
                    <div className="h-[300px] sm:h-[380px]">
                      <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted" />}>
                        <RouteMap
                          origemCidade={ehPerto ? "" : trajetoPesquisado?.origemCidade ?? ""}
                          origemEstado={ehPerto ? "" : trajetoPesquisado?.origemEstado ?? ""}
                          destinoCidade={ehPerto ? "" : trajetoPesquisado?.destinoCidade ?? ""}
                          destinoEstado={ehPerto ? "" : trajetoPesquisado?.destinoEstado ?? ""}
                          distanceKm={resultado?.rota?.distanciaKm}
                          polyline={resultado?.rota?.polyline}
                          raioKm={resultado?.raioKm}
                          centro={resultado?.perto ?? null}
                          pontos={resultado ? pontosDoMapa(resultado.anuncios) : []}
                        />
                      </Suspense>
                    </div>
                  </Card>
                )}

                {loading ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[0, 1, 2, 3].map((i) => (
                      <Card key={i} className="space-y-3 border-border p-5">
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-9 w-full" />
                      </Card>
                    ))}
                  </div>
                ) : resultado === null ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
                    <Zap className="mb-4 h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
                    <p className="text-lg font-medium text-foreground">
                      {tab === "motorista" ? "Informe seu veículo e sua rota" : "Informe sua carga e o trajeto"}
                    </p>
                    <p className="mt-1 max-w-md text-sm text-muted-foreground">
                      Com origem e destino completos, o match considera o caminho real: só entra o que está no sentido da viagem.
                    </p>
                  </div>
                ) : resultado.anuncios.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
                    <MapPin className="mb-4 h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
                    <p className="text-lg font-medium text-foreground">Nenhum resultado compatível agora</p>
                    <p className="mt-1 max-w-md text-sm text-muted-foreground">
                      Amplie as datas, retire a UF ou publique seu anúncio: ele passa a aparecer para o outro lado automaticamente.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Info className="h-4 w-4" aria-hidden="true" />
                      {resultado.anuncios.length} resultado(s), do melhor para o pior encaixe
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {resultado.anuncios.map((a) => <AnuncioCard key={a.id} anuncio={a} />)}
                    </div>
                  </>
                )}
              </section>
            </div>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MatchingPage;

/* Fim de Matching.tsx */
