/*
 * route-distance — distância, duração e traçado da rota entre duas cidades (Google Directions).
 * Usada na criação do anúncio (a rota é gravada para o Match), no Matching e no detalhe do anúncio.
 * Protegida por CORS restrito, login obrigatório e limite de chamadas (ver _shared/seguranca.ts).
 * Match v3 (P2): cache de 30 dias na tabela vt_rota_cache (migração M3). A mesma origem→destino
 * não chama o Google de novo. Sem a tabela ou sem a chave de serviço, segue sem cache, como antes.
 */
import { responder, validarRequisicao } from "../_shared/seguranca.ts";

const VALOR_REFERENCIA_KM = 6.5;
const VALIDADE_CACHE_DIAS = 30;

interface Rota {
  distanceKm: number;
  distanceText: string;
  durationText: string;
  overviewPolyline: string;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  suggestedValue: number;
}

/* "Juiz de Fora, MG, Brasil" → "juiz de fora, mg, brasil" (sem acento, espaços simples). */
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function chaveCache(origem: string, destino: string): string {
  return `${normalizar(origem)}|${normalizar(destino)}`;
}

/* Cabeçalhos da API REST do banco com a chave de serviço (só existe dentro da Edge Function). */
function acessoBanco(): { url: string; headers: Record<string, string> } | null {
  const url = Deno.env.get("SUPABASE_URL");
  const chave = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !chave) return null;
  return { url: `${url}/rest/v1/vt_rota_cache`, headers: { apikey: chave, Authorization: `Bearer ${chave}`, "Content-Type": "application/json" } };
}

async function lerCache(chave: string): Promise<Rota | null> {
  const banco = acessoBanco();
  if (!banco) return null;
  try {
    const desde = new Date(Date.now() - VALIDADE_CACHE_DIAS * 86400000).toISOString();
    const res = await fetch(`${banco.url}?chave=eq.${encodeURIComponent(chave)}&criado_em=gte.${encodeURIComponent(desde)}&select=*`, {
      headers: banco.headers,
    });
    if (!res.ok) return null;
    const [linha] = await res.json();
    if (!linha) return null;
    const km = Number(linha.distancia_km);
    return {
      distanceKm: km,
      distanceText: `${km.toLocaleString("pt-BR")} km`,
      durationText: linha.duracao_texto ?? "",
      overviewPolyline: linha.polyline,
      startLocation: { lat: Number(linha.origem_lat), lng: Number(linha.origem_lng) },
      endLocation: { lat: Number(linha.destino_lat), lng: Number(linha.destino_lng) },
      suggestedValue: Math.round(km * VALOR_REFERENCIA_KM * 100) / 100,
    };
  } catch {
    return null;
  }
}

async function gravarCache(chave: string, r: Rota): Promise<void> {
  const banco = acessoBanco();
  if (!banco || !r.overviewPolyline) return;
  try {
    await fetch(banco.url, {
      method: "POST",
      headers: { ...banco.headers, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        chave,
        distancia_km: r.distanceKm,
        duracao_texto: r.durationText,
        polyline: r.overviewPolyline,
        origem_lat: r.startLocation.lat,
        origem_lng: r.startLocation.lng,
        destino_lat: r.endLocation.lat,
        destino_lng: r.endLocation.lng,
        criado_em: new Date().toISOString(),
      }),
    });
  } catch {
    // Cache é otimização: falhar aqui não pode derrubar a resposta.
  }
}

Deno.serve(async (req) => {
  const validacao = await validarRequisicao(req);
  if ("erro" in validacao) return validacao.erro;
  const { origin, destination } = validacao.dados;
  const chave = chaveCache(origin, destination);

  try {
    const emCache = await lerCache(chave);
    if (emCache) return responder(req, { ...emCache, cache: true });

    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) return responder(req, { error: "API key not configured" }, 500);

    const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
    url.searchParams.set("origin", origin);
    url.searchParams.set("destination", destination);
    url.searchParams.set("language", "pt-BR");
    url.searchParams.set("region", "br");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status !== "OK" || !data.routes?.length) {
      return responder(req, { error: "No route found", status: data.status }, 404);
    }

    const route = data.routes[0];
    const leg = route.legs[0];
    const distanceKm = leg.distance.value / 1000;

    const rota: Rota = {
      distanceKm: Math.round(distanceKm * 10) / 10,
      distanceText: leg.distance.text,
      durationText: leg.duration.text,
      overviewPolyline: route.overview_polyline?.points ?? "",
      startLocation: leg.start_location,
      endLocation: leg.end_location,
      suggestedValue: Math.round(distanceKm * VALOR_REFERENCIA_KM * 100) / 100,
    };
    await gravarCache(chave, rota);
    return responder(req, { ...rota, cache: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return responder(req, { error: message }, 500);
  }
});

/* Fim de route-distance */
