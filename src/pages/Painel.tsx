/*
 * Painel.tsx — "Meu painel" (DS4): indicadores do usuário em estilo telemetria e gestão dos próprios anúncios.
 * Indicadores vêm de vt_meu_painel; os anúncios podem ser pausados, reativados ou encerrados.
 * v3 (Q5): anúncio de caminhão oferece "Anunciar a volta" (frete de retorno).
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Eye, MessageCircle, Plus, Route, Send, Pause, Play, CircleStop, Truck, Package, ArrowRight, Handshake, Repeat } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  alterarStatusAnuncio,
  buscarMeusAnuncios,
  carregarPainel,
  encerrarAnuncio,
  statusExibido,
  textoValidade,
  type AnuncioCompleto,
  type PainelUsuario,
  type StatusAnuncio,
} from "@/lib/anuncio-service";
import { formatarData, formatarReais } from "@/lib/formatos";
import { mensagemErro } from "@/lib/erros";

const ROTULO_STATUS: Record<string, { texto: string; classe: string }> = {
  ATIVO: { texto: "Ativo", classe: "bg-success/15 text-success border-success/30" },
  PAUSADO: { texto: "Pausado", classe: "bg-muted text-muted-foreground border-border" },
  ENCERRADO: { texto: "Encerrado", classe: "bg-secondary text-secondary-foreground border-border" },
  EXPIRADO: { texto: "Expirado", classe: "bg-destructive/10 text-destructive border-destructive/30" },
};

/* Bloco de indicador com número grande e rótulo. */
const Indicador = ({ icone: Icone, valor, rotulo, detalhe }: { icone: typeof Activity; valor: number | string; rotulo: string; detalhe: string }) => (
  <Card className="border-border shadow-card">
    <CardContent className="flex items-start gap-4 p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icone className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <p className="font-mono text-3xl font-bold tabular-nums text-foreground">{valor}</p>
        <p className="text-sm font-medium text-foreground">{rotulo}</p>
        <p className="text-xs text-muted-foreground">{detalhe}</p>
      </div>
    </CardContent>
  </Card>
);

/* Página do painel do usuário logado. */
const PainelPage = () => {
  const { user } = useAuth();
  const [painel, setPainel] = useState<PainelUsuario | null>(null);
  const [anuncios, setAnuncios] = useState<AnuncioCompleto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [alterando, setAlterando] = useState<string | null>(null);
  const [encerrando, setEncerrando] = useState<AnuncioCompleto | null>(null);

  const carregar = useCallback(async () => {
    if (!user) return;
    try {
      const [p, lista] = await Promise.all([carregarPainel(), buscarMeusAnuncios(user.id)]);
      setPainel(p);
      setAnuncios(lista);
    } catch (err) {
      toast.error("Não foi possível carregar o painel", { description: mensagemErro(err) });
    } finally {
      setCarregando(false);
    }
  }, [user]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const mudarStatus = async (id: string, status: StatusAnuncio) => {
    setAlterando(id);
    try {
      await alterarStatusAnuncio(id, status);
      toast.success(status === "ATIVO" ? "Anúncio reativado" : status === "PAUSADO" ? "Anúncio pausado" : "Anúncio encerrado");
      await carregar();
    } catch (err) {
      toast.error("Não foi possível alterar o anúncio", { description: mensagemErro(err) });
    } finally {
      setAlterando(null);
    }
  };

  /* v3 (T3.5): ao encerrar, pergunta se o frete foi fechado pela Volta Express (mede a North Star). */
  const confirmarEncerramento = async (freteFechado: boolean) => {
    const anuncio = encerrando;
    setEncerrando(null);
    if (!anuncio) return;
    setAlterando(anuncio.id);
    try {
      const { registrouFechado } = await encerrarAnuncio(anuncio.id, freteFechado);
      toast.success("Anúncio encerrado", {
        description: registrouFechado ? "Que bom! O frete fechado entrou nos seus indicadores." : undefined,
      });
      await carregar();
    } catch (err) {
      toast.error("Não foi possível encerrar o anúncio", { description: mensagemErro(err) });
    } finally {
      setAlterando(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30 py-8">
        <div className="container space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-foreground">Meu painel</h1>
              <p className="text-muted-foreground">Seus anúncios e o que eles estão gerando nos últimos 30 dias.</p>
            </div>
            <Button asChild className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/criar-anuncio"><Plus className="h-4 w-4" aria-hidden="true" />Novo anúncio</Link>
            </Button>
          </div>

          <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {carregando || !painel ? (
              [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)
            ) : (
              <>
                <Indicador icone={Activity} valor={painel.anuncios_ativos} rotulo="Anúncios ativos" detalhe={`${Number(painel.km_anunciados).toLocaleString("pt-BR")} km de rotas publicadas`} />
                <Indicador icone={Eye} valor={painel.exibicoes_30d} rotulo="Exibições em matches" detalhe="Vezes que seus anúncios apareceram" />
                <Indicador icone={MessageCircle} valor={painel.interesses_recebidos_30d} rotulo="Interesses recebidos" detalhe="Pessoas que pediram seu contato" />
                <Indicador icone={Send} valor={painel.interesses_enviados_30d} rotulo="Interesses enviados" detalhe="Contatos que você abriu" />
                <Indicador icone={Handshake} valor={painel.fretes_fechados_30d ?? 0} rotulo="Fretes fechados" detalhe="Informados ao encerrar um anúncio" />
              </>
            )}
          </section>

          <section aria-label="Meus anúncios" className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Meus anúncios</h2>
            {carregando ? (
              <Skeleton className="h-40 w-full rounded-lg" />
            ) : anuncios.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
                <p className="font-medium text-foreground">Você ainda não publicou anúncios.</p>
                <p className="mt-1 text-sm text-muted-foreground">Anuncie seu caminhão ou sua carga: o anúncio aparece na hora para o outro lado.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {anuncios.map((a) => {
                  const status = statusExibido(a);
                  const rotulo = ROTULO_STATUS[status] ?? ROTULO_STATUS.ATIVO;
                  const isVeiculo = a.tipo_anuncio === "V";
                  return (
                    <li key={a.id}>
                      <Card className="border-border">
                        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isVeiculo ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                              {isVeiculo ? <Truck className="h-5 w-5" aria-hidden="true" /> : <Package className="h-5 w-5" aria-hidden="true" />}
                            </div>
                            <div className="min-w-0 space-y-1">
                              <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
                                {a.origem_cidade}/{a.origem_estado.trim()}
                                <ArrowRight className="h-4 w-4 text-muted-foreground" aria-label="para" />
                                {a.destino_cidade}/{a.destino_estado.trim()}
                                <Badge variant="outline" className={rotulo.classe}>{rotulo.texto}</Badge>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {isVeiculo ? [a.tipo_veiculo, a.tipo_carroceria].filter(Boolean).join(" · ") : a.descricao_mercadoria}
                                {" · "}
                                {formatarData(a.data_inicio)} – {formatarData(a.data_fim)}
                                {status === "ATIVO" && textoValidade(a.data_fim) && ` · ${textoValidade(a.data_fim)}`}
                                {a.valor_sugerido != null && ` · ${formatarReais(a.valor_sugerido)}`}
                              </p>
                              {a.distancia_km ? (
                                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Route className="h-3 w-3" aria-hidden="true" />Rota gravada: {Number(a.distancia_km).toLocaleString("pt-BR")} km
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">Sem rota gravada: o match usa as cidades.</p>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            {isVeiculo && (
                              <Button asChild variant="outline" size="sm" className="gap-1">
                                <Link to={`/criar-anuncio?volta=${a.id}`} aria-label={`Anunciar a volta de ${a.destino_cidade} para ${a.origem_cidade}`}>
                                  <Repeat className="h-4 w-4" aria-hidden="true" />Anunciar a volta
                                </Link>
                              </Button>
                            )}
                            {status === "ATIVO" && (
                              <Button variant="outline" size="sm" className="gap-1" disabled={alterando === a.id} onClick={() => mudarStatus(a.id, "PAUSADO")}>
                                <Pause className="h-4 w-4" aria-hidden="true" />Pausar
                              </Button>
                            )}
                            {status === "PAUSADO" && (
                              <Button variant="outline" size="sm" className="gap-1" disabled={alterando === a.id} onClick={() => mudarStatus(a.id, "ATIVO")}>
                                <Play className="h-4 w-4" aria-hidden="true" />Reativar
                              </Button>
                            )}
                            {(status === "ATIVO" || status === "PAUSADO" || status === "EXPIRADO") && (
                              <Button variant="outline" size="sm" className="gap-1 text-destructive" disabled={alterando === a.id} onClick={() => setEncerrando(a)}>
                                <CircleStop className="h-4 w-4" aria-hidden="true" />Encerrar
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>

      <AlertDialog open={encerrando !== null} onOpenChange={(aberto) => !aberto && setEncerrando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>O frete foi fechado pela Volta Express?</AlertDialogTitle>
            <AlertDialogDescription>
              {encerrando && `${encerrando.origem_cidade}/${encerrando.origem_estado.trim()} → ${encerrando.destino_cidade}/${encerrando.destino_estado.trim()}. `}
              O anúncio sai do ar nos dois casos. A sua resposta nos ajuda a medir quantas viagens deixaram de rodar vazias.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <Button variant="outline" onClick={() => confirmarEncerramento(false)}>
              Não, só encerrar
            </Button>
            <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => confirmarEncerramento(true)}>
              <Handshake className="h-4 w-4" aria-hidden="true" />Sim, fechamos o frete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default PainelPage;

/* Fim de Painel.tsx */
