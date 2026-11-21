/*
 * CriarAnuncio.tsx — publicação de anúncio de veículo (caminhoneiro) ou de carga (empresa).
 * A rota é calculada ao preencher origem e destino e gravada no anúncio para o Match v2.
 * R1: a aba inicial segue a persona do cadastro (C → Veículo, E → Carga); as duas continuam disponíveis.
 * v3: cidade com sugestões do IBGE (M3); "Anunciar a volta" (Q5) pré-preenche com ?volta=<id do anúncio de ida>;
 * a referência de valor usa o R$/km do tipo de veículo, quando cadastrado (Q6).
 */
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Truck, Package, MapPin, Calendar, Plus, Loader2, Route } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { tiposVeiculo, tiposCarroceria, categoriasCarga, estados } from "@/lib/catalogos";
import { criarAnuncioVeiculo, criarAnuncioCarga, carregarBaseVolta, hojeISO } from "@/lib/anuncio-service";
import CidadeAutocomplete from "@/components/CidadeAutocomplete";
import { calcularRota, type RotaCalculada } from "@/lib/rota-service";
import { useValorReferenciaKm, formatarValorKm, valorDeReferencia } from "@/lib/config-service";
import { formatarReais } from "@/lib/formatos";
import { mensagemErro } from "@/lib/erros";

/* Converte o texto do campo numérico em número ou undefined. */
const numero = (v: string) => (v ? Number(v) : undefined);

/* Página de criação de anúncio. */
const CriarAnuncioPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const voltaId = params.get("volta");
  const [tipoAnuncio, setTipoAnuncio] = useState<"V" | "C">("V");
  const [loading, setLoading] = useState(false);

  const [placa, setPlaca] = useState("");
  const [tipoVeiculo, setTipoVeiculo] = useState("");
  const [capacidadePeso, setCapacidadePeso] = useState("");
  const [capacidadeVolume, setCapacidadeVolume] = useState("");
  const [tipoCarroceria, setTipoCarroceria] = useState("");
  const [refrigerado, setRefrigerado] = useState(false);

  const [descricao, setDescricao] = useState("");
  const [tipoMercadoria, setTipoMercadoria] = useState("");
  const [categoriaCarga, setCategoriaCarga] = useState("");
  const [exigeRefrigeracao, setExigeRefrigeracao] = useState(false);
  const [pesoMerc, setPesoMerc] = useState("");
  const [volumeMerc, setVolumeMerc] = useState("");

  const [origemCidade, setOrigemCidade] = useState("");
  const [origemEstado, setOrigemEstado] = useState("");
  const [destinoCidade, setDestinoCidade] = useState("");
  const [destinoEstado, setDestinoEstado] = useState("");

  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [valorSugerido, setValorSugerido] = useState("");
  const [rota, setRota] = useState<RotaCalculada | null>(null);
  const valorKm = useValorReferenciaKm(tipoAnuncio === "V" ? tipoVeiculo : null);
  const valorReferencia = rota?.distanciaKm ? valorDeReferencia(rota.distanciaKm, valorKm) : 0;
  const [calculatingRoute, setCalculatingRoute] = useState(false);

  useEffect(() => {
    if (!user || voltaId) return;
    supabase
      .from("vt_usuario")
      .select("tipo_usuario")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.tipo_usuario === "E") setTipoAnuncio("C");
      });
  }, [user, voltaId]);

  // Q5: "Anunciar a volta" — mesmo caminhão, origem e destino invertidos, datas logo após a ida.
  useEffect(() => {
    if (!user || !voltaId) return;
    let ativo = true;
    carregarBaseVolta(voltaId).then((b) => {
      if (!ativo) return;
      if (!b) {
        toast.error("Não encontramos o anúncio de ida para preencher a volta.");
        return;
      }
      setTipoAnuncio("V");
      setPlaca(b.placa);
      setTipoVeiculo(b.tipoVeiculo);
      setCapacidadePeso(b.capacidadePeso != null ? String(b.capacidadePeso) : "");
      setCapacidadeVolume(b.capacidadeVolume != null ? String(b.capacidadeVolume) : "");
      setTipoCarroceria(b.tipoCarroceria);
      setRefrigerado(b.refrigerado);
      setOrigemCidade(b.origemCidade);
      setOrigemEstado(b.origemEstado);
      setDestinoCidade(b.destinoCidade);
      setDestinoEstado(b.destinoEstado);
      setDataInicio(b.dataInicio);
      setDataFim(b.dataFim);
      toast.info("Volta preenchida", {
        description: `${b.origemCidade}/${b.origemEstado} → ${b.destinoCidade}/${b.destinoEstado}. Confira as datas e o valor antes de publicar.`,
      });
    });
    return () => {
      ativo = false;
    };
  }, [user, voltaId]);

  useEffect(() => {
    setRota(null);
    if (!origemCidade || !origemEstado || !destinoCidade || !destinoEstado) return;
    let ativo = true;
    const timer = setTimeout(async () => {
      setCalculatingRoute(true);
      const r = await calcularRota({ cidade: origemCidade, uf: origemEstado }, { cidade: destinoCidade, uf: destinoEstado });
      if (ativo) {
        setRota(r);
        setCalculatingRoute(false);
      }
    }, 800);
    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [origemCidade, origemEstado, destinoCidade, destinoEstado]);

  const escolherCategoria = (valor: string) => {
    setCategoriaCarga(valor);
    if (valor === "Refrigerada") setExigeRefrigeracao(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (dataFim < dataInicio) {
      toast.error("A data fim deve ser igual ou posterior à data início.");
      return;
    }
    // v3 (C2): peso e volume obrigatórios na carga — sem eles o match não sabe se a carga cabe no caminhão.
    if (tipoAnuncio === "C" && (!(numero(pesoMerc) > 0) || !(numero(volumeMerc) > 0))) {
      toast.error("Informe o peso e o volume da carga.", {
        description: "Sem eles não dá para saber em quais caminhões a carga cabe. Uma estimativa já ajuda.",
      });
      return;
    }
    setLoading(true);

    const trajeto = {
      origemCidade,
      origemEstado,
      destinoCidade,
      destinoEstado,
      dataInicio,
      dataFim,
      valorSugerido: numero(valorSugerido),
      rota,
    };

    try {
      let idVeiculo: string | null = null;
      if (tipoAnuncio === "V") {
        idVeiculo = await criarAnuncioVeiculo(user.id, {
          ...trajeto,
          placa,
          tipoVeiculo,
          capacidadePeso: numero(capacidadePeso),
          capacidadeVolume: numero(capacidadeVolume),
          tipoCarroceria: tipoCarroceria || undefined,
          refrigerado,
        });
      } else {
        await criarAnuncioCarga(user.id, {
          ...trajeto,
          descricao,
          tipoMercadoria: tipoMercadoria || undefined,
          categoriaCarga: categoriaCarga || undefined,
          exigeRefrigeracao,
          peso: numero(pesoMerc),
          volume: numero(volumeMerc),
        });
      }

      toast.success("Anúncio publicado!", {
        description: rota
          ? "Seu anúncio já aparece no Match de frete, com a rota calculada."
          : "Publicado sem rota calculada: o Match de frete vai usar as cidades de origem e destino.",
        // Q5: depois da ida, o convite para anunciar a volta (frete de retorno).
        ...(idVeiculo && !voltaId
          ? { duration: 10000, action: { label: "Anunciar a volta", onClick: () => navigate(`/criar-anuncio?volta=${idVeiculo}`) } }
          : {}),
      });
      setTimeout(() => navigate("/painel"), 1200);
    } catch (err) {
      toast.error("Não foi possível publicar o anúncio", { description: mensagemErro(err) });
    } finally {
      setLoading(false);
    }
  };

  const hoje = hojeISO();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30 py-8">
        <div className="container max-w-2xl">
          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-bold text-foreground">Criar anúncio</h1>
            <p className="text-muted-foreground">Anuncie o caminhão com a rota que você vai fazer, ou a carga que precisa enviar. O anúncio aparece na hora para o outro lado.</p>
          </div>

          <Tabs value={tipoAnuncio} onValueChange={(v) => setTipoAnuncio(v as "V" | "C")} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="V" className="gap-2"><Truck className="h-4 w-4" aria-hidden="true" />Tenho caminhão</TabsTrigger>
              <TabsTrigger value="C" className="gap-2"><Package className="h-4 w-4" aria-hidden="true" />Tenho carga</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {tipoAnuncio === "V" ? <Truck className="h-5 w-5 text-accent" aria-hidden="true" /> : <Package className="h-5 w-5 text-accent" aria-hidden="true" />}
                  {tipoAnuncio === "V" ? "Dados do caminhão" : "Dados da carga"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tipoAnuncio === "V" ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="placa">Placa</Label>
                        <Input id="placa" placeholder="ABC1D23" className="mt-1 uppercase" required maxLength={8} value={placa} onChange={(e) => setPlaca(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="tipo-veiculo">Tipo de veículo</Label>
                        <Select required value={tipoVeiculo} onValueChange={setTipoVeiculo}>
                          <SelectTrigger id="tipo-veiculo" className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{tiposVeiculo.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="capacidade">Capacidade (kg)</Label>
                        <Input id="capacidade" type="number" min={0} inputMode="numeric" placeholder="28000" className="mt-1" value={capacidadePeso} onChange={(e) => setCapacidadePeso(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="volume-veiculo">Volume (m³)</Label>
                        <Input id="volume-veiculo" type="number" min={0} inputMode="decimal" placeholder="90" className="mt-1" value={capacidadeVolume} onChange={(e) => setCapacidadeVolume(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="carroceria">Tipo de carroceria</Label>
                        <Select required value={tipoCarroceria} onValueChange={setTipoCarroceria}>
                          <SelectTrigger id="carroceria" className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{tiposCarroceria.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <div className="flex w-full items-center justify-between gap-3 rounded-lg border border-border p-3">
                          <Label htmlFor="refrigerado">Refrigerado</Label>
                          <Switch id="refrigerado" checked={refrigerado} onCheckedChange={setRefrigerado} />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="descricao">Descrição da mercadoria</Label>
                      <Input id="descricao" placeholder="Ex.: Leite UHT paletizado" className="mt-1" required value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="categoria">Categoria da carga</Label>
                        <Select required value={categoriaCarga} onValueChange={escolherCategoria}>
                          <SelectTrigger id="categoria" className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{categoriasCarga.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                        <p className="mt-1 text-xs text-muted-foreground">Define quais carrocerias podem levar a carga.</p>
                      </div>
                      <div>
                        <Label htmlFor="tipo-mercadoria">Tipo de mercadoria (opcional)</Label>
                        <Input id="tipo-mercadoria" placeholder="Ex.: Perecível" className="mt-1" value={tipoMercadoria} onChange={(e) => setTipoMercadoria(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="peso">Peso (kg)</Label>
                        <Input id="peso" type="number" min={1} required inputMode="numeric" placeholder="18000" className="mt-1" value={pesoMerc} onChange={(e) => setPesoMerc(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="volume-carga">Volume (m³)</Label>
                        <Input id="volume-carga" type="number" min={0.1} step="any" required inputMode="decimal" placeholder="70" className="mt-1" value={volumeMerc} onChange={(e) => setVolumeMerc(e.target.value)} />
                      </div>
                    </div>
                    <p className="-mt-2 text-xs text-muted-foreground">
                      Não sabe o volume exato? Uma estimativa já ajuda. Ex.: 1 palete PBR (1,2 m × 1,0 m) com 1,2 m de altura ≈ 1,4 m³.
                    </p>
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                      <Label htmlFor="exige-frio">Exige refrigeração</Label>
                      <Switch id="exige-frio" checked={exigeRefrigeracao} onCheckedChange={setExigeRefrigeracao} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-accent" aria-hidden="true" />Rota
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="origem-cidade">Cidade de origem</Label>
                    <CidadeAutocomplete
                      id="origem-cidade"
                      placeholder="Juiz de Fora"
                      className="mt-1"
                      required
                      value={origemCidade}
                      uf={origemEstado}
                      onTextoChange={setOrigemCidade}
                      onEscolher={(m) => {
                        setOrigemCidade(m.nome);
                        setOrigemEstado(m.uf);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="origem-uf">UF de origem</Label>
                    <Select required value={origemEstado} onValueChange={setOrigemEstado}>
                      <SelectTrigger id="origem-uf" className="mt-1"><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>{estados.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="destino-cidade">Cidade de destino</Label>
                    <CidadeAutocomplete
                      id="destino-cidade"
                      placeholder="São Paulo"
                      className="mt-1"
                      required
                      value={destinoCidade}
                      uf={destinoEstado}
                      onTextoChange={setDestinoCidade}
                      onEscolher={(m) => {
                        setDestinoCidade(m.nome);
                        setDestinoEstado(m.uf);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="destino-uf">UF de destino</Label>
                    <Select required value={destinoEstado} onValueChange={setDestinoEstado}>
                      <SelectTrigger id="destino-uf" className="mt-1"><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>{estados.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div aria-live="polite">
                  {calculatingRoute && (
                    <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                      <span className="text-sm text-muted-foreground">Calculando o melhor trajeto...</span>
                    </div>
                  )}
                  {rota && !calculatingRoute && (
                    <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-sm">
                      <Route className="h-4 w-4 text-success" aria-hidden="true" />
                      <span className="font-medium text-foreground">
                        Rota calculada: {rota.distanciaKm.toLocaleString("pt-BR")} km{rota.duracaoTexto ? ` · ${rota.duracaoTexto}` : ""}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-accent" aria-hidden="true" />Disponibilidade e valor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="data-inicio">Data início</Label>
                    <Input id="data-inicio" type="date" min={hoje} className="mt-1" required value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="data-fim">Data fim</Label>
                    <Input id="data-fim" type="date" min={dataInicio || hoje} className="mt-1" required value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
                  </div>
                </div>
                {valorReferencia > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <span className="text-sm text-muted-foreground">Referência da plataforma ({formatarValorKm(valorKm)})</span>
                    <Button type="button" variant="link" className="h-auto p-0 font-mono text-lg font-bold text-primary" onClick={() => setValorSugerido(String(valorReferencia))}>
                      Usar {formatarReais(valorReferencia)}
                    </Button>
                  </div>
                )}
                <div>
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input id="valor" type="number" min={0} inputMode="decimal" placeholder="8500" className="mt-1" value={valorSugerido} onChange={(e) => setValorSugerido(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Plus className="h-5 w-5" aria-hidden="true" />}
              {loading ? "Publicando..." : "Publicar anúncio"}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CriarAnuncioPage;

/* Fim de CriarAnuncio.tsx */
