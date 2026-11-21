/*
 * RouteMap.tsx — mapa do trajeto (Google Maps JS no navegador).
 * Chave: VITE_GOOGLE_MAPS_BROWSER_KEY (restrita por domínio no Google Cloud). Sem chave no código (v3, T1.1):
 * se a variável não estiver configurada, mostra um cartão com o link do trajeto no Google Maps, que não precisa de chave.
 *
 * Match v3:
 * - M1: com a rota gravada (polyline), desenha direto, sem pedir outra rota ao Google (antes: 1 chamada paga por abertura).
 * - M2: desenha a faixa de busca (mesmo raio do banco) e os pontos de coleta e entrega dos resultados, coloridos pela nota.
 * - M5: no "perto de mim", desenha o círculo da busca ao redor da posição.
 * Sem polyline (anúncio antigo), continua calculando a rota no navegador, como antes.
 */
import { Fragment, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker, Polyline, Circle } from "@react-google-maps/api";
import { MapPin, Navigation, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { decodificarPolyline, larguraFaixaPx, limites, type Ponto } from "@/lib/geo";
import { faixaScore } from "@/lib/matching-service";

const GOOGLE_MAPS_KEY: string = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY ?? "";

const containerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: -15.78, lng: -47.93 };

/* Cores do mapa (o Google não lê as variáveis CSS do tema). */
const COR_ROTA = "#fe5b3d";
const COR_FAIXA = "#fe5b3d";
const COR_TOM = { alto: "#15803d", medio: "#104ac8", baixo: "#6b7280" } as const;

export interface PontoMapa {
  id: string;
  coleta: Ponto;
  entrega?: Ponto | null;
  score?: number;
  rotulo: string;
}

export interface RouteMapProps {
  origemCidade: string;
  origemEstado: string;
  destinoCidade: string;
  destinoEstado: string;
  distanceKm?: number;
  /** Rota já calculada (polyline do Google). Com ela, o mapa não chama o Google de novo. */
  polyline?: string | null;
  /** Resultados do match para marcar no mapa (coleta e entrega). */
  pontos?: PontoMapa[];
  /** Raio (km) da faixa de busca ao redor da rota ou do círculo do "perto de mim". */
  raioKm?: number | null;
  /** Centro do "perto de mim". */
  centro?: Ponto | null;
}

/** Link do trajeto no Google Maps (não usa chave de API). */
const linkTrajeto = ({ origemCidade, origemEstado, destinoCidade, destinoEstado }: RouteMapProps) =>
  `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${encodeURIComponent(
    `${origemCidade}, ${origemEstado.trim()}, Brasil`
  )}&destination=${encodeURIComponent(`${destinoCidade}, ${destinoEstado.trim()}, Brasil`)}`;

/** Sem chave configurada: cartão com o trajeto e o link, em vez de um mapa quebrado. */
const RouteMapSemChave = (props: RouteMapProps) => {
  const temTrajeto = props.origemCidade && props.destinoCidade;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg bg-muted/30 p-6 text-center">
      <MapPin className="h-8 w-8 text-primary" aria-hidden="true" />
      {temTrajeto ? (
        <p className="text-sm font-semibold text-foreground">
          {props.origemCidade}/{props.origemEstado.trim()} → {props.destinoCidade}/{props.destinoEstado.trim()}
        </p>
      ) : props.raioKm ? (
        <p className="text-sm font-semibold text-foreground">Cargas a até {props.raioKm} km de você</p>
      ) : null}
      {props.distanceKm ? (
        <p className="text-sm text-muted-foreground">{props.distanceKm.toLocaleString("pt-BR")} km de trajeto</p>
      ) : null}
      {props.pontos && props.pontos.length > 0 ? (
        <p className="text-xs text-muted-foreground">{props.pontos.length} resultado(s) na lista ao lado</p>
      ) : null}
      {temTrajeto && (
        <a
          href={linkTrajeto(props)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" /> Ver trajeto no Google Maps
        </a>
      )}
    </div>
  );
};

const RouteMap = (props: RouteMapProps) =>
  GOOGLE_MAPS_KEY ? <RouteMapGoogle {...props} /> : <RouteMapSemChave {...props} />;

/* Ícone redondo (coleta: cheio; entrega: vazado) na cor da faixa da nota. */
function icone(cor: string, cheio: boolean, escala: number): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: escala,
    fillColor: cheio ? cor : "#ffffff",
    fillOpacity: 1,
    strokeColor: cor,
    strokeWeight: cheio ? 2 : 3,
  };
}

const RouteMapGoogle = (props: RouteMapProps) => {
  const { origemCidade, origemEstado, destinoCidade, destinoEstado, distanceKm, polyline, pontos, raioKm, centro } = props;
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GOOGLE_MAPS_KEY });
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const caminho = useMemo(() => (polyline ? decodificarPolyline(polyline) : []), [polyline]);
  const usaDirections = caminho.length === 0 && !centro && !!origemCidade && !!destinoCidade;
  const [loadingRoute, setLoadingRoute] = useState(usaDirections);
  const [zoom, setZoom] = useState(5);
  const mapRef = useRef<google.maps.Map | null>(null);

  const enquadrar = useCallback(
    (map: google.maps.Map) => {
      const todos: Ponto[] = [...caminho];
      (pontos ?? []).forEach((p) => {
        todos.push(p.coleta);
        if (p.entrega) todos.push(p.entrega);
      });
      if (centro) {
        const graus = (raioKm ?? 50) / 111;
        todos.push({ lat: centro.lat + graus, lng: centro.lng + graus }, { lat: centro.lat - graus, lng: centro.lng - graus });
      }
      const l = limites(todos);
      if (!l) return;
      map.fitBounds(new google.maps.LatLngBounds(l.sw, l.ne), 32);
    },
    [caminho, pontos, centro, raioKm],
  );

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      enquadrar(map);
    },
    [enquadrar],
  );

  useEffect(() => {
    if (mapRef.current) enquadrar(mapRef.current);
  }, [enquadrar]);

  useEffect(() => {
    if (!isLoaded || !usaDirections) return;
    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: `${origemCidade}, ${origemEstado.trim()}, Brasil`,
        destination: `${destinoCidade}, ${destinoEstado.trim()}, Brasil`,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        setLoadingRoute(false);
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        }
      }
    );
  }, [isLoaded, usaDirections, origemCidade, origemEstado, destinoCidade, destinoEstado]);

  const handleMarkPosition = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada pelo navegador");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(coords);
        mapRef.current?.panTo(coords);
        mapRef.current?.setZoom(10);
        toast.success("Sua posição foi marcada no mapa!");
      },
      () => toast.error("Não foi possível obter sua localização")
    );
  };

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/30 rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const latMedia = caminho.length > 0 ? caminho[Math.floor(caminho.length / 2)].lat : centro?.lat ?? defaultCenter.lat;
  const largura = raioKm && caminho.length > 0 ? larguraFaixaPx(raioKm, latMedia, zoom) : 0;
  const temPontos = (pontos ?? []).length > 0;

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={centro ?? defaultCenter}
        zoom={5}
        onLoad={onLoad}
        onZoomChanged={() => {
          const z = mapRef.current?.getZoom();
          if (typeof z === "number") setZoom(z);
        }}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: { strokeColor: COR_ROTA, strokeWeight: 5 },
              suppressMarkers: false,
            }}
          />
        )}

        {caminho.length > 0 && largura > 0 && (
          <Polyline
            path={caminho}
            options={{ strokeColor: COR_FAIXA, strokeOpacity: 0.12, strokeWeight: largura, clickable: false, zIndex: 1 }}
          />
        )}
        {caminho.length > 0 && (
          <>
            <Polyline path={caminho} options={{ strokeColor: COR_ROTA, strokeOpacity: 0.95, strokeWeight: 5, clickable: false, zIndex: 2 }} />
            <Marker position={caminho[0]} label={{ text: "A", color: "#ffffff", fontWeight: "700" }} title={`Origem: ${origemCidade}`} zIndex={5} />
            <Marker position={caminho[caminho.length - 1]} label={{ text: "B", color: "#ffffff", fontWeight: "700" }} title={`Destino: ${destinoCidade}`} zIndex={5} />
          </>
        )}

        {centro && raioKm ? (
          <>
            <Circle
              center={centro}
              radius={raioKm * 1000}
              options={{ fillColor: COR_FAIXA, fillOpacity: 0.1, strokeColor: COR_FAIXA, strokeOpacity: 0.6, strokeWeight: 1, clickable: false }}
            />
            <Marker position={centro} icon={icone("#104ac8", true, 9)} title="Você está aqui" zIndex={6} />
          </>
        ) : null}

        {(pontos ?? []).map((p) => {
          const cor = typeof p.score === "number" ? COR_TOM[faixaScore(p.score).tom] : COR_TOM.medio;
          return (
            <Fragment key={p.id}>
              {p.entrega && (
                <Polyline
                  path={[p.coleta, p.entrega]}
                  options={{
                    strokeOpacity: 0,
                    clickable: false,
                    zIndex: 3,
                    icons: [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 0.8, strokeColor: cor, scale: 2 }, offset: "0", repeat: "10px" }],
                  }}
                />
              )}
              <Marker
                position={p.coleta}
                icon={icone(cor, true, 11)}
                label={typeof p.score === "number" ? { text: String(p.score), color: "#ffffff", fontSize: "10px", fontWeight: "700" } : undefined}
                title={`Coleta: ${p.rotulo}`}
                zIndex={7}
              />
              {p.entrega && <Marker position={p.entrega} icon={icone(cor, false, 6)} title={`Entrega: ${p.rotulo}`} zIndex={6} />}
            </Fragment>
          );
        })}

        {userPos && (
          <Marker
            position={userPos}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#104ac8",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 3,
            }}
            title="Sua posição"
          />
        )}
      </GoogleMap>

      {(temPontos || largura > 0) && (
        <div className="absolute left-3 top-3 rounded-md border border-border bg-card/95 px-3 py-2 text-xs text-foreground shadow">
          {largura > 0 && (
            <p className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-5 rounded-sm" style={{ background: COR_FAIXA, opacity: 0.35 }} aria-hidden="true" />
              Faixa de busca: {raioKm} km da rota
            </p>
          )}
          {temPontos && (
            <p className="mt-1 flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COR_TOM.alto }} aria-hidden="true" />
              coleta (nota)
              <span className="ml-2 inline-block h-2.5 w-2.5 rounded-full border-2 bg-white" style={{ borderColor: COR_TOM.alto }} aria-hidden="true" />
              entrega
            </p>
          )}
        </div>
      )}

      {/* Overlay controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
        <Button
          onClick={handleMarkPosition}
          size="sm"
          className="gap-2 bg-primary text-primary-foreground shadow-lg"
        >
          <Navigation className="h-4 w-4" />
          Marcar minha posição
        </Button>

        {distanceKm && (
          <div className="rounded-lg bg-card/95 backdrop-blur-sm px-3 py-2 shadow-lg border border-border">
            <p className="text-xs text-muted-foreground">Distância</p>
            <p className="text-sm font-bold text-foreground">{distanceKm.toLocaleString("pt-BR")} km</p>
          </div>
        )}
      </div>

      {loadingRoute && usaDirections && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
          <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-3 shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Calculando melhor trajeto...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteMap;
