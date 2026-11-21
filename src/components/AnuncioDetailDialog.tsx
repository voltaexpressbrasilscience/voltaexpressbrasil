/*
 * AnuncioDetailDialog.tsx — detalhe do anúncio com mapa, valores e contato.
 * Usa a distância gravada no anúncio (Match v2); só consulta a rota quando o anúncio é antigo.
 * v3 (M1): o mapa desenha a rota gravada no anúncio (vt_rota_anuncio), sem pedir outra ao Google.
 * v3 (Q6): a referência usa o valor por km do tipo de veículo, quando cadastrado.
 */
import { lazy, Suspense, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Truck, Package, MapPin, Calendar, Snowflake, ArrowRight, Route, Repeat } from "lucide-react";
import type { AnuncioCompleto } from "@/lib/anuncio-service";
import { calcularRota } from "@/lib/rota-service";
import { buscarRotaAnuncio } from "@/lib/geo-service";
import { formatarData, formatarKg, formatarReais } from "@/lib/formatos";
import { useValorReferenciaKm, formatarValorKm, valorDeReferencia } from "@/lib/config-service";
import ScoreBadge from "./anuncio/ScoreBadge";
import Motivos from "./anuncio/Motivos";
import Anunciante from "./anuncio/Anunciante";
import BotaoInteresse from "./anuncio/BotaoInteresse";

const RouteMap = lazy(() => import("./RouteMap"));

interface AnuncioDetailDialogProps {
  anuncio: AnuncioCompleto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* Diálogo de detalhe; a distância vem do anúncio ou, se faltar, da Edge Function. */
const AnuncioDetailDialog = ({ anuncio, open, onOpenChange }: AnuncioDetailDialogProps) => {
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  // undefined = ainda consultando (o mapa espera, para não pedir a rota ao Google à toa); null = sem rota gravada.
  const [polyline, setPolyline] = useState<string | null | undefined>(undefined);
  const valorKm = useValorReferenciaKm(anuncio?.tipo_veiculo);

  useEffect(() => {
    if (!anuncio || !open) return;
    let ativo = true;
    setPolyline(undefined);
    buscarRotaAnuncio(anuncio.id).then((p) => ativo && setPolyline(p));
    return () => {
      ativo = false;
    };
  }, [anuncio, open]);

  useEffect(() => {
    if (!anuncio || !open) return;
    if (anuncio.distancia_km) {
      setDistanceKm(Number(anuncio.distancia_km));
      return;
    }
    setDistanceKm(null);
    let ativo = true;
    calcularRota(
      { cidade: anuncio.origem_cidade, uf: anuncio.origem_estado },
      { cidade: anuncio.destino_cidade, uf: anuncio.destino_estado },
    ).then((rota) => {
      if (ativo && rota) setDistanceKm(rota.distanciaKm);
    });
    return () => {
      ativo = false;
    };
  }, [anuncio, open]);

  if (!anuncio) return null;

  const isVeiculo = anuncio.tipo_anuncio === "V";
  const valorReferencia = distanceKm ? valorDeReferencia(distanceKm, valorKm) : null;
  const peso = isVeiculo ? anuncio.capacidade_peso_kg : anuncio.peso_kg;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${isVeiculo ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
              {isVeiculo ? <Truck className="h-5 w-5" aria-hidden="true" /> : <Package className="h-5 w-5" aria-hidden="true" />}
            </span>
            <span>{isVeiculo ? "Veículo disponível" : "Carga disponível"}</span>
            {anuncio.refrigerado && (
              <Badge className="gap-1 bg-sky-100 text-sky-800 hover:bg-sky-100">
                <Snowflake className="h-3 w-3" aria-hidden="true" />Refrigerado
              </Badge>
            )}
            {anuncio.frete_retorno && (
              <Badge className="gap-1 bg-success/15 text-success hover:bg-success/15">
                <Repeat className="h-3 w-3" aria-hidden="true" />Frete de retorno
              </Badge>
            )}
            {typeof anuncio.score === "number" && <ScoreBadge score={anuncio.score} />}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 pt-2 text-sm text-foreground">
            <MapPin className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
            <span className="font-semibold">{anuncio.origem_cidade}/{anuncio.origem_estado.trim()}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="para" />
            <MapPin className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <span className="font-semibold">{anuncio.destino_cidade}/{anuncio.destino_estado.trim()}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-2 pt-4">
          <div className="flex flex-wrap gap-2">
            {anuncio.tipo_veiculo && <Badge variant="secondary">{anuncio.tipo_veiculo}</Badge>}
            {anuncio.tipo_carroceria && <Badge variant="secondary">{anuncio.tipo_carroceria}</Badge>}
            {anuncio.categoria_carga && <Badge variant="secondary">{anuncio.categoria_carga}</Badge>}
            {anuncio.descricao_mercadoria && <Badge variant="secondary">{anuncio.descricao_mercadoria}</Badge>}
            {peso != null && <Badge variant="outline">{isVeiculo ? "Capacidade " : "Peso "}{formatarKg(peso)}</Badge>}
          </div>

          <Motivos motivos={anuncio.motivos} />

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <Anunciante nome={anuncio.nome_usuario} fotoUrl={anuncio.foto_url} />
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {formatarData(anuncio.data_inicio)} – {formatarData(anuncio.data_fim)}
            </span>
            {distanceKm != null && (
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Route className="h-3.5 w-3.5" aria-hidden="true" />{distanceKm.toLocaleString("pt-BR")} km
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {anuncio.valor_sugerido != null && (
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Valor anunciado</p>
                <p className="font-mono text-lg font-bold tabular-nums text-accent">{formatarReais(anuncio.valor_sugerido)}</p>
              </div>
            )}
            {valorReferencia != null && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">Referência da plataforma ({formatarValorKm(valorKm)})</p>
                <p className="font-mono text-lg font-bold tabular-nums text-primary">{formatarReais(valorReferencia)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="h-[360px] w-full border-t border-border sm:h-[400px]">
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted" />}>
            {polyline === undefined ? (
              <div className="h-full w-full animate-pulse bg-muted" />
            ) : (
            <RouteMap
              origemCidade={anuncio.origem_cidade}
              origemEstado={anuncio.origem_estado}
              destinoCidade={anuncio.destino_cidade}
              destinoEstado={anuncio.destino_estado}
              distanceKm={distanceKm ?? undefined}
              polyline={polyline}
            />
            )}
          </Suspense>
        </div>

        <div className="p-6 pt-4">
          <BotaoInteresse anuncio={anuncio} size="default" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnuncioDetailDialog;

/* Fim de AnuncioDetailDialog.tsx */
