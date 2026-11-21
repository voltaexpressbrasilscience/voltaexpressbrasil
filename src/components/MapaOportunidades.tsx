/*
 * MapaOportunidades.tsx — os anúncios ativos no mapa, agrupados por região (Match v3, M6).
 * Azul = caminhão (origem da viagem); laranja = carga (ponto de coleta). Clique abre o detalhe.
 * Usa as coordenadas já gravadas (sem chamar rotas do Google). Sem chave do mapa, mostra um aviso.
 */
import { useCallback, useMemo, useState } from "react";
import { GoogleMap, Marker, MarkerClusterer, useJsApiLoader } from "@react-google-maps/api";
import { Loader2, MapPinOff } from "lucide-react";
import type { AnuncioCompleto } from "@/lib/anuncio-service";
import { limites, pontoDe } from "@/lib/geo";
import AnuncioDetailDialog from "./AnuncioDetailDialog";

const GOOGLE_MAPS_KEY: string = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY ?? "";
const COR = { V: "#104ac8", C: "#fe5b3d" } as const;

interface Props {
  anuncios: AnuncioCompleto[];
}

const MapaOportunidades = ({ anuncios }: Props) => {
  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className="flex h-[420px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card p-6 text-center">
        <MapPinOff className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium text-foreground">Mapa indisponível neste ambiente</p>
        <p className="text-sm text-muted-foreground">Configure a chave do mapa (VITE_GOOGLE_MAPS_BROWSER_KEY) ou use a lista.</p>
      </div>
    );
  }
  return <MapaGoogle anuncios={anuncios} />;
};

const MapaGoogle = ({ anuncios }: Props) => {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GOOGLE_MAPS_KEY });
  const [aberto, setAberto] = useState<AnuncioCompleto | null>(null);
  const comPonto = useMemo(
    () => anuncios.flatMap((a) => {
      const p = pontoDe(a.origem_lat, a.origem_lng);
      return p ? [{ a, p }] : [];
    }),
    [anuncios],
  );
  const semPonto = anuncios.length - comPonto.length;

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      const l = limites(comPonto.map((x) => x.p));
      if (l) map.fitBounds(new google.maps.LatLngBounds(l.sw, l.ne), 40);
    },
    [comPonto],
  );

  if (!isLoaded) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-lg bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="h-[420px] overflow-hidden rounded-lg border border-border sm:h-[520px]">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={{ lat: -15.78, lng: -47.93 }}
          zoom={4}
          onLoad={onLoad}
          options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: true }}
        >
          <MarkerClusterer>
            {(clusterer) => (
              <>
                {comPonto.map(({ a, p }) => {
                  const tipo = a.tipo_anuncio === "V" ? "V" : "C";
                  return (
                    <Marker
                      key={a.id}
                      position={p}
                      clusterer={clusterer}
                      title={`${tipo === "V" ? "Caminhão" : "Carga"}: ${a.origem_cidade}/${a.origem_estado.trim()} → ${a.destino_cidade}/${a.destino_estado.trim()}`}
                      icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: COR[tipo],
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 2,
                      }}
                      onClick={() => setAberto(a)}
                    />
                  );
                })}
              </>
            )}
          </MarkerClusterer>
        </GoogleMap>
      </div>
      <p className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COR.V }} aria-hidden="true" />Caminhão (origem)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COR.C }} aria-hidden="true" />Carga (coleta)
        </span>
        {semPonto > 0 && <span>{semPonto} anúncio(s) sem coordenadas aparecem só na lista.</span>}
      </p>
      <AnuncioDetailDialog anuncio={aberto} open={aberto !== null} onOpenChange={(v) => !v && setAberto(null)} />
    </div>
  );
};

export default MapaOportunidades;

/* Fim de MapaOportunidades.tsx */
