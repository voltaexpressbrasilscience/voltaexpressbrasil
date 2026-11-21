/*
 * route-cities — cidades ao longo de uma rota (Google Directions + Geocoding reverso).
 * Legado: o Match v2 não usa mais esta função (a rota é gravada no anúncio e comparada no banco).
 * Mantida para compatibilidade, com CORS restrito, login obrigatório e limite de chamadas (P2).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { responder, validarRequisicao } from "../_shared/seguranca.ts";

const stateMap: Record<string, string> = {
  "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM", "Bahia": "BA",
  "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES", "Goiás": "GO",
  "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS", "Minas Gerais": "MG",
  "Pará": "PA", "Paraíba": "PB", "Paraná": "PR", "Pernambuco": "PE", "Piauí": "PI",
  "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN", "Rio Grande do Sul": "RS",
  "Rondônia": "RO", "Roraima": "RR", "Santa Catarina": "SC", "São Paulo": "SP",
  "Sergipe": "SE", "Tocantins": "TO",
};

function normalizeState(name: string): string {
  if (name.length === 2) return name.toUpperCase();
  return stateMap[name] ?? name;
}

Deno.serve(async (req) => {
  const validacao = await validarRequisicao(req);
  if ("erro" in validacao) return validacao.erro;
  const { origin, destination } = validacao.dados;

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error("GOOGLE_MAPS_API_KEY is not configured");
    }

    const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
    url.searchParams.set("origin", origin);
    url.searchParams.set("destination", destination);
    url.searchParams.set("language", "pt-BR");
    url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status !== "OK" || !data.routes?.length) {
      return responder(req, { cities: [], error: `Directions API: ${data.status}`, detail: data.error_message });
    }

    const route = data.routes[0];
    const citiesSet = new Set<string>();

    for (const leg of route.legs) {
      extractCityState(leg.start_address, citiesSet);
      extractCityState(leg.end_address, citiesSet);
    }

    const polylinePoints = decodePolyline(route.overview_polyline.points);
    const totalPoints = polylinePoints.length;
    const totalDistanceM = route.legs.reduce((sum: number, leg: { distance?: { value?: number } }) => sum + (leg.distance?.value || 0), 0);
    const totalDistanceKm = totalDistanceM / 1000;
    const desiredSamples = Math.min(15, Math.max(3, Math.ceil(totalDistanceKm / 40)));
    const sampleStep = Math.max(1, Math.floor(totalPoints / desiredSamples));

    const sampledPoints: Array<{ lat: number; lng: number }> = [];
    for (let i = 0; i < totalPoints; i += sampleStep) {
      sampledPoints.push(polylinePoints[i]);
    }
    if (totalPoints > 0) {
      sampledPoints.push(polylinePoints[totalPoints - 1]);
    }

    for (const point of sampledPoints) {
      await reverseGeocode(point.lat, point.lng, GOOGLE_MAPS_API_KEY, citiesSet);
    }

    const cities = Array.from(citiesSet)
      .map((entry) => {
        const [cidade, estado] = entry.split("|");
        return { cidade, estado };
      })
      .filter((c) => c.estado && c.estado.length === 2);

    return responder(req, { cities });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("route-cities error:", message);
    return responder(req, { error: message }, 500);
  }
});

function extractCityState(address: string, set: Set<string>) {
  if (!address) return;
  const parts = address.split(",").map((p) => p.trim());
  
  // Try "City - State" format
  for (const part of parts) {
    const dashMatch = part.match(/^(.+?)\s*-\s*([A-Z]{2})$/);
    if (dashMatch) {
      const cidade = dashMatch[1].trim();
      const estado = dashMatch[2].trim();
      if (cidade.length > 2) {
        set.add(`${cidade}|${estado}`);
        return;
      }
    }
  }

  // Try comma-separated: "City, ST, Brasil"
  for (let i = 0; i < parts.length; i++) {
    if (/^[A-Z]{2}$/.test(parts[i]) && i > 0) {
      const estado = parts[i];
      const cidade = parts[i - 1];
      if (cidade && cidade.length > 2 && cidade !== "Brasil" && cidade !== "Brazil") {
        set.add(`${cidade}|${estado}`);
        return;
      }
    }
  }
}

async function reverseGeocode(
  lat: number,
  lng: number,
  apiKey: string,
  citiesSet: Set<string>
) {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=pt-BR&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.status !== "OK") {
      console.log(`Geocode failed for ${lat},${lng}: ${data.status} - ${data.error_message || ""}`);
      return;
    }
    
    if (data.results?.length) {
      const result = data.results[0]; // Use first (most specific) result
      const components = result.address_components || [];
      let cidade = "";
      let estado = "";
      for (const comp of components) {
        if (comp.types.includes("administrative_area_level_2")) {
          cidade = comp.long_name;
        }
        if (!cidade && comp.types.includes("locality")) {
          cidade = comp.long_name;
        }
        if (comp.types.includes("administrative_area_level_1")) {
          estado = normalizeState(comp.short_name || comp.long_name);
        }
      }
      if (cidade && estado && estado.length === 2) {
        citiesSet.add(`${cidade}|${estado}`);
      }
    }
  } catch (e) {
    console.log(`Geocode error for ${lat},${lng}:`, e);
  }
}

function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

/* Fim de route-cities */
